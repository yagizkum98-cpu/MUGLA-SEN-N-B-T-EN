'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import {apiUrl} from '@/lib/domain-routing'

export type CivicNotification = {
  id: string
  title: string
  body: string
  district: string
  targetRole: string
  targetDepartment?: string
  category: string
  priority: 'Bilgi' | 'İşlem' | 'Uyarı' | 'Acil' | 'Kritik'
  channels: string[]
  status: 'Taslak' | 'Planlandı' | 'Gönderildi'
  source: 'Manuel' | 'Otomatik' | 'AI' | 'Sistem'
  publishAt: string
  createdAt: string
  updatedAt?: string
  createdBy?: string
}

export type CivicEvent = {
  id: string
  title: string
  description: string
  district: string
  location: string
  startDate: string
  endDate?: string
  category: string
  status: 'Taslak' | 'Planlandı' | 'Yayında' | 'Tamamlandı'
  createdAt: string
  updatedAt?: string
  createdBy?: string
}

type CivicUpdatesPayload = {
  notifications: CivicNotification[]
  events: CivicEvent[]
}

export type NewCivicNotification = Omit<CivicNotification, 'id' | 'createdAt' | 'updatedAt'>
export type NewCivicEvent = Omit<CivicEvent, 'id' | 'createdAt' | 'updatedAt'>

const STORAGE_KEY = 'mugla-civic-updates-v1'
export const civicUpdatesChangeEvent = 'mugla-civic-updates-changed'

function civicUpdatesApiUrl() {
  return apiUrl('/api/civic-updates')
}

function emptyPayload(): CivicUpdatesPayload {
  return {notifications: [], events: []}
}

function normalizeNotification(record: CivicNotification): CivicNotification {
  return {
    ...record,
    targetRole: record.targetRole ?? 'Vatandaş',
    priority: record.priority ?? 'Bilgi',
    source: record.source ?? 'Manuel',
  }
}

function sortByDate<T extends {createdAt: string; updatedAt?: string; publishAt?: string; startDate?: string}>(records: T[]) {
  return [...records].sort((a, b) => String(b.publishAt ?? b.startDate ?? b.updatedAt ?? b.createdAt).localeCompare(String(a.publishAt ?? a.startDate ?? a.updatedAt ?? a.createdAt)))
}

function readLocalUpdates(): CivicUpdatesPayload {
  if (typeof window === 'undefined') return emptyPayload()
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  return {
      notifications: Array.isArray(value?.notifications) ? sortByDate(value.notifications.filter((item: CivicNotification) => item?.id && item?.title).map(normalizeNotification)) : [],
      events: Array.isArray(value?.events) ? sortByDate(value.events.filter((item: CivicEvent) => item?.id && item?.title)) : [],
    }
  } catch {
    return emptyPayload()
  }
}

function mergeByNewest<T extends {id: string; createdAt: string; updatedAt?: string}>(records: T[]) {
  const map = new Map<string, T>()
  records.forEach(record => {
    const current = map.get(record.id)
    const recordTime = String(record.updatedAt ?? record.createdAt)
    const currentTime = String(current?.updatedAt ?? current?.createdAt ?? '')
    if (!current || recordTime.localeCompare(currentTime) >= 0) map.set(record.id, record)
  })
  return sortByDate(Array.from(map.values()))
}

function mergeUpdates(local: CivicUpdatesPayload, remote: CivicUpdatesPayload): CivicUpdatesPayload {
  return {
    notifications: mergeByNewest([...local.notifications, ...remote.notifications]),
    events: mergeByNewest([...local.events, ...remote.events]),
  }
}

function saveLocalUpdates(payload: CivicUpdatesPayload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    notifications: sortByDate(payload.notifications),
    events: sortByDate(payload.events),
  }))
  window.dispatchEvent(new Event(civicUpdatesChangeEvent))
}

async function readRemoteUpdates(): Promise<CivicUpdatesPayload | null> {
  if (typeof window === 'undefined') return null
  try {
    const response = await fetch(civicUpdatesApiUrl(), {cache: 'no-store'})
    const payload = await response.json().catch(() => null)
    if (response.ok) return {
      notifications: Array.isArray(payload?.notifications) ? payload.notifications.map(normalizeNotification) : [],
      events: Array.isArray(payload?.events) ? payload.events : [],
    }
  } catch {}
  return null
}

async function upsertRemoteUpdates(payload: Partial<CivicUpdatesPayload>) {
  if (typeof window === 'undefined') return
  try {
    await fetch(civicUpdatesApiUrl(), {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    })
  } catch {}
}

export function useCivicUpdates() {
  const [updates, setUpdates] = useState<CivicUpdatesPayload>(emptyPayload)

  useEffect(() => {
    const syncLocal = () => setUpdates(readLocalUpdates())
    const syncRemote = async () => {
      const local = readLocalUpdates()
      const remote = await readRemoteUpdates()
      if (!remote) {
        setUpdates(local)
        return
      }
      const merged = mergeUpdates(local, remote)
      saveLocalUpdates(merged)
      setUpdates(merged)
      if (merged.notifications.length || merged.events.length) void upsertRemoteUpdates(merged)
    }
    syncLocal()
    void syncRemote()
    const remoteInterval = window.setInterval(() => void syncRemote(), 15000)
    const syncOnFocus = () => void syncRemote()
    window.addEventListener('storage', syncLocal)
    window.addEventListener(civicUpdatesChangeEvent, syncLocal)
    window.addEventListener('focus', syncOnFocus)
    return () => {
      window.clearInterval(remoteInterval)
      window.removeEventListener('storage', syncLocal)
      window.removeEventListener(civicUpdatesChangeEvent, syncLocal)
      window.removeEventListener('focus', syncOnFocus)
    }
  }, [])

  const save = useCallback((next: CivicUpdatesPayload) => {
    const payload = {
      notifications: sortByDate(next.notifications),
      events: sortByDate(next.events),
    }
    saveLocalUpdates(payload)
    setUpdates(payload)
    void upsertRemoteUpdates(payload)
  }, [])

  const addNotification = useCallback((input: NewCivicNotification) => {
    const now = new Date().toISOString()
    const notification: CivicNotification = {...input, targetRole: input.targetRole || 'Vatandaş', priority: input.priority || 'Bilgi', source: input.source || 'Manuel', id: crypto.randomUUID(), createdAt: now, updatedAt: now}
    const current = readLocalUpdates()
    save({...current, notifications: [notification, ...current.notifications]})
    void upsertRemoteUpdates({notifications: [notification]})
    return notification
  }, [save])

  const addEvent = useCallback((input: NewCivicEvent) => {
    const now = new Date().toISOString()
    const event: CivicEvent = {...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now}
    const current = readLocalUpdates()
    save({...current, events: [event, ...current.events]})
    void upsertRemoteUpdates({events: [event]})
    return event
  }, [save])

  return useMemo(() => ({...updates, addNotification, addEvent}), [updates, addNotification, addEvent])
}
