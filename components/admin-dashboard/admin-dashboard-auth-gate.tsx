'use client'

import Link from 'next/link'
import {useEffect, useState} from 'react'
import {BarChart3, LockKeyhole} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {getCurrentAdminDashboard, type AdminAccount} from '@/lib/admin-dashboard-auth'

export function AdminDashboardAuthGate({children}: {children: React.ReactNode}) {
  const [admin, setAdmin] = useState<AdminAccount | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    getCurrentAdminDashboard().then(current => {
      setAdmin(current)
      setChecked(true)
    })
  }, [])

  if (!checked) return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <p className="font-semibold text-mugla-navy/55">Yonetici dashboard oturumu kontrol ediliyor...</p>
  </main>

  if (!admin) return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-soft">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mugla-navy text-white"><BarChart3 size={28}/></span>
      <p className="mt-6 text-xs font-bold tracking-[.2em] text-mugla-orange">AYRI DASHBOARD GIRISI</p>
      <h1 className="mt-2 text-3xl font-bold">Canli veriler icin tekrar giris yap.</h1>
      <p className="mt-3 leading-7 text-mugla-navy/55">Yonetici dashboardu, admin panelinden bagimsiz ikinci bir oturumla acilir.</p>
      <Link href="/admin/dashboard/giris" className="mt-7 inline-flex"><Button variant="orange"><LockKeyhole size={17}/> Dashboard girisi</Button></Link>
    </section>
  </main>

  return <>{children}</>
}
