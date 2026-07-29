import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

const TABLE = 'annual_theme_settings'
const FALLBACK_TABLE = 'project_records'
const FALLBACK_ID = 'annual-theme-settings'
const allowedOrigins = [
  'https://muglabutcesenin.vercel.app',
  'https://muglabutcesenin-vatandas.vercel.app',
  'https://muglabutcesenin-belediye.vercel.app',
  'https://muglabutcesenin-crm.vercel.app',
  'https://muglabutcesenin-superadmin.vercel.app',
  'https://api.muglabutcesenin.com',
]

type AnnualThemeSetting = {year: string; themes: string[]; updatedAt: string}

declare global {
  // eslint-disable-next-line no-var
  var muglaAnnualThemeFallbackStore: AnnualThemeSetting[] | undefined
}

function fallbackStore() {
  globalThis.muglaAnnualThemeFallbackStore ??= []
  return globalThis.muglaAnnualThemeFallbackStore
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

function normalizeSetting(value: unknown): AnnualThemeSetting | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const year = String(item.year ?? '').trim()
  if (!/^\d{4}$/.test(year)) return null
  const themes = Array.isArray(item.themes) ? item.themes.map(String).filter(Boolean) : []
  return {year, themes: themes.length ? themes : ['all'], updatedAt: String(item.updatedAt ?? item.updated_at ?? new Date().toISOString())}
}

function normalizeSettings(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(normalizeSetting).filter(Boolean) as AnnualThemeSetting[]
}

async function readFallbackSettings(supabase: ReturnType<typeof supabaseAdmin>) {
  if (!supabase) return fallbackStore()
  const {data, error} = await supabase.from(FALLBACK_TABLE).select('data').eq('id', FALLBACK_ID).limit(1)
  if (error || !Array.isArray(data) || !data[0]) return []
  const payload = data[0].data as {settings?: unknown}
  return normalizeSettings(payload?.settings)
}

async function writeFallbackSettings(supabase: ReturnType<typeof supabaseAdmin>, settings: AnnualThemeSetting[]) {
  if (!supabase) {
    globalThis.muglaAnnualThemeFallbackStore = settings
    return
  }
  await supabase.from(FALLBACK_TABLE).upsert({
    id: FALLBACK_ID,
    data: {kind: 'annual-theme-settings', settings},
    updated_at: new Date().toISOString(),
  }, {onConflict: 'id'})
}

function mergeSettings(settings: AnnualThemeSetting[]) {
  const map = new Map<string, AnnualThemeSetting>()
  settings.forEach(setting => {
    const current = map.get(setting.year)
    if (!current || setting.updatedAt.localeCompare(current.updatedAt) >= 0) map.set(setting.year, setting)
  })
  return Array.from(map.values()).sort((a, b) => a.year.localeCompare(b.year))
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {status: 204, headers: corsHeaders(request)})
}

export async function GET(request: Request) {
  try {
    const supabase = supabaseAdmin()
    if (!supabase) return NextResponse.json({settings: fallbackStore(), synced: false}, {headers: corsHeaders(request)})
    let tableSettings: AnnualThemeSetting[] = []
    try {
      const {data, error} = await supabase.from(TABLE).select('year,themes,updated_at').order('year', {ascending: true})
      if (!error && Array.isArray(data)) tableSettings = normalizeSettings(data)
    } catch {}
    const fallbackSettings = await readFallbackSettings(supabase)
    return NextResponse.json({settings: mergeSettings([...fallbackSettings, ...tableSettings]), synced: true}, {headers: corsHeaders(request)})
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Yillik tema ayarlari okunamadi.'
    return NextResponse.json({error: message}, {status: 400, headers: corsHeaders(request)})
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const setting = normalizeSetting(body?.setting)
    if (!setting) throw new Error('Yillik tema ayari gecersiz.')
    const supabase = supabaseAdmin()
    const current = supabase ? await readFallbackSettings(supabase) : fallbackStore()
    const settings = mergeSettings([...current.filter(item => item.year !== setting.year), setting])
    if (supabase) {
      try {
        await supabase.from(TABLE).upsert({
          year: setting.year,
          themes: setting.themes,
          updated_at: setting.updatedAt,
        }, {onConflict: 'year'})
      } catch {}
    }
    await writeFallbackSettings(supabase, settings)
    return NextResponse.json({setting, settings, synced: Boolean(supabase)}, {headers: corsHeaders(request)})
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Yillik tema ayari kaydedilemedi.'
    return NextResponse.json({error: message}, {status: 400, headers: corsHeaders(request)})
  }
}
