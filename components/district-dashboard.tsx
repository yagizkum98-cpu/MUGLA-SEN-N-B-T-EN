'use client'

import Link from 'next/link'
import {motion} from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  FolderKanban,
  LayoutDashboard,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  UsersRound,
  Vote,
  WalletCards,
} from 'lucide-react'
import {AppShell} from '@/components/app-shell'
import {Button} from '@/components/ui/button'
import {Card,CardContent,CardHeader} from '@/components/ui/card'
import {muglaDistrictDashboards,type MuglaDistrictDashboard} from '@/lib/district-dashboards'
import {formatBudget,useProjects} from '@/lib/projects-store'
import {useCrm} from '@/lib/crm-store'

type DistrictDashboardProps={
  district?:MuglaDistrictDashboard
}

function Metric({label,value,note,icon:Icon,color}:{label:string;value:string;note:string;icon:typeof FolderKanban;color:string}){
  return <Card><CardContent className="flex min-h-32 items-center gap-4 pt-6"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${color}`}><Icon size={22}/></span><div className="min-w-0"><p className="text-sm text-mugla-navy/55">{label}</p><strong className="mt-1 block break-words text-2xl">{value}</strong><p className="mt-1 text-xs text-mugla-navy/45">{note}</p></div></CardContent></Card>
}

function StatusBar({label,value,color='bg-mugla-cyan'}:{label:string;value:number;color?:string}){
  return <div><div className="mb-2 flex justify-between text-sm"><span className="text-mugla-navy/60">{label}</span><b>{Math.round(value)}%</b></div><div className="h-2 rounded-full bg-mugla-navy/10"><div className={`h-full rounded-full ${color}`} style={{width:`${Math.min(100,Math.max(0,value))}%`}}/></div></div>
}

export function DistrictDashboard({district}:DistrictDashboardProps){
  const{projects}=useProjects()
  const{citizens}=useCrm()
  const published=projects.filter(project=>project.moderationStatus==='Onaylandı'&&project.status==='Oylamada')
  const scopedProjects=district?projects.filter(project=>project.district===district.name):projects
  const activeProjects=district?published.filter(project=>project.district===district.name):published
  const scopedCitizens=district?citizens.filter(citizen=>citizen.district===district.name):citizens
  const totalBudget=scopedProjects.reduce((sum,project)=>sum+project.budget,0)
  const activeBudget=activeProjects.reduce((sum,project)=>sum+project.budget,0)
  const totalVotes=scopedProjects.reduce((sum,project)=>sum+project.votes,0)
  const completed=scopedProjects.filter(project=>project.status==='Tamamlandı')
  const ongoing=scopedProjects.filter(project=>project.status==='Devam Ediyor')
  const participationRate=citizens.length?scopedCitizens.length/citizens.length*100:0
  const votingRate=scopedProjects.length?activeProjects.length/scopedProjects.length*100:0
  const title=district?`${district.name} Dashboard`:'Mugla Ilce Dashboardlari'

  const metrics=[
    {label:'Proje sayisi',value:String(scopedProjects.length),note:`${activeProjects.length} proje aktif oylamada`,icon:FolderKanban,color:'bg-mugla-orange'},
    {label:'Aktif butce',value:formatBudget(activeBudget),note:`Toplam portfoy ${formatBudget(totalBudget)}`,icon:WalletCards,color:'bg-mugla-green'},
    {label:'Oy kaydi',value:totalVotes.toLocaleString('tr-TR'),note:`Oylama aktifligi %${Math.round(votingRate)}`,icon:Vote,color:'bg-mugla-cyan'},
    {label:'Katilim',value:String(scopedCitizens.length),note:`CRM orani %${Math.round(participationRate)}`,icon:UsersRound,color:'bg-mugla-blue'},
  ]

  return <AppShell><header className="flex flex-wrap items-center justify-between gap-4 border-b border-mugla-navy/10 bg-white px-6 py-5 lg:px-10"><div><p className="text-xs font-bold tracking-[.2em] text-mugla-orange">{district?'ILCE OPERASYON PANELI':'2026 KATILIM DONEMI'}</p><h1 className="text-2xl font-bold">{title}</h1><p className="mt-1 max-w-3xl text-sm text-mugla-navy/55">{district?`${district.name} icin proje, butce, katilim, API ve panel girisi tek dashboardda izlenir.`:'13 ilcenin ayri panel girisi ve kendine ait API adresi vardir.'}</p></div><Link href={district?'/dashboard':'/projeler'}><Button variant="orange">{district?'Genel panele don':'Projeleri kesfet'} <ArrowUpRight size={17}/></Button></Link></header><div className="space-y-8 p-6 lg:p-10">
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map((metric,index)=><motion.div key={metric.label} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:index*.06}}><Metric {...metric}/></motion.div>)}</section>

    {!district&&<Card><CardHeader><div><p className="text-xs font-bold tracking-widest text-mugla-cyan">ILCE DASHBOARDLARI</p><h2 className="mt-1 text-xl font-bold">13 ilcenin ayri paneli ve API adresi</h2><p className="mt-1 text-sm text-mugla-navy/55">Her ilce karti once panel girisine gider. API adresi entegrasyon icin ayrica yayinlanir.</p></div></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{muglaDistrictDashboards.map((item,index)=>{const districtProjects=projects.filter(project=>project.district===item.name);const active=districtProjects.filter(project=>project.moderationStatus==='Onaylandı'&&project.status==='Oylamada');return <motion.div key={item.slug} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.08+index*.025}}><div className="flex min-h-48 flex-col justify-between rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-4"><span className="flex items-center justify-between gap-3"><b>{item.name}</b><LayoutDashboard size={18} className="text-mugla-cyan"/></span><Link href={`/dashboard/giris?district=${item.slug}`} className="mt-4 flex items-center justify-center gap-2 rounded-full bg-mugla-navy px-4 py-2 text-sm font-semibold text-white hover:bg-mugla-blue"><LockKeyhole size={15}/> Panel Girisi</Link><Link href={item.apiPath} className="mt-2 flex items-center justify-center gap-2 rounded-full border border-mugla-navy/10 bg-white px-4 py-2 text-xs font-semibold text-mugla-navy/60 hover:text-mugla-blue"><Database size={14}/> {item.apiPath}</Link><span className="mt-4 grid grid-cols-3 gap-3 text-xs text-mugla-navy/55"><span><strong className="block text-base text-mugla-navy">{districtProjects.length}</strong>proje</span><span><strong className="block text-base text-mugla-navy">{active.length}</strong>aktif</span><span><strong className="block text-base text-mugla-navy">{districtProjects.reduce((sum,project)=>sum+project.votes,0).toLocaleString('tr-TR')}</strong>oy</span></span></div></motion.div>})}</div></CardContent></Card>}

    {district&&<><section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><Card><CardHeader><p className="text-xs font-bold tracking-widest text-mugla-cyan">ILCE API</p><h2 className="text-xl font-bold">{district.name} veri servisi</h2></CardHeader><CardContent className="space-y-4"><div className="rounded-2xl bg-mugla-sand p-4"><p className="text-xs text-mugla-navy/50">API adresi</p><Link href={district.apiPath} className="mt-1 block break-all font-bold text-mugla-blue">{district.apiPath}</Link></div><div className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl bg-mugla-sand p-4"><p className="text-xs text-mugla-navy/50">Katilim</p><b className="text-2xl">{scopedCitizens.length}</b></div><div className="rounded-2xl bg-mugla-sand p-4"><p className="text-xs text-mugla-navy/50">Oy</p><b className="text-2xl">{totalVotes.toLocaleString('tr-TR')}</b></div><div className="rounded-2xl bg-mugla-sand p-4"><p className="text-xs text-mugla-navy/50">Butce</p><b className="text-lg">{formatBudget(totalBudget)}</b></div></div><StatusBar label="Katilim orani" value={participationRate}/><StatusBar label="Oylama aktifligi" value={votingRate} color="bg-mugla-orange"/></CardContent></Card><Card className="bg-mugla-navy text-white"><CardHeader><ShieldCheck className="text-mugla-cyan"/><p className="text-xs font-bold tracking-widest text-mugla-cyan">PANEL ERISIMI</p><h2 className="text-xl font-bold">Ayrilmis ilce yetkisi</h2></CardHeader><CardContent className="space-y-4"><div className="rounded-2xl bg-white/10 p-4"><p className="text-sm text-white/60">Panel</p><b className="text-xl">{district.panelPath}</b></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-sm text-white/60">Giris kodu</p><b className="text-xl">{district.accessCode}</b></div><p className="text-sm leading-6 text-white/60">Bu demo ortaminda giris localStorage oturumu ile tutulur. Gercek ortamda bu alan belediye kimlik sistemi veya rol bazli token ile baglanabilir.</p></CardContent></Card></section><section className="grid gap-6 xl:grid-cols-2"><Card><CardHeader><p className="text-xs font-bold tracking-widest text-mugla-cyan">PROJE DURUMLARI</p><h2 className="text-xl font-bold">Portfoy ozeti</h2></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-mugla-navy/10 p-4"><CheckCircle2 className="text-green-600"/><p className="mt-4 text-sm text-mugla-navy/55">Tamamlanan</p><b className="text-3xl">{completed.length}</b></div><div className="rounded-2xl border border-mugla-navy/10 p-4"><Clock3 className="text-mugla-cyan"/><p className="mt-4 text-sm text-mugla-navy/55">Devam eden</p><b className="text-3xl">{ongoing.length}</b></div></CardContent></Card><Card><CardHeader><p className="text-xs font-bold tracking-widest text-mugla-cyan">BI & ANALITIK</p><h2 className="text-xl font-bold">Ilce performansi</h2></CardHeader><CardContent className="space-y-4"><StatusBar label="Butce kullanimi" value={totalBudget?activeBudget/totalBudget*100:0} color="bg-mugla-green"/><StatusBar label="Tamamlanma orani" value={scopedProjects.length?completed.length/scopedProjects.length*100:0} color="bg-mugla-blue"/><div className="rounded-2xl bg-mugla-sand p-4"><BarChart3 className="text-mugla-orange"/><p className="mt-3 text-sm text-mugla-navy/55">Ilce verileri API ve panel uzerinden ayrilmis durumdadir.</p></div></CardContent></Card></section></>}

    <Card><CardHeader className="flex-row items-center justify-between"><div><p className="text-xs font-bold tracking-widest text-mugla-cyan">PROJELER</p><h2 className="mt-1 text-xl font-bold">{district?`${district.name} gundemindeki projeler`:'Mugla gundemindeki projeler'}</h2></div><Link className="text-sm font-semibold text-mugla-blue" href="/projeler">Tumunu gor {'>'}</Link></CardHeader><CardContent className="space-y-3">{activeProjects.length?activeProjects.slice(0,5).map(project=><Link href="/projeler" key={project.id} className="group flex items-center gap-4 rounded-2xl border border-mugla-navy/10 p-4 hover:border-mugla-blue/40 hover:bg-mugla-sand/60"><span className="h-14 w-2 rounded-full" style={{background:project.color}}/><div className="min-w-0 flex-1"><p className="truncate font-bold">{project.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-mugla-navy/55"><MapPin size={12}/>{project.district} - {project.category}</p></div><div className="text-right"><strong>{project.votes}</strong><p className="text-xs text-mugla-navy/45">destek</p></div></Link>):<div className="py-14 text-center text-mugla-navy/45"><FolderKanban className="mx-auto mb-3"/><p className="font-semibold">{district?`${district.name} icin henuz yayinlanmis proje yok.`:'Henuz yayinlanmis proje yok.'}</p></div>}</CardContent></Card>
  </div></AppShell>
}
