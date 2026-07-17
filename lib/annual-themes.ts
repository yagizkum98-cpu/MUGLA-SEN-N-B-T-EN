'use client'

import {projectCategories, subcategoriesFor} from '@/lib/project-taxonomy'

export const annualThemeYears = ['2026', '2027', '2028', '2029', '2030', '2031', '2032'] as const

export type AnnualThemeId = 'all' | 'afet' | 'cevre' | 'genclik' | 'sosyal-politikalar' | 'ulasim' | 'egitim' | 'kultur-sanat' | 'spor' | 'turizm'

export type AnnualThemeSetting = {
  year: string
  themes: AnnualThemeId[]
  updatedAt: string
}

export const annualThemeOptions: {id: AnnualThemeId; label: string; note: string; categories?: string[]; subcategories?: Record<string, string[]>}[] = [
  {id: 'all', label: 'Tüm temalar', note: 'Vatandaşlar o yıl tüm kategori ve alt kategorilerden fikir gönderebilir.'},
  {id: 'afet', label: 'Afet', note: 'Afet, acil durum ve afet yönetimi fikirleri.', subcategories: {'Sosyal Yaşam': ['Afet ve Acil Durum'], 'Diğer': ['Afet Yönetimi']}},
  {id: 'cevre', label: 'Çevre', note: 'İklim, çevre, atık, enerji, su ve yeşil alan fikirleri.', categories: ['İklim ve Çevre']},
  {id: 'genclik', label: 'Gençlik', note: 'Gençlik, eğitim, spor ve gençlik odaklı sosyal fikirler.', subcategories: {'Sosyal Yaşam': ['Gençlik'], 'Eğitim': ['Gençlik Akademileri'], 'Spor': ['Gençlik Sporları', 'E-Spor']}},
  {id: 'sosyal-politikalar', label: 'Sosyal politikalar', note: 'Kadın, çocuk, yaşlı, engelli, aile ve sosyal destek fikirleri.', subcategories: {'Sosyal Yaşam': ['Kadın Hizmetleri', 'Çocuk Hizmetleri', 'Yaşlı Destek Hizmetleri', 'Engelli Hizmetleri', 'Aile Destek Programları', 'Sosyal Yardımlar', 'Halk Sağlığı', 'Psikolojik Destek', 'Gıda Destekleri', 'Toplum Merkezleri']}},
  {id: 'ulasim', label: 'Ulaşım', note: 'Ulaşım, trafik, yaya, bisiklet ve erişilebilirlik fikirleri.', categories: ['Ulaşım']},
  {id: 'egitim', label: 'Eğitim', note: 'Eğitim, kütüphane, meslek, teknoloji ve akademi fikirleri.', categories: ['Eğitim']},
  {id: 'kultur-sanat', label: 'Kültür ve sanat', note: 'Kültür, sanat, festival, rota ve yerel miras fikirleri.', categories: ['Kültür ve Sanat']},
  {id: 'spor', label: 'Spor', note: 'Spor tesisleri, etkinlikler ve açık spor alanları fikirleri.', categories: ['Spor']},
  {id: 'turizm', label: 'Turizm', note: 'Turizm, tanıtım, rota, gastronomi ve ziyaretçi deneyimi fikirleri.', categories: ['Turizm']},
]

const STORAGE_KEY = 'mugla-annual-theme-settings-v1'
export const annualThemeChangeEvent = 'mugla-annual-themes-changed'

function normalizeThemeId(value: string): AnnualThemeId | null {
  return annualThemeOptions.some(theme => theme.id === value) ? value as AnnualThemeId : null
}

export function listAnnualThemeSettings(): AnnualThemeSetting[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(value)) return []
    return value.map(item => ({
      year: String(item.year),
      themes: Array.isArray(item.themes) ? item.themes.map((theme: string) => normalizeThemeId(theme)).filter(Boolean) : [],
      updatedAt: item.updatedAt ?? new Date().toISOString(),
    })).filter(item => annualThemeYears.includes(item.year as typeof annualThemeYears[number]))
  } catch {
    return []
  }
}

function saveAnnualThemeSettings(settings: AnnualThemeSetting[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new Event(annualThemeChangeEvent))
}

export function upsertAnnualThemeSetting(year: string, themes: AnnualThemeId[]) {
  const cleanThemes = Array.from(new Set(themes)).filter(theme => annualThemeOptions.some(option => option.id === theme))
  const nextThemes = cleanThemes.length ? cleanThemes : ['all' as AnnualThemeId]
  const settings = listAnnualThemeSettings()
  const next = {year, themes: nextThemes.includes('all') ? ['all' as AnnualThemeId] : nextThemes, updatedAt: new Date().toISOString()}
  saveAnnualThemeSettings([...settings.filter(item => item.year !== year), next].sort((a, b) => a.year.localeCompare(b.year)))
  return next
}

export function getAnnualThemeSetting(year: string) {
  return listAnnualThemeSettings().find(item => item.year === year) ?? {year, themes: ['all' as AnnualThemeId], updatedAt: ''}
}

export function isAllThemesOpen(year: string) {
  const setting = getAnnualThemeSetting(year)
  return !setting.themes.length || setting.themes.includes('all')
}

export function allowedCategoriesForYear(year: string) {
  if (isAllThemesOpen(year)) return projectCategories
  const setting = getAnnualThemeSetting(year)
  const allowed = new Set<string>()
  setting.themes.forEach(themeId => {
    const theme = annualThemeOptions.find(option => option.id === themeId)
    theme?.categories?.forEach(category => allowed.add(category))
    Object.keys(theme?.subcategories ?? {}).forEach(category => allowed.add(category))
  })
  return projectCategories.filter(([category]) => allowed.has(category))
}

export function allowedSubcategoriesForYear(year: string, category: string) {
  if (isAllThemesOpen(year)) return subcategoriesFor(category)
  const setting = getAnnualThemeSetting(year)
  const allowAll = setting.themes.some(themeId => annualThemeOptions.find(option => option.id === themeId)?.categories?.includes(category))
  if (allowAll) return subcategoriesFor(category)
  const allowed = new Set<string>()
  setting.themes.forEach(themeId => {
    annualThemeOptions.find(option => option.id === themeId)?.subcategories?.[category]?.forEach(subcategory => allowed.add(subcategory))
  })
  return subcategoriesFor(category).filter(subcategory => allowed.has(subcategory))
}

export function isProjectThemeAllowed(year: string, category: string, subcategory: string) {
  return allowedCategoriesForYear(year).some(([name]) => name === category) && allowedSubcategoriesForYear(year, category).includes(subcategory)
}
