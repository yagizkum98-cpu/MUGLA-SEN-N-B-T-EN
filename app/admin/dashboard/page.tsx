'use client'

import dynamic from 'next/dynamic'
import {useMemo} from 'react'
import {motion} from 'framer-motion'
import {Activity, BarChart3, Coins, FolderKanban, MapPinned, PieChart, UsersRound, Vote} from 'lucide-react'
import {AdminDashboardAuthGate} from '@/components/admin-dashboard/admin-dashboard-auth-gate'
import {AppShell} from '@/components/app-shell'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {formatBudget, type ProjectRecord, useProjects} from '@/lib/projects-store'
import {useCrm, type Citizen} from '@/lib/crm-store'

const ProjectMap = dynamic(() => import('@/components/project-map'), {
  ssr: false,
  loading: () => <div className="grid h-full min-h-[420px] place-items-center rounded-2xl bg-mugla-sand text-sm font-semibold text-mugla-navy/45">Harita hazirlaniyor...</div>,
})

type Distribution = {label: string; value: number; color?: string}

const districtNames = ['Bodrum', 'Dalaman', 'Datca', 'Fethiye', 'Kavaklidere', 'Koycegiz', 'Marmaris', 'Mentese', 'Milas', 'Ortaca', 'Seydikemer', 'Ula', 'Yatagan']
const palette = ['#00a6c8', '#ef7d00', '#6a9d3b', '#006cae', '#7c5bcc', '#0f766e', '#be123c']

function byCount(items: string[], seed?: string[]) {
  const keys = seed?.length ? seed : Array.from(new Set(items))
  return keys.map((label, index) => ({label, value: items.filter(item => item === label).length, color: palette[index % palette.length]}))
}

function budgetByCategory(projects: ProjectRecord[]) {
  const categories = Array.from(new Set(projects.map(project => project.category))).sort((a, b) => a.localeCompare(b, 'tr'))
  return categories.map((label, index) => ({
    label,
    value: projects.filter(project => project.category === label).reduce((sum, project) => sum + Number(project.budget || 0), 0),
    color: palette[index % palette.length],
  }))
}

function ageGroup(age: number) {
  if (!age || age < 18) return 'Belirsiz'
  if (age <= 24) return '18-24'
  if (age <= 34) return '25-34'
  if (age <= 44) return '35-44'
  if (age <= 54) return '45-54'
  if (age <= 64) return '55-64'
  return '65+'
}

function genderLabel(gender: Citizen['gender']) {
  const value = String(gender).toLocaleLowerCase('tr')
  if (value.includes('kad')) return 'Kadin'
  if (value.includes('erk')) return 'Erkek'
  return 'Belirtmeyen'
}

function MiniBarList({items, valueLabel}: {items: Distribution[]; valueLabel?: (value: number) => string}) {
  const max = Math.max(1, ...items.map(item => item.value))
  return <div className="space-y-3">
    {items.length ? items.map(item => <div key={item.label}>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-semibold">{item.label}</span>
        <b>{valueLabel ? valueLabel(item.value) : item.value.toLocaleString('tr-TR')}</b>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-mugla-sand">
        <div className="h-full rounded-full" style={{width: `${Math.max(0, item.value / max * 100)}%`, backgroundColor: item.color ?? '#00a6c8'}}/>
      </div>
    </div>) : <EmptyMetric/>}
  </div>
}

function EmptyMetric() {
  return <div className="grid min-h-28 place-items-center rounded-2xl border border-dashed border-mugla-navy/15 bg-mugla-sand/40 text-center text-sm font-semibold text-mugla-navy/45">0 veri</div>
}

function Donut({items}: {items: Distribution[]}) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  let cursor = 0
  const gradient = total ? items.map(item => {
    const start = cursor
    const end = cursor + item.value / total * 100
    cursor = end
    return `${item.color ?? '#00a6c8'} ${start}% ${end}%`
  }).join(', ') : '#e7e1d7 0 100%'

  return <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
    <div className="mx-auto grid aspect-square w-44 place-items-center rounded-full" style={{background: `conic-gradient(${gradient})`}}>
      <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-sm">
        <b className="text-3xl">{total.toLocaleString('tr-TR')}</b>
        <span className="text-xs font-semibold text-mugla-navy/45">toplam</span>
      </div>
    </div>
    <div className="space-y-2">{items.length ? items.map(item => <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-mugla-sand/55 px-3 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: item.color}}/><span className="truncate">{item.label}</span></span>
      <b>{item.value.toLocaleString('tr-TR')}</b>
    </div>) : <EmptyMetric/>}</div>
  </div>
}

export default function AdminDashboardPage() {
  const {projects} = useProjects()
  const {citizens} = useCrm()

  const analytics = useMemo(() => {
    const published = projects.filter(project => !['Bekliyor', 'Reddedildi'].includes(String(project.moderationStatus)))
    const totalVotes = projects.reduce((sum, project) => sum + Number(project.votes || 0), 0)
    const totalBudget = projects.reduce((sum, project) => sum + Number(project.budget || 0), 0)
    const districtDistribution = byCount(projects.map(project => project.district), districtNames)
    const categoryDistribution = byCount(projects.map(project => project.category))
    const genderDistribution = byCount(citizens.map(citizen => genderLabel(citizen.gender)), ['Kadin', 'Erkek', 'Belirtmeyen'])
    const ageDistribution = byCount(citizens.map(citizen => ageGroup(Number(citizen.age))), ['18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'Belirsiz'])
    const budgetDistribution = budgetByCategory(projects)
    const mapProjects = published.filter(project => Number.isFinite(project.lat) && Number.isFinite(project.lng))

    return {published, totalVotes, totalBudget, districtDistribution, categoryDistribution, genderDistribution, ageDistribution, budgetDistribution, mapProjects}
  }, [projects, citizens])

  const statCards = [
    ['Toplam Proje', projects.length, 'Kayitli proje', FolderKanban],
    ['Toplam Oy', analytics.totalVotes, 'Onayli oylardan canli', Vote],
    ['Katilimci Sayisi', citizens.length, 'CRM ve kayitli kullanici', UsersRound],
    ['Butce Toplami', formatBudget(analytics.totalBudget), 'Tum proje butceleri', Coins],
  ] as const

  return <AdminDashboardAuthGate><AppShell role="admin">
    <header className="border-b border-mugla-navy/10 bg-white px-6 py-5 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[.2em] text-mugla-orange">CANLI VERILER</p>
          <h1 className="mt-1 text-2xl font-bold">Yonetici Dashboard</h1>
          <p className="mt-1 text-sm text-mugla-navy/55">Projeler, oylar, katilimcilar ve dagilimlar otomatik guncellenir.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-700"><span className="h-2 w-2 rounded-full bg-green-500"/> Sistem aktif</span>
      </div>
    </header>

    <main className="space-y-6 p-6 lg:p-10">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(([label, value, note, Icon], index) => <motion.div key={label} initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{delay: index * .05}}>
          <Card><CardContent className="pt-6">
            <Icon className="mb-5 text-mugla-cyan"/>
            <p className="text-sm text-mugla-navy/55">{label}</p>
            <p className="mt-1 text-3xl font-black">{typeof value === 'number' ? value.toLocaleString('tr-TR') : value}</p>
            <p className="mt-1 text-xs font-semibold text-mugla-orange">{note}</p>
          </CardContent></Card>
        </motion.div>)}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader><div className="flex items-center gap-3"><BarChart3 className="text-mugla-cyan"/><div><h2 className="text-xl font-bold">Ilcelere Gore Dagilim</h2><p className="text-sm text-mugla-navy/55">Tum ilceler ilk acilista 0 ile baslar.</p></div></div></CardHeader><CardContent><MiniBarList items={analytics.districtDistribution}/></CardContent></Card>
        <Card><CardHeader><div className="flex items-center gap-3"><PieChart className="text-mugla-cyan"/><div><h2 className="text-xl font-bold">Kategori Bazli Dagilim</h2><p className="text-sm text-mugla-navy/55">Projeler kategoriye gore gruplanir.</p></div></div></CardHeader><CardContent><Donut items={analytics.categoryDistribution}/></CardContent></Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader><div className="flex items-center gap-3"><UsersRound className="text-mugla-cyan"/><div><h2 className="text-xl font-bold">Kadin-Erkek</h2><p className="text-sm text-mugla-navy/55">CRM katilimci profillerinden okunur.</p></div></div></CardHeader><CardContent><MiniBarList items={analytics.genderDistribution}/></CardContent></Card>
        <Card><CardHeader><div className="flex items-center gap-3"><Activity className="text-mugla-cyan"/><div><h2 className="text-xl font-bold">Yas Analizi</h2><p className="text-sm text-mugla-navy/55">Yas araliklari katilimci kayitlariyla guncellenir.</p></div></div></CardHeader><CardContent><MiniBarList items={analytics.ageDistribution}/></CardContent></Card>
      </section>

      <Card>
        <CardHeader><div className="flex items-center gap-3"><MapPinned className="text-mugla-cyan"/><div><h2 className="text-xl font-bold">Harita Analizi</h2><p className="text-sm text-mugla-navy/55">{analytics.mapProjects.length.toLocaleString('tr-TR')} konumlu proje haritada gosteriliyor.</p></div></div></CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-mugla-navy/10">
            <ProjectMap projects={analytics.mapProjects}/>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div className="flex items-center gap-3"><Coins className="text-mugla-cyan"/><div><h2 className="text-xl font-bold">Butce Dagilimi</h2><p className="text-sm text-mugla-navy/55">Kategori bazinda toplam proje butcesi.</p></div></div></CardHeader>
        <CardContent><MiniBarList items={analytics.budgetDistribution} valueLabel={formatBudget}/></CardContent>
      </Card>
    </main>
  </AppShell></AdminDashboardAuthGate>
}
