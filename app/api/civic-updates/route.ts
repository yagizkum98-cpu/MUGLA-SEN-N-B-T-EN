import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

const TABLE = 'project_records'
const RECORDS_ID = 'admin-civic-updates'
const allowedOrigins = [
  'https://muglabutcesenin.vercel.app',
  'https://muglabutcesenin-vatandas.vercel.app',
  'https://muglabutcesenin-belediye.vercel.app',
  'https://muglabutcesenin-crm.vercel.app',
  'https://muglabutcesenin-superadmin.vercel.app',
  'https://api.muglabutcesenin.com',
]

type CivicNotification = {
  id: string
  title: string
  body: string
  district: string
  targetRole: string
  targetDepartment?: string
  category: string
  priority: 'Bilgi' | 'İşlem' | 'Uyarı' | 'Acil' | 'Kritik'
  channels: string[]
  status: 'Taslak' | 'Planlandı' | 'Gönderildi'
  source: 'Manuel' | 'Otomatik' | 'AI' | 'Sistem'
  publishAt: string
  createdAt: string
  updatedAt?: string
  createdBy?: string
}

type CivicEvent = {
  id: string
  title: string
  description: string
  district: string
  location: string
  startDate: string
  endDate?: string
  category: string
  status: 'Taslak' | 'Planlandı' | 'Yayında' | 'Tamamlandı'
  createdAt: string
  updatedAt?: string
  createdBy?: string
}

declare global {
  // eslint-disable-next-line no-var
  var muglaCivicUpdatesFallbackStore: {notifications: CivicNotification[]; events: CivicEvent[]} | undefined
}

function fallbackStore() {
  globalThis.muglaCivicUpdatesFallbackStore ??= {notifications: [], events: []}
  return globalThis.muglaCivicUpdatesFallbackStore
}

function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') ?? ''
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  }
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}})
}

function sortByDate<T extends {createdAt: string; updatedAt?: string; publishAt?: string; startDate?: string}>(records: T[]) {
  return [...records].sort((a, b) => String(b.publishAt ?? b.startDate ?? b.updatedAt ?? b.createdAt).localeCompare(String(a.publishAt ?? a.startDate ?? a.updatedAt ?? a.createdAt)))
}

function normalizeNotification(value: unknown): CivicNotification | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const id = String(record.id ?? '').trim()
  const title = String(record.title ?? '').trim()
  const body = String(record.body ?? '').trim()
  if (!id || !title || !body) return null
  const status = ['Taslak', 'Planlandı', 'Gönderildi'].includes(String(record.status)) ? String(record.status) as CivicNotification['status'] : 'Gönderildi'
  const priority = ['Bilgi', 'İşlem', 'Uyarı', 'Acil', 'Kritik'].includes(String(record.priority)) ? String(record.priority) as CivicNotification['priority'] : 'Bilgi'
  const source = ['Manuel', 'Otomatik', 'AI', 'Sistem'].includes(String(record.source)) ? String(record.source) as CivicNotification['source'] : 'Manuel'
  return {
    id,
    title,
    body,
    district: String(record.district ?? ''),
    targetRole: String(record.targetRole ?? 'Vatandaş'),
    targetDepartment: record.targetDepartment ? String(record.targetDepartment) : undefined,
    category: String(record.category ?? 'Duyuru'),
    priority,
    channels: Array.isArray(record.channels) ? record.channels.map(String).filter(Boolean) : ['Push'],
    status,
    source,
    publishAt: String(record.publishAt ?? record.createdAt ?? new Date().toISOString()),
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updatedAt ?? record.createdAt ?? new Date().toISOString()),
    createdBy: record.createdBy ? String(record.createdBy) : undefined,
  }
}

function normalizeEvent(value: unknown): CivicEvent | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const id = String(record.id ?? '').trim()
  const title = String(record.title ?? '').trim()
  const startDate = String(record.startDate ?? '').trim()
  if (!id || !title || !startDate) return null
  const status = ['Taslak', 'Planlandı', 'Yayında', 'Tamamlandı'].includes(String(record.status)) ? String(record.status) as CivicEvent['status'] : 'Yayında'
  return {
    id,
    title,
    description: String(record.description ?? ''),
    district: String(record.district ?? ''),
    location: String(record.location ?? ''),
    startDate,
    endDate: record.endDate ? String(record.endDate) : undefined,
    category: String(record.category ?? 'Etkinlik'),
    status,
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updatedAt ?? record.createdAt ?? new Date().toISOString()),
    createdBy: record.createdBy ? String(record.createdBy) : undefined,
  }
}

function mergeByNewest<T extends {id: string; createdAt: string; updatedAt?: string}>(records: T[]) {
  const map = new Map<string, T>()
  records.forEach(record => {
    const current = map.get(record.id)
    const recordTime = String(record.updatedAt ?? record.createdAt)
    const currentTime = String(current?.updatedAt ?? current?.createdAt ?? '')
    if (!current || recordTime.localeCompare(currentTime) >= 0) map.set(record.id, record)
  })
  return sortByDate(Array.from(map.values()))
}

async function readUpdates() {
  const supabase = supabaseAdmin()
  if (!supabase) return {...fallbackStore(), synced: false}
  const {data, error} = await supabase.from(TABLE).select('data').eq('id', RECORDS_ID).limit(1)
  if (error || !Array.isArray(data) || !data[0]) return {notifications: [], events: [], synced: true}
  const payload = data[0].data as {notifications?: unknown; events?: unknown}
  return {
    notifications: Array.isArray(payload?.notifications) ? payload.notifications.map(normalizeNotification).filter(Boolean) as CivicNotification[] : [],
    events: Array.isArray(payload?.events) ? payload.events.map(normalizeEvent).filter(Boolean) as CivicEvent[] : [],
    synced: true,
  }
}

async function writeUpdates(notifications: CivicNotification[], events: CivicEvent[]) {
  const payload = {
    notifications: mergeByNewest(notifications),
    events: mergeByNewest(events),
  }
  const supabase = supabaseAdmin()
  if (!supabase) {
    globalThis.muglaCivicUpdatesFallbackStore = payload
    return {...payload, synced: false}
  }
  const {error} = await supabase.from(TABLE).upsert({
    id: RECORDS_ID,
    data: {kind: 'admin-civic-updates', ...payload},
    updated_at: new Date().toISOString(),
  }, {onConflict: 'id'})
  if (error) throw error
  return {...payload, synced: true}
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {status: 204, headers: corsHeaders(request)})
}

export async function GET(request: Request) {
  try {
    return NextResponse.json(await readUpdates(), {headers: corsHeaders(request)})
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Canli bildirim ve etkinlik kayitlari okunamadi.'
    return NextResponse.json({error: message}, {status: 400, headers: corsHeaders(request)})
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const incomingNotifications = (Array.isArray(body?.notifications) ? body.notifications : [body?.notification]).map(normalizeNotification).filter(Boolean) as CivicNotification[]
    const incomingEvents = (Array.isArray(body?.events) ? body.events : [body?.event]).map(normalizeEvent).filter(Boolean) as CivicEvent[]
    if (!incomingNotifications.length && !incomingEvents.length) throw new Error('Kayit verisi gecersiz.')
    const current = await readUpdates()
    return NextResponse.json(await writeUpdates([...current.notifications, ...incomingNotifications], [...current.events, ...incomingEvents]), {headers: corsHeaders(request)})
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Canli bildirim ve etkinlik kaydi kaydedilemedi.'
    return NextResponse.json({error: message}, {status: 400, headers: corsHeaders(request)})
  }
}
