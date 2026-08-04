'use client'

import {apiUrl} from '@/lib/domain-routing'

export type AdminRole = 'super-admin' | 'belediye-admin' | 'ilce-yoneticisi' | 'degerlendirici' | 'crm' | 'admin' | 'yetkili'

export type AdminAccount = {
  id: string
  name: string
  email: string
  role: AdminRole
  district?: string
  department?: string
  assignedProjectIds?: string[]
  permissions?: {
    liveCitizenData?: boolean
    citizenDataExport?: boolean
  }
  passwordHash: string
  salt: string
  passwordPreview?: string
  createdAt: string
  createdBy?: string
}

const ACCOUNTS_KEY = 'mugla-admin-accounts-v1'
const SESSION_KEY = 'mugla-admin-session-v1'
const CHANGE_EVENT = 'mugla-admin-auth-changed'
const FALLBACK_SUPER_ADMIN_EMAIL = 'super.admin@mugla.bel.tr'
const FALLBACK_SUPER_ADMIN_PASSWORD = 'Superadmin4848!'

function adminAccountsApiUrl() {
  return apiUrl('/api/admin-accounts')
}

export function normalizeAdminRole(role?: AdminRole | string): Exclude<AdminRole, 'admin'> {
  if (role === 'super-admin' || role === 'ilce-yoneticisi' || role === 'degerlendirici' || role === 'crm' || role === 'yetkili') return role
  return 'belediye-admin'
}

function bytesToBase64(bytes: Uint8Array) {
  let value = ''
  bytes.forEach(byte => value += String.fromCharCode(byte))
  return btoa(value)
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0))
}

async function derive(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({name: 'PBKDF2', salt: new Uint8Array(salt).buffer, iterations: 120000, hash: 'SHA-256'}, material, 256)
  return bytesToBase64(new Uint8Array(bits))
}

function encodePasswordPreview(password: string) {
  return bytesToBase64(new TextEncoder().encode(password))
}

function decodePasswordPreview(value?: string) {
  if (!value) return null
  try {
    return new TextDecoder().decode(base64ToBytes(value))
  } catch {
    return null
  }
}

function readRawAccounts(): AdminAccount[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function saveAccounts(accounts: AdminAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function mergeAccounts(accounts: AdminAccount[]) {
  const map = new Map<string, AdminAccount>()
  accounts.forEach(account => {
    const key = account.email || account.id
    const current = map.get(key)
    if (!current || account.role === 'super-admin' || String(account.createdAt).localeCompare(String(current.createdAt)) >= 0) map.set(key, account)
  })
  return Array.from(map.values()).sort((a, b) => Number(b.role === 'super-admin') - Number(a.role === 'super-admin') || a.name.localeCompare(b.name, 'tr'))
}

async function readRemoteAccounts(): Promise<AdminAccount[]> {
  if (typeof window === 'undefined') return []
  try {
    const response = await fetch(adminAccountsApiUrl(), {cache: 'no-store'})
    const payload = await response.json().catch(() => null)
    if (response.ok && Array.isArray(payload?.accounts)) return payload.accounts as AdminAccount[]
  } catch {}
  return []
}

async function upsertRemoteAccounts(accounts: AdminAccount[]) {
  if (typeof window === 'undefined' || !accounts.length) return
  try {
    await fetch(adminAccountsApiUrl(), {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({accounts}),
    })
  } catch {}
}

async function deleteRemoteAccount(id: string) {
  if (typeof window === 'undefined') return
  try {
    await fetch(`${adminAccountsApiUrl()}?id=${encodeURIComponent(id)}`, {method: 'DELETE'})
  } catch {}
}

async function createAccount(input: {name: string; email: string; role: AdminRole; password: string; createdBy?: string; district?: string; department?: string; assignedProjectIds?: string[]; permissions?: AdminAccount['permissions']}) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const passwordHash = await derive(input.password, salt)
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLocaleLowerCase('tr'),
    role: input.role,
    district: input.district,
    department: input.department,
    assignedProjectIds: input.assignedProjectIds,
    permissions: input.permissions,
    passwordHash,
    salt: bytesToBase64(salt),
    passwordPreview: encodePasswordPreview(input.password),
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  }
}

async function ensureSeedAccount() {
  const accounts = mergeAccounts([...readRawAccounts(), ...await readRemoteAccounts()])
  const configuredSuperAdmin = accounts.find(account => account.role === 'super-admin' && account.email === FALLBACK_SUPER_ADMIN_EMAIL)
  if (configuredSuperAdmin) return accounts

  const seed = await createFallbackSeedAccount()
  if (accounts.length) {
    const updated = mergeAccounts([seed, ...accounts])
    saveAccounts(updated)
    void upsertRemoteAccounts([seed])
    return updated
  }
  saveAccounts([seed])
  void upsertRemoteAccounts([seed])
  return [seed]
}

function createFallbackSeedAccount() {
  return createAccount({
    name: 'Super Admin',
    email: FALLBACK_SUPER_ADMIN_EMAIL,
    role: 'super-admin',
    password: FALLBACK_SUPER_ADMIN_PASSWORD,
  })
}

export async function listAdminAccounts() {
  return ensureSeedAccount()
}

export async function loginAdmin(emailInput: string, password: string) {
  const email = emailInput.trim().toLocaleLowerCase('tr')
  const accounts = await ensureSeedAccount()
  const account = accounts.find(item => item.email === email)
  if (!account || await derive(password, base64ToBytes(account.salt)) !== account.passwordHash) throw new Error('E-posta veya sifre hatali.')
  localStorage.setItem(SESSION_KEY, account.id)
  window.dispatchEvent(new Event(CHANGE_EVENT))
  return account
}

export async function getCurrentAdmin() {
  if (typeof window === 'undefined') return null
  const id = localStorage.getItem(SESSION_KEY)
  if (!id) return null
  const accounts = await ensureSeedAccount()
  return accounts.find(account => account.id === id) ?? null
}

export async function addAdminAccount(input: {name: string; email: string; role: AdminRole; password: string; actor: AdminAccount; district?: string; department?: string; assignedProjectIds?: string[]; permissions?: AdminAccount['permissions']}) {
  if (normalizeAdminRole(input.actor.role) !== 'super-admin') throw new Error('Sadece super admin admin ve yetkili hesabi tanimlayabilir.')
  if (input.role === 'super-admin') throw new Error('Yeni super admin hesabi tanimlanamaz.')
  const accounts = await ensureSeedAccount()
  const email = input.email.trim().toLocaleLowerCase('tr')
  if (accounts.some(account => account.email === email)) throw new Error('Bu e-posta zaten tanimli.')
  if (input.password.length < 8) throw new Error('Sifre en az 8 karakter olmalidir.')
  const account = await createAccount({...input, email, createdBy: input.actor.email})
  const updated = mergeAccounts([account, ...accounts])
  saveAccounts(updated)
  void upsertRemoteAccounts([account])
  return account
}

export async function changeOwnAdminProfile(input: {actor: AdminAccount; currentPassword: string; email?: string; newPassword?: string}) {
  const nextEmail = input.email?.trim().toLocaleLowerCase('tr')
  const nextPassword = input.newPassword?.trim()
  if (nextPassword && nextPassword.length < 8) throw new Error('Yeni sifre en az 8 karakter olmalidir.')
  const accounts = await ensureSeedAccount()
  const account = accounts.find(item => item.id === input.actor.id)
  if (!account) throw new Error('Oturum bulunamadi.')
  if (await derive(input.currentPassword, base64ToBytes(account.salt)) !== account.passwordHash) throw new Error('Mevcut sifre hatali.')
  if (nextEmail && accounts.some(item => item.id !== account.id && item.email === nextEmail)) throw new Error('Bu e-posta baska bir yetkili hesabinda tanimli.')
  const salt = nextPassword ? crypto.getRandomValues(new Uint8Array(16)) : null
  const passwordHash = salt && nextPassword ? await derive(nextPassword, salt) : null
  const updated = accounts.map(item => item.id === account.id ? {
    ...item,
    email: nextEmail || item.email,
    ...(passwordHash && salt && nextPassword ? {
      passwordHash,
      salt: bytesToBase64(salt),
      passwordPreview: encodePasswordPreview(nextPassword),
    } : {}),
  } : item)
  saveAccounts(updated)
  void upsertRemoteAccounts(updated)
  return updated.find(item => item.id === account.id) ?? null
}

export async function changeOwnAdminPassword(input: {actor: AdminAccount; currentPassword: string; newPassword: string}) {
  return changeOwnAdminProfile(input)
}

export async function revealOwnAdminPassword(actor: AdminAccount) {
  const accounts = await ensureSeedAccount()
  const account = accounts.find(item => item.id === actor.id)
  return decodePasswordPreview(account?.passwordPreview)
}

export async function removeAdminAccount(id: string, actor: AdminAccount) {
  if (normalizeAdminRole(actor.role) !== 'super-admin') throw new Error('Sadece super admin hesap silebilir.')
  if (id === actor.id) throw new Error('Kendi hesabini silemezsin.')
  const accounts = await ensureSeedAccount()
  const target = accounts.find(account => account.id === id)
  if (target?.role === 'super-admin') throw new Error('Super admin hesabi silinemez.')
  saveAccounts(accounts.filter(account => account.id !== id))
  void deleteRemoteAccount(id)
}

export function logoutAdmin() {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export const adminAuthChangeEvent = CHANGE_EVENT
