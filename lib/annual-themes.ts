'use client'

import {projectCategories} from '@/lib/project-taxonomy'

export const annualThemeYears = ['2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035', '2036', '2037', '2038', '2039', '2040'] as const

export type AnnualThemeId = 'all' | 'afet' | 'cevre' | 'su-yonetimi' | 'tarim' | 'hayvan-haklari' | 'yesil-alan-yonetimi' | 'imar-sehircilik' | 'genclik' | 'sosyal-politikalar' | 'ulasim' | 'kultur-sanat' | 'spor' | 'egitim' | 'kulturel-miras-turizm' | 'yapay-zeka-dijitallesme' | 'katilimci-yenilikci-yonetim'

export type AnnualThemeSetting = {
  year: string
  themes: AnnualThemeId[]
  updatedAt: string
}

export const annualThemeOptions: {id: AnnualThemeId; label: string; note: string; categories?: string[]}[] = [
  {id: 'all', label: 'Tüm temalar', note: 'Vatandaşlar o yıl tüm kategorilerden fikir gönderebilir.'},
  {id: 'afet', label: 'Afet ve Risk Yönetimi', note: 'Afet hazırlığı, risk azaltma ve kriz koordinasyonu fikirleri.', categories: ['Afet ve Risk Yönetimi']},
  {id: 'cevre', label: 'Çevre ve İklim Değişikliği', note: 'İklim, çevre, atık, enerji, su ve yeşil alan fikirleri.', categories: ['Çevre ve İklim Değişikliği']},
  {id: 'su-yonetimi', label: 'Su Yönetimi', note: 'İçme suyu, yağmur suyu, atık su, tasarruf ve taşkın yönetimi fikirleri.', categories: ['Su Yönetimi']},
  {id: 'tarim', label: 'Tarım', note: 'Tarımsal üretim, kooperatif, kırsal kalkınma ve yerel üretici desteği fikirleri.', categories: ['Tarım']},
  {id: 'hayvan-haklari', label: 'Hayvan Hakları', note: 'Sokak hayvanları, barınak, veteriner hizmetleri ve hayvan refahı fikirleri.', categories: ['Hayvan Hakları']},
  {id: 'yesil-alan-yonetimi', label: 'Yeşil Alan Yönetimi', note: 'Park, bahçe, kent ormanı, peyzaj ve yeşil koridor fikirleri.', categories: ['Yeşil Alan Yönetimi']},
  {id: 'imar-sehircilik', label: 'İmar ve Şehircilik', note: 'İmar, şehircilik, kentsel tasarım ve mekansal planlama fikirleri.', categories: ['İmar ve Şehircilik']},
  {id: 'genclik', label: 'Gençlik', note: 'Gençlik, spor ve gençlik odaklı sosyal fikirler.', categories: ['Sosyal Yaşam', 'Spor']},
  {id: 'sosyal-politikalar', label: 'Sosyal politikalar', note: 'Kadın, çocuk, yaşlı, engelli, aile ve sosyal destek fikirleri.', categories: ['Sosyal Yaşam']},
  {id: 'ulasim', label: 'Ulaşım', note: 'Ulaşım, trafik, yaya, bisiklet ve erişilebilirlik fikirleri.', categories: ['Ulaşım']},
  {id: 'spor', label: 'Spor', note: 'Spor tesisleri, etkinlikler ve açık spor alanları fikirleri.', categories: ['Spor']},
  {id: 'egitim', label: 'Eğitim', note: 'Okul, kütüphane, dijital öğrenme, mesleki eğitim ve yaşam boyu öğrenme fikirleri.', categories: ['Eğitim']},
  {id: 'kulturel-miras-turizm', label: 'Kültürel Miras ve Eşsiz Yaşam', note: 'Kültürel miras, tanıtım, rota, gastronomi ve ziyaretçi deneyimi fikirleri.', categories: ['Kültürel Miras ve Eşsiz Yaşam']},
  {id: 'yapay-zeka-dijitallesme', label: 'Yapay Zeka ve Dijitalleşme', note: 'Akıllı şehir, açık veri, dijital katılım ve yapay zeka fikirleri.', categories: ['Yapay Zeka ve Dijitalleşme']},
  {id: 'katilimci-yenilikci-yonetim', label: 'Katılımcı ve Yenilikçi Yönetim', note: 'Katılımcı bütçe, ortak akıl, şeffaflık ve yenilikçi hizmet fikirleri.', categories: ['Katılımcı ve Yenilikçi Yönetim']},
]

const STORAGE_KEY = 'mugla-annual-theme-settings-v1'
export const annualThemeChangeEvent = 'mugla-annual-themes-changed'

function normalizeThemeId(value: string): AnnualThemeId | null {
  if (value === 'turizm' || value === 'kultur-sanat' || value === 'kulturel-miras-essiz-yasam') return 'kulturel-miras-turizm'
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
  })
  return projectCategories.filter(([category]) => allowed.has(category))
}

export function allowedCategoryNamesForYear(year: string) {
  return allowedCategoriesForYear(year).map(item => item[0])
}

export function annualThemeLabelsForYear(year: string) {
  const setting = getAnnualThemeSetting(year)
  if (!setting.themes.length || setting.themes.includes('all')) return ['Tum temalar']
  return setting.themes.map(theme => annualThemeOptions.find(option => option.id === theme)?.label ?? theme)
}

export function allowedSubcategoriesForYear(year: string, category: string) {
  return allowedCategoriesForYear(year).some(([name]) => name === category) ? ['Genel'] : []
}

export function isProjectThemeAllowed(year: string, category: string, subcategory: string) {
  return allowedCategoriesForYear(year).some(([name]) => name === category)
}

