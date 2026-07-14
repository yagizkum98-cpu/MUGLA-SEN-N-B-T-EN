'use client'

import Link from 'next/link'
import {useMemo, useState} from 'react'
import {ArrowLeft, CheckCircle2, MapPin, Search, ShoppingCart} from 'lucide-react'
import {getCurrentUser} from '@/lib/local-auth'
import {projectCategories, projectSubcategories, subcategoriesFor} from '@/lib/project-taxonomy'
import {formatBudget, useProjects, type ProjectRecord} from '@/lib/projects-store'
import {useVoteBasket} from '@/lib/vote-basket'

const isVotingPeriodOpen = false
const participationSteps = [
  {
    id: 'vote',
    label: 'Oylamaya Katıl',
    status: 'Şu an açık değil',
    description: 'Vatandaşlar, oylama takvimi başladığında istedikleri projeleri bu adımda destekleyebilecek.',
    action: 'Oylama takvimi bekleniyor',
  },
  {
    id: 'selected',
    label: 'Seçilen Projeler',
    status: 'Şu an açık değil',
    description: 'Oylama dönemi kapandıktan sonra değerlendirmeye alınan ve yılın seçilen proje listesine giren projeler burada yayınlanacak.',
    action: 'Seçilen proje ilanı bekleniyor',
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

function ProjectRow({project, inBasket, confirmed, votingOpen, onAdd}: {project: ProjectRecord; inBasket: boolean; confirmed: boolean; votingOpen: boolean; onAdd: (id: string) => void}) {
  const status = String(project.status)
  const canVote = votingOpen && ['Oylamada', 'Yılın Kazanan Adayı'].includes(status)

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
        {confirmed ? 'Oy alindi' : canVote ? (inBasket ? 'Sepette' : 'Oylamaya katıl') : 'Takvim bekleniyor'}
      </button>
    </div>
  </article>
}

export default function Projects() {
  const {projects} = useProjects()
  const [user] = useState(() => getCurrentUser())
  const {basket, confirmed, remaining, availableForBasket, add} = useVoteBasket(user?.id)
  const [projectQuery, setProjectQuery] = useState('')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [participationStep, setParticipationStep] = useState<(typeof participationSteps)[number]['id']>('vote')
  const [message, setMessage] = useState('')

  const approved = useMemo(() => projects.filter(project => !['Bekliyor', 'Reddedildi'].includes(String(project.moderationStatus))), [projects])
  const districts = useMemo(() => {
    const projectDistricts = approved.map(project => project.district).filter(Boolean)
    return Array.from(new Set([...muglaDistricts, ...projectDistricts])).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [approved])
  const categories = useMemo(() => {
    const formCategories = projectCategories.map(([name]) => name)
    const projectCategoryNames = approved.map(project => project.category).filter(Boolean)
    return Array.from(new Set([...formCategories, ...projectCategoryNames])).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [approved])
  const subcategories = useMemo(() => {
    if (categoryFilter !== 'all') return subcategoriesFor(categoryFilter)
    return Array.from(new Set(Object.values(projectSubcategories).flat())).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [categoryFilter])
  const selectedStatus = projectStatusOptions.find(option => option.value === statusFilter) ?? projectStatusOptions[0]
  const selectedParticipationStep = participationSteps.find(step => step.id === participationStep) ?? participationSteps[0]
  const filtered = approved.filter(project => {
    const status = String(project.status)
    const matchesStatus = statusFilter === 'all' || status === statusFilter || (statusFilter === 'Tamamlandı' && status.startsWith('Tamamland'))
    const projectText = `${project.title} ${project.summary ?? ''}`.toLocaleLowerCase('tr')
    const matchesProject = projectText.includes(projectQuery.toLocaleLowerCase('tr'))
    const matchesDistrict = districtFilter === 'all' || project.district === districtFilter
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter
    const matchesSubcategory = subcategoryFilter === 'all' || project.subcategory === subcategoryFilter
    return matchesStatus && matchesProject && matchesDistrict && matchesCategory && matchesSubcategory
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
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mugla-navy/55">Oylama takvimi açıldığında vatandaşlar istedikleri projeleri destekleyebilir. Şu an oylamaya katılım kapalıdır.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <p className="rounded-full bg-white px-3 py-1 text-sm font-bold text-mugla-navy/60">{filtered.length} / {approved.length} proje</p>
          <Link href={user?'/vatandas/panel#sepetim':'/giris?next=/vatandas/panel'} className="rounded-full bg-mugla-navy px-3 py-1 text-sm font-bold text-white">Sepetim: {basket.length} · Kredi: {remaining}</Link>
        </div>
      </div>
      {message && <div className="mt-4 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-mugla-navy/65">{message} {availableForBasket === 0 && remaining > 0 ? 'Sepeti onaylayabilir veya bir proje cikarabilirsiniz.' : ''}</div>}

      <section className="mt-6 rounded-lg border border-mugla-navy/10 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
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
              <p className="mt-1 max-w-3xl text-sm leading-6 text-mugla-navy/60">{selectedParticipationStep.description}</p>
            </div>
            <button type="button" disabled className="rounded-full bg-mugla-navy/10 px-4 py-2 text-xs font-bold text-mugla-navy/45">
              {selectedParticipationStep.action}
            </button>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-20 mt-6 rounded-lg border border-mugla-navy/10 bg-white p-3 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_150px_160px_180px_180px]">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-mugla-navy/10 px-3">
            <Search size={17} className="text-mugla-navy/45"/>
            <input value={projectQuery} onChange={event => setProjectQuery(event.target.value)} placeholder="Proje ara" className="w-full bg-transparent text-sm outline-none"/>
          </label>
          <select value={districtFilter} onChange={event => setDistrictFilter(event.target.value)} className="h-11 rounded-lg border border-mugla-navy/10 bg-white px-3 text-sm font-semibold text-mugla-navy/70 outline-none">
            <option value="all">Tüm ilçeler</option>
            {districts.map(district => <option key={district} value={district}>{district}</option>)}
          </select>
          <select value={categoryFilter} onChange={event => {setCategoryFilter(event.target.value); setSubcategoryFilter('all')}} className="h-11 rounded-lg border border-mugla-navy/10 bg-white px-3 text-sm font-semibold text-mugla-navy/70 outline-none">
            <option value="all">Tüm kategoriler</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
          <select value={subcategoryFilter} onChange={event => setSubcategoryFilter(event.target.value)} className="h-11 rounded-lg border border-mugla-navy/10 bg-white px-3 text-sm font-semibold text-mugla-navy/70 outline-none">
            <option value="all">Tüm alt kategoriler</option>
            {subcategories.map(subcategory => <option key={subcategory} value={subcategory}>{subcategory}</option>)}
          </select>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-11 rounded-lg border border-mugla-navy/10 bg-white px-3 text-sm font-semibold text-mugla-navy/70 outline-none">
            {projectStatusOptions.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </div>

        <div className="mt-3 rounded-lg bg-mugla-sand/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-mugla-orange">Proje durumu</p>
              <h2 className="mt-1 text-lg font-black">{selectedStatus.label}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-mugla-navy/60">{selectedStatus.description}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-mugla-navy/55">{filtered.length} proje</span>
          </div>
        </div>
      </div>

      <section className="mt-4 overflow-hidden rounded-lg border border-mugla-navy/10 bg-white">
        {filtered.length ? filtered.map(project => <ProjectRow key={project.id} project={project} inBasket={basket.includes(project.id)} confirmed={confirmed.includes(project.id)} votingOpen={isVotingPeriodOpen} onAdd={addToBasket}/>) : <div className="p-10 text-center">
          <CheckCircle2 className="mx-auto text-mugla-orange"/>
          <h2 className="mt-3 text-xl font-bold">Proje bulunamadi.</h2>
          <p className="mt-2 text-sm text-mugla-navy/55">Filtreyi temizleyebilir veya admin panelinden yeni proje yayinlayabilirsin.</p>
        </div>}
      </section>
    </section>
  </main>
}
