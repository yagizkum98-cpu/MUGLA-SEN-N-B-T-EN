'use client'

export type AdminRole = 'super-admin' | 'admin' | 'yetkili'

export type AdminAccount = {
  id: string
  name: string
  email: string
  role: AdminRole
  passwordHash: string
  salt: string
  createdAt: string
  createdBy?: string
}

const ACCOUNTS_KEY = 'mugla-admin-accounts-v1'
const SESSION_KEY = 'mugla-admin-session-v1'
const CHANGE_EVENT = 'mugla-admin-auth-changed'

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

async function createAccount(input: {name: string; email: string; role: AdminRole; password: string; createdBy?: string}) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const passwordHash = await derive(input.password, salt)
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLocaleLowerCase('tr'),
    role: input.role,
    passwordHash,
    salt: bytesToBase64(salt),
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  }
}

async function ensureSeedAccount() {
  const accounts = readRawAccounts()
  if (accounts.length) return accounts
  const seed = await createAccount({
    name: 'Super Admin',
    email: 'superadmin@mugla.bel.tr',
    role: 'super-admin',
    password: 'SuperAdmin123',
  })
  saveAccounts([seed])
  return [seed]
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

export async function addAdminAccount(input: {name: string; email: string; role: AdminRole; password: string; actor: AdminAccount}) {
  if (input.actor.role === 'yetkili') throw new Error('Yetkili kullanici yeni admin hesabi tanimlayamaz.')
  if (input.actor.role === 'admin' && input.role === 'super-admin') throw new Error('Admin, super admin hesabi tanimlayamaz.')
  const accounts = await ensureSeedAccount()
  const email = input.email.trim().toLocaleLowerCase('tr')
  if (accounts.some(account => account.email === email)) throw new Error('Bu e-posta zaten tanimli.')
  if (input.password.length < 8) throw new Error('Sifre en az 8 karakter olmalidir.')
  const account = await createAccount({...input, email, createdBy: input.actor.email})
  saveAccounts([account, ...accounts])
  return account
}

export async function removeAdminAccount(id: string, actor: AdminAccount) {
  if (actor.role !== 'super-admin') throw new Error('Sadece super admin hesap silebilir.')
  if (id === actor.id) throw new Error('Kendi hesabini silemezsin.')
  const accounts = await ensureSeedAccount()
  const target = accounts.find(account => account.id === id)
  if (target?.role === 'super-admin') throw new Error('Super admin hesabi silinemez.')
  saveAccounts(accounts.filter(account => account.id !== id))
}

export function logoutAdmin() {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export const adminAuthChangeEvent = CHANGE_EVENT
export const initialSuperAdmin = {email: 'superadmin@mugla.bel.tr', password: 'SuperAdmin123'}
