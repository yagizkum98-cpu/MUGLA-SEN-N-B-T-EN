'use client'

import {getCurrentAdmin, loginAdmin, logoutAdmin, type AdminAccount} from '@/lib/admin-auth'

export type {AdminAccount}

const SESSION_KEY = 'mugla-admin-dashboard-session-v1'
const CHANGE_EVENT = 'mugla-admin-dashboard-auth-changed'

export async function loginAdminDashboard(email: string, password: string) {
  const admin = await loginAdmin(email, password)
  localStorage.setItem(SESSION_KEY, admin.id)
  window.dispatchEvent(new Event(CHANGE_EVENT))
  return admin
}

export async function getCurrentAdminDashboard(): Promise<AdminAccount | null> {
  if (typeof window === 'undefined') return null
  const dashboardSession = localStorage.getItem(SESSION_KEY)
  const admin = await getCurrentAdmin()
  return admin && dashboardSession === admin.id ? admin : null
}

export function logoutAdminDashboard() {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function logoutAllAdminAreas() {
  logoutAdminDashboard()
  logoutAdmin()
}

export const adminDashboardAuthChangeEvent = CHANGE_EVENT
