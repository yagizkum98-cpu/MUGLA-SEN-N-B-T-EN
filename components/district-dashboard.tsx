'use client'

import Link from 'next/link'
import {motion} from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MapPin,
  Plus,
  ShieldCheck,
  UsersRound,
  Vote,
  WalletCards,
} from 'lucide-react'
import {AppShell} from '@/components/app-shell'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {muglaDistrictDashboards, type MuglaDistrictDashboard} from '@/lib/district-dashboards'
import {formatBudget, useProjects, type ProjectRecord} from '@/lib/projects-store'
import {useCrm} from '@/lib/crm-store'

type DistrictDashboardProps = {
  district?: MuglaDistrictDashboard
}

function isApproved(project: ProjectRecord) {
  return String(project.moderationStatus).startsWith('Onay')
}

function isPending(project: ProjectRecord) {
  return String(project.moderationStatus).startsWith('Bek')
}

function isRejected(project: ProjectRecord) {
  return String(project.moderationStatus).startsWith('Red')
}

function isVoting(project: ProjectRecord) {
  return isApproved(project) && ['Oylamada', 'Yılın Kazanan Adayı'].includes(String(project.status))
}

function isCompleted(project: ProjectRecord) {
  return String(project.status).startsWith('Tamamland')
}

function Metric({label, value, note, icon: Icon, color}: {label: string; value: string; note: string; icon: typeof FolderKanban; color: string}) {
  return <Card><CardContent className="flex min-h-32 items-center gap-4 pt-6">
    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${color}`}><Icon size={22}/></span>
    <div className="min-w-0">
      <p className="text-sm text-mugla-navy/55">{label}</p>
      <strong className="mt-1 block break-words text-2xl">{value}</strong>
      <p className="mt-1 text-xs text-mugla-navy/45">{note}</p>
    </div>
  </CardContent></Card>
}

function StatusBar({label, value, color = 'bg-mugla-cyan'}: {label: string; value: number; color?: string}) {
  return <div>
    <div className="mb-2 flex justify-between text-sm"><span className="text-mugla-navy/60">{label}</span><b>{Math.round(value)}%</b></div>
    <div className="h-2 rounded-full bg-mugla-navy/10"><div className={`h-full rounded-full ${color}`} style={{width: `${Math.min(100, Math.max(0, value))}%`}}/></div>
  </div>
}

function CategoryBadge({label, color}: {label: string; color: string}) {
  return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-black" style={{backgroundColor: `${color}18`, borderColor: `${color}55`, color}}>{label}</span>
}

function EmptyState({title, text}: {title: string; text: string}) {
  return <div className="py-14 text-center text-mugla-navy/45">
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
  const approvedProjects = scopedProjects.filter(isApproved)
  const pendingProjects = scopedProjects.filter(isPending)
  const rejectedProjects = scopedProjects.filter(isRejected)
  const votingProjects = scopedProjects.filter(isVoting)
  const completedProjects = scopedProjects.filter(isCompleted)
  const totalBudget = scopedProjects.reduce((sum, project) => sum + project.budget, 0)
  const approvedBudget = approvedProjects.reduce((sum, project) => sum + project.budget, 0)
  const totalVotes = scopedProjects.reduce((sum, project) => sum + project.votes, 0)
  const approvalRate = scopedProjects.length ? approvedProjects.length / scopedProjects.length * 100 : 0
  const completionRate = approvedProjects.length ? completedProjects.length / approvedProjects.length * 100 : 0
  const votingRate = scopedProjects.length ? votingProjects.length / scopedProjects.length * 100 : 0
  const title = district ? `${district.name} Yönetici Dashboardu` : 'Belediye Yönetici Dashboardu'

  const metrics = [
    {label: 'Toplam proje', value: String(scopedProjects.length), note: `${pendingProjects.length} başvuru inceleme bekliyor`, icon: FolderKanban, color: 'bg-mugla-orange'},
    {label: 'Onaylı portföy', value: formatBudget(approvedBudget), note: `Toplam kayıtlı bütçe ${formatBudget(totalBudget)}`, icon: WalletCards, color: 'bg-mugla-green'},
    {label: 'Canlı oy verisi', value: totalVotes.toLocaleString('tr-TR'), note: `${votingProjects.length} proje oylamada`, icon: Vote, color: 'bg-mugla-cyan'},
    {label: 'Vatandaş kaydı', value: String(scopedCitizens.length), note: `${campaigns.length} iletişim kampanyası kayıtlı`, icon: UsersRound, color: 'bg-mugla-blue'},
  ]

  const statusCards = [
    ['Bekleyen', pendingProjects.length, 'Admin onayı bekleyen başvurular', Clock3, 'text-mugla-orange'],
    ['Onaylanan', approvedProjects.length, 'Yayına ve rapora alınan projeler', CheckCircle2, 'text-green-600'],
    ['Reddedilen', rejectedProjects.length, 'Uygun bulunmayan başvurular', ShieldCheck, 'text-red-600'],
    ['Tamamlanan', completedProjects.length, 'Uygulaması biten projeler', BarChart3, 'text-mugla-blue'],
  ] as const

  return <AppShell role="admin">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-mugla-navy/10 bg-white px-6 py-5 lg:px-10">
      <div>
        <p className="text-xs font-bold tracking-[.2em] text-mugla-orange">{district ? 'İLÇE YÖNETİCİ ALANI' : 'CANLI BELEDİYE VERİ ALANI'}</p>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-mugla-navy/55">Bu dashboard admin paneliyle aynı canlı verileri okur. Veri girişi yoksa tüm göstergeler 0’dan başlar; belediye proje, vatandaş ve oylama verisi girdikçe otomatik dolar.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin"><Button variant="orange"><Plus size={17}/> Veri girişi</Button></Link>
        <Link href="/projeler"><Button variant="outline">Projeleri gör <ArrowUpRight size={17}/></Button></Link>
      </div>
    </header>

    <div className="space-y-8 p-6 lg:p-10">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => <motion.div key={metric.label} initial={{opacity: 0, y: 15}} animate={{opacity: 1, y: 0}} transition={{delay: index * .06}}><Metric {...metric}/></motion.div>)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader>
            <p className="text-xs font-bold tracking-widest text-mugla-cyan">YÖNETİCİ ÖZETİ</p>
            <h2 className="text-xl font-bold">Canlı veri durumu</h2>
            <p className="text-sm text-mugla-navy/55">Belediyenin admin panelinden girdiği proje kayıtları, vatandaş başvuruları, oylar ve CRM kayıtları bu alana yansır.</p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statusCards.map(([label, value, note, Icon, color]) => <div key={label} className="rounded-2xl border border-mugla-navy/10 p-4">
              <Icon className={color}/>
              <p className="mt-4 text-sm text-mugla-navy/55">{label}</p>
              <b className="text-3xl">{value}</b>
              <p className="mt-1 text-xs text-mugla-navy/45">{note}</p>
            </div>)}
          </CardContent>
        </Card>

        <Card className="bg-mugla-navy text-white">
          <CardHeader>
            <Database className="text-mugla-cyan"/>
            <p className="text-xs font-bold tracking-widest text-mugla-cyan">BELEDİYE VERİ GİRİŞİ</p>
            <h2 className="text-xl font-bold">Bilgi alanı</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-white/65">Yönetici; projeyi, başvuru durumunu, bütçeyi, ilçe bilgisini ve vatandaş kayıtlarını admin panelinden girer. Dashboard bu kayıtları ayrı bir işlem yapmadan canlı gösterir.</p>
            <div className="grid gap-3">
              <Link href="/admin" className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-bold text-mugla-navy"><span className="flex items-center gap-2"><FileText size={16}/> Proje ve onay girişi</span><ArrowUpRight size={16}/></Link>
              <Link href="/crm" className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white"><span className="flex items-center gap-2"><UsersRound size={16}/> Vatandaş / CRM verisi</span><ArrowUpRight size={16}/></Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <p className="text-xs font-bold tracking-widest text-mugla-cyan">PERFORMANS</p>
            <h2 className="text-xl font-bold">Anlık oranlar</h2>
          </CardHeader>
          <CardContent className="space-y-5">
            <StatusBar label="Onay oranı" value={approvalRate} color="bg-mugla-green"/>
            <StatusBar label="Oylama aktifliği" value={votingRate} color="bg-mugla-orange"/>
            <StatusBar label="Tamamlanma oranı" value={completionRate} color="bg-mugla-blue"/>
            <div className="rounded-2xl bg-mugla-sand p-4 text-sm text-mugla-navy/60">
              <BarChart3 className="mb-3 text-mugla-orange"/>
              Veri yokken oranlar 0 görünür. İlk proje, ilk vatandaş veya ilk oy kaydı girildiğinde grafikler otomatik güncellenir.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest text-mugla-cyan">PROJE AKIŞI</p>
              <h2 className="mt-1 text-xl font-bold">{district ? `${district.name} proje kayıtları` : 'Son belediye proje kayıtları'}</h2>
            </div>
            <Link className="text-sm font-semibold text-mugla-blue" href="/admin">Yönet <ArrowUpRight className="inline" size={15}/></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {scopedProjects.length ? scopedProjects.slice(0, 6).map(project => <Link href="/admin" key={project.id} className="group flex items-center gap-4 rounded-2xl border border-mugla-navy/10 p-4 hover:border-mugla-blue/40 hover:bg-mugla-sand/60">
              <span className="h-14 w-2 rounded-full" style={{background: project.color}}/>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-mugla-sand px-2 py-0.5 text-xs font-black text-mugla-navy/65">{project.projectCode}</span>
                  <CategoryBadge label={project.category} color={project.color}/>
                </div>
                <p className="mt-2 truncate font-bold">{project.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-mugla-navy/55"><span className="inline-flex items-center gap-1"><MapPin size={12}/>{project.district}</span><span>{project.moderationStatus}</span><span>{formatBudget(project.budget)}</span></div>
              </div>
              <div className="text-right"><strong>{project.votes.toLocaleString('tr-TR')}</strong><p className="text-xs text-mugla-navy/45">oy</p></div>
            </Link>) : <EmptyState title="Henüz veri girişi yok." text="Admin panelinden ilk proje girildiğinde bu alan canlı olarak dolacak."/>}
          </CardContent>
        </Card>
      </section>

      {!district && <Card>
        <CardHeader>
          <p className="text-xs font-bold tracking-widest text-mugla-cyan">İLÇE DAĞILIMI</p>
          <h2 className="mt-1 text-xl font-bold">13 ilçe için canlı yönetici görünümü</h2>
          <p className="mt-1 text-sm text-mugla-navy/55">Her ilçe kartı aynı veri havuzundan beslenir. İlçeye ait kayıt yoksa değerler 0 görünür.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {muglaDistrictDashboards.map((item, index) => {
              const districtProjects = projects.filter(project => project.district === item.name)
              const districtCitizens = citizens.filter(citizen => citizen.district === item.name)
              const districtVotes = districtProjects.reduce((sum, project) => sum + project.votes, 0)
              return <motion.div key={item.slug} initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{delay: .08 + index * .025}}>
                <Link href={item.panelPath} className="relative flex min-h-48 overflow-hidden flex-col justify-between rounded-2xl border border-mugla-navy/10 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-mugla-cyan hover:shadow-soft">
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-mugla-cyan via-mugla-green to-mugla-orange"/>
                  <span className="flex items-center justify-between gap-3"><b>{item.name}</b><span className="grid h-9 w-9 place-items-center rounded-full bg-mugla-sand text-mugla-cyan shadow-sm"><LayoutDashboard size={18}/></span></span>
                  <span className="mt-4 grid grid-cols-3 gap-3 text-xs text-mugla-navy/55">
                    <span><strong className="block text-base text-mugla-navy">{districtProjects.length}</strong>proje</span>
                    <span><strong className="block text-base text-mugla-navy">{districtCitizens.length}</strong>kişi</span>
                    <span><strong className="block text-base text-mugla-navy">{districtVotes.toLocaleString('tr-TR')}</strong>oy</span>
                  </span>
                </Link>
              </motion.div>
            })}
          </div>
        </CardContent>
      </Card>}
    </div>
  </AppShell>
}
