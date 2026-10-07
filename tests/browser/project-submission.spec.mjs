import {test, expect} from '@playwright/test'
import {randomUUID} from 'node:crypto'

function citizen() {
  const id = randomUUID()
  return {id, email: `${id}@example.test`, name: 'Test Vatandas', phone: '5550000000', nationality: 'tc',
    province: 'Muğla', district: 'Menteşe', passwordHash: 'test', salt: 'test',
    createdAt: '2026-10-07T00:00:00Z', verifiedAt: '2026-10-07T00:00:00Z'}
}
async function citizenContext(browser, user, cachedProjects = []) {
  const context = await browser.newContext()
  await context.addInitScript(({user, cachedProjects}) => {
    if (sessionStorage.getItem('test-initialized')) return
    localStorage.setItem('mugla-auth-users-v1', JSON.stringify([user]))
    localStorage.setItem('mugla-auth-session-v1', user.id)
    if (cachedProjects.length) localStorage.setItem('mugla-butce-senin-projects-v1', JSON.stringify(cachedProjects))
    sessionStorage.setItem('test-initialized', '1')
  }, {user, cachedProjects})
  return context
}
async function fillForm(page, title) {
  await page.goto('/fikir-gonder')
  await page.locator('[name=title]').fill(title)
  await page.locator('[name=district]').selectOption('Menteşe')
  for (const name of ['summary', 'purpose', 'activities', 'expectedResults']) await page.locator(`[name=${name}]`).fill('Afet hazirligi icin ortak calisma ve egitim.')
  await page.locator('[name=rightsAccepted]').check()
  await expect(page.getByRole('button', {name: /Fikrimi gonder/})).toBeEnabled()
}
function applicationCounter(page) {
  return page.locator('#panelim').getByText('Başvurularım', {exact: true}).locator('..').locator('b')
}

test('citizen submission increments its counter and appears in an independent municipality session', async ({browser}) => {
  const user = citizen()
  const citizenSession = await citizenContext(browser, user)
  const citizenPage = await citizenSession.newPage()
  const adminSession = await browser.newContext()
  const admin = {id: randomUUID(), name: 'Test Belediye', email: 'admin@example.test', role: 'belediye-admin', passwordHash: 'test', salt: 'test', createdAt: '2026-10-07'}
  await adminSession.addInitScript(admin => {
    localStorage.setItem('mugla-admin-accounts-v1', JSON.stringify([admin]))
    localStorage.setItem('mugla-admin-session-v1', admin.id)
  }, admin)
  const adminPage = await adminSession.newPage()
  await adminPage.goto('/admin')
  const center = adminPage.locator('#projeler')
  await expect(center.getByRole('heading', {name: 'Proje merkezi'})).toBeVisible()
  await expect(center.getByRole('button', {name: /^Onay Bekleyen/}).locator('span')).toHaveText('0')
  await citizenPage.goto('/vatandas/panel')
  await expect(applicationCounter(citizenPage)).toHaveText('0')
  const title = `Vatandas fikri ${randomUUID().slice(0, 8)}`
  await fillForm(citizenPage, title)
  await citizenPage.getByRole('button', {name: /Fikrimi gonder/}).click()
  await expect(citizenPage.getByRole('heading', {name: 'Fikriniz başarıyla alındı.'})).toBeVisible()
  await citizenPage.getByRole('button', {name: 'Vatandaş panelinde takip et'}).click()
  await expect(applicationCounter(citizenPage)).toHaveText('1')
  await expect(citizenPage.locator('#oylar').getByText(title, {exact: true})).toBeVisible()
  await expect(center.getByText(title, {exact: true}).first()).toBeVisible()
  await expect(center.getByRole('button', {name: /^Onay Bekleyen/}).locator('span')).toHaveText('1')
  const payload = await (await citizenPage.request.get('/api/projects')).json()
  const saved = payload.projects.find(project => project.title === title)
  expect(saved.ownerId).toBe(user.id)
  expect(saved.moderationStatus).toBe('Bekliyor')
  expect(saved.workflowStatus).toBe('İlçe Admin İncelemesinde')
  await citizenPage.reload()
  await expect(applicationCounter(citizenPage)).toHaveText('1')
  await center.getByRole('button', {name: 'Onayla', exact: true}).first().click()
  await expect.poll(async () => {
    const records = await (await citizenPage.request.get('/api/projects')).json()
    return records.projects.find(project => project.id === saved.id)?.moderationStatus
  }).toBe('Onaylandı')
  await expect(center.getByRole('button', {name: /^Onay Bekleyen/}).locator('span')).toHaveText('0')
  await citizenSession.close()
  await adminSession.close()
})

test('a failed POST preserves form input and does not increment the citizen counter', async ({browser}) => {
  const context = await citizenContext(browser, citizen())
  const page = await context.newPage()
  await context.route('**/api/projects', async route => {
    if (route.request().method() === 'POST') return route.fulfill({status: 503, json: {error: 'Test: kayıt yapılamadı.', persisted: false}})
    await route.continue()
  })
  await fillForm(page, 'Aktarilamayan test fikri')
  await page.getByRole('button', {name: /Fikrimi gonder/}).click()
  await expect(page.getByRole('alert').filter({hasText: 'Test: kayıt yapılamadı.'})).toBeVisible()
  await expect(page.locator('[name=title]')).toHaveValue('Aktarilamayan test fikri')
  await expect(page.getByRole('heading', {name: 'Fikriniz başarıyla alındı.'})).toHaveCount(0)
  await page.goto('/vatandas/panel')
  await expect(applicationCounter(page)).toHaveText('0')
  await context.close()
})

test('a legacy local-only submission can be recovered without being counted beforehand', async ({browser}) => {
  const user = citizen()
  const project = {id: randomUUID(), projectCode: 'MSB-2026-LOCAL', title: 'Yerelde kalan basvuru', ownerId: user.id, ownerEmail: user.email,
    district: 'Menteşe', category: 'Afet ve Risk Yönetimi', createdAt: '2026-10-07', applicationYear: '2026',
    moderationStatus: 'Bekliyor', status: 'Başvuru', source: 'citizen', budget: 0, votes: 0, progress: 0}
  const context = await citizenContext(browser, user, [project])
  const page = await context.newPage()
  await page.goto('/vatandas/panel')
  await expect(page.getByRole('heading', {name: 'Gönderimi tamamlanmamış başvurular'})).toBeVisible()
  await expect(applicationCounter(page)).toHaveText('0')
  await page.getByRole('button', {name: 'Tekrar gönder', exact: true}).click()
  await expect(applicationCounter(page)).toHaveText('1')
  await expect(page.getByRole('heading', {name: 'Gönderimi tamamlanmamış başvurular'})).toHaveCount(0)
  await context.close()
})
