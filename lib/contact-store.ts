'use client'

import {useCallback, useEffect, useState} from 'react'
import {createClient} from '@/lib/supabase/client'

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
const REMOTE_TABLE = 'contact_records'
export const contactChangeEvent = 'mugla-contact-records-changed'

function readContacts(): ContactRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function sortContacts(records: ContactRecord[]) {
  return [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function mergeContactsById(local: ContactRecord[], remote: ContactRecord[]) {
  const map = new Map<string, ContactRecord>()
  local.forEach(record => map.set(record.id, record))
  remote.forEach(record => map.set(record.id, record))
  return sortContacts(Array.from(map.values()))
}

function saveLocalContacts(records: ContactRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sortContacts(records)))
  window.dispatchEvent(new Event(contactChangeEvent))
}

async function readRemoteContacts() {
  if (typeof window === 'undefined') return null
  try {
    const {data, error} = await createClient().from(REMOTE_TABLE).select('data')
    if (error || !Array.isArray(data)) return null
    return data.map(row => row.data).filter(Boolean) as ContactRecord[]
  } catch {
    return null
  }
}

async function upsertRemoteContacts(records: ContactRecord[]) {
  if (typeof window === 'undefined' || !records.length) return
  try {
    await createClient().from(REMOTE_TABLE).upsert(records.map(record => ({
      id: record.id,
      data: record,
      updated_at: new Date().toISOString(),
    })), {onConflict: 'id'})
  } catch {}
}

export async function syncContactRecord(record: ContactRecord) {
  if (typeof window === 'undefined') throw new Error('İletişim kaydı tarayıcı dışında senkronize edilemez.')
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
      const merged = mergeContactsById(local, remote)
      saveLocalContacts(merged)
      setRecords(merged)
      if (merged.length) void upsertRemoteContacts(merged)
    }
    sync()
    void syncRemote()
    window.addEventListener('storage', sync)
    window.addEventListener(contactChangeEvent, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(contactChangeEvent, sync)
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
    save(readContacts().filter(record => record.id !== id))
    void deleteRemoteContact(id)
  }, [save])

  return {records, addContactRecord, removeContactRecord}
}
