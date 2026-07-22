'use client'

import Link from 'next/link'
import {useEffect,useState} from 'react'
import {LogIn} from 'lucide-react'
import {Button} from '@/components/ui/button'
import type {MuglaDistrictDashboard} from '@/lib/district-dashboards'
import {getDistrictSession} from '@/lib/district-auth'
import {getCurrentAdmin, normalizeAdminRole} from '@/lib/admin-auth'

export function DistrictPanelGate({district,children}:{district:MuglaDistrictDashboard;children:React.ReactNode}){
  const[allowed,setAllowed]=useState(false)
  const[ready,setReady]=useState(false)

  useEffect(()=>{
    let mounted = true
    async function checkAccess() {
      const sessionAllowed = Boolean(getDistrictSession(district.slug))
      const admin = await getCurrentAdmin()
      const role = normalizeAdminRole(admin?.role)
      const adminAllowed = role === 'super-admin' || role === 'belediye-admin' || ((role === 'ilce-yoneticisi' || role === 'yetkili') && admin?.district === district.name)
      if (!mounted) return
      setAllowed(sessionAllowed || adminAllowed)
      setReady(true)
    }
    checkAccess()
    return () => {mounted = false}
  },[district.name, district.slug])

  if(!ready)return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6"><div className="rounded-3xl bg-white p-8 shadow-soft">Panel kontrol ediliyor...</div></main>

  if(!allowed)return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6"><section className="w-full max-w-lg rounded-[32px] bg-white p-8 text-center shadow-soft"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mugla-navy text-white"><LogIn size={28}/></span><p className="mt-6 text-xs font-bold tracking-[.2em] text-mugla-orange">ILCE PANEL GIRISI GEREKLI</p><h1 className="mt-2 text-3xl font-bold">{district.name} Paneli</h1><p className="mt-3 leading-7 text-mugla-navy/55">Bu ilce dashboardu icin ayri panel girisi tanimlandi. Devam etmek icin ilce panel koduyla giris yapin.</p><Link className="mt-7 inline-flex" href={`/dashboard/giris?district=${district.slug}`}><Button variant="orange"><LogIn size={17}/> Panel Girisine Git</Button></Link></section></main>

  return children
}
