import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {randomUUID} from 'node:crypto'
import {createProjectRepository, normalizeSubmission} from '../lib/server/project-repository.ts'

function submission(overrides = {}) {
  return {id: randomUUID(), title: 'Test basvurusu', district: 'Menteşe', category: 'Afet ve Risk Yönetimi',
    ownerId: 'test-citizen', ownerEmail: 'Citizen@EXAMPLE.test', applicationYear: '2026', ...overrides}
}
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'mugla-project-test-'))
  t.after(() => rm(directory, {recursive: true, force: true}))
  const localPath = join(directory, 'records.json')
  return {localPath, repository: createProjectRepository({localPath})}
}
test('unconfigured production storage cannot acknowledge a submission', async () => {
  const repository = createProjectRepository()
  await assert.rejects(repository.submit(submission()), error => error.status === 503)
  await assert.rejects(repository.list(), error => error.status === 503)
})
test('submission state is enforced on the server', () => {
  const project = normalizeSubmission(submission({status: 'Oylamada', moderationStatus: 'Onaylandı', votes: 500}))
  assert.equal(project.status, 'Başvuru')
  assert.equal(project.moderationStatus, 'Bekliyor')
  assert.equal(project.workflowStatus, 'İlçe Admin İncelemesinde')
  assert.equal(project.votes, 0)
  assert.equal(project.ownerEmail, 'citizen@example.test')
  assert.throws(() => normalizeSubmission(submission({ownerId: ''})), error => error.status === 400)
})
test('a different repository reads the same durable submission and counters', async t => {
  const {repository, localPath} = await fixture(t)
  const saved = await repository.submit(submission())
  assert.equal(saved.persisted, true)
  assert.match(saved.project.projectCode, /^MSB-2026-\d{6}$/)
  const anotherPanel = createProjectRepository({localPath})
  const records = (await anotherPanel.list()).projects
  assert.equal(records.length, 1)
  assert.equal(records[0].id, saved.project.id)
  assert.equal(records.filter(project => project.moderationStatus === 'Bekliyor').length, 1)
})
test('retries preserve one record and do not revert an approved application', async t => {
  const {repository} = await fixture(t)
  const input = submission()
  const first = await repository.submit(input)
  const approved = {...first.project, status: 'Uygun', moderationStatus: 'Onaylandı', workflowStatus: 'Oylamaya Hazır'}
  await repository.upsert(approved)
  const retry = await repository.submit(input)
  assert.equal(retry.project.projectCode, first.project.projectCode)
  assert.equal(retry.project.moderationStatus, 'Onaylandı')
  assert.equal((await repository.list()).projects.length, 1)
  await assert.rejects(repository.submit({...input, ownerEmail: 'other@example.test'}), error => error.status === 409)
})
test('concurrent submissions enforce the yearly limit without lost records', async t => {
  const {repository} = await fixture(t)
  const results = await Promise.allSettled(Array.from({length: 7}, () => repository.submit(submission())))
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 5)
  assert.equal(results.filter(result => result.status === 'rejected' && result.reason.status === 409).length, 2)
  const records = (await repository.list()).projects
  assert.equal(records.length, 5)
  assert.equal(new Set(records.map(project => project.projectCode)).size, 5)
  await repository.submit(submission({applicationYear: '2027'}))
  assert.equal((await repository.list()).projects.length, 6)
})
test('deletion is visible to other panels after reload', async t => {
  const {repository, localPath} = await fixture(t)
  const saved = await repository.submit(submission())
  await repository.remove(saved.project.id)
  const records = await createProjectRepository({localPath}).list()
  assert.equal(records.projects.length, 0)
  assert.deepEqual(records.deletedIds, [saved.project.id])
})
test('Supabase submission failures are not acknowledged as successful', async () => {
  const repository = createProjectRepository({supabase: {rpc: async () => ({data: null, error: {message: 'missing function'}})}})
  await assert.rejects(repository.submit(submission()), error => error.status === 503)
  const limited = createProjectRepository({supabase: {rpc: async () => ({data: null, error: {message: 'APPLICATION_LIMIT'}})}})
  await assert.rejects(limited.submit(submission()), error => error.status === 409)
})
test('Supabase reads paginate and exclude non-project metadata from counters', async () => {
  const rows = Array.from({length: 1001}, (_, index) => ({id: `project-${index}`, data: {id: `project-${index}`, title: 'Project'}, updated_at: '2026-10-07'}))
  rows.push({id: 'admin-voting-records', data: {kind: 'voting-records'}, updated_at: '2026-10-07'})
  const repository = createProjectRepository({supabase: {from: () => ({select: () => ({order: () => ({range: async (from, to) => ({data: rows.slice(from, to + 1), error: null})})})})}})
  assert.equal((await repository.list()).projects.length, 1001)
})

test('health rejects a database without the intake migration without inserting test data', async () => {
  const supabase = {from: () => ({select: () => ({order: () => ({range: async () => ({data: [], error: null})})})}),
    rpc: async (_name, args) => { assert.deepEqual(args, {p_project: {}}); return {error: {message: 'missing function'}} }}
  await assert.rejects(createProjectRepository({supabase}).health(), error => error.status === 503)
  supabase.rpc = async () => ({error: {message: 'APPLICATION_INVALID'}})
  assert.equal((await createProjectRepository({supabase}).health()).applicationSchemaReady, true)
})
