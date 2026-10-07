'use client'

import Link from 'next/link'
import Image from 'next/image'
import {useEffect, useState} from 'react'
import {usePathname} from 'next/navigation'
import {Menu, X} from 'lucide-react'
import {publicNavigation, legalNavigation, isPublicPage} from '@/lib/site-navigation'
import {SiteUserMenu} from '@/components/site-user-menu'

export function PublicSiteShell({children}: {children: React.ReactNode}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  if (!isPublicPage(pathname)) return <>{children}</>

  return <>
    <a href="#site-content" className="fixed left-3 top-3 z-[100] -translate-y-24 rounded bg-white px-4 py-3 font-bold text-mugla-navy shadow focus:translate-y-0">Ana içeriğe git</a>
    <header className="relative z-40 border-b border-mugla-navy/10 bg-white text-mugla-navy">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          <Image src="/partners/mugla-buyuksehir.png" alt="Muğla Büyükşehir Belediyesi" width={48} height={48} className="h-12 w-12 object-contain"/>
          <span className="text-sm font-bold leading-5">Muğla<br/><span className="text-mugla-orange">Bütçe Senin</span></span>
        </Link>
        <nav aria-label="Ana menü" className="hidden flex-wrap items-center gap-4 text-sm font-semibold xl:flex">
          {publicNavigation.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined} className={pathname === item.href ? 'text-mugla-orange' : 'hover:text-mugla-orange'}>{item.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <SiteUserMenu showLogin/>
          <button type="button" aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'} title={open ? 'Menüyü kapat' : 'Menüyü aç'} aria-expanded={open} aria-controls="public-mobile-menu" onClick={() => setOpen(value => !value)} className="grid h-10 w-10 shrink-0 place-items-center rounded border border-mugla-navy/15 xl:hidden">{open ? <X size={21}/> : <Menu size={21}/>}</button>
        </div>
        {open && <nav id="public-mobile-menu" aria-label="Mobil menü" className="grid w-full gap-1 border-t border-mugla-navy/10 pt-3 xl:hidden">
          {publicNavigation.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={pathname === item.href ? 'page' : undefined} className="px-2 py-3 text-sm font-semibold hover:bg-mugla-navy/5">{item.label}</Link>)}
        </nav>}
      </div>
    </header>
    <div id="site-content" tabIndex={-1}>{children}</div>
    <footer className="border-t border-mugla-navy/10 bg-white px-5 pb-24 pt-8 text-mugla-navy">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold">Muğla Büyükşehir Belediyesi · Bütçe Senin</p>
        <nav aria-label="Alt menü" className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {publicNavigation.map(item => <Link key={item.href} href={item.href} className="hover:text-mugla-orange">{item.label}</Link>)}
          <Link href="/fikir-gonder">Fikir Gönder</Link><Link href="/kitapcik">Kitapçık</Link>
        </nav>
        <nav aria-label="Yasal bilgiler" className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-mugla-navy/10 pt-4 text-xs text-mugla-navy/70">
          {legalNavigation.map(item => <Link key={item.href} href={item.href} className="hover:text-mugla-orange">{item.label}</Link>)}
        </nav>
      </div>
    </footer>
  </>
}
