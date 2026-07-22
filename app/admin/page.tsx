'use client'

import {FormEvent, useEffect, useState} from 'react'
import Link from 'next/link'
import {AppShell} from '@/components/app-shell'
import {AdminAuthGate} from '@/components/admin-auth-gate'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Activity, AlertTriangle, ArrowUpRight, BarChart3, Bell, Building2, CheckCircle2, Clock3, Database, Eye, EyeOff, FileBarChart, FileSpreadsheet, FileText, FolderKanban, ImagePlus, KeyRound, LayoutDashboard, LockKeyhole, Mail, MapPin, MessageSquare, Pencil, Plus, Search, ShieldCheck, Trash2, Trophy, UploadCloud, UserPlus, UserRound, UsersRound, Vote, XCircle, type LucideIcon} from 'lucide-react'
import {formatBudget, isPendingReviewProject, ProjectStatus, type ProjectRecord, useProjects} from '@/lib/projects-store'
import {addAdminAccount, changeOwnAdminPassword, getCurrentAdmin, listAdminAccounts, normalizeAdminRole, removeAdminAccount, revealOwnAdminPassword, type AdminAccount, type AdminRole} from '@/lib/admin-auth'
import {muglaDistrictDashboards} from '@/lib/district-dashboards'
import {allowedCategoriesForYear, annualThemeChangeEvent, annualThemeOptions, annualThemeYears, listAnnualThemeSettings, upsertAnnualThemeSetting, type AnnualThemeId, type AnnualThemeSetting} from '@/lib/annual-themes'
import {type ContactRecord, useContactRecords} from '@/lib/contact-store'
import {projectCategories, targetGroups} from '@/lib/project-taxonomy'
import {type Channel, useCrm} from '@/lib/crm-store'
import {ageGroup, ageGroups} from '@/lib/demographics'
import {readAuditLog, writeAuditLog, type AuditRecord} from '@/lib/audit-log'

const districts = ['Bodrum', 'Dalaman', 'Datca', 'Fethiye', 'Kavaklidere', 'Koycegiz', 'Marmaris', 'Mentese', 'Milas', 'Ortaca', 'Seydikemer', 'Ula', 'Yatagan']
const categories = projectCategories
const statuses: ProjectStatus[] = ['Başvuru', 'İncelemede', 'Uygun', 'Oylamada', 'Yılın Kazanan Adayı', 'İhale Aşamasında', 'Devam Ediyor', 'Tamamlandı', 'Yapılamadı', 'Ertelendi']
const field = 'w-full rounded-xl border border-mugla-navy/15 bg-white px-4 py-3 outline-none focus:border-mugla-cyan'
const adminPanel = 'rounded-xl border border-mugla-navy/10 bg-white shadow-sm'
const tableAction = 'inline-flex h-8 items-center gap-1 rounded-lg border border-mugla-navy/10 bg-white px-2.5 text-xs font-bold text-mugla-navy/60 hover:border-mugla-cyan hover:text-mugla-navy'
const VOTINGS_KEY = 'mugla-admin-votings-v1'
type QuickTarget = {label: string; href: string; count: number; icon: LucideIcon; note: string}
type VotingRecord = {
  id: string
  name: string
  year?: string
  description: string
  startDate: string
  endDate: string
  districts: string[]
  projectIds: string[]
  votesPerPerson: 1 | 3 | 5
  rules: string[]
  status: 'Taslak' | 'Planlandı' | 'Aktif' | 'Tamamlandı' | 'Sonuçlandı' | 'Arşiv'
  createdAt: string
}

const roles: {value: AdminRole; label: string; note: string}[] = [
  {value: 'super-admin', label: 'Super admin', note: 'Platform sahibi; sistem, API, backup, audit ve lisans kontrolu'},
  {value: 'belediye-admin', label: 'Belediye admini', note: 'Proje, oylama, CRM, rapor, kategori ve belediye operasyonlari'},
  {value: 'ilce-yoneticisi', label: 'Ilce yoneticisi', note: 'Sadece kendi ilcesindeki proje, vatandas, oy ve raporlar'},
  {value: 'yetkili', label: 'Ilce personeli', note: 'Kendi ilcesi icin taslak proje olusturur ve incelemeye gonderir'},
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

function csvCell(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

const projectPoolStages = ['Tümü', 'Başvuru Alındı', 'İncelemede', 'Revizyon', 'Onaylandı', 'Oylamada', 'Kazanan', 'Uygulanıyor', 'Tamamlandı', 'Arşiv'] as const

function projectLifecycleLabel(project: ProjectRecord) {
  const workflow = String(project.workflowStatus ?? '')
  const status = String(project.status ?? '')
  const moderation = String(project.moderationStatus ?? '')
  if (workflow === 'Reddedildi' || moderation === 'Reddedildi') return 'Arşiv'
  if (workflow.includes('Revizyon') || workflow.includes('Eksik')) return 'Revizyon'
  if (workflow.includes('Kazand') || status.includes('Kazanan')) return 'Kazanan'
  if (workflow.includes('Uygulan') || status.includes('Devam')) return 'Uygulanıyor'
  if (workflow.includes('Tamam') || status.includes('Tamam')) return 'Tamamlandı'
  if (status.includes('Oylamada') || workflow.includes('Yay')) return 'Oylamada'
  if (moderation.includes('Onay')) return 'Onaylandı'
  if (status.includes('İnceleme') || workflow.includes('İnceleme')) return 'İncelemede'
  return 'Başvuru Alındı'
}

function projectHistory(project: ProjectRecord) {
  const base = project.processHistory?.length ? project.processHistory : [{
    id: `${project.id}-created`,
    date: project.createdAt,
    actor: project.ownerName || project.createdByAdminName || 'Sistem',
    action: 'Başvuru oluşturuldu.',
    note: project.source === 'citizen' ? 'Vatandaş başvurusu proje havuzuna eklendi.' : 'Belediye proje kaydı oluşturdu.',
  }]
  return [...base].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

function ProjectDetailBlock({project}: {project: ProjectRecord}) {
  const details = [
    ['Proje kodu', project.projectCode],
    ['Proje durumu', project.workflowStatus],
    ['Kısa açıklama', project.shortDescription],
    ['Başvuru sahibi', project.ownerName || project.ownerEmail || 'Belirtilmedi'],
    ['Oluşturan yetkili', project.createdByAdminName],
    ['Başvuru türü', project.applicantType ?? 'Bireysel'],
    ['Başvuru konumu', `${project.country ?? 'Türkiye'} / ${project.province ?? 'Muğla'} / ${project.applicantDistrict ?? project.district} / ${project.neighborhood ?? 'Mahalle belirtilmedi'}`],
    ['Harita notu', project.locationNote],
    ['Projenin uygulanacağı ilçe', project.district],
    ['Kategori', project.category],
    ['Proje teması', project.customTheme],
    ['Hedef Grup', project.targetGroup ?? 'Herkes'],
    ['Tahmini bütçe', formatBudget(project.budget)],
    ['Finans kaynağı', project.financingSource],
    ['Süre', project.duration],
    ['Öncelik', project.priority],
    ['Amaç', project.purpose],
    ['Özet', project.summary],
    ['Faaliyetler', project.activities],
    ['Beklenen sonuçlar', project.expectedResults],
    ['Video', project.videoUrl],
    ['Etki analizi', `Sosyal ${project.socialImpact ?? 0}/100 · Çevresel ${project.environmentalImpact ?? 0}/100 · Ekonomik ${project.economicImpact ?? 0}/100 · Erişim ${project.accessibilityImpact ?? 0}/100 · Sürdürülebilirlik ${project.sustainabilityImpact ?? 0}/100`],
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
  onRevision,
  onMissingDocument,
  canReview,
}: {
  project: ProjectRecord
  selected: boolean
  expanded: boolean
  onToggleMerge: () => void
  onToggleDetails: () => void
  onApprove: () => void
  onReject: () => void
  onRevision: () => void
  onMissingDocument: () => void
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
      {canReview ? <div className="flex shrink-0 flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onMissingDocument}><FileText size={15}/>Eksik belge</Button>
        <Button size="sm" variant="outline" onClick={onRevision}><ArrowUpRight size={15}/>Revizyon</Button>
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
  onSave,
  onApprove,
  onRevision,
  onReject,
  canEdit,
  canReview,
}: {
  project: ProjectRecord
  onClose: () => void
  onImage: (file: File) => void
  onRemoveImage: () => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onApprove: () => void
  onRevision: () => void
  onReject: () => void
  canEdit: boolean
  canReview: boolean
}) {
  const aiItems = [
    ['Tahmini Maliyet', formatBudget(project.budget)],
    ['Etki Puanı', `${Math.round(((project.socialImpact ?? 0) + (project.environmentalImpact ?? 0) + (project.economicImpact ?? 0) + (project.accessibilityImpact ?? 0) + (project.sustainabilityImpact ?? 0)) / 5)}/100`],
    ['Karbon', `${project.environmentalImpact ?? 0}/100 çevresel etki`],
    ['Uygulanabilirlik', project.priority === 'Yüksek' ? 'Yüksek öncelik' : project.workflowStatus ?? project.status],
  ]

  return <Card className="rounded-xl shadow-sm">
    <CardHeader className="flex-row items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold tracking-widest text-mugla-cyan">PROJE DETAYI</p>
        <h2 className="mt-1 text-xl font-bold">{project.title}</h2>
        <p className="mt-1 text-sm text-mugla-navy/55">{project.projectCode} · {project.district} · {project.moderationStatus}</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-lg bg-mugla-sand px-4 py-2 text-xs font-bold text-mugla-navy/60">Kapat</button>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <section className={adminPanel}>
        <div className="border-b border-mugla-navy/10 p-4">
          <h3 className="font-black">Proje Bilgileri</h3>
        </div>
        <div className="space-y-4 p-4">
        <div className="overflow-hidden rounded-xl border border-mugla-navy/10 bg-white">
          {project.image?.dataUrl ? <img src={project.image.dataUrl} alt={`${project.title} proje görseli`} className="h-56 w-full object-cover"/> : <div className="grid h-56 place-items-center text-center text-mugla-navy/45"><div><ImagePlus className="mx-auto mb-2"/><p className="text-sm font-semibold">Proje görseli yok</p></div></div>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Başlık', project.title],
            ['Kategori', projectCategoryLabel(project)],
            ['İlçe', project.district],
            ['Ek Dosya', project.attachments?.length ? `${project.attachments.length} dosya` : 'Yok'],
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-mugla-sand/45 p-3"><p className="text-xs font-black text-mugla-navy/45">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>)}
        </div>
        <div className="rounded-xl bg-mugla-sand/45 p-3">
          <p className="text-xs font-black text-mugla-navy/45">Açıklama</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-mugla-navy/70">{project.summary || project.shortDescription || 'Belirtilmedi'}</p>
        </div>
        {project.image && <p className="truncate text-xs font-semibold text-mugla-navy/55">{project.image.name} - {(project.image.size / 1024 / 1024).toFixed(1)} MB</p>}
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-mugla-cyan px-4 py-3 text-sm font-bold text-white">
          <UploadCloud size={17}/>
          Görsel yükle / güncelle
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => {const file = event.target.files?.[0]; if (file) onImage(file); event.currentTarget.value = ''}}/>
        </label>
        {project.image && <button type="button" onClick={onRemoveImage} className="w-full rounded-lg border border-mugla-navy/10 bg-white px-4 py-3 text-sm font-bold text-mugla-navy/60 hover:text-red-600"><Trash2 className="mr-2 inline" size={16}/> Görseli kaldır</button>}
        </div>
      </section>
      <section className={adminPanel}>
        <div className="border-b border-mugla-navy/10 p-4">
          <h3 className="font-black">AI Analizi</h3>
        </div>
        <div className="grid gap-3 p-4">
          {aiItems.map(([label, value]) => <div key={label} className="rounded-xl bg-mugla-sand/45 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-mugla-cyan">{label}</p>
            <p className="mt-1 text-lg font-black">{value || 'Belirtilmedi'}</p>
          </div>)}
          <div className="rounded-xl bg-mugla-sand/45 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-mugla-cyan">Notlar</p>
            <p className="mt-1 text-sm leading-6 text-mugla-navy/65">{project.purpose || project.expectedResults || 'AI değerlendirme notu yok.'}</p>
          </div>
        </div>
      </section>
      </div>
      {canEdit && <form onSubmit={onSave} className="grid gap-4 rounded-2xl border border-mugla-navy/10 bg-white p-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-xs font-black uppercase tracking-wider text-mugla-cyan">Hızlı düzenle</p>
          <h3 className="mt-1 font-black">Proje bilgilerini sade formdan güncelle</h3>
        </div>
        <label className="md:col-span-2"><span className="mb-2 block text-sm font-semibold">Proje adı</span><input className={field} name="title" defaultValue={project.title} required/></label>
        <label><span className="mb-2 block text-sm font-semibold">İlçe</span><select className={field} name="district" defaultValue={project.district} required>{districts.map(item => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-2 block text-sm font-semibold">Kategori</span><select className={field} name="category" defaultValue={project.category} required>{categories.map(([item]) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-2 block text-sm font-semibold">Hedef grup</span><select className={field} name="targetGroup" defaultValue={project.targetGroup ?? 'Herkes'} required>{targetGroups.map(item => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-2 block text-sm font-semibold">Bütçe</span><input className={field} name="budget" type="number" min="0" step="1" defaultValue={project.budget}/></label>
        <label><span className="mb-2 block text-sm font-semibold">Durum</span><select className={field} name="status" defaultValue={project.status} required>{statuses.map(item => <option key={item}>{item}</option>)}</select></label>
        <label className="md:col-span-2"><span className="mb-2 block text-sm font-semibold">Özet</span><textarea className={`${field} min-h-28`} name="summary" defaultValue={project.summary ?? project.shortDescription ?? ''}/></label>
        <div className="md:col-span-2"><Button type="submit" variant="orange"><Pencil size={17}/> Kaydet</Button></div>
      </form>}
      {canReview && <div className="flex flex-wrap gap-2 border-t border-mugla-navy/10 pt-5">
        <Button variant="orange" onClick={onApprove}><CheckCircle2 size={17}/> Onayla</Button>
        <Button variant="outline" onClick={onRevision}><ArrowUpRight size={17}/> Revizyon İste</Button>
        <Button variant="outline" onClick={onReject} className="border-red-100 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"><XCircle size={17}/> Reddet</Button>
      </div>}
    </CardContent>
  </Card>
}

export default function Admin() {
  const {projects, addProject, mergeProjects, removeProject, reviewProject, updateProject} = useProjects()
  const {records: contactRecords, removeContactRecord} = useContactRecords()
  const {citizens, campaigns, addCampaign} = useCrm()
  const [open, setOpen] = useState(false)
  const [peopleOpen, setPeopleOpen] = useState(true)
  const [message, setMessage] = useState('')
  const [adminUser, setAdminUser] = useState<AdminAccount | null>(null)
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [mergeSelection, setMergeSelection] = useState<string[]>([])
  const [mergeFormOpen, setMergeFormOpen] = useState(false)
  const [expandedProjectDetails, setExpandedProjectDetails] = useState<string | null>(null)
  const [managedProjectId, setManagedProjectId] = useState<string | null>(null)
  const [ownPassword, setOwnPassword] = useState<string | null>(null)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [themeSettings, setThemeSettings] = useState<AnnualThemeSetting[]>([])
  const [themeYear, setThemeYear] = useState<string>(annualThemeYears[0])
  const [themeDraft, setThemeDraft] = useState<AnnualThemeId[]>(['all'])
  const [votingYear, setVotingYear] = useState<string>(String(new Date().getFullYear()))
  const [manualProjectCategory, setManualProjectCategory] = useState<string>(categories[0]?.[0] ?? '')
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([])
  const [districtSearch, setDistrictSearch] = useState('')
  const [voteDistrictFilter, setVoteDistrictFilter] = useState('')
  const [voteCategoryFilter, setVoteCategoryFilter] = useState('')
  const [voteNeighborhoodFilter, setVoteNeighborhoodFilter] = useState('')
  const [votePeriodFilter, setVotePeriodFilter] = useState('2027')
  const [poolStatusFilter, setPoolStatusFilter] = useState('Tümü')
  const [poolDistrictFilter, setPoolDistrictFilter] = useState('')
  const [poolNeighborhoodFilter, setPoolNeighborhoodFilter] = useState('')
  const [poolCategoryFilter, setPoolCategoryFilter] = useState('')
  const [poolKeyword, setPoolKeyword] = useState('')
  const [projectCenterTab, setProjectCenterTab] = useState('Tümü')
  const [notificationTab, setNotificationTab] = useState('Yeni Bildirim')
  const [votingWizardOpen, setVotingWizardOpen] = useState(false)
  const [votingWizardStep, setVotingWizardStep] = useState(1)
  const [selectedVotingProjects, setSelectedVotingProjects] = useState<string[]>([])
  const [votingRecords, setVotingRecords] = useState<VotingRecord[]>([])
  const activeRole = normalizeAdminRole(adminUser?.role)
  const isSuperAdmin = activeRole === 'super-admin'
  const isMunicipalityAdmin = activeRole === 'belediye-admin'
  const isDistrictManager = activeRole === 'ilce-yoneticisi'
  const isDistrictStaff = activeRole === 'yetkili'
  const isEvaluator = activeRole === 'degerlendirici'
  const isCrmRole = activeRole === 'crm'
  const canManagePeople = isSuperAdmin
  const canSeeSystem = isSuperAdmin
  const canSeeProjects = !isCrmRole
  const canReviewProjects = isSuperAdmin || isMunicipalityAdmin || isDistrictManager
  const canPublishProjects = isSuperAdmin || isMunicipalityAdmin
  const canEditProjects = isSuperAdmin || isMunicipalityAdmin || isDistrictManager || isEvaluator
  const canArchiveProjects = isSuperAdmin || isMunicipalityAdmin
  const canRestoreProjects = isSuperAdmin || isMunicipalityAdmin
  const canPermanentDeleteProjects = isSuperAdmin
  const canSendProjectsToVote = isSuperAdmin || isMunicipalityAdmin
  const canCreateMunicipalProject = isSuperAdmin || isMunicipalityAdmin || isDistrictManager || isDistrictStaff
  const canSeeCrm = isSuperAdmin || isMunicipalityAdmin || isCrmRole
  const canSeeLiveCitizenData = isSuperAdmin || Boolean(adminUser?.permissions?.liveCitizenData)
  const canExportLiveCitizenData = isSuperAdmin || Boolean(adminUser?.permissions?.citizenDataExport)
  const canSeeDistricts = isSuperAdmin || isMunicipalityAdmin || isDistrictManager || isDistrictStaff
  const canSeeVoting = isSuperAdmin || isMunicipalityAdmin || isDistrictManager
  const canManageVoting = isSuperAdmin || isMunicipalityAdmin
  const canSeeVoteDetails = isSuperAdmin || isMunicipalityAdmin || isDistrictManager
  const canSeeCategories = isSuperAdmin || isMunicipalityAdmin || isDistrictManager
  const canManageAnnualThemes = isSuperAdmin || isMunicipalityAdmin
  const canSeeReports = isSuperAdmin || isMunicipalityAdmin || isDistrictManager || isEvaluator
  const canSeeNotifications = isSuperAdmin || isMunicipalityAdmin || isDistrictManager || isCrmRole
  const canSendNotification = isSuperAdmin || isMunicipalityAdmin || isDistrictManager || isCrmRole
  const canSendBulkNotification = isSuperAdmin || isMunicipalityAdmin || isDistrictManager
  const canScheduleNotification = isSuperAdmin || isMunicipalityAdmin
  const canDeleteNotification = isSuperAdmin
  const scopedProjects = isCrmRole ? [] : isDistrictStaff ? projects.filter(project => project.createdByAdminId === adminUser?.id || project.district === adminUser?.district) : isDistrictManager && adminUser?.district ? projects.filter(project => project.district === adminUser.district) : isEvaluator && adminUser?.assignedProjectIds?.length ? projects.filter(project => adminUser.assignedProjectIds?.includes(project.id) || adminUser.assignedProjectIds?.includes(project.projectCode)) : projects
  const scopedCitizens = isDistrictManager && adminUser?.district ? citizens.filter(citizen => citizen.district === adminUser.district) : citizens
  const scopedContactRecords = isDistrictManager && adminUser?.district ? contactRecords.filter(record => record.message.includes(adminUser.district ?? '') || record.subject.includes(adminUser.district ?? '')) : contactRecords
  const pendingProjects = scopedProjects.filter(isPendingReviewProject)
  const selectedMergeProjects = pendingProjects.filter(project => mergeSelection.includes(project.id))
  const managedProject = projects.find(project => project.id === managedProjectId) ?? null
  const allPendingSelected = pendingProjects.length > 0 && pendingProjects.every(project => mergeSelection.includes(project.id))
  const voteBaseProjects = isDistrictManager && adminUser?.district ? projects.filter(project => project.district === adminUser.district) : projects
  const voteDistrictOptions = isDistrictManager && adminUser?.district ? [adminUser.district] : districts
  const effectiveVoteDistrict = isDistrictManager ? adminUser?.district ?? '' : voteDistrictFilter
  const voteFilteredProjects = voteBaseProjects.filter(project => {
    const projectYear = new Date(project.createdAt).getFullYear().toString()
    return (!effectiveVoteDistrict || project.district === effectiveVoteDistrict)
      && (!voteCategoryFilter || project.category === voteCategoryFilter)
      && (!voteNeighborhoodFilter || (project.neighborhood || project.applicantDistrict || project.district) === voteNeighborhoodFilter)
      && (!votePeriodFilter || projectYear === votePeriodFilter || votePeriodFilter === '2027')
  })
  const voteLeaderboard = voteFilteredProjects
    .filter(project => project.moderationStatus === 'Onaylandı' && ['Oylamada', 'Yılın Kazanan Adayı', 'Devam Ediyor', 'Tamamlandı'].includes(String(project.status)))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, isMunicipalityAdmin ? 100 : 50)
  const voteTotal = voteLeaderboard.reduce((sum, project) => sum + project.votes, 0)
  const activeVoterEstimate = Math.max(0, Math.round(voteTotal * 2.07))
  const participationRate = Math.min(100, Math.round(voteTotal / Math.max(1, activeVoterEstimate) * 100))
  const voteNeighborhoodOptions = Array.from(new Set(voteBaseProjects.map(project => project.neighborhood || project.applicantDistrict || project.district).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr'))
  const votingAllowedCategories = allowedCategoriesForYear(votingYear)
  const votingAllowedCategoryNames = new Set(votingAllowedCategories.map(item => item[0]))
  const approvedVotingCandidates = scopedProjects.filter(project => project.moderationStatus === 'Onaylandı' && votingAllowedCategoryNames.has(projectCategoryLabel(project)))
  const activeVotingRecords = votingRecords.filter(record => record.status === 'Aktif')
  const votingProjectCount = votingRecords.reduce((sum, record) => sum + record.projectIds.length, 0)
  const votingRecordsVoteTotal = votingRecords.reduce((sum, record) => sum + record.projectIds.reduce((projectSum, id) => projectSum + (projects.find(project => project.id === id)?.votes ?? 0), 0), 0)
  const districtScope = isDistrictManager || isDistrictStaff ? muglaDistrictDashboards.filter(district => district.name === adminUser?.district) : muglaDistrictDashboards
  const visibleDistrictDashboards = districtScope.filter(district => district.name.toLocaleLowerCase('tr').includes(districtSearch.trim().toLocaleLowerCase('tr')))
  const districtScopeProjects = projects.filter(project => districtScope.some(district => district.name === project.district))
  const districtScopeVotes = districtScopeProjects.reduce((sum, project) => sum + project.votes, 0)
  const districtScopeActiveVotes = districtScopeProjects.filter(project => project.status === 'Oylamada').length
  const districtScopeParticipation = Math.min(100, Math.round(districtScopeVotes / Math.max(1, districtScopeProjects.length * 120) * 100))

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

  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(VOTINGS_KEY) ?? '[]')
      setVotingRecords(Array.isArray(value) ? value : [])
    } catch {
      setVotingRecords([])
    }
  }, [])

  function saveVotingRecords(next: VotingRecord[]) {
    setVotingRecords(next)
    localStorage.setItem(VOTINGS_KEY, JSON.stringify(next))
  }

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const category = String(form.get('category'))
    addProject({
      title: String(form.get('title')).trim(),
      shortDescription: String(form.get('shortDescription')).trim(),
      district: String(form.get('district')),
      neighborhood: String(form.get('neighborhood')).trim(),
      locationNote: String(form.get('locationNote')).trim(),
      category,
      subcategory: String(form.get('subcategory')).trim(),
      customTheme: category === 'Diğer' ? String(form.get('customTheme')).trim() : undefined,
      targetGroup: String(form.get('targetGroup')),
      budget: Number(form.get('budget')),
      financingSource: String(form.get('financingSource')).trim(),
      duration: String(form.get('duration')).trim(),
      priority: String(form.get('priority')).trim(),
      status: String(form.get('status')) as ProjectStatus,
      lat: Number(form.get('lat')) || 37.08,
      lng: Number(form.get('lng')) || 28.45,
      color: categories.find(item => item[0] === category)?.[1] ?? '#64748b',
      moderationStatus: isSuperAdmin ? 'Onaylandı' : 'Bekliyor',
      workflowStatus: isSuperAdmin ? 'Yayında' : 'İlçe Admin İncelemesinde',
      source: 'municipality',
      createdByAdminId: adminUser?.id,
      createdByAdminName: adminUser?.name,
      purpose: String(form.get('purpose')).trim(),
      summary: String(form.get('summary')).trim(),
      activities: String(form.get('activities')).trim(),
      expectedResults: String(form.get('expectedResults')).trim(),
      videoUrl: String(form.get('videoUrl')).trim(),
      socialImpact: Number(form.get('socialImpact')) || 0,
      environmentalImpact: Number(form.get('environmentalImpact')) || 0,
      economicImpact: Number(form.get('economicImpact')) || 0,
      accessibilityImpact: Number(form.get('accessibilityImpact')) || 0,
      sustainabilityImpact: Number(form.get('sustainabilityImpact')) || 0,
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
    if (allPendingSelected) setMergeFormOpen(false)
  }

  function reviewMany(ids: string[], moderationStatus: 'Onaylandı' | 'Reddedildi') {
    ids.forEach(id => reviewProject(id, moderationStatus))
    writeAuditLog(adminUser, `Toplu proje ${moderationStatus}`, {target: ids.join(','), details: `${ids.length} proje`})
    setMergeSelection(value => value.filter(id => !ids.includes(id)))
    setMergeFormOpen(false)
    setExpandedProjectDetails(value => value && ids.includes(value) ? null : value)
    setProjectCenterTab(moderationStatus === 'Onaylandı' ? 'Onaylanan' : 'Reddedilenler')
    setMessage(`${ids.length} proje ${moderationStatus === 'Onaylandı' ? 'onaylandi ve oylamaya acildi' : 'reddedildi'}.`)
  }

  function approvePendingProject(project: ProjectRecord) {
    if (isDistrictManager && !canPublishProjects) {
      updateProjectWithHistory(project, {workflowStatus: 'Muğla BB İncelemesinde', moderationStatus: 'Bekliyor', status: 'İncelemede'}, 'İlçe yöneticisi inceledi', project.title)
      setMessage('Proje Muğla Büyükşehir incelemesine gönderildi.')
      return
    }
    reviewProject(project.id, 'Onaylandı')
    updateProjectWithHistory(project, {workflowStatus: 'Yayında'}, 'Proje onaylandı', project.title)
    setProjectCenterTab('Onaylanan')
    setMessage('Proje oylamaya açıldı ve yayınlandı.')
  }

  function saveManagedProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!managedProject) return
    const form = new FormData(event.currentTarget)
    const category = String(form.get('category'))
    updateProject(managedProject.id, {
      title: String(form.get('title')).trim(),
      district: String(form.get('district')),
      category,
      color: categories.find(item => item[0] === category)?.[1] ?? managedProject.color,
      targetGroup: String(form.get('targetGroup')),
      budget: Number(form.get('budget')) || 0,
      status: String(form.get('status')) as ProjectStatus,
      summary: String(form.get('summary')).trim(),
    })
    writeAuditLog(adminUser, 'Proje duzenledi', {target: managedProject.projectCode, details: managedProject.title})
    setMessage('Proje bilgileri güncellendi.')
  }

  function updateProjectWithHistory(project: ProjectRecord, patch: Partial<ProjectRecord>, action: string, note?: string) {
    updateProject(project.id, {
      ...patch,
      processHistory: [...projectHistory(project), {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        actor: adminUser?.name ?? 'Sistem',
        action,
        note,
      }],
    })
    writeAuditLog(adminUser, action, {target: project.projectCode, details: note ?? project.title})
  }

  function archiveProject(project: ProjectRecord) {
    if (!canArchiveProjects) return
    updateProjectWithHistory(project, {workflowStatus: 'Reddedildi', moderationStatus: 'Reddedildi', status: 'Ertelendi'}, 'Proje arşive taşındı', project.title)
    setMessage('Proje arşive taşındı. Kayıt havuzda korunuyor.')
  }

  function restoreProject(project: ProjectRecord) {
    if (!canRestoreProjects) return
    updateProjectWithHistory(project, {workflowStatus: 'Muğla BB İncelemesinde', moderationStatus: 'Bekliyor', status: 'İncelemede'}, 'Proje geri yüklendi', project.title)
    setMessage('Proje arşivden geri yüklendi.')
  }

  function deleteManagedProject(project: ProjectRecord) {
    if (!canPermanentDeleteProjects) return
    if (!confirm(`${project.title} projesini kalıcı silmek için ilk onayı veriyor musunuz? Bu işlem geri alınamaz.`)) return
    if (!confirm(`İkinci doğrulama: ${project.projectCode} kalıcı olarak silinsin mi?`)) return
    writeAuditLog(adminUser, 'Proje kalici sildi', {target: project.projectCode, details: project.title})
    removeProject(project.id)
    setManagedProjectId(null)
    setMessage('Proje kalıcı olarak silindi.')
  }

  function rejectPendingProject(project: ProjectRecord) {
    updateProjectWithHistory(project, {workflowStatus: 'Reddedildi', moderationStatus: 'Reddedildi'}, 'Proje reddedildi', project.title)
    setProjectCenterTab('Reddedilenler')
    setMessage('Proje reddedildi.')
  }

  function requestProjectRevision(project: ProjectRecord, workflowStatus: 'Revizyon İstendi' | 'Eksik Belge') {
    updateProjectWithHistory(project, {workflowStatus, moderationStatus: 'Bekliyor', status: 'İncelemede'}, workflowStatus, project.title)
    setMessage(workflowStatus === 'Eksik Belge' ? 'Eksik belge isteği oluşturuldu.' : 'Revizyon isteği oluşturuldu.')
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
      setMergeFormOpen(false)
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
      const assignedProjectIds = String(form.get('assignedProjectIds') ?? '').split(',').map(value => value.trim()).filter(Boolean)
      await addAdminAccount({
        name: String(form.get('name')).trim(),
        email: String(form.get('email')).trim(),
        role: String(form.get('role')) as AdminRole,
        password: String(form.get('password')),
        district: String(form.get('district') ?? '').trim() || undefined,
        department: String(form.get('department') ?? '').trim() || undefined,
        assignedProjectIds,
        permissions: {
          liveCitizenData: form.get('liveCitizenData') === 'on',
          citizenDataExport: form.get('citizenDataExport') === 'on',
        },
        actor: adminUser,
      })
      formElement.reset()
      writeAuditLog(adminUser, 'Admin hesabi tanimladi', {target: String(form.get('email')).trim(), details: `${String(form.get('role'))} · ${String(form.get('district') ?? '')}`})
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
    if (!canManageAnnualThemes) {
      setMessage('Yillik tema ayarlarini sadece Super Admin ve Buyuksehir Admini guncelleyebilir.')
      return
    }
    const updated = upsertAnnualThemeSetting(themeYear, themeDraft)
    setThemeSettings(listAnnualThemeSettings())
    setThemeDraft(updated.themes)
    writeAuditLog(adminUser, 'Yillik tema kuralini guncelledi', {target: updated.year, details: updated.themes.join(',')})
    setMessage(`${updated.year} yili icin tema kuralı guncellendi.`)
  }

  function exportCitizenDataExcel() {
    const rows = scopedCitizens.map(citizen => ({
      ad_soyad: citizen.name,
      e_posta: citizen.email,
      telefon: citizen.phone,
      uyruk: citizen.nationality === 'foreign' ? 'Yabancı' : 'T.C.',
      ulke: citizen.country ?? 'Türkiye',
      il: citizen.province,
      ilce: citizen.district,
      yas: citizen.age,
      dogum_tarihi: citizen.birthDate ?? '',
      dogrulama: citizen.badges.join(', '),
      oy_sayisi: citizen.voteCount,
      proje_sayisi: citizen.proposalCount,
      kayit_tarihi: citizen.createdAt,
      son_giris: citizen.lastLogin,
    }))
    const headers = Object.keys(rows[0] ?? {
      ad_soyad: '',
      e_posta: '',
      telefon: '',
      uyruk: '',
      ulke: '',
      il: '',
      ilce: '',
      yas: '',
      dogum_tarihi: '',
      dogrulama: '',
      oy_sayisi: '',
      proje_sayisi: '',
      kayit_tarihi: '',
      son_giris: '',
    })
    const csv = [headers.map(csvCell).join(','), ...rows.map(row => headers.map(header => csvCell(row[header as keyof typeof row])).join(','))].join('\n')
    const blob = new Blob([`\uFEFF${csv}`], {type: 'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `canli-vatandas-veri-listesi-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    writeAuditLog(adminUser, 'Canli vatandas verisini Excel olarak disari aktardi', {details: `${scopedCitizens.length} kayit`})
  }

  function exportCitizenDataPdf() {
    const rows = scopedCitizens.map(citizen => `<tr><td>${citizen.name}</td><td>${citizen.email}</td><td>${citizen.phone}</td><td>${citizen.province} / ${citizen.district}</td><td>${citizen.voteCount}</td><td>${citizen.proposalCount}</td><td>${new Date(citizen.createdAt).toLocaleString('tr-TR')}</td></tr>`).join('')
    const popup = window.open('', '_blank')
    if (!popup) {
      setMessage('PDF çıktısı için açılır pencereye izin verin.')
      return
    }
    popup.document.write(`<!doctype html><html><head><title>Canlı Vatandaş Veri Listesi</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#0e3a66}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}th,td{border:1px solid #d7dee8;padding:8px;text-align:left}th{background:#eef3f8}</style></head><body><h1>Canlı Vatandaş Veri Listesi</h1><p>Toplam kayıt: ${scopedCitizens.length} · Oluşturma: ${new Date().toLocaleString('tr-TR')}</p><table><thead><tr><th>Ad Soyad</th><th>E-posta</th><th>Telefon</th><th>Konum</th><th>Oy</th><th>Proje</th><th>Kayıt</th></tr></thead><tbody>${rows || '<tr><td colspan="7">Kayıt yok</td></tr>'}</tbody></table><script>window.print()</script></body></html>`)
    popup.document.close()
    writeAuditLog(adminUser, 'Canli vatandas verisini PDF olarak disari aktardi', {details: `${scopedCitizens.length} kayit`})
  }

  function saveNotificationFromForm(form: HTMLFormElement, status: 'Taslak' | 'Planlandı' | 'Gönderildi') {
    if (!canSendNotification) return
    const data = new FormData(form)
    const title = String(data.get('title') ?? '').trim()
    const body = String(data.get('body') ?? '').trim()
    const recipient = String(data.get('recipient') ?? 'Vatandaş')
    const district = isDistrictManager ? adminUser?.district ?? '' : String(data.get('district') ?? '')
    const channels = ['Push', 'E-posta', 'SMS', 'WhatsApp'].filter(channel => data.get(channel)) as Channel[]
    if (!title || !body) {
      setMessage('Bildirim başlığı ve mesajı zorunludur.')
      return
    }
    addCampaign({
      title,
      segment: `${recipient}${district ? ` · ${district}` : ''} · ${body.slice(0, 80)}`,
      channels: channels.length ? channels : ['Push'],
      status,
    })
    writeAuditLog(adminUser, `Bildirim ${status}`, {target: title, details: `${recipient} ${district}`.trim()})
    setMessage(status === 'Gönderildi' ? 'Bildirim gönderildi.' : status === 'Planlandı' ? 'Bildirim planlandı.' : 'Bildirim taslak olarak kaydedildi.')
    form.reset()
  }

  function submitNotification(event: FormEvent<HTMLFormElement>, status: 'Taslak' | 'Planlandı' | 'Gönderildi') {
    event.preventDefault()
    saveNotificationFromForm(event.currentTarget, status)
  }

  function toggleVotingProject(id: string) {
    setSelectedVotingProjects(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  }

  function submitVotingWizard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canManageVoting) return
    const form = new FormData(event.currentTarget)
    const districtsValue = form.getAll('districts').map(String)
    const rules = ['e-Devlet doğrulaması', 'Tek cihaz', 'Tek IP kontrolü', 'CAPTCHA', 'AI dolandırıcılık kontrolü'].filter(rule => form.get(rule))
    const eligibleSelectedProjectIds = selectedVotingProjects.filter(id => approvedVotingCandidates.some(project => project.id === id))
    if (!eligibleSelectedProjectIds.length) {
      setMessage(`${votingYear} yilinin acik temalarina uygun en az 1 onayli proje secmelisiniz.`)
      return
    }
    const record: VotingRecord = {
      id: crypto.randomUUID(),
      name: String(form.get('name') || '2027 Katılımcı Bütçe Oylaması'),
      year: String(form.get('votingYear') || votingYear),
      description: String(form.get('description') || ''),
      startDate: String(form.get('startDate') || ''),
      endDate: String(form.get('endDate') || ''),
      districts: districtsValue.length ? districtsValue : districts,
      projectIds: eligibleSelectedProjectIds,
      votesPerPerson: Number(form.get('votesPerPerson') || 5) as 1 | 3 | 5,
      rules,
      status: 'Taslak',
      createdAt: new Date().toISOString(),
    }
    saveVotingRecords([record, ...votingRecords])
    setVotingWizardOpen(false)
    setSelectedVotingProjects([])
    setVotingWizardStep(1)
    setMessage('Oylama taslak olarak oluşturuldu. Vatandaşlar henüz göremez.')
  }

  function updateVotingStatus(id: string, status: VotingRecord['status']) {
    saveVotingRecords(votingRecords.map(record => record.id === id ? {...record, status} : record))
    setMessage(status === 'Aktif' ? 'Oylama yayınlandı; vatandaş panelinde oylama süreci açılır ve bildirim gönderilir.' : `Oylama ${status} durumuna alındı.`)
  }

  const activeVotingProjects = scopedProjects.filter(project => !['Bekliyor', 'Reddedildi'].includes(String(project.moderationStatus)) && ['Oylamada', 'Yılın Kazanan Adayı'].includes(String(project.status)))
  const approvedProjects = scopedProjects.filter(project => project.moderationStatus === 'Onaylandı')
  const winningProjects = scopedProjects.filter(project => String(project.workflowStatus) === 'Kazandı' || String(project.status).includes('Kazanan'))
  const archivedProjects = scopedProjects.filter(project => String(project.workflowStatus) === 'Reddedildi' || project.moderationStatus === 'Reddedildi')
  const projectCenterProjects = scopedProjects.filter(project => {
    if (projectCenterTab === 'Onay Bekleyen') return isPendingReviewProject(project)
    if (projectCenterTab === 'Onaylanan') return project.moderationStatus === 'Onaylandı'
    if (projectCenterTab === 'Yayında') return activeVotingProjects.some(item => item.id === project.id)
    if (projectCenterTab === 'Reddedilenler') return project.moderationStatus === 'Reddedildi' || String(project.workflowStatus) === 'Reddedildi'
    if (projectCenterTab === 'Arşiv') return projectLifecycleLabel(project) === 'Arşiv'
    return true
  })
  const poolDistrictOptions = isDistrictManager && adminUser?.district ? [adminUser.district] : districts
  const poolNeighborhoodOptions = Array.from(new Set(scopedProjects.map(project => project.neighborhood || project.applicantDistrict || project.district).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr'))
  const filteredPoolProjects = scopedProjects.filter(project => {
    const lifecycle = projectLifecycleLabel(project)
    const keyword = poolKeyword.trim().toLocaleLowerCase('tr')
    return (poolStatusFilter === 'Tümü' || lifecycle === poolStatusFilter)
      && (!poolDistrictFilter || project.district === poolDistrictFilter)
      && (!poolNeighborhoodFilter || (project.neighborhood || project.applicantDistrict || project.district) === poolNeighborhoodFilter)
      && (!poolCategoryFilter || project.category === poolCategoryFilter)
      && (!keyword || `${project.title} ${project.projectCode} ${project.summary ?? ''} ${project.shortDescription ?? ''}`.toLocaleLowerCase('tr').includes(keyword))
  })
  const notificationScope = isDistrictManager && adminUser?.district ? campaigns.filter(item => item.segment.includes(adminUser.district ?? '')) : isCrmRole ? campaigns.filter(item => item.segment.includes('Vatandaş')) : campaigns
  const notificationRead = Math.round(notificationScope.filter(item => item.status === 'Gönderildi').length * 0.81)
  const notificationPending = notificationScope.filter(item => item.status !== 'Gönderildi').length
  const notificationOpenRate = notificationScope.length ? Math.round(notificationRead / Math.max(1, notificationScope.length) * 100) : 0
  const dashboardMetrics = [
    ['Toplam Proje', scopedProjects.length, FolderKanban, 'bg-mugla-navy text-white'],
    ['Onay Bekleyen', pendingProjects.length, Clock3, 'bg-orange-50 text-mugla-orange'],
    ['Aktif Oylama', activeVotingRecords.length, Vote, 'bg-cyan-50 text-mugla-cyan'],
    ['Toplam Oy', votingRecordsVoteTotal, BarChart3, 'bg-green-50 text-green-700'],
    ['Vatandaş Sayısı', scopedCitizens.length, UsersRound, 'bg-white text-mugla-navy'],
    ['13 İlçe', 13, Building2, 'bg-white text-mugla-navy'],
  ] as const
  const recentProjects = [...scopedProjects].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).slice(0, 5)
  const contactGroups = [
    ['Vatandas verileri', scopedContactRecords, 'Formu dolduran kisilerin iletisim bilgileri'],
    ['Gorus ve oneriler', scopedContactRecords.filter(record => record.topic === 'Gorus' || record.topic === 'Oneri'), 'Gorus ve oneri olarak isaretlenen talepler'],
    ['Sorular', scopedContactRecords.filter(record => record.topic === 'Soru'), 'Soru olarak isaretlenen talepler'],
  ] as const
  const reportFormats = [
    {label: 'PDF', enabled: isSuperAdmin || isMunicipalityAdmin || isDistrictManager, note: isDistrictManager ? 'Kendi ilçesi' : 'Yetkili kapsam'},
    {label: 'Excel', enabled: isSuperAdmin || isMunicipalityAdmin || isDistrictManager, note: isDistrictManager ? 'Kendi ilçesi' : 'Yetkili kapsam'},
    {label: 'CSV', enabled: isSuperAdmin, note: isSuperAdmin ? 'Tam veri' : 'Sadece super admin'},
  ]
  const reportTypes = isSuperAdmin ? [
    ['Oy', 'Tüm ilçeler ve tüm projeler'],
    ['İlçe', '13 ilçe karşılaştırması'],
    ['Kategori', 'Tüm kategori dağılımı'],
    ['Vatandaş', 'Tam erişim ve KVKK kayıtları'],
    ['Proje', 'Tüm proje portföyü'],
    ['Dashboard', 'Genel performans özeti'],
    ['AI', 'AI analiz ve puanları'],
    ['Audit', 'Sistem işlem kayıtları'],
    ['Sistem', 'API, yedekleme ve güvenlik raporu'],
  ] : isMunicipalityAdmin ? [
    ['Oy', 'Tüm ilçeler'],
    ['İlçe', '13 ilçe karşılaştırması'],
    ['Kategori', 'Tüm kategori dağılımı'],
    ['Vatandaş', 'KVKK filtreli özet'],
    ['Proje', 'Tüm proje portföyü'],
  ] : isDistrictManager ? [
    ['Kendi İlçem', adminUser?.district ? `${adminUser.district} kapsamı` : 'İlçe kapsamı'],
    ['Projelerim', 'İlçe projeleri'],
    ['Oy Dağılımı', 'İlçe oyları'],
    ['Mahalle Analizi', 'Anonim katılım özeti'],
    ['Kategori', 'İlçe kategori dağılımı'],
  ] : [
    ['Atanan Projeler', 'Sadece kendisine atanan projeler'],
    ['Teknik Puanlar', 'Teknik değerlendirme kayıtları'],
    ['Maliyet Analizi', 'Atanan proje maliyetleri'],
    ['Oy', 'Atanan projelerde görünen destek'],
  ]
  const reportDistrictOptions = isSuperAdmin || isMunicipalityAdmin ? ['Tüm Muğla', ...districts] : isDistrictManager && adminUser?.district ? [adminUser.district] : ['Atanan projeler']
  const quickTargets: QuickTarget[] = [
    {label: 'Onay kutusu', href: '#projeler', count: pendingProjects.length, icon: Clock3, note: 'Vatandaş fikirleri otomatik buraya düşer.'},
    {label: 'Proje havuzu', href: '#proje-havuzu', count: scopedProjects.length, icon: FolderKanban, note: 'Tüm canlı kayıtlar tek tabloda.'},
    ...(canSeeLiveCitizenData ? [{label: 'Canlı veri', href: '#canli-veri-listesi', count: scopedCitizens.length, icon: Database, note: 'Giriş ve kayıt bilgileri.'}] : []),
    {label: 'Yetkililer', href: '#yetkililer', count: accounts.length, icon: UsersRound, note: 'Sadece süper admin kapsam belirler.'},
    {label: 'Oylamalar', href: '#oylamalar', count: activeVotingProjects.length, icon: Vote, note: 'Yayındaki projelere tek tık.'},
    {label: 'Raporlar', href: '#raporlar', count: voteLeaderboard.length, icon: FileBarChart, note: 'Canlı özet ve çıktılar.'},
  ]
  const ageDistribution = ageGroups.map(group => ({
    label: group,
    value: scopedCitizens.filter(citizen => ageGroup(Number(citizen.age)) === group).length,
  }))
  const maxAgeGroup = Math.max(1, ...ageDistribution.map(item => item.value))

  return <AdminAuthGate><AppShell role="admin">
    <header className="sticky top-0 z-30 border-b border-mugla-navy/10 bg-white/95 px-6 py-4 backdrop-blur lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[.2em] text-mugla-cyan">YÖNETİM MERKEZİ</p>
          <h1 className="text-2xl font-bold">Muğla Senin Bütçen Yönetim Paneli</h1>
          <p className="mt-1 text-sm text-mugla-navy/55">{adminUser ? `${adminUser.name} - ${adminUser.role}` : 'Yetki kontrol ediliyor'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="hidden h-11 min-w-[260px] items-center gap-2 rounded-xl border border-mugla-navy/10 bg-mugla-sand/55 px-4 lg:flex">
            <Search size={16}/>
            <input className="w-full bg-transparent text-sm outline-none" placeholder="Ara: proje, ilçe, vatandaş"/>
          </label>
          <a href="#bildirimler" className="grid h-11 w-11 place-items-center rounded-xl border border-mugla-navy/10 bg-white text-mugla-navy/65 hover:text-mugla-orange"><Bell size={18}/></a>
          <button type="button" onClick={() => setPeopleOpen(value => !value)} className="grid h-11 w-11 place-items-center rounded-xl border border-mugla-navy/10 bg-white text-mugla-navy/65 hover:text-mugla-cyan" aria-label="Profil"><UserRound size={18}/></button>
        </div>
      </div>
    </header>

    <div className="space-y-7 p-6 lg:p-10">
      {message && <div className="rounded-2xl bg-green-50 px-5 py-4 text-sm font-semibold text-green-800">{message}</div>}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {quickTargets.map(({label, href, count, icon: Icon, note}) => <a key={label} href={href} onClick={() => {if (label === 'Onay kutusu') setProjectCenterTab('Onay Bekleyen')}} className="group rounded-2xl border border-mugla-navy/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-mugla-cyan">
          <span className="flex items-center justify-between gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-mugla-sand text-mugla-cyan"><Icon size={19}/></span>
            <span className="text-2xl font-black">{Number(count).toLocaleString('tr-TR')}</span>
          </span>
          <b className="mt-4 block">{label}</b>
          <small className="mt-1 block leading-5 text-mugla-navy/45">{note}</small>
        </a>)}
      </section>

      <section id="dashboard" className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-semibold text-mugla-navy/45">
              <span>Dashboard</span>
            </div>
            <h2 className="text-2xl font-black">Genel Bakış</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {dashboardMetrics.map(([label, value, Icon, tone]) => <div key={label} className="rounded-xl border border-mugla-navy/10 bg-white p-4 shadow-sm">
                <span className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={20}/></span>
                <p className="text-sm text-mugla-navy/55">{label}</p>
                <b className="mt-1 block text-3xl">{Number(value).toLocaleString('tr-TR')}</b>
              </div>)}
            </div>
            <section>
              <h3 className="font-bold">Son Eklenen Projeler</h3>
              <div className="mt-3 overflow-x-auto rounded-xl border border-mugla-navy/10 bg-white">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-mugla-sand/60 text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="p-3">Proje</th><th>İlçe</th><th>Durum</th><th className="text-right">İşlem</th></tr></thead>
                  <tbody>{recentProjects.length ? recentProjects.map(project => <tr key={project.id} className="border-t border-mugla-navy/10">
                    <td className="p-3 font-semibold">{project.title}</td>
                    <td>{project.district}</td>
                    <td><span className="rounded-lg bg-mugla-sand px-2 py-1 text-xs font-bold text-mugla-navy/60">{project.workflowStatus ?? project.status}</span></td>
                    <td className="p-3 text-right"><button type="button" className={tableAction} onClick={() => setManagedProjectId(project.id)}><Eye size={14}/> İncele</button></td>
                  </tr>) : <tr><td colSpan={4} className="p-6 text-center text-mugla-navy/45">Henüz proje yok.</td></tr>}</tbody>
                </table>
              </div>
            </section>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader><h2 className="text-xl font-bold">Hızlı İşlemler</h2></CardHeader>
          <CardContent className="grid gap-3">
            {canCreateMunicipalProject && <Button variant="orange" className="rounded-xl bg-mugla-cyan hover:bg-mugla-blue" onClick={() => setOpen(true)}><Plus size={17}/> Yeni Proje</Button>}
            <Button variant="outline" className="w-full justify-start" disabled={!canManageVoting} onClick={() => {setVotingWizardOpen(true); setVotingWizardStep(1)}}><Vote size={17}/> Oylama Oluştur</Button>
            {canManagePeople && <Button variant="outline" onClick={() => setPeopleOpen(true)}><UserPlus size={17}/> Yeni Yetkili Ekle</Button>}
            <a href="#raporlar"><Button variant="outline" className="w-full justify-start"><FileBarChart size={17}/> Rapor Al</Button></a>
          </CardContent>
        </Card>
      </section>

      <Card id="projeler" className="rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-mugla-cyan">PROJELER</p>
              <h2 className="mt-1 text-xl font-bold">Proje merkezi</h2>
              <p className="mt-1 text-sm text-mugla-navy/55">Dashboard &gt; Projeler</p>
            </div>
            {canCreateMunicipalProject && <Button variant="orange" className="rounded-xl bg-mugla-cyan hover:bg-mugla-blue" onClick={() => setOpen(true)}><Plus size={17}/> Yeni Proje</Button>}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              ['Tümü', scopedProjects.length],
              ['Proje Havuzu', scopedProjects.length],
              ['Onay Bekleyen', pendingProjects.length],
              ['Onaylanan', approvedProjects.length],
              ['Yayında', activeVotingProjects.length],
              ['Reddedilenler', archivedProjects.length],
              ['Arşiv', archivedProjects.length],
            ].map(([label, count]) => <button key={label} type="button" onClick={() => setProjectCenterTab(String(label))} className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-bold ${projectCenterTab === label ? 'border-mugla-cyan bg-cyan-50 text-mugla-navy' : 'border-mugla-navy/10 bg-white text-mugla-navy/55 hover:text-mugla-navy'}`}>{label} <span className="ml-1 text-xs opacity-60">{count}</span></button>)}
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_160px_auto_auto_auto]">
            <label className="flex items-center gap-2 rounded-xl border border-mugla-navy/15 bg-white px-4 py-3"><Search size={16}/><input className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Ara"/></label>
            <select className={field} defaultValue=""><option value="">Kategori</option>{categories.map(([item]) => <option key={item}>{item}</option>)}</select>
            <select className={field} defaultValue=""><option value="">İlçe</option>{districts.map(item => <option key={item}>{item}</option>)}</select>
            <select className={field} defaultValue=""><option value="">Durum</option><option>Taslak</option><option>İncelemede</option><option>Oylamada</option><option>Kazandı</option><option>Arşiv</option></select>
            <Button variant="outline" className="rounded-xl">Sırala</Button>
            <Button variant="outline" className="rounded-xl">Excel</Button>
            <Button variant="outline" className="rounded-xl">PDF</Button>
          </div>
          {projectCenterTab === 'Onay Bekleyen' && <section className="space-y-4 rounded-2xl border border-mugla-orange/20 bg-orange-50/30 p-4">
            <div>
              <h3 className="text-lg font-black">Onay bekleyen başvurular</h3>
              <p className="mt-1 text-sm text-mugla-navy/55">Fikir gönder formundan gelen başvurular otomatik bu alana düşer. Onaylanan projeler proje listesinde oylamaya açılır.</p>
            </div>
            {pendingProjects.length > 0 && canReviewProjects && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-mugla-navy/10 bg-white p-4">
              <label className="flex items-center gap-3 text-sm font-bold text-mugla-navy">
                <input type="checkbox" className="h-4 w-4 accent-mugla-orange" checked={allPendingSelected} onChange={toggleAllPendingSelection}/>
                Tüm onay kutularını seç
              </label>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" type="button" onClick={() => setMergeSelection([])} disabled={!mergeSelection.length}>Seçimi temizle</Button>
                <Button size="sm" variant="orange" type="button" onClick={() => reviewMany(mergeSelection, 'Onaylandı')} disabled={!mergeSelection.length}><CheckCircle2 size={15}/> Seçilenleri onayla</Button>
                <Button size="sm" variant="outline" type="button" onClick={() => reviewMany(mergeSelection, 'Reddedildi')} disabled={!mergeSelection.length}><XCircle size={15}/> Seçilenleri reddet</Button>
                <Button size="sm" variant="outline" type="button" onClick={() => setMergeFormOpen(value => !value)} disabled={selectedMergeProjects.length < 2}><FolderKanban size={15}/> Manuel proje birleştir</Button>
                <Button size="sm" variant="orange" type="button" onClick={() => reviewMany(pendingProjects.map(project => project.id), 'Onaylandı')}><CheckCircle2 size={15}/> Tümünü onayla</Button>
                <Button size="sm" variant="outline" type="button" onClick={() => reviewMany(pendingProjects.map(project => project.id), 'Reddedildi')}><XCircle size={15}/> Tümünü reddet</Button>
              </div>
              {mergeSelection.length >= 2 && <p className="w-full text-xs font-semibold text-mugla-navy/55">{mergeSelection.length} başvuru seçildi. Aynı proje başvurularını tek kayıtta toplamak için Manuel proje birleştir butonunu kullanın.</p>}
            </div>}
            {selectedMergeProjects.length >= 2 && mergeFormOpen && <form onSubmit={submitMergedProject} className="grid gap-4 rounded-2xl border border-mugla-cyan/30 bg-cyan-50/40 p-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="md:col-span-2 xl:col-span-3">
                <p className="text-xs font-bold tracking-[.18em] text-mugla-cyan">BIRLESTIRILMIS PROJE</p>
                <h3 className="text-lg font-black">Seçili başvuruları tek projeye dönüştür</h3>
                <p className="mt-1 text-sm text-mugla-navy/55">{selectedMergeProjects.map(project => project.projectCode).join(', ')}</p>
              </div>
              <label><span className="mb-2 block text-sm font-semibold">Yeni proje adı</span><input className={field} name="title" required defaultValue={selectedMergeProjects[0]?.title}/></label>
              <label><span className="mb-2 block text-sm font-semibold">İlçe</span><select className={field} name="district" required defaultValue={selectedMergeProjects[0]?.district}>{districts.map(x => <option key={x}>{x}</option>)}</select></label>
              <label><span className="mb-2 block text-sm font-semibold">Kategori</span><select className={field} name="category" required defaultValue={selectedMergeProjects[0]?.category}>{categories.map(([label]) => <option key={label}>{label}</option>)}</select></label>
              <label><span className="mb-2 block text-sm font-semibold">Tahmini bütçe</span><input className={field} name="budget" type="number" min={0} required defaultValue={selectedMergeProjects.reduce((sum, project) => sum + Number(project.budget || 0), 0)}/></label>
              <label><span className="mb-2 block text-sm font-semibold">Durum</span><select className={field} name="status" defaultValue="Oylamada">{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
              <label><span className="mb-2 block text-sm font-semibold">Hedef Grup</span><select className={field} name="targetGroup" defaultValue={selectedMergeProjects[0]?.targetGroup ?? targetGroups[0]}>{targetGroups.map(group => <option key={group}>{group}</option>)}</select></label>
              <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-sm font-semibold">Açıklama</span><textarea className={field} name="summary" rows={4} defaultValue={selectedMergeProjects.map(project => project.summary || project.shortDescription || project.title).join('\n\n')}/></label>
              <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-sm font-semibold">Birleştirme notu</span><textarea className={field} name="mergeNote" rows={3} placeholder="Aynı ihtiyacı anlatan başvurular tek projede toplandı."/></label>
              <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-3"><Button type="submit" variant="orange"><FolderKanban size={17}/> Projeye dönüştür</Button><Button type="button" variant="outline" onClick={() => setMergeFormOpen(false)}>Vazgeç</Button></div>
            </form>}
            {pendingProjects.length ? pendingProjects.map(project => <PendingProjectCard
              key={project.id}
              project={project}
              selected={mergeSelection.includes(project.id)}
              expanded={expandedProjectDetails === project.id}
              onToggleMerge={() => toggleMergeSelection(project.id)}
              onToggleDetails={() => setExpandedProjectDetails(value => value === project.id ? null : project.id)}
              onApprove={() => approvePendingProject(project)}
              onReject={() => rejectPendingProject(project)}
              onRevision={() => requestProjectRevision(project, 'Revizyon İstendi')}
              onMissingDocument={() => requestProjectRevision(project, 'Eksik Belge')}
              canReview={canReviewProjects}
            />) : <div className="py-12 text-center text-mugla-navy/50"><Clock3 className="mx-auto mb-3"/><p className="font-semibold">Onay bekleyen başvuru yok.</p></div>}
          </section>}
          <div className="overflow-x-auto rounded-xl border border-mugla-navy/10 bg-white">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-mugla-sand/60 text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="p-3">Proje</th><th>İlçe</th><th>Tarih</th><th>Durum</th><th className="text-right">İşlem</th></tr></thead>
              <tbody>{projectCenterProjects.length ? projectCenterProjects.map(project => <tr key={project.id} className="border-t border-mugla-navy/10 hover:bg-mugla-sand/35">
                <td className="p-3"><b className="block">{project.title}</b><span className="text-xs text-mugla-navy/45">{project.projectCode} · {projectCategoryLabel(project)}</span></td>
                <td>{project.district}</td>
                <td>{project.createdAt ? new Date(project.createdAt).toLocaleDateString('tr-TR') : '-'}</td>
                <td><span className="rounded-lg bg-mugla-sand px-2 py-1 text-xs font-bold text-mugla-navy/65">{project.workflowStatus ?? project.moderationStatus}</span></td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" className={tableAction} onClick={() => setManagedProjectId(project.id)}><Eye size={14}/> İncele</button>
                    {canReviewProjects && isPendingReviewProject(project) && <button type="button" className={tableAction} onClick={() => approvePendingProject(project)}><CheckCircle2 size={14}/> Onayla</button>}
                    {canReviewProjects && isPendingReviewProject(project) && <button type="button" className={`${tableAction} border-red-100 bg-red-50 text-red-700 hover:bg-red-100`} onClick={() => rejectPendingProject(project)}><XCircle size={14}/> Reddet</button>}
                    {canEditProjects && <button type="button" className={tableAction} onClick={() => setManagedProjectId(project.id)}><Pencil size={14}/> Düzenle</button>}
                    {canArchiveProjects && <button type="button" className={`${tableAction} border-red-100 bg-red-50 text-red-700 hover:bg-red-100`} onClick={() => archiveProject(project)}><Trash2 size={14}/> Arşiv</button>}
                    {canPermanentDeleteProjects && <button type="button" className={`${tableAction} border-red-100 bg-red-50 text-red-700 hover:bg-red-100`} onClick={() => deleteManagedProject(project)}><Trash2 size={14}/> Kalıcı Sil</button>}
                  </div>
                </td>
              </tr>) : <tr><td colSpan={5} className="p-8 text-center text-mugla-navy/45">Bu sekmede proje yok.</td></tr>}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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

      {peopleOpen && canManagePeople && <Card id="yetkililer">
        <CardHeader>
          <h2 className="text-xl font-bold">Yetkili kisiler</h2>
          <p className="text-sm text-mugla-navy/55">Bu alan vatandaş hesabı oluşturmaz. Vatandaşlar üye ol ekranından kendileri kayıt olur; burada yalnızca belediye personeli için yetkili hesap tanımlanır.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {canManagePeople ? <form onSubmit={submitPerson} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label><span className="mb-2 block text-sm font-semibold">Ad Soyad</span><input className={field} name="name" required minLength={3}/></label>
            <label><span className="mb-2 block text-sm font-semibold">E-posta</span><input className={field} name="email" type="email" required/></label>
            <label><span className="mb-2 block text-sm font-semibold">Rol</span><select className={field} name="role" required>{assignableRoles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Gecici sifre</span><input className={field} name="password" type="password" required minLength={8}/></label>
            <label><span className="mb-2 block text-sm font-semibold">İlçe kapsamı</span><select className={field} name="district" defaultValue=""><option value="">Tüm ilçeler / atanmış proje</option>{districts.map(district => <option key={district}>{district}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Birim</span><input className={field} name="department" placeholder="Fen işleri, ulaşım, CRM..."/></label>
            <label className="md:col-span-2"><span className="mb-2 block text-sm font-semibold">Atanan proje kodları / ID</span><input className={field} name="assignedProjectIds" placeholder="MSB-2026-0001, MSB-2026-0002"/></label>
            <fieldset className="md:col-span-2 xl:col-span-4 rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-4">
              <legend className="px-2 text-sm font-black">Özel veri izinleri</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3 text-sm">
                  <input type="checkbox" name="liveCitizenData" className="mt-1 h-4 w-4 accent-mugla-orange"/>
                  <span><b className="block">Canlı veri listesini görsün</b><small className="mt-1 block text-mugla-navy/45">Giriş/kayıt yapan vatandaşların tanımlı bilgilerini görür.</small></span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3 text-sm">
                  <input type="checkbox" name="citizenDataExport" className="mt-1 h-4 w-4 accent-mugla-orange"/>
                  <span><b className="block">Excel/PDF dışa aktarabilsin</b><small className="mt-1 block text-mugla-navy/45">Canlı veri listesini dosya olarak indirebilir.</small></span>
                </label>
              </div>
            </fieldset>
            <div className="md:col-span-2 xl:col-span-4"><Button type="submit" variant="orange"><UserPlus size={17}/> Yetkili tanimla</Button></div>
          </form> : <p className="rounded-2xl bg-mugla-sand/70 p-4 text-sm font-semibold text-mugla-navy/55">Hesap ekleme ve silme yetkisi sadece super admin hesabindadir.</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="pb-3">Kisi</th><th>E-posta</th><th>Rol</th><th>Kapsam</th><th>Veri izni</th><th>Tanimlayan</th><th className="text-right">Islem</th></tr></thead>
              <tbody>{accounts.map(account => <tr key={account.id} className="border-t border-mugla-navy/10">
                <td className="py-4 font-semibold">{account.name}</td>
                <td>{account.email}</td>
                <td><span className="inline-flex items-center gap-2 rounded-full bg-mugla-sand px-3 py-1 text-xs font-bold text-mugla-navy/65"><ShieldCheck size={13}/>{account.role}</span></td>
                <td className="text-xs text-mugla-navy/55">{account.district || account.department || account.assignedProjectIds?.join(', ') || 'Tüm yetkili kapsam'}</td>
                <td><div className="flex flex-wrap gap-1">{account.role === 'super-admin' || account.permissions?.liveCitizenData ? <span className="rounded-full bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">Canlı veri</span> : <span className="rounded-full bg-mugla-sand px-2 py-1 text-[11px] font-bold text-mugla-navy/45">Kapalı</span>}{account.role === 'super-admin' || account.permissions?.citizenDataExport ? <span className="rounded-full bg-cyan-50 px-2 py-1 text-[11px] font-bold text-mugla-cyan">Dışa aktar</span> : null}</div></td>
                <td className="text-mugla-navy/45">{account.createdBy ?? 'sistem'}</td>
                <td className="text-right">{canManagePeople && account.role !== 'super-admin' && account.id !== adminUser.id ? <button aria-label={`${account.name} hesabini sil`} className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100" onClick={() => deletePerson(account.id)}>Sil</button> : <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Sistemde</span>}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>}

      {canSeeCategories && <Card id="ayarlar">
        <CardHeader>
          <p className="text-xs font-bold tracking-widest text-mugla-cyan">YILLIK TEMA KURALLARI</p>
          <h2 className="text-xl font-bold">Vatandas fikir gonderim temalari</h2>
          <p className="text-sm text-mugla-navy/55">Tema tanımlama ve değiştirme yetkisi yalnızca Super Admin ve Büyükşehir Admini içindir. İlçe yöneticileri yürürlükteki kuralları salt okunur olarak görüntüler.</p>
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
              {annualThemeOptions.map(theme => <label key={theme.id} className={`flex items-start gap-3 rounded-xl border border-mugla-navy/10 bg-white p-3 ${canManageAnnualThemes ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}>
                <input type="checkbox" value={theme.id} checked={themeDraft.includes(theme.id)} onChange={event => toggleTheme(theme.id, event.target.checked)} disabled={!canManageAnnualThemes} className="mt-1 h-4 w-4 accent-mugla-orange disabled:cursor-not-allowed"/>
                <span><b className="block text-sm">{theme.label}</b><small className="mt-1 block leading-5 text-mugla-navy/50">{theme.note}</small></span>
              </label>)}
            </div>
            {!canManageAnnualThemes && <p className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold text-mugla-navy/55">Bu alan sadece görüntüleme modunda. Tema tanımlama ve değiştirme yetkisi Super Admin ve Büyükşehir Admini ile sınırlıdır.</p>}
            <div className="mt-5"><Button type="submit" variant="orange" disabled={!canManageAnnualThemes}><ShieldCheck size={17}/> Tema kuralini kaydet</Button></div>
          </form>
        </CardContent>
      </Card>}

      {open && canCreateMunicipalProject && <div className="fixed inset-0 z-50 grid place-items-center bg-mugla-navy/45 p-4 backdrop-blur-sm">
        <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto">
      <Card>
        <CardHeader><h2 className="text-xl font-bold">8 adımlı proje başvuru sihirbazı</h2><p className="text-sm text-mugla-navy/55">Yetkili kayıtları yayınlanmaz; ilçe admin incelemesine düşer. Süper admin son kararla oylamaya açar.</p></CardHeader>
        <CardContent><form onSubmit={submitProject} className="space-y-5">
          <div className="flex justify-end"><button type="button" onClick={() => setOpen(false)} className="rounded-full bg-mugla-sand px-4 py-2 text-xs font-bold text-mugla-navy/60">Kapat</button></div>
          <div className="h-2 overflow-hidden rounded-full bg-mugla-sand"><span className="block h-full w-full rounded-full bg-mugla-orange"/></div>
          <section className="grid gap-4 rounded-2xl border border-mugla-navy/10 p-4 md:grid-cols-2 xl:grid-cols-3">
            <p className="md:col-span-2 xl:col-span-3 text-xs font-black tracking-widest text-mugla-cyan">1. GENEL BİLGİLER</p>
            <label className="md:col-span-2"><span className="mb-2 block text-sm font-semibold">Proje Başlığı</span><input className={field} name="title" required/></label>
            <label><span className="mb-2 block text-sm font-semibold">İlçe</span><select className={field} name="district" required defaultValue={isDistrictStaff || isDistrictManager ? adminUser?.district : undefined} disabled={isDistrictStaff && Boolean(adminUser?.district)}>{districts.map(x => <option key={x}>{x}</option>)}</select>{isDistrictStaff && adminUser?.district && <input type="hidden" name="district" value={adminUser.district}/>}</label>
            <label className="md:col-span-3"><span className="mb-2 block text-sm font-semibold">Kısa Açıklama</span><input className={field} name="shortDescription" maxLength={180} required/></label>
            <label><span className="mb-2 block text-sm font-semibold">Kategori</span><select className={field} name="category" required value={manualProjectCategory} onChange={event => setManualProjectCategory(event.target.value)}>{categories.map(([x]) => <option key={x}>{x}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Alt Kategori</span><input className={field} name="subcategory" placeholder="Genel, ulaşım, park vb."/></label>
            {manualProjectCategory === 'Diğer' && <label><span className="mb-2 block text-sm font-semibold">Proje teması</span><input className={field} name="customTheme" required maxLength={120} placeholder="Manuel tema yazın"/></label>}
            <label><span className="mb-2 block text-sm font-semibold">Mahalle</span><input className={field} name="neighborhood" placeholder="Mahalle adı"/></label>
            <label><span className="mb-2 block text-sm font-semibold">Enlem</span><input className={field} name="lat" type="number" step="any" placeholder="37.08"/></label>
            <label><span className="mb-2 block text-sm font-semibold">Boylam</span><input className={field} name="lng" type="number" step="any" placeholder="28.45"/></label>
            <label className="md:col-span-3"><span className="mb-2 block text-sm font-semibold">Proje Konumu / Harita Notu</span><input className={field} name="locationNote" placeholder="Haritada pin bırakılacak nokta veya adres tarifi"/></label>
          </section>
          <section className="grid gap-4 rounded-2xl border border-mugla-navy/10 p-4 md:grid-cols-2 xl:grid-cols-3">
            <p className="md:col-span-2 xl:col-span-3 text-xs font-black tracking-widest text-mugla-cyan">2. DETAYLAR VE İÇERİK</p>
            <label className="md:col-span-3"><span className="mb-2 block text-sm font-semibold">Amaç</span><textarea className={`${field} min-h-24`} name="purpose" required/></label>
            <label className="md:col-span-3"><span className="mb-2 block text-sm font-semibold">Özet / Açıklama</span><textarea className={`${field} min-h-28`} name="summary" required/></label>
            <label className="md:col-span-3"><span className="mb-2 block text-sm font-semibold">Faaliyetler</span><textarea className={`${field} min-h-24`} name="activities"/></label>
            <label className="md:col-span-3"><span className="mb-2 block text-sm font-semibold">Beklenen Fayda / Sonuç</span><textarea className={`${field} min-h-24`} name="expectedResults" required/></label>
            <label><span className="mb-2 block text-sm font-semibold">Hedef Kitle</span><select className={field} name="targetGroup" required>{targetGroups.map(group => <option key={group}>{group}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Video URL (opsiyonel)</span><input className={field} name="videoUrl" type="url" placeholder="https://"/></label>
            <label><span className="mb-2 block text-sm font-semibold">Durum</span><select className={field} name="status" required defaultValue="Başvuru"><option>Başvuru</option>{isSuperAdmin && statuses.filter(x => x !== 'Başvuru').map(x => <option key={x}>{x}</option>)}</select></label>
          </section>
          <section className="grid gap-4 rounded-2xl border border-mugla-navy/10 p-4 md:grid-cols-2 xl:grid-cols-4">
            <p className="md:col-span-2 xl:col-span-4 text-xs font-black tracking-widest text-mugla-cyan">3. FİNANS VE ETKİ ANALİZİ</p>
            <label><span className="mb-2 block text-sm font-semibold">Tahmini Bütçe</span><input className={field} name="budget" type="number" min="0" step="1" required disabled={isDistrictStaff}/>{isDistrictStaff && <input type="hidden" name="budget" value="0"/>}</label>
            <label><span className="mb-2 block text-sm font-semibold">Finans Kaynağı</span><input className={field} name="financingSource" placeholder="Belediye, hibe, ortak finansman"/></label>
            <label><span className="mb-2 block text-sm font-semibold">Süre</span><input className={field} name="duration" placeholder="Örn. 6 ay"/></label>
            <label><span className="mb-2 block text-sm font-semibold">Öncelik</span><select className={field} name="priority"><option>Orta</option><option>Yüksek</option><option>Düşük</option></select></label>
            {['socialImpact','environmentalImpact','economicImpact','accessibilityImpact','sustainabilityImpact'].map((name, index) => <label key={name}><span className="mb-2 block text-sm font-semibold">{['Sosyal Etki','Çevresel Etki','Ekonomik Etki','Engelli Erişimi','Sürdürülebilirlik'][index]}</span><input className={field} name={name} type="number" min="0" max="100" step="1" placeholder="0-100"/></label>)}
          </section>
          <section className="grid gap-4 rounded-2xl border border-mugla-navy/10 p-4 md:grid-cols-3">
            <p className="md:col-span-3 text-xs font-black tracking-widest text-mugla-cyan">4-8. BELGELER, HARİTA, ÖN İZLEME VE GÖNDER</p>
            <div className="rounded-xl bg-mugla-sand/70 p-4 text-sm text-mugla-navy/55">PDF, Word, görsel, drone görseli ve 3D tasarım dosyaları mevcut proje kartı yönetimi alanından eklenir. Vatandaş ön izlemesi proje kartı bilgilerinden otomatik oluşur.</div>
            <div className="rounded-xl bg-mugla-sand/70 p-4 text-sm text-mugla-navy/55">Yetkili yayınlayamaz, oylamaya açamaz, bütçe değiştiremez ve silemez. Kayıt ilçe admin incelemesine gider.</div>
            <div className="flex items-end"><Button type="submit" variant="orange">{isDistrictStaff ? 'İncelemeye Gönder' : 'Taslak Kaydet / İncelemeye Gönder'}</Button></div>
          </section>
        </form></CardContent>
      </Card>
        </div>
      </div>}

      {canSeeCrm && <Card id="vatandaslar" className="rounded-xl shadow-sm">
        <CardHeader>
          <p className="text-xs font-bold tracking-widest text-mugla-cyan">VATANDAŞLAR</p>
          <h2 className="text-xl font-bold">Vatandaş listesi</h2>
          <p className="text-sm text-mugla-navy/55">Dashboard &gt; Vatandaşlar</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_160px_auto]">
            <label className="flex items-center gap-2 rounded-xl border border-mugla-navy/15 bg-white px-4 py-3"><Search size={16}/><input className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Ara"/></label>
            <select className={field} defaultValue=""><option value="">İlçe</option>{districts.map(item => <option key={item}>{item}</option>)}</select>
            <select className={field} defaultValue=""><option value="">Doğrulanma</option><option>Doğrulandı</option><option>Bekliyor</option></select>
            <Button variant="outline" className="rounded-xl">Filtre</Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-mugla-navy/10 bg-white">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-mugla-sand/60 text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="p-3">İsim</th><th>İlçe</th><th>Doğrulanma</th><th>Oy Sayısı</th><th>Gönderdiği Proje</th><th className="text-right">Profil</th></tr></thead>
              <tbody>{scopedCitizens.length ? scopedCitizens.map(citizen => <tr key={citizen.id} className="border-t border-mugla-navy/10 hover:bg-mugla-sand/35">
                <td className="p-3"><b className="block">{citizen.name}</b><span className="text-xs text-mugla-navy/45">{citizen.email}</span></td>
                <td>{citizen.district}</td>
                <td><span className="rounded-lg bg-green-50 px-2 py-1 text-xs font-bold text-green-700">{citizen.badges.length ? 'Doğrulandı' : 'Bekliyor'}</span></td>
                <td>{citizen.voteCount}</td>
                <td>{citizen.proposalCount}</td>
                <td className="p-3 text-right"><button type="button" className={tableAction}><Eye size={14}/> Aç</button></td>
              </tr>) : <tr><td colSpan={6} className="p-8 text-center text-mugla-navy/45">Henüz vatandaş kaydı yok.</td></tr>}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>}

      {canSeeLiveCitizenData && <Card id="canli-veri-listesi" className="rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-mugla-cyan">CANLI VERİ LİSTESİ</p>
              <h2 className="text-xl font-bold">Giriş ve kayıt yapan vatandaş bilgileri</h2>
              <p className="mt-1 text-sm text-mugla-navy/55">Kayıt formu tamamlandığında ve kullanıcı giriş yaptığında bilgiler otomatik güncellenir. Bu alanı sadece süper admin ve süper adminin tanımladığı yetkili roller görebilir.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={!canExportLiveCitizenData} onClick={exportCitizenDataExcel}><FileBarChart size={17}/> Excel</Button>
              <Button type="button" variant="outline" disabled={!canExportLiveCitizenData} onClick={exportCitizenDataPdf}><FileText size={17}/> PDF</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {!canExportLiveCitizenData && <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-semibold text-mugla-orange">Bu hesabın dışa aktarma yetkisi yok. Excel/PDF indirme iznini yalnızca süper admin açabilir.</div>}
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-mugla-navy/10 bg-white p-4">
              <p className="text-sm text-mugla-navy/50">Canlı kayıt sayacı</p>
              <b className="mt-1 block text-4xl">{scopedCitizens.length.toLocaleString('tr-TR')}</b>
              <p className="mt-1 text-xs text-mugla-navy/40">Sıfırdan başlar, kayıt geldikçe artar.</p>
            </div>
            <div className="rounded-2xl border border-mugla-navy/10 bg-white p-4">
              <p className="text-sm text-mugla-navy/50">T.C. vatandaş</p>
              <b className="mt-1 block text-4xl">{scopedCitizens.filter(citizen => citizen.nationality === 'tc').length.toLocaleString('tr-TR')}</b>
              <p className="mt-1 text-xs text-mugla-navy/40">Formdaki uyruk alanından.</p>
            </div>
            <div className="rounded-2xl border border-mugla-navy/10 bg-white p-4">
              <p className="text-sm text-mugla-navy/50">Yabancı uyruklu</p>
              <b className="mt-1 block text-4xl">{scopedCitizens.filter(citizen => citizen.nationality === 'foreign').length.toLocaleString('tr-TR')}</b>
              <p className="mt-1 text-xs text-mugla-navy/40">Ülke bilgisiyle birlikte.</p>
            </div>
            <div className="rounded-2xl border border-mugla-navy/10 bg-white p-4">
              <p className="text-sm text-mugla-navy/50">Bugün giriş/kayıt</p>
              <b className="mt-1 block text-4xl">{scopedCitizens.filter(citizen => {
                const today = new Date().toDateString()
                return new Date(citizen.createdAt).toDateString() === today || new Date(citizen.lastLogin).toDateString() === today
              }).length.toLocaleString('tr-TR')}</b>
              <p className="mt-1 text-xs text-mugla-navy/40">Son giriş zamanı canlıdır.</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-mugla-navy/10 bg-white">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="bg-mugla-sand/60 text-xs uppercase tracking-wider text-mugla-navy/45">
                <tr><th className="p-3">Ad Soyad</th><th>E-posta</th><th>Telefon</th><th>Uyruk</th><th>Konum</th><th>Yaş</th><th>Doğrulama</th><th>Oy</th><th>Proje</th><th>Kayıt</th><th>Son giriş</th></tr>
              </thead>
              <tbody>{scopedCitizens.length ? scopedCitizens.map(citizen => <tr key={citizen.id} className="border-t border-mugla-navy/10 hover:bg-mugla-sand/35">
                <td className="p-3 font-semibold">{citizen.name}</td>
                <td>{citizen.email}</td>
                <td>{citizen.phone}</td>
                <td>{citizen.nationality === 'foreign' ? `Yabancı${citizen.country ? ` · ${citizen.country}` : ''}` : 'T.C.'}</td>
                <td>{citizen.province} / {citizen.district}</td>
                <td>{citizen.age || '-'}</td>
                <td><span className="rounded-lg bg-green-50 px-2 py-1 text-xs font-bold text-green-700">{citizen.badges.join(', ') || 'Bekliyor'}</span></td>
                <td>{citizen.voteCount}</td>
                <td>{citizen.proposalCount}</td>
                <td>{new Date(citizen.createdAt).toLocaleString('tr-TR')}</td>
                <td>{citizen.lastLogin ? new Date(citizen.lastLogin).toLocaleString('tr-TR') : '-'}</td>
              </tr>) : <tr><td colSpan={11} className="p-8 text-center text-mugla-navy/45">Henüz canlı vatandaş verisi yok.</td></tr>}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>}

      {canSeeCrm && <Card id="crm">
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

      {canSeeNotifications && <Card id="bildirimler">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-mugla-cyan">BİLDİRİM MERKEZİ</p>
              <h2 className="mt-1 text-xl font-bold">Manuel, otomatik ve planlı bildirimler</h2>
              <p className="mt-1 max-w-3xl text-sm text-mugla-navy/55">Bildirimler rol bazlıdır. Rutin süreçlerde sistem otomatik bilgilendirir; yöneticiler yalnızca yetkili oldukları kapsamda manuel veya planlı bildirim oluşturur.</p>
            </div>
            <span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-black text-mugla-navy/55">{activeRole} kapsamı</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Bugün', notificationScope.length.toLocaleString('tr-TR')],
              ['Okundu', notificationRead.toLocaleString('tr-TR')],
              ['Bekliyor', notificationPending.toLocaleString('tr-TR')],
              ['Açılma', `%${notificationOpenRate}`],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-mugla-navy/10 bg-white p-4 shadow-sm">
              <p className="text-sm text-mugla-navy/50">{label}</p>
              <b className="mt-1 block text-2xl">{value}</b>
            </div>)}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {['Yeni Bildirim', ...(canSendBulkNotification ? ['Toplu Bildirim'] : []), 'Otomatik Bildirimler', ...(canScheduleNotification ? ['Planlı Bildirimler'] : []), 'Taslaklar', 'Gönderilmişler', 'Şablonlar', 'İstatistikler'].map(item => <button key={item} type="button" onClick={() => setNotificationTab(item)} className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-bold ${notificationTab === item ? 'border-mugla-cyan bg-cyan-50 text-mugla-navy' : 'border-mugla-navy/10 bg-white text-mugla-navy/55 hover:text-mugla-navy'}`}>{item}</button>)}
          </div>

          {(notificationTab === 'Yeni Bildirim' || notificationTab === 'Toplu Bildirim' || notificationTab === 'Planlı Bildirimler') && <form onSubmit={event => submitNotification(event, notificationTab === 'Planlı Bildirimler' ? 'Planlandı' : 'Gönderildi')} className="grid gap-4 rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-4 lg:grid-cols-2">
            <label><span className="mb-2 block text-sm font-semibold">Başlık</span><input className={field} name="title" required placeholder="Başvurular başladı"/></label>
            <label><span className="mb-2 block text-sm font-semibold">Alıcı</span><select className={field} name="recipient" disabled={isCrmRole}><option>Vatandaş</option><option>İlçe</option><option>Admin</option></select></label>
            <label><span className="mb-2 block text-sm font-semibold">İlçe</span><select className={field} name="district" disabled={isDistrictManager || isCrmRole}><option value="">{isDistrictManager ? adminUser?.district : 'Tüm yetkili kapsam'}</option>{districts.map(item => <option key={item}>{item}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Kategori / Segment</span><select className={field} name="category" disabled={notificationTab !== 'Toplu Bildirim'}><option>Tümü</option>{categories.map(([item]) => <option key={item}>{item}</option>)}</select></label>
            <label className="lg:col-span-2"><span className="mb-2 block text-sm font-semibold">Mesaj</span><textarea className={`${field} min-h-28`} name="body" required placeholder="Başvurunuz başarıyla alınmıştır."/></label>
            <fieldset className="lg:col-span-2">
              <legend className="mb-2 text-sm font-black">Bildirim türleri</legend>
              <div className="grid gap-2 sm:grid-cols-4">
                {[
                  ['Push', 'Uygulama'],
                  ['E-posta', 'E-posta'],
                  ['SMS', 'SMS'],
                  ['WhatsApp', 'Web Push'],
                ].map(([value, label]) => <label key={value} className="flex items-center gap-2 rounded-xl bg-white p-3 text-sm font-bold"><input type="checkbox" name={value} defaultChecked={value === 'Push'} className="h-4 w-4 accent-mugla-orange"/>{label}</label>)}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <Button type="submit" variant="orange"><Bell size={17}/> Gönder</Button>
              <Button type="button" variant="outline" onClick={event => {
                const form = event.currentTarget.closest('form')
                if (form) saveNotificationFromForm(form, 'Taslak')
              }}>Taslak Kaydet</Button>
            </div>
          </form>}

          {notificationTab === 'Otomatik Bildirimler' && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Proje gönderildi', 'Başvurunuz alındı'],
              ['Revizyon istendi', 'Eksik bilgilerinizi tamamlayın'],
              ['Proje onaylandı', 'Teknik değerlendirme tamamlandı'],
              ['Oylama başladı', 'Projeniz oylamaya açıldı'],
              ['Oylama bitiyor', 'Son 24 saat kaldı'],
              ['Proje kazandı', 'Tebrikler, uygulama aşamasına geçildi'],
              ['Proje tamamlandı', 'Projeniz başarıyla tamamlandı'],
            ].map(([eventName, text]) => <div key={eventName} className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <b className="block text-green-800">{eventName}</b>
              <p className="mt-2 text-sm text-green-800/70">{text}</p>
            </div>)}
          </div>}

          {notificationTab === 'Şablonlar' && <div className="flex flex-wrap gap-2">{['Başvuru', 'Onay', 'Red', 'Revizyon', 'Oylama', 'Kazandı', 'Tamamlandı', 'CRM'].map(item => <span key={item} className="rounded-full bg-white px-4 py-2 text-sm font-black text-mugla-navy/60">{item}</span>)}</div>}

          {(notificationTab === 'Taslaklar' || notificationTab === 'Gönderilmişler' || notificationTab === 'İstatistikler') && <div className="overflow-x-auto rounded-2xl border border-mugla-navy/10 bg-white">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-mugla-sand/60 text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="p-3">Başlık</th><th>Kime</th><th>Kanal</th><th>Tarih</th><th>Durum</th><th>Açılma</th><th className="text-right">İşlem</th></tr></thead>
              <tbody>{notificationScope.filter(item => notificationTab === 'Taslaklar' ? item.status === 'Taslak' : notificationTab === 'Gönderilmişler' ? item.status === 'Gönderildi' : true).length ? notificationScope.filter(item => notificationTab === 'Taslaklar' ? item.status === 'Taslak' : notificationTab === 'Gönderilmişler' ? item.status === 'Gönderildi' : true).map(item => <tr key={item.id} className="border-t border-mugla-navy/10">
                <td className="p-3 font-bold">{item.title}</td>
                <td>{item.segment}</td>
                <td>{item.channels.join(', ')}</td>
                <td>{new Date(item.createdAt).toLocaleString('tr-TR')}</td>
                <td><span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-bold text-mugla-navy/60">{item.status}</span></td>
                <td>%{item.status === 'Gönderildi' ? 81 : 0}</td>
                <td className="text-right">{canDeleteNotification ? <button type="button" className={tableAction}><Trash2 size={14}/> Sil</button> : '-'}</td>
              </tr>) : <tr><td colSpan={7} className="p-8 text-center text-mugla-navy/45">Bu görünümde bildirim yok.</td></tr>}</tbody>
            </table>
          </div>}

          {isSuperAdmin && <div className="rounded-2xl border border-mugla-cyan/25 bg-cyan-50/35 p-4">
            <h3 className="font-black">Super Admin entegrasyonları</h3>
            <div className="mt-3 flex flex-wrap gap-2">{['SMTP', 'SMS API', 'Firebase', 'OneSignal', 'Mail Şablonları', 'Webhook', 'Bildirim Logları'].map(item => <span key={item} className="rounded-full bg-white px-3 py-2 text-xs font-black text-mugla-navy/60">{item}</span>)}</div>
          </div>}
        </CardContent>
      </Card>}

      {canSeeReports && <Card id="raporlar">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-mugla-cyan">RAPOR MERKEZİ</p>
              <h2 className="text-xl font-bold">Rol bazlı rapor oluştur</h2>
              <p className="mt-1 max-w-3xl text-sm text-mugla-navy/55">Raporlar yetki kapsamına göre ayrılır. Vatandaş verisi KVKK gereği yalnızca sınırlı ve gerekli rollerde görünür; CSV toplu veri aktarımı sadece super admin içindir.</p>
            </div>
            <span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-bold text-mugla-navy/55">{activeRole} kapsamı</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="grid gap-5 rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-5 lg:grid-cols-[1.1fr_.7fr_.8fr_.7fr_auto] lg:items-end">
            <fieldset>
              <legend className="mb-3 text-sm font-black">Rapor türü</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {reportTypes.map(([label, note]) => <label key={label} className="flex cursor-pointer items-start gap-3 rounded-xl border border-mugla-navy/10 bg-white p-3 text-sm">
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-mugla-orange" defaultChecked={label === reportTypes[0]?.[0]}/>
                  <span><b className="block">{label}</b><small className="mt-1 block leading-5 text-mugla-navy/45">{note}</small></span>
                </label>)}
              </div>
            </fieldset>
            <label><span className="mb-2 block text-sm font-semibold">İlçe</span><select className={field}>{reportDistrictOptions.map(item => <option key={item}>{item}</option>)}</select></label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label><span className="mb-2 block text-sm font-semibold">Başlangıç</span><input className={field} type="date" defaultValue={`${new Date().getFullYear()}-01-01`}/></label>
              <label><span className="mb-2 block text-sm font-semibold">Bitiş</span><input className={field} type="date" defaultValue={`${new Date().getFullYear()}-12-31`}/></label>
            </div>
            <fieldset>
              <legend className="mb-3 text-sm font-black">Format</legend>
              <div className="grid gap-2">
                {reportFormats.map(format => <label key={format.label} className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-sm ${format.enabled ? 'cursor-pointer border-mugla-navy/10 bg-white' : 'cursor-not-allowed border-mugla-navy/5 bg-white/55 text-mugla-navy/35'}`}>
                  <span className="inline-flex items-center gap-2"><input type="radio" name="reportFormat" disabled={!format.enabled} defaultChecked={format.enabled && format.label === 'PDF'} className="h-4 w-4 accent-mugla-orange"/><b>{format.label}</b></span>
                  <small>{format.note}</small>
                </label>)}
              </div>
            </fieldset>
            <Button type="button" variant="orange" className="h-12"><FileBarChart size={17}/> Rapor Oluştur</Button>
          </form>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Veri kapsamı', isSuperAdmin || isMunicipalityAdmin ? 'Tüm Muğla' : isDistrictManager ? adminUser?.district ?? 'Kendi ilçesi' : 'Atanan projeler'],
              ['Proje kaydı', scopedProjects.length.toLocaleString('tr-TR')],
              ['Oy verisi', scopedProjects.reduce((sum, project) => sum + project.votes, 0).toLocaleString('tr-TR')],
              ['Vatandaş görünümü', isSuperAdmin ? 'Tam' : isMunicipalityAdmin ? 'KVKK filtreli' : isDistrictManager ? 'Anonim özet' : 'Kapalı'],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-mugla-navy/10 bg-white p-4">
              <p className="text-sm text-mugla-navy/50">{label}</p>
              <b className="mt-1 block text-xl">{value}</b>
            </div>)}
          </div>

          <div className="rounded-2xl border border-mugla-navy/10 bg-white p-4">
            <h3 className="font-black">Yetki notları</h3>
            <div className="mt-3 grid gap-2 text-sm text-mugla-navy/60 md:grid-cols-2">
              {(isSuperAdmin ? ['Tüm ilçeler, oy istatistikleri, vatandaş analizleri, AI, audit, sistem ve CSV erişimi açıktır.', 'CSV toplu veri aktarımı sadece super admin seviyesinde tutulur.'] : isMunicipalityAdmin ? ['Belediye admini PDF ve Excel raporlarını tüm ilçe karşılaştırmaları için alabilir.', 'Vatandaş raporları KVKK filtreli gösterilir; CSV varsayılan olarak kapalıdır.'] : isDistrictManager ? ['İlçe yöneticisi sadece kendi ilçesinin oy, proje, kategori ve anonim vatandaş özetini görür.', 'Başka ilçelerin veya genel Muğla raporlarının verisi bu rolde açılmaz.'] : ['Değerlendirici yalnızca kendisine atanmış projelerin teknik, maliyet ve proje raporlarını görür.', 'Vatandaş, ilçe geneli ve toplu dışa aktarım bu rolde kapalıdır.']).map(note => <p key={note} className="rounded-xl bg-mugla-sand/55 p-3">{note}</p>)}
            </div>
          </div>
        </CardContent>
      </Card>}

      {canSeeDistricts && <Card id="ilceler">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-mugla-cyan">ILCE YONETIMI</p>
              <h2 className="mt-1 text-xl font-bold">{isDistrictManager || isDistrictStaff ? `${adminUser?.district ?? 'Ilce'} Dashboard` : '13 ilce anlik yonetim ekrani'}</h2>
              <p className="mt-1 max-w-3xl text-sm text-mugla-navy/55">Belediye kullanicilari yalnizca is akisi, proje, oy ve katilim bilgisini gorur. API, kod, token ve entegrasyon detaylari belediye personeline gosterilmez.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mugla-navy/35" size={17}/>
              <input value={districtSearch} onChange={event => setDistrictSearch(event.target.value)} placeholder="Ilce ara" className="w-full rounded-full border border-mugla-navy/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-mugla-cyan"/>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ['Ilce', districtScope.length.toLocaleString('tr-TR')],
              ['Toplam Proje', districtScopeProjects.length.toLocaleString('tr-TR')],
              ['Toplam Oy', districtScopeVotes.toLocaleString('tr-TR')],
              ['Aktif Oylama', districtScopeActiveVotes.toLocaleString('tr-TR')],
              ['Katilim', `%${districtScopeParticipation}`],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-mugla-navy/10 bg-white p-4 shadow-sm">
              <p className="text-sm text-mugla-navy/50">{label}</p>
              <b className="mt-1 block text-2xl">{value}</b>
            </div>)}
          </div>

          <div className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-4">
            <div className="flex flex-wrap items-center gap-2">
              {visibleDistrictDashboards.map(item => <Link key={item.slug} href={item.panelPath} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-black text-mugla-navy/65 shadow-sm hover:text-mugla-blue"><MapPin size={14}/>{item.name}</Link>)}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visibleDistrictDashboards.map((item) => {
              const districtProjects = projects.filter(project => project.district === item.name)
              const districtPending = districtProjects.filter(isPendingReviewProject).length
              const districtCompleted = districtProjects.filter(project => project.status === 'Tamamlandı').length
              const districtVotes = districtProjects.reduce((sum, project) => sum + project.votes, 0)
              const participation = Math.min(100, Math.round(districtVotes / Math.max(1, districtProjects.length * 120) * 100))
              const workloadTone = districtPending > 20 ? 'bg-red-500' : districtPending > 8 ? 'bg-yellow-400' : 'bg-green-500'
              const lastProject = [...districtProjects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
              return <div key={item.slug} className="relative flex min-h-72 flex-col justify-between overflow-hidden rounded-xl border border-mugla-navy/10 bg-white p-4 shadow-sm">
                <span className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${workloadTone}`}/>
                <div>
                  <span className="flex items-center justify-between gap-3">
                    <b className="inline-flex items-center gap-2"><MapPin size={17} className="text-mugla-orange"/>{item.name}</b>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-mugla-sand text-mugla-cyan"><LayoutDashboard size={18}/></span>
                  </span>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-mugla-navy/55">
                    <span><strong className="block text-lg text-mugla-navy">{districtProjects.length}</strong>Proje</span>
                    <span><strong className="block text-lg text-mugla-navy">{districtVotes.toLocaleString('tr-TR')}</strong>Oy</span>
                    <span><strong className="block text-lg text-mugla-navy">{districtPending}</strong>Bekleyen</span>
                    <span><strong className="block text-lg text-mugla-navy">{districtCompleted}</strong>Tamamlandi</span>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-mugla-navy/55"><span>Katilim</span><span>%{participation}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-mugla-navy/10"><span className="block h-full rounded-full bg-mugla-cyan" style={{width: `${participation}%`}}/></div>
                  </div>
                  <div className="mt-4 rounded-xl bg-mugla-sand/55 px-3 py-2 text-xs text-mugla-navy/60">
                    <b className="block text-mugla-navy">Son hareket</b>
                    {lastProject ? `${new Date(lastProject.createdAt).toLocaleString('tr-TR')} - ${lastProject.title}` : 'Henuz yeni hareket yok.'}
                  </div>
                </div>
                <Link href={item.panelPath} className="mt-4 flex items-center justify-center gap-2 rounded-full bg-mugla-navy px-4 py-2 text-sm font-semibold text-white hover:bg-mugla-blue"><ArrowUpRight size={15}/>{isDistrictManager || isDistrictStaff ? 'Dashboarda Git' : 'Yonet'}</Link>
              </div>
            })}
          </div>

          {isSuperAdmin && <div className="rounded-2xl border border-mugla-cyan/25 bg-cyan-50/35 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black">Sistem Yonetimi</h3>
                <p className="mt-1 text-sm text-mugla-navy/55">Bu teknik alan yalnizca Super Admin icindir. Belediye kullanicilari API, webhook, cache, log, token ve ilce kodlarini gormez.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-mugla-cyan">Super Admin</span>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {muglaDistrictDashboards.map(item => <div key={item.slug} className="rounded-xl bg-white p-3 text-xs text-mugla-navy/60">
                <b className="block text-sm text-mugla-navy">{item.name}</b>
                <span className="mt-2 block"><b>API:</b> {item.apiPath}</span>
                <span className="block"><b>Kod:</b> {item.accessCode}</span>
                <div className="mt-2 flex flex-wrap gap-2">{['Webhook', 'Database', 'Cache', 'Log', 'Token', 'Yetkiler'].map(label => <span key={label} className="rounded-full bg-mugla-sand px-2 py-1 font-bold">{label}</span>)}</div>
              </div>)}
            </div>
          </div>}
        </CardContent>
      </Card>}

      {canSeeVoting && <Card id="oylamalar">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-mugla-cyan">ROL BAZLI CANLI OYLAMA</p>
              <h2 className="mt-1 flex items-center gap-2 text-xl font-bold"><Trophy size={21} className="text-mugla-orange"/> Oylama liderleri</h2>
              <p className="mt-1 max-w-3xl text-sm text-mugla-navy/55">{isDistrictManager ? `${adminUser?.district ?? 'Kendi ilceniz'} kapsamindaki projeler listelenir.` : 'Yetkili roller icin karar destek amacli siralama, katilim ve oylama ozeti.'} Teknik komisyon, CRM ve vatandas ekranlarinda canli siralama acilmaz.</p>
            </div>
            {canManageVoting && <div className="flex flex-wrap gap-2">
              <Button variant="outline"><Clock3 size={16}/> Takvimi Yonet</Button>
              <Button variant="orange"><Vote size={16}/> Oylamayi Yonet</Button>
            </div>}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {canManageVoting && <section className="grid gap-3 md:grid-cols-4">
            {[
              ['Aktif Oylama', activeVotingRecords.length],
              ['Oylamadaki Proje', votingProjectCount],
              ['Toplam Oy', votingRecordsVoteTotal],
              ['Katılım', votingRecordsVoteTotal ? `${Math.min(100, Math.round(votingRecordsVoteTotal / Math.max(1, votingProjectCount * 120) * 100))}%` : '0%'],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-mugla-navy/10 bg-white p-4 shadow-sm"><p className="text-sm text-mugla-navy/50">{label}</p><b className="mt-1 block text-2xl">{value}</b></div>)}
          </section>}

          {canManageVoting && <section className="rounded-2xl border border-mugla-navy/10 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-black">Oylama taslakları ve süreçleri</h3>
              <Button variant="orange" onClick={() => {setVotingWizardOpen(true); setVotingWizardStep(1)}}><Plus size={17}/> Oylama Oluştur</Button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="pb-3">Oylama</th><th>Proje</th><th>İlçe</th><th>Tarih</th><th>Durum</th><th className="text-right">İşlem</th></tr></thead>
                <tbody>{votingRecords.length ? votingRecords.map(record => <tr key={record.id} className="border-t border-mugla-navy/10">
                  <td className="py-3 font-bold">{record.name}<span className="block text-xs font-normal text-mugla-navy/45">{record.description || 'Açıklama yok'}</span></td>
                  <td>{record.projectIds.length}</td>
                  <td>{record.districts.length === districts.length ? 'Muğla Geneli' : record.districts.join(', ')}</td>
                  <td>{record.startDate || '-'} / {record.endDate || '-'}</td>
                  <td><span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-black text-mugla-navy/60">{record.status}</span></td>
                  <td className="text-right"><div className="flex justify-end gap-1">
                    {record.status === 'Taslak' && <button type="button" className={tableAction} onClick={() => updateVotingStatus(record.id, 'Planlandı')}>Planla</button>}
                    {(record.status === 'Taslak' || record.status === 'Planlandı') && <button type="button" className={tableAction} onClick={() => updateVotingStatus(record.id, 'Aktif')}>Yayınla</button>}
                    {record.status === 'Aktif' && <button type="button" className={tableAction} onClick={() => updateVotingStatus(record.id, 'Tamamlandı')}>Bitir</button>}
                    {record.status === 'Tamamlandı' && <button type="button" className={tableAction} onClick={() => updateVotingStatus(record.id, 'Sonuçlandı')}>Sonuç Açıkla</button>}
                  </div></td>
                </tr>) : <tr><td colSpan={6} className="py-8 text-center text-mugla-navy/45">Henüz oylama taslağı yok. Sayaçlar sıfırdan başlayacak.</td></tr>}</tbody>
              </table>
            </div>
          </section>}

          <div className="grid gap-3 md:grid-cols-4">
            <label><span className="mb-2 block text-sm font-semibold">Ilce</span><select className={field} value={effectiveVoteDistrict} disabled={isDistrictManager} onChange={event => setVoteDistrictFilter(event.target.value)}><option value="">Tum ilceler</option>{voteDistrictOptions.map(item => <option key={item}>{item}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Kategori</span><select className={field} value={voteCategoryFilter} onChange={event => setVoteCategoryFilter(event.target.value)}><option value="">Tumu</option>{categories.map(([label]) => <option key={label}>{label}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Mahalle</span><select className={field} value={voteNeighborhoodFilter} onChange={event => setVoteNeighborhoodFilter(event.target.value)}><option value="">Tumu</option>{voteNeighborhoodOptions.map(item => <option key={item}>{item}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Donem</span><select className={field} value={votePeriodFilter} onChange={event => setVotePeriodFilter(event.target.value)}>{['2027','2026','2025'].map(item => <option key={item}>{item}</option>)}</select></label>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
            <div className="overflow-x-auto rounded-2xl border border-mugla-navy/10 bg-white">
              {voteLeaderboard.length ? <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-mugla-sand/60 text-xs uppercase tracking-wider text-mugla-navy/45">
                  <tr><th className="p-4">Sira</th><th>Proje</th><th>Ilce</th><th>Kategori</th><th>Durum</th><th className="text-right">Oy</th></tr>
                </thead>
                <tbody>{voteLeaderboard.map((project, index) => <tr key={project.id} onClick={() => canSeeVoteDetails && setManagedProjectId(project.id)} className="border-t border-mugla-navy/10 hover:bg-mugla-sand/45">
                  <td className="p-4"><span className="inline-grid h-8 w-8 place-items-center rounded-full bg-mugla-sand text-xs font-black text-mugla-navy/65">{index === 0 ? '1' : index === 1 ? '2' : index === 2 ? '3' : index + 1}</span></td>
                  <td className="font-semibold">{project.title}<span className="mt-1 block text-xs font-normal text-mugla-navy/45">{project.neighborhood || project.applicantDistrict || 'Mahalle ozeti yok'}</span></td>
                  <td>{project.district}</td>
                  <td><CategoryBadge label={projectCategoryLabel(project)} color={project.color}/></td>
                  <td><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{project.status}</span></td>
                  <td className="text-right text-lg font-black">{project.votes.toLocaleString('tr-TR')}</td>
                </tr>)}</tbody>
              </table> : <div className="py-12 text-center text-mugla-navy/50"><FolderKanban className="mx-auto mb-3"/><p className="font-semibold">Henüz oy verisi yok.</p><p className="mt-1 text-sm">Canlı sayaçlar vatandaş oyları geldikçe sıfırdan otomatik artar.</p></div>}
            </div>

            <aside className="space-y-3">
              {[
                ['Katilim', `%${participationRate}`],
                ['Toplam Oy', voteTotal.toLocaleString('tr-TR')],
                ['Aktif Secmen', activeVoterEstimate.toLocaleString('tr-TR')],
              ].map(([label, value]) => <div key={label} className="rounded-2xl border border-mugla-navy/10 bg-white p-4 shadow-sm">
                <p className="text-sm text-mugla-navy/50">{label}</p>
                <b className="mt-1 block text-2xl">{value}</b>
              </div>)}
              <div className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/55 p-4 text-sm leading-6 text-mugla-navy/60">
                <b className="text-mugla-navy">Gizlilik</b>
                <p className="mt-1">Vatandas isimleri ve kim kime oy verdi bilgisi bu ekranda gosterilmez.</p>
              </div>
            </aside>
          </div>

          {isSuperAdmin && <div className="rounded-2xl border border-mugla-cyan/25 bg-cyan-50/35 p-4">
            <h3 className="flex items-center gap-2 font-black"><ShieldCheck size={18} className="text-mugla-cyan"/> Super Admin guvenlik sekmeleri</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
              {[
                ['Canli Oy Akisi', Activity],
                ['Supheli Oylar', AlertTriangle],
                ['IP Analizi', Database],
                ['Bot Kontrolu', ShieldCheck],
                ['Loglar', FileText],
                ['AI Analizi', BarChart3],
              ].map(([label, Icon]) => {
                const IconComponent = Icon as LucideIcon
                return <button key={String(label)} type="button" className="flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-left text-xs font-black text-mugla-navy/65 shadow-sm hover:text-mugla-blue"><IconComponent size={16}/>{String(label)}</button>
              })}
            </div>
          </div>}
        </CardContent>
      </Card>}

      {false && canSeeProjects && <Card id="onay-kutusu">
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
              <Button size="sm" variant="outline" type="button" onClick={() => setMergeFormOpen(value => !value)} disabled={selectedMergeProjects.length < 2}><FolderKanban size={15}/> Manuel proje birleştir</Button>
              <Button size="sm" variant="orange" type="button" onClick={() => reviewMany(pendingProjects.map(project => project.id), 'Onaylandı')}><CheckCircle2 size={15}/> Tümünü onayla</Button>
              <Button size="sm" variant="outline" type="button" onClick={() => reviewMany(pendingProjects.map(project => project.id), 'Reddedildi')}><XCircle size={15}/> Tümünü reddet</Button>
            </div>
            {mergeSelection.length >= 2 && <p className="w-full text-xs font-semibold text-mugla-navy/55">{mergeSelection.length} başvuru seçildi. Aynı proje başvurularını tek kayıtta toplamak için Manuel proje birleştir butonunu kullanın.</p>}
          </div>}
          {selectedMergeProjects.length >= 2 && mergeFormOpen && <form onSubmit={submitMergedProject} className="grid gap-4 rounded-2xl border border-mugla-cyan/30 bg-cyan-50/40 p-4 md:grid-cols-2 xl:grid-cols-3">
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
            <div className="flex items-end gap-2"><Button type="submit" variant="orange"><CheckCircle2 size={16}/> Birleştir ve onayla</Button><Button type="button" variant="outline" onClick={() => {setMergeSelection([]); setMergeFormOpen(false)}}>Seçimi temizle</Button></div>
          </form>}

          {pendingProjects.length ? pendingProjects.map(project => <PendingProjectCard
            key={project.id}
            project={project}
            selected={mergeSelection.includes(project.id)}
            expanded={expandedProjectDetails === project.id}
            onToggleMerge={() => toggleMergeSelection(project.id)}
            onToggleDetails={() => setExpandedProjectDetails(value => value === project.id ? null : project.id)}
            onApprove={() => {approvePendingProject(project); setMergeSelection(value => value.filter(item => item !== project.id)); setExpandedProjectDetails(value => value === project.id ? null : value)}}
            onReject={() => {rejectPendingProject(project); setMergeSelection(value => value.filter(item => item !== project.id)); setExpandedProjectDetails(value => value === project.id ? null : value)}}
            onRevision={() => requestProjectRevision(project, 'Revizyon İstendi')}
            onMissingDocument={() => requestProjectRevision(project, 'Eksik Belge')}
            canReview={canReviewProjects}
          />) : <div className="py-12 text-center text-mugla-navy/50"><Clock3 className="mx-auto mb-3"/><p className="font-semibold">Onay bekleyen basvuru yok.</p></div>}
        </CardContent>
      </Card>}

      {canSeeProjects && <Card id="proje-havuzu">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-mugla-cyan">KALICI PROJE HAFIZASI</p>
              <h2 className="mt-1 text-xl font-bold">Proje Havuzu</h2>
              <p className="mt-1 max-w-3xl text-sm text-mugla-navy/55">Tüm başvurular tek havuzda tutulur; kayıtlar silinmez, yaşam döngüsü durumu değişir. Kalıcı silme yalnızca Super Admin için iki aşamalı doğrulamayla açıktır.</p>
            </div>
            {isSuperAdmin && <div className="flex flex-wrap gap-2">
              <Button variant="outline"><FileSpreadsheet size={16}/> Toplu Dışa Aktar</Button>
              <Button variant="outline"><ShieldCheck size={16}/> Veri Bütünlüğü</Button>
            </div>}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {projectPoolStages.map(stage => <button key={stage} type="button" onClick={() => setPoolStatusFilter(stage)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${poolStatusFilter === stage ? 'bg-mugla-navy text-white' : 'bg-white text-mugla-navy/60 hover:text-mugla-navy'}`}>{stage}<span className="ml-2 rounded-full bg-white/20 px-2">{stage === 'Tümü' ? scopedProjects.length : scopedProjects.filter(project => projectLifecycleLabel(project) === stage).length}</span></button>)}
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <label><span className="mb-2 block text-sm font-semibold">İlçe</span><select className={field} value={poolDistrictFilter} disabled={isDistrictManager} onChange={event => setPoolDistrictFilter(event.target.value)}><option value="">Tümü</option>{poolDistrictOptions.map(item => <option key={item}>{item}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Mahalle</span><select className={field} value={poolNeighborhoodFilter} onChange={event => setPoolNeighborhoodFilter(event.target.value)}><option value="">Tümü</option>{poolNeighborhoodOptions.map(item => <option key={item}>{item}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Kategori</span><select className={field} value={poolCategoryFilter} onChange={event => setPoolCategoryFilter(event.target.value)}><option value="">Tümü</option>{categories.map(([label]) => <option key={label}>{label}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Durum</span><select className={field} value={poolStatusFilter} onChange={event => setPoolStatusFilter(event.target.value)}>{projectPoolStages.map(item => <option key={item}>{item}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Tarih</span><input className={field} type="date"/></label>
            <label><span className="mb-2 block text-sm font-semibold">Anahtar kelime</span><input className={field} value={poolKeyword} onChange={event => setPoolKeyword(event.target.value)} placeholder="Proje adı veya kod"/></label>
          </div>

          {filteredPoolProjects.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPoolProjects.map(project => {
              const lifecycle = projectLifecycleLabel(project)
              const history = projectHistory(project)
              const last = history[history.length - 1]
              return <article key={project.id} className="overflow-hidden rounded-2xl border border-mugla-navy/10 bg-white shadow-sm">
                <div className="relative aspect-[16/8] bg-mugla-sand">
                  {project.image ? <img src={project.image.dataUrl} alt={project.title} className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-mugla-navy/35"><ImagePlus size={34}/></div>}
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-mugla-navy/65">{project.projectCode}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 font-black">{project.title}</h3>
                    <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-mugla-orange">{lifecycle}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-mugla-navy/55">
                    <span><b className="block text-mugla-navy">İlçe</b>{project.district}</span>
                    <span><b className="block text-mugla-navy">Mahalle</b>{project.neighborhood || project.applicantDistrict || '-'}</span>
                    <span><b className="block text-mugla-navy">Kategori</b>{projectCategoryLabel(project)}</span>
                    <span><b className="block text-mugla-navy">Son işlem</b>{last ? new Date(last.date).toLocaleDateString('tr-TR') : '-'}</span>
                  </div>
                  <button type="button" onClick={() => setManagedProjectId(project.id)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-mugla-navy px-4 py-2 text-sm font-bold text-white hover:bg-mugla-blue"><Eye size={15}/> Detay</button>
                </div>
              </article>
            })}
          </div> : <div className="py-14 text-center text-mugla-navy/50"><FolderKanban className="mx-auto mb-3"/><p className="font-semibold">Bu filtrelerde proje yok.</p><p className="mt-1 text-sm">Vatandaş başvuruları ve manuel kayıtlar burada kalıcı hafıza olarak tutulur.</p></div>}
        </CardContent>
      </Card>}

      {managedProject && <div className="fixed inset-0 z-50 bg-mugla-navy/35 backdrop-blur-[1px]" onClick={() => setManagedProjectId(null)}>
        <aside onClick={event => event.stopPropagation()} className="ml-auto h-full w-full max-w-3xl overflow-y-auto bg-mugla-sand p-4 shadow-2xl md:p-6">
          <div className="space-y-4">
            <ProjectManagementPanel
              project={managedProject}
              onClose={() => setManagedProjectId(null)}
              onImage={(file) => void uploadProjectImage(managedProject, file)}
              onRemoveImage={() => removeProjectImage(managedProject)}
              onSave={saveManagedProject}
              onApprove={() => approvePendingProject(managedProject)}
              onRevision={() => requestProjectRevision(managedProject, 'Revizyon İstendi')}
              onReject={() => rejectPendingProject(managedProject)}
              canEdit={canEditProjects}
              canReview={canReviewProjects}
            />

            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold">Proje detay sekmeleri</h2>
                <p className="text-sm text-mugla-navy/55">Bu detay ekranı proje havuzundaki tek kaydın farklı görünümleridir; proje başka tabloya taşınmaz.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {['Genel Bilgiler', 'Başvuru Belgeleri', 'Fotoğraflar', 'Teknik Değerlendirme', 'AI Analizi', 'Süreç Geçmişi', 'Vatandaş Bildirimleri'].map(item => <span key={item} className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-black text-mugla-navy/60">{item}</span>)}
                </div>
                <section className="rounded-2xl border border-mugla-navy/10 bg-white p-4">
                  <h3 className="font-black">Süreç Geçmişi</h3>
                  <div className="mt-4 space-y-3">
                    {projectHistory(managedProject).map(entry => <div key={entry.id} className="relative border-l-2 border-mugla-cyan/30 pl-4">
                      <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-mugla-cyan"/>
                      <p className="text-xs font-black text-mugla-cyan">{new Date(entry.date).toLocaleString('tr-TR')}</p>
                      <p className="mt-1 text-sm font-bold">{entry.action}</p>
                      <p className="text-xs text-mugla-navy/50">{entry.actor ?? 'Sistem'}{entry.note ? ` · ${entry.note}` : ''}</p>
                    </div>)}
                  </div>
                </section>
              </CardContent>
            </Card>

            {(canSendProjectsToVote || canArchiveProjects || canRestoreProjects || isDistrictManager || isEvaluator || isSuperAdmin) && <Card>
              <CardHeader><h2 className="text-xl font-bold">Proje havuzu işlemleri</h2><p className="text-sm text-mugla-navy/55">Durum değişiklikleri süreç geçmişine işlenir. Arşiv kayıtları havuzda korunur.</p></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {canSendProjectsToVote && <Button variant="orange" onClick={() => {reviewProject(managedProject.id, 'Onaylandı'); updateProjectWithHistory(managedProject, {workflowStatus: 'Yayında', status: 'Oylamada'}, 'Proje oylamaya gönderildi', managedProject.title); setMessage('Proje oylamaya açıldı.')}}><CheckCircle2 size={17}/> Oylamaya Gönder</Button>}
                {canSendProjectsToVote && <Button variant="outline" onClick={() => updateProjectWithHistory(managedProject, {workflowStatus: 'Oylamaya Hazır', status: 'İncelemede'}, 'Oylama tarihi planlandı', managedProject.title)}>Oylama Tarihini Belirle</Button>}
                {canSendProjectsToVote && <Button variant="outline" onClick={() => updateProjectWithHistory(managedProject, {workflowStatus: 'Kazandı', status: 'Yılın Kazanan Adayı'}, 'Kazanan ilan edildi', managedProject.title)}>Kazanan İlan Et</Button>}
                {(canReviewProjects || isEvaluator) && <Button variant="outline" onClick={() => requestProjectRevision(managedProject, 'Revizyon İstendi')}>Revizyon İste</Button>}
                {isEvaluator && <Button variant="outline" onClick={() => updateProjectWithHistory(managedProject, {}, 'Teknik komisyon önerisi: uygun', managedProject.title)}>Teknik Uygun</Button>}
                {isEvaluator && <Button variant="outline" onClick={() => updateProjectWithHistory(managedProject, {}, 'Teknik komisyon önerisi: uygun değil', managedProject.title)}>Teknik Uygun Değil</Button>}
                {canReviewProjects && <Button variant="outline" onClick={() => updateProjectWithHistory(managedProject, {workflowStatus: 'Muğla BB İncelemesinde', moderationStatus: 'Bekliyor'}, 'İlçeye geri gönderildi', managedProject.title)}>İlçeye Geri Gönder</Button>}
                {canSendProjectsToVote && <Button variant="outline" onClick={() => updateProjectWithHistory(managedProject, {workflowStatus: 'Tamamlandı', status: 'Tamamlandı'}, 'Proje tamamlandı', managedProject.title)}>Tamamlandı</Button>}
                {canArchiveProjects && projectLifecycleLabel(managedProject) !== 'Arşiv' && <Button variant="outline" onClick={() => archiveProject(managedProject)}>Arşive Taşı</Button>}
                {canRestoreProjects && projectLifecycleLabel(managedProject) === 'Arşiv' && <Button variant="outline" onClick={() => restoreProject(managedProject)}>Geri Yükle</Button>}
                {canPermanentDeleteProjects && <Button variant="outline" className="border-red-100 bg-red-50 text-red-700 hover:bg-red-100" onClick={() => deleteManagedProject(managedProject)}><Trash2 size={17}/> Kalıcı Sil</Button>}
              </CardContent>
            </Card>}
          </div>
        </aside>
      </div>}

      {votingWizardOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-mugla-navy/45 p-4 backdrop-blur-sm">
        <form onSubmit={submitVotingWizard} className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-black tracking-[.2em] text-mugla-cyan">OYLAMA OLUŞTURMA SİHİRBAZI</p><h2 className="mt-1 text-2xl font-black">Güvenli oylama taslağı oluştur</h2><p className="mt-1 text-sm text-mugla-navy/55">Oylama önce Taslak oluşur; yayınlanmadan vatandaş panelinde görünmez.</p></div>
            <button type="button" onClick={() => setVotingWizardOpen(false)} className="rounded-full bg-mugla-sand px-4 py-2 text-xs font-bold text-mugla-navy/60">Kapat</button>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">{[1,2,3,4,5].map(step => <button key={step} type="button" onClick={() => setVotingWizardStep(step)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${votingWizardStep === step ? 'bg-mugla-navy text-white' : 'bg-mugla-sand text-mugla-navy/60'}`}>Adım {step}</button>)}</div>

          {votingWizardStep === 1 && <section className="mt-5 grid gap-4 md:grid-cols-2">
            <label><span className="mb-2 block text-sm font-semibold">Oylama Adı</span><input className={field} name="name" required defaultValue="2027 Katılımcı Bütçe Oylaması"/></label>
            <label><span className="mb-2 block text-sm font-semibold">Oylama Yılı</span><select className={field} name="votingYear" value={votingYear} onChange={event => {setVotingYear(event.target.value); setSelectedVotingProjects([])}} required>{annualThemeYears.map(year => <option key={year} value={year}>{year}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Başlangıç Tarihi</span><input className={field} name="startDate" type="date" required/></label>
            <label className="md:col-span-2"><span className="mb-2 block text-sm font-semibold">Açıklama</span><textarea className={`${field} min-h-24`} name="description" placeholder="Oylama kapsamı ve duyuru metni"/></label>
            <label><span className="mb-2 block text-sm font-semibold">Bitiş Tarihi</span><input className={field} name="endDate" type="date" required/></label>
            <div className="md:col-span-2 rounded-2xl bg-mugla-sand/60 p-4 text-sm text-mugla-navy/60"><b className="block text-mugla-navy">{votingYear} açık tema kategorileri</b><div className="mt-2 flex flex-wrap gap-2">{votingAllowedCategories.map(item => <span key={item[0]} className="rounded-full bg-white px-3 py-1 text-xs font-black text-mugla-navy/65">{item[0]}</span>)}</div><p className="mt-2">Oylamaya alınabilecek proje listesi yalnızca bu kategorilerdeki onaylı projelerden oluşur.</p></div>
            <fieldset className="md:col-span-2"><legend className="mb-2 text-sm font-black">İlçeler</legend><div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">{districts.map(item => <label key={item} className="rounded-xl bg-mugla-sand/55 p-3 text-sm font-bold"><input type="checkbox" name="districts" value={item} defaultChecked className="mr-2 accent-mugla-orange"/>{item}</label>)}</div></fieldset>
          </section>}

          {votingWizardStep === 2 && <section className="mt-5 space-y-4">
            <div className="grid gap-3 md:grid-cols-4"><select className={field}><option>İlçe</option>{districts.map(item => <option key={item}>{item}</option>)}</select><select className={field}><option>Kategori</option>{votingAllowedCategories.map(item => <option key={item[0]}>{item[0]}</option>)}</select><input className={field} placeholder="Mahalle"/><input className={field} placeholder={`${votingYear} tema kapsamı`}/></div>
            <div className="grid gap-3 md:grid-cols-2">{approvedVotingCandidates.length ? approvedVotingCandidates.map(project => <label key={project.id} className="flex items-start gap-3 rounded-2xl border border-mugla-navy/10 bg-white p-4"><input type="checkbox" checked={selectedVotingProjects.includes(project.id)} onChange={() => toggleVotingProject(project.id)} className="mt-1 h-4 w-4 accent-mugla-orange"/><span><b className="block">{project.title}</b><small className="mt-1 block text-mugla-navy/50">{project.district} · {projectCategoryLabel(project)} · {formatBudget(project.budget)}</small></span></label>) : <div className="rounded-2xl bg-mugla-sand p-6 text-center text-mugla-navy/50 md:col-span-2">{votingYear} yılı açık tema kategorilerinde onaylı proje yok.</div>}</div>
          </section>}

          {votingWizardStep === 3 && <section className="mt-5 grid gap-4 md:grid-cols-2">
            <fieldset className="rounded-2xl bg-mugla-sand/55 p-4"><legend className="mb-3 text-sm font-black">Bir kişi</legend>{[1,3,5].map(value => <label key={value} className="mr-4 text-sm font-bold"><input type="radio" name="votesPerPerson" value={value} defaultChecked={value === 5} className="mr-2 accent-mugla-orange"/>{value} oy</label>)}</fieldset>
            <fieldset className="rounded-2xl bg-mugla-sand/55 p-4"><legend className="mb-3 text-sm font-black">Güvenlik kuralları</legend>{['e-Devlet doğrulaması','Tek cihaz','Tek IP kontrolü','CAPTCHA','AI dolandırıcılık kontrolü'].map(rule => <label key={rule} className="mb-2 block text-sm font-bold"><input type="checkbox" name={rule} defaultChecked className="mr-2 accent-mugla-orange"/>{rule}</label>)}</fieldset>
          </section>}

          {votingWizardStep === 4 && <section className="mt-5 grid gap-3 md:grid-cols-5">
            {[['Toplam Proje', selectedVotingProjects.length], ['Toplam İlçe', districts.length], ['Tahmini Katılımcı', '650.000'], ['Toplam Oy', 0], ['Katılım', '0%']].map(([label, value]) => <div key={label} className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-4"><p className="text-sm text-mugla-navy/50">{label}</p><b className="mt-1 block text-2xl">{value}</b></div>)}
          </section>}

          {votingWizardStep === 5 && <section className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ['Başlangıç ve bitiş tarihi girilmiş mi?', true],
              ['En az 1 proje seçilmiş mi?', selectedVotingProjects.length > 0],
              ['Tüm seçilen projeler Onaylandı durumunda mı?', selectedVotingProjects.every(id => approvedVotingCandidates.some(project => project.id === id))],
              ['Her projenin kapak görseli var mı?', selectedVotingProjects.every(id => Boolean(projects.find(project => project.id === id)?.image))],
              ['Proje açıklamaları eksiksiz mi?', selectedVotingProjects.every(id => Boolean(projects.find(project => project.id === id)?.summary || projects.find(project => project.id === id)?.shortDescription))],
              ['Oylama kuralları belirlenmiş mi?', true],
            ].map(([label, ok]) => <div key={String(label)} className={`rounded-2xl p-4 text-sm font-black ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{ok ? '✓' : '×'} {String(label)}</div>)}
          </section>}

          <div className="mt-6 flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" disabled={votingWizardStep === 1} onClick={() => setVotingWizardStep(step => Math.max(1, step - 1))}>Geri</Button>
            {votingWizardStep < 5 ? <Button type="button" variant="orange" onClick={() => setVotingWizardStep(step => Math.min(5, step + 1))}>Devam</Button> : <Button type="submit" variant="orange" disabled={!selectedVotingProjects.length}><Vote size={17}/> Oylamayı Oluştur</Button>}
          </div>
        </form>
      </div>}

    </div>
  </AppShell></AdminAuthGate>
}

