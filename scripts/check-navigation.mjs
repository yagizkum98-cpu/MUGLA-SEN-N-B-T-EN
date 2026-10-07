import assert from 'node:assert/strict'
import {projectIdFromSlug, projectPath, matchesProjectRoute, isSelectedProject} from '../lib/project-routes.ts'
import {publicNavigation, legalNavigation} from '../lib/site-navigation.ts'
import {publicUrl, citizenUrl, municipalityUrl} from '../lib/domain-routing.ts'
import nextConfig from '../next.config.mjs'

const project = {id: 'e23ce0c8-1a28-44ce-9269-cf1a10c13152', projectCode: 'MBS-2026-0001', title: 'Muğla İçin Yeşil Alan'}
const slug = projectPath(project).split('/').pop()
assert.equal(projectIdFromSlug(slug), project.id)
assert.ok(matchesProjectRoute(project, slug))
assert.ok(matchesProjectRoute(project, project.id))
assert.ok(matchesProjectRoute(project, project.projectCode))
assert.ok(!matchesProjectRoute(project, 'baska-proje'))
assert.ok(!isSelectedProject({moderationStatus: 'Onaylandı', status: 'Yılın Kazanan Adayı'}))
assert.ok(isSelectedProject({moderationStatus: 'Onaylandı', status: 'Devam Ediyor'}))
assert.ok(!isSelectedProject({moderationStatus: 'Bekliyor', status: 'Tamamlandı'}))
assert.equal(publicUrl('/'), '/')
assert.equal(citizenUrl('/'), '/giris?mode=login&next=/vatandas/panel')
assert.equal(municipalityUrl('/'), '/admin/giris')
globalThis.location = {hostname: 'muglabutcesenin.vercel.app'}
assert.equal(publicUrl('/projeler'), '/projeler')
assert.equal(citizenUrl('/giris'), 'https://muglabutcesenin-vatandas.vercel.app/giris')
globalThis.location = {hostname: 'muglabutcesenin-vatandas.vercel.app'}
assert.equal(publicUrl('/'), 'https://muglabutcesenin.vercel.app/')
delete globalThis.location
console.log('Proje kimlikleri, kazanan filtresi ve yerel alan adi kontrolleri gecti.')

const base = process.argv[2]
if (base) {
  const pages = [...new Set(['/', '/projeler', '/nasil-isler', '/sss', '/iletisim', '/oylama-kilavuzu', '/secilen-projeler', '/kitapcik', '/fikir-gonder', '/giris', ...legalNavigation.map(item => item.href)])]
  for (const path of pages) {
    const response = await fetch(new URL(path, base), {signal: AbortSignal.timeout(60000)})
    assert.equal(response.status, 200, `${path}: HTTP ${response.status}`)
    const html = await response.text()
    if (path !== '/giris') assert.ok(html.includes('Ana menü'), `${path}: ortak menu eksik`)
    console.log(`200 ${path}`)
  }
  const redirects = await nextConfig.redirects()
  for (const path of ['/home', '/oylamaya-katil', '/secilmis-projeler', '/proje-ekle', '/sikca-sorulan-sorular', '/sonuclar', '/projeler/detay/56052704']) {
    const response = await fetch(new URL(path, base), {redirect: 'manual', signal: AbortSignal.timeout(60000)})
    assert.equal(response.status, 307, `${path}: yonlendirme eksik`)
    const expected = path.startsWith('/projeler/detay/') ? '/projeler/56052704' : redirects.find(rule => rule.source === path).destination
    const actual = new URL(response.headers.get('location'), base)
    assert.equal(actual.pathname + actual.search + actual.hash, expected, `${path}: yanlis hedef`)
    console.log(`307 ${path} -> ${expected}`)
  }
  for (const item of publicNavigation) assert.ok(pages.includes(item.href) || item.href === '/oylamaya-katil', `Kontrol disi menu: ${item.href}`)
}
