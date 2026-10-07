'use client'

import Link from 'next/link'
import {ArrowLeft, FileText, MapPin, ShoppingCart} from 'lucide-react'
import {useMemo, useState} from 'react'
import {useParams} from 'next/navigation'
import {getCurrentUser} from '@/lib/local-auth'
import {formatBudget, isPublishedProject, projectApplicationYear, useProjects, type ProjectRecord} from '@/lib/projects-store'
import {matchesProjectRoute, projectPath} from '@/lib/project-routes'
import {useVoteBasket} from '@/lib/vote-basket'
import {SiteUserMenu} from '@/components/site-user-menu'

function ProjectImage({project}: {project: ProjectRecord}) {
  return <div className="overflow-hidden rounded-lg border border-mugla-navy/10 bg-mugla-sand">
    {project.image?.dataUrl ? <img src={project.image.dataUrl} alt={`${project.title} proje görseli`} className="h-72 w-full object-cover md:h-96"/> : <div className="grid h-72 place-items-center text-sm font-bold text-mugla-navy/35 md:h-96">Proje görseli</div>}
  </div>
}

function statusClass(status: string) {
  if (status === 'Oylamada') return 'bg-green-50 text-green-700'
  if (status === 'Yılın Kazanan Adayı') return 'bg-lime-50 text-lime-700'
  if (status === 'İhale Aşamasında') return 'bg-amber-50 text-amber-700'
  if (status === 'Devam Ediyor') return 'bg-sky-50 text-sky-700'
  if (status.startsWith('Tamamland')) return 'bg-emerald-50 text-emerald-700'
  if (status === 'Yapılamadı') return 'bg-red-50 text-red-700'
  return 'bg-orange-50 text-mugla-orange'
}

export default function ProjectDetailPage() {
  const params = useParams<{slug: string}>()
  const {projects, ready} = useProjects()
  const [user] = useState(() => getCurrentUser())
  const {basket, confirmed, availableForBasket, add} = useVoteBasket(user?.id)
  const [message, setMessage] = useState('')
  const project = useMemo(() => projects.find(item => isPublishedProject(item) && matchesProjectRoute(item, params.slug)), [params.slug, projects])

  if (ready && !project) return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6 text-center text-mugla-navy">
    <section className="rounded-lg border border-mugla-navy/10 bg-white p-8 shadow-soft">
      <h1 className="text-2xl font-black">Proje bulunamadı.</h1>
      <p className="mt-2 text-sm text-mugla-navy/55">Proje kaldırılmış, henüz yayınlanmamış veya bağlantı değişmiş olabilir.</p>
      <Link href="/projeler" className="mt-5 inline-flex rounded-full bg-mugla-orange px-5 py-3 text-sm font-bold text-white">Projelere dön</Link>
    </section>
  </main>
  if (!project) return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6 text-mugla-navy"><p className="font-bold text-mugla-navy/55">Proje yükleniyor...</p></main>

  const canVote = ['Oylamada', 'Yılın Kazanan Adayı'].includes(String(project.status)) && !basket.includes(project.id) && !confirmed.includes(project.id) && availableForBasket > 0

  function addToBasket() {
    if (!project) return
    if (!user) {
      location.href = `/giris?next=${encodeURIComponent(projectPath(project))}`
      return
    }
    const result = add(project.id)
    setMessage(result.message)
  }

  return <main className="min-h-screen bg-mugla-sand text-mugla-navy">
    <header className="border-b border-mugla-navy/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/projeler" className="inline-flex items-center gap-2 text-sm font-bold text-mugla-navy/65 hover:text-mugla-navy"><ArrowLeft size={16}/> Projelere dön</Link>
        <SiteUserMenu/>
      </div>
    </header>

    <section className="mx-auto max-w-5xl px-5 py-8">
      <ProjectImage project={project}/>
      <div className="mt-6 rounded-lg border border-mugla-navy/10 bg-white p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-mugla-sand px-2.5 py-1 text-xs font-black text-mugla-navy/65">{project.projectCode}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(String(project.status))}`}>{project.status}</span>
              <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-mugla-cyan">{project.category}</span>
            </div>
            <h1 className="mt-3 text-3xl font-black md:text-5xl">{project.title}</h1>
            <p className="mt-3 flex items-center gap-2 text-sm font-bold text-mugla-navy/55"><MapPin size={16}/>{project.district}{project.neighborhood ? ` / ${project.neighborhood}` : ''}</p>
            {project.summary && <p className="mt-5 text-lg leading-8 text-mugla-navy/65">{project.summary}</p>}
          </div>
          <button type="button" disabled={!canVote} onClick={addToBasket} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-mugla-orange px-5 text-sm font-bold text-white disabled:bg-mugla-navy/10 disabled:text-mugla-navy/45"><ShoppingCart size={17}/>{basket.includes(project.id) ? 'Sepette' : confirmed.includes(project.id) ? 'Oy alındı' : 'Sepete ekle'}</button>
        </div>
        {message && <p className="mt-5 rounded-lg bg-mugla-sand px-4 py-3 text-sm font-bold text-mugla-navy/60">{message}</p>}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {[
          ['Amaç', project.purpose],
          ['Faaliyetler', project.activities],
          ['Beklenen sonuçlar', project.expectedResults],
          ['Bütçe gerekçesi', project.budgetJustification],
          ['Birleştirme notu', project.mergeNote],
        ].map(([label, value]) => value ? <section key={label} className="rounded-lg border border-mugla-navy/10 bg-white p-5"><h2 className="text-xs font-black uppercase tracking-[.16em] text-mugla-orange">{label}</h2><p className="mt-3 whitespace-pre-line leading-7 text-mugla-navy/65">{value}</p></section> : null)}
      </div>

      <section className="mt-5 grid gap-3 rounded-lg border border-mugla-navy/10 bg-white p-5 text-sm md:grid-cols-3">
        <div><span className="text-xs font-black uppercase tracking-[.14em] text-mugla-orange">Bütçe</span><p className="mt-1 font-bold">{formatBudget(project.budget)}</p></div>
        <div><span className="text-xs font-black uppercase tracking-[.14em] text-mugla-orange">Başvuru yılı</span><p className="mt-1 font-bold">{projectApplicationYear(project)}</p></div>
        <div><span className="text-xs font-black uppercase tracking-[.14em] text-mugla-orange">Oylama yılı</span><p className="mt-1 font-bold">{project.votingYear || 'Belirtilmedi'}</p></div>
        <div><span className="text-xs font-black uppercase tracking-[.14em] text-mugla-orange">Hedef grup</span><p className="mt-1 font-bold">{project.targetGroup || 'Belirtilmedi'}</p></div>
        <div><span className="text-xs font-black uppercase tracking-[.14em] text-mugla-orange">Süre</span><p className="mt-1 font-bold">{project.duration || 'Belirtilmedi'}</p></div>
        <div><span className="text-xs font-black uppercase tracking-[.14em] text-mugla-orange">İlerleme</span><p className="mt-1 font-bold">%{project.progress}</p></div>
        <div><span className="text-xs font-black uppercase tracking-[.14em] text-mugla-orange">Konum</span><p className="mt-1 font-bold">{project.locationNote || 'Belirtilmedi'}</p></div>
        <div><span className="text-xs font-black uppercase tracking-[.14em] text-mugla-orange">Destek</span><p className="mt-1 font-bold">{['Oylamada', 'Yılın Kazanan Adayı'].includes(String(project.status)) ? 'Canlı sonuçlar gizli' : `${project.votes.toLocaleString('tr-TR')} destek`}</p></div>
        <div><span className="text-xs font-black uppercase tracking-[.14em] text-mugla-orange">Öncelik</span><p className="mt-1 font-bold">{project.priority || 'Belirtilmedi'}</p></div>
      </section>

      <section className="mt-5 rounded-lg border border-mugla-navy/10 bg-white p-5">
        <h2 className="text-xs font-black uppercase tracking-[.16em] text-mugla-orange">Ek dosyalar</h2>
        {project.attachments?.length ? <div className="mt-3 grid gap-2">{project.attachments.map(file => <p key={`${file.name}-${file.size}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-mugla-sand/70 px-3 py-2 text-sm text-mugla-navy/65"><FileText size={15}/><b>{file.name}</b><span>{(file.size / 1024 / 1024).toFixed(1)} MB</span></p>)}</div> : <p className="mt-2 text-sm text-mugla-navy/45">Bu proje için ek dosya yok.</p>}
      </section>
    </section>
  </main>
}
