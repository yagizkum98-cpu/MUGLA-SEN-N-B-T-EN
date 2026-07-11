'use client'

import {FormEvent,useState} from 'react'
import {motion} from 'framer-motion'
import {AppShell} from '@/components/app-shell'
import {Card,CardContent,CardHeader} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {CheckCircle2,Clock3,FolderKanban,Plus,Trash2,XCircle} from 'lucide-react'
import {formatBudget,ProjectStatus,useProjects} from '@/lib/projects-store'

const districts=['Bodrum','Dalaman','Datça','Fethiye','Kavaklıdere','Köyceğiz','Marmaris','Menteşe','Milas','Ortaca','Seydikemer','Ula','Yatağan']
const categories=[['Ulaşım','#ef7d00'],['İklim ve Çevre','#6a9d3b'],['Sosyal Yaşam','#00a6c8'],['Eğitim','#7c5bcc'],['Diğer','#64748b']] as const
const statuses:ProjectStatus[]=['Başvuru','İncelemede','Uygun','Oylamada','Devam Ediyor','Tamamlandı']
const field='w-full rounded-xl border border-mugla-navy/15 bg-white px-4 py-3 outline-none focus:border-mugla-cyan'

export default function Admin(){
  const{projects,addProject,removeProject,reviewProject}=useProjects()
  const[open,setOpen]=useState(false)
  const[message,setMessage]=useState('')
  const pendingProjects=projects.filter(project=>project.moderationStatus==='Bekliyor')

  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault()
    const form=new FormData(event.currentTarget)
    const category=String(form.get('category'))
    addProject({
      title:String(form.get('title')).trim(),district:String(form.get('district')),category,
      budget:Number(form.get('budget')),status:String(form.get('status')) as ProjectStatus,
      lat:Number(form.get('lat'))||37.08,lng:Number(form.get('lng'))||28.45,
      color:categories.find(item=>item[0]===category)?.[1]??'#64748b',
      moderationStatus:'Onaylandı'
    })
    event.currentTarget.reset();setOpen(false);setMessage('Proje kaydedildi; tüm sayısal veriler güncellendi.')
  }

  const stats=[
    ['Toplam proje',projects.length,'Kayıtlı tüm projeler',FolderKanban],
    ['Onay bekleyen',pendingProjects.length,'Admin kararı bekliyor',Clock3],
    ['Oylamada',projects.filter(p=>p.moderationStatus==='Onaylandı'&&p.status==='Oylamada').length,'Keşfet alanında',CheckCircle2],
    ['Tamamlanan',projects.filter(p=>p.status==='Tamamlandı').length,'Sonuçlanan proje',CheckCircle2]
  ] as const

  return <AppShell role="admin"><header className="flex flex-wrap items-center justify-between gap-4 border-b border-mugla-navy/10 bg-white px-6 py-5 lg:px-10"><div><p className="text-xs font-bold tracking-[.2em] text-mugla-orange">YÖNETİM MERKEZİ</p><h1 className="text-2xl font-bold">Proje Yönetimi</h1></div><Button variant="orange" onClick={()=>setOpen(value=>!value)}><Plus size={17}/>{open?'Formu kapat':'Manuel proje ekle'}</Button></header><div className="space-y-7 p-6 lg:p-10">{message&&<div className="rounded-2xl bg-green-50 px-5 py-4 text-sm font-semibold text-green-800">{message}</div>}{open&&<Card><CardHeader><h2 className="text-xl font-bold">Yeni proje kaydı</h2><p className="text-sm text-mugla-navy/55">Kaydettiğiniz proje doğrudan onaylı olarak proje listesine yansır.</p></CardHeader><CardContent><form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-sm font-semibold">Proje adı</span><input className={field} name="title" required/></label><label><span className="mb-2 block text-sm font-semibold">İlçe</span><select className={field} name="district" required>{districts.map(x=><option key={x}>{x}</option>)}</select></label><label><span className="mb-2 block text-sm font-semibold">Kategori</span><select className={field} name="category" required>{categories.map(([x])=><option key={x}>{x}</option>)}</select></label><label><span className="mb-2 block text-sm font-semibold">Durum</span><select className={field} name="status" required>{statuses.map(x=><option key={x}>{x}</option>)}</select></label><label><span className="mb-2 block text-sm font-semibold">Bütçe (TL)</span><input className={field} name="budget" type="number" min="0" step="1" required/></label><label><span className="mb-2 block text-sm font-semibold">Enlem (isteğe bağlı)</span><input className={field} name="lat" type="number" step="any" placeholder="37.08"/></label><label><span className="mb-2 block text-sm font-semibold">Boylam (isteğe bağlı)</span><input className={field} name="lng" type="number" step="any" placeholder="28.45"/></label><div className="md:col-span-2 xl:col-span-3"><Button type="submit" variant="orange">Projeyi kaydet</Button></div></form></CardContent></Card>}<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map(([label,value,note,Icon],i)=><motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.07}} key={label}><Card><CardContent className="pt-6"><Icon className="mb-5 text-mugla-cyan"/><p className="text-sm text-mugla-navy/55">{label}</p><p className="text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-mugla-orange">{note}</p></CardContent></Card></motion.div>)}</section><Card><CardHeader><h2 className="text-xl font-bold">Onay bekleyen başvurular</h2><p className="text-sm text-mugla-navy/55">Onaylanan projeler keşfet alanında oylamaya açılır.</p></CardHeader><CardContent className="space-y-3">{pendingProjects.length?pendingProjects.map(project=><div key={project.id} className="rounded-2xl border border-mugla-navy/10 p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="font-bold">{project.title}</p><p className="mt-1 text-sm text-mugla-navy/55">{project.district} · {project.category} · {formatBudget(project.budget)}</p>{project.summary&&<p className="mt-3 max-w-3xl text-sm leading-6 text-mugla-navy/65">{project.summary}</p>}</div><div className="flex shrink-0 gap-2"><Button size="sm" variant="orange" onClick={()=>{reviewProject(project.id,'Onaylandı');setMessage('Proje onaylandı ve keşfet alanında oylamaya açıldı.')}}><CheckCircle2 size={15}/>Onayla</Button><Button size="sm" variant="outline" onClick={()=>{reviewProject(project.id,'Reddedildi');setMessage('Proje reddedildi; keşfet alanında yayınlanmayacak.')}}><XCircle size={15}/>Reddet</Button></div></div></div>):<div className="py-12 text-center text-mugla-navy/50"><Clock3 className="mx-auto mb-3"/><p className="font-semibold">Onay bekleyen başvuru yok.</p></div>}</CardContent></Card><Card id="projeler"><CardHeader><h2 className="text-xl font-bold">Proje kayıtları</h2></CardHeader><CardContent className="overflow-x-auto">{projects.length?<table className="w-full min-w-[860px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="pb-4">Proje</th><th>İlçe</th><th>Bütçe</th><th>Durum</th><th>Onay</th><th className="text-right">İşlem</th></tr></thead><tbody>{projects.map(project=><tr key={project.id} className="border-t border-mugla-navy/10"><td className="py-4 font-semibold">{project.title}</td><td>{project.district}</td><td>{formatBudget(project.budget)}</td><td><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-mugla-orange">{project.status}</span></td><td><span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-semibold text-mugla-navy/65">{project.moderationStatus}</span></td><td className="text-right"><button aria-label={`${project.title} projesini sil`} className="rounded-full p-2 text-red-600 hover:bg-red-50" onClick={()=>removeProject(project.id)}><Trash2 size={17}/></button></td></tr>)}</tbody></table>:<div className="py-14 text-center text-mugla-navy/50"><FolderKanban className="mx-auto mb-3"/><p className="font-semibold">Henüz proje girilmedi.</p><p className="mt-1 text-sm">İlk kayıtla birlikte bütün sayaçlar otomatik artacaktır.</p></div>}</CardContent></Card></div></AppShell>
}
