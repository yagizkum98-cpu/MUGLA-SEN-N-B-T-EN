'use client'

import Link from 'next/link'
import {useMemo, useState} from 'react'
import {ArrowLeft, CheckCircle2, MapPin, Search, ShoppingCart} from 'lucide-react'
import {getCurrentUser} from '@/lib/local-auth'
import {formatBudget, useProjects, type ProjectRecord} from '@/lib/projects-store'
import {useVoteBasket} from '@/lib/vote-basket'

const filters = [
  ['all', 'Tum'],
  ['Oylamada', 'Oylama'],
  ['Devam Ediyor', 'Devam'],
  ['completed', 'Tamam'],
] as const

function statusClass(status: string) {
  if (status === 'Oylamada') return 'bg-green-50 text-green-700'
  if (status === 'Devam Ediyor') return 'bg-sky-50 text-sky-700'
  if (status.startsWith('Tamamland')) return 'bg-emerald-50 text-emerald-700'
  return 'bg-orange-50 text-mugla-orange'
}

function ProjectRow({project, inBasket, confirmed, onAdd}: {project: ProjectRecord; inBasket: boolean; confirmed: boolean; onAdd: (id: string) => void}) {
  const status = String(project.status)
  const canVote = status === 'Oylamada'

  return <article className="border-b border-mugla-navy/10 bg-white px-4 py-4 last:border-b-0 md:px-5">
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_130px] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(status)}`}>{status}</span>
          <span className="text-xs font-semibold text-mugla-navy/45">{project.category}</span>
        </div>
        <h2 className="mt-2 truncate text-lg font-black">{project.title}</h2>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-mugla-navy/55">
          <span className="flex items-center gap-1.5"><MapPin size={14}/>{project.district}</span>
          <span>{formatBudget(project.budget)}</span>
          <span>{project.votes.toLocaleString('tr-TR')} destek</span>
        </div>
        {project.summary && <p className="mt-2 line-clamp-2 text-sm leading-6 text-mugla-navy/55">{project.summary}</p>}
      </div>

      <div className="text-sm text-mugla-navy/55">
        {project.progress > 0 ? <div>
          <div className="mb-2 flex justify-between"><span>Ilerleme</span><b>%{project.progress}</b></div>
          <div className="h-2 rounded-full bg-mugla-navy/10"><span className="block h-full rounded-full bg-mugla-cyan" style={{width: `${Math.min(100, Math.max(0, project.progress))}%`}}/></div>
        </div> : <span>Surec baslangicinda</span>}
      </div>

      <button disabled={!canVote || confirmed} onClick={() => onAdd(project.id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-mugla-orange px-4 text-sm font-bold text-white disabled:bg-mugla-navy/10 disabled:text-mugla-navy/45">
        <ShoppingCart size={16}/>
        {confirmed ? 'Oy alindi' : canVote ? (inBasket ? 'Sepette' : 'Sepete ekle') : 'Kapali'}
      </button>
    </div>
  </article>
}

export default function Projects() {
  const {projects} = useProjects()
  const [user] = useState(() => getCurrentUser())
  const {basket, confirmed, remaining, availableForBasket, add} = useVoteBasket(user?.id)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof filters)[number][0]>('all')
  const [message, setMessage] = useState('')

  const approved = useMemo(() => projects.filter(project => !['Bekliyor', 'Reddedildi'].includes(String(project.moderationStatus))), [projects])
  const filtered = approved.filter(project => {
    const status = String(project.status)
    const matchesFilter = filter === 'all' || status === filter || (filter === 'completed' && status.startsWith('Tamamland'))
    const haystack = `${project.title} ${project.district} ${project.category}`.toLocaleLowerCase('tr')
    return matchesFilter && haystack.includes(query.toLocaleLowerCase('tr'))
  })

  function addToBasket(id: string) {
    if (!user) {
      location.href = '/giris?next=/projeler'
      return
    }
    const result = add(id)
    setMessage(result.message)
  }

  return <main className="min-h-screen bg-mugla-sand text-mugla-navy">
    <header className="border-b border-mugla-navy/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-mugla-navy/70 hover:text-mugla-navy">
          <ArrowLeft size={16}/> Ana sayfa
        </Link>
        <Link href="/giris?next=/fikir-gonder" className="rounded-full bg-mugla-orange px-4 py-2 text-sm font-bold text-white">Fikir gonder</Link>
      </div>
    </header>

    <section className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-mugla-orange">Projeler</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Proje listesi</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mugla-navy/55">Oylama acik projeleri sepete ekle. Her vatandasin toplam 5 proje secme kredisi vardir.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <p className="rounded-full bg-white px-3 py-1 text-sm font-bold text-mugla-navy/60">{filtered.length} / {approved.length} proje</p>
          <Link href={user?'/vatandas/panel#sepetim':'/giris?next=/vatandas/panel'} className="rounded-full bg-mugla-navy px-3 py-1 text-sm font-bold text-white">Sepetim: {basket.length} · Kredi: {remaining}</Link>
        </div>
      </div>
      {message && <div className="mt-4 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-mugla-navy/65">{message} {availableForBasket === 0 && remaining > 0 ? 'Sepeti onaylayabilir veya bir proje cikarabilirsiniz.' : ''}</div>}

      <div className="sticky top-0 z-20 mt-6 rounded-lg border border-mugla-navy/10 bg-white p-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-mugla-navy/10 px-3">
            <Search size={17} className="text-mugla-navy/45"/>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Ara: proje, ilce, kategori" className="w-full bg-transparent text-sm outline-none"/>
          </label>
          <div className="flex gap-2 overflow-x-auto">
            {filters.map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`h-11 shrink-0 rounded-full px-4 text-sm font-bold ${filter === value ? 'bg-mugla-navy text-white' : 'bg-mugla-sand text-mugla-navy/65'}`}>{label}</button>)}
          </div>
        </div>
      </div>

      <section className="mt-4 overflow-hidden rounded-lg border border-mugla-navy/10 bg-white">
        {filtered.length ? filtered.map(project => <ProjectRow key={project.id} project={project} inBasket={basket.includes(project.id)} confirmed={confirmed.includes(project.id)} onAdd={addToBasket}/>) : <div className="p-10 text-center">
          <CheckCircle2 className="mx-auto text-mugla-orange"/>
          <h2 className="mt-3 text-xl font-bold">Proje bulunamadi.</h2>
          <p className="mt-2 text-sm text-mugla-navy/55">Filtreyi temizleyebilir veya admin panelinden yeni proje yayinlayabilirsin.</p>
        </div>}
      </section>
    </section>
  </main>
}
