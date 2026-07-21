'use client'

import Link from 'next/link'
import {useEffect, useMemo, useState} from 'react'
import {BookOpen, FolderKanban, Home, LogOut, Mail, MessageCircleQuestion, UserRound} from 'lucide-react'
import {citizenUrl} from '@/lib/domain-routing'
import {getCurrentUser, logoutUser, type LocalUser} from '@/lib/local-auth'
import {useProjects} from '@/lib/projects-store'

const navItems = [
  {href: '/', label: 'Ana sayfa', icon: Home},
  {href: '/projeler', label: 'Projeler', icon: FolderKanban},
  {href: '/sss', label: 'S.S.S.', icon: MessageCircleQuestion},
  {href: '/kitapcik', label: 'Kitapçık', icon: BookOpen},
  {href: '/iletisim', label: 'İletişim', icon: Mail},
] as const

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(part => part[0]).slice(0, 2).join('').toLocaleUpperCase('tr') || 'V'
}

function Avatar({user, className = 'h-10 w-10'}: {user: LocalUser; className?: string}) {
  return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-mugla-navy text-sm font-black text-white shadow-sm ${className}`}>
    {user.avatarUrl ? <img src={user.avatarUrl} alt={`${user.name} avatar`} className="h-full w-full object-cover"/> : initials(user.name)}
  </span>
}

export function SiteUserMenu({showLogin = false}: {showLogin?: boolean}) {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [open, setOpen] = useState(false)
  const {projects} = useProjects()

  useEffect(() => {
    const sync = () => setUser(getCurrentUser())
    sync()
    window.addEventListener('mugla-auth-session-changed', sync)
    window.addEventListener('mugla-auth-users-changed', sync)
    return () => {
      window.removeEventListener('mugla-auth-session-changed', sync)
      window.removeEventListener('mugla-auth-users-changed', sync)
    }
  }, [])

  const myProjects = useMemo(() => user ? projects.filter(project => project.ownerId === user.id || project.ownerEmail === user.email) : [], [projects, user])

  function signOut() {
    logoutUser()
    setOpen(false)
    setUser(null)
    location.href = '/'
  }

  if (!user) {
    if (!showLogin) return null
    return <Link href={citizenUrl('/')} className="inline-flex items-center gap-2 rounded-full border border-mugla-navy/15 bg-white px-4 py-2 text-sm font-bold text-mugla-navy hover:border-mugla-orange">
      Giriş yap <UserRound size={16}/>
    </Link>
  }

  return <div className="relative">
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="inline-flex items-center gap-2 rounded-full border border-mugla-navy/10 bg-white p-1.5 pr-3 text-sm font-black text-mugla-navy shadow-sm hover:border-mugla-orange">
      <Avatar user={user}/>
      <span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
    </button>

    {open && <div className="absolute right-0 z-50 mt-3 w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-mugla-navy/10 bg-white text-mugla-navy shadow-2xl">
      <div className="flex items-center gap-3 border-b border-mugla-navy/10 bg-mugla-sand/65 p-4">
        <Avatar user={user} className="h-12 w-12"/>
        <div className="min-w-0">
          <p className="truncate text-sm font-black">{user.name}</p>
          <p className="truncate text-xs font-semibold text-mugla-navy/50">{user.email}</p>
        </div>
      </div>

      <nav className="grid grid-cols-2 gap-2 p-3">
        {navItems.map(({href, label, icon: Icon}) => <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl bg-mugla-sand/60 px-3 py-2 text-xs font-bold text-mugla-navy/70 hover:text-mugla-navy">
          <Icon size={15}/>{label}
        </Link>)}
      </nav>

      <section className="border-t border-mugla-navy/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black">Projelerim</h3>
          <span className="rounded-full bg-mugla-sand px-2 py-0.5 text-[11px] font-bold text-mugla-navy/55">{myProjects.length} başvuru</span>
        </div>
        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
          {myProjects.length ? myProjects.map(project => <Link key={project.id} href="/projeler" onClick={() => setOpen(false)} className="block rounded-xl border border-mugla-navy/10 p-3 hover:border-mugla-orange/50">
            <p className="truncate text-sm font-bold">{project.title}</p>
            <p className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-mugla-navy/45">
              <span>{project.projectCode}</span>
              <span>{project.moderationStatus}</span>
              <span>{project.status}</span>
            </p>
          </Link>) : <div className="rounded-xl border border-dashed border-mugla-navy/15 p-4 text-center text-sm font-semibold text-mugla-navy/45">Henüz başvuru yok.</div>}
        </div>
      </section>

      <div className="border-t border-mugla-navy/10 p-3">
        <button type="button" onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 hover:bg-red-100">
          <LogOut size={16}/> Çıkış yap
        </button>
      </div>
    </div>}
  </div>
}
