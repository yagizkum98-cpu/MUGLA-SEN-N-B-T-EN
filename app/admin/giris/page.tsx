'use client'

import {FormEvent, useEffect, useState} from 'react'
import {LockKeyhole, ShieldCheck} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {loginAdmin, logoutAdmin, normalizeAdminRole} from '@/lib/admin-auth'
import {isAdminAuthorityDomain, isCrmDomain, isSuperAdminDomain, municipalityUrl} from '@/lib/domain-routing'

const field = 'w-full rounded-2xl border border-mugla-navy/15 bg-white px-4 py-3.5 outline-none focus:border-mugla-cyan focus:ring-4 focus:ring-mugla-cyan/10'

export default function AdminLoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAdminAuthorityDomain()) location.replace(municipalityUrl('/admin/giris'))
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(event.currentTarget)
    try {
      const account = await loginAdmin(String(form.get('email')), String(form.get('password')))
      if (isCrmDomain() && !['super-admin', 'belediye-admin', 'crm'].includes(normalizeAdminRole(account.role))) {
        logoutAdmin()
        throw new Error('Bu portal sadece super admin, belediye admini ve CRM yetkilisi hesaplara aciktir.')
      }
      location.href = isCrmDomain() ? '/crm' : '/admin'
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Giris yapilamadi.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="grid min-h-screen bg-mugla-sand lg:grid-cols-[.9fr_1.1fr]">
    <section className="hidden bg-mugla-navy p-14 text-white lg:flex lg:flex-col">
      <span className="text-sm font-semibold text-white/60">Muğla Büyükşehir Belediyesi</span>
      <div className="my-auto max-w-xl">
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-white/10 text-mugla-cyan"><ShieldCheck size={32}/></span>
        <h1 className="mt-8 text-5xl font-bold leading-tight">{isSuperAdminDomain() ? 'Super admin merkezi tum portallari tek otoriteden kontrol eder.' : isCrmDomain() ? 'CRM verileri ozel yetkili panelde toplanir.' : 'Belediye paneli yalnizca tanimli yetkililere aciktir.'}</h1>
        <p className="mt-5 text-lg leading-8 text-white/60">{isSuperAdminDomain() ? 'Belediye yonetim paneli, vatandas paneli, veriler, roller ve kritik baglantilar burada toplanir.' : isCrmDomain() ? 'Sadece super admin, belediye admini ve tanimli CRM yetkilisi ozel CRM paneline erisebilir.' : 'Super admin, admin ve yetkili rollerinden biri tanimli olmayan kullanici bu panele giremez.'}</p>
      </div>
    </section>

    <section className="grid place-items-center p-6">
      <div className="w-full max-w-md">
        <p className="mb-8 text-sm font-semibold text-mugla-navy/55 lg:hidden">Muğla Büyükşehir Belediyesi</p>
        <p className="text-xs font-bold tracking-[.2em] text-mugla-orange">YETKILI GIRISI</p>
        <h2 className="mt-2 text-3xl font-bold">{isSuperAdminDomain() ? 'Super Admin Paneli' : isCrmDomain() ? 'CRM Paneli' : 'Belediye Paneli'}</h2>
        <p className="mt-3 text-sm leading-6 text-mugla-navy/55">{isSuperAdminDomain() ? 'Super admin hesabinin e-posta ve sifresiyle platform paneline giris yap.' : isCrmDomain() ? 'Super admin, belediye admini veya super admin tarafindan CRM yetkilisi olarak tanimlanan hesapla giris yap.' : 'Super admin ve tanimli belediye yetkilileri ayni e-posta ve sifreyle belediye paneline giris yapabilir.'}</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block"><span className="mb-2 block text-sm font-semibold">E-posta</span><input name="email" type="email" required className={field}/></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold">Sifre</span><input name="password" type="password" required className={field}/></label>
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          <Button type="submit" variant="orange" disabled={loading} className="h-14 w-full"><LockKeyhole size={18}/>{loading ? 'Giris yapiliyor...' : isSuperAdminDomain() ? 'Super admin paneline gir' : isCrmDomain() ? 'CRM paneline gir' : 'Belediye paneline gir'}</Button>
        </form>
      </div>
    </section>
  </main>
}
