'use client'

import Image from 'next/image'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useEffect,useState} from 'react'
import {BarChart3,FolderKanban,Home,LogOut,Map,ShieldCheck,Sparkles,UsersRound,Vote} from 'lucide-react'
import {cn} from '@/lib/utils'
import {getCurrentUser,logoutUser,type LocalUser} from '@/lib/local-auth'

const citizen=[
  ['/vatandas/panel','Panelim',Home],
  ['/projeler','Projeler ve Harita',Map],
  ['/vatandas/panel#oylar','Basvurularim',Vote],
] as const

const admin=[
  ['/admin','Yonetim Paneli',ShieldCheck],
  ['/admin#projeler','Proje Yonetimi',FolderKanban],
  ['/crm','CRM Merkezi',UsersRound],
  ['/crm?view=moderation','AI Moderasyon',Sparkles],
  ['/crm?view=analytics','BI & Analitik',BarChart3],
] as const

export function AppShell({children,role='citizen'}:{children:React.ReactNode;role?:'citizen'|'admin'}){
  const path=usePathname()
  const links=role==='admin'?admin:citizen
  const[user,setUser]=useState<LocalUser|null>(null)

  useEffect(()=>{
    const sync=()=>setUser(getCurrentUser())
    sync()
    window.addEventListener('mugla-auth-session-changed',sync)
    return()=>window.removeEventListener('mugla-auth-session-changed',sync)
  },[])

  function signOut(){
    logoutUser()
    location.replace('/giris')
  }

  return <div className="min-h-screen bg-mugla-sand md:flex"><aside className="flex bg-mugla-navy p-6 text-white md:sticky md:top-0 md:h-screen md:w-72 md:flex-col"><Link href="/" className="mb-10 flex items-center gap-3"><span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-white p-1 shadow-sm"><Image src="/partners/mugla-buyuksehir.png" alt="T.C. Mugla Buyuksehir Belediyesi" width={720} height={721} className="h-full w-full object-contain"/></span><span className="font-bold leading-tight">MUGLA<br/><small className="font-normal tracking-wider text-white/65">SENIN BUTCEN</small></span></Link><nav className="flex gap-2 overflow-x-auto md:flex-col">{links.map(([href,label,Icon])=><Link key={href} href={href} className={cn('flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/65 hover:bg-white/10 hover:text-white',path===href.split('#')[0].split('?')[0]&&'bg-white text-mugla-navy hover:bg-white hover:text-mugla-navy')}><Icon size={18}/>{label}</Link>)}</nav><div className="mt-auto hidden rounded-2xl bg-white/10 p-4 md:block"><p className="text-sm font-semibold">{user?.name??'Vatandas Paneli'}</p><p className="text-xs text-white/55">{user?`${user.district} · Dogrulanmis`:'Kayitli kullanici girisi'}</p>{user&&<button type="button" onClick={signOut} className="mt-3 flex items-center gap-2 text-xs text-white/55 hover:text-white"><LogOut size={14}/> Guvenli cikis</button>}</div></aside><div className="min-w-0 flex-1">{children}</div></div>
}
