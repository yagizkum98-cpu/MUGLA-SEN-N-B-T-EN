'use client'

export const ageGroups = ['0-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'Belirsiz'] as const

export function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  const year = digits.slice(4, 8)
  return [day, month, year].filter(Boolean).join('/')
}

export function isoToBirthDateInput(value: string) {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : ''
}

export function birthDateInputToIso(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ''
  const [, day, month, year] = match
  const iso = `${year}-${month}-${day}`
  const date = new Date(`${iso}T00:00:00`)
  const today = new Date()
  const valid = date.getFullYear() === Number(year) && date.getMonth() + 1 === Number(month) && date.getDate() === Number(day)
  if (!valid || date > today || date.getFullYear() < 1900) return ''
  return iso
}

export function ageFromBirthDate(birthDate?: string) {
  if (!birthDate) return 0
  const date = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 0
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const birthdayPassed = today.getMonth() > date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate())
  if (!birthdayPassed) age -= 1
  return age > 0 && age < 130 ? age : 0
}

export function ageGroup(age: number) {
  if (!age) return 'Belirsiz'
  if (age < 18) return '0-17'
  if (age <= 24) return '18-24'
  if (age <= 34) return '25-34'
  if (age <= 44) return '35-44'
  if (age <= 54) return '45-54'
  if (age <= 64) return '55-64'
  return '65+'
}
