'use client'

import Link from 'next/link'
import Image from 'next/image'
import {useEffect,useMemo,useState} from 'react'
import {motion,useScroll,useTransform} from 'framer-motion'
import {formatBudget,useProjects,type ProjectRecord} from '@/lib/projects-store'
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Construction,
  Database,
  Eye,
  Heart,
  Hourglass,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Vote,
} from 'lucide-react'

const VOTED_KEY='mugla-senin-butcen-voted-projects-v1'

type Stage='active'|'upcoming'|'ended'|'evaluation'|'waiting'|'winner'|'building'|'completed'
type ProjectCard=ProjectRecord&{
  stage:Stage
  image:string
  votingStart:string
  votingEnd:string
  resultAt:string
  announcement:string
  benefit:string
}

const stageMeta:Record<Stage,{tone:string;badge:string}>={
  active:{tone:'bg-green-500',badge:'Oy Veriliyor'},
  upcoming:{tone:'bg-yellow-400',badge:'Yakinda Oylamaya Acilacak'},
  ended:{tone:'bg-slate-400',badge:'Oylama Tamamlandi'},
  evaluation:{tone:'bg-orange-500',badge:'Teknik ve Mali Degerlendirme'},
  waiting:{tone:'bg-sky-500',badge:'Sonuclar Belirlenen Tarihte Aciklanacak'},
  winner:{tone:'bg-amber-500',badge:'Kazanan Proje'},
  building:{tone:'bg-cyan-500',badge:'Uygulama Surecinde'},
  completed:{tone:'bg-emerald-600',badge:'Tamamlandi'},
}

const tabs:[Stage|'all',string][]=[
  ['all','Tum Projeler'],
  ['active','Aktif'],
  ['upcoming','Yakinda'],
  ['evaluation','Degerlendirme'],
  ['winner','Kazanan'],
  ['building','Yapim Asamasinda'],
  ['completed','Tamamlanan'],
]

function readVotedProjects(){
  if(typeof window==='undefined')return []
  try{
    const value=JSON.parse(localStorage.getItem(VOTED_KEY)??'[]')
    return Array.isArray(value)?value.filter(item=>typeof item==='string'):[]
  }catch{return []}
}

function dateOffset(days:number){
  const date=new Date()
  date.setDate(date.getDate()+days)
  return date.toISOString()
}

function dateLabel(value:string){
  return new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long'}).format(new Date(value))
}

function timeLeft(target:string){
  const diff=Math.max(0,new Date(target).getTime()-Date.now())
  return{
    days:Math.floor(diff/86400000),
    hours:Math.floor(diff%86400000/3600000),
    minutes:Math.floor(diff%3600000/60000),
    seconds:Math.floor(diff%60000/1000),
  }
}

function Countdown({target,seconds=false}:{target:string;seconds?:boolean}){
  const[now,setNow]=useState(()=>timeLeft(target))
  useEffect(()=>{const id=setInterval(()=>setNow(timeLeft(target)),1000);return()=>clearInterval(id)},[target])
  const cells=seconds?[['Gun',now.days],['Saat',now.hours],['Dakika',now.minutes],['Saniye',now.seconds]]:[['Gun',now.days],['Saat',now.hours],['Dakika',now.minutes]]
  return <div className="project-countdown">{cells.map(([label,value])=><span key={label as string}><b>{String(value).padStart(2,'0')}</b><small>{label}</small></span>)}</div>
}

function enrich(project:ProjectRecord):ProjectCard{
  const stage:Stage=project.status==='Tamamlandı'?'completed':project.status==='Devam Ediyor'?'building':project.status==='Oylamada'?'active':project.status==='İncelemede'?'evaluation':project.status==='Uygun'?'upcoming':'waiting'
  return{
    ...project,
    stage,
    image:`linear-gradient(135deg,${project.color},#06283f)`,
    votingStart:dateOffset(8),
    votingEnd:dateOffset(22),
    resultAt:dateOffset(45),
    announcement:'Sonuclar takvimde belirlenen tarihte aciklanacak.',
    benefit:'Veri geldikce hesaplanacak',
  }
}

function StatusPill({stage}:{stage:Stage}){
  const meta=stageMeta[stage]
  return <span className="status-pill"><i className={meta.tone}/>{meta.badge}</span>
}

function LiveWaiting({title,text,dark=false}:{title:string;text:string;dark?:boolean}){
  return <motion.div className={`live-waiting-card ${dark?'is-dark':''}`} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
    <Database/>
    <span>Canli veri bekleniyor</span>
    <h3>{title}</h3>
    <p>{text}</p>
    <div><i/><b>Anlik sistem aktif</b><small>Proje eklendiginde bu alan otomatik dolacak.</small></div>
  </motion.div>
}

function ProjectTile({project,onVote,voted}:{project:ProjectCard;onVote:(id:string)=>void;voted:boolean}){
  const locked=project.stage==='ended'||project.stage==='evaluation'||project.stage==='waiting'
  const won=project.stage==='winner'
  return <motion.article className={`project-tile ${locked?'is-muted':''} ${won?'is-winner':''}`} whileHover={{y:-6}} layout>
    <div className="project-shot" style={{background:project.image}}>
      <StatusPill stage={project.stage}/>
      {locked&&<div className="lock-layer"><Lock/><b>Oylama Tamamlandi</b><span>Bu proje icin oy verme suresi sona ermistir.</span></div>}
      {won&&<div className="winner-ribbon"><Trophy/> Kazandi</div>}
    </div>
    <div className="project-tile-body">
      <div className="project-meta"><span>{project.category}</span><b>{formatBudget(project.budget)}</b></div>
      <h3>{project.title}</h3>
      <p className="project-location"><MapPin size={14}/>{project.district} · {project.votes.toLocaleString('tr-TR')} oy</p>
      {project.summary&&<p className="project-summary">{project.summary}</p>}
      {project.stage==='active'&&<><Countdown target={project.votingEnd}/><div className="progress-line"><i style={{width:'64%'}}/></div></>}
      {project.stage==='upcoming'&&<div className="upcoming-box"><CalendarDays/><b>{dateLabel(project.votingStart)} - {dateLabel(project.votingEnd)}</b><span>Oylamaya {timeLeft(project.votingStart).days} gun kaldi</span></div>}
      {project.stage==='evaluation'&&<div className="eval-mini"><span>Teknik ve Mali Degerlendirme Sureci Devam Etmektedir.</span><b>%{Math.max(project.progress,20)}</b><i><em style={{width:`${Math.max(project.progress,20)}%`}}/></i></div>}
      {project.stage==='winner'&&<div className="winner-note"><CheckCircle2 size={16}/> {project.announcement}<strong>Uygulanacak</strong></div>}
      {project.stage==='building'&&<div className="build-note"><Construction size={16}/> Uygulama sureci ilerliyor <b>%{project.progress}</b></div>}
      {project.stage==='completed'&&<div className="build-note done"><CheckCircle2 size={16}/> Tamamlandi <b>%100</b></div>}
      <button className="project-action" disabled={project.stage!=='active'} onClick={()=>onVote(project.id)}>
        {project.stage==='active'?<><Heart size={16} fill={voted?'currentColor':'none'}/>{voted?'Oy Verildi':'Oy Ver'}</>:<><Eye size={16}/> Detaylari Gor</>}
      </button>
    </div>
  </motion.article>
}

export default function Projects(){
  const{projects,voteProject}=useProjects()
  const{scrollYProgress}=useScroll()
  const progress=useTransform(scrollYProgress,[0,1],['0%','100%'])
  const[voted,setVoted]=useState<string[]>([])
  const[tab,setTab]=useState<Stage|'all'>('all')
  const[query,setQuery]=useState('')

  useEffect(()=>setVoted(readVotedProjects()),[])

  const allProjects=useMemo(()=>projects.filter(project=>project.moderationStatus==='Onaylandı').map(enrich),[projects])
  const filtered=allProjects.filter(project=>(tab==='all'||project.stage===tab)&&project.title.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')))
  const active=allProjects.filter(project=>project.stage==='active')
  const upcoming=allProjects.filter(project=>project.stage==='upcoming')
  const evaluating=allProjects.filter(project=>project.stage==='evaluation')
  const waiting=allProjects.filter(project=>project.stage==='waiting')
  const winners=allProjects.filter(project=>project.stage==='winner')
  const building=allProjects.filter(project=>project.stage==='building')
  const completed=allProjects.filter(project=>project.stage==='completed')
  const nextResultTarget=allProjects[0]?.resultAt??dateOffset(45)

  function toggleVote(id:string){
    setVoted(current=>{
      const selected=current.includes(id)
      const next=selected?current.filter(item=>item!==id):[...current,id]
      localStorage.setItem(VOTED_KEY,JSON.stringify(next))
      voteProject(id,selected?-1:1)
      return next
    })
  }

  return <main className="projects-landing">
    <motion.div className="project-scroll-progress" style={{width:progress}}/>
    <header className="project-topbar">
      <Link href="/" className="project-back"><Image className="topbar-municipality-logo" src="/partners/mugla-buyuksehir.png" alt="T.C. Muğla Büyükşehir Belediyesi" width={720} height={721}/><ArrowLeft size={17}/> Ana Sayfa</Link>
      <nav><a href="#aktif">Aktif</a><a href="#yakinda">Yakinda</a><a href="#kazananlar">Kazananlar</a><a href="#tum">Tum Projeler</a></nav>
    </header>

    <section className="projects-hero">
      <div className="project-hero-video"/>
      <motion.div className="floating-status-card c1" animate={{y:[0,-18,0]}} transition={{duration:4,repeat:Infinity}}><Vote/> Aktif Oylama</motion.div>
      <motion.div className="floating-status-card c2" animate={{y:[0,-14,0]}} transition={{duration:4.8,repeat:Infinity}}><Trophy/> Kazananlar</motion.div>
      <motion.div className="floating-status-card c3" animate={{y:[0,-16,0]}} transition={{duration:4.4,repeat:Infinity}}><ShieldCheck/> Degerlendirme</motion.div>
      <div className="projects-hero-content">
        <span>Mugla Senin Butcen</span>
        <h1>PROJELER</h1>
        <p>Mugla'nin Gelecegini Sekillendirecek Projeleri Kesfet.</p>
        <small>Su anda ornek proje gosterilmez. Admin panelinden proje onaylandikca bu sayfa anlik olarak dolmaya baslar.</small>
        <div className="hero-status-links">
          <a href="#aktif">Aktif Projeler</a>
          <a href="#yakinda">Yakinda Oylanacak</a>
          <a href="#degerlendirme">Degerlendirme</a>
          <a href="#kazananlar">Kazanan Projeler</a>
        </div>
      </div>
      <a className="hero-down" href="#takvim"><ChevronDown/></a>
    </section>

    <section id="takvim" className="project-stage-timeline">
      {['Fikir Toplama','Teknik Inceleme','Oylama','Degerlendirme','Kazananlar','Uygulama','Tamamlandi'].map((item,index)=><motion.article key={item} initial={{opacity:.35}} whileInView={{opacity:1}} viewport={{amount:.85}}>
        <span>{index+1}</span><b>{item}</b>
      </motion.article>)}
    </section>

    <section id="aktif" className="project-section">
      <div className="project-section-head"><span>Aktif Oylama</span><h2>Su Anda Oylanan Projeler</h2><p>Oy verme suresi acik olan projeler canli sayac ve ilerleme cubuguyla takip edilir.</p></div>
      {active.length?<div className="featured-grid">{active.map(project=><ProjectTile key={project.id} project={project} onVote={toggleVote} voted={voted.includes(project.id)}/>)}</div>:<LiveWaiting title="Aktif oylamada proje yok." text="Onaylanan ve oylama takvimi acilan projeler burada canli olarak gorunecek."/>}
    </section>

    <section id="yakinda" className="project-section">
      <div className="project-section-head"><span>Yakinda Oylanacak</span><h2>Takvim verisi bekleniyor</h2><p>Oylama tarihi belirlenen projeler, tarih araligi ve hatirlatici secenekleriyle burada listelenir.</p></div>
      {upcoming.length?<div className="featured-grid">{upcoming.map(project=><ProjectTile key={project.id} project={project} onVote={toggleVote} voted={voted.includes(project.id)}/>)}</div>:<LiveWaiting title="Yakinda oylanacak proje yok." text="Admin panelinden uygun proje takvime alindiginda bu alan otomatik dolacak."/>}
    </section>

    <section id="degerlendirme" className="project-section dark">
      <div className="project-section-head"><span>Degerlendirme</span><h2>Uzman kurul verisi bekleniyor</h2><p>Oylamasi biten projeler teknik, mali, hukuki, cevresel ve sosyal fayda adimlariyla izlenir.</p></div>
      {evaluating.length?<div className="featured-grid">{evaluating.map(project=><ProjectTile key={project.id} project={project} onVote={toggleVote} voted={voted.includes(project.id)}/>)}</div>:<LiveWaiting dark title="Degerlendirme asamasinda proje yok." text="Oylama kapaninca projeler burada kilitli ve surec bilgisiyle gorunecek."/>}
      <div className="review-card mt-6">
        <Sparkles/>
        <span>Canli Degerlendirme Modulu</span>
        <h2>Degerlendirme Devam Ediyor</h2>
        {['Teknik Uygunluk','Mali Analiz','Hukuki Inceleme','Cevresel Etki','Sosyal Fayda'].map(item=><p key={item}><CheckCircle2 size={16}/>{item}</p>)}
        <div className="spinner-ai"><Hourglass/></div>
      </div>
    </section>

    <section className="results-soon">
      <Trophy/>
      <span>Kazanan Projeler</span>
      <h2>Sonuclar veri geldikce aciklanacak</h2>
      <p>Takvim bekleniyor</p>
      <Countdown target={nextResultTarget} seconds/>
      <button><Bell size={17}/> Bildirim Al</button>
    </section>

    <section id="kazananlar" className="project-section winners">
      <div className="project-section-head"><span>Kazanan Projeler</span><h2>Uygulanacak Projeler</h2><p>Secilen projeler yatirim programina alinir ve uygulama takvimine baglanir.</p></div>
      {winners.length?<div className="featured-grid">{winners.map(project=><ProjectTile key={project.id} project={project} onVote={toggleVote} voted={voted.includes(project.id)}/>)}</div>:<LiveWaiting title="Kazanan proje henuz yayinlanmadi." text="Degerlendirme tamamlandiginda kazanan projeler burada altin kartlarla gorunecek."/>}
    </section>

    <section className="project-section">
      <div className="project-section-head"><span>Uygulanan Projeler</span><h2>Uygulama sureci beklemede</h2><p>Kazanan projeler ihale, baslangic, devam ve tamamlanma adimlariyla canli takip edilir.</p></div>
      {building.length?<div className="featured-grid">{building.map(project=><ProjectTile key={project.id} project={project} onVote={toggleVote} voted={voted.includes(project.id)}/>)}</div>:<LiveWaiting title="Yapim asamasinda proje yok." text="Kazanan bir proje uygulamaya alindiginda ilerleme yuzdesi burada olusacak."/>}
    </section>

    <section className="project-section completed-showcase">
      {completed.length?<><div className="before-after-mini"><div>Before</div><div>After</div></div><div><span>Tamamlanan Projeler</span><h2>{completed[0].title}</h2><p>Tamamlanan projeler icin vatandas yorumlari ve yatirim istatistikleri acikca yayinlanir.</p><div className="completed-stats"><article><b>{completed[0].votes.toLocaleString('tr-TR')}</b><span>Oy</span></article><article><b>{formatBudget(completed[0].budget)}</b><span>Yatirim</span></article><article><b>%100</b><span>Tamamlandi</span></article></div></div></>:<LiveWaiting title="Tamamlanan proje yok." text="Bir proje tamamlandiginda once/sonra gorseli ve etki verileri burada yayinlanacak."/>}
    </section>

    <section id="tum" className="all-projects">
      <div className="project-section-head"><span>Tum Projeler</span><h2>Proje Yasam Dongusu</h2><p>Duruma gore filtrele, hangi projenin hangi asamada oldugunu aninda gor.</p></div>
      <div className="project-filterbar">
        <label><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Proje ara"/></label>
        <div>{tabs.map(([value,label])=><button key={value} className={tab===value?'active':''} onClick={()=>setTab(value)}>{label}</button>)}</div>
      </div>
      {filtered.length?<motion.div className="all-project-grid" layout>{filtered.map(project=><ProjectTile key={project.id} project={project} onVote={toggleVote} voted={voted.includes(project.id)}/>)}</motion.div>:<LiveWaiting title="Henuz proje kaydi yok." text="Admin panelinden onaylanan ilk proje burada ve ilgili yasam dongusu bolumlerinde anlik gorunecek."/>}
    </section>

    <section className="project-final-quote">
      <p>Her Proje<br/><span>Bir Fikirle Baslar.</span></p>
      <p>Her Oy<br/><span>Bir Gelecek Insa Eder.</span></p>
      <p>Her Katilim<br/><span>Mugla'nin Yarinina Deger Katar.</span></p>
    </section>

    <footer className="projects-footer">
      <b className="projects-footer-brand"><Image className="footer-brand-logo" src="/partners/mugla-buyuksehir.png" alt="T.C. Muğla Büyükşehir Belediyesi" width={720} height={721}/>Mugla Senin Butcen</b>
      <span>Projeler takvimi, oylama ve uygulama surecleri veri geldikce anlik yayinlanir.</span>
      <Link href="/fikir-gonder">Fikrini Gonder</Link>
    </footer>
  </main>
}
