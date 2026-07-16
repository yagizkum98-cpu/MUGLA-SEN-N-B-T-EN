'use client'

import {FormEvent, useState} from 'react'
import Link from 'next/link'
import {ArrowLeft, BarChart3, LockKeyhole} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {loginAdminDashboard} from '@/lib/admin-dashboard-auth'

const field = 'w-full rounded-2xl border border-mugla-navy/15 bg-white px-4 py-3.5 outline-none focus:border-mugla-cyan focus:ring-4 focus:ring-mugla-cyan/10'

export default function AdminDashboardLoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(event.currentTarget)
    try {
      await loginAdminDashboard(String(form.get('email')), String(form.get('password')))
      location.href = '/admin/dashboard'
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Dashboard girisi yapilamadi.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="grid min-h-screen bg-mugla-sand lg:grid-cols-[.9fr_1.1fr]">
    <section className="hidden bg-mugla-navy p-14 text-white lg:flex lg:flex-col">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-white/60"><ArrowLeft size={16}/> Admin paneli</Link>
      <div className="my-auto max-w-xl">
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-white/10 text-mugla-cyan"><BarChart3 size={32}/></span>
        <h1 className="mt-8 text-5xl font-bold leading-tight">Yonetici Dashboard</h1>
        <p className="mt-5 text-lg leading-8 text-white/60">Canli proje, oy, katilimci, demografi, harita ve butce verileri icin ikinci giris kapisi.</p>
      </div>
    </section>

    <section className="grid place-items-center p-6">
      <div className="w-full max-w-md">
        <Link href="/admin" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-mugla-navy/55 lg:hidden"><ArrowLeft size={16}/> Admin paneli</Link>
        <p className="text-xs font-bold tracking-[.2em] text-mugla-orange">YONETICI DASHBOARD GIRISI</p>
        <h2 className="mt-2 text-3xl font-bold">Canli veriler</h2>
        <p className="mt-3 text-sm leading-6 text-mugla-navy/55">Tanimli admin hesabinin e-posta ve sifresiyle dashboard icin tekrar giris yap.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block"><span className="mb-2 block text-sm font-semibold">E-posta</span><input name="email" type="email" required className={field}/></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold">Sifre</span><input name="password" type="password" required className={field}/></label>
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          <Button type="submit" variant="orange" disabled={loading} className="h-14 w-full"><LockKeyhole size={18}/>{loading ? 'Giris yapiliyor...' : 'Dashboarda gir'}</Button>
        </form>
      </div>
    </section>
  </main>
}
