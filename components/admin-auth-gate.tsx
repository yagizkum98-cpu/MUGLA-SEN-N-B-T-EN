'use client'

import Link from 'next/link'
import {useEffect, useState} from 'react'
import {LockKeyhole} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {getCurrentAdmin, type AdminAccount} from '@/lib/admin-auth'

export function AdminAuthGate({children}: {children: React.ReactNode}) {
  const [admin, setAdmin] = useState<AdminAccount | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
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
      <p className="mt-6 text-xs font-bold tracking-[.2em] text-mugla-orange">BELEDIYE PANELI GIRISI GEREKLI</p>
      <h1 className="mt-2 text-3xl font-bold">Bu alan yetkili kullanicilar icindir.</h1>
      <p className="mt-3 leading-7 text-mugla-navy/55">Sadece super admin, admin ve tanimli yetkili hesaplar e-posta ve sifreyle girebilir.</p>
      <Link href="/admin/giris" className="mt-7 inline-flex"><Button variant="orange"><LockKeyhole size={17}/> Belediye paneli girisi</Button></Link>
    </section>
  </main>

  return <>{children}</>
}
