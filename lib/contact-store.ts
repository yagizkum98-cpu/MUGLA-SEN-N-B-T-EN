'use client'

import {useCallback, useEffect, useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {isMunicipalityDomain, municipalityUrl} from '@/lib/domain-routing'

export type ContactTopic = 'Gorus' | 'Oneri' | 'Soru'

export type ContactRecord = {
  id: string
  name: string
  phone: string
  email: string
  topic: ContactTopic
  subject: string
  message: string
  kvkkAccepted: boolean
  createdAt: string
}

export type NewContactRecord = Omit<ContactRecord, 'id' | 'createdAt'>

const STORAGE_KEY = 'mugla-contact-records-v1'
const DELETED_STORAGE_KEY = 'mugla-contact-deleted-records-v1'
const REMOTE_TABLE = 'contact_records'
export const contactChangeEvent = 'mugla-contact-records-changed'

function contactCenterApiUrl() {
  if (typeof window === 'undefined' || isMunicipalityDomain()) return '/api/contact-records'
  return municipalityUrl('/api/contact-records')
}

function readLocalDeletedContactIds() {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(DELETED_STORAGE_KEY) ?? '[]')
    return Array.isArray(value) ? value.map(String) : []
  } catch {
    return []
  }
}

function rememberLocalDeletedContactIds(ids: string[]) {
  if (typeof window === 'undefined') return
  const next = Array.from(new Set([...readLocalDeletedContactIds(), ...ids.map(String).filter(Boolean)]))
  localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(next))
}

function readContacts(): ContactRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    const deletedIds = new Set(readLocalDeletedContactIds())
    return Array.isArray(value) ? value.filter(record => record?.id && !record?.deleted && !deletedIds.has(String(record.id))) : []
  } catch {
    return []
  }
}

function sortContacts(records: ContactRecord[]) {
  return [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function mergeContactsById(local: ContactRecord[], remote: ContactRecord[]) {
  const map = new Map<string, ContactRecord>()
  const deletedIds = new Set(readLocalDeletedContactIds())
  local.forEach(record => map.set(record.id, record))
  remote.forEach(record => map.set(record.id, record))
  return sortContacts(Array.from(map.values()).filter(record => !deletedIds.has(record.id)))
}

function saveLocalContacts(records: ContactRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sortContacts(records)))
  window.dispatchEvent(new Event(contactChangeEvent))
}

async function readRemoteContacts(): Promise<{records: ContactRecord[]; deletedIds: string[]} | null> {
  if (typeof window === 'undefined') return null
  try {
    const response = await fetch(contactCenterApiUrl(), {cache: 'no-store'})
    const payload = await response.json().catch(() => null)
    if (response.ok && Array.isArray(payload?.records)) return {
      records: payload.records as ContactRecord[],
      deletedIds: Array.isArray(payload?.deletedIds) ? payload.deletedIds.map(String) : [],
    }
  } catch {}
  try {
    const {data, error} = await createClient().from(REMOTE_TABLE).select('data')
    if (error || !Array.isArray(data)) return null
    const deletedIds = data.map(row => row.data).filter(record => record?.deleted === true && record?.id).map(record => String(record.id))
    const deletedSet = new Set(deletedIds)
    return {
      records: data.map(row => row.data).filter(record => record?.id && !record?.deleted && !deletedSet.has(String(record.id))) as ContactRecord[],
      deletedIds,
    }
  } catch {
    return null
  }
}

async function upsertRemoteContacts(records: ContactRecord[]) {
  if (typeof window === 'undefined' || !records.length) return
  const deletedIds = new Set(readLocalDeletedContactIds())
  const activeRecords = records.filter(record => !deletedIds.has(record.id))
  if (!activeRecords.length) return
  for (const record of activeRecords) {
    try {
      await fetch(contactCenterApiUrl(), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({record}),
      })
    } catch {}
  }
  try {
    await createClient().from(REMOTE_TABLE).upsert(activeRecords.map(record => ({
      id: record.id,
      data: record,
      updated_at: new Date().toISOString(),
    })), {onConflict: 'id'})
  } catch {}
}

export async function syncContactRecord(record: ContactRecord) {
  if (typeof window === 'undefined') throw new Error('İletişim kaydı tarayıcı dışında senkronize edilemez.')
  const response = await fetch(contactCenterApiUrl(), {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({record}),
  })
  if (response.ok) return record
  const {error} = await createClient().from(REMOTE_TABLE).upsert({
    id: record.id,
    data: record,
    updated_at: new Date().toISOString(),
  }, {onConflict: 'id'})
  if (error) throw error
  return record
}

async function deleteRemoteContact(id: string) {
  if (typeof window === 'undefined') return
  try {
    await fetch(`${contactCenterApiUrl()}?id=${encodeURIComponent(id)}`, {method: 'DELETE'})
  } catch {}
  try {
    await createClient().from(REMOTE_TABLE).delete().eq('id', id)
  } catch {}
}

export function useContactRecords() {
  const [records, setRecords] = useState<ContactRecord[]>([])

  useEffect(() => {
    const sync = () => setRecords(readContacts())
    const syncRemote = async () => {
      const local = readContacts()
      const remote = await readRemoteContacts()
      if (!remote) {
        setRecords(local)
        return
      }
      rememberLocalDeletedContactIds(remote.deletedIds)
      const remoteDeletedIds = new Set(remote.deletedIds)
      const merged = mergeContactsById(local.filter(record => !remoteDeletedIds.has(record.id)), remote.records)
      saveLocalContacts(merged)
      setRecords(merged)
      if (merged.length) void upsertRemoteContacts(merged)
    }
    sync()
    void syncRemote()
    const remoteInterval = window.setInterval(() => void syncRemote(), 15000)
    const syncOnFocus = () => void syncRemote()
    window.addEventListener('storage', sync)
    window.addEventListener(contactChangeEvent, sync)
    window.addEventListener('focus', syncOnFocus)
    return () => {
      window.clearInterval(remoteInterval)
      window.removeEventListener('storage', sync)
      window.removeEventListener(contactChangeEvent, sync)
      window.removeEventListener('focus', syncOnFocus)
    }
  }, [])

  const save = useCallback((next: ContactRecord[]) => {
    const sorted = sortContacts(next)
    saveLocalContacts(sorted)
    setRecords(sorted)
    void upsertRemoteContacts(sorted)
  }, [])

  const addContactRecord = useCallback((input: NewContactRecord) => {
    const record: ContactRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    save([record, ...readContacts()])
    void upsertRemoteContacts([record])
    return record
  }, [save])

  const removeContactRecord = useCallback((id: string) => {
    rememberLocalDeletedContactIds([id])
    save(readContacts().filter(record => record.id !== id))
    void deleteRemoteContact(id)
  }, [save])

  return {records, addContactRecord, removeContactRecord}
}
