'use client'

import {useEffect,useState} from 'react'
import Link from 'next/link'
import {Loader2,ShieldCheck} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {loginWithEdevletUser} from '@/lib/local-auth'

function safeNext(){
  if(typeof location==='undefined')return'/vatandas/panel'
  const requested=new URLSearchParams(location.search).get('next')??'/vatandas/panel'
  return requested.startsWith('/')&&!requested.startsWith('//')?requested:'/vatandas/panel'
}

function decodeProfile(value:string){
  const normalized=value.replace(/-/g,'+').replace(/_/g,'/')
  const padded=normalized.padEnd(Math.ceil(normalized.length/4)*4,'=')
  return JSON.parse(decodeURIComponent(escape(atob(padded)))) as {externalId:string;name:string;email?:string;phone?:string;identityReference?:string}
}

export default function EdevletCompletePage(){
  const[error,setError]=useState('')

  useEffect(()=>{
    try{
      const params=new URLSearchParams(location.search)
      if(params.get('error'))throw new Error('e-Devlet dogrulama cevabi tamamlanamadi.')
      const profileParam=params.get('profile')
      const profile=profileParam?decodeProfile(profileParam):null
      if(!profile)throw new Error('e-Devlet profil bilgisi alinamadi.')
      loginWithEdevletUser(profile)
      location.replace(safeNext())
    }catch(cause){
      setError(cause instanceof Error?cause.message:'e-Devlet girisi tamamlanamadi.')
    }
  },[])

  return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-soft">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#c62828] text-white">
        {error?<ShieldCheck size={30}/>:<Loader2 size={30} className="animate-spin"/>}
      </span>
      <p className="mt-6 text-xs font-bold tracking-[.2em] text-mugla-orange">E-DEVLET GIRISI</p>
      <h1 className="mt-2 text-3xl font-bold">{error?'Giris tamamlanamadi':'Kimlik dogrulaniyor'}</h1>
      <p className="mt-3 leading-7 text-mugla-navy/55">{error||'e-Devlet dogrulamasi alindi, vatandas paneli oturumu aciliyor.'}</p>
      {error&&<Link href="/giris" className="mt-7 inline-flex"><Button variant="orange">Giris sayfasina don</Button></Link>}
    </section>
  </main>
}
