'use client'

import Link from 'next/link'
import {motion} from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileDown,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  UsersRound,
  Vote,
} from 'lucide-react'
import {AppShell} from '@/components/app-shell'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {muglaDistrictDashboards, type MuglaDistrictDashboard} from '@/lib/district-dashboards'
import {formatBudget, useProjects, type ProjectRecord} from '@/lib/projects-store'
import {useCrm, type Citizen} from '@/lib/crm-store'

type DistrictDashboardProps = {
  district?: MuglaDistrictDashboard
}

const menuItems = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['projeler', 'Projeler', FolderKanban],
  ['oylamalar', 'Oylamalar', Vote],
  ['vatandaslar', 'Vatandaşlar', UsersRound],
  ['basvurular', 'Başvurular', FileText],
  ['istatistikler', 'İstatistikler', BarChart3],
  ['duyurular', 'Duyurular', Bell],
  ['mesajlar', 'Mesajlar', MessageSquare],
  ['takvim', 'Takvim', CalendarDays],
  ['raporlar', 'Raporlar', FileDown],
] as const

const stageRows = [
  ['Başvuru', '🟢'],
  ['Ön İnceleme', '🟡'],
  ['Teknik Değerlendirme', '🔵'],
  ['Oylama', '🟣'],
  ['Uygulama', '🟠'],
  ['Tamamlandı', '✅'],
] as const

function isApproved(project: ProjectRecord) {
  return String(project.moderationStatus).startsWith('Onay')
}

function isPending(project: ProjectRecord) {
  return String(project.moderationStatus).startsWith('Bek')
}

function isRejected(project: ProjectRecord) {
  return String(project.moderationStatus).startsWith('Red')
}

function isCompleted(project: ProjectRecord) {
  return String(project.status).startsWith('Tamamland')
}

function isActive(project: ProjectRecord) {
  return ['Oylamada', 'Yılın Kazanan Adayı', 'Devam Ediyor'].includes(String(project.status))
}

function thisMonth(value: string) {
  const date = new Date(value)
  const now = new Date()
  return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

function districtInitial(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toLocaleUpperCase('tr')
}

function ageBucket(citizen: Citizen) {
  if (citizen.age <= 25) return '18-25'
  if (citizen.age <= 40) return '26-40'
  return '40+'
}

function percent(value: number, total: number) {
  return total ? Math.round(value / total * 100) : 0
}

function groupCount<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, number>()
  items.forEach(item => map.set(getKey(item) || 'Belirtilmedi', (map.get(getKey(item) || 'Belirtilmedi') ?? 0) + 1))
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
}

function MetricCard({label, value, note, icon: Icon}: {label: string; value: string; note: string; icon: typeof FolderKanban}) {
  return <Card><CardContent className="flex min-h-28 items-center gap-4 pt-6">
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mugla-navy text-white"><Icon size={20}/></span>
    <div className="min-w-0">
      <p className="text-sm text-mugla-navy/55">{label}</p>
      <b className="mt-1 block break-words text-2xl">{value}</b>
      <p className="mt-1 text-xs text-mugla-navy/45">{note}</p>
    </div>
  </CardContent></Card>
}

function MiniBar({label, value, total, color = 'bg-mugla-cyan'}: {label: string; value: number; total: number; color?: string}) {
  const width = percent(value, total)
  return <div>
    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
      <span className="truncate text-mugla-navy/60">{label}</span>
      <b>{value.toLocaleString('tr-TR')}</b>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-mugla-navy/10"><span className={`block h-full rounded-full ${color}`} style={{width: `${width}%`}}/></div>
  </div>
}

function CategoryBadge({label, color}: {label: string; color: string}) {
  return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-black" style={{backgroundColor: `${color}18`, borderColor: `${color}55`, color}}>{label}</span>
}

function SectionTitle({eyebrow, title, text}: {eyebrow: string; title: string; text?: string}) {
  return <div>
    <p className="text-xs font-bold tracking-widest text-mugla-cyan">{eyebrow}</p>
    <h2 className="mt-1 text-xl font-bold">{title}</h2>
    {text && <p className="mt-1 text-sm text-mugla-navy/55">{text}</p>}
  </div>
}

function EmptyState({title, text}: {title: string; text: string}) {
  return <div className="py-12 text-center text-mugla-navy/45">
    <FolderKanban className="mx-auto mb-3"/>
    <p className="font-semibold">{title}</p>
    <p className="mt-1 text-sm">{text}</p>
  </div>
}

export function DistrictDashboard({district}: DistrictDashboardProps) {
  const {projects} = useProjects()
  const {citizens, campaigns} = useCrm()
  const scopedProjects = district ? projects.filter(project => project.district === district.name) : projects
  const scopedCitizens = district ? citizens.filter(citizen => citizen.district === district.name) : citizens
  const pendingProjects = scopedProjects.filter(isPending)
  const approvedProjects = scopedProjects.filter(isApproved)
  const rejectedProjects = scopedProjects.filter(isRejected)
  const activeProjects = scopedProjects.filter(isActive)
  const completedProjects = scopedProjects.filter(isCompleted)
  const totalVotes = scopedProjects.reduce((sum, project) => sum + project.votes, 0)
  const monthlyProjects = scopedProjects.filter(project => thisMonth(project.createdAt))
  const monthlyVotes = monthlyProjects.reduce((sum, project) => sum + project.votes, 0)
  const activeVoters = scopedCitizens.filter(citizen => citizen.voteCount > 0 || citizen.participationCount > 0)
  const title = district ? district.name : 'Muğla Büyükşehir'
  const today = new Date().toLocaleDateString('tr-TR', {weekday: 'long', day: 'numeric', month: 'long'})
  const monthTotal = Math.max(1, monthlyProjects.length)
  const topProjects = [...scopedProjects].sort((a, b) => b.votes - a.votes).slice(0, 10)
  const neighborhoodRows = groupCount(scopedProjects, project => project.applicantDistrict || project.district).slice(0, 8)
  const categoryRows = groupCount(scopedProjects, project => project.category).slice(0, 6)
  const genderRows = groupCount(scopedCitizens, citizen => citizen.gender).slice(0, 4)
  const ageRows = groupCount(scopedCitizens, ageBucket)
  const messageCounts = [
    ['Bekleyen', 0],
    ['Cevaplandı', 0],
    ['Kapatıldı', 0],
  ] as const
  const announcementCounts = [
    ['Taslak', campaigns.filter(item => item.status === 'Taslak').length],
    ['Yayınlandı', campaigns.filter(item => item.status === 'Gönderildi').length],
    ['Arşiv', 0],
  ] as const

  const metrics = [
    ['Toplam Proje', scopedProjects.length, 'İlçe veri havuzu', FolderKanban],
    ['Bekleyen Proje', pendingProjects.length, 'Yeni başvurular', Clock3],
    ['Onaylanan', approvedProjects.length, 'Yayına alınan', CheckCircle2],
    ['Reddedilen', rejectedProjects.length, 'Uygun bulunmayan', ShieldCheck],
    ['Devam Eden', activeProjects.length, 'Aktif süreç', BarChart3],
    ['Tamamlanan', completedProjects.length, 'Kapanan iş', CheckCircle2],
    ['Toplam Oy', totalVotes, 'Tüm oylar', Vote],
    ['Katılımcı Sayısı', scopedCitizens.length, 'Kayıtlı vatandaş', UsersRound],
    ['Bu Ay Başvuru', monthlyProjects.length, 'Aylık giriş', FileText],
    ['Bu Ay Oy', monthlyVotes, 'Aylık destek', Vote],
  ] as const

  return <AppShell role="admin">
    <header className="border-b border-mugla-navy/10 bg-white px-6 py-5 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-mugla-navy text-xl font-black text-white">{districtInitial(title)}</span>
          <div>
            <p className="text-xs font-bold tracking-[.2em] text-mugla-orange">{district ? 'İLÇE PANELİ' : 'BÜYÜKŞEHİR PANELİ'}</p>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-mugla-navy/55">{today} · Yönetici görünümü</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin"><Button variant="orange"><FileText size={17}/> Belediye paneli</Button></Link>
          <Link href="/projeler"><Button variant="outline">Projeleri gör <ArrowUpRight size={17}/></Button></Link>
        </div>
      </div>
      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {menuItems.map(([id, label, Icon]) => <a key={id} href={`#${id}`} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-mugla-navy/10 bg-mugla-sand/70 px-4 py-2 text-sm font-bold text-mugla-navy/65 hover:border-mugla-orange hover:text-mugla-navy">
          <Icon size={16}/>{label}
        </a>)}
      </nav>
    </header>

    <div className="space-y-8 p-6 lg:p-10">
      <section id="dashboard" className="scroll-mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value, note, Icon], index) => <motion.div key={label} initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{delay: index * .035}}>
          <MetricCard label={label} value={String(value).toLocaleString()} note={note} icon={Icon}/>
        </motion.div>)}
      </section>

      <section id="istatistikler" className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <Card>
          <CardHeader><SectionTitle eyebrow="GRAFİKLER" title="Oy, başvuru ve kategori dağılımı" text="Veri belediye panelinden geldikçe tüm grafikler otomatik dolar."/></CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-3">
            <section className="space-y-4">
              <h3 className="font-bold">Oy Dağılımı</h3>
              <MiniBar label="Toplam oy" value={totalVotes} total={Math.max(1, totalVotes)} color="bg-mugla-orange"/>
              <MiniBar label="Bu ay oy" value={monthlyVotes} total={Math.max(1, totalVotes)} color="bg-mugla-cyan"/>
              <MiniBar label="Aktif katılımcı" value={activeVoters.length} total={Math.max(1, scopedCitizens.length)} color="bg-mugla-green"/>
            </section>
            <section className="space-y-4">
              <h3 className="font-bold">Kategori Dağılımı</h3>
              {categoryRows.length ? categoryRows.map(([label, value]) => <MiniBar key={label} label={label} value={value} total={scopedProjects.length}/>) : <p className="text-sm text-mugla-navy/45">Kategori verisi yok.</p>}
            </section>
            <section className="space-y-4">
              <h3 className="font-bold">Vatandaş Profili</h3>
              {genderRows.map(([label, value]) => <MiniBar key={label} label={label} value={value} total={Math.max(1, scopedCitizens.length)} color="bg-mugla-orange"/>)}
              {ageRows.map(([label, value]) => <MiniBar key={label} label={label} value={value} total={Math.max(1, scopedCitizens.length)} color="bg-mugla-green"/>)}
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><SectionTitle eyebrow="PROJE DURUMU" title="Süreç aşamaları"/></CardHeader>
          <CardContent className="space-y-3">
            {stageRows.map(([label, icon]) => {
              const count = label === 'Başvuru' ? pendingProjects.length : label === 'Oylama' ? scopedProjects.filter(project => String(project.status) === 'Oylamada').length : label === 'Uygulama' ? scopedProjects.filter(project => String(project.status) === 'Devam Ediyor').length : label === 'Tamamlandı' ? completedProjects.length : 0
              return <div key={label} className="flex items-center justify-between rounded-2xl bg-mugla-sand/70 px-4 py-3">
                <span className="flex items-center gap-3 font-bold"><span>{icon}</span>{label}</span>
                <b>{count}</b>
              </div>
            })}
          </CardContent>
        </Card>
      </section>

      <section id="projeler" className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle eyebrow="PROJELER" title="Liste görünümü" text="Arama, kategori, mahalle, durum ve tarih filtreleri için sade kontrol alanı."/>
              <label className="flex h-11 min-w-[240px] items-center gap-2 rounded-full border border-mugla-navy/10 bg-white px-4"><Search size={16}/><input className="w-full bg-transparent text-sm outline-none" placeholder="Proje ara"/></label>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {scopedProjects.length ? scopedProjects.slice(0, 8).map(project => <Link href="/admin#proje-havuzu" key={project.id} className="flex items-center gap-4 rounded-2xl border border-mugla-navy/10 p-4 hover:border-mugla-orange/50 hover:bg-mugla-sand/50">
              <span className="h-14 w-2 rounded-full" style={{background: project.color}}/>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2"><b className="truncate">{project.title}</b><CategoryBadge label={project.category} color={project.color}/></span>
                <span className="mt-1 flex flex-wrap gap-2 text-xs text-mugla-navy/50"><span>{project.applicantDistrict || project.district}</span><span>{project.moderationStatus}</span><span>{formatBudget(project.budget)}</span></span>
              </span>
              <span className="text-right"><b>{project.votes.toLocaleString('tr-TR')}</b><small className="block text-mugla-navy/45">oy</small></span>
            </Link>) : <EmptyState title="Proje yok" text="Bu ilçede henüz proje kaydı bulunmuyor."/>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><SectionTitle eyebrow="TOP 10" title="En çok oy alan projeler"/></CardHeader>
          <CardContent className="space-y-2">
            {topProjects.length ? topProjects.map((project, index) => <div key={project.id} className="flex items-center gap-3 rounded-xl bg-mugla-sand/65 p-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-black">{index + 1}</span>
              <span className="min-w-0 flex-1"><b className="block truncate text-sm">{project.title}</b><small className="text-mugla-navy/45">{project.district}</small></span>
              <b>{project.votes.toLocaleString('tr-TR')}</b>
            </div>) : <p className="text-sm text-mugla-navy/45">Oy verisi yok.</p>}
          </CardContent>
        </Card>
      </section>

      <section id="basvurular" className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><SectionTitle eyebrow="BAŞVURULAR" title="Son başvurular" text="Yeni gelenler, inceleme ve komisyona gönderme akışı için özet."/></CardHeader>
          <CardContent className="overflow-x-auto">
            {scopedProjects.length ? <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="pb-3">Proje</th><th>Mahalle</th><th>Tarih</th><th>Durum</th></tr></thead>
              <tbody>{scopedProjects.slice(0, 8).map(project => <tr key={project.id} className="border-t border-mugla-navy/10"><td className="py-3 font-bold">{project.title}</td><td>{project.applicantDistrict || project.district}</td><td>{new Date(project.createdAt).toLocaleDateString('tr-TR')}</td><td>{project.moderationStatus}</td></tr>)}</tbody>
            </table> : <EmptyState title="Başvuru yok" text="Yeni başvurular burada listelenir."/>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><SectionTitle eyebrow="MAHALLE HARİTASI" title={`${district?.name ?? 'Muğla'} oy yoğunluğu`}/></CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <div className="grid min-h-64 place-items-center rounded-2xl bg-gradient-to-br from-mugla-cyan/25 via-white to-mugla-orange/20 text-center">
              <div><MapPin className="mx-auto mb-3 text-mugla-orange"/><b>{district?.name ?? '13 İlçe'}</b><p className="mt-1 text-sm text-mugla-navy/50">Mahalle yoğunluğu</p></div>
            </div>
            <div className="space-y-3">
              {neighborhoodRows.length ? neighborhoodRows.map(([label, value]) => <MiniBar key={label} label={label} value={value} total={Math.max(1, scopedProjects.length)} color="bg-mugla-orange"/>) : <p className="text-sm text-mugla-navy/45">Mahalle verisi yok.</p>}
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="oylamalar" className="grid gap-6 xl:grid-cols-3">
        <Card><CardHeader><SectionTitle eyebrow="OYLAMA" title="Aktif oylamalar"/></CardHeader><CardContent className="space-y-3">{activeProjects.length ? activeProjects.map(project => <div key={project.id} className="rounded-xl bg-mugla-sand/70 p-4"><b>{project.title}</b><p className="mt-1 text-sm text-mugla-navy/50">{project.votes.toLocaleString('tr-TR')} oy · Katılım %{percent(project.votes, Math.max(1, totalVotes))}</p></div>) : <p className="text-sm text-mugla-navy/45">Aktif oylama yok.</p>}</CardContent></Card>
        <Card id="vatandaslar"><CardHeader><SectionTitle eyebrow="VATANDAŞLAR" title="Kayıt ve doğrulama"/></CardHeader><CardContent className="grid gap-3"><MetricCard label="Toplam Kayıt" value={String(scopedCitizens.length)} note="İlçe vatandaşları" icon={UsersRound}/><MetricCard label="Aktif Kullanıcı" value={String(activeVoters.length)} note="Oy/katılım izi olanlar" icon={ShieldCheck}/></CardContent></Card>
        <Card id="duyurular"><CardHeader><SectionTitle eyebrow="DUYURULAR" title="Duyuru durumu"/></CardHeader><CardContent className="space-y-3">{announcementCounts.map(([label, value]) => <MiniBar key={label} label={label} value={value} total={Math.max(1, campaigns.length)} color="bg-mugla-green"/>)}</CardContent></Card>
      </section>

      <section id="mesajlar" className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Card><CardHeader><SectionTitle eyebrow="MESAJLAR" title="Vatandaş destek"/></CardHeader><CardContent className="space-y-3">{messageCounts.map(([label, value]) => <div key={label} className="flex justify-between rounded-xl bg-mugla-sand/70 p-4"><span>{label}</span><b>{value}</b></div>)}</CardContent></Card>
        <Card id="takvim"><CardHeader><SectionTitle eyebrow="TAKVİM" title="İlçe süreç takvimi"/></CardHeader><CardContent className="grid gap-3 md:grid-cols-5">{['Başvuru Başlangıcı','Başvuru Sonu','Teknik İnceleme','Oylama','Sonuç'].map((item, index) => <div key={item} className="rounded-2xl border border-mugla-navy/10 p-4"><span className="grid h-8 w-8 place-items-center rounded-full bg-mugla-sand text-xs font-black">{index + 1}</span><b className="mt-4 block text-sm">{item}</b><small className="mt-1 block text-mugla-navy/45">Planlanacak</small></div>)}</CardContent></Card>
      </section>

      <Card id="raporlar">
        <CardHeader><SectionTitle eyebrow="RAPORLAR" title="PDF, Excel ve grafik çıktıları"/></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="orange"><FileDown size={17}/> PDF Rapor</Button>
          <Button variant="outline"><FileSpreadsheet size={17}/> Excel</Button>
          <Button variant="outline"><BarChart3 size={17}/> Grafik</Button>
        </CardContent>
      </Card>

      {!district && <Card>
        <CardHeader><SectionTitle eyebrow="BÜYÜKŞEHİR İZLEME" title="13 ilçenin tamamı" text="Kartlardan ilçeye geçerek aynı arayüzde sadece o ilçenin verisini görebilirsiniz."/></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {muglaDistrictDashboards.map((item, index) => {
            const districtProjects = projects.filter(project => project.district === item.name)
            const districtCitizens = citizens.filter(citizen => citizen.district === item.name)
            const votes = districtProjects.reduce((sum, project) => sum + project.votes, 0)
            const active = districtProjects.filter(isActive).length
            return <motion.div key={item.slug} initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{delay: index * .025}}>
              <Link href={item.panelPath} className="block rounded-2xl border border-mugla-navy/10 bg-white p-4 transition hover:-translate-y-1 hover:border-mugla-cyan hover:shadow-soft">
                <div className="flex items-center justify-between"><b>{item.name}</b><LayoutDashboard className="text-mugla-cyan" size={18}/></div>
                <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-mugla-navy/50">
                  <span><b className="block text-mugla-navy">{districtProjects.length}</b>Başvuru</span>
                  <span><b className="block text-mugla-navy">{votes.toLocaleString('tr-TR')}</b>Oy</span>
                  <span><b className="block text-mugla-navy">{active}</b>Aktif</span>
                  <span><b className="block text-mugla-navy">%{percent(districtCitizens.length, Math.max(1, citizens.length))}</b>Katılım</span>
                </div>
              </Link>
            </motion.div>
          })}
        </CardContent>
      </Card>}
    </div>
  </AppShell>
}
