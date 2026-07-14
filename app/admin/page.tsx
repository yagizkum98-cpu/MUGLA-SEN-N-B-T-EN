'use client'

import {FormEvent, useEffect, useState} from 'react'
import {motion} from 'framer-motion'
import {AppShell} from '@/components/app-shell'
import {AdminAuthGate} from '@/components/admin-auth-gate'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {CheckCircle2, Clock3, FolderKanban, Plus, ShieldCheck, Trash2, UserPlus, XCircle} from 'lucide-react'
import {formatBudget, ProjectStatus, useProjects} from '@/lib/projects-store'
import {addAdminAccount, getCurrentAdmin, listAdminAccounts, removeAdminAccount, type AdminAccount, type AdminRole} from '@/lib/admin-auth'

const districts = ['Bodrum', 'Dalaman', 'Datca', 'Fethiye', 'Kavaklidere', 'Koycegiz', 'Marmaris', 'Mentese', 'Milas', 'Ortaca', 'Seydikemer', 'Ula', 'Yatagan']
const categories = [['Ulasim', '#ef7d00'], ['Iklim ve Cevre', '#6a9d3b'], ['Sosyal Yasam', '#00a6c8'], ['Egitim', '#7c5bcc'], ['Diger', '#64748b']] as const
const statuses: ProjectStatus[] = ['Başvuru', 'İncelemede', 'Uygun', 'Oylamada', 'Yılın Kazanan Adayı', 'İhale Aşamasında', 'Devam Ediyor', 'Tamamlandı', 'Yapılamadı', 'Ertelendi']
const field = 'w-full rounded-xl border border-mugla-navy/15 bg-white px-4 py-3 outline-none focus:border-mugla-cyan'

const roles: {value: AdminRole; label: string; note: string}[] = [
  {value: 'super-admin', label: 'Super admin', note: 'Tum admin hesaplarini yonetir'},
  {value: 'admin', label: 'Admin', note: 'Proje ve yetkili hesaplarini yonetir'},
  {value: 'yetkili', label: 'Yetkili', note: 'Proje islemlerine erisir'},
]

export default function Admin() {
  const {projects, addProject, mergeProjects, removeProject, reviewProject} = useProjects()
  const [open, setOpen] = useState(false)
  const [peopleOpen, setPeopleOpen] = useState(true)
  const [message, setMessage] = useState('')
  const [adminUser, setAdminUser] = useState<AdminAccount | null>(null)
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [mergeSelection, setMergeSelection] = useState<string[]>([])
  const pendingProjects = projects.filter(project => project.moderationStatus === 'Bekliyor')
  const selectedMergeProjects = pendingProjects.filter(project => mergeSelection.includes(project.id))

  async function refreshAccounts() {
    const [current, nextAccounts] = await Promise.all([getCurrentAdmin(), listAdminAccounts()])
    setAdminUser(current)
    setAccounts(nextAccounts)
  }

  useEffect(() => {
    refreshAccounts()
  }, [])

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const category = String(form.get('category'))
    addProject({
      title: String(form.get('title')).trim(),
      district: String(form.get('district')),
      category,
      budget: Number(form.get('budget')),
      status: String(form.get('status')) as ProjectStatus,
      lat: Number(form.get('lat')) || 37.08,
      lng: Number(form.get('lng')) || 28.45,
      color: categories.find(item => item[0] === category)?.[1] ?? '#64748b',
      moderationStatus: 'Onaylandı',
    })
    event.currentTarget.reset()
    setOpen(false)
    setMessage('Proje kaydedildi.')
  }

  function toggleMergeSelection(id: string) {
    setMergeSelection(value => value.includes(id) ? value.filter(item => item !== id) : [...value, id])
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
      setMessage(`${project.title} birleştirilmiş proje olarak onaylandı ve oylamaya açıldı.`)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Projeler birleştirilemedi.')
    }
  }

  async function submitPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!adminUser) return
    const form = new FormData(event.currentTarget)
    try {
      await addAdminAccount({
        name: String(form.get('name')).trim(),
        email: String(form.get('email')).trim(),
        role: String(form.get('role')) as AdminRole,
        password: String(form.get('password')),
        actor: adminUser,
      })
      event.currentTarget.reset()
      setMessage('Yetkili hesap tanimlandi.')
      await refreshAccounts()
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Hesap tanimlanamadi.')
    }
  }

  async function deletePerson(id: string) {
    if (!adminUser) return
    try {
      await removeAdminAccount(id, adminUser)
      setMessage('Yetkili hesap silindi.')
      await refreshAccounts()
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Hesap silinemedi.')
    }
  }

  const stats = [
    ['Toplam proje', projects.length, 'Kayitli tum projeler', FolderKanban],
    ['Onay bekleyen', pendingProjects.length, 'Admin karari bekliyor', Clock3],
    ['Oylamada', projects.filter(p => !['Bekliyor', 'Reddedildi'].includes(String(p.moderationStatus)) && ['Oylamada', 'Yılın Kazanan Adayı'].includes(String(p.status))).length, 'Projeler sekmesinde', CheckCircle2],
    ['Yetkili kisi', accounts.length, 'Tanimli admin hesaplari', ShieldCheck],
  ] as const

  return <AdminAuthGate><AppShell role="admin">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-mugla-navy/10 bg-white px-6 py-5 lg:px-10">
      <div>
        <p className="text-xs font-bold tracking-[.2em] text-mugla-orange">YONETIM MERKEZI</p>
        <h1 className="text-2xl font-bold">Admin Paneli</h1>
        <p className="mt-1 text-sm text-mugla-navy/55">{adminUser ? `${adminUser.name} - ${adminUser.role}` : 'Yetki kontrol ediliyor'}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => setPeopleOpen(value => !value)}><UserPlus size={17}/>{peopleOpen ? 'Kisileri kapat' : 'Yetkili kisiler'}</Button>
        <Button variant="orange" onClick={() => setOpen(value => !value)}><Plus size={17}/>{open ? 'Formu kapat' : 'Manuel proje ekle'}</Button>
      </div>
    </header>

    <div className="space-y-7 p-6 lg:p-10">
      {message && <div className="rounded-2xl bg-green-50 px-5 py-4 text-sm font-semibold text-green-800">{message}</div>}

      {peopleOpen && <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Yetkili kisiler</h2>
          <p className="text-sm text-mugla-navy/55">Sadece tanimli super admin, admin ve yetkili hesaplar admin paneline girebilir. Birden fazla yetkili kisi eklenebilir.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {adminUser?.role !== 'yetkili' && <form onSubmit={submitPerson} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label><span className="mb-2 block text-sm font-semibold">Ad Soyad</span><input className={field} name="name" required minLength={3}/></label>
            <label><span className="mb-2 block text-sm font-semibold">E-posta</span><input className={field} name="email" type="email" required/></label>
            <label><span className="mb-2 block text-sm font-semibold">Rol</span><select className={field} name="role" required>{roles.filter(role => adminUser?.role === 'super-admin' || role.value !== 'super-admin').map(role => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Gecici sifre</span><input className={field} name="password" type="password" required minLength={8}/></label>
            <div className="md:col-span-2 xl:col-span-4"><Button type="submit" variant="orange"><UserPlus size={17}/> Yetkili tanimla</Button></div>
          </form>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="pb-3">Kisi</th><th>E-posta</th><th>Rol</th><th>Tanimlayan</th><th className="text-right">Islem</th></tr></thead>
              <tbody>{accounts.map(account => <tr key={account.id} className="border-t border-mugla-navy/10">
                <td className="py-4 font-semibold">{account.name}</td>
                <td>{account.email}</td>
                <td><span className="inline-flex items-center gap-2 rounded-full bg-mugla-sand px-3 py-1 text-xs font-bold text-mugla-navy/65"><ShieldCheck size={13}/>{account.role}</span></td>
                <td className="text-mugla-navy/45">{account.createdBy ?? 'sistem'}</td>
                <td className="text-right">{adminUser?.role === 'super-admin' && account.role !== 'super-admin' && account.id !== adminUser.id ? <button aria-label={`${account.name} hesabini sil`} className="rounded-full p-2 text-red-600 hover:bg-red-50" onClick={() => deletePerson(account.id)}><Trash2 size={17}/></button> : <span className="text-xs text-mugla-navy/35">-</span>}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>}

      {open && <Card>
        <CardHeader><h2 className="text-xl font-bold">Yeni proje kaydi</h2><p className="text-sm text-mugla-navy/55">Kaydedilen proje dogrudan onayli olarak proje listesine yansir.</p></CardHeader>
        <CardContent><form onSubmit={submitProject} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-sm font-semibold">Proje adi</span><input className={field} name="title" required/></label>
          <label><span className="mb-2 block text-sm font-semibold">Ilce</span><select className={field} name="district" required>{districts.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-semibold">Kategori</span><select className={field} name="category" required>{categories.map(([x]) => <option key={x}>{x}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-semibold">Durum</span><select className={field} name="status" required>{statuses.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-semibold">Butce (TL)</span><input className={field} name="budget" type="number" min="0" step="1" required/></label>
          <label><span className="mb-2 block text-sm font-semibold">Enlem</span><input className={field} name="lat" type="number" step="any" placeholder="37.08"/></label>
          <label><span className="mb-2 block text-sm font-semibold">Boylam</span><input className={field} name="lng" type="number" step="any" placeholder="28.45"/></label>
          <div className="md:col-span-2 xl:col-span-3"><Button type="submit" variant="orange">Projeyi kaydet</Button></div>
        </form></CardContent>
      </Card>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, note, Icon], i) => <motion.div initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{delay: i * .07}} key={label}><Card><CardContent className="pt-6"><Icon className="mb-5 text-mugla-cyan"/><p className="text-sm text-mugla-navy/55">{label}</p><p className="text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-mugla-orange">{note}</p></CardContent></Card></motion.div>)}</section>

      <Card>
        <CardHeader><h2 className="text-xl font-bold">Onay bekleyen basvurular</h2><p className="text-sm text-mugla-navy/55">Onaylanan projeler proje listesinde oylamaya acilir.</p></CardHeader>
        <CardContent className="space-y-4">
          {selectedMergeProjects.length >= 2 && <form onSubmit={submitMergedProject} className="grid gap-4 rounded-2xl border border-mugla-cyan/30 bg-cyan-50/40 p-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-3">
              <p className="text-xs font-bold tracking-[.18em] text-mugla-cyan">BIRLESTIRILMIS PROJE</p>
              <h3 className="mt-1 text-lg font-bold">{selectedMergeProjects.length} benzer basvuru tek projeye donusturulecek.</h3>
              <p className="mt-1 text-sm text-mugla-navy/55">Kaynak basvurular pasif hale gelir; olusturulan ortak proje onayli olarak oylamaya acilir.</p>
            </div>
            <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-sm font-semibold">Birleştirilmiş proje adı</span><input className={field} name="title" required defaultValue={selectedMergeProjects[0]?.title ?? ''}/></label>
            <label><span className="mb-2 block text-sm font-semibold">Ilce</span><select className={field} name="district" required defaultValue={selectedMergeProjects[0]?.district}>{districts.map(x => <option key={x}>{x}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Kategori</span><select className={field} name="category" required defaultValue={selectedMergeProjects[0]?.category}>{categories.map(([x]) => <option key={x}>{x}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-semibold">Tahmini butce (TL)</span><input className={field} name="budget" type="number" min="0" step="1" required defaultValue={selectedMergeProjects.reduce((sum, project) => sum + project.budget, 0)}/></label>
            <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-sm font-semibold">Amaç</span><textarea className={`${field} min-h-24`} name="purpose" defaultValue={selectedMergeProjects.map(project => project.purpose).filter(Boolean).join('\n\n')} required/></label>
            <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-sm font-semibold">Birleştirilmiş açıklama</span><textarea className={`${field} min-h-32`} name="summary" defaultValue={selectedMergeProjects.map(project => project.summary).filter(Boolean).join('\n\n')} required/></label>
            <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-sm font-semibold">Birleştirme gerekçesi</span><textarea className={`${field} min-h-24`} name="mergeNote" placeholder="Aynı mahalle, aynı ihtiyaç veya aynı uygulama konusu nedeniyle birleştirildi." required/></label>
            <label><span className="mb-2 block text-sm font-semibold">Enlem</span><input className={field} name="lat" type="number" step="any" placeholder="37.08"/></label>
            <label><span className="mb-2 block text-sm font-semibold">Boylam</span><input className={field} name="lng" type="number" step="any" placeholder="28.45"/></label>
            <div className="flex items-end gap-2"><Button type="submit" variant="orange"><CheckCircle2 size={16}/> Birleştir ve onayla</Button><Button type="button" variant="outline" onClick={() => setMergeSelection([])}>Seçimi temizle</Button></div>
          </form>}

          {pendingProjects.length ? pendingProjects.map(project => <div key={project.id} className="rounded-2xl border border-mugla-navy/10 p-4"><div className="flex flex-wrap items-start justify-between gap-4"><label className="flex min-w-0 flex-1 items-start gap-3"><input type="checkbox" className="mt-1 h-4 w-4 accent-mugla-orange" checked={mergeSelection.includes(project.id)} onChange={() => toggleMergeSelection(project.id)} /><span className="min-w-0"><p className="font-bold">{project.title}</p><p className="mt-1 text-sm text-mugla-navy/55">{project.district} - {project.category} - {formatBudget(project.budget)}</p>{project.summary && <p className="mt-3 max-w-3xl text-sm leading-6 text-mugla-navy/65">{project.summary}</p>}</span></label><div className="flex shrink-0 gap-2"><Button size="sm" variant="orange" onClick={() => {reviewProject(project.id, 'Onaylandı'); setMergeSelection(value => value.filter(item => item !== project.id)); setMessage('Proje onaylandi ve oylamaya acildi.')}}><CheckCircle2 size={15}/>Onayla</Button><Button size="sm" variant="outline" onClick={() => {reviewProject(project.id, 'Reddedildi'); setMergeSelection(value => value.filter(item => item !== project.id)); setMessage('Proje reddedildi.')}}><XCircle size={15}/>Reddet</Button></div></div></div>) : <div className="py-12 text-center text-mugla-navy/50"><Clock3 className="mx-auto mb-3"/><p className="font-semibold">Onay bekleyen basvuru yok.</p></div>}
        </CardContent>
      </Card>

      <Card id="projeler">
        <CardHeader><h2 className="text-xl font-bold">Proje kayitlari</h2></CardHeader>
        <CardContent className="overflow-x-auto">{projects.length ? <table className="w-full min-w-[860px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="pb-4">Proje</th><th>Ilce</th><th>Butce</th><th>Durum</th><th>Onay</th><th className="text-right">Islem</th></tr></thead><tbody>{projects.map(project => <tr key={project.id} className="border-t border-mugla-navy/10"><td className="py-4 font-semibold">{project.title}</td><td>{project.district}</td><td>{formatBudget(project.budget)}</td><td><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-mugla-orange">{project.status}</span></td><td><span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-semibold text-mugla-navy/65">{project.moderationStatus}</span></td><td className="text-right"><button aria-label={`${project.title} projesini sil`} className="rounded-full p-2 text-red-600 hover:bg-red-50" onClick={() => removeProject(project.id)}><Trash2 size={17}/></button></td></tr>)}</tbody></table> : <div className="py-14 text-center text-mugla-navy/50"><FolderKanban className="mx-auto mb-3"/><p className="font-semibold">Henuz proje girilmedi.</p><p className="mt-1 text-sm">Ilk kayitla birlikte sayaclar otomatik artar.</p></div>}</CardContent>
      </Card>
    </div>
  </AppShell></AdminAuthGate>
}
