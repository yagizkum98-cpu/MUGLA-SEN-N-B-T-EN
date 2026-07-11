'use client'

import Link from 'next/link'
import {useEffect,useMemo,useState} from 'react'
import {ArrowUpRight,Database,FileText,Lightbulb,LogOut,ShieldCheck,UserRound,Vote} from 'lucide-react'
import {AppShell} from '@/components/app-shell'
import {Button} from '@/components/ui/button'
import {Card,CardContent,CardHeader} from '@/components/ui/card'
import {getCurrentUser,logoutUser,type LocalUser} from '@/lib/local-auth'
import {formatBudget,useProjects} from '@/lib/projects-store'

function Metric({label,value,note,icon:Icon}:{label:string;value:string;note:string;icon:typeof UserRound}){
  return <Card><CardContent className="flex min-h-28 items-center gap-4 pt-6"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mugla-navy text-white"><Icon size={22}/></span><div className="min-w-0"><p className="text-sm text-mugla-navy/55">{label}</p><b className="mt-1 block break-words text-2xl">{value}</b><p className="mt-1 text-xs text-mugla-navy/45">{note}</p></div></CardContent></Card>
}

export function CitizenDashboard(){
  const[user,setUser]=useState<LocalUser|null>(null)
  const{projects}=useProjects()

  useEffect(()=>{
    const current=getCurrentUser()
    if(!current){location.replace('/giris?next=/vatandas/panel');return}
    setUser(current)
  },[])

  const myProjects=useMemo(()=>user?projects.filter(project=>project.ownerId===user.id||project.ownerEmail===user.email):[],[projects,user])
  const districtProjects=useMemo(()=>user?projects.filter(project=>project.district===user.district&&project.moderationStatus==='Onaylandı'):[],[projects,user])
  const totalVotes=myProjects.reduce((sum,project)=>sum+project.votes,0)
  const active=myProjects.filter(project=>project.moderationStatus==='Onaylandı'&&project.status==='Oylamada')
  const pending=myProjects.filter(project=>project.moderationStatus==='Bekliyor'||project.status==='Başvuru')

  function signOut(){
    logoutUser()
    location.replace('/giris')
  }

  if(!user)return <main className="grid min-h-screen place-items-center bg-mugla-sand"><p className="font-semibold text-mugla-navy/55">Vatandas oturumu kontrol ediliyor...</p></main>

  return <AppShell><header className="flex flex-wrap items-center justify-between gap-4 border-b border-mugla-navy/10 bg-white px-6 py-5 lg:px-10"><div><p className="text-xs font-bold tracking-[.2em] text-mugla-orange">KISISEL VATANDAS PANELI</p><h1 className="text-2xl font-bold">{user.name}</h1><p className="mt-1 text-sm text-mugla-navy/55">{user.district} · {user.verifiedBadge}</p></div><div className="flex flex-wrap gap-3"><Link href="/fikir-gonder"><Button variant="orange"><Lightbulb size={17}/> Fikir Gonder</Button></Link><Button type="button" variant="outline" onClick={signOut}><LogOut size={17}/> Guvenli cikis</Button></div></header><div className="space-y-8 p-6 lg:p-10">
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="Basvurularim" value={String(myProjects.length)} note={`${pending.length} basvuru inceleme bekliyor`} icon={FileText}/>
      <Metric label="Aktif fikirlerim" value={String(active.length)} note="Onaylanip oylamaya acilanlar" icon={Vote}/>
      <Metric label="Toplam destek" value={totalVotes.toLocaleString('tr-TR')} note="Fikirlerime gelen oy" icon={ShieldCheck}/>
      <Metric label="Ilcemde proje" value={String(districtProjects.length)} note={`${user.district} acik proje sayisi`} icon={UserRound}/>
    </section>

    <section className="grid gap-6 xl:grid-cols-[1fr_.85fr]">
      <Card><CardHeader><p className="text-xs font-bold tracking-widest text-mugla-cyan">VATANDAS API</p><h2 className="text-xl font-bold">Kisisel veri servisi</h2></CardHeader><CardContent className="space-y-4"><div className="rounded-2xl bg-mugla-sand p-4"><p className="text-xs text-mugla-navy/50">Panel adresi</p><Link href={user.panelPath} className="mt-1 block break-all font-bold text-mugla-blue">{user.panelPath}</Link></div><div className="rounded-2xl bg-mugla-sand p-4"><p className="text-xs text-mugla-navy/50">API adresi</p><Link href={user.apiPath} className="mt-1 flex items-center gap-2 break-all font-bold text-mugla-blue"><Database size={17}/>{user.apiPath}</Link></div><p className="text-sm leading-6 text-mugla-navy/55">Demo ortaminda hesap verisi tarayicida tutulur. Bu endpoint vatandas panel entegrasyonu icin ayrilmis API sozlesmesini gosterir.</p></CardContent></Card>

      <Card className="bg-mugla-navy text-white"><CardHeader><UserRound className="text-mugla-cyan"/><p className="text-xs font-bold tracking-widest text-mugla-cyan">KAYIT BILGILERI</p><h2 className="text-xl font-bold">Giris yapan vatandas</h2></CardHeader><CardContent className="space-y-3 text-sm"><div className="rounded-2xl bg-white/10 p-4"><span className="text-white/55">E-posta</span><b className="mt-1 block break-all">{user.email}</b></div><div className="rounded-2xl bg-white/10 p-4"><span className="text-white/55">Telefon</span><b className="mt-1 block">{user.phone}</b></div><div className="rounded-2xl bg-white/10 p-4"><span className="text-white/55">Dogrulama</span><b className="mt-1 block">{user.verificationMethod}</b></div></CardContent></Card>
    </section>

    <Card id="oylar"><CardHeader className="flex-row items-center justify-between"><div><p className="text-xs font-bold tracking-widest text-mugla-cyan">BASVURULARIM</p><h2 className="mt-1 text-xl font-bold">Kendi fikirlerim ve durumlari</h2></div><Link className="text-sm font-semibold text-mugla-blue" href="/projeler">Projeleri gor <ArrowUpRight className="inline" size={15}/></Link></CardHeader><CardContent className="space-y-3">{myProjects.length?myProjects.map(project=><div key={project.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-mugla-navy/10 p-4"><span className="h-14 w-2 rounded-full" style={{background:project.color}}/><div className="min-w-0 flex-1"><p className="font-bold">{project.title}</p><p className="mt-1 text-xs text-mugla-navy/50">{project.district} · {project.category}{project.subcategory?` / ${project.subcategory}`:''} · {project.moderationStatus}</p></div><div className="grid grid-cols-2 gap-3 text-right text-sm"><span><b className="block">{project.votes}</b>destek</span><span><b className="block">{formatBudget(project.budget)}</b>butce</span></div></div>):<div className="py-14 text-center text-mugla-navy/45"><Lightbulb className="mx-auto mb-3"/><p className="font-semibold">Henuz fikir basvurunuz yok.</p><Link href="/fikir-gonder" className="mt-4 inline-flex"><Button variant="orange">Ilk fikrimi gonder</Button></Link></div>}</CardContent></Card>
  </div></AppShell>
}
