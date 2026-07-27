'use client'

import Link from 'next/link'
import {useEffect, useState} from 'react'
import {LockKeyhole} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {getCurrentAdmin, normalizeAdminRole, type AdminAccount} from '@/lib/admin-auth'
import {crmUrl, isAdminAuthorityDomain, isCrmDomain, isMunicipalityDomain, isSuperAdminDomain, municipalityUrl, superAdminUrl} from '@/lib/domain-routing'

export function AdminAuthGate({children}: {children: React.ReactNode}) {
  const [admin, setAdmin] = useState<AdminAccount | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isAdminAuthorityDomain()) {
      location.replace(municipalityUrl(`${location.pathname}${location.search}`))
      return
    }

    getCurrentAdmin().then(current => {
      setAdmin(current)
      setChecked(true)
    })
  }, [])

  if (!checked) return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <p className="font-semibold text-mugla-navy/55">Belediye paneli oturumu kontrol ediliyor...</p>
  </main>

  if (!admin) return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-soft">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mugla-navy text-white"><LockKeyhole size={28}/></span>
      <p className="mt-6 text-xs font-bold tracking-[.2em] text-mugla-orange">{isSuperAdminDomain() ? 'SUPER ADMIN GIRISI GEREKLI' : isCrmDomain() ? 'CRM GIRISI GEREKLI' : 'BELEDIYE PANELI GIRISI GEREKLI'}</p>
      <h1 className="mt-2 text-3xl font-bold">Bu alan yetkili kullanicilar icindir.</h1>
      <p className="mt-3 leading-7 text-mugla-navy/55">{isCrmDomain() ? 'Sadece super admin tarafindan CRM yetkilisi olarak tanimlanan hesaplar e-posta ve sifreyle girebilir.' : 'Sadece super admin, belediye admini, ilce yoneticisi, degerlendirici ve CRM yetkilisi olarak tanimli hesaplar e-posta ve sifreyle girebilir.'}</p>
      <Link href={isSuperAdminDomain() ? superAdminUrl('/admin/giris') : isCrmDomain() ? crmUrl('/admin/giris') : '/admin/giris'} className="mt-7 inline-flex"><Button variant="orange"><LockKeyhole size={17}/>{isSuperAdminDomain() ? 'Super admin girisi' : isCrmDomain() ? 'CRM girisi' : 'Belediye paneli girisi'}</Button></Link>
    </section>
  </main>

  if (isSuperAdminDomain() && normalizeAdminRole(admin.role) !== 'super-admin') return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-soft">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mugla-navy text-white"><LockKeyhole size={28}/></span>
      <p className="mt-6 text-xs font-bold tracking-[.2em] text-mugla-orange">SUPER ADMIN YETKISI GEREKLI</p>
      <h1 className="mt-2 text-3xl font-bold">Bu merkez sadece super admin hesabina aciktir.</h1>
      <p className="mt-3 leading-7 text-mugla-navy/55">Belediye admini, ilce yoneticisi ve diger roller belediye panelinden devam etmelidir.</p>
      <Link href={municipalityUrl('/admin')} className="mt-7 inline-flex"><Button variant="orange">Belediye paneline git</Button></Link>
    </section>
  </main>

  if (isCrmDomain() && !['crm', 'super-admin'].includes(normalizeAdminRole(admin.role))) return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-soft">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mugla-navy text-white"><LockKeyhole size={28}/></span>
      <p className="mt-6 text-xs font-bold tracking-[.2em] text-mugla-orange">CRM YETKISI GEREKLI</p>
      <h1 className="mt-2 text-3xl font-bold">Bu portal sadece CRM ekibine aciktir.</h1>
      <p className="mt-3 leading-7 text-mugla-navy/55">Belediye admini, ilce yoneticisi ve proje ekipleri operasyon panelinden devam etmelidir.</p>
      <Link href={municipalityUrl('/admin')} className="mt-7 inline-flex"><Button variant="orange">Belediye paneline git</Button></Link>
    </section>
  </main>

  if (isMunicipalityDomain() && normalizeAdminRole(admin.role) === 'crm') return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-soft">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mugla-navy text-white"><LockKeyhole size={28}/></span>
      <p className="mt-6 text-xs font-bold tracking-[.2em] text-mugla-orange">CRM PORTALI AYRI</p>
      <h1 className="mt-2 text-3xl font-bold">CRM personeli destek portalindan devam eder.</h1>
      <p className="mt-3 leading-7 text-mugla-navy/55">CRM; cagri merkezi, WhatsApp, e-posta, destek, talep, sikayet, memnuniyet ve canli destek sureclerini yurutur. Proje onayi, oylama, yetki ve sistem ayarlari bu rolde kapali kalir.</p>
      <a href={crmUrl('/crm')} className="mt-7 inline-flex"><Button variant="orange">CRM paneline git</Button></a>
    </section>
  </main>

  return <>{children}</>
}
