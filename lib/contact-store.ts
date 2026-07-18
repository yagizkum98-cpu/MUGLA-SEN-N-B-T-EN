'use client'

import {useCallback, useEffect, useState} from 'react'

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

export function useContactRecords() {
  const [records, setRecords] = useState<ContactRecord[]>([])

  useEffect(() => {
    const sync = () => setRecords(readContacts())
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(contactChangeEvent, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(contactChangeEvent, sync)
    }
  }, [])

  const save = useCallback((next: ContactRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setRecords(next)
    window.dispatchEvent(new Event(contactChangeEvent))
  }, [])

  const addContactRecord = useCallback((input: NewContactRecord) => {
    const record: ContactRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    save([record, ...readContacts()])
    return record
  }, [save])

  const removeContactRecord = useCallback((id: string) => {
    save(readContacts().filter(record => record.id !== id))
  }, [save])

  return {records, addContactRecord, removeContactRecord}
}
