'use client'

export const PUBLIC_DOMAIN = 'muglaseninbutcen.vercel.app'
export const CITIZEN_DOMAIN = 'muglabutcesenin-vatandas.vercel.app'
export const MUNICIPALITY_DOMAIN = 'muglabutcesenin-belediye.vercel.app'
export const SUPER_ADMIN_DOMAIN = 'muglabutcesenin-superadmin.vercel.app'
export const CRM_DOMAIN = 'muglabutcesenin-crm.vercel.app'
export const API_DOMAIN = 'api.muglaseninbutcen.com'

function host() {
  return typeof location === 'undefined' ? '' : location.hostname
}

export function isLocalDomain() {
  const value = host()
  return value === 'localhost' || value === '127.0.0.1' || value === ''
}

export function isCitizenDomain() {
  return isLocalDomain() || host() === CITIZEN_DOMAIN
}

export function isMunicipalityDomain() {
  return isLocalDomain() || host() === MUNICIPALITY_DOMAIN
}

export function isSuperAdminDomain() {
  return host() === SUPER_ADMIN_DOMAIN
}

export function isCrmDomain() {
  return host() === CRM_DOMAIN
}

export function isAdminAuthorityDomain() {
  return isLocalDomain() || host() === MUNICIPALITY_DOMAIN || host() === SUPER_ADMIN_DOMAIN || host() === CRM_DOMAIN
}

export function publicUrl(path = '/') {
  return `https://${PUBLIC_DOMAIN}${path}`
}

export function citizenUrl(path = '/') {
  return `https://${CITIZEN_DOMAIN}${path}`
}

export function municipalityUrl(path = '/') {
  return `https://${MUNICIPALITY_DOMAIN}${path}`
}

export function superAdminUrl(path = '/') {
  return `https://${SUPER_ADMIN_DOMAIN}${path}`
}

export function crmUrl(path = '/') {
  return `https://${CRM_DOMAIN}${path}`
}

export function apiUrl(path = '/') {
  return isLocalDomain() ? path : `https://${API_DOMAIN}${path}`
}
