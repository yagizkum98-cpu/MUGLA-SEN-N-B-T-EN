'use client'

import {FormEvent,useState} from 'react'
import Link from 'next/link'
import {ArrowLeft,CheckCircle2,LockKeyhole,ShieldCheck} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {loginWithEdevletUser} from '@/lib/local-auth'

const field='w-full rounded-2xl border border-mugla-navy/15 bg-white px-4 py-3.5 outline-none focus:border-[#c62828] focus:ring-4 focus:ring-red-100'

type EdevletProfile={
  name:string
  identity:string
  email:string
  phone:string
}

function safeNext(){
  if(typeof location==='undefined')return'/vatandas/panel'
  const requested=new URLSearchParams(location.search).get('next')??'/vatandas/panel'
  return requested.startsWith('/')&&!requested.startsWith('//')?requested:'/vatandas/panel'
}

function maskIdentity(value:string){
  const clean=value.replace(/\D/g,'')
  return clean.length===11?`${clean.slice(0,3)}******${clean.slice(-2)}`:clean
}

export default function EdevletLoginPage(){
  const[step,setStep]=useState<'login'|'consent'>('login')
  const[profile,setProfile]=useState<EdevletProfile|null>(null)
  const[error,setError]=useState('')

  function submitLogin(event:FormEvent<HTMLFormElement>){
    event.preventDefault()
    setError('')
    const data=new FormData(event.currentTarget)
    const identity=String(data.get('identity')).replace(/\D/g,'')
    const password=String(data.get('password'))
    const name=String(data.get('name')).trim()
    if(identity.length!==11){setError('T.C. kimlik numarasi 11 haneli olmalidir.');return}
    if(password.length<4){setError('e-Devlet sifresi girilmelidir.');return}
    if(name.length<3){setError('Ad soyad alani zorunludur.');return}
    setProfile({
      identity,
      name,
      email:String(data.get('email')).trim(),
      phone:String(data.get('phone')).trim(),
    })
    setStep('consent')
  }

  function approve(){
    if(!profile)return
    loginWithEdevletUser({
      externalId:`edevlet-${profile.identity}`,
      name:profile.name,
      email:profile.email||`edevlet-${profile.identity}@edevlet.local`,
      phone:profile.phone,
      identityReference:maskIdentity(profile.identity),
    })
    location.replace(safeNext())
  }

  return <main className="grid min-h-screen bg-[#f4f1e8] lg:grid-cols-[.9fr_1.1fr]">
    <section className="hidden bg-[#b71c1c] p-14 text-white lg:flex lg:flex-col">
      <Link href="/giris" className="inline-flex items-center gap-2 text-sm text-white/70"><ArrowLeft size={16}/> Girise don</Link>
      <div className="my-auto max-w-xl">
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-white/10"><ShieldCheck size={34}/></span>
        <h1 className="mt-8 text-5xl font-bold leading-tight">e-Devlet ile guvenli vatandas dogrulamasi</h1>
        <p className="mt-5 text-lg leading-8 text-white/70">Bu demo akisi, kurum OIDC entegrasyonu aktif olana kadar kullanici deneyimini eksiksiz gostermek icin tasarlandi.</p>
      </div>
      <p className="text-xs text-white/50">Turkiye.gov.tr benzeri dogrulama deneyimi</p>
    </section>

    <section className="grid place-items-center p-6">
      <div className="w-full max-w-lg">
        <Link href="/giris" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-mugla-navy/55 lg:hidden"><ArrowLeft size={16}/> Girise don</Link>
        {step==='login'?<div>
          <p className="text-xs font-bold tracking-[.2em] text-[#c62828]">E-DEVLET GIRIS</p>
          <h2 className="mt-2 text-3xl font-bold">e-Devlet giris yap</h2>
          <p className="mt-3 text-sm leading-6 text-mugla-navy/55">T.C. kimlik numaran ve e-Devlet sifrenle devam et. Bu demo ortaminda bilgiler yalnizca tarayicindaki vatandas oturumu icin kullanilir.</p>
          <form onSubmit={submitLogin} className="mt-7 space-y-4 rounded-3xl bg-white p-6 shadow-soft">
            <label className="block"><span className="mb-2 block text-sm font-semibold">T.C. kimlik numarasi</span><input name="identity" required inputMode="numeric" maxLength={11} className={field} placeholder="11 haneli kimlik numarasi"/></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">e-Devlet sifresi</span><input name="password" required type="password" className={field} placeholder="e-Devlet sifresi"/></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Ad Soyad</span><input name="name" required autoComplete="name" className={field} placeholder="Ad Soyad"/></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">E-posta</span><input name="email" type="email" className={field} placeholder="istege bagli"/></label>
              <label><span className="mb-2 block text-sm font-semibold">Telefon</span><input name="phone" type="tel" className={field} placeholder="istege bagli"/></label>
            </div>
            {error&&<p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
            <Button type="submit" className="h-14 w-full bg-[#c62828] hover:bg-[#a91e1e]"><LockKeyhole size={18}/> Giris yap</Button>
          </form>
        </div>:<div>
          <p className="text-xs font-bold tracking-[.2em] text-[#c62828]">BILGI PAYLASIM IZNI</p>
          <h2 className="mt-2 text-3xl font-bold">Paylasilacak bilgileri onayla</h2>
          <p className="mt-3 text-sm leading-6 text-mugla-navy/55">Devam ettiginde asagidaki bilgiler Mugla Senin Butcen vatandas paneli icin dogrulanmis hesap kaydina aktarilir.</p>
          <section className="mt-7 rounded-3xl bg-white p-6 shadow-soft">
            {[
              ['Ad Soyad',profile?.name],
              ['T.C. Kimlik No',profile?maskIdentity(profile.identity):''],
              ['Dogrulama yontemi','e-Devlet'],
              ['E-posta',profile?.email||'Paylasilmadi'],
              ['Telefon',profile?.phone||'Paylasilmadi'],
            ].map(([label,value])=><div key={label} className="flex items-center justify-between gap-4 border-b border-mugla-navy/10 py-4 text-sm last:border-0"><span className="text-mugla-navy/55">{label}</span><b className="text-right">{value}</b></div>)}
            <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm leading-6 text-green-800"><CheckCircle2 className="mb-2"/><b>Dogrulanmis Kullanici</b> rozeti tanimlanacak ve vatandas panelin acilacak.</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={()=>setStep('login')}>Geri don</Button>
              <Button type="button" onClick={approve} className="bg-[#c62828] hover:bg-[#a91e1e]"><ShieldCheck size={18}/> Devam et</Button>
            </div>
          </section>
        </div>}
      </div>
    </section>
  </main>
}
