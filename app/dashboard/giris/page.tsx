'use client'

import Link from 'next/link'
import {Suspense,useMemo,useState} from 'react'
import {useRouter,useSearchParams} from 'next/navigation'
import {ArrowLeft,KeyRound,LogIn} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {muglaDistrictDashboards} from '@/lib/district-dashboards'
import {loginDistrictPanel} from '@/lib/district-auth'

function DistrictLoginForm(){
  const router=useRouter()
  const search=useSearchParams()
  const initial=search.get('district')??'bodrum'
  const[slug,setSlug]=useState(initial)
  const[code,setCode]=useState('')
  const[error,setError]=useState('')
  const district=useMemo(()=>muglaDistrictDashboards.find(item=>item.slug===slug)??muglaDistrictDashboards[0],[slug])

  function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault()
    setError('')
    try{
      loginDistrictPanel(slug,code)
      router.push(`/dashboard/${slug}`)
    }catch(error){
      setError(error instanceof Error?error.message:'Giris yapilamadi.')
    }
  }

  return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6"><section className="w-full max-w-xl rounded-[32px] bg-white p-8 shadow-soft"><Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-mugla-navy/60 hover:text-mugla-blue"><ArrowLeft size={16}/> Dashboardlara don</Link><span className="grid h-16 w-16 place-items-center rounded-2xl bg-mugla-navy text-white"><KeyRound size={28}/></span><p className="mt-6 text-xs font-bold tracking-[.2em] text-mugla-orange">AYRI ILCE PANELI</p><h1 className="mt-2 text-3xl font-bold">{district.name} Dashboard Girisi</h1><p className="mt-3 leading-7 text-mugla-navy/55">Her ilcenin paneli kendi giris kodu ve API adresiyle ayrildi.</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold">Ilce paneli</span><select value={slug} onChange={event=>setSlug(event.target.value)} className="w-full rounded-2xl border border-mugla-navy/10 bg-white px-4 py-3 outline-none focus:border-mugla-cyan">{muglaDistrictDashboards.map(item=><option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-semibold">Panel giris kodu</span><input value={code} onChange={event=>setCode(event.target.value)} placeholder={district.accessCode} className="w-full rounded-2xl border border-mugla-navy/10 px-4 py-3 outline-none focus:border-mugla-cyan"/></label><div className="rounded-2xl bg-mugla-sand p-4 text-sm text-mugla-navy/60"><b className="text-mugla-navy">API:</b> {district.apiPath}<br/><b className="text-mugla-navy">Demo kod:</b> {district.accessCode}</div>{error&&<p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}<Button type="submit" variant="orange" className="w-full"><LogIn size={17}/> Ilce Paneline Gir</Button></form></section></main>
}

export default function DistrictLoginPage(){
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-mugla-sand p-6"><div className="rounded-3xl bg-white p-8 shadow-soft">Giris hazirlaniyor...</div></main>}><DistrictLoginForm/></Suspense>
}
