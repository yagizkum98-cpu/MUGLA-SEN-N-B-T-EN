import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'
import {pbkdf2Sync, randomBytes} from 'crypto'

const TABLE = 'project_records'
const ADMIN_ACCOUNTS_ID = 'admin-accounts'
const allowedOrigins = [
  'https://muglaseninbutcen.vercel.app',
  'https://muglabutcesenin-vatandas.vercel.app',
  'https://muglabutcesenin-belediye.vercel.app',
  'https://muglabutcesenin-crm.vercel.app',
  'https://muglabutcesenin-superadmin.vercel.app',
  'https://api.muglaseninbutcen.com',
]

type StoredAdminAccount = Record<string, unknown> & {
  id: string
  name: string
  email: string
  role: string
  passwordHash: string
  salt: string
  createdAt: string
}

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD

declare global {
  // eslint-disable-next-line no-var
  var muglaAdminAccountsFallbackStore: StoredAdminAccount[] | undefined
}

function fallbackStore() {
  globalThis.muglaAdminAccountsFallbackStore ??= []
  return globalThis.muglaAdminAccountsFallbackStore
}

function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') ?? ''
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
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

function normalizeAccount(value: unknown): StoredAdminAccount | null {
  if (!value || typeof value !== 'object') return null
  const account = value as Record<string, unknown>
  const id = String(account.id ?? '').trim()
  const email = String(account.email ?? '').trim().toLocaleLowerCase('tr')
  const role = String(account.role ?? '').trim()
  const passwordHash = String(account.passwordHash ?? '').trim()
  const salt = String(account.salt ?? '').trim()
  if (!id || !email || !role || !passwordHash || !salt) return null
  return {
    ...account,
    id,
    name: String(account.name ?? email).trim(),
    email,
    role,
    passwordHash,
    salt,
    createdAt: String(account.createdAt ?? new Date().toISOString()),
  }
}

function normalizeAccounts(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(normalizeAccount).filter(Boolean) as StoredAdminAccount[]
}

function mergeAccounts(accounts: StoredAdminAccount[]) {
  const map = new Map<string, StoredAdminAccount>()
  accounts.forEach(account => {
    const key = account.email || account.id
    const current = map.get(key)
    if (!current || String(account.createdAt).localeCompare(String(current.createdAt)) >= 0 || account.role === 'super-admin') map.set(key, account)
  })
  return Array.from(map.values()).sort((a, b) => String(a.role === 'super-admin' ? '0' : a.name).localeCompare(String(b.role === 'super-admin' ? '0' : b.name), 'tr'))
}

function bytesToBase64(bytes: Uint8Array | Buffer) {
  return Buffer.from(bytes).toString('base64')
}

function createEnvSuperAdmin(): StoredAdminAccount | null {
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) return null
  const salt = randomBytes(16)
  const passwordHash = pbkdf2Sync(SUPER_ADMIN_PASSWORD, salt, 120000, 32, 'sha256')
  return {
    id: 'env-super-admin',
    name: 'Super Admin',
    email: SUPER_ADMIN_EMAIL.trim().toLocaleLowerCase('tr'),
    role: 'super-admin',
    passwordHash: bytesToBase64(passwordHash),
    salt: bytesToBase64(salt),
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'environment',
  }
}

async function readAccounts() {
  const envSuperAdmin = createEnvSuperAdmin()
  const supabase = supabaseAdmin()
  if (!supabase) return {accounts: mergeAccounts([...(envSuperAdmin ? [envSuperAdmin] : []), ...fallbackStore()]), synced: false}
  const {data, error} = await supabase.from(TABLE).select('data').eq('id', ADMIN_ACCOUNTS_ID).limit(1)
  if (error || !Array.isArray(data) || !data[0]) return {accounts: envSuperAdmin ? [envSuperAdmin] : [], synced: true}
  const payload = data[0].data as {accounts?: unknown}
  return {accounts: mergeAccounts([...(envSuperAdmin ? [envSuperAdmin] : []), ...normalizeAccounts(payload?.accounts)]), synced: true}
}

async function writeAccounts(accounts: StoredAdminAccount[]) {
  const merged = mergeAccounts(accounts)
  const supabase = supabaseAdmin()
  if (!supabase) {
    globalThis.muglaAdminAccountsFallbackStore = merged
    return {accounts: merged, synced: false}
  }
  const {error} = await supabase.from(TABLE).upsert({
    id: ADMIN_ACCOUNTS_ID,
    data: {kind: 'admin-accounts', accounts: merged},
    updated_at: new Date().toISOString(),
  }, {onConflict: 'id'})
  if (error) throw error
  return {accounts: merged, synced: true}
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {status: 204, headers: corsHeaders(request)})
}

export async function GET(request: Request) {
  try {
    const result = await readAccounts()
    return NextResponse.json(result, {headers: corsHeaders(request)})
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Yetkili hesaplari okunamadi.'
    return NextResponse.json({error: message}, {status: 400, headers: corsHeaders(request)})
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const incoming = normalizeAccounts(Array.isArray(body?.accounts) ? body.accounts : [body?.account])
    if (!incoming.length) throw new Error('Yetkili hesap verisi gecersiz.')
    const current = await readAccounts()
    const result = await writeAccounts([...current.accounts, ...incoming])
    return NextResponse.json(result, {headers: corsHeaders(request)})
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Yetkili hesaplari kaydedilemedi.'
    return NextResponse.json({error: message}, {status: 400, headers: corsHeaders(request)})
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) throw new Error('Yetkili hesap id zorunlu.')
    const current = await readAccounts()
    const result = await writeAccounts(current.accounts.filter(account => account.role === 'super-admin' || account.id !== id))
    return NextResponse.json(result, {headers: corsHeaders(request)})
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Yetkili hesabi silinemedi.'
    return NextResponse.json({error: message}, {status: 400, headers: corsHeaders(request)})
  }
}
