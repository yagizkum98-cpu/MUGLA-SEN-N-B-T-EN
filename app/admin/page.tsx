'use client'

import {FormEvent, useEffect, useState} from 'react'
import Link from 'next/link'
import {motion} from 'framer-motion'
import {AppShell} from '@/components/app-shell'
import {AdminAuthGate} from '@/components/admin-auth-gate'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {ArrowUpRight, CheckCircle2, Clock3, Database, Eye, EyeOff, FolderKanban, ImagePlus, KeyRound, LayoutDashboard, LockKeyhole, Mail, Plus, ShieldCheck, Trash2, UploadCloud, UserPlus, XCircle} from 'lucide-react'
import {formatBudget, ProjectStatus, type ProjectRecord, useProjects} from '@/lib/projects-store'
import {addAdminAccount, changeOwnAdminPassword, getCurrentAdmin, listAdminAccounts, normalizeAdminRole, removeAdminAccount, revealOwnAdminPassword, type AdminAccount, type AdminRole} from '@/lib/admin-auth'
import {muglaDistrictDashboards} from '@/lib/district-dashboards'
import {annualThemeChangeEvent, annualThemeOptions, annualThemeYears, listAnnualThemeSettings, upsertAnnualThemeSetting, type AnnualThemeId, type AnnualThemeSetting} from '@/lib/annual-themes'
import {type ContactRecord, useContactRecords} from '@/lib/contact-store'
import {projectCategories, targetGroups} from '@/lib/project-taxonomy'
import {useCrm} from '@/lib/crm-store'
import {ageGroup, ageGroups} from '@/lib/demographics'
import {readAuditLog, writeAuditLog, type AuditRecord} from '@/lib/audit-log'

const districts = ['Bodrum', 'Dalaman', 'Datca', 'Fethiye', 'Kavaklidere', 'Koycegiz', 'Marmaris', 'Mentese', 'Milas', 'Ortaca', 'Seydikemer', 'Ula', 'Yatagan']
const categories = projectCategories
const statuses: ProjectStatus[] = ['Başvuru', 'İncelemede', 'Uygun', 'Oylamada', 'Yılın Kazanan Adayı', 'İhale Aşamasında', 'Devam Ediyor', 'Tamamlandı', 'Yapılamadı', 'Ertelendi']
const field = 'w-full rounded-xl border border-mugla-navy/15 bg-white px-4 py-3 outline-none focus:border-mugla-cyan'
const districtGradients = ['from-cyan-50 via-white to-orange-50', 'from-green-50 via-white to-cyan-50', 'from-orange-50 via-white to-lime-50', 'from-sky-50 via-white to-emerald-50'] as const

const roles: {value: AdminRole; label: string; note: string}[] = [
  {value: 'super-admin', label: 'Super admin', note: 'Platform sahibi; sistem, API, backup, audit ve lisans kontrolu'},
  {value: 'belediye-admin', label: 'Belediye admini', note: 'Proje, oylama, CRM, rapor, kategori ve belediye operasyonlari'},
  {value: 'ilce-yoneticisi', label: 'Ilce yoneticisi', note: 'Sadece kendi ilcesindeki proje, vatandas, oy ve raporlar'},
  {value: 'degerlendirici', label: 'Degerlendirici', note: 'Kendisine atanan projelerde teknik/mali degerlendirme'},
  {value: 'crm', label: 'CRM yetkilisi', note: 'Vatandas talep, sikayet, mesaj, destek ve basvuru durumu'},
]
const assignableRoles = roles.filter(role => role.value !== 'super-admin')
const portalLinks = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    url: 'https://muglabutcesenin-dashboard.vercel.app/',
    note: 'Tum portal linklerini, veri akislarini ve panel erisimlerini kontrol etmek icin ana izleme hesabi.',
    badge: 'Kontrol merkezi',
  },
  {
    id: 'landing',
    label: 'Landing',
    url: 'https://muglaseninbutcen.vercel.app/',
    note: 'Kamuya acik ana sayfa ve bilgilendirme vitrini.',
    badge: 'Ana sayfa',
  },
  {
    id: 'belediye',
    label: 'Belediye',
    url: 'https://muglabutcesenin-belediye.vercel.app/',
    note: 'Belediye yonetim paneli, proje havuzu ve onay surecleri.',
    badge: 'Yonetim',
  },
  {
    id: 'kullanici',
    label: 'Kullanıcı',
    url: 'https://muglabutcesenin-vatandas.vercel.app/',
    note: 'Vatandas girisi, fikir basvurusu ve kisisel panel alani.',
    badge: 'Vatandas',
  },
] as const

function CategoryBadge({label, color}: {label: string; color: string}) {
  return <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black" style={{backgroundColor: `${color}18`, borderColor: `${color}55`, color}}>{label}</span>
}

function SuperAdminPortalAccess() {
  const dashboard = portalLinks[0]
  const others = portalLinks.slice(1)

  return <Card>
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-mugla-cyan">SUPER ADMIN PORTAL ERİŞİMLERİ</p>
          <h2 className="mt-1 text-xl font-bold">Portal erişimleri ve bağlantı kontrolü</h2>
          <p className="mt-1 max-w-3xl text-sm text-mugla-navy/55">Bu kart yalnızca super admin hesabında görünür. Proje alanlarının karışmaması, erişimlerin tek merkezden izlenmesi ve bağlantıların doğrulanması için dashboard en üst kontrol noktasıdır.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-black text-green-700"><ShieldCheck size={15}/> Sadece super admin</span>
      </div>
    </CardHeader>
    <CardContent className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
      <a href={dashboard.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border border-mugla-cyan/25 bg-mugla-navy p-5 text-white shadow-soft transition hover:-translate-y-0.5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-mugla-cyan"><LayoutDashboard size={27}/></span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/75">{dashboard.badge}<ArrowUpRight size={14}/></span>
        </div>
        <h3 className="mt-6 text-2xl font-black">{dashboard.label}</h3>
        <p className="mt-2 break-all text-sm font-semibold text-mugla-cyan">{dashboard.url}</p>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">{dashboard.note}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {['Alan kontrolü', 'Veri güvenliği', 'Portal ayrımı'].map(item => <span key={item} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/75">{item}</span>)}
        </div>
      </a>

      <section className="grid gap-3">
        {others.map(item => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group flex items-center gap-4 rounded-2xl border border-mugla-navy/10 bg-white p-4 transition hover:border-mugla-orange/45 hover:bg-mugla-sand/45">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-mugla-sand text-mugla-orange">{item.id === 'landing' ? <Database size={21}/> : item.id === 'belediye' ? <LockKeyhole size={21}/> : <UserPlus size={21}/>}</span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <b>{item.label}</b>
              <span className="rounded-full bg-mugla-sand px-2 py-0.5 text-[11px] font-bold text-mugla-navy/50">{item.badge}</span>
            </span>
            <span className="mt-1 block truncate text-xs font-semibold text-mugla-cyan">{item.url}</span>
            <span className="mt-1 block text-xs leading-5 text-mugla-navy/50">{item.note}</span>
          </span>
          <ArrowUpRight className="shrink-0 text-mugla-navy/35 transition group-hover:text-mugla-orange" size={18}/>
        </a>)}
      </section>
    </CardContent>
  </Card>
}

function SuperAdminSystemSecurity({auditRecords}: {auditRecords: AuditRecord[]}) {
  const systemGroups = [
    ['Sistem Ayarları', ['Domain', 'SMTP', 'SMS API', 'e-Devlet API', 'KVKK ayarları', 'OAuth', 'JWT Secret', 'API Key']],
    ['Kullanıcı Yetkileri', ['Admin oluştur/sil', 'Yetki değiştir', 'Rol oluştur/sil', 'Şifre sıfırla']],
    ['İlçe Yönetimi', ['İlçe oluştur', 'İlçe sil', 'İlçe kapat']],
    ['Oylama Sistemi', ['Oylamayı başlat/durdur', 'Sonuçları kilitle/aç', 'İkinci onay']],
    ['Yapay Zeka', ['Promptlar', 'AI puanlama', 'AI moderasyon', 'AI filtre']],
    ['Yedekleme ve Güncelleme', ['Backup al', 'Restore yap', 'Log indir', 'Migration', 'Sunucu ayarları']],
    ['Gizli Analitik', ['Tüm ilçeler', 'Tüm kullanıcılar', 'Gerçek oylar', 'Sistem performansı']],
  ] as const

  return <Card id="sistem">
    <CardHeader>
      <p className="text-xs font-bold tracking-widest text-mugla-cyan">SUPER ADMIN SİSTEM GÜVENLİĞİ</p>
      <h2 className="text-xl font-bold">Çekirdek ayarlar, ticari koruma ve audit log</h2>
      <p className="text-sm text-mugla-navy/55">Bu alan belediye personeline kapalıdır. Platform sahibi; lisans, entegrasyon, API, backup, log ve güvenlik altyapısını burada kontrol eder.</p>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {['2FA zorunlu', 'API anahtarları gizli', 'Rol değişimi sadece super admin', 'Audit log silinemez'].map(item => <div key={item} className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-black text-green-800"><ShieldCheck className="mb-3" size={20}/>{item}</div>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {systemGroups.map(([title, items]) => <section key={title} className="rounded-2xl border border-mugla-navy/10 bg-white p-4">
          <h3 className="font-black">{title}</h3>
          <div className="mt-3 flex flex-wrap gap-2">{items.map(item => <span key={item} className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-bold text-mugla-navy/60">{item}</span>)}</div>
        </section>)}
      </div>
      <section className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="font-black">Audit Log</h3><p className="mt-1 text-sm text-mugla-navy/55">Kim, ne zaman, hangi işlem yaptı; IP ve tarayıcı bilgisiyle tutulur.</p></div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-mugla-navy/55">{auditRecords.length} kayıt</span>
        </div>
        <div className="mt-4 max-h-80 overflow-auto rounded-xl bg-white">
          {auditRecords.length ? <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="text-mugla-navy/45"><tr><th className="p-3">Tarih</th><th>Kullanıcı</th><th>Rol</th><th>İşlem</th><th>Hedef</th><th>IP</th><th>Tarayıcı</th></tr></thead>
            <tbody>{auditRecords.map(record => <tr key={record.id} className="border-t border-mugla-navy/10">
              <td className="p-3">{new Date(record.createdAt).toLocaleString('tr-TR')}</td>
              <td>{record.actorName}<span className="block text-mugla-navy/40">{record.actorEmail}</span></td>
              <td>{record.actorRole}</td>
              <td className="font-bold">{record.action}</td>
              <td>{record.target ?? '-'}</td>
              <td>{record.ip}</td>
              <td className="max-w-56 truncate">{record.userAgent}</td>
            </tr>)}</tbody>
          </table> : <div className="p-8 text-center text-sm font-semibold text-mugla-navy/45">Henüz audit kaydı yok.</div>}
        </div>
      </section>
    </CardContent>
  </Card>
}

function projectCategoryLabel(project: ProjectRecord) {
  return project.category === 'Diğer' && project.customTheme ? `Diğer: ${project.customTheme}` : project.category
}

function topicLabel(topic: ContactRecord['topic']) {
  return topic === 'Gorus' ? 'Gorus' : topic === 'Oneri' ? 'Oneri' : 'Soru'
}

function ProjectDetailBlock({project}: {project: ProjectRecord}) {
  const details = [
    ['Proje kodu', project.projectCode],
    ['Başvuru sahibi', project.ownerName || project.ownerEmail || 'Belirtilmedi'],
    ['Başvuru türü', project.applicantType ?? 'Bireysel'],
    ['Başvuru konumu', `${project.country ?? 'Türkiye'} / ${project.province ?? 'Muğla'} / ${project.applicantDistrict ?? project.district}`],
    ['Projenin uygulanacağı ilçe', project.district],
    ['Kategori', project.category],
    ['Proje teması', project.customTheme],
    ['Hedef Grup', project.targetGroup ?? 'Herkes'],
    ['Tahmini bütçe', formatBudget(project.budget)],
    ['Amaç', project.purpose],
    ['Özet', project.summary],
    ['Faaliyetler', project.activities],
    ['Beklenen sonuçlar', project.expectedResults],
    ['Ek dosyalar', project.attachments?.length ? project.attachments.map(file => `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`).join(', ') : 'Ek dosya yok'],
  ]

  return <div className="mt-4 grid gap-3 rounded-2xl border border-mugla-cyan/20 bg-cyan-50/35 p-4">
    {details.map(([label, value]) => <div key={label} className="rounded-xl bg-white/80 p-3">
      <p className="text-xs font-black uppercase tracking-wider text-mugla-cyan">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-mugla-navy/70">{value || 'Belirtilmedi'}</p>
    </div>)}
  </div>
}

function PendingProjectCard({
  project,
  selected,
  expanded,
  onToggleMerge,
  onToggleDetails,
  onApprove,
  onReject,
  canReview,
}: {
  project: ProjectRecord
  selected: boolean
  expanded: boolean
  onToggleMerge: () => void
  onToggleDetails: () => void
  onApprove: () => void
  onReject: () => void
  canReview: boolean
}) {
  return <div className="rounded-2xl border border-mugla-navy/10 p-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <label className="flex min-w-0 flex-1 items-start gap-3">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-mugla-orange" checked={selected} onChange={onToggleMerge} />
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{project.title}</p>
            <Button size="sm" variant="outline" type="button" onClick={onToggleDetails}><Eye size={15}/>Detaylı Proje Bilgisi</Button>
          </span>
          <p className="mt-1 text-sm text-mugla-navy/55"><span className="mr-2 rounded-full bg-mugla-sand px-2 py-0.5 text-xs font-black text-mugla-navy/65">{project.projectCode}</span>{project.district} - {projectCategoryLabel(project)} - {project.targetGroup ?? 'Herkes'} - {project.applicantType ?? 'Bireysel'} - {formatBudget(project.budget)}</p>
          {project.summary && <p className="mt-3 max-w-3xl text-sm leading-6 text-mugla-navy/65">{project.summary}</p>}
        </span>
      </label>
      {canReview ? <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="orange" onClick={onApprove}><CheckCircle2 size={15}/>Onayla</Button>
        <Button size="sm" variant="outline" onClick={onReject}><XCircle size={15}/>Reddet</Button>
      </div> : <span className="rounded-full bg-mugla-sand px-3 py-2 text-xs font-bold text-mugla-navy/55">Sadece inceleme</span>}
    </div>
    {expanded && <ProjectDetailBlock project={project}/>}
  </div>
}

function readImageFile(file: File) {
  return new Promise<ProjectRecord['image']>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({name: file.name, size: file.size, type: file.type, dataUrl: String(reader.result)})
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function ProjectManagementPanel({
  project,
  onClose,
  onImage,
  onRemoveImage,
}: {
  project: ProjectRecord
  onClose: () => void
  onImage: (file: File) => void
  onRemoveImage: () => void
}) {
  const detailItems = [
    ['Proje kodu', project.projectCode],
    ['Durum', project.status],
    ['Onay', project.moderationStatus],
    ['İlçe', project.district],
    ['Kategori', project.category],
    ['Proje teması', project.customTheme],
    ['Hedef grup', project.targetGroup ?? 'Herkes'],
    ['Bütçe', formatBudget(project.budget)],
    ['Oy', project.votes.toLocaleString('tr-TR')],
    ['Başvuru sahibi', project.ownerName || project.ownerEmail || 'Belirtilmedi'],
    ['Amaç', project.purpose],
    ['Özet', project.summary],
    ['Faaliyetler', project.activities],
    ['Beklenen sonuçlar', project.expectedResults],
  ]

  return <Card>
    <CardHeader className="flex-row items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold tracking-widest text-mugla-cyan">PROJE KARTI YÖNETİMİ</p>
        <h2 className="mt-1 text-xl font-bold">{project.title}</h2>
        <p className="mt-1 text-sm text-mugla-navy/55">Bu alandan yalnızca belediye panelinde görünen tek proje görseli yüklenir; proje oylamaya sunulduğunda vatandaş kartında otomatik gösterilir.</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-full bg-mugla-sand px-4 py-2 text-xs font-bold text-mugla-navy/60">Kapat</button>
    </CardHeader>
    <CardContent className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <section className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-4">
        <div className="overflow-hidden rounded-xl border border-mugla-navy/10 bg-white">
          {project.image?.dataUrl ? <img src={project.image.dataUrl} alt={`${project.title} proje görseli`} className="h-56 w-full object-cover"/> : <div className="grid h-56 place-items-center text-center text-mugla-navy/45"><div><ImagePlus className="mx-auto mb-2"/><p className="text-sm font-semibold">Proje görseli yok</p></div></div>}
        </div>
        {project.image && <p className="mt-3 truncate text-xs font-semibold text-mugla-navy/55">{project.image.name} - {(project.image.size / 1024 / 1024).toFixed(1)} MB</p>}
        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-mugla-orange px-4 py-3 text-sm font-bold text-white">
          <UploadCloud size={17}/>
          Görsel yükle / güncelle
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => {const file = event.target.files?.[0]; if (file) onImage(file); event.currentTarget.value = ''}}/>
        </label>
        {project.image && <button type="button" onClick={onRemoveImage} className="mt-2 w-full rounded-full border border-mugla-navy/10 bg-white px-4 py-3 text-sm font-bold text-mugla-navy/60 hover:text-red-600"><Trash2 className="mr-2 inline" size={16}/> Görseli kaldır</button>}
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        {detailItems.map(([label, value]) => <div key={label} className="rounded-2xl border border-mugla-navy/10 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-wider text-mugla-cyan">{label}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-mugla-navy/70">{value || 'Belirtilmedi'}</p>
        </div>)}
      </section>
    </CardContent>
  </Card>
}

export default function Admin() {
  const {projects, addProject, mergeProjects, removeProject, reviewProject, updateProject} = useProjects()
  const {records: contactRecords, removeContactRecord} = useContactRecords()
  const {citizens} = useCrm()
  const [open, setOpen] = useState(false)
  const [peopleOpen, setPeopleOpen] = useState(true)
  const [message, setMessage] = useState('')
  const [adminUser, setAdminUser] = useState<AdminAccount | null>(null)
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [mergeSelection, setMergeSelection] = useState<string[]>([])
  const [expandedProjectDetails, setExpandedProjectDetails] = useState<string | null>(null)
  const [managedProjectId, setManagedProjectId] = useState<string | null>(null)
  const [ownPassword, setOwnPassword] = useState<string | null>(null)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [themeSettings, setThemeSettings] = useState<AnnualThemeSetting[]>([])
  const [themeYear, setThemeYear] = useState<string>(annualThemeYears[0])
  const [themeDraft, setThemeDraft] = useState<AnnualThemeId[]>(['all'])
  const [manualProjectCategory, setManualProjectCategory] = useState<string>(categories[0]?.[0] ?? '')
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([])
  const activeRole = normalizeAdminRole(adminUser?.role)
  const isSuperAdmin = activeRole === 'super-admin'
  const isMunicipalityAdmin = activeRole === 'belediye-admin'
  const isDistrictManager = activeRole === 'ilce-yoneticisi'
  const isEvaluator = activeRole === 'degerlendirici'
  const isCrmRole = activeRole === 'crm'
  const canManagePeople = isSuperAdmin
  const canSeeSystem = isSuperAdmin
  const canSeeProjects = !isCrmRole
  const canReviewProjects = isSuperAdmin || isMunicipalityAdmin
  const canSeeCrm = isSuperAdmin || isMunicipalityAdmin || isCrmRole
  const canSeeDistricts = isSuperAdmin || isMunicipalityAdmin
  const canSeeVoting = isSuperAdmin || isMunicipalityAdmin || isDistrictManager
  const canSeeCategories = isSuperAdmin || isMunicipalityAdmin
  const scopedProjects = isCrmRole ? [] : isDistrictManager && adminUser?.district ? projects.filter(project => project.district === adminUser.district) : isEvaluator && adminUser?.assignedProjectIds?.length ? projects.filter(project => adminUser.assignedProjectIds?.includes(project.id)) : projects
  const scopedCitizens = isDistrictManager && adminUser?.district ? citizens.filter(citizen => citizen.district === adminUser.district) : citizens
  const scopedContactRecords = isDistrictManager && adminUser?.district ? contactRecords.filter(record => record.message.includes(adminUser.district ?? '') || record.subject.includes(adminUser.district ?? '')) : contactRecords
  const pendingProjects = scopedProjects.filter(project => project.moderationStatus === 'Bekliyor')
  const selectedMergeProjects = pendingProjects.filter(project => mergeSelection.includes(project.id))
  const managedProject = projects.find(project => project.id === managedProjectId) ?? null
  const allPendingSelected = pendingProjects.length > 0 && pendingProjects.every(project => mergeSelection.includes(project.id))
  const voteLeaderboard = projects
    .filter(project => scopedProjects.some(item => item.id === project.id) && project.moderationStatus === 'Onaylandı' && ['Oylamada', 'Yılın Kazanan Adayı', 'Devam Ediyor', 'Tamamlandı'].includes(String(project.status)))
    .sort((a, b) => b.votes - a.votes)

  async function refreshAccounts() {
    const [current, nextAccounts] = await Promise.all([getCurrentAdmin(), listAdminAccounts()])
    setAdminUser(current)
    setAccounts(nextAccounts)
    if (current) {
      const latest = nextAccounts.find(account => account.id === current.id)
      setAdminUser(latest ?? current)
    }
  }

  useEffect(() => {
    refreshAccounts()
    setAuditRecords(readAuditLog())
    const syncAudit = () => setAuditRecords(readAuditLog())
    const syncThemes = () => {
      const settings = listAnnualThemeSettings()
      setThemeSettings(settings)
      setThemeDraft(settings.find(setting => setting.year === annualThemeYears[0])?.themes ?? ['all'])
    }
    syncThemes()
    window.addEventListener('mugla-admin-audit-log-changed', syncAudit)
    window.addEventListener(annualThemeChangeEvent, syncThemes)
    return () => {
      window.removeEventListener('mugla-admin-audit-log-changed', syncAudit)
      window.removeEventListener(annualThemeChangeEvent, syncThemes)
    }
  }, [])

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const category = String(form.get('category'))
    addProject({
      title: String(form.get('title')).trim(),
      district: String(form.get('district')),
      category,
      customTheme: category === 'Diğer' ? String(form.get('customTheme')).trim() : undefined,
      targetGroup: String(form.get('targetGroup')),
      budget: Number(form.get('budget')),
      status: String(form.get('status')) as ProjectStatus,
      lat: Number(form.get('lat')) || 37.08,
      lng: Number(form.get('lng')) || 28.45,
      color: categories.find(item => item[0] === category)?.[1] ?? '#64748b',
      moderationStatus: 'Onaylandı',
    })
    event.currentTarget.reset()
    setOpen(false)
    setManualProjectCategory(categories[0]?.[0] ?? '')
    writeAuditLog(adminUser, 'Manuel proje ekledi', {target: String(form.get('title')).trim()})
    setMessage('Proje kaydedildi.')
  }

  function toggleMergeSelection(id: string) {
    setMergeSelection(value => value.includes(id) ? value.filter(item => item !== id) : [...value, id])
  }

  function toggleAllPendingSelection() {
    setMergeSelection(allPendingSelected ? [] : pendingProjects.map(project => project.id))
  }

  function reviewMany(ids: string[], moderationStatus: 'Onaylandı' | 'Reddedildi') {
    ids.forEach(id => reviewProject(id, moderationStatus))
    writeAuditLog(adminUser, `Toplu proje ${moderationStatus}`, {target: ids.join(','), details: `${ids.length} proje`})
    setMergeSelection(value => value.filter(id => !ids.includes(id)))
    setExpandedProjectDetails(value => value && ids.includes(value) ? null : value)
    setMessage(`${ids.length} proje ${moderationStatus === 'Onaylandı' ? 'onaylandi ve oylamaya acildi' : 'reddedildi'}.`)
  }

  async function uploadProjectImage(project: ProjectRecord, file: File) {
    if (!file.type.startsWith('image/')) {
      setMessage('Lutfen PNG, JPG veya WEBP formatinda bir gorsel secin.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Proje gorseli en fazla 2 MB olabilir.')
      return
    }
    try {
      const image = await readImageFile(file)
      updateProject(project.id, {image})
      setManagedProjectId(project.id)
      writeAuditLog(adminUser, 'Proje gorseli guncelledi', {target: project.projectCode, details: project.title})
      setMessage(`${project.title} icin proje gorseli guncellendi.`)
    } catch {
      setMessage('Proje gorseli okunamadi. Lutfen farkli bir dosya deneyin.')
    }
  }

  function removeProjectImage(project: ProjectRecord) {
    updateProject(project.id, {image: undefined})
    setManagedProjectId(project.id)
    writeAuditLog(adminUser, 'Proje gorseli kaldirdi', {target: project.projectCode, details: project.title})
    setMessage(`${project.title} icin proje gorseli kaldirildi.`)
  }

  function submitMergedProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const category = String(form.get('category'))
    try {
      const project = mergeProjects(mergeSelection, {
        title: String(form.get('title')).trim(),
        district: String(form.get('district')),
        category,
        targetGroup: String(form.get('targetGroup')),
        budget: Number(form.get('budget')) || 0,
        status: 'Oylamada',
        lat: Number(form.get('lat')) || 37.08,
        lng: Number(form.get('lng')) || 28.45,
        color: selectedMergeProjects[0]?.color ?? categories.find(item => item[0] === category)?.[1] ?? '#64748b',
        purpose: String(form.get('purpose')).trim(),
        summary: String(form.get('summary')).trim(),
        activities: selectedMergeProjects.map(project => project.activities).filter(Boolean).join('\n\n'),
        expectedResults: selectedMergeProjects.map(project => project.expectedResults).filter(Boolean).join('\n\n'),
        mergeNote: String(form.get('mergeNote')).trim(),
      })
      event.currentTarget.reset()
      setMergeSelection([])
      writeAuditLog(adminUser, 'Projeleri birlestirdi', {target: project.projectCode, details: mergeSelection.join(',')})
      setMessage(`${project.title} birleştirilmiş proje olarak onaylandı ve oylamaya açıldı.`)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Projeler birleştirilemedi.')
    }
  }

  async function submitPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!adminUser) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      await addAdminAccount({
        name: String(form.get('name')).trim(),
        email: String(form.get('email')).trim(),
        role: String(form.get('role')) as AdminRole,
        password: String(form.get('password')),
        actor: adminUser,
      })
      formElement.reset()
      writeAuditLog(adminUser, 'Admin hesabi tanimladi', {target: String(form.get('email')).trim(), details: String(form.get('role'))})
      setMessage('Yetkili hesap tanimlandi.')
      await refreshAccounts()
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Hesap tanimlanamadi.')
    }
  }

  async function toggleOwnPassword() {
    if (!adminUser) return
    if (passwordVisible) {
      setPasswordVisible(false)
      return
    }
    setOwnPassword(await revealOwnAdminPassword(adminUser))
    setPasswordVisible(true)
  }

  async function submitOwnPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!adminUser) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const currentPassword = String(form.get('currentPassword'))
    const newPassword = String(form.get('newPassword'))
    const confirmPassword = String(form.get('confirmPassword'))
    if (newPassword !== confirmPassword) {
      setMessage('Yeni sifre tekrari eslesmiyor.')
      return
    }
    setPasswordChanging(true)
    try {
      const updated = await changeOwnAdminPassword({actor: adminUser, currentPassword, newPassword})
      if (updated) setAdminUser(updated)
      setOwnPassword(newPassword)
      setPasswordVisible(false)
      formElement.reset()
      setMessage('Sifren kendi sectigin yeni sifreyle guncellendi. Yeni sifreyi goz ikonuyla sadece kendi hesabinda gorebilirsin.')
      writeAuditLog(adminUser, 'Kendi sifresini guncelledi')
      await refreshAccounts()
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Sifre guncellenemedi.')
    } finally {
      setPasswordChanging(false)
    }
  }

  async function deletePerson(id: string) {
    if (!adminUser) return
    const target = accounts.find(account => account.id === id)
    if (!target || !confirm(`${target.name} hesabini sistemden kaldirmak istiyor musun? Bu kisi artik belediye paneline giremez.`)) return
    try {
      await removeAdminAccount(id, adminUser)
      writeAuditLog(adminUser, 'Admin hesabi sildi', {target: target.email, details: target.role})
      setMessage('Yetkili hesap silindi.')
      await refreshAccounts()
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Hesap silinemedi.')
    }
  }

  function themesForYear(year: string) {
    return themeSettings.find(setting => setting.year === year)?.themes ?? ['all' as AnnualThemeId]
  }

  function changeThemeYear(year: string) {
    setThemeYear(year)
    setThemeDraft(themesForYear(year))
  }

  function toggleTheme(theme: AnnualThemeId, checked: boolean) {
    setThemeDraft(current => {
      if (theme === 'all') return checked ? ['all'] : []
      const withoutAll = current.filter(item => item !== 'all')
      const next = checked ? [...withoutAll, theme] : withoutAll.filter(item => item !== theme)
      return next.length ? next : ['all']
    })
  }

  function submitAnnualThemes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (adminUser?.role !== 'super-admin') {
      setMessage('Yillik tema ayarlarini sadece super admin guncelleyebilir.')
      return
    }
    const updated = upsertAnnualThemeSetting(themeYear, themeDraft)
    setThemeSettings(listAnnualThemeSettings())
    setThemeDraft(updated.themes)
    writeAuditLog(adminUser, 'Yillik tema kuralini guncelledi', {target: updated.year, details: updated.themes.join(',')})
    setMessage(`${updated.year} yili icin tema kuralı guncellendi.`)
  }

  const stats = [
    ['Toplam proje', scopedProjects.length, isDistrictManager ? 'Kendi ilcenizdeki projeler' : 'Yetkinize giren projeler', FolderKanban],
    ['Onay bekleyen', pendingProjects.length, 'Belediye karari bekliyor', Clock3],
    ['Oylamada', scopedProjects.filter(p => !['Bekliyor', 'Reddedildi'].includes(String(p.moderationStatus)) && ['Oylamada', 'Yılın Kazanan Adayı'].includes(String(p.status))).length, 'Projeler sekmesinde', CheckCircle2],
    ['Yetkili kisi', accounts.length, 'Tanimli admin hesaplari', ShieldCheck],
  ] as const

  const contactGroups = [
    ['Vatandas verileri', scopedContactRecords, 'Formu dolduran kisilerin iletisim bilgileri'],
    ['Gorus ve oneriler', scopedContactRecords.filter(record => record.topic === 'Gorus' || record.topic === 'Oneri'), 'Gorus ve oneri olarak isaretlenen talepler'],
    ['Sorular', scopedContactRecords.filter(record => record.topic === 'Soru'), 'Soru olarak isaretlenen talepler'],
  ] as const
  const ageDistribution = ageGroups.map(group => ({
    label: group,
    value: scopedCitizens.filter(citizen => ageGroup(Number(citizen.age)) === group).length,
  }))
  const maxAgeGroup = Math.max(1, ...ageDistribution.map(item => item.value))

  return <AdminAuthGate><AppShell role="admin">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-mugla-navy/10 bg-white px-6 py-5 lg:px-10">
      <div>
        <p className="text-xs font-bold tracking-[.2em] text-mugla-orange">YONETIM MERKEZI</p>
        <h1 className="text-2xl font-bold">Belediye Paneli</h1>
        <p className="mt-1 text-sm text-mugla-navy/55">{adminUser ? `${adminUser.name} - ${adminUser.role}` : 'Yetki kontrol ediliyor'}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {canManagePeople && <Button variant="outline" onClick={() => setPeopleOpen(value => !value)}><UserPlus size={17}/>{peopleOpen ? 'Kisileri kapat' : 'Yetkili kisiler'}</Button>}
        {canReviewProjects && <Button variant="orange" onClick={() => setOpen(value => !value)}><Plus size={17}/>{open ? 'Formu kapat' : 'Manuel proje ekle'}</Button>}
      </div>
    </header>

    <div className="space-y-7 p-6 lg:p-10">
      {message && <div className="rounded-2xl bg-green-50 px-5 py-4 text-sm font-semibold text-green-800">{message}</div>}

      {isSuperAdmin && <SuperAdminPortalAccess/>}
      {canSeeSystem && <SuperAdminSystemSecurity auditRecords={auditRecords}/>}

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Kendi hesabim</h2>
          <p className="text-sm text-mugla-navy/55">Super admin, admin ve yetkili rollerinin tamami kendi hesabinin sifresini buradan istedigi yeni sifreyle guncelleyebilir. Sifre alani yalnizca oturumdaki kullanici icin acilir.</p>
        </CardHeader>
        <CardContent className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
          <section className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-mugla-navy text-white"><KeyRound size={20}/></span>
              <div>
                <p className="font-bold">{adminUser?.name ?? 'Yonetici'}</p>
                <p className="text-sm text-mugla-navy/55">{adminUser?.email ?? 'Oturum kontrol ediliyor'}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
                <span className="text-mugla-navy/55">Rol</span>
                <b>{adminUser?.role ?? '-'}</b>
              </div>
              <div className="rounded-xl bg-white p-4">
                <span className="text-sm text-mugla-navy/55">Sifre</span>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-mugla-navy/5 px-3 py-2 text-sm font-bold">
                    {passwordVisible ? ownPassword ?? 'Sifre once guncellendiginde goruntulenir.' : '••••••••••••'}
                  </code>
                  <button type="button" onClick={toggleOwnPassword} aria-label={passwordVisible ? 'Sifreyi gizle' : 'Sifreyi goster'} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-mugla-navy/15 bg-white text-mugla-navy/65 hover:text-mugla-blue">
                    {passwordVisible ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
                {!ownPassword && passwordVisible && <p className="mt-2 text-xs text-mugla-navy/45">Eski hash kayitlari geri cozulmez; sifreni guncelledikten sonra bu alanda yalnizca sen gorebilirsin.</p>}
              </div>
            </div>
          </section>
          <form onSubmit={submitOwnPassword} className="grid gap-4 md:grid-cols-3">
            <label><span className="mb-2 block text-sm font-semibold">Mevcut sifre</span><input className={field} name="currentPassword" type="password" required minLength={8}/></label>
            <label><span className="mb-2 block text-sm font-semibold">Istediğiniz yeni sifre</span><input className={field} name="newPassword" type="password" required minLength={8}/></label>
            <label><span className="mb-2 block text-sm font-semibold">Yeni sifre tekrar</span><input className={field} name="confirmPassword" type="password" required minLength={8}/></label>
            <p className="text-sm leading-6 text-mugla-navy/50 md:col-span-3">Yeni sifre en az 8 karakter olabilir; kaydedildikten sonra yalnizca ilgili kullanici kendi hesabinda gorup tekrar degistirebilir.</p>
            <div className="md:col-span-3"><Button type="submit" variant="orange" disabled={passwordChanging}><KeyRound size={17}/>{passwordChanging ? 'Guncelleniyor...' : 'Kendi sifremi guncelle'}</Button></div>
          </form>
        </CardContent>
      </Card>

      {peopleOpen && canManagePeople && <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Yetkili kisiler</h2>
          <p className="text-sm text-mugla-navy/55">Sadece tanimli super admin, admin ve yetkili hesaplar belediye paneline girebilir. Admin ve yetkili hesaplarini yalnizca super admin ekleyip silebilir.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {canManagePeople ? <form onSubmit={submitPerson} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label><span className="mb-2 block text-sm font-semibold">Ad Soyad</span><input className={field} name="name" required minLength={3}/></label>
            <label><span className="mb-2 block text-sm font-semibold">E-posta</span><input className={field} name="email" type="email" required/></label>
            <label><span className="mb-2 block text-sm font-semibold">Rol</span><select className={field} name="role" required>{assignableRoles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Gecici sifre</span><input className={field} name="password" type="password" required minLength={8}/></label>
            <div className="md:col-span-2 xl:col-span-4"><Button type="submit" variant="orange"><UserPlus size={17}/> Yetkili tanimla</Button></div>
          </form> : <p className="rounded-2xl bg-mugla-sand/70 p-4 text-sm font-semibold text-mugla-navy/55">Hesap ekleme ve silme yetkisi sadece super admin hesabindadir.</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="pb-3">Kisi</th><th>E-posta</th><th>Rol</th><th>Tanimlayan</th><th className="text-right">Islem</th></tr></thead>
              <tbody>{accounts.map(account => <tr key={account.id} className="border-t border-mugla-navy/10">
                <td className="py-4 font-semibold">{account.name}</td>
                <td>{account.email}</td>
                <td><span className="inline-flex items-center gap-2 rounded-full bg-mugla-sand px-3 py-1 text-xs font-bold text-mugla-navy/65"><ShieldCheck size={13}/>{account.role}</span></td>
                <td className="text-mugla-navy/45">{account.createdBy ?? 'sistem'}</td>
                <td className="text-right">{canManagePeople && account.role !== 'super-admin' && account.id !== adminUser.id ? <button aria-label={`${account.name} hesabini sil`} className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100" onClick={() => deletePerson(account.id)}>Sil</button> : <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Sistemde</span>}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>}

      {canSeeCategories && <Card>
        <CardHeader>
          <p className="text-xs font-bold tracking-widest text-mugla-cyan">YILLIK TEMA KURALLARI</p>
          <h2 className="text-xl font-bold">Vatandas fikir gonderim temalari</h2>
          <p className="text-sm text-mugla-navy/55">Super admin her yil icin tum temalari acabilir veya Afet, Cevre, Genclik, Sosyal Politikalar gibi birden fazla temayi secerek vatandasin sadece o alanlarda fikir gondermesini saglar.</p>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
          <section className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="pb-3">Yil</th><th>Acik temalar</th><th>Durum</th></tr></thead>
              <tbody>{annualThemeYears.map(year => {
                const themes = themesForYear(year)
                const labels = themes.includes('all') ? ['Tum temalar'] : themes.map(theme => annualThemeOptions.find(option => option.id === theme)?.label ?? theme)
                return <tr key={year} className="border-t border-mugla-navy/10">
                  <td className="py-4 font-black">{year}</td>
                  <td><div className="flex flex-wrap gap-2">{labels.map(label => <span key={label} className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-bold text-mugla-navy/65">{label}</span>)}</div></td>
                  <td><span className={`rounded-full px-3 py-1 text-xs font-bold ${themes.includes('all') ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-mugla-orange'}`}>{themes.includes('all') ? 'Serbest' : 'Tema sinirli'}</span></td>
                </tr>
              })}</tbody>
            </table>
          </section>

          <form onSubmit={submitAnnualThemes} className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-5">
            <label><span className="mb-2 block text-sm font-semibold">Yil</span><select className={field} value={themeYear} onChange={event => changeThemeYear(event.target.value)} required>{annualThemeYears.map(year => <option key={year} value={year}>{year}</option>)}</select></label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {annualThemeOptions.map(theme => <label key={theme.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-mugla-navy/10 bg-white p-3">
                <input type="checkbox" value={theme.id} checked={themeDraft.includes(theme.id)} onChange={event => toggleTheme(theme.id, event.target.checked)} className="mt-1 h-4 w-4 accent-mugla-orange"/>
                <span><b className="block text-sm">{theme.label}</b><small className="mt-1 block leading-5 text-mugla-navy/50">{theme.note}</small></span>
              </label>)}
            </div>
            {adminUser?.role !== 'super-admin' && <p className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold text-mugla-navy/55">Bu ayari yalnizca super admin degistirebilir. Diger roller mevcut kurallari gorur.</p>}
            <div className="mt-5"><Button type="submit" variant="orange" disabled={adminUser?.role !== 'super-admin'}><ShieldCheck size={17}/> Tema kuralini kaydet</Button></div>
          </form>
        </CardContent>
      </Card>}

      {open && canReviewProjects && <Card>
        <CardHeader><h2 className="text-xl font-bold">Yeni proje kaydi</h2><p className="text-sm text-mugla-navy/55">Kaydedilen proje dogrudan onayli olarak proje listesine yansir.</p></CardHeader>
        <CardContent><form onSubmit={submitProject} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-sm font-semibold">Proje adi</span><input className={field} name="title" required/></label>
          <label><span className="mb-2 block text-sm font-semibold">Ilce</span><select className={field} name="district" required>{districts.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-semibold">Kategori</span><select className={field} name="category" required value={manualProjectCategory} onChange={event => setManualProjectCategory(event.target.value)}>{categories.map(([x]) => <option key={x}>{x}</option>)}</select></label>
          {manualProjectCategory === 'Diğer' && <label><span className="mb-2 block text-sm font-semibold">Proje teması</span><input className={field} name="customTheme" required maxLength={120} placeholder="Manuel tema yazın"/></label>}
          <label><span className="mb-2 block text-sm font-semibold">Hedef Grup</span><select className={field} name="targetGroup" required>{targetGroups.map(group => <option key={group}>{group}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-semibold">Durum</span><select className={field} name="status" required>{statuses.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-semibold">Butce (TL)</span><input className={field} name="budget" type="number" min="0" step="1" required/></label>
          <label><span className="mb-2 block text-sm font-semibold">Enlem</span><input className={field} name="lat" type="number" step="any" placeholder="37.08"/></label>
          <label><span className="mb-2 block text-sm font-semibold">Boylam</span><input className={field} name="lng" type="number" step="any" placeholder="28.45"/></label>
          <div className="md:col-span-2 xl:col-span-3"><Button type="submit" variant="orange">Projeyi kaydet</Button></div>
        </form></CardContent>
      </Card>}

      <section id="analitik" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, note, Icon], i) => <motion.div initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{delay: i * .07}} key={label}><Card><CardContent className="pt-6"><Icon className="mb-5 text-mugla-cyan"/><p className="text-sm text-mugla-navy/55">{label}</p><p className="text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-mugla-orange">{note}</p></CardContent></Card></motion.div>)}</section>

      {canSeeCrm && <Card>
        <CardHeader>
          <p className="text-xs font-bold tracking-widest text-mugla-cyan">VATANDAS DEMOGRAFISI</p>
          <h2 className="text-xl font-bold">Yaş aralığı verileri</h2>
          <p className="text-sm text-mugla-navy/55">Üye ol formundaki doğum tarihi CRM ile birlikte otomatik yaş aralığına dönüştürülür.</p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {ageDistribution.map(item => <div key={item.label} className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-4">
            <div className="flex items-center justify-between gap-3">
              <b>{item.label}</b>
              <span className="text-2xl font-black">{item.value}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <span className="block h-full rounded-full bg-mugla-cyan" style={{width: `${item.value / maxAgeGroup * 100}%`}}/>
            </div>
          </div>)}
        </CardContent>
      </Card>}

      {canSeeCrm && <Card id="iletisim">
        <CardHeader>
          <p className="text-xs font-bold tracking-widest text-mugla-cyan">KATILIMCI BUTCE ILETISIM</p>
          <h2 className="text-xl font-bold">Vatandas iletisim talepleri</h2>
          <p className="text-sm text-mugla-navy/55">Bu alan super admin, admin ve yetkili hesaplar icin canli calisir. Form baslangicta bostur; vatandas form doldurdukca kayitlar otomatik gorunur.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-3">
            {contactGroups.map(([label, items, note]) => <section key={label} className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-4">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-bold">{label}</h3><p className="mt-1 text-xs leading-5 text-mugla-navy/50">{note}</p></div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-mugla-cyan"><Mail size={18}/></span>
              </div>
              <p className="mt-5 text-3xl font-black">{items.length}</p>
            </section>)}
          </div>

          {scopedContactRecords.length ? <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="pb-4">Tarih</th><th>Vatandas verileri</th><th>Alan</th><th>Konu</th><th>Mesaj</th><th>KVKK</th><th className="text-right">Islem</th></tr></thead>
              <tbody>{scopedContactRecords.map(record => <tr key={record.id} className="border-t border-mugla-navy/10 align-top">
                <td className="py-4 text-mugla-navy/55">{new Date(record.createdAt).toLocaleString('tr-TR')}</td>
                <td className="py-4">
                  <b className="block">{record.name}</b>
                  <span className="mt-1 block text-xs text-mugla-navy/55">{record.phone}</span>
                  <span className="mt-1 block text-xs text-mugla-navy/55">{record.email}</span>
                </td>
                <td className="py-4"><span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-bold text-mugla-navy/65">{topicLabel(record.topic)}</span></td>
                <td className="py-4 font-semibold">{record.subject}</td>
                <td className="py-4"><p className="max-w-md whitespace-pre-wrap leading-6 text-mugla-navy/65">{record.message}</p></td>
                <td className="py-4"><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{record.kvkkAccepted ? 'Onayli' : 'Yok'}</span></td>
                <td className="py-4 text-right"><button aria-label={`${record.name} iletisim kaydini sil`} className="rounded-full p-2 text-red-600 hover:bg-red-50" onClick={() => removeContactRecord(record.id)}><Trash2 size={17}/></button></td>
              </tr>)}</tbody>
            </table>
          </div> : <div className="py-12 text-center text-mugla-navy/50"><Mail className="mx-auto mb-3"/><p className="font-semibold">Henuz iletisim talebi yok.</p><p className="mt-1 text-sm">Vatandaslar iletisim formunu doldurdugunda bu alan otomatik guncellenir.</p></div>}
        </CardContent>
      </Card>}

      {canSeeDistricts && <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-mugla-cyan">ILCE DASHBOARDLARI</p>
            <h2 className="mt-1 text-xl font-bold">13 ilcenin panel ve API bilgileri</h2>
            <p className="mt-1 text-sm text-mugla-navy/55">Bu alan yalnizca belediye panelindedir; vatandas panelinde ilce dashboard adresleri ve kodlari gosterilmez.</p>
          </div>
          <Link href="/dashboard" className="hidden text-sm font-semibold text-mugla-blue sm:inline-flex">Tam dashboard <ArrowUpRight className="ml-1" size={15}/></Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {muglaDistrictDashboards.map((item, index) => {
              const districtProjects = scopedProjects.filter(project => project.district === item.name)
              const active = districtProjects.filter(project => !['Bekliyor', 'Reddedildi'].includes(String(project.moderationStatus)) && (String(project.status) === 'Oylamada' || String(project.status).includes('Kazanan')))
              const gradient = districtGradients[index % districtGradients.length]
              return <div key={item.slug} className={`relative flex min-h-52 flex-col justify-between overflow-hidden rounded-2xl border border-mugla-navy/10 bg-gradient-to-br ${gradient} p-4 shadow-sm`}>
                <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-mugla-cyan via-mugla-green to-mugla-orange"/>
                <span className="flex items-center justify-between gap-3"><b>{item.name}</b><span className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-mugla-cyan"><LayoutDashboard size={18}/></span></span>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-mugla-navy/55">
                  <span><strong className="block text-base text-mugla-navy">{districtProjects.length}</strong>proje</span>
                  <span><strong className="block text-base text-mugla-navy">{active.length}</strong>aktif</span>
                  <span><strong className="block text-base text-mugla-navy">{districtProjects.reduce((sum, project) => sum + project.votes, 0).toLocaleString('tr-TR')}</strong>oy</span>
                </div>
                <div className="mt-4 grid gap-2">
                  <Link href={`/dashboard/giris?district=${item.slug}`} className="flex items-center justify-center gap-2 rounded-full bg-mugla-navy px-4 py-2 text-sm font-semibold text-white hover:bg-mugla-blue"><LockKeyhole size={15}/> Panel girisi</Link>
                  <Link href={item.apiPath} className="flex items-center justify-center gap-2 rounded-full border border-mugla-navy/10 bg-white/85 px-4 py-2 text-xs font-semibold text-mugla-navy/60 hover:text-mugla-blue"><Database size={14}/> {item.apiPath}</Link>
                  <div className="rounded-xl bg-white/75 px-3 py-2 text-xs text-mugla-navy/60"><b className="text-mugla-navy">Kod:</b> {item.accessCode}</div>
                </div>
              </div>
            })}
          </div>
        </CardContent>
      </Card>}

      {canSeeVoting && <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Oylama leaderboard</h2>
          <p className="text-sm text-mugla-navy/55">Onaylı projeler oy sayısına göre sıralanır. Bu tablo hangi projenin ne kadar oylandığını sayısal olarak gösterir.</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {voteLeaderboard.length ? <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-mugla-navy/45">
              <tr><th className="pb-4">Sıra</th><th>Proje</th><th>İlçe</th><th>Kategori</th><th>Durum</th><th className="text-right">Oy</th></tr>
            </thead>
            <tbody>{voteLeaderboard.map((project, index) => <tr key={project.id} onClick={() => setManagedProjectId(project.id)} className="cursor-pointer border-t border-mugla-navy/10 hover:bg-mugla-sand/45">
              <td className="py-4"><span className="inline-grid h-8 w-8 place-items-center rounded-full bg-mugla-sand text-xs font-black text-mugla-navy/65">{index + 1}</span></td>
              <td className="font-semibold">{project.title}</td>
              <td>{project.district}</td>
              <td><CategoryBadge label={projectCategoryLabel(project)} color={project.color}/></td>
              <td><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-mugla-orange">{project.status}</span></td>
              <td className="text-right text-lg font-black">{project.votes.toLocaleString('tr-TR')}</td>
            </tr>)}</tbody>
          </table> : <div className="py-12 text-center text-mugla-navy/50"><FolderKanban className="mx-auto mb-3"/><p className="font-semibold">Henüz oy verisi yok.</p><p className="mt-1 text-sm">Vatandaşlar sepetlerini onayladığında leaderboard otomatik güncellenir.</p></div>}
        </CardContent>
      </Card>}

      {canSeeProjects && <Card>
        <CardHeader><h2 className="text-xl font-bold">Onay bekleyen basvurular</h2><p className="text-sm text-mugla-navy/55">Onaylanan projeler proje listesinde oylamaya acilir.</p></CardHeader>
        <CardContent className="space-y-4">
          {pendingProjects.length > 0 && canReviewProjects && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-4">
            <label className="flex items-center gap-3 text-sm font-bold text-mugla-navy">
              <input type="checkbox" className="h-4 w-4 accent-mugla-orange" checked={allPendingSelected} onChange={toggleAllPendingSelection}/>
              Tüm onay kutularını seç
            </label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" type="button" onClick={() => setMergeSelection([])} disabled={!mergeSelection.length}>Seçimi temizle</Button>
              <Button size="sm" variant="orange" type="button" onClick={() => reviewMany(mergeSelection, 'Onaylandı')} disabled={!mergeSelection.length}><CheckCircle2 size={15}/> Seçilenleri onayla</Button>
              <Button size="sm" variant="outline" type="button" onClick={() => reviewMany(mergeSelection, 'Reddedildi')} disabled={!mergeSelection.length}><XCircle size={15}/> Seçilenleri reddet</Button>
              <Button size="sm" variant="orange" type="button" onClick={() => reviewMany(pendingProjects.map(project => project.id), 'Onaylandı')}><CheckCircle2 size={15}/> Tümünü onayla</Button>
              <Button size="sm" variant="outline" type="button" onClick={() => reviewMany(pendingProjects.map(project => project.id), 'Reddedildi')}><XCircle size={15}/> Tümünü reddet</Button>
            </div>
            {mergeSelection.length >= 2 && <p className="w-full text-xs font-semibold text-mugla-navy/55">{mergeSelection.length} başvuru seçildi. Aynı proje başvuruları için aşağıdaki birleştirme alanını kullanabilirsiniz.</p>}
          </div>}
          {selectedMergeProjects.length >= 2 && <form onSubmit={submitMergedProject} className="grid gap-4 rounded-2xl border border-mugla-cyan/30 bg-cyan-50/40 p-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-3">
              <p className="text-xs font-bold tracking-[.18em] text-mugla-cyan">BIRLESTIRILMIS PROJE</p>
              <h3 className="mt-1 text-lg font-bold">{selectedMergeProjects.length} benzer basvuru tek projeye donusturulecek.</h3>
              <p className="mt-1 text-sm text-mugla-navy/55">Kaynak basvurular pasif hale gelir; olusturulan ortak proje onayli olarak oylamaya acilir.</p>
            </div>
            <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-sm font-semibold">Birleştirilmiş proje adı</span><input className={field} name="title" required defaultValue={selectedMergeProjects[0]?.title ?? ''}/></label>
            <label><span className="mb-2 block text-sm font-semibold">Ilce</span><select className={field} name="district" required defaultValue={selectedMergeProjects[0]?.district}>{districts.map(x => <option key={x}>{x}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Kategori</span><select className={field} name="category" required defaultValue={selectedMergeProjects[0]?.category}>{categories.map(([x]) => <option key={x}>{x}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Hedef Grup</span><select className={field} name="targetGroup" required defaultValue={selectedMergeProjects[0]?.targetGroup ?? 'Herkes'}>{targetGroups.map(group => <option key={group}>{group}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Tahmini butce (TL)</span><input className={field} name="budget" type="number" min="0" step="1" required defaultValue={selectedMergeProjects.reduce((sum, project) => sum + project.budget, 0)}/></label>
            <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-sm font-semibold">Amaç</span><textarea className={`${field} min-h-24`} name="purpose" defaultValue={selectedMergeProjects.map(project => project.purpose).filter(Boolean).join('\n\n')} required/></label>
            <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-sm font-semibold">Birleştirilmiş açıklama</span><textarea className={`${field} min-h-32`} name="summary" defaultValue={selectedMergeProjects.map(project => project.summary).filter(Boolean).join('\n\n')} required/></label>
            <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-sm font-semibold">Birleştirme gerekçesi</span><textarea className={`${field} min-h-24`} name="mergeNote" placeholder="Aynı mahalle, aynı ihtiyaç veya aynı uygulama konusu nedeniyle birleştirildi." required/></label>
            <label><span className="mb-2 block text-sm font-semibold">Enlem</span><input className={field} name="lat" type="number" step="any" placeholder="37.08"/></label>
            <label><span className="mb-2 block text-sm font-semibold">Boylam</span><input className={field} name="lng" type="number" step="any" placeholder="28.45"/></label>
            <div className="flex items-end gap-2"><Button type="submit" variant="orange"><CheckCircle2 size={16}/> Birleştir ve onayla</Button><Button type="button" variant="outline" onClick={() => setMergeSelection([])}>Seçimi temizle</Button></div>
          </form>}

          {pendingProjects.length ? pendingProjects.map(project => <PendingProjectCard
            key={project.id}
            project={project}
            selected={mergeSelection.includes(project.id)}
            expanded={expandedProjectDetails === project.id}
            onToggleMerge={() => toggleMergeSelection(project.id)}
            onToggleDetails={() => setExpandedProjectDetails(value => value === project.id ? null : project.id)}
            onApprove={() => {reviewProject(project.id, 'Onaylandı'); writeAuditLog(adminUser, 'Proje onayladi', {target: project.projectCode, details: project.title}); setMergeSelection(value => value.filter(item => item !== project.id)); setExpandedProjectDetails(value => value === project.id ? null : value); setMessage('Proje onaylandi ve oylamaya acildi.')}}
            onReject={() => {reviewProject(project.id, 'Reddedildi'); writeAuditLog(adminUser, 'Proje reddetti', {target: project.projectCode, details: project.title}); setMergeSelection(value => value.filter(item => item !== project.id)); setExpandedProjectDetails(value => value === project.id ? null : value); setMessage('Proje reddedildi.')}}
            canReview={canReviewProjects}
          />) : <div className="py-12 text-center text-mugla-navy/50"><Clock3 className="mx-auto mb-3"/><p className="font-semibold">Onay bekleyen basvuru yok.</p></div>}
        </CardContent>
      </Card>}

      {canSeeProjects && <Card id="proje-havuzu">
        <CardHeader><h2 className="text-xl font-bold">Proje Havuzu</h2><p className="text-sm text-mugla-navy/55">Onaylanan, reddedilen veya süreçteki tüm proje kayıtları veri havuzu olarak burada kalır.</p></CardHeader>
        <CardContent className="overflow-x-auto">{scopedProjects.length ? <table className="w-full min-w-[1040px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="pb-4">Kod</th><th>Proje</th><th>Ilce</th><th>Hedef Grup</th><th>Butce</th><th>Durum</th><th>Onay</th><th>Gorsel</th><th className="text-right">Islem</th></tr></thead><tbody>{scopedProjects.map(project => <tr key={project.id} onClick={() => setManagedProjectId(project.id)} className="cursor-pointer border-t border-mugla-navy/10 hover:bg-mugla-sand/45"><td className="py-4"><span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-black text-mugla-navy/65">{project.projectCode}</span></td><td className="font-semibold">{project.title}</td><td>{project.district}</td><td>{project.targetGroup ?? 'Herkes'}</td><td>{formatBudget(project.budget)}</td><td><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-mugla-orange">{project.status}</span></td><td><span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-semibold text-mugla-navy/65">{project.moderationStatus}</span></td><td><span className={`rounded-full px-3 py-1 text-xs font-bold ${project.image ? 'bg-green-50 text-green-700' : 'bg-mugla-sand text-mugla-navy/45'}`}>{project.image ? 'Var' : 'Yok'}</span></td><td className="text-right">{canReviewProjects ? <button aria-label={`${project.title} projesini sil`} className="rounded-full p-2 text-red-600 hover:bg-red-50" onClick={(event) => {event.stopPropagation(); writeAuditLog(adminUser, 'Proje sildi', {target: project.projectCode, details: project.title}); removeProject(project.id)}}><Trash2 size={17}/></button> : <span className="text-xs font-bold text-mugla-navy/35">Goruntu</span>}</td></tr>)}</tbody></table> : <div className="py-14 text-center text-mugla-navy/50"><FolderKanban className="mx-auto mb-3"/><p className="font-semibold">Henüz proje havuzu kaydı yok.</p><p className="mt-1 text-sm">Vatandaş başvuruları ve manuel kayıtlar burada arşivlenir.</p></div>}</CardContent>
      </Card>}

      {managedProject && <ProjectManagementPanel
        project={managedProject}
        onClose={() => setManagedProjectId(null)}
        onImage={(file) => void uploadProjectImage(managedProject, file)}
        onRemoveImage={() => removeProjectImage(managedProject)}
      />}

    </div>
  </AppShell></AdminAuthGate>
}

