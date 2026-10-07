'use client'

export const PUBLIC_DOMAIN = 'muglabutcesenin.vercel.app'
export const CITIZEN_DOMAIN = 'muglabutcesenin-vatandas.vercel.app'
export const MUNICIPALITY_DOMAIN = 'muglabutcesenin-belediye.vercel.app'
export const SUPER_ADMIN_DOMAIN = 'muglabutcesenin-superadmin.vercel.app'
export const CRM_DOMAIN = 'muglabutcesenin-crm.vercel.app'
export const API_DOMAIN = 'api.muglabutcesenin.com'
const SHARED_APP_DOMAINS = ['muglaseninbutcen.vercel.app', 'mugla-senin-butcen.vercel.app']

function isSharedAppDomain() {
  return SHARED_APP_DOMAINS.includes(host())
}

function host() {
  return typeof location === 'undefined' ? '' : location.hostname
}

export function isLocalDomain() {
  const value = host()
  return value === 'localhost' || value === '127.0.0.1' || value === ''
}

export function isCitizenDomain() {
  return isLocalDomain() || isSharedAppDomain() || host() === CITIZEN_DOMAIN
}

export function isMunicipalityDomain() {
  return isLocalDomain() || isSharedAppDomain() || host() === MUNICIPALITY_DOMAIN
}

export function isSuperAdminDomain() {
  return host() === SUPER_ADMIN_DOMAIN
}

export function isCrmDomain() {
  return host() === CRM_DOMAIN
}

export function isAdminAuthorityDomain() {
  return isLocalDomain() || isSharedAppDomain() || host() === MUNICIPALITY_DOMAIN || host() === SUPER_ADMIN_DOMAIN || host() === CRM_DOMAIN
}

export function publicUrl(path = '/') {
  return isLocalDomain() || isSharedAppDomain() || host() === PUBLIC_DOMAIN ? path : `https://${PUBLIC_DOMAIN}${path}`
}

export function citizenUrl(path = '/') {
  if (isLocalDomain() || isSharedAppDomain()) return path === '/' ? '/giris?mode=login&next=/vatandas/panel' : path
  return `https://${CITIZEN_DOMAIN}${path}`
}

export function municipalityUrl(path = '/') {
  if (isLocalDomain() || isSharedAppDomain()) return path === '/' ? '/admin/giris' : path
  return `https://${MUNICIPALITY_DOMAIN}${path}`
}

export function superAdminUrl(path = '/') {
  if (isLocalDomain()) return path === '/' ? '/admin' : path
  return `https://${SUPER_ADMIN_DOMAIN}${path}`
}

export function crmUrl(path = '/') {
  if (isLocalDomain()) return path === '/' ? '/crm' : path
  return `https://${CRM_DOMAIN}${path}`
}

export function apiUrl(path = '/') {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')
  return base ? `${base}${path}` : path
}
