'use client'

import Link from 'next/link'
import {useMemo, useState} from 'react'
import {ArrowUpRight, Search, Trophy} from 'lucide-react'
import {formatBudget, projectApplicationYear, useProjects} from '@/lib/projects-store'
import {isSelectedProject, projectPath} from '@/lib/project-routes'

export default function SelectedProjectsPage() {
  const {projects, ready} = useProjects()
  const [query, setQuery] = useState('')
  const [district, setDistrict] = useState('')
  const [year, setYear] = useState('')
  const selected = useMemo(() => projects.filter(isSelectedProject), [projects])
  const districts = [...new Set(selected.map(project => project.district))].sort((a, b) => a.localeCompare(b, 'tr'))
  const years = [...new Set(selected.map(project => project.votingYear || projectApplicationYear(project)))].sort().reverse()
  const filtered = selected.filter(project => (!district || project.district === district) &&
    (!year || (project.votingYear || projectApplicationYear(project)) === year) &&
    `${project.title} ${project.projectCode}`.toLocaleLowerCase('tr').includes(query.trim().toLocaleLowerCase('tr')))

  return <main className="min-h-[60vh] bg-white text-mugla-navy">
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex items-center gap-3"><Trophy className="text-mugla-orange" size={28}/><h1 className="text-3xl font-black">Seçilen Projeler</h1></div>
      <form onSubmit={event => event.preventDefault()} className="mt-7 grid gap-3 border-y border-mugla-navy/10 py-5 md:grid-cols-[2fr_1fr_1fr]">
        <label className="flex h-11 items-center gap-2 rounded border border-mugla-navy/20 px-3"><Search size={18}/><input aria-label="Proje adı veya kodu" placeholder="Proje adı veya kodu" value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none"/></label>
        <select aria-label="İlçe" value={district} onChange={event => setDistrict(event.target.value)} className="h-11 rounded border border-mugla-navy/20 bg-white px-3"><option value="">Tüm ilçeler</option>{districts.map(value => <option key={value}>{value}</option>)}</select>
        <select aria-label="Oylama yılı" value={year} onChange={event => setYear(event.target.value)} className="h-11 rounded border border-mugla-navy/20 bg-white px-3"><option value="">Tüm yıllar</option>{years.map(value => <option key={value}>{value}</option>)}</select>
      </form>
      <p aria-live="polite" className="my-5 text-sm text-mugla-navy/65">{ready ? `${filtered.length} proje` : 'Projeler yükleniyor...'}</p>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(project => <Link key={project.id} href={projectPath(project)} className="overflow-hidden rounded-lg border border-mugla-navy/15 hover:border-mugla-orange">
          {project.image?.dataUrl && <img src={project.image.dataUrl} alt={project.title} className="aspect-video w-full object-cover"/>}
          <div className="p-5"><p className="text-xs font-bold text-mugla-green">{project.status}</p><h2 className="mt-2 break-words text-lg font-bold">{project.title}</h2><p className="mt-3 text-sm text-mugla-navy/65">{project.district} · {project.votingYear || projectApplicationYear(project)}</p><p className="mt-2 text-sm font-bold">{formatBudget(project.budget)}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Proje ayrıntıları <ArrowUpRight size={16}/></span></div>
        </Link>)}
      </div>
      {ready && !filtered.length && <div className="border-y border-mugla-navy/10 py-12 text-center"><p className="font-semibold">{selected.length ? 'Seçiminize uygun proje bulunamadı.' : 'Seçilen projeler henüz ilan edilmedi.'}</p><Link href="/projeler" className="mt-4 inline-flex items-center gap-2 text-sm text-mugla-cyan">Tüm projeler <ArrowUpRight size={16}/></Link></div>}
    </div>
  </main>
}
