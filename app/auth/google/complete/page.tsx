'use client'

import {useEffect,useState} from 'react'
import Link from 'next/link'
import {Loader2,ShieldCheck} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {createClient} from '@/lib/supabase/client'
import {loginWithGoogleUser} from '@/lib/local-auth'

function safeNext(){
  if(typeof location==='undefined')return'/vatandas/panel'
  const requested=new URLSearchParams(location.search).get('next')??'/vatandas/panel'
  return requested.startsWith('/')&&!requested.startsWith('//')?requested:'/vatandas/panel'
}

export default function GoogleCompletePage(){
  const[error,setError]=useState('')

  useEffect(()=>{
    let active=true
    async function complete(){
      try{
        const supabase=createClient()
        const{data,error}=await supabase.auth.getUser()
        if(error)throw error
        const user=data.user
        if(!user?.email)throw new Error('Google hesabi e-posta bilgisi donmedi.')
        loginWithGoogleUser({
          externalId:user.id,
          email:user.email,
          name:String(user.user_metadata?.full_name||user.user_metadata?.name||user.email.split('@')[0]),
          avatarUrl:String(user.user_metadata?.avatar_url||''),
        })
        location.replace(safeNext())
      }catch(cause){
        if(active)setError(cause instanceof Error?cause.message:'Google girisi tamamlanamadi.')
      }
    }
    complete()
    return()=>{active=false}
  },[])

  return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-soft">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mugla-navy text-white">
        {error?<ShieldCheck size={30}/>:<Loader2 size={30} className="animate-spin"/>}
      </span>
      <p className="mt-6 text-xs font-bold tracking-[.2em] text-mugla-orange">GOOGLE GIRISI</p>
      <h1 className="mt-2 text-3xl font-bold">{error?'Giris tamamlanamadi':'Hesabin hazirlaniyor'}</h1>
      <p className="mt-3 leading-7 text-mugla-navy/55">{error||'Google hesabin dogrulandi, vatandas paneli oturumu aciliyor.'}</p>
      {error&&<Link href="/giris" className="mt-7 inline-flex"><Button variant="orange">Giris sayfasina don</Button></Link>}
    </section>
  </main>
}
