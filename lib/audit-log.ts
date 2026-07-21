'use client'

import {type AdminAccount, normalizeAdminRole} from '@/lib/admin-auth'

export type AuditRecord = {
  id: string
  actorId: string
  actorName: string
  actorEmail: string
  actorRole: string
  action: string
  target?: string
  details?: string
  createdAt: string
  ip: string
  userAgent: string
}

const AUDIT_KEY = 'mugla-admin-audit-log-v1'
export const auditLogChangeEvent = 'mugla-admin-audit-log-changed'

export function readAuditLog(): AuditRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(AUDIT_KEY) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function writeAuditLog(actor: AdminAccount | null, action: string, input?: {target?: string; details?: string}) {
  if (typeof window === 'undefined' || !actor) return
  const record: AuditRecord = {
    id: crypto.randomUUID(),
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    actorRole: normalizeAdminRole(actor.role),
    action,
    target: input?.target,
    details: input?.details,
    createdAt: new Date().toISOString(),
    ip: 'client-side',
    userAgent: navigator.userAgent,
  }
  localStorage.setItem(AUDIT_KEY, JSON.stringify([record, ...readAuditLog()].slice(0, 1000)))
  window.dispatchEvent(new Event(auditLogChangeEvent))
}
