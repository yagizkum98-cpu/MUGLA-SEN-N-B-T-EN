'use client'

import Image from 'next/image'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useEffect, useState} from 'react'
import {FolderKanban, Home, LogOut, ShieldCheck, ShoppingCart, UserRound, UsersRound} from 'lucide-react'
import {cn} from '@/lib/utils'
import {getCurrentUser, logoutUser, type LocalUser} from '@/lib/local-auth'
import {getCurrentAdmin, logoutAdmin, type AdminAccount} from '@/lib/admin-auth'

const citizen = [
  ['/vatandas/panel#panelim', 'Panelim', Home],
  ['/projeler', 'Projeler', FolderKanban],
  ['/vatandas/panel#sepetim', 'Sepetim', ShoppingCart],
  ['/vatandas/panel#profil', 'Profil', UserRound],
] as const

const admin = [
  ['/admin', 'Belediye Yonetimi', ShieldCheck],
  ['/dashboard', 'Ilce Dashboardlari', Home],
  ['/projeler', 'Proje Verileri', FolderKanban],
  ['/crm', 'CRM', UsersRound],
] as const

export function AppShell({children, role = 'citizen'}: {children: React.ReactNode; role?: 'citizen' | 'admin'}) {
  const path = usePathname()
  const links = role === 'admin' ? admin : citizen
  const [user, setUser] = useState<LocalUser | null>(null)
  const [adminUser, setAdminUser] = useState<AdminAccount | null>(null)

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
    <aside className="flex bg-mugla-navy p-4 text-white md:sticky md:top-0 md:h-screen md:w-64 md:flex-col md:p-6">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white p-1 shadow-sm">
          <Image src="/partners/mugla-buyuksehir.png" alt="Mugla Buyuksehir Belediyesi" width={720} height={721} className="h-full w-full object-contain"/>
        </span>
        <span className="font-bold leading-tight">Mugla<br/><small className="font-normal tracking-wider text-white/65">Senin Butcen</small></span>
      </Link>
      <nav className="flex gap-2 overflow-x-auto md:flex-col">
        {links.map(([href, label, Icon]) => {
          const active = path === href.split('#')[0].split('?')[0]
          return <Link key={href} href={href} className={cn('flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/65 hover:bg-white/10 hover:text-white', active && 'bg-white text-mugla-navy hover:bg-white hover:text-mugla-navy')}>
            <Icon size={18}/>{label}
          </Link>
        })}
      </nav>
      <div className="mt-auto hidden rounded-lg bg-white/10 p-4 md:block">
        <p className="text-sm font-semibold">{displayName ?? (role === 'admin' ? 'Yonetim' : 'Vatandas')}</p>
        <p className="text-xs text-white/55">{displayNote}</p>
        {(user || adminUser) && <button type="button" onClick={signOut} className="mt-3 flex items-center gap-2 text-xs text-white/55 hover:text-white"><LogOut size={14}/> Cikis</button>}
      </div>
    </aside>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
}
