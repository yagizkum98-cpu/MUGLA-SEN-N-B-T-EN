import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

const TABLE = 'project_records'
const VOTING_RECORDS_ID = 'admin-voting-records'
const allowedOrigins = [
  'https://muglaseninbutcen.vercel.app',
  'https://muglabutcesenin-vatandas.vercel.app',
  'https://muglabutcesenin-belediye.vercel.app',
  'https://muglabutcesenin-crm.vercel.app',
  'https://muglabutcesenin-superadmin.vercel.app',
  'https://api.muglaseninbutcen.com',
]

type VotingRecord = {
  id: string
  name: string
  year?: string
  description: string
  startDate: string
  endDate: string
  districts: string[]
  projectIds: string[]
  votesPerPerson: 1 | 3 | 5
  rules: string[]
  status: 'Taslak' | 'Planlandı' | 'Aktif' | 'Tamamlandı' | 'Sonuçlandı' | 'Arşiv'
  createdAt: string
  updatedAt?: string
}

declare global {
  // eslint-disable-next-line no-var
  var muglaVotingRecordsFallbackStore: VotingRecord[] | undefined
}

function fallbackStore() {
  globalThis.muglaVotingRecordsFallbackStore ??= []
  return globalThis.muglaVotingRecordsFallbackStore
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

function normalizeVotingRecord(value: unknown): VotingRecord | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const id = String(record.id ?? '').trim()
  const name = String(record.name ?? '').trim()
  if (!id || !name) return null
  const votesPerPerson = Number(record.votesPerPerson)
  return {
    id,
    name,
    year: record.year ? String(record.year) : undefined,
    description: String(record.description ?? ''),
    startDate: String(record.startDate ?? ''),
    endDate: String(record.endDate ?? ''),
    districts: Array.isArray(record.districts) ? record.districts.map(String).filter(Boolean) : [],
    projectIds: Array.isArray(record.projectIds) ? record.projectIds.map(String).filter(Boolean) : [],
    votesPerPerson: votesPerPerson === 1 || votesPerPerson === 3 || votesPerPerson === 5 ? votesPerPerson : 5,
    rules: Array.isArray(record.rules) ? record.rules.map(String).filter(Boolean) : [],
    status: ['Taslak', 'Planlandı', 'Aktif', 'Tamamlandı', 'Sonuçlandı', 'Arşiv'].includes(String(record.status)) ? String(record.status) as VotingRecord['status'] : 'Taslak',
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updatedAt ?? new Date().toISOString()),
  }
}

function normalizeVotingRecords(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(normalizeVotingRecord).filter(Boolean) as VotingRecord[]
}

function mergeVotingRecords(records: VotingRecord[]) {
  const map = new Map<string, VotingRecord>()
  records.forEach(record => {
    const current = map.get(record.id)
    const recordTime = String(record.updatedAt ?? record.createdAt)
    const currentTime = String(current?.updatedAt ?? current?.createdAt ?? '')
    if (!current || recordTime.localeCompare(currentTime) >= 0) map.set(record.id, record)
  })
  return Array.from(map.values()).sort((a, b) => String(b.updatedAt ?? b.createdAt).localeCompare(String(a.updatedAt ?? a.createdAt)))
}

async function readVotingRecords() {
  const supabase = supabaseAdmin()
  if (!supabase) return {records: fallbackStore(), synced: false}
  const {data, error} = await supabase.from(TABLE).select('data').eq('id', VOTING_RECORDS_ID).limit(1)
  if (error || !Array.isArray(data) || !data[0]) return {records: [], synced: true}
  const payload = data[0].data as {records?: unknown}
  return {records: normalizeVotingRecords(payload?.records), synced: true}
}

async function writeVotingRecords(records: VotingRecord[]) {
  const merged = mergeVotingRecords(records)
  const supabase = supabaseAdmin()
  if (!supabase) {
    globalThis.muglaVotingRecordsFallbackStore = merged
    return {records: merged, synced: false}
  }
  const {error} = await supabase.from(TABLE).upsert({
    id: VOTING_RECORDS_ID,
    data: {kind: 'admin-voting-records', records: merged},
    updated_at: new Date().toISOString(),
  }, {onConflict: 'id'})
  if (error) throw error
  return {records: merged, synced: true}
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {status: 204, headers: corsHeaders(request)})
}

export async function GET(request: Request) {
  try {
    return NextResponse.json(await readVotingRecords(), {headers: corsHeaders(request)})
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Oylama kayitlari okunamadi.'
    return NextResponse.json({error: message}, {status: 400, headers: corsHeaders(request)})
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const incoming = normalizeVotingRecords(Array.isArray(body?.records) ? body.records : [body?.record])
    if (!incoming.length) throw new Error('Oylama kaydi gecersiz.')
    const current = await readVotingRecords()
    return NextResponse.json(await writeVotingRecords([...current.records, ...incoming]), {headers: corsHeaders(request)})
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Oylama kaydi kaydedilemedi.'
    return NextResponse.json({error: message}, {status: 400, headers: corsHeaders(request)})
  }
}
