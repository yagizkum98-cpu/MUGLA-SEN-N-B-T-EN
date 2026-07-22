'use client'

import Image from 'next/image'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useEffect, useState} from 'react'
import {Bell, Building2, ExternalLink, FileBarChart, FolderKanban, Home, LogOut, Settings, ShoppingCart, UserRound, UsersRound, Vote} from 'lucide-react'
import {cn} from '@/lib/utils'
import {getCurrentUser, logoutUser, type LocalUser} from '@/lib/local-auth'
import {getCurrentAdmin, logoutAdmin, normalizeAdminRole, type AdminAccount} from '@/lib/admin-auth'
import {citizenUrl, municipalityUrl, publicUrl} from '@/lib/domain-routing'

const citizen = [
  ['/vatandas/panel#panelim', 'Panelim', Home],
  ['/projeler', 'Projeler', FolderKanban],
  ['/vatandas/panel#sepetim', 'Sepetim', ShoppingCart],
  ['/vatandas/panel#profil', 'Profil', UserRound],
] as const

const admin = [
  {href: '/admin#dashboard', label: 'Dashboard', icon: Home, roles: ['super-admin', 'belediye-admin', 'ilce-yoneticisi', 'degerlendirici', 'crm', 'yetkili']},
  {href: '/admin#projeler', label: 'Projeler', icon: FolderKanban, roles: ['super-admin', 'belediye-admin', 'ilce-yoneticisi', 'degerlendirici', 'yetkili']},
  {href: '/admin#vatandaslar', label: 'Vatandaşlar', icon: UsersRound, roles: ['super-admin', 'belediye-admin', 'crm']},
  {href: '/admin#oylamalar', label: 'Oylamalar', icon: Vote, roles: ['super-admin', 'belediye-admin', 'ilce-yoneticisi']},
  {href: '/admin#ilceler', label: 'İlçeler', icon: Building2, roles: ['super-admin', 'belediye-admin', 'ilce-yoneticisi']},
  {href: '/admin#raporlar', label: 'Raporlar', icon: FileBarChart, roles: ['super-admin', 'belediye-admin', 'ilce-yoneticisi', 'degerlendirici']},
  {href: '/admin#bildirimler', label: 'Bildirimler', icon: Bell, roles: ['super-admin', 'belediye-admin', 'ilce-yoneticisi', 'crm']},
  {href: '/admin#ayarlar', label: 'Ayarlar', icon: Settings, roles: ['super-admin', 'belediye-admin', 'ilce-yoneticisi']},
] as const

const superAdminPortalLinks = [
  {label: 'Landing Page', url: publicUrl('/')},
  {label: 'Kullanıcı', url: citizenUrl('/')},
  {label: 'Belediye', url: municipalityUrl('/')},
] as const

export function AppShell({children, role = 'citizen'}: {children: React.ReactNode; role?: 'citizen' | 'admin'}) {
  const path = usePathname()
  const [user, setUser] = useState<LocalUser | null>(null)
  const [adminUser, setAdminUser] = useState<AdminAccount | null>(null)
  const adminRole = normalizeAdminRole(adminUser?.role)
  const links = role === 'admin' ? admin.filter(link => (link.roles as readonly string[]).includes(adminRole)) : citizen

  useEffect(() => {
    const sync = () => {
      setUser(getCurrentUser())
      if (role === 'admin') getCurrentAdmin().then(setAdminUser)
    }
    sync()
    window.addEventListener('mugla-auth-session-changed', sync)
    window.addEventListener('mugla-admin-auth-changed', sync)
    return () => {
      window.removeEventListener('mugla-auth-session-changed', sync)
      window.removeEventListener('mugla-admin-auth-changed', sync)
    }
  }, [role])

  function signOut() {
    if (role === 'admin') {
      logoutAdmin()
      location.replace('/admin/giris')
      return
    }
    logoutUser()
    location.replace('/giris')
  }

  const displayName = role === 'admin' ? adminUser?.name : user?.name
  const displayNote = role === 'admin' ? adminUser?.role : user ? `${user.district} - dogrulanmis` : 'MVP panel'

  return <div className="min-h-screen bg-mugla-sand md:flex">
    <aside className={cn('bg-mugla-navy text-white md:sticky md:top-0 md:h-screen md:w-64 md:p-6', role === 'citizen' ? 'fixed inset-x-0 bottom-0 z-40 order-last p-2 md:relative md:inset-auto md:flex md:flex-col' : 'flex p-4 md:flex-col')}>
      <Link href="/" className={cn('mb-8 flex items-center gap-3', role === 'citizen' && 'hidden md:flex')}>
        <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white p-1 shadow-sm">
          <Image src="/partners/mugla-buyuksehir.png" alt="Mugla Buyuksehir Belediyesi" width={720} height={721} className="h-full w-full object-contain"/>
        </span>
        <span className="font-bold leading-tight">Mugla<br/><small className="font-normal tracking-wider text-white/65">Senin Butcen</small></span>
      </Link>
      <nav className={cn('flex gap-2 overflow-x-auto md:flex-col', role === 'citizen' && 'justify-around md:justify-start')}>
        {links.map((link) => {
          const [href, label, Icon] = Array.isArray(link) ? link : [link.href, link.label, link.icon]
          const active = path === href.split('#')[0].split('?')[0]
          return <Link key={href} href={href} className={cn('flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/65 hover:bg-white/10 hover:text-white', role === 'citizen' && 'flex-1 flex-col gap-1 px-2 py-2 text-center text-[11px] md:flex-row md:gap-3 md:px-4 md:py-3 md:text-sm', active && 'bg-white text-mugla-navy hover:bg-white hover:text-mugla-navy')}>
            <Icon size={18}/>{label}
          </Link>
        })}
      </nav>
      {role === 'admin' && adminRole === 'super-admin' && (
        <section className="mt-auto hidden rounded-lg border border-white/10 bg-white/5 p-3 md:block">
          <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-white/45">Portal Linkleri</p>
          <div className="grid gap-2">
            {superAdminPortalLinks.map((item) => (
              <a key={item.label} href={item.url} className="group rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white/75 transition hover:bg-white hover:text-mugla-navy">
                <span className="flex items-center justify-between gap-2">
                  <span>{item.label}</span>
                  <ExternalLink size={13}/>
                </span>
                <span className="mt-1 block truncate text-[10px] font-semibold opacity-65">{item.url.replace('https://', '')}</span>
              </a>
            ))}
          </div>
        </section>
      )}
      <div className={cn('hidden rounded-lg bg-white/10 p-4 md:block', role === 'admin' && adminRole === 'super-admin' ? 'mt-3' : 'mt-auto')}>
        <p className="text-sm font-semibold">{displayName ?? (role === 'admin' ? 'Yönetim' : 'Vatandaş')}</p>
        <p className="text-xs text-white/55">{displayNote}</p>
        {(user || adminUser) && <button type="button" onClick={signOut} className="mt-3 flex items-center gap-2 text-xs text-white/55 hover:text-white"><LogOut size={14}/> Çıkış</button>}
      </div>
    </aside>
    <div className={cn('min-w-0 flex-1', role === 'citizen' && 'pb-20 md:pb-0')}>{children}</div>
  </div>
}
