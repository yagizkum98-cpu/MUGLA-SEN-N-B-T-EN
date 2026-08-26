'use client'

import {type AdminAccount, type AdminRole, normalizeAdminRole} from '@/lib/admin-auth'

export type AdminModule = 'dashboard' | 'applications' | 'projects' | 'votings' | 'results' | 'citizens' | 'notifications' | 'reports' | 'crm' | 'users' | 'settings' | 'calendar' | 'ai'
export type AdminAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'publish' | 'archive' | 'assign' | 'report' | 'notify' | 'ai' | 'export'
export type AccessLevel = 'none' | 'view' | 'full'

const moduleAccess: Record<Exclude<AdminRole, 'admin'>, Partial<Record<AdminModule, AccessLevel>>> = {
  'super-admin': {
    dashboard: 'full', applications: 'full', projects: 'full', votings: 'full', results: 'full', citizens: 'full', notifications: 'full', reports: 'full', crm: 'full', users: 'full', settings: 'full', calendar: 'full', ai: 'full',
  },
  'belediye-admin': {
    dashboard: 'full', applications: 'full', projects: 'full', votings: 'full', results: 'full', citizens: 'full', notifications: 'full', reports: 'full', crm: 'full', users: 'full', settings: 'view', calendar: 'full', ai: 'full',
  },
  'daire-baskani': {
    dashboard: 'full', applications: 'full', projects: 'full', votings: 'view', results: 'full', notifications: 'full', reports: 'full', calendar: 'full', ai: 'full',
  },
  mudur: {
    dashboard: 'full', applications: 'full', projects: 'full', votings: 'view', results: 'view', notifications: 'full', reports: 'view', calendar: 'full', ai: 'full',
  },
  sef: {
    dashboard: 'view', applications: 'full', projects: 'view', notifications: 'full', reports: 'view', calendar: 'view', ai: 'view',
  },
  'uzman-personel': {
    dashboard: 'view', applications: 'full', projects: 'full', notifications: 'full', reports: 'view', calendar: 'view', ai: 'view',
  },
  'komisyon-uyesi': {
    dashboard: 'view', applications: 'view', projects: 'full', notifications: 'view', reports: 'view', ai: 'view',
  },
  crm: {
    dashboard: 'view', applications: 'view', results: 'view', citizens: 'full', notifications: 'full', crm: 'full',
  },
  'mali-hizmetler': {
    dashboard: 'view', applications: 'view', projects: 'view', reports: 'full', notifications: 'view', ai: 'view',
  },
  gozlemci: {
    dashboard: 'view', applications: 'view', projects: 'view', votings: 'view', results: 'view', notifications: 'view', reports: 'view', crm: 'view', calendar: 'view', ai: 'view',
  },
  'ilce-yoneticisi': {
    dashboard: 'full', applications: 'full', projects: 'full', votings: 'view', results: 'view', notifications: 'full', reports: 'view', calendar: 'full', ai: 'view',
  },
  yetkili: {
    dashboard: 'view', applications: 'full', projects: 'view', notifications: 'full', reports: 'view', calendar: 'view', ai: 'view',
  },
  degerlendirici: {
    dashboard: 'view', applications: 'full', projects: 'full', notifications: 'view', reports: 'view', ai: 'view',
  },
}

const fullActions = new Set<AdminAction>(['view', 'create', 'edit', 'delete', 'approve', 'publish', 'archive', 'assign', 'report', 'notify', 'ai', 'export'])
const viewActions = new Set<AdminAction>(['view'])

const actionOverrides: Partial<Record<Exclude<AdminRole, 'admin'>, Partial<Record<AdminModule, AdminAction[]>>>> = {
  'daire-baskani': {projects: ['view', 'assign', 'report', 'approve', 'notify', 'ai'], applications: ['view', 'assign', 'approve', 'notify'], notifications: ['view', 'create', 'notify'], reports: ['view', 'report', 'export']},
  mudur: {projects: ['view', 'edit', 'assign', 'approve', 'notify', 'ai'], applications: ['view', 'edit', 'approve', 'assign', 'notify'], reports: ['view', 'report'], notifications: ['view', 'create', 'notify']},
  sef: {applications: ['view', 'edit', 'assign', 'notify'], notifications: ['view', 'create', 'notify']},
  'uzman-personel': {projects: ['view', 'edit', 'report', 'ai'], applications: ['view', 'edit', 'report', 'ai'], notifications: ['view', 'create', 'notify']},
  'komisyon-uyesi': {projects: ['view', 'edit', 'approve', 'ai'], applications: ['view', 'edit', 'approve', 'ai']},
  crm: {notifications: ['view', 'create', 'notify'], crm: ['view', 'create', 'edit', 'notify'], citizens: ['view', 'edit']},
  'mali-hizmetler': {projects: ['view', 'report'], reports: ['view', 'report', 'export']},
  gozlemci: {},
}

export function moduleAccessLevel(role: AdminRole | string | undefined, module: AdminModule) {
  return moduleAccess[normalizeAdminRole(role)]?.[module] ?? 'none'
}

export function canAccessModule(role: AdminRole | string | undefined, module: AdminModule) {
  return moduleAccessLevel(role, module) !== 'none'
}

export function canDo(role: AdminRole | string | undefined, module: AdminModule, action: AdminAction) {
  const normalized = normalizeAdminRole(role)
  const override = actionOverrides[normalized]?.[module]
  if (override) return override.includes(action)
  const level = moduleAccessLevel(normalized, module)
  if (level === 'full') return fullActions.has(action)
  if (level === 'view') return viewActions.has(action)
  return false
}

export function accountMatchesProjectScope(account: AdminAccount | null | undefined, project: {id?: string; projectCode?: string; district?: string; department?: string; directorate?: string; category?: string; createdByAdminId?: string}) {
  const role = normalizeAdminRole(account?.role)
  if (!account) return false
  if (role === 'super-admin' || role === 'belediye-admin') return true
  if (role === 'crm') return false
  if (role === 'gozlemci') return true
  if (account.assignedProjectIds?.some(id => id === project.id || id === project.projectCode)) return true
  if ((role === 'uzman-personel' || role === 'komisyon-uyesi' || role === 'degerlendirici') && account.assignedProjectIds?.length) return false
  if (account.department && [project.department, project.directorate, project.category].filter(Boolean).includes(account.department)) return true
  if (account.district && project.district === account.district) return true
  if (role === 'yetkili') return project.createdByAdminId === account.id
  return role === 'daire-baskani' || role === 'mudur' || role === 'sef' || role === 'mali-hizmetler'
}
