'use client'

import {FormEvent, useEffect, useMemo, useState} from 'react'
import {AppShell} from '@/components/app-shell'
import {AdminAuthGate} from '@/components/admin-auth-gate'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {type Channel, engagementScore, useCrm} from '@/lib/crm-store'
import {type ContactRecord, useContactRecords} from '@/lib/contact-store'
import {useCivicUpdates} from '@/lib/civic-updates'
import {getCurrentAdmin, normalizeAdminRole, type AdminAccount} from '@/lib/admin-auth'
import {ageGroup, ageGroups} from '@/lib/demographics'
import {writeAuditLog} from '@/lib/audit-log'
import {Activity, Bell, FileBarChart, FileText, LockKeyhole, Mail, Megaphone, Search, ShieldCheck, Trash2, UsersRound, type LucideIcon} from 'lucide-react'

const field = 'w-full rounded-xl border border-mugla-navy/15 bg-white px-4 py-3 outline-none focus:border-mugla-cyan'
const allowedCrmRoles = ['super-admin', 'belediye-admin', 'crm'] as const
const channels: Channel[] = ['Push', 'E-posta', 'SMS', 'WhatsApp']

function topicLabel(topic: ContactRecord['topic']) {
  return topic === 'Gorus' ? 'Gorus' : topic === 'Oneri' ? 'Oneri' : 'Soru'
}

function csvCell(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function distributionRows(items: string[]) {
  return Array.from(items.reduce((map, item) => map.set(item || 'Belirtilmedi', (map.get(item || 'Belirtilmedi') ?? 0) + 1), new Map<string, number>()).entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
}

export default function CrmPage() {
  const {citizens, campaigns, addCampaign} = useCrm()
  const {records: contactRecords, removeContactRecord} = useContactRecords()
  const {notifications, addNotification} = useCivicUpdates()
  const [adminUser, setAdminUser] = useState<AdminAccount | null>(null)
  const [checked, setChecked] = useState(false)
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const activeRole = normalizeAdminRole(adminUser?.role)
  const canEnterCrm = allowedCrmRoles.includes(activeRole as typeof allowedCrmRoles[number])
  const canSeeFullCitizenData = activeRole === 'super-admin' || activeRole === 'belediye-admin' || Boolean(adminUser?.permissions?.liveCitizenData)
  const canExportCitizenData = activeRole === 'super-admin' || activeRole === 'belediye-admin' || Boolean(adminUser?.permissions?.citizenDataExport)

  useEffect(() => {
    getCurrentAdmin().then(current => {
      setAdminUser(current)
      setChecked(true)
    })
  }, [])

  const filteredCitizens = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr')
    if (!needle) return citizens
    return citizens.filter(citizen => `${citizen.name} ${citizen.email} ${citizen.phone} ${citizen.province} ${citizen.district} ${citizen.country ?? ''}`.toLocaleLowerCase('tr').includes(needle))
  }, [citizens, query])

  const contactGroups = [
    ['Gorus', contactRecords.filter(record => record.topic === 'Gorus')],
    ['Oneri', contactRecords.filter(record => record.topic === 'Oneri')],
    ['Soru', contactRecords.filter(record => record.topic === 'Soru')],
  ] as const
  const ageDistribution = ageGroups.map(group => ({label: group, value: citizens.filter(citizen => ageGroup(Number(citizen.age)) === group).length}))
  const maxAgeGroup = Math.max(1, ...ageDistribution.map(item => item.value))
  const countryRows = distributionRows(citizens.map(citizen => citizen.country ?? 'Türkiye'))
  const districtRows = distributionRows(citizens.map(citizen => citizen.district))
  const activeCitizens = citizens.filter(citizen => citizen.lastLogin && Date.now() - new Date(citizen.lastLogin).getTime() < 30 * 86400000).length
  const crmNotifications = notifications.filter(item => item.category === 'CRM')
  const kpis: [string, number, LucideIcon, string][] = [
    ['Toplam vatandaş', citizens.length, UsersRound, 'text-mugla-cyan'],
    ['Aktif kullanıcı', activeCitizens, Activity, 'text-green-700'],
    ['İletişim talebi', contactRecords.length, Mail, 'text-mugla-orange'],
    ['CRM kampanyası', campaigns.length + crmNotifications.length, Megaphone, 'text-mugla-blue'],
  ]
  const campaignRows = [
    ...campaigns.map(item => ({id: item.id, title: item.title, note: `${item.segment} · ${item.channels.join(', ') || 'Kanal yok'} · ${item.status}`})),
    ...crmNotifications.map(item => ({id: item.id, title: item.title, note: `${item.targetRole} · ${item.channels.join(', ') || 'Kanal yok'} · ${item.status}`})),
  ]

  function exportCitizenDataExcel() {
    if (!canExportCitizenData) return
    const rows = citizens.map(citizen => ({
      ad_soyad: citizen.name,
      e_posta: citizen.email,
      telefon: citizen.phone,
      uyruk: citizen.nationality === 'foreign' ? 'Yabancı' : 'T.C.',
      ulke: citizen.country ?? 'Türkiye',
      il: citizen.province,
      ilce: citizen.district,
      yas: citizen.age,
      dogrulama: citizen.badges.join(', '),
      oy_sayisi: citizen.voteCount,
      proje_sayisi: citizen.proposalCount,
      kayit_tarihi: citizen.createdAt,
      son_giris: citizen.lastLogin,
    }))
    const headers = Object.keys(rows[0] ?? {ad_soyad: '', e_posta: '', telefon: '', uyruk: '', ulke: '', il: '', ilce: '', yas: '', dogrulama: '', oy_sayisi: '', proje_sayisi: '', kayit_tarihi: '', son_giris: ''})
    const csv = [headers.map(csvCell).join(','), ...rows.map(row => headers.map(header => csvCell(row[header as keyof typeof row])).join(','))].join('\n')
    const blob = new Blob([`\uFEFF${csv}`], {type: 'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `crm-vatandas-verisi-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    writeAuditLog(adminUser, 'CRM vatandas verisini Excel olarak disari aktardi', {details: `${citizens.length} kayit`})
  }

  function exportCitizenDataPdf() {
    if (!canExportCitizenData) return
    const rows = citizens.map(citizen => `<tr><td>${citizen.name}</td><td>${citizen.email}</td><td>${citizen.phone}</td><td>${citizen.province} / ${citizen.district}</td><td>${citizen.voteCount}</td><td>${citizen.proposalCount}</td><td>${new Date(citizen.createdAt).toLocaleString('tr-TR')}</td></tr>`).join('')
    const popup = window.open('', '_blank')
    if (!popup) {
      setMessage('PDF çıktısı için açılır pencereye izin verin.')
      return
    }
    popup.document.write(`<!doctype html><html><head><title>CRM Vatandaş Verisi</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#0e3a66}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}th,td{border:1px solid #d7dee8;padding:8px;text-align:left}th{background:#eef3f8}</style></head><body><h1>CRM Vatandaş Verisi</h1><p>Toplam kayıt: ${citizens.length} · Oluşturma: ${new Date().toLocaleString('tr-TR')}</p><table><thead><tr><th>Ad Soyad</th><th>E-posta</th><th>Telefon</th><th>Konum</th><th>Oy</th><th>Proje</th><th>Kayıt</th></tr></thead><tbody>${rows || '<tr><td colspan="7">Kayıt yok</td></tr>'}</tbody></table><script>window.print()</script></body></html>`)
    popup.document.close()
    writeAuditLog(adminUser, 'CRM vatandas verisini PDF olarak disari aktardi', {details: `${citizens.length} kayit`})
  }

  function submitCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const title = String(data.get('title') ?? '').trim()
    const body = String(data.get('body') ?? '').trim()
    const segment = String(data.get('segment') ?? 'Vatandaş')
    const selectedChannels = channels.filter(channel => data.get(channel))
    if (!title || !body) {
      setMessage('Kampanya başlığı ve mesajı zorunludur.')
      return
    }
    addCampaign({title, segment: `${segment} · ${body.slice(0, 80)}`, channels: selectedChannels.length ? selectedChannels : ['Push'], status: 'Taslak'})
    addNotification({
      title,
      body,
      district: '',
      targetRole: 'Vatandaş',
      category: 'CRM',
      priority: 'Bilgi',
      channels: selectedChannels.length ? selectedChannels : ['Push'],
      status: 'Taslak',
      source: 'Manuel',
      publishAt: new Date().toISOString(),
      createdBy: adminUser?.email,
    })
    form.reset()
    setMessage('CRM kampanyası taslak olarak kaydedildi.')
    writeAuditLog(adminUser, 'CRM kampanyasi olusturdu', {details: title})
  }

  if (!checked) return <AdminAuthGate><main className="grid min-h-screen place-items-center bg-mugla-sand p-6"><p className="font-semibold text-mugla-navy/55">CRM yetkisi kontrol ediliyor...</p></main></AdminAuthGate>

  if (!canEnterCrm) return <AdminAuthGate><main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-soft">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mugla-navy text-white"><LockKeyhole size={28}/></span>
      <p className="mt-6 text-xs font-bold tracking-[.2em] text-mugla-orange">CRM YETKISI GEREKLI</p>
      <h1 className="mt-2 text-3xl font-bold">Bu özel panele giriş yetkin yok.</h1>
      <p className="mt-3 leading-7 text-mugla-navy/55">CRM paneline sadece super admin, belediye admini ve super adminin tanımladığı CRM yetkilisi girebilir.</p>
    </section>
  </main></AdminAuthGate>

  return <AdminAuthGate><AppShell role="admin">
    <header className="border-b border-mugla-navy/10 bg-white px-6 py-5 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[.2em] text-mugla-orange">ÖZEL CRM PANELİ</p>
          <h1 className="text-2xl font-bold">Vatandaş İlişkileri ve Canlı Veri Merkezi</h1>
          <p className="mt-1 text-sm text-mugla-navy/55">Erişim: super admin, belediye admini ve CRM yetkilisi.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-black text-green-700"><ShieldCheck size={15}/> Rol doğrulandı</span>
      </div>
    </header>

    <main className="space-y-6 p-6 lg:p-10">
      {message && <div className="rounded-2xl bg-green-50 px-5 py-4 text-sm font-semibold text-green-800">{message}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value, Icon, color]) => <Card key={label}><CardContent className="pt-6"><Icon className={`mb-5 ${color}`} size={24}/><p className="text-sm text-mugla-navy/50">{label}</p><strong className="mt-1 block text-3xl">{value.toLocaleString('tr-TR')}</strong></CardContent></Card>)}
      </section>

      <section id="canli-veri" className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs font-bold tracking-widest text-mugla-cyan">CANLI VATANDAŞ VERİSİ</p><h2 className="text-xl font-bold">Kayıt ve giriş yapan vatandaşlar</h2></div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={!canExportCitizenData} onClick={exportCitizenDataExcel}><FileBarChart size={17}/> Excel</Button>
                <Button type="button" variant="outline" disabled={!canExportCitizenData} onClick={exportCitizenDataPdf}><FileText size={17}/> PDF</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canSeeFullCitizenData && <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-semibold text-mugla-orange">Bu hesap canlı kişisel veri detaylarını göremez. Yetkiyi super admin açabilir.</div>}
            {!canExportCitizenData && <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-semibold text-mugla-orange">Bu hesabın dışa aktarma yetkisi yok.</div>}
            <label className="flex items-center gap-2 rounded-xl border border-mugla-navy/15 bg-white px-4 py-3"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Ad, e-posta, telefon, ilçe veya ülke ara"/></label>
            <div className="overflow-x-auto rounded-xl border border-mugla-navy/10 bg-white">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="bg-mugla-sand/60 text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="p-3">Ad Soyad</th><th>E-posta</th><th>Telefon</th><th>Uyruk</th><th>Konum</th><th>Yaş</th><th>Doğrulama</th><th>Oy</th><th>Proje</th><th>Son giriş</th><th>Skor</th></tr></thead>
                <tbody>{filteredCitizens.length ? filteredCitizens.map(citizen => <tr key={citizen.id} className="border-t border-mugla-navy/10 hover:bg-mugla-sand/35">
                  <td className="p-3 font-semibold">{citizen.name}</td>
                  <td>{canSeeFullCitizenData ? citizen.email : 'Gizli'}</td>
                  <td>{canSeeFullCitizenData ? citizen.phone || '-' : 'Gizli'}</td>
                  <td>{citizen.nationality === 'foreign' ? `Yabancı${citizen.country ? ` · ${citizen.country}` : ''}` : 'T.C.'}</td>
                  <td>{citizen.province} / {citizen.district}</td>
                  <td>{citizen.age || '-'}</td>
                  <td><span className="rounded-lg bg-green-50 px-2 py-1 text-xs font-bold text-green-700">{citizen.badges.join(', ') || 'Bekliyor'}</span></td>
                  <td>{citizen.voteCount}</td>
                  <td>{citizen.proposalCount}</td>
                  <td>{citizen.lastLogin ? new Date(citizen.lastLogin).toLocaleString('tr-TR') : '-'}</td>
                  <td><b>{engagementScore(citizen)}</b></td>
                </tr>) : <tr><td colSpan={11} className="p-8 text-center text-mugla-navy/45">Henüz vatandaş verisi yok.</td></tr>}</tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card><CardHeader><p className="text-xs font-bold tracking-widest text-mugla-cyan">DAĞILIM</p><h2 className="text-xl font-bold">Konum kırılımı</h2></CardHeader><CardContent className="grid gap-4">{[
            ['Ülke', countryRows],
            ['İlçe', districtRows],
          ].map(([title, rows]) => <section key={String(title)}><h3 className="mb-2 font-black">{String(title)}</h3><div className="space-y-2">{(rows as [string, number][]).length ? (rows as [string, number][]).map(([label, count]) => <div key={label} className="flex items-center justify-between rounded-xl bg-mugla-sand/55 px-3 py-2 text-sm"><span>{label}</span><b>{count}</b></div>) : <p className="text-sm text-mugla-navy/45">Veri yok.</p>}</div></section>)}</CardContent></Card>
          <Card><CardHeader><p className="text-xs font-bold tracking-widest text-mugla-cyan">YAŞ ANALİZİ</p><h2 className="text-xl font-bold">Katılımcı yaş grupları</h2></CardHeader><CardContent className="space-y-3">{ageDistribution.map(item => <div key={item.label}><div className="mb-1 flex justify-between text-sm"><span>{item.label}</span><b>{item.value}</b></div><div className="h-2 rounded-full bg-mugla-sand"><div className="h-full rounded-full bg-mugla-cyan" style={{width: `${item.value / maxAgeGroup * 100}%`}}/></div></div>)}</CardContent></Card>
        </div>
      </section>

      <Card id="iletisim">
        <CardHeader><p className="text-xs font-bold tracking-widest text-mugla-cyan">İLETİŞİM TALEPLERİ</p><h2 className="text-xl font-bold">Görüş, öneri ve soru kayıtları</h2></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-3">{contactGroups.map(([label, items]) => <section key={label} className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-4"><div className="flex items-center justify-between"><h3 className="font-bold">{label}</h3><Mail className="text-mugla-cyan" size={18}/></div><p className="mt-5 text-3xl font-black">{items.length}</p></section>)}</div>
          <div className="overflow-x-auto rounded-xl border border-mugla-navy/10 bg-white">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-mugla-sand/60 text-xs uppercase tracking-wider text-mugla-navy/45"><tr><th className="p-3">Tarih</th><th>Vatandaş</th><th>Alan</th><th>Konu</th><th>Mesaj</th><th>KVKK</th><th className="text-right">İşlem</th></tr></thead>
              <tbody>{contactRecords.length ? contactRecords.map(record => <tr key={record.id} className="border-t border-mugla-navy/10 align-top">
                <td className="p-3 text-mugla-navy/55">{new Date(record.createdAt).toLocaleString('tr-TR')}</td>
                <td className="p-3"><b className="block">{record.name}</b><span className="mt-1 block text-xs text-mugla-navy/55">{canSeeFullCitizenData ? record.phone : 'Telefon gizli'}</span><span className="mt-1 block text-xs text-mugla-navy/55">{canSeeFullCitizenData ? record.email : 'E-posta gizli'}</span></td>
                <td className="p-3"><span className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-bold text-mugla-navy/65">{topicLabel(record.topic)}</span></td>
                <td className="p-3 font-semibold">{record.subject}</td>
                <td className="p-3"><p className="max-w-md whitespace-pre-wrap leading-6 text-mugla-navy/65">{record.message}</p></td>
                <td className="p-3"><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{record.kvkkAccepted ? 'Onaylı' : 'Yok'}</span></td>
                <td className="p-3 text-right"><button aria-label={`${record.name} iletisim kaydini sil`} className="rounded-full p-2 text-red-600 hover:bg-red-50" onClick={() => removeContactRecord(record.id)}><Trash2 size={17}/></button></td>
              </tr>) : <tr><td colSpan={7} className="p-8 text-center text-mugla-navy/45">Henüz iletişim talebi yok.</td></tr>}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card id="kampanyalar">
        <CardHeader><p className="text-xs font-bold tracking-widest text-mugla-cyan">CRM KAMPANYALARI</p><h2 className="text-xl font-bold">Vatandaş iletişim taslakları</h2></CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
          <form onSubmit={submitCampaign} className="grid gap-4 rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-4">
            <label><span className="mb-2 block text-sm font-semibold">Başlık</span><input className={field} name="title" required placeholder="Başvurular başladı"/></label>
            <label><span className="mb-2 block text-sm font-semibold">Segment</span><select className={field} name="segment"><option>Vatandaş</option><option>Gençler</option><option>Kadınlar</option><option>STK</option><option>Turistler</option></select></label>
            <label><span className="mb-2 block text-sm font-semibold">Mesaj</span><textarea className={`${field} min-h-28`} name="body" required placeholder="Vatandaşlara gönderilecek kampanya metni"/></label>
            <fieldset><legend className="mb-2 text-sm font-black">Kanallar</legend><div className="grid gap-2 sm:grid-cols-2">{channels.map(channel => <label key={channel} className="flex items-center gap-2 rounded-xl bg-white p-3 text-sm font-bold"><input type="checkbox" name={channel} defaultChecked={channel === 'Push'} className="h-4 w-4 accent-mugla-orange"/>{channel}</label>)}</div></fieldset>
            <Button type="submit" variant="orange"><Bell size={17}/> Taslak Kaydet</Button>
          </form>
          <div className="rounded-2xl border border-mugla-navy/10 bg-white p-4">
            <h3 className="font-black">Kayıtlı kampanya ve bildirimler</h3>
            <div className="mt-4 divide-y">{campaignRows.length ? campaignRows.map(item => <div key={item.id} className="py-3"><b>{item.title}</b><p className="mt-1 text-xs text-mugla-navy/50">{item.note}</p></div>) : <p className="py-8 text-center text-sm text-mugla-navy/45">Henüz kampanya yok.</p>}</div>
          </div>
        </CardContent>
      </Card>
    </main>
  </AppShell></AdminAuthGate>
}
