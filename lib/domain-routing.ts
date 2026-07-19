'use client'

export const PUBLIC_DOMAIN = 'muglaseninbutcen.vercel.app'
export const CITIZEN_DOMAIN = 'muglabutcesenin-vatandas.vercel.app'
export const MUNICIPALITY_DOMAIN = 'muglabutcesenin-belediye.vercel.app'

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

export function publicUrl(path = '/') {
  return `https://${PUBLIC_DOMAIN}${path}`
}

export function citizenUrl(path = '/') {
  return `https://${CITIZEN_DOMAIN}${path}`
}

export function municipalityUrl(path = '/') {
  return `https://${MUNICIPALITY_DOMAIN}${path}`
}

