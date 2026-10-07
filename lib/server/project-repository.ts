import {createClient, type SupabaseClient} from '@supabase/supabase-js'
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises'
import {dirname, resolve} from 'node:path'
import {randomUUID} from 'node:crypto'

export type StoredProject = Record<string, unknown> & {id: string; title: string; projectCode: string}
type Row = {id: string; data: Record<string, unknown>; updated_at: string}
type FileStore = {nextNumber: number; rows: Row[]}
const queues = new Map<string, Promise<unknown>>()

export class ProjectRepositoryError extends Error {
  status: number
  constructor(message: string, status = 503) {
    super(message)
    this.status = status
  }
}

function ownerKey(project: Record<string, unknown>) {
  return String(project.ownerEmail || project.ownerId || '').trim().toLowerCase()
}

export function normalizeSubmission(value: unknown): StoredProject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ProjectRepositoryError('Başvuru verisi geçersiz.', 400)
  const record = value as Record<string, unknown>
  for (const field of ['id', 'title', 'district', 'category', 'ownerId', 'ownerEmail']) {
    if (typeof record[field] !== 'string' || !record[field].trim()) throw new ProjectRepositoryError(`${field} alanı zorunlu.`, 400)
  }
  const year = String(record.applicationYear || new Date().getFullYear())
  if (!/^\d{4}$/.test(year)) throw new ProjectRepositoryError('Başvuru yılı geçersiz.', 400)
  return {
    ...record, id: String(record.id), title: String(record.title).trim(), projectCode: '',
    ownerEmail: String(record.ownerEmail).trim().toLowerCase(), applicationYear: year,
    status: 'Başvuru', moderationStatus: 'Bekliyor', workflowStatus: 'İlçe Admin İncelemesinde',
    source: 'citizen', votes: 0, progress: 0, createdAt: new Date().toISOString(),
  }
}

export function createProjectRepository(options: {supabase?: SupabaseClient; localPath?: string} = {}) {
  const {supabase, localPath} = options
  const storage = supabase ? 'supabase' : 'local-file'
  function ensureConfigured() {
    if (!supabase && !localPath) throw new ProjectRepositoryError('Kalıcı proje veritabanı bağlı değil. Vercel ortamında NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlanmalıdır.')
  }
  async function readFileStore(): Promise<FileStore> {
    try {
      const data = JSON.parse(await readFile(localPath!, 'utf8'))
      if (!Array.isArray(data.rows) || !Number.isSafeInteger(data.nextNumber)) throw new Error('Invalid store')
      return data
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return {nextNumber: 1, rows: []}
      throw new ProjectRepositoryError('Yerel proje deposu okunamadı.')
    }
  }
  async function mutate<T>(operation: (store: FileStore) => T): Promise<T> {
    ensureConfigured()
    const previous = queues.get(localPath!) || Promise.resolve()
    const task = previous.catch(() => {}).then(async () => {
      const store = await readFileStore()
      const result = operation(store)
      await mkdir(dirname(localPath!), {recursive: true})
      const temporary = `${localPath}.${randomUUID()}.tmp`
      await writeFile(temporary, JSON.stringify(store), 'utf8')
      await rename(temporary, localPath!)
      return result
    })
    queues.set(localPath!, task)
    try { return await task } finally { if (queues.get(localPath!) === task) queues.delete(localPath!) }
  }
  async function rows(): Promise<Row[]> {
    ensureConfigured()
    if (!supabase) {
      await queues.get(localPath!)?.catch(() => {})
      return (await readFileStore()).rows
    }
    const result: Row[] = []
    // Supabase's default result limit is 1000; counters must include every page.
    for (let offset = 0; ; offset += 1000) {
      const {data, error} = await supabase.from('project_records').select('id,data,updated_at').order('id').range(offset, offset + 999)
      if (error) throw new ProjectRepositoryError('Proje veritabanı okunamadı. Bağlantı ve project_records tablosunu kontrol edin.')
      result.push(...(data || []))
      if (!data || data.length < 1000) return result
    }
  }
  return {
    async health() {
      const records = await rows()
      if (supabase) {
        // Empty input only validates that the intake migration exists; it cannot insert a row.
        const {error} = await supabase.rpc('submit_project_application', {p_project: {}})
        if (!error?.message.includes('APPLICATION_INVALID')) throw new ProjectRepositoryError('Proje başvuru şeması hazır değil. project-submissions.sql migration dosyasını uygulayın.')
      }
      return {ok: true, persisted: true, storage, applicationSchemaReady: true, projectCount: records.filter(row => typeof row.data.title === 'string' && !row.data.deleted).length}
    },
    async list() {
      const records = await rows()
      const deletedIds = records.filter(row => row.data.deleted === true).map(row => row.id)
      const projects = records.filter(row => typeof row.data.title === 'string' && !row.data.deleted)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)).map(row => ({...row.data, updatedAt: row.updated_at}))
      return {projects, deletedIds, synced: true, persisted: true, storage}
    },
    async submit(value: unknown) {
      ensureConfigured()
      const project = normalizeSubmission(value)
      let saved: Record<string, unknown>
      if (supabase) {
        const {data, error} = await supabase.rpc('submit_project_application', {p_project: project})
        if (error) {
          if (error.message.includes('APPLICATION_LIMIT')) throw new ProjectRepositoryError('Bu yıl için en fazla 5 fikir gönderebilirsiniz.', 409)
          if (error.message.includes('APPLICATION_OWNER')) throw new ProjectRepositoryError('Başvuru sahibi eşleşmiyor.', 409)
          throw new ProjectRepositoryError('Başvuru kaydedilemedi. Proje başvuru veritabanı migration dosyasının uygulandığını kontrol edin.')
        }
        if (!data?.id || !data?.projectCode) throw new ProjectRepositoryError('Veritabanı kayıt onayı dönmedi.')
        saved = data
      } else {
        saved = await mutate(store => {
          const existing = store.rows.find(row => row.id === project.id)
          if (existing) {
            if (existing.data.deleted || ownerKey(existing.data) !== ownerKey(project)) throw new ProjectRepositoryError('Başvuru sahibi eşleşmiyor.', 409)
            return existing.data
          }
          const count = store.rows.filter(row => !row.data.deleted && ownerKey(row.data) === ownerKey(project) &&
            String(row.data.applicationYear || String(row.data.createdAt).slice(0, 4)) === project.applicationYear).length
          if (count >= 5) throw new ProjectRepositoryError('Bu yıl için en fazla 5 fikir gönderebilirsiniz.', 409)
          const now = new Date().toISOString()
          let code: string
          do { code = `MSB-${project.applicationYear}-${String(store.nextNumber++).padStart(6, '0')}` }
          while (store.rows.some(row => row.data.projectCode === code))
          const record = {...project, projectCode: code, updatedAt: now}
          store.rows.push({id: project.id, data: record, updated_at: now})
          return record
        })
      }
      return {project: saved, synced: true, persisted: true, storage}
    },
    async upsert(project: StoredProject) {
      ensureConfigured()
      const updated_at = new Date().toISOString()
      const record = {...project, updatedAt: updated_at}
      if (supabase) {
        const {error} = await supabase.from('project_records').upsert({id: project.id, data: record, updated_at}, {onConflict: 'id'})
        if (error) throw new ProjectRepositoryError('Proje değişikliği veritabanına kaydedilemedi.')
      } else await mutate(store => {
        const existing = store.rows.find(row => row.id === project.id)
        if (existing) { existing.data = record; existing.updated_at = updated_at }
        else store.rows.push({id: project.id, data: record, updated_at})
      })
      return {project: record, synced: true, persisted: true, storage}
    },
    async remove(id: string) {
      ensureConfigured()
      const updated_at = new Date().toISOString()
      const row = {id, data: {id, deleted: true, deletedAt: updated_at}, updated_at}
      if (supabase) {
        const {error} = await supabase.from('project_records').upsert(row, {onConflict: 'id'})
        if (error) throw new ProjectRepositoryError('Proje silme işlemi kaydedilemedi.')
      } else await mutate(store => { store.rows = [...store.rows.filter(record => record.id !== id), row] })
      return {ok: true, synced: true, persisted: true, storage}
    },
  }
}

export function projectRepository() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) return createProjectRepository({supabase: createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}})})
  const allowLocal = !process.env.VERCEL && (process.env.NODE_ENV !== 'production' || process.env.PROJECTS_STORAGE_MODE === 'local-file')
  return createProjectRepository({localPath: allowLocal ? resolve(process.env.PROJECTS_LOCAL_FILE || '.data/project-records.json') : undefined})
}
