'use client'

import Link from 'next/link'
import {FormEvent, useEffect, useMemo, useState} from 'react'
import {ArrowUpRight, Bell, Camera, CheckCircle2, FileBarChart, FileText, Home, KeyRound, Lightbulb, LockKeyhole, LogOut, Minus, Phone, Plus, ShieldCheck, ShoppingCart, Trophy, UserRound, Vote} from 'lucide-react'
import {AppShell} from '@/components/app-shell'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {changeCurrentUserPassword, consumeCitizenSessionTransfer, getCurrentUser, logoutUser, updateCurrentUserProfile, type LocalUser} from '@/lib/local-auth'
import {formatBudget, useProjects} from '@/lib/projects-store'
import {useVoteBasket, VOTE_CREDIT_LIMIT} from '@/lib/vote-basket'

function Metric({label, value, note, icon: Icon}: {label: string; value: string; note: string; icon: typeof UserRound}) {
  return <Card><CardContent className="flex min-h-28 items-center gap-4 pt-6"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mugla-navy text-white"><Icon size={22}/></span><div className="min-w-0"><p className="text-sm text-mugla-navy/55">{label}</p><b className="mt-1 block break-words text-2xl">{value}</b><p className="mt-1 text-xs text-mugla-navy/45">{note}</p></div></CardContent></Card>
}

function CategoryBadge({label, color}: {label: string; color: string}) {
  return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-black" style={{backgroundColor: `${color}18`, borderColor: `${color}55`, color}}>{label}</span>
}

function projectCategoryLabel(project: {category: string; customTheme?: string}) {
  return project.category === 'Diğer' && project.customTheme ? `Diğer: ${project.customTheme}` : project.category
}

function userInitials(name: string) {
  return name.split(' ').filter(Boolean).map(part => part[0]).slice(0, 2).join('').toLocaleUpperCase('tr') || 'V'
}

function votingPeriodStarted(date = new Date()) {
  return date.getTime() >= new Date('2026-05-01T00:00:00+03:00').getTime()
}

function projectVotingSubmissionLabel(project: {moderationStatus: string; status: string; workflowStatus?: string}) {
  if (project.moderationStatus === 'Reddedildi' || project.workflowStatus === 'Reddedildi') return 'Kabul edilmedi'
  if (project.moderationStatus === 'Bekliyor') return 'İncelemede'
  if (['Oylamada', 'Yılın Kazanan Adayı'].includes(String(project.status)) || project.workflowStatus === 'Yayında') return 'Oylamaya sunuldu'
  if (project.workflowStatus === 'Oylamaya Sunulmadı' || votingPeriodStarted()) return 'Oylamaya kabul edilmedi'
  return 'Değerlendirme sürüyor'
}

function votingSubmissionClass(label: string) {
  if (label === 'Oylamaya sunuldu') return 'bg-green-50 text-green-700'
  if (label === 'Oylamaya kabul edilmedi') return 'bg-slate-100 text-slate-700'
  if (label === 'Kabul edilmedi') return 'bg-red-50 text-red-700'
  return 'bg-orange-50 text-mugla-orange'
}

const citizenWorkflowSteps = ['Ön İnceleme', 'Teknik İnceleme', 'Oylamada', 'Kazandı', 'Uygulanıyor', 'Tamamlandı'] as const

function citizenProjectStage(project: {moderationStatus: string; status: string; workflowStatus?: string}) {
  const workflow = String(project.workflowStatus ?? '')
  const status = String(project.status ?? '')
  if (project.moderationStatus === 'Reddedildi' || workflow === 'Reddedildi') return 'Kabul edilmedi'
  if (workflow.includes('Revizyon') || workflow.includes('Eksik')) return 'Revizyon'
  if (workflow.includes('Tamam') || status.includes('Tamam')) return 'Tamamlandı'
  if (workflow.includes('Uygulan') || status.includes('Devam')) return 'Uygulanıyor'
  if (workflow.includes('Kazand') || status.includes('Kazanan')) return 'Kazandı'
  if (status.includes('Oylamada') || workflow.includes('Yay')) return 'Oylamada'
  if (project.moderationStatus === 'Onaylandı' || workflow.includes('İnceleme')) return 'Teknik İnceleme'
  return 'Ön İnceleme'
}

function workflowStepClass(projectStage: string, step: string) {
  const currentIndex = citizenWorkflowSteps.indexOf(projectStage as typeof citizenWorkflowSteps[number])
  const stepIndex = citizenWorkflowSteps.indexOf(step as typeof citizenWorkflowSteps[number])
  if (projectStage === 'Kabul edilmedi') return 'bg-red-50 text-red-700'
  if (projectStage === 'Revizyon') return stepIndex === 1 ? 'bg-orange-50 text-mugla-orange' : 'bg-mugla-sand text-mugla-navy/35'
  return stepIndex <= currentIndex ? 'bg-green-50 text-green-700' : 'bg-mugla-sand text-mugla-navy/35'
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Avatar okunamadı.'))
    reader.readAsDataURL(file)
  })
}

export function CitizenDashboard() {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [message, setMessage] = useState('')
  const {projects, voteProject} = useProjects()
  const {basket, confirmed, remaining, add, remove, confirm} = useVoteBasket(user?.id)
  const [profileTab, setProfileTab] = useState<'profile' | 'security' | 'preferences'>('profile')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (consumeCitizenSessionTransfer(params.get('auth_transfer'))) {
      params.delete('auth_transfer')
      window.history.replaceState(null, '', `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}${location.hash || '#panelim'}`)
    }
    const current = getCurrentUser()
    if (!current) {
      location.replace('/giris?next=/vatandas/panel')
      return
    }
    setUser(current)
    if (!window.location.hash) {
      window.history.replaceState(null, '', '/vatandas/panel#panelim')
      window.scrollTo({top: 0})
    }
  }, [])

  const myProjects = useMemo(() => user ? projects.filter(project => project.ownerId === user.id || project.ownerEmail === user.email) : [], [projects, user])
  const districtProjects = useMemo(() => user ? projects.filter(project => project.district === user.district && !['Bekliyor', 'Reddedildi'].includes(String(project.moderationStatus))) : [], [projects, user])
  const activeVoteProjects = useMemo(() => projects.filter(project => !['Bekliyor', 'Reddedildi'].includes(String(project.moderationStatus)) && ['Oylamada', 'Yılın Kazanan Adayı'].includes(String(project.status))), [projects])
  const basketProjects = useMemo(() => activeVoteProjects.filter(project => basket.includes(project.id)), [activeVoteProjects, basket])
  const confirmedProjects = useMemo(() => projects.filter(project => confirmed.includes(project.id)), [projects, confirmed])
  const totalVotes = myProjects.reduce((sum, project) => sum + project.votes, 0)
  const active = myProjects.filter(project => !['Bekliyor', 'Reddedildi'].includes(String(project.moderationStatus)) && ['Oylamada', 'Yılın Kazanan Adayı'].includes(String(project.status)))
  const pending = myProjects.filter(project => project.moderationStatus === 'Bekliyor' || String(project.status).startsWith('Ba'))
  const profileTabs = [
    {value: 'profile', label: 'Profil bilgileri', icon: UserRound},
    {value: 'security', label: 'Şifre ve güvenlik', icon: LockKeyhole},
    {value: 'preferences', label: 'Diğer ayarlar', icon: Bell},
  ] as const

  const quickActions = [
    {label: 'Anasayfa', href: '/', icon: Home, note: 'Kamuya açık ana sayfa'},
    {label: 'Fikir Gönder', href: '/fikir-gonder', icon: Lightbulb, note: 'En fazla 3 tıklamayla başvuru'},
    {label: 'Oy Ver', href: '/projeler#oy-ver', icon: Vote, note: `${activeVoteProjects.length} proje oylamada`},
    {label: 'Sonuçlar', href: '/projeler#sonuclar', icon: Trophy, note: 'Kazanan projeler'},
    {label: 'Projelerim', href: '#oylar', icon: FileText, note: `${myProjects.length} başvuru`},
  ] as const
  const citizenNotifications = myProjects.slice(0, 4).map(project => {
    const stage = citizenProjectStage(project)
    const title = stage === 'Revizyon' ? 'Revizyon istendi' : stage === 'Kabul edilmedi' ? 'Başvuru kabul edilmedi' : stage === 'Oylamada' ? 'Projeniz oylamaya açıldı' : stage === 'Kazandı' ? 'Projeniz kazandı' : stage === 'Tamamlandı' ? 'Proje tamamlandı' : 'Başvurunuz iş akışında'
    return {id: project.id, title, text: `${project.projectCode} - ${project.title}`, tone: stage === 'Kabul edilmedi' ? 'bg-red-50 text-red-700' : stage === 'Revizyon' ? 'bg-orange-50 text-mugla-orange' : 'bg-green-50 text-green-700'}
  })

  function signOut() {
    logoutUser()
    location.replace('/giris')
  }

  function addToBasket(id: string) {
    const result = add(id)
    setMessage(result.message)
  }

  function confirmVotes() {
    const selected = confirm(activeVoteProjects.map(project => project.id))
    selected.forEach(id => voteProject(id, 1))
    setMessage(selected.length ? `${selected.length} proje için oyunuz alındı.` : 'Onaylanacak uygun proje bulunmuyor.')
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const updated = updateCurrentUserProfile({
        name: String(form.get('name')),
        phone: String(form.get('phone')),
        province: String(form.get('province')),
        district: String(form.get('district')),
      })
      setUser(updated)
      setMessage('Profil bilgilerin güncellendi.')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Profil güncellenemedi.')
    }
  }

  async function updateAvatar(file: File | undefined) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Avatar için JPG, PNG veya WEBP dosyası seçin.')
      return
    }
    if (file.size > 1024 * 1024) {
      setMessage('Avatar dosyası en fazla 1 MB olabilir.')
      return
    }
    try {
      const avatarUrl = await fileToDataUrl(file)
      const updated = updateCurrentUserProfile({avatarUrl})
      setUser(updated)
      setMessage('Avatar resmin güncellendi.')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Avatar güncellenemedi.')
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const currentPassword = String(form.get('currentPassword'))
    const newPassword = String(form.get('newPassword'))
    const confirmPassword = String(form.get('confirmPassword'))
    if (newPassword !== confirmPassword) {
      setMessage('Yeni şifre tekrarı eşleşmiyor.')
      return
    }
    try {
      const updated = await changeCurrentUserPassword({currentPassword, newPassword})
      setUser(updated)
      formElement.reset()
      setMessage('Şifren güncellendi.')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Şifre güncellenemedi.')
    }
  }

  if (!user) return <main className="grid min-h-screen place-items-center bg-mugla-sand"><p className="font-semibold text-mugla-navy/55">Vatandaş oturumu kontrol ediliyor...</p></main>

  return <AppShell>
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-mugla-navy/10 bg-white px-6 py-5 lg:px-10">
      <div>
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <p className="mt-1 text-sm text-mugla-navy/55">{user.district} - {user.verifiedBadge}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/fikir-gonder"><Button variant="orange"><Lightbulb size={17}/> Fikir Gönder</Button></Link>
        <Button type="button" variant="outline" onClick={signOut}><LogOut size={17}/> Güvenli çıkış</Button>
      </div>
    </header>

    <div className="space-y-8 p-6 lg:p-10">
      <section id="panelim" className="scroll-mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Başvurularım" value={String(myProjects.length)} note={`${pending.length} başvuru inceleme bekliyor`} icon={FileText}/>
        <Metric label="Aktif fikirlerim" value={String(active.length)} note="Onaylanıp oylamaya açılanlar" icon={Vote}/>
        <Metric label="Toplam destek" value={totalVotes.toLocaleString('tr-TR')} note="Fikirlerime gelen oy" icon={ShieldCheck}/>
        <Metric label="Sepet kredim" value={`${remaining}/${VOTE_CREDIT_LIMIT}`} note={`${basket.length} proje sepette`} icon={ShoppingCart}/>
      </section>

      {message && <div className="rounded-2xl bg-green-50 px-5 py-4 text-sm font-semibold text-green-800">{message}</div>}

      <section className="grid gap-3 md:grid-cols-5">
        {quickActions.map(({label, href, icon: Icon, note}) => <Link key={label} href={href} className="group rounded-2xl border border-mugla-navy/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-mugla-orange">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-mugla-sand text-mugla-orange transition group-hover:bg-mugla-orange group-hover:text-white"><Icon size={20}/></span>
          <b className="mt-4 block text-sm">{label}</b>
          <small className="mt-1 block leading-5 text-mugla-navy/45">{note}</small>
        </Link>)}
      </section>

      <Card id="bildirimler">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-mugla-cyan">BİLDİRİMLER</p>
            <h2 className="mt-1 text-xl font-bold">Başvuru durumları</h2>
            <p className="mt-1 text-sm text-mugla-navy/55">Belediye panelindeki onay, revizyon, red ve oylama kararları burada görünür.</p>
          </div>
          <span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-black text-mugla-navy/55">{citizenNotifications.length} yeni</span>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {citizenNotifications.length ? citizenNotifications.map(item => <div key={item.id} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${item.tone}`}>
            <b className="block">{item.title}</b>
            <span className="mt-1 block opacity-75">{item.text}</span>
          </div>) : <div className="rounded-2xl border border-dashed border-mugla-navy/20 p-8 text-center text-mugla-navy/45 md:col-span-2"><Bell className="mx-auto mb-3"/><p className="font-semibold">Henüz bildiriminiz yok.</p></div>}
        </CardContent>
      </Card>

      <Card id="sepetim">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-mugla-cyan">SEPETİM</p>
            <h2 className="mt-1 text-xl font-bold">Oylama sepeti</h2>
            <p className="mt-1 text-sm text-mugla-navy/55">Toplam {VOTE_CREDIT_LIMIT} proje seçme krediniz vardır. Onayladığınızda seçili proje sayısı kadar kredi düşer ve oylarınız alınmış olur.</p>
          </div>
          <Link className="text-sm font-semibold text-mugla-blue" href="/projeler">Proje ekle <ArrowUpRight className="inline" size={15}/></Link>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="space-y-3">
            <div className="flex items-center justify-between"><h3 className="font-bold">Sepetteki projeler</h3><span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-bold text-mugla-navy/60">{basketProjects.length} seçim</span></div>
            {basketProjects.length ? basketProjects.map(project => <div key={project.id} className="fade-up-card flex flex-wrap items-center gap-3 rounded-2xl border border-mugla-navy/10 p-4"><span className="h-12 w-2 rounded-full" style={{background: project.color}}/><div className="min-w-0 flex-1"><p className="font-bold">{project.title}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-mugla-navy/50"><span>{project.district}</span><CategoryBadge label={projectCategoryLabel(project)} color={project.color}/></div></div><Button type="button" size="sm" variant="outline" onClick={() => remove(project.id)}><Minus size={15}/> Çıkar</Button></div>) : <div className="rounded-2xl border border-dashed border-mugla-navy/20 p-8 text-center text-mugla-navy/45"><ShoppingCart className="mx-auto mb-3"/><p className="font-semibold">Sepetiniz boş.</p><p className="mt-1 text-sm">Oylamadaki projelerden en fazla kalan krediniz kadar seçim yapabilirsiniz.</p></div>}
            <Button type="button" variant="orange" disabled={!basketProjects.length} onClick={confirmVotes} className="w-full"><CheckCircle2 size={17}/> Oylamayı onayla</Button>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between"><h3 className="font-bold">Oylamadaki projeler</h3><span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-bold text-mugla-navy/60">Kalan kredi {remaining}</span></div>
            {activeVoteProjects.length ? activeVoteProjects.map(project => {
              const selected = basket.includes(project.id)
              const done = confirmed.includes(project.id)
              return <div key={project.id} className="fade-up-card flex flex-wrap items-center gap-3 rounded-2xl border border-mugla-navy/10 p-4"><span className="h-12 w-2 rounded-full" style={{background: project.color}}/><div className="min-w-0 flex-1"><p className="font-bold">{project.title}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-mugla-navy/50"><span>{project.district}</span><CategoryBadge label={projectCategoryLabel(project)} color={project.color}/><span>{project.votes.toLocaleString('tr-TR')} destek</span></div></div>{done ? <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-bold text-green-700">Oy alındı</span> : selected ? <Button type="button" size="sm" variant="outline" onClick={() => remove(project.id)}><Minus size={15}/> Çıkar</Button> : <Button type="button" size="sm" variant="orange" disabled={basket.length >= remaining} onClick={() => addToBasket(project.id)}><Plus size={15}/> Ekle</Button>}</div>
            }) : <div className="rounded-2xl border border-dashed border-mugla-navy/20 p-8 text-center text-mugla-navy/45"><Vote className="mx-auto mb-3"/><p className="font-semibold">Oylamaya açık proje yok.</p></div>}
          </section>

          {confirmedProjects.length > 0 && <section className="xl:col-span-2"><h3 className="mb-3 font-bold">Onaylanan oylarım</h3><div className="grid gap-3 md:grid-cols-2">{confirmedProjects.map(project => <div key={project.id} className="rounded-2xl bg-mugla-sand p-4"><p className="font-bold">{project.title}</p><p className="mt-1 text-xs text-mugla-navy/50">{project.district} - oy alınmış</p></div>)}</div></section>}
        </CardContent>
      </Card>

      <Card id="profil">
        <CardHeader>
          <p className="text-xs font-bold tracking-widest text-mugla-cyan">PROFİL</p>
          <h2 className="text-xl font-bold">Profil ve hesap ayarları</h2>
          <p className="text-sm text-mugla-navy/55">İletişim, şifre ve bildirim tercihlerini tek alandan yönet.</p>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[260px_1fr]">
          <nav className="grid content-start gap-2">
            {profileTabs.map(({value, label, icon: Icon}) => <button key={value} type="button" onClick={() => setProfileTab(value)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold ${profileTab === value ? 'bg-mugla-navy text-white' : 'bg-mugla-sand text-mugla-navy/65 hover:text-mugla-navy'}`}><Icon size={17}/>{label}</button>)}
          </nav>

          {profileTab === 'profile' && <form onSubmit={submitProfile} className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-mugla-navy/10 bg-mugla-sand/60 p-4 md:col-span-2">
              <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-mugla-navy text-xl font-black text-white">
                {user.avatarUrl ? <img src={user.avatarUrl} alt={`${user.name} avatar`} className="h-full w-full object-cover"/> : userInitials(user.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">Avatar resmi</p>
                <p className="mt-1 text-sm text-mugla-navy/50">JPG, PNG veya WEBP yükleyebilirsin. En fazla 1 MB.</p>
              </div>
              <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-mugla-navy px-4 text-sm font-bold text-white">
                <Camera size={17}/> Resim seç
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => void updateAvatar(event.target.files?.[0])}/>
              </label>
              {user.avatarUrl && <Button type="button" variant="outline" onClick={() => {const updated = updateCurrentUserProfile({avatarUrl: ''}); setUser(updated); setMessage('Avatar resmi kaldırıldı.')}}>Kaldır</Button>}
            </div>
            <label><span className="mb-2 block text-sm font-semibold">Ad Soyad</span><input className="w-full rounded-xl border border-mugla-navy/15 bg-white px-4 py-3 outline-none focus:border-mugla-cyan" name="name" defaultValue={user.name} required minLength={3}/></label>
            <label><span className="mb-2 block text-sm font-semibold">Telefon numarası</span><input className="w-full rounded-xl border border-mugla-navy/15 bg-white px-4 py-3 outline-none focus:border-mugla-cyan" name="phone" type="tel" defaultValue={user.phone} required pattern="[0-9+() -]{10,20}"/></label>
            <label><span className="mb-2 block text-sm font-semibold">İl</span><input className="w-full rounded-xl border border-mugla-navy/15 bg-white px-4 py-3 outline-none focus:border-mugla-cyan" name="province" defaultValue={user.province} required/></label>
            <label><span className="mb-2 block text-sm font-semibold">İlçe</span><input className="w-full rounded-xl border border-mugla-navy/15 bg-white px-4 py-3 outline-none focus:border-mugla-cyan" name="district" defaultValue={user.district} required/></label>
            <div className="md:col-span-2"><Button type="submit" variant="orange"><Phone size={17}/> Profilimi güncelle</Button></div>
          </form>}

          {profileTab === 'security' && <form onSubmit={submitPassword} className="grid gap-4 md:grid-cols-3">
            <label><span className="mb-2 block text-sm font-semibold">Mevcut şifre</span><input className="w-full rounded-xl border border-mugla-navy/15 bg-white px-4 py-3 outline-none focus:border-mugla-cyan" name="currentPassword" type="password" required minLength={8}/></label>
            <label><span className="mb-2 block text-sm font-semibold">Yeni şifre</span><input className="w-full rounded-xl border border-mugla-navy/15 bg-white px-4 py-3 outline-none focus:border-mugla-cyan" name="newPassword" type="password" required minLength={8}/></label>
            <label><span className="mb-2 block text-sm font-semibold">Yeni şifre tekrar</span><input className="w-full rounded-xl border border-mugla-navy/15 bg-white px-4 py-3 outline-none focus:border-mugla-cyan" name="confirmPassword" type="password" required minLength={8}/></label>
            <div className="md:col-span-3"><Button type="submit" variant="orange"><KeyRound size={17}/> Şifremi güncelle</Button></div>
          </form>}

          {profileTab === 'preferences' && <section className="grid gap-4 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-2xl border border-mugla-navy/10 p-4"><input type="checkbox" defaultChecked className="mt-1 h-4 w-4 accent-mugla-orange"/><span><b className="block">Başvuru bildirimleri</b><small className="mt-1 block text-mugla-navy/50">Fikirlerimin onay ve durum değişimlerinden haberdar olmak istiyorum.</small></span></label>
            <label className="flex items-start gap-3 rounded-2xl border border-mugla-navy/10 p-4"><input type="checkbox" defaultChecked className="mt-1 h-4 w-4 accent-mugla-orange"/><span><b className="block">Oylama hatırlatmaları</b><small className="mt-1 block text-mugla-navy/50">Kredim ve sepetimde bekleyen projeler için hatırlatma alabilirim.</small></span></label>
            <div className="rounded-2xl bg-mugla-sand p-4 text-sm text-mugla-navy/60 md:col-span-2"><ShieldCheck className="mb-3 text-mugla-green"/><b className="text-mugla-navy">Doğrulama:</b> {user.verifiedBadge} - {user.verificationMethod}<br/><b className="text-mugla-navy">E-posta:</b> {user.email}</div>
          </section>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-xs font-bold tracking-widest text-mugla-cyan">SÜREÇ TAKİBİ</p>
          <h2 className="text-xl font-bold">Projelerim zaman çizelgesi</h2>
          <p className="text-sm text-mugla-navy/55">Başvuru, teknik değerlendirme, oylama, uygulama ve tamamlama adımları tek hatta izlenir.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {myProjects.length ? myProjects.slice(0, 3).map(project => {
            const stage = citizenProjectStage(project)
            return <section key={project.id} className="rounded-2xl border border-mugla-navy/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><b>{project.title}</b><p className="mt-1 text-xs font-semibold text-mugla-navy/45">{project.projectCode} - {stage}</p></div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${stage === 'Kabul edilmedi' ? 'bg-red-50 text-red-700' : stage === 'Revizyon' ? 'bg-orange-50 text-mugla-orange' : 'bg-green-50 text-green-700'}`}>{stage}</span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
                {citizenWorkflowSteps.map(step => <span key={step} className={`rounded-full px-3 py-2 text-center text-[11px] font-black ${workflowStepClass(stage, step)}`}>{step}</span>)}
              </div>
            </section>
          }) : <div className="rounded-2xl border border-dashed border-mugla-navy/20 p-8 text-center text-mugla-navy/45"><FileText className="mx-auto mb-3"/><p className="font-semibold">Zaman çizelgesi için önce fikir gönderin.</p></div>}
        </CardContent>
      </Card>

      <Card id="oylar"><CardHeader className="flex-row items-center justify-between"><div><p className="text-xs font-bold tracking-widest text-mugla-cyan">BAŞVURULARIM</p><h2 className="mt-1 text-xl font-bold">Kendi fikirlerim ve durumları</h2></div><Link className="text-sm font-semibold text-mugla-blue" href="/projeler">Projeleri gör <ArrowUpRight className="inline" size={15}/></Link></CardHeader><CardContent className="space-y-3">{myProjects.length ? myProjects.map(project => {
        const votingLabel = projectVotingSubmissionLabel(project)
        return <div key={project.id} className="fade-up-card flex flex-wrap items-center gap-4 rounded-2xl border border-mugla-navy/10 p-4"><span className="h-14 w-2 rounded-full" style={{background: project.color}}/><div className="min-w-0 flex-1"><p className="font-bold">{project.title}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-mugla-navy/50"><span className="rounded-full bg-mugla-sand px-2 py-0.5 font-black text-mugla-navy/65">{project.projectCode}</span><span>{project.district}</span><CategoryBadge label={projectCategoryLabel(project)} color={project.color}/><span className={`rounded-full px-2 py-0.5 font-black ${votingSubmissionClass(votingLabel)}`}>{votingLabel}</span></div></div><div className="grid grid-cols-2 gap-3 text-right text-sm"><span><b className="block">{project.votes}</b>destek</span><span><b className="block">{formatBudget(project.budget)}</b>bütçe</span></div></div>
      }) : <div className="py-14 text-center text-mugla-navy/45"><Lightbulb className="mx-auto mb-3"/><p className="font-semibold">Henüz fikir başvurunuz yok.</p><Link href="/fikir-gonder" className="mt-4 inline-flex"><Button variant="orange">İlk fikrimi gönder</Button></Link></div>}</CardContent></Card>
    </div>
  </AppShell>
}
