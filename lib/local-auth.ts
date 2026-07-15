'use client'

export type VerificationMethod = 'phone' | 'email' | 'passport' | 'international-id'

export type LocalUser = {
  id: string
  name: string
  email: string
  phone: string
  nationality: 'tc' | 'foreign'
  country?: string
  province: string
  district: string
  passwordHash: string
  salt: string
  kvkkAcceptedAt: string
  createdAt: string
  verificationMethod: VerificationMethod
  verifiedAt: string
  verifiedBadge: string
  panelPath: string
  apiPath: string
  identityReference?: string
}

const USERS = 'mugla-auth-users-v1'
const SESSION = 'mugla-auth-session-v1'
export const AUTH_USERS_CHANGED_EVENT = 'mugla-auth-users-changed'

export function listLocalUsers(): LocalUser[] {
  try {
    const value = JSON.parse(localStorage.getItem(USERS) ?? '[]')
    return Array.isArray(value) ? value.map(user => ({
      ...user,
      verificationMethod: user.verificationMethod === 'phone' || user.verificationMethod === 'passport' || user.verificationMethod === 'international-id' ? user.verificationMethod : 'email',
      verifiedAt: user.verifiedAt ?? user.createdAt,
      verifiedBadge: user.verifiedBadge ?? 'Dogrulanmis Kullanici',
      nationality: user.nationality ?? 'tc',
      country: user.country,
      province: user.province ?? 'Mugla',
      district: user.district ?? 'Mentese',
      panelPath: user.panelPath ?? '/vatandas/panel',
      apiPath: user.apiPath ?? `/api/vatandas/${user.id}`,
    })) : []
  } catch {
    return []
  }
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

export async function registerUser(input: {
  name: string
  email: string
  phone: string
  nationality: 'tc' | 'foreign'
  country?: string
  province: string
  district: string
  password: string
  verificationMethod: VerificationMethod
  verificationCode: string
  verificationExpected: string
  identityReference?: string
  botAnswer: string
  botExpected: string
  website?: string
}) {
  const users = listLocalUsers()
  const email = input.email.trim().toLocaleLowerCase('tr')
  if (users.some(user => user.email === email)) throw new Error('Bu e-posta adresiyle daha once kayit olusturulmus.')
  if (input.website?.trim()) throw new Error('Bot kontrolu basarisiz.')
  if (input.botAnswer.trim() !== input.botExpected.trim()) throw new Error('Lutfen bot kontrolu sorusunu dogru yanitlayin.')
  if ((input.verificationMethod === 'phone' || input.verificationMethod === 'email') && input.verificationCode.trim() !== input.verificationExpected.trim()) throw new Error('Dogrulama kodu hatali.')
  if ((input.verificationMethod === 'passport' || input.verificationMethod === 'international-id') && String(input.identityReference ?? '').trim().length < 6) throw new Error('Kimlik/pasaport referansi en az 6 karakter olmalidir.')
  if (input.nationality === 'foreign' && !input.country?.trim()) throw new Error('Yabanci uyruklu katilimci icin ulke secimi zorunludur.')

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const passwordHash = await derive(input.password, salt)
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const user: LocalUser = {
    id,
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    nationality: input.nationality,
    country: input.nationality === 'foreign' ? input.country?.trim() : undefined,
    province: input.province.trim() || 'Mugla',
    district: input.district.trim() || 'Mentese',
    passwordHash,
    salt: bytesToBase64(salt),
    kvkkAcceptedAt: now,
    createdAt: now,
    verificationMethod: input.verificationMethod,
    verifiedAt: now,
    verifiedBadge: 'Dogrulanmis Kullanici',
    panelPath: '/vatandas/panel',
    apiPath: `/api/vatandas/${id}`,
    identityReference: input.identityReference?.trim(),
  }
  localStorage.setItem(USERS, JSON.stringify([...users, user]))
  window.dispatchEvent(new Event(AUTH_USERS_CHANGED_EVENT))
  return user
}

export async function loginUser(emailInput: string, password: string) {
  const email = emailInput.trim().toLocaleLowerCase('tr')
  const user = listLocalUsers().find(item => item.email === email)
  if (!user || !user.passwordHash || !user.salt || await derive(password, base64ToBytes(user.salt)) !== user.passwordHash) throw new Error('E-posta veya sifre hatali.')
  localStorage.setItem(SESSION, user.id)
  window.dispatchEvent(new Event(AUTH_USERS_CHANGED_EVENT))
  window.dispatchEvent(new Event('mugla-auth-session-changed'))
  return user
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const id = localStorage.getItem(SESSION)
  return listLocalUsers().find(user => user.id === id) ?? null
}

export function logoutUser() {
  localStorage.removeItem(SESSION)
  window.dispatchEvent(new Event('mugla-auth-session-changed'))
}
