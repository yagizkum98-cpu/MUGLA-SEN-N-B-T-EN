'use client'

import dynamic from 'next/dynamic'
import {FormEvent, useEffect, useMemo, useState} from 'react'
import {AppShell} from '@/components/app-shell'
import {AdminAuthGate} from '@/components/admin-auth-gate'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {engagementScore, Channel, CrmRole, useCrm, type Citizen} from '@/lib/crm-store'
import {formatBudget, useProjects, type ProjectRecord} from '@/lib/projects-store'
import {turkiyeProvinces} from '@/lib/turkiye-locations'
import {getCurrentAdmin, type AdminAccount} from '@/lib/admin-auth'
import {Activity, BarChart3, BellRing, Bot, Building2, ChevronRight, CircleDollarSign, Coins, FolderKanban, LockKeyhole, MapPinned, Megaphone, PieChart, Plus, Search, ShieldAlert, ShieldCheck, Trash2, UserRound, UsersRound, Vote} from 'lucide-react'

const ProjectMap = dynamic(() => import('@/components/project-map'), {
  ssr: false,
  loading: () => <div className="grid h-full min-h-[420px] place-items-center rounded-2xl bg-mugla-sand text-sm font-semibold text-mugla-navy/45">Harita hazirlaniyor...</div>,
})

type View = 'overview' | 'citizens' | 'segments' | 'communication' | 'districts' | 'moderation' | 'analytics'
type Distribution = {label: string; value: number; color?: string}

const views: [View, string, React.ElementType][] = [
  ['overview', 'Genel Bakis', Activity],
  ['citizens', 'Vatandas 360', UsersRound],
  ['segments', 'Segmentler', UserRound],
  ['communication', 'Iletisim', Megaphone],
  ['districts', 'Ilceler', MapPinned],
  ['moderation', 'AI Moderasyon', ShieldAlert],
  ['analytics', 'BI & Analitik', BarChart3],
]

const districts = ['Bodrum', 'Dalaman', 'Datca', 'Fethiye', 'Kavaklidere', 'Koycegiz', 'Marmaris', 'Mentese', 'Milas', 'Ortaca', 'Seydikemer', 'Ula', 'Yatagan']
const roles: CrmRole[] = ['Vatandas', 'STK', 'Akademisyen', 'Turist', 'Girisimci', 'Ilce Admin', 'Belediye Admin', 'Super Admin'] as CrmRole[]
const interests = ['Genclik', 'Cevre', 'Spor', 'Kultur', 'Turizm', 'Ulasim', 'Egitim']
const channels: Channel[] = ['SMS', 'E-posta', 'Push', 'WhatsApp', 'Telegram']
const palette = ['#00a6c8', '#ef7d00', '#6a9d3b', '#006cae', '#7c5bcc', '#0f766e', '#be123c']
const input = 'w-full rounded-xl border border-mugla-navy/15 bg-white px-4 py-3 text-sm outline-none focus:border-mugla-cyan'

function Empty({icon: Icon, title, text}: {icon: React.ElementType; title: string; text: string}) {
  return <div className="py-14 text-center text-mugla-navy/45"><Icon className="mx-auto mb-3"/><p className="font-semibold">{title}</p><p className="mt-1 text-sm">{text}</p></div>
}

function EmptyMetric() {
  return <div className="grid min-h-28 place-items-center rounded-2xl border border-dashed border-mugla-navy/15 bg-mugla-sand/40 text-center text-sm font-semibold text-mugla-navy/45">0 veri</div>
}

function byCount(items: string[], seed?: string[]) {
  const keys = seed?.length ? seed : Array.from(new Set(items))
  return keys.map((label, index) => ({label, value: items.filter(item => item === label).length, color: palette[index % palette.length]}))
}

function budgetByCategory(projects: ProjectRecord[]) {
  return Array.from(new Set(projects.map(project => project.category))).sort((a, b) => a.localeCompare(b, 'tr')).map((label, index) => ({
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

export default function CrmPage() {
  const [view, setView] = useState<View>('overview')
  const {citizens, campaigns, addCitizen, removeCitizen, addCampaign} = useCrm()
  const {projects} = useProjects()
  const [selected, setSelected] = useState<string | null>(null)
  const [showCitizenForm, setShowCitizenForm] = useState(false)
  const [showCampaignForm, setShowCampaignForm] = useState(false)
  const [query, setQuery] = useState('')
  const [adminUser, setAdminUser] = useState<AdminAccount | null>(null)
  const citizen = citizens.find(item => item.id === selected)
  const canSeeUserInfo = adminUser?.role === 'super-admin'
  const activeUsers = citizens.filter(item => item.lastLogin && Date.now() - new Date(item.lastLogin).getTime() < 30 * 86400000).length
  const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0)
  const usedBudget = projects.filter(project => ['Devam Ediyor', 'TamamlandÄ±'].includes(String(project.status))).reduce((sum, project) => sum + project.budget, 0)
  const foreignUsers = citizens.filter(item => item.nationality === 'foreign').length
  const filtered = citizens.filter(item => `${item.name} ${item.province} ${item.district} ${item.country ?? ''} ${item.role}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')))
  const topProvinces = turkiyeProvinces.map(province => [province, citizens.filter(item => item.province === province).length] as const).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]).slice(0, 12)
  const countryStats = Array.from(new Set(citizens.filter(item => item.nationality === 'foreign' && item.country).map(item => item.country as string))).map(country => [country, citizens.filter(item => item.country === country).length] as const).sort((a, b) => b[1] - a[1]).slice(0, 10)

  const analytics = useMemo(() => {
    const published = projects.filter(project => !['Bekliyor', 'Reddedildi'].includes(String(project.moderationStatus)))
    return {
      totalVotes: projects.reduce((sum, project) => sum + Number(project.votes || 0), 0),
      districtDistribution: byCount(projects.map(project => project.district), districts),
      categoryDistribution: byCount(projects.map(project => project.category)),
      genderDistribution: byCount(citizens.map(item => genderLabel(item.gender)), ['Kadin', 'Erkek', 'Belirtmeyen']),
      ageDistribution: byCount(citizens.map(item => ageGroup(Number(item.age))), ['18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'Belirsiz']),
      budgetDistribution: budgetByCategory(projects),
      mapProjects: published.filter(project => Number.isFinite(project.lat) && Number.isFinite(project.lng)),
    }
  }, [projects, citizens])

  const kpis: [string, string | number, React.ElementType, string][] = [
    ['Toplam kullanici', citizens.length, UsersRound, 'text-mugla-cyan'],
    ['Aktif kullanici', activeUsers, Activity, 'text-mugla-green'],
    ['Toplam proje', projects.length, FolderKanban, 'text-mugla-orange'],
    ['Aktif oylama', projects.filter(project => ['Oylamada', 'YÄ±lÄ±n Kazanan AdayÄ±'].includes(String(project.status))).length, Vote, 'text-violet-600'],
    ['Tamamlanan', projects.filter(project => String(project.status) === 'TamamlandÄ±').length, Building2, 'text-green-600'],
    ['Toplam butce', formatBudget(totalBudget), CircleDollarSign, 'text-mugla-blue'],
    ['Kullanilan butce', formatBudget(usedBudget), CircleDollarSign, 'text-amber-600'],
    ['Iletisim kampanyasi', campaigns.length, BellRing, 'text-rose-600'],
  ]

  const liveStats: [string, string | number, string, React.ElementType][] = [
    ['Toplam Proje', projects.length, 'Kayitli proje', FolderKanban],
    ['Toplam Oy', analytics.totalVotes, 'Canli oy verisi', Vote],
    ['Katilimci Sayisi', citizens.length, 'CRM ve kayitli kullanici', UsersRound],
    ['Butce Toplami', formatBudget(totalBudget), 'Tum proje butceleri', Coins],
  ]

  const segments = useMemo(() => [
    ['Gencler (15-30)', citizens.filter(item => item.age >= 15 && item.age <= 30).length],
    ['Kadinlar', citizens.filter(item => genderLabel(item.gender) === 'Kadin').length],
    ['STKlar', citizens.filter(item => String(item.role).includes('STK')).length],
    ['Akademisyenler', citizens.filter(item => String(item.role).includes('Akademisyen')).length],
    ['Turistler', citizens.filter(item => String(item.role).includes('Turist')).length],
    ['Dijital Gocebeler', citizens.filter(item => String(item.role).includes('Gir') && item.interests.includes('Turizm')).length],
  ] as const, [citizens])

  useEffect(() => {
    getCurrentAdmin().then(setAdminUser)
  }, [])

  function createCitizen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    addCitizen({
      name: String(data.get('name')),
      email: String(data.get('email')),
      phone: String(data.get('phone')),
      nationality: 'tc',
      province: 'Mugla',
      district: String(data.get('district')),
      role: String(data.get('role')) as CrmRole,
      age: Number(data.get('age')),
      gender: String(data.get('gender')) as Citizen['gender'],
      interests: data.getAll('interests').map(String),
      participationCount: 0,
      voteCount: 0,
      proposalCount: 0,
      badges: [],
      lastLogin: '',
    })
    event.currentTarget.reset()
    setShowCitizenForm(false)
  }

  function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    addCampaign({title: String(data.get('title')), segment: String(data.get('segment')), channels: data.getAll('channels').map(String) as Channel[], status: 'Taslak'})
    event.currentTarget.reset()
    setShowCampaignForm(false)
  }

  return <AdminAuthGate><AppShell role="admin">
    <header className="border-b border-mugla-navy/10 bg-white px-6 py-5 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-bold tracking-[.2em] text-mugla-orange">MUGLA DEMOCRACY OS</p><h1 className="text-2xl font-bold">CRM & Analitik Merkezi</h1></div>
        <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-700"><span className="h-2 w-2 rounded-full bg-green-500"/> Sistem aktif</div>
      </div>
      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">{views.map(([id, label, Icon]) => <button key={id} onClick={() => setView(id)} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${view === id ? 'bg-mugla-navy text-white' : 'bg-mugla-sand text-mugla-navy/65 hover:text-mugla-navy'}`}><Icon size={16}/>{label}</button>)}</nav>
    </header>

    <main className="space-y-6 p-6 lg:p-10">
      {view === 'overview' && <section className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><p className="text-xs font-bold tracking-widest text-mugla-cyan">UYRUK</p><h2 className="text-xl font-bold">Katilim kaynagi</h2></CardHeader><CardContent className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-mugla-sand p-4"><b className="text-2xl">{citizens.length - foreignUsers}</b><small className="block text-mugla-navy/50">T.C.</small></div><div className="rounded-2xl bg-mugla-sand p-4"><b className="text-2xl">{foreignUsers}</b><small className="block text-mugla-navy/50">Yabanci</small></div></CardContent></Card>
        <Card><CardHeader><p className="text-xs font-bold tracking-widest text-mugla-cyan">TURKIYE</p><h2 className="text-xl font-bold">Il bazli katilim</h2></CardHeader><CardContent>{topProvinces.length ? topProvinces.map(([province, count]) => <div key={province} className="mb-3 flex items-center justify-between text-sm"><span>{province}</span><b>{count}</b></div>) : <p className="text-sm text-mugla-navy/45">Henuz il verisi yok.</p>}</CardContent></Card>
        <Card><CardHeader><p className="text-xs font-bold tracking-widest text-mugla-cyan">YURTDISI</p><h2 className="text-xl font-bold">Ulke bazli katilim</h2></CardHeader><CardContent>{countryStats.length ? countryStats.map(([country, count]) => <div key={country} className="mb-3 flex items-center justify-between text-sm"><span>{country}</span><b>{count}</b></div>) : <p className="text-sm text-mugla-navy/45">Yabanci uyruklu kayit yok.</p>}</CardContent></Card>
      </section>}

      {view === 'overview' && <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(([label, value, Icon, color]) => <Card key={label}><CardContent className="pt-6"><Icon className={`mb-5 ${color}`} size={24}/><p className="text-sm text-mugla-navy/50">{label}</p><strong className="mt-1 block text-2xl">{value}</strong></CardContent></Card>)}</section>
        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]"><Card><CardHeader><p className="text-xs font-bold tracking-widest text-mugla-cyan">ILCE BAZLI KATILIM</p><h2 className="text-xl font-bold">Katilim yogunlugu</h2></CardHeader><CardContent>{districts.map(district => {const count = citizens.filter(item => item.district === district).length; const max = Math.max(1, ...districts.map(name => citizens.filter(item => item.district === name).length)); return <div key={district} className="mb-4 grid grid-cols-[100px_1fr_35px] items-center gap-3 text-sm"><span>{district}</span><div className="h-2 rounded-full bg-mugla-navy/10"><div className="h-full rounded-full bg-mugla-cyan" style={{width: `${count / max * 100}%`}}/></div><b className="text-right">{count}</b></div>})}</CardContent></Card><Card className="bg-mugla-navy text-white"><CardHeader><Bot className="mb-4 text-mugla-cyan"/><p className="text-xs font-bold tracking-widest text-mugla-cyan">AI CRM ONERISI</p><h2 className="text-xl font-bold">Katilim icgorusu</h2></CardHeader><CardContent><p className="leading-7 text-white/65">{citizens.length ? 'Katilim verileri birikiyor. Dusuk katilimli ilceler icin hedefli kampanya olusturabilirsiniz.' : 'Henuz vatandas verisi yok. Ilk profiller eklendiginde ilce, yas ve ilgi alani analizleri burada olusacak.'}</p><Button onClick={() => setView('communication')} className="mt-6 bg-white text-mugla-navy hover:bg-white/90">Kampanya merkezine git <ChevronRight size={16}/></Button></CardContent></Card></section>
      </>}

      {view === 'citizens' && <>
        <div className="flex flex-wrap items-center justify-between gap-3"><label className="flex min-w-[280px] flex-1 items-center gap-2 rounded-full border bg-white px-4"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} className="w-full bg-transparent py-3 outline-none" placeholder="Ad, ilce veya role gore ara"/></label><Button variant="orange" onClick={() => setShowCitizenForm(value => !value)}><Plus size={17}/> Vatandas ekle</Button></div>
        {showCitizenForm && <Card><CardHeader><h2 className="text-xl font-bold">Yeni CRM profili</h2></CardHeader><CardContent><form onSubmit={createCitizen} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><input required name="name" className={input} placeholder="Ad Soyad"/><input required type="email" name="email" className={input} placeholder="E-posta"/><input name="phone" className={input} placeholder="Telefon"/><select name="district" className={input}>{districts.map(item => <option key={item}>{item}</option>)}</select><select name="role" className={input}>{roles.map(item => <option key={item}>{item}</option>)}</select><input required name="age" type="number" min="15" max="120" className={input} placeholder="Yas"/><select name="gender" className={input}><option>Kadin</option><option>Erkek</option><option>Belirtmek istemiyor</option></select><fieldset className="md:col-span-2 xl:col-span-3"><legend className="mb-2 text-sm font-semibold">Ilgi alanlari</legend><div className="flex flex-wrap gap-2">{interests.map(item => <label key={item} className="rounded-full border bg-white px-3 py-2 text-sm"><input className="mr-2" type="checkbox" name="interests" value={item}/>{item}</label>)}</div></fieldset><Button type="submit" variant="orange">Profili kaydet</Button></form></CardContent></Card>}
        <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]"><Card><CardContent className="pt-6">{filtered.length ? <div className="divide-y">{filtered.map(item => <button key={item.id} onClick={() => setSelected(item.id)} className="flex w-full items-center gap-4 py-4 text-left hover:bg-mugla-sand/60"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mugla-blue text-sm font-bold text-white">{item.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span><span className="min-w-0 flex-1"><b className="block truncate">{item.name}</b><small className="text-mugla-navy/50">{item.district} - {item.role}</small></span><span className="text-right"><b>{engagementScore(item)}/100</b><small className="block text-mugla-navy/45">katilim</small></span></button>)}</div> : <Empty icon={UsersRound} title="Vatandas kaydi yok" text="Ilk 360 profili ekleyerek CRM'i baslatin."/>}</CardContent></Card><Card>{citizen ? <><CardHeader className="border-b"><div className="flex items-start justify-between"><div><p className="text-xs font-bold tracking-widest text-mugla-cyan">360 PROFIL</p><h2 className="mt-1 text-xl font-bold">{citizen.name}</h2><p className="text-sm text-mugla-navy/50">{citizen.district} - {citizen.role}</p></div><button onClick={() => {removeCitizen(citizen.id); setSelected(null)}} className="rounded-full p-2 text-red-600 hover:bg-red-50"><Trash2 size={17}/></button></div></CardHeader><CardContent className="pt-6"><div className="mb-6 flex items-center gap-5"><div className="grid h-24 w-24 place-items-center rounded-full bg-mugla-navy text-2xl font-bold text-white">{engagementScore(citizen)}</div><div><b>Katilim puani</b><p className="text-sm text-mugla-navy/50">AI destekli etkilesim skoru</p></div></div><div className="grid grid-cols-3 gap-3 text-center">{[['Katilim', citizen.participationCount], ['Oy', citizen.voteCount], ['Oneri', citizen.proposalCount]].map(([label, value]) => <div key={label} className="rounded-2xl bg-mugla-sand p-3"><b className="text-xl">{value}</b><small className="block text-mugla-navy/50">{label}</small></div>)}</div><p className="mb-2 mt-6 text-sm font-semibold">Ilgi alanlari</p><div className="flex flex-wrap gap-2">{citizen.interests.length ? citizen.interests.map(item => <span key={item} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-mugla-cyan">{item}</span>) : <span className="text-sm text-mugla-navy/40">Tanimlanmadi</span>}</div></CardContent></> : <CardContent><Empty icon={UserRound} title="Profil secilmedi" text="Detaylari gormek icin listeden bir vatandas secin."/></CardContent>}</Card></section>
      </>}

      {view === 'citizens' && citizen && <Card><CardHeader><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-mugla-navy text-white">{canSeeUserInfo ? <ShieldCheck size={20}/> : <LockKeyhole size={20}/>}</span><div><p className="text-xs font-bold tracking-widest text-mugla-cyan">KULLANICI BILGILERI</p><h2 className="text-xl font-bold">Super admin gorunumu</h2></div></div></CardHeader><CardContent>{canSeeUserInfo ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{[['Ad Soyad', citizen.name], ['E-posta', citizen.email], ['Telefon', citizen.phone || 'Yok'], ['Uyruk', citizen.nationality === 'foreign' ? 'Yabanci uyruklu' : 'T.C. vatandasi'], ['Ulke', citizen.country || 'Turkiye'], ['Il', citizen.province], ['Ilce', citizen.district], ['Rol', citizen.role], ['Dogrulama', citizen.badges.join(', ') || 'Yok'], ['Kayit tarihi', citizen.createdAt ? new Date(citizen.createdAt).toLocaleString('tr-TR') : 'Yok'], ['Son giris', citizen.lastLogin ? new Date(citizen.lastLogin).toLocaleString('tr-TR') : 'Yok'], ['CRM ID', citizen.id]].map(([label, value]) => <div key={label} className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/35 p-4"><p className="text-xs font-semibold text-mugla-navy/45">{label}</p><b className="mt-1 block break-words text-sm">{value}</b></div>)}</div> : <div className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/50 p-5 text-sm leading-6 text-mugla-navy/60"><b className="text-mugla-navy">Bu alan sadece super admin tarafindan gorulebilir.</b><br/>Admin ve yetkili rollerinde vatandas iletisim ve kayit detaylari gizlenir.</div>}</CardContent></Card>}

      {view === 'segments' && <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{segments.map(([name, count], index) => <Card key={name}><CardContent className="pt-6"><div className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${['bg-orange-50 text-mugla-orange', 'bg-violet-50 text-violet-600', 'bg-cyan-50 text-mugla-cyan'][index % 3]}`}><UsersRound/></div><h2 className="font-bold">{name}</h2><strong className="mt-3 block text-3xl">{count}</strong><p className="text-sm text-mugla-navy/45">kullanici</p><Button onClick={() => setView('communication')} variant="ghost" className="mt-4 px-0">Kampanya olustur <ChevronRight size={15}/></Button></CardContent></Card>)}</section>}

      {view === 'communication' && <>
        <div className="flex justify-end"><Button variant="orange" onClick={() => setShowCampaignForm(value => !value)}><Plus size={17}/> Kampanya olustur</Button></div>
        {showCampaignForm && <Card><CardHeader><h2 className="text-xl font-bold">Yeni iletisim kampanyasi</h2><p className="text-sm text-mugla-navy/50">Kampanya taslak olarak kaydedilir; gercek gonderim entegrasyon sonrasi etkinlesir.</p></CardHeader><CardContent><form onSubmit={createCampaign} className="grid gap-4 md:grid-cols-2"><input required name="title" className={input} placeholder="Kampanya adi"/><select name="segment" className={input}>{segments.map(([item]) => <option key={item}>{item}</option>)}</select><fieldset className="md:col-span-2"><legend className="mb-2 text-sm font-semibold">Kanallar</legend><div className="flex flex-wrap gap-2">{channels.map(item => <label key={item} className="rounded-full border bg-white px-3 py-2 text-sm"><input className="mr-2" type="checkbox" name="channels" value={item}/>{item}</label>)}</div></fieldset><Button type="submit" variant="orange">Taslak olustur</Button></form></CardContent></Card>}
        <Card><CardHeader><h2 className="text-xl font-bold">Iletisim merkezi</h2></CardHeader><CardContent>{campaigns.length ? <div className="divide-y">{campaigns.map(item => <div key={item.id} className="flex flex-wrap items-center gap-4 py-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-mugla-orange"><Megaphone/></span><div className="flex-1"><b>{item.title}</b><p className="text-xs text-mugla-navy/50">{item.segment} - {item.channels.join(', ') || 'Kanal secilmedi'}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{item.status}</span></div>)}</div> : <Empty icon={Megaphone} title="Kampanya yok" text="Segmentlere ozel ilk iletisim taslagini olusturun."/>}</CardContent></Card>
      </>}

      {view === 'districts' && <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{districts.map(district => {const users = citizens.filter(item => item.district === district); const districtProjects = projects.filter(item => item.district === district); return <Card key={district}><CardHeader><div className="flex items-center justify-between"><div><p className="text-xs font-bold tracking-widest text-mugla-cyan">ILCE DASHBOARD</p><h2 className="text-xl font-bold">{district}</h2></div><MapPinned className="text-mugla-orange"/></div></CardHeader><CardContent className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-mugla-sand p-4"><b className="text-2xl">{districtProjects.length}</b><small className="block text-mugla-navy/50">proje</small></div><div className="rounded-2xl bg-mugla-sand p-4"><b className="text-2xl">{users.length}</b><small className="block text-mugla-navy/50">katilimci</small></div><div className="col-span-2 rounded-2xl bg-mugla-navy p-4 text-white"><small className="text-white/50">Aktif butce</small><b className="block text-xl">{formatBudget(districtProjects.reduce((sum, project) => sum + project.budget, 0))}</b></div></CardContent></Card>})}</section>}

      {view === 'moderation' && <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]"><Card><CardHeader><p className="text-xs font-bold tracking-widest text-mugla-cyan">AI MODERASYON KUYRUGU</p><h2 className="text-xl font-bold">Guvenlik kontrolleri</h2></CardHeader><CardContent><Empty icon={ShieldAlert} title="Incelenecek kayit yok" text="Yeni icerikler spam, toksik dil, bot ve tekrar kontrolunden gecirilecek."/></CardContent></Card><Card className="bg-mugla-navy text-white"><CardHeader><Bot className="text-mugla-cyan"/><h2 className="text-xl font-bold">Model durumu</h2></CardHeader><CardContent>{[['Spam kontrolu', 0], ['Sahte hesap', 0], ['Toksik icerik', 0], ['Bot tespiti', 0], ['Yinelenen proje', 0]].map(([label, value]) => <div key={label as string} className="flex justify-between border-b border-white/10 py-3 text-sm"><span className="text-white/65">{label as string}</span><b>{value as number}</b></div>)}</CardContent></Card></section>}

      {view === 'analytics' && <>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{liveStats.map(([label, value, note, Icon]) => <Card key={label}><CardContent className="pt-6"><Icon className="mb-5 text-mugla-cyan"/><p className="text-sm text-mugla-navy/55">{label}</p><p className="mt-1 text-3xl font-black">{typeof value === 'number' ? value.toLocaleString('tr-TR') : value}</p><p className="mt-1 text-xs font-semibold text-mugla-orange">{note}</p></CardContent></Card>)}</section>
        <section className="grid gap-6 xl:grid-cols-2">
          <Card><CardHeader><div className="flex items-center gap-3"><BarChart3 className="text-mugla-cyan"/><div><h2 className="text-xl font-bold">Ilcelere Gore Dagilim</h2><p className="text-sm text-mugla-navy/55">Tum ilceler ilk acilista 0 ile baslar.</p></div></div></CardHeader><CardContent><MiniBarList items={analytics.districtDistribution}/></CardContent></Card>
          <Card><CardHeader><div className="flex items-center gap-3"><PieChart className="text-mugla-cyan"/><div><h2 className="text-xl font-bold">Kategori Bazli Dagilim</h2><p className="text-sm text-mugla-navy/55">Projeler kategoriye gore gruplanir.</p></div></div></CardHeader><CardContent><Donut items={analytics.categoryDistribution}/></CardContent></Card>
        </section>
        <section className="grid gap-6 xl:grid-cols-2">
          <Card><CardHeader><div className="flex items-center gap-3"><UsersRound className="text-mugla-cyan"/><div><h2 className="text-xl font-bold">Kadin-Erkek</h2><p className="text-sm text-mugla-navy/55">CRM katilimci profillerinden okunur.</p></div></div></CardHeader><CardContent><MiniBarList items={analytics.genderDistribution}/></CardContent></Card>
          <Card><CardHeader><div className="flex items-center gap-3"><Activity className="text-mugla-cyan"/><div><h2 className="text-xl font-bold">Yas Analizi</h2><p className="text-sm text-mugla-navy/55">Yas araliklari katilimci kayitlariyla guncellenir.</p></div></div></CardHeader><CardContent><MiniBarList items={analytics.ageDistribution}/></CardContent></Card>
        </section>
        <Card><CardHeader><div className="flex items-center gap-3"><MapPinned className="text-mugla-cyan"/><div><h2 className="text-xl font-bold">Harita Analizi</h2><p className="text-sm text-mugla-navy/55">{analytics.mapProjects.length.toLocaleString('tr-TR')} konumlu proje haritada gosteriliyor.</p></div></div></CardHeader><CardContent><div className="overflow-hidden rounded-2xl border border-mugla-navy/10"><ProjectMap projects={analytics.mapProjects}/></div></CardContent></Card>
        <Card><CardHeader><div className="flex items-center gap-3"><Coins className="text-mugla-cyan"/><div><h2 className="text-xl font-bold">Butce Dagilimi</h2><p className="text-sm text-mugla-navy/55">Kategori bazinda toplam proje butcesi.</p></div></div></CardHeader><CardContent><MiniBarList items={analytics.budgetDistribution} valueLabel={formatBudget}/></CardContent></Card>
      </>}
    </main>
  </AppShell></AdminAuthGate>
}
