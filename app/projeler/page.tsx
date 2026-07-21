'use client'

import Link from 'next/link'
import {useMemo, useState, type ReactNode} from 'react'
import {ArrowLeft, CheckCircle2, ChevronDown, FileText, MapPin, Search, ShoppingCart, SlidersHorizontal} from 'lucide-react'
import {citizenUrl} from '@/lib/domain-routing'
import {getCurrentUser} from '@/lib/local-auth'
import {projectCategories, targetGroups} from '@/lib/project-taxonomy'
import {formatBudget, useProjects, type ProjectRecord} from '@/lib/projects-store'
import {useVoteBasket} from '@/lib/vote-basket'
import {SiteUserMenu} from '@/components/site-user-menu'

const votingSchedule = {
  start: '2026-05-01T00:00:00+03:00',
  end: '2026-05-21T23:59:59+03:00',
}
function isWithinVotingPeriod(date = new Date()) {
  const time = date.getTime()
  return time >= new Date(votingSchedule.start).getTime() && time <= new Date(votingSchedule.end).getTime()
}
const participationSteps = [
  {
    id: 'vote',
    label: 'Oylamaya Katıl',
    status: 'Şu an açık değil',
    description: 'Vatandaşlar, oylama takvimi başladığında istedikleri projeleri bu adımda destekleyebilecek.',
    action: 'Oylama takvimi bekleniyor',
  },
  {
    id: 'winners',
    label: 'Kazanan Projeler',
    status: 'İlan dönemi bekleniyor',
    description: 'Kazanan projeler kesinleştiğinde bu adım aktif olacak ve ilan edilen projeler vatandaşlarla paylaşılacak.',
    action: 'Kazananlar henüz ilan edilmedi',
  },
] as const

const muglaDistricts = [
  'Bodrum',
  'Dalaman',
  'Datça',
  'Fethiye',
  'Kavaklıdere',
  'Köyceğiz',
  'Marmaris',
  'Menteşe',
  'Milas',
  'Ortaca',
  'Seydikemer',
  'Ula',
  'Yatağan',
] as const
const projectStatusOptions = [
  { value: 'all', label: 'Tüm durumlar', description: 'Başvuru, inceleme, oylama, ihale, uygulama, tamamlanma ve yapılamama dahil tüm proje kayıtlarını gösterir.' },
  { value: 'Başvuru', label: 'Başvuru alındı', description: 'Fikir kaydı alınmıştır; ekipler tarafından ön kontrol ve eksik bilgi değerlendirmesi beklenir.' },
  { value: 'İncelemede', label: 'İncelemede', description: 'Proje teknik, mali, çevresel ve toplumsal etki açısından ilgili birimler tarafından değerlendirilmektedir.' },
  { value: 'Uygun', label: 'Uygun bulundu', description: 'Proje uygulanabilir görülmüştür; oylama, bütçelendirme veya uygulama takvimine alınmaya hazırdır.' },
  { value: 'Oylamada', label: 'Oylamada', description: 'Proje halk oylamasına açıktır; vatandaşlar projeyi sepete ekleyerek destek verebilir.' },
  { value: 'Yılın Kazanan Adayı', label: 'Yılın kazanan adayı', description: 'O yılın katılımcı bütçe döneminde kazanma ihtimali olan, oylamada öne çıkan ve yıl içi uygulama için değerlendirilen projeleri gösterir.' },
  { value: 'İhale Aşamasında', label: 'İhale aşamasında', description: 'Uygulama için satın alma, teklif toplama, ihale hazırlığı veya yüklenici belirleme süreci devam etmektedir.' },
  { value: 'Devam Ediyor', label: 'Devam ediyor', description: 'Proje sahada uygulanmaktadır; fiziksel ilerleme, bütçe ve faaliyet bilgileri güncellenir.' },
  { value: 'Tamamlandı', label: 'Tamamlandı', description: 'Proje tamamlanmıştır; sonuçlar, etki verileri ve kapanış bilgileri kamuoyuyla paylaşılır.' },
  { value: 'Yapılamadı', label: 'Yapılamadı', description: 'Proje teknik, hukuki, mali veya saha koşulları nedeniyle uygulanamamıştır; gerekçe bilgisi açıklanır.' },
  { value: 'Ertelendi', label: 'Ertelendi', description: 'Proje mevcut dönemde uygulanmamış, sonraki takvim veya bütçe değerlendirmesine bırakılmıştır.' },
] as const
const projectYearOptions = ['2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035', '2036', '2037', '2038', '2039', '2040'] as const

function statusClass(status: string) {
  if (status === 'Oylamada') return 'bg-green-50 text-green-700'
  if (status === 'Yılın Kazanan Adayı') return 'bg-lime-50 text-lime-700'
  if (status === 'İhale Aşamasında') return 'bg-amber-50 text-amber-700'
  if (status === 'Devam Ediyor') return 'bg-sky-50 text-sky-700'
  if (status.startsWith('Tamamland')) return 'bg-emerald-50 text-emerald-700'
  if (status === 'Yapılamadı') return 'bg-red-50 text-red-700'
  if (status === 'Ertelendi') return 'bg-slate-100 text-slate-700'
  return 'bg-orange-50 text-mugla-orange'
}

function CategoryBadge({project}:{project:ProjectRecord}) {
  const label = project.category === 'Diğer' && project.customTheme ? `Diğer: ${project.customTheme}` : project.category
  return <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black" style={{backgroundColor:`${project.color}18`,borderColor:`${project.color}55`,color:project.color}}>{label}</span>
}

function ProjectImage({project, className = 'h-36'}: {project: ProjectRecord; className?: string}) {
  return <div className={`overflow-hidden rounded-lg border border-mugla-navy/10 bg-mugla-sand ${className}`}>
    {project.image?.dataUrl ? <img src={project.image.dataUrl} alt={`${project.title} proje görseli`} className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-center text-xs font-bold text-mugla-navy/35"><span>Proje görseli</span></div>}
  </div>
}

function applicationYear(project: ProjectRecord) {
  const year = new Date(project.createdAt).getFullYear()
  return Number.isFinite(year) ? String(year) : ''
}

type ProjectFilters = {
  query: string
  years: string[]
  districts: string[]
  categories: string[]
  targetGroups: string[]
  statuses: string[]
}

const emptyFilters: ProjectFilters = {
  query: '',
  years: [],
  districts: [],
  categories: [],
  targetGroups: [],
  statuses: [],
}

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value]
}

function FilterSection({title, allLabel, count, children}: {title: string; allLabel: string; count: number; children: ReactNode}) {
  const [open, setOpen] = useState(true)

  return <section className="border-b border-mugla-navy/10 py-3">
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex w-full cursor-pointer items-center justify-between gap-3 text-left text-sm font-black text-mugla-navy">
      <span>{title}</span>
      <span className="rounded-full bg-mugla-sand px-2 py-0.5 text-[11px] font-bold text-mugla-navy/55">{count ? `${count} seçili` : allLabel}</span>
      <ChevronDown size={16} className={`shrink-0 text-mugla-navy/45 transition-transform ${open ? 'rotate-180' : ''}`}/>
    </button>
    {open && <div className="mt-3 grid gap-2">{children}</div>}
  </section>
}

function CheckOption({label, checked, onChange}: {label: string; checked: boolean; onChange: () => void}) {
  return <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-mugla-navy/65 hover:bg-mugla-sand">
    <input type="checkbox" className="h-4 w-4 rounded border-mugla-navy/20 accent-mugla-orange" checked={checked} onChange={onChange}/>
    <span>{label}</span>
  </label>
}

function ProjectRow({project, inBasket, confirmed, votingOpen, onAdd, onShowDetails}: {project: ProjectRecord; inBasket: boolean; confirmed: boolean; votingOpen: boolean; onAdd: (id: string) => void; onShowDetails: (project: ProjectRecord) => void}) {
  const status = String(project.status)
  const canVote = votingOpen && ['Oylamada', 'Yılın Kazanan Adayı'].includes(status)

  return <article onClick={() => onShowDetails(project)} className="fade-up-card cursor-pointer border-b border-mugla-navy/10 bg-white px-4 py-4 last:border-b-0 hover:bg-mugla-sand/35 md:px-5">
    <div className="grid gap-4 md:grid-cols-[150px_minmax(0,1fr)_180px_130px] md:items-center">
      <ProjectImage project={project} className="h-28"/>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-mugla-sand px-2.5 py-1 text-xs font-black text-mugla-navy/65">{project.projectCode}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(status)}`}>{status}</span>
          <CategoryBadge project={project}/>
        </div>
        <h2 className="mt-2 truncate text-lg font-black">{project.title}</h2>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-mugla-navy/55">
          <span className="flex items-center gap-1.5"><MapPin size={14}/>{project.district}</span>
          {project.targetGroup && <span>Hedef grup: {project.targetGroup}</span>}
          <span>Başvuru yılı: {applicationYear(project) || '-'}</span>
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

      <div className="grid gap-2">
        <button type="button" onClick={(event) => {event.stopPropagation(); onShowDetails(project)}} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-mugla-navy/10 bg-white px-4 text-sm font-bold text-mugla-navy/65 hover:border-mugla-orange hover:text-mugla-navy">
          <FileText size={16}/>
          Detay
        </button>
        <button disabled={!canVote || confirmed} onClick={(event) => {event.stopPropagation(); onAdd(project.id)}} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-mugla-orange px-4 text-sm font-bold text-white disabled:bg-mugla-navy/10 disabled:text-mugla-navy/45">
          <ShoppingCart size={16}/>
          {confirmed ? 'Oy alindi' : canVote ? (inBasket ? 'Sepette' : 'Sepete ekle') : 'Takvim bekleniyor'}
        </button>
      </div>
    </div>
  </article>
}

export default function Projects() {
  const {projects} = useProjects()
  const [user] = useState(() => getCurrentUser())
  const {basket, confirmed, remaining, availableForBasket, add} = useVoteBasket(user?.id)
  const [draftFilters, setDraftFilters] = useState<ProjectFilters>(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState<ProjectFilters>(emptyFilters)
  const [participationStep, setParticipationStep] = useState<(typeof participationSteps)[number]['id']>('vote')
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null)
  const [message, setMessage] = useState('')
  const votingOpen = isWithinVotingPeriod()

  const approved = useMemo(() => projects.filter(project => !['Bekliyor', 'Reddedildi'].includes(String(project.moderationStatus))), [projects])
  const districts = useMemo(() => {
    const projectDistricts = approved.map(project => project.district).filter(Boolean)
    return Array.from(new Set([...muglaDistricts, ...projectDistricts])).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [approved])
  const categories = useMemo(() => {
    const formCategories = projectCategories.map(([name]) => name)
    const projectCategoryNames = approved.map(project => project.category).filter(Boolean)
    return Array.from(new Set([...formCategories, ...projectCategoryNames])).sort((a, b) => {
      if (a === 'Diğer') return 1
      if (b === 'Diğer') return -1
      return a.localeCompare(b, 'tr')
    })
  }, [approved])
  const selectedParticipationStep = participationSteps.find(step => step.id === participationStep) ?? participationSteps[0]
  const matchesYear = (project: ProjectRecord) => !appliedFilters.years.length || appliedFilters.years.includes(applicationYear(project))
  const votingProjects = approved.filter(project => matchesYear(project) && ['Oylamada', 'Yılın Kazanan Adayı'].includes(String(project.status)))
  const winnerProjects = approved.filter(project => matchesYear(project) && ['Yılın Kazanan Adayı', 'Tamamlandı'].includes(String(project.status))).sort((a, b) => b.votes - a.votes)
  const filtered = approved.filter(project => {
    const status = String(project.status)
    const matchesStatus = !appliedFilters.statuses.length || appliedFilters.statuses.includes(status) || (appliedFilters.statuses.includes('Tamamlandı') && status.startsWith('Tamamland'))
    const matchesApplicationYear = matchesYear(project)
    const projectText = `${project.title} ${project.summary ?? ''}`.toLocaleLowerCase('tr')
    const matchesProject = projectText.includes(appliedFilters.query.trim().toLocaleLowerCase('tr'))
    const matchesDistrict = !appliedFilters.districts.length || appliedFilters.districts.includes(project.district)
    const matchesCategory = !appliedFilters.categories.length || appliedFilters.categories.includes(project.category)
    const matchesTargetGroup = !appliedFilters.targetGroups.length || appliedFilters.targetGroups.includes(project.targetGroup ?? 'Herkes')
    return matchesStatus && matchesApplicationYear && matchesProject && matchesDistrict && matchesCategory && matchesTargetGroup
  })
  const activeFilterCount = appliedFilters.years.length + appliedFilters.districts.length + appliedFilters.categories.length + appliedFilters.targetGroups.length + appliedFilters.statuses.length + (appliedFilters.query.trim() ? 1 : 0)

  function addToBasket(id: string) {
    if (!user) {
      location.href = '/giris?next=/projeler'
      return
    }
    const result = add(id)
    setMessage(result.message)
  }

  function showDetails(project: ProjectRecord) {
    setSelectedProject(project)
  }

  function toggleDraftFilter(key: keyof Omit<ProjectFilters, 'query'>, value: string) {
    setDraftFilters(current => {
      const next = {...current, [key]: toggleValue(current[key], value)}
      return next
    })
  }

  function clearFilters() {
    setDraftFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  function applyFilters() {
    setAppliedFilters({...draftFilters})
  }

  return <main className="min-h-screen bg-mugla-sand text-mugla-navy">
    <header className="border-b border-mugla-navy/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-mugla-navy/70 hover:text-mugla-navy">
          <ArrowLeft size={16}/> Ana sayfa
        </Link>
        <SiteUserMenu/>
      </div>
    </header>

    <section className="relative isolate overflow-hidden bg-mugla-navy text-white">
      <div className="absolute inset-0 bg-[url('/landing/mugla-hero.png')] bg-cover bg-center"/>
      <div className="absolute inset-0 bg-gradient-to-b from-mugla-navy/35 via-mugla-navy/45 to-mugla-sand"/>
      <div className="relative mx-auto grid min-h-[430px] max-w-5xl content-end px-4 pb-10 pt-24">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-mugla-orange">Projeler</p>
          <h1 className="mt-3 text-4xl font-black leading-tight md:text-6xl">Muğla için önerilen projeleri keşfet</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">Kıyılardan dağ mahallelerine uzanan ortak bütçe fikirlerini ara, filtrele ve oylama takvimi açıldığında sepetine ekle.</p>
        </div>
        <div className="mt-8 rounded-2xl border border-white/30 bg-white/20 p-3 shadow-2xl backdrop-blur-xl">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <p className="rounded-xl bg-white/85 px-4 py-3 text-sm font-black text-mugla-navy shadow-sm">{filtered.length} / {approved.length} proje</p>
            <Link href={user?'/vatandas/panel#sepetim':citizenUrl('/')} className="rounded-xl bg-mugla-orange px-4 py-3 text-center text-sm font-black text-white shadow-sm">Sepetim: {basket.length} · Kredi: {remaining}</Link>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-5xl px-4 py-8">
      <div className="hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-mugla-orange">Projeler</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Proje listesi</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mugla-navy/55">Oylama takvimi açıldığında vatandaşlar istedikleri projeleri destekleyebilir. Şu an oylamaya katılım kapalıdır.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <p className="rounded-full bg-white px-3 py-1 text-sm font-bold text-mugla-navy/60">{filtered.length} / {approved.length} proje</p>
          <Link href={user?'/vatandas/panel#sepetim':citizenUrl('/')} className="rounded-full bg-mugla-navy px-3 py-1 text-sm font-bold text-white">Sepetim: {basket.length} · Kredi: {remaining}</Link>
        </div>
      </div>
      {message && <div className="mt-4 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-mugla-navy/65">{message} {availableForBasket === 0 && remaining > 0 ? 'Sepeti onaylayabilir veya bir proje cikarabilirsiniz.' : ''}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-lg border border-mugla-navy/10 bg-white p-4 shadow-sm lg:sticky lg:top-4">
          <div className="flex items-center justify-between gap-3 border-b border-mugla-navy/10 pb-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-mugla-orange">Filtreleme</p>
              <h2 className="mt-1 text-lg font-black">Proje filtreleri</h2>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-mugla-sand text-mugla-cyan"><SlidersHorizontal size={18}/></span>
          </div>

          <FilterSection title="Proje adı" allLabel="Arama yok" count={draftFilters.query.trim() ? 1 : 0}>
            <label className="flex h-11 items-center gap-2 rounded-lg border border-mugla-navy/10 px-3">
              <Search size={17} className="text-mugla-navy/45"/>
              <input value={draftFilters.query} onChange={event => setDraftFilters(current => ({...current, query: event.target.value}))} placeholder="Proje ara" className="w-full bg-transparent text-sm outline-none"/>
            </label>
          </FilterSection>

          <FilterSection title="Tüm yıllar" allLabel="Tümü" count={draftFilters.years.length}>
            {projectYearOptions.map(year => <CheckOption key={year} label={year} checked={draftFilters.years.includes(year)} onChange={() => toggleDraftFilter('years', year)}/>)}
          </FilterSection>

          <FilterSection title="Tüm ilçeler" allLabel="Tümü" count={draftFilters.districts.length}>
            {districts.map(district => <CheckOption key={district} label={district} checked={draftFilters.districts.includes(district)} onChange={() => toggleDraftFilter('districts', district)}/>)}
          </FilterSection>

          <FilterSection title="Tüm kategoriler" allLabel="Tümü" count={draftFilters.categories.length}>
            {categories.map(category => <CheckOption key={category} label={category} checked={draftFilters.categories.includes(category)} onChange={() => toggleDraftFilter('categories', category)}/>)}
          </FilterSection>

          <FilterSection title="Tüm hedef gruplar" allLabel="Tümü" count={draftFilters.targetGroups.length}>
            {targetGroups.map(group => <CheckOption key={group} label={group} checked={draftFilters.targetGroups.includes(group)} onChange={() => toggleDraftFilter('targetGroups', group)}/>)}
          </FilterSection>

          <FilterSection title="Tüm durumlar" allLabel="Tümü" count={draftFilters.statuses.length}>
            {projectStatusOptions.filter(status => status.value !== 'all').map(status => <CheckOption key={status.value} label={status.label} checked={draftFilters.statuses.includes(status.value)} onChange={() => toggleDraftFilter('statuses', status.value)}/>)}
          </FilterSection>

          <div className="mt-4 grid gap-2">
            <button type="button" onClick={clearFilters} className="h-11 rounded-full border border-mugla-navy/10 bg-white px-4 text-sm font-bold text-mugla-navy/65 hover:border-mugla-orange hover:text-mugla-navy">Seçimleri Temizle</button>
            <button type="button" onClick={applyFilters} className="h-11 rounded-full bg-mugla-orange px-4 text-sm font-bold text-white">Filtrele</button>
          </div>
        </aside>

        <div className="min-w-0">
      <section className="rounded-lg border border-mugla-navy/10 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          {participationSteps.map(step => (
            <button
              key={step.id}
              type="button"
              onClick={() => setParticipationStep(step.id)}
              className={`rounded-lg border px-4 py-3 text-left transition ${participationStep === step.id ? 'border-mugla-orange bg-orange-50 text-mugla-navy' : 'border-mugla-navy/10 bg-mugla-sand/60 text-mugla-navy/65 hover:border-mugla-orange/50'}`}
            >
              <span className="block text-sm font-black">{step.label}</span>
              <span className="mt-1 block text-xs font-bold text-mugla-orange">{step.status}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-mugla-sand/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-mugla-orange">Takvim durumu</p>
              <h2 className="mt-1 text-lg font-black">{selectedParticipationStep.label}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-mugla-navy/60">{votingOpen && participationStep === 'vote' ? 'Oylama takvimi açık. Onaylanan veya birleştirilerek oylamaya sunulan projeleri inceleyip kalan kredinize göre sepete ekleyebilirsiniz.' : selectedParticipationStep.description}</p>
            </div>
            <button type="button" disabled={!votingOpen || participationStep !== 'vote'} className={`rounded-full px-4 py-2 text-xs font-bold ${votingOpen && participationStep === 'vote' ? 'bg-mugla-orange text-white' : 'bg-mugla-navy/10 text-mugla-navy/45'}`}>
              {votingOpen && participationStep === 'vote' ? 'Oylama açık' : selectedParticipationStep.action}
            </button>
          </div>

          {participationStep === 'vote' && <div className="mt-4 grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-mugla-navy">Oylamaya sunulan projeler</p>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-mugla-navy/55">Kalan kredi: {remaining} · Sepete eklenebilir: {availableForBasket}</span>
            </div>
            {votingProjects.length ? votingProjects.map(project => {
              const inBasket = basket.includes(project.id)
              const done = confirmed.includes(project.id)
              return <article key={project.id} onClick={() => showDetails(project)} className="fade-up-card cursor-pointer overflow-hidden rounded-lg border border-mugla-navy/10 bg-white hover:border-mugla-orange/45">
                <ProjectImage project={project} className="h-44 rounded-none border-0"/>
                <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-mugla-sand px-2.5 py-1 text-xs font-black text-mugla-navy/65">{project.projectCode}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(String(project.status))}`}>{project.status}</span>
                    <CategoryBadge project={project}/>
                    {project.mergedFrom?.length ? <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-mugla-cyan">Birleştirilmiş proje</span> : null}
                  </div>
                  <h3 className="mt-2 font-black">{project.title}</h3>
                  <p className="mt-1 text-sm text-mugla-navy/55">{project.district} · {project.votes.toLocaleString('tr-TR')} destek</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={(event) => {event.stopPropagation(); showDetails(project)}} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-mugla-navy/10 bg-white px-4 text-sm font-bold text-mugla-navy/65 hover:border-mugla-orange hover:text-mugla-navy"><FileText size={16}/> Detaylı proje açıklaması</button>
                  <button type="button" disabled={!votingOpen || done || inBasket || availableForBasket === 0} onClick={(event) => {event.stopPropagation(); addToBasket(project.id)}} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-mugla-orange px-4 text-sm font-bold text-white disabled:bg-mugla-navy/10 disabled:text-mugla-navy/45"><ShoppingCart size={16}/>{done ? 'Oy alındı' : inBasket ? 'Sepette' : 'Sepete ekle'}</button>
                </div>
                </div>
              </article>
            }) : <div className="rounded-lg border border-dashed border-mugla-navy/20 bg-white p-6 text-center text-sm font-semibold text-mugla-navy/45">Oylamaya sunulan proje bulunmuyor.</div>}
          </div>}

          {participationStep === 'winners' && <div className="mt-4 grid gap-3">
            <p className="text-sm font-bold text-mugla-navy">Kazanan proje ilanları</p>
            {winnerProjects.length ? winnerProjects.map(project => <article key={project.id} onClick={() => showDetails(project)} className="fade-up-card cursor-pointer overflow-hidden rounded-lg border border-mugla-navy/10 bg-white hover:border-mugla-orange/45">
              <ProjectImage project={project} className="h-44 rounded-none border-0"/>
              <div className="p-4">
              <div className="flex flex-wrap gap-2"><span className="rounded-full bg-mugla-sand px-2.5 py-1 text-xs font-black text-mugla-navy/65">{project.projectCode}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(String(project.status))}`}>{project.status}</span><CategoryBadge project={project}/></div>
              <h3 className="mt-2 font-black">{project.title}</h3>
              <p className="mt-1 text-sm text-mugla-navy/55">{project.district} · {project.votes.toLocaleString('tr-TR')} destek</p>
              </div>
            </article>) : <div className="rounded-lg border border-dashed border-mugla-navy/20 bg-white p-6 text-center text-sm font-semibold text-mugla-navy/45">Kazanan projeler henüz ilan edilmedi.</div>}
          </div>}
        </div>
      </section>

      {selectedProject && <section className="mt-4 rounded-lg border border-mugla-navy/10 bg-white p-5 shadow-sm">
        <ProjectImage project={selectedProject} className="mb-5 h-72"/>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-mugla-orange">Detaylı proje açıklaması</p>
            <h2 className="mt-2 text-2xl font-black">{selectedProject.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-mugla-sand px-2.5 py-1 text-xs font-black text-mugla-navy/65">{selectedProject.projectCode}</span><CategoryBadge project={selectedProject}/>{selectedProject.targetGroup && <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-mugla-cyan">{selectedProject.targetGroup}</span>}<span className="text-sm text-mugla-navy/55">{selectedProject.district} · {formatBudget(selectedProject.budget)}</span></div>
          </div>
          <button type="button" onClick={() => setSelectedProject(null)} className="rounded-full bg-mugla-sand px-4 py-2 text-xs font-bold text-mugla-navy/60">Kapat</button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            ['Amaç', selectedProject.purpose],
            ['Özet', selectedProject.summary],
            ['Faaliyetler', selectedProject.activities],
            ['Beklenen sonuçlar', selectedProject.expectedResults],
            ['Birleştirme notu', selectedProject.mergeNote],
          ].map(([label, value]) => value ? <section key={label} className="rounded-lg bg-mugla-sand/70 p-4"><span className="text-xs font-black uppercase tracking-[.14em] text-mugla-orange">{label}</span><p className="mt-2 whitespace-pre-line text-sm leading-6 text-mugla-navy/65">{value}</p></section> : null)}
        </div>
        <div className="mt-4 rounded-lg border border-mugla-navy/10 p-4">
          <p className="text-xs font-black uppercase tracking-[.14em] text-mugla-orange">Ek dosyalar</p>
          {selectedProject.attachments?.length ? <div className="mt-3 grid gap-2">{selectedProject.attachments.map(file => <p key={`${file.name}-${file.size}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-mugla-sand/70 px-3 py-2 text-sm text-mugla-navy/65"><FileText size={15}/><b>{file.name}</b><span>{(file.size / 1024 / 1024).toFixed(1)} MB</span></p>)}</div> : <p className="mt-2 text-sm text-mugla-navy/45">Bu proje için ek dosya yok.</p>}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-mugla-navy/55">Sepete eklenen projeler vatandaş panelinde onay bekleyen oylama sepetine düşer.</p>
          <button type="button" disabled={!votingOpen || confirmed.includes(selectedProject.id) || basket.includes(selectedProject.id) || availableForBasket === 0 || !['Oylamada', 'Yılın Kazanan Adayı'].includes(String(selectedProject.status))} onClick={() => addToBasket(selectedProject.id)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-mugla-orange px-5 text-sm font-bold text-white disabled:bg-mugla-navy/10 disabled:text-mugla-navy/45"><ShoppingCart size={17}/>{basket.includes(selectedProject.id) ? 'Sepette' : 'Sepete ekle'}</button>
        </div>
      </section>}

      <div className="mt-6 rounded-lg border border-mugla-navy/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-mugla-orange">Proje listesi</p>
            <h2 className="mt-1 text-lg font-black">{filtered.length} proje gösteriliyor</h2>
            <p className="mt-1 text-sm text-mugla-navy/55">{activeFilterCount ? `${activeFilterCount} filtre uygulanıyor.` : 'Tüm projeler listeleniyor.'}</p>
          </div>
          <span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-bold text-mugla-navy/55">{filtered.length} / {approved.length} proje</span>
        </div>
      </div>

      <section className="mt-4 overflow-hidden rounded-lg border border-mugla-navy/10 bg-white">
        {filtered.length ? filtered.map(project => <ProjectRow key={project.id} project={project} inBasket={basket.includes(project.id)} confirmed={confirmed.includes(project.id)} votingOpen={votingOpen} onAdd={addToBasket} onShowDetails={showDetails}/>) : <div className="p-10 text-center">
          <CheckCircle2 className="mx-auto text-mugla-orange"/>
          <h2 className="mt-3 text-xl font-bold">Proje bulunamadi.</h2>
          <p className="mt-2 text-sm text-mugla-navy/55">Filtreyi temizleyebilir veya belediye panelinden yeni proje yayinlayabilirsin.</p>
        </div>}
      </section>
        </div>
      </div>
    </section>
  </main>
}
