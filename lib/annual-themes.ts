'use client'

import {projectCategories} from '@/lib/project-taxonomy'
import {createClient} from '@/lib/supabase/client'

export const annualThemeYears = ['2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035', '2036', '2037', '2038', '2039', '2040'] as const

export type AnnualThemeId = 'all' | 'afet' | 'cevre' | 'su-yonetimi' | 'altyapi' | 'saglik' | 'sifir-emisyon' | 'bisiklet' | 'mikro-mobilite' | 'tarim' | 'hayvancilik' | 'hayvan-haklari' | 'yesil-alan-yonetimi' | 'imar-sehircilik' | 'genclik' | 'sosyal-politikalar' | 'engelsiz-yasam' | 'ulasim' | 'kultur-sanat' | 'spor' | 'egitim' | 'kulturel-miras-turizm' | 'yapay-zeka-dijitallesme' | 'katilimci-yenilikci-yonetim'

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
  {id: 'altyapi', label: 'Altyapı', note: 'Yol, kanalizasyon, yağmur suyu, hat yenileme ve dayanıklı kent altyapısı fikirleri.', categories: ['Altyapı']},
  {id: 'saglik', label: 'Sağlık', note: 'Halk sağlığı, koruyucu hizmetler, sağlıklı yaşam ve bakım destekleri fikirleri.', categories: ['Sağlık']},
  {id: 'sifir-emisyon', label: 'Sıfır Emisyon', note: 'Temiz enerji, elektrikli ulaşım, karbon azaltımı ve iklim dostu hizmet fikirleri.', categories: ['Sıfır Emisyon']},
  {id: 'bisiklet', label: 'Bisiklet', note: 'Bisiklet yolları, park alanları, güvenli sürüş ve bisikletli ulaşım fikirleri.', categories: ['Bisiklet']},
  {id: 'mikro-mobilite', label: 'Mikro Mobilite', note: 'Scooter, paylaşımlı araçlar, kısa mesafe ulaşım ve mikro mobilite altyapısı fikirleri.', categories: ['Mikro Mobilite']},
  {id: 'tarim', label: 'Tarım', note: 'Tarımsal üretim, kooperatif, kırsal kalkınma ve yerel üretici desteği fikirleri.', categories: ['Tarım']},
  {id: 'hayvancilik', label: 'Hayvancılık', note: 'Büyükbaş ve küçükbaş hayvancılık, veterinerlik, üretim, yem, barınak ve yetiştirici desteği fikirleri.', categories: ['Hayvancılık']},
  {id: 'hayvan-haklari', label: 'Hayvan Hakları', note: 'Kedi, köpek ve sokak hayvanları için veterinerlik hizmetleri, barınak, beslenme, sahiplendirme ve hayvan refahı fikirleri.', categories: ['Hayvan Hakları']},
  {id: 'yesil-alan-yonetimi', label: 'Yeşil Alan Yönetimi', note: 'Park, bahçe, kent ormanı, peyzaj ve yeşil koridor fikirleri.', categories: ['Yeşil Alan Yönetimi']},
  {id: 'imar-sehircilik', label: 'İmar ve Şehircilik', note: 'İmar, şehircilik, kentsel tasarım ve mekansal planlama fikirleri.', categories: ['İmar ve Şehircilik']},
  {id: 'genclik', label: 'Gençlik', note: 'Gençlik, spor ve gençlik odaklı sosyal fikirler.', categories: ['Sosyal Yaşam', 'Spor']},
  {id: 'sosyal-politikalar', label: 'Sosyal politikalar', note: 'Kadın, çocuk, yaşlı, engelli, aile ve sosyal destek fikirleri.', categories: ['Sosyal Yaşam']},
  {id: 'engelsiz-yasam', label: 'Engelsiz Yaşam', note: 'Erişilebilir ulaşım, engelsiz kamusal alan, dijital erişilebilirlik ve kapsayıcı hizmet fikirleri.', categories: ['Engelsiz Yaşam']},
  {id: 'ulasim', label: 'Ulaşım', note: 'Ulaşım, trafik, yaya, bisiklet ve erişilebilirlik fikirleri.', categories: ['Ulaşım']},
  {id: 'spor', label: 'Spor', note: 'Spor tesisleri, etkinlikler ve açık spor alanları fikirleri.', categories: ['Spor']},
  {id: 'egitim', label: 'Eğitim', note: 'Okul, kütüphane, dijital öğrenme, mesleki eğitim ve yaşam boyu öğrenme fikirleri.', categories: ['Eğitim']},
  {id: 'kulturel-miras-turizm', label: 'Kültürel Miras ve Eşsiz Yaşam', note: 'Kültürel miras, tanıtım, rota, gastronomi ve ziyaretçi deneyimi fikirleri.', categories: ['Kültürel Miras ve Eşsiz Yaşam']},
  {id: 'yapay-zeka-dijitallesme', label: 'Yapay Zeka ve Dijitalleşme', note: 'Akıllı şehir, açık veri, dijital katılım ve yapay zeka fikirleri.', categories: ['Yapay Zeka ve Dijitalleşme']},
  {id: 'katilimci-yenilikci-yonetim', label: 'Katılımcı ve Yenilikçi Yönetim', note: 'Katılımcı bütçe, ortak akıl, şeffaflık ve yenilikçi hizmet fikirleri.', categories: ['Katılımcı ve Yenilikçi Yönetim']},
]

const STORAGE_KEY = 'mugla-annual-theme-settings-v1'
const REMOTE_TABLE = 'annual_theme_settings'
const FALLBACK_REMOTE_TABLE = 'project_records'
const FALLBACK_REMOTE_ID = 'annual-theme-settings'
const API_PATH = '/api/annual-themes'
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

function normalizeAnnualThemeSetting(value: Partial<AnnualThemeSetting> & {updated_at?: string}): AnnualThemeSetting | null {
  const year = String(value.year ?? '')
  if (!annualThemeYears.includes(year as typeof annualThemeYears[number])) return null
  const themes = Array.isArray(value.themes) ? value.themes.map(theme => normalizeThemeId(String(theme))).filter(Boolean) as AnnualThemeId[] : []
  return {year, themes: themes.length ? themes : ['all'], updatedAt: value.updatedAt ?? value.updated_at ?? new Date().toISOString()}
}

function mergeAnnualThemeSettings(local: AnnualThemeSetting[], remote: AnnualThemeSetting[]) {
  const map = new Map<string, AnnualThemeSetting>()
  ;[...local, ...remote].forEach(setting => {
    const current = map.get(setting.year)
    if (!current || String(setting.updatedAt).localeCompare(String(current.updatedAt)) >= 0) map.set(setting.year, setting)
  })
  return Array.from(map.values()).sort((a, b) => a.year.localeCompare(b.year))
}

function applyRemoteAnnualThemeSettings(local: AnnualThemeSetting[], remote: AnnualThemeSetting[]) {
  if (!remote.length) return local.sort((a, b) => a.year.localeCompare(b.year))
  const remoteYears = new Set(remote.map(setting => setting.year))
  return [...local.filter(setting => !remoteYears.has(setting.year)), ...remote].sort((a, b) => a.year.localeCompare(b.year))
}

function normalizeAnnualThemeSettingsPayload(value: unknown) {
  if (!value || typeof value !== 'object') return []
  const payload = value as {settings?: unknown}
  if (!Array.isArray(payload.settings)) return []
  return payload.settings.map(item => normalizeAnnualThemeSetting(item as Partial<AnnualThemeSetting> & {updated_at?: string})).filter(Boolean) as AnnualThemeSetting[]
}

async function readRemoteAnnualThemeSettings() {
  try {
    const response = await fetch(API_PATH, {cache: 'no-store'})
    const payload = await response.json().catch(() => null)
    if (response.ok && Array.isArray(payload?.settings)) return normalizeAnnualThemeSettingsPayload({settings: payload.settings})
  } catch {}
  const client = createClient()
  let primarySettings: AnnualThemeSetting[] = []
  try {
    const {data, error} = await client.from(REMOTE_TABLE).select('year,themes,updated_at')
    if (!error && Array.isArray(data)) {
      primarySettings = data.map(item => normalizeAnnualThemeSetting(item as Partial<AnnualThemeSetting> & {updated_at?: string})).filter(Boolean) as AnnualThemeSetting[]
    }
  } catch {}
  try {
    const {data, error} = await client.from(FALLBACK_REMOTE_TABLE).select('data,updated_at').eq('id', FALLBACK_REMOTE_ID).limit(1)
    if (error || !Array.isArray(data) || !data[0]) return primarySettings
    return mergeAnnualThemeSettings(primarySettings, normalizeAnnualThemeSettingsPayload(data[0].data))
  } catch {
    return primarySettings
  }
}

export async function syncAnnualThemeSettings() {
  if (typeof window === 'undefined') return []
  const remote = await readRemoteAnnualThemeSettings()
  const merged = applyRemoteAnnualThemeSettings(listAnnualThemeSettings(), remote)
  saveAnnualThemeSettings(merged)
  return merged
}

async function upsertRemoteAnnualThemeSetting(setting: AnnualThemeSetting) {
  if (typeof window === 'undefined') return
  const nextSettings = [...listAnnualThemeSettings().filter(item => item.year !== setting.year), setting].sort((a, b) => a.year.localeCompare(b.year))
  try {
    const response = await fetch(API_PATH, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({setting}),
    })
    if (response.ok) return
  } catch {}
  const client = createClient()
  try {
    await client.from(REMOTE_TABLE).upsert({
      year: setting.year,
      themes: setting.themes,
      updated_at: setting.updatedAt,
    }, {onConflict: 'year'})
  } catch {}
  try {
    await client.from(FALLBACK_REMOTE_TABLE).upsert({
      id: FALLBACK_REMOTE_ID,
      data: {kind: 'annual-theme-settings', settings: nextSettings},
      updated_at: setting.updatedAt,
    }, {onConflict: 'id'})
  } catch {}
}

export function upsertAnnualThemeSetting(year: string, themes: AnnualThemeId[]) {
  const cleanThemes = Array.from(new Set(themes)).filter(theme => annualThemeOptions.some(option => option.id === theme))
  const nextThemes = cleanThemes.length ? cleanThemes : ['all' as AnnualThemeId]
  const settings = listAnnualThemeSettings()
  const next = {year, themes: nextThemes.includes('all') ? ['all' as AnnualThemeId] : nextThemes, updatedAt: new Date().toISOString()}
  saveAnnualThemeSettings([...settings.filter(item => item.year !== year), next].sort((a, b) => a.year.localeCompare(b.year)))
  void upsertRemoteAnnualThemeSetting(next)
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
  return allowedCategoriesForSetting(setting)
}

export function allowedCategoriesForSetting(setting: AnnualThemeSetting) {
  if (!setting.themes.length || setting.themes.includes('all')) return projectCategories
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
  return annualThemeLabelsForSetting(setting)
}

export function annualThemeLabelsForSetting(setting: AnnualThemeSetting) {
  if (!setting.themes.length || setting.themes.includes('all')) return ['Tum temalar']
  return setting.themes.map(theme => annualThemeOptions.find(option => option.id === theme)?.label ?? theme)
}

export function allowedSubcategoriesForYear(year: string, category: string) {
  return allowedCategoriesForYear(year).some(([name]) => name === category) ? ['Genel'] : []
}

export function isProjectThemeAllowed(year: string, category: string, subcategory: string) {
  return allowedCategoriesForYear(year).some(([name]) => name === category)
}

