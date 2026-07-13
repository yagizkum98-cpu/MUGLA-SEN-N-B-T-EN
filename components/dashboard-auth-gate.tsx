'use client'

import Link from 'next/link'
import {useEffect, useState} from 'react'
import {LockKeyhole, UserPlus} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {getCurrentUser, type LocalUser} from '@/lib/local-auth'

export function DashboardAuthGate({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const current = getCurrentUser()
    setUser(current)
    setChecked(true)
  }, [])

  if (!checked) return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <p className="font-semibold text-mugla-navy/55">Oturum kontrol ediliyor...</p>
  </main>

  if (!user) return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-soft">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mugla-navy text-white"><LockKeyhole size={28}/></span>
      <p className="mt-6 text-xs font-bold tracking-[.2em] text-mugla-orange">GIRIS GEREKLI</p>
      <h1 className="mt-2 text-3xl font-bold">Dashboard icin kayit olmalisin.</h1>
      <p className="mt-3 leading-7 text-mugla-navy/55">Proje, butce ve ilce verilerini gorebilmek icin once kayit ol veya mevcut hesabinla giris yap.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Link href="/giris?next=/dashboard"><Button variant="orange" className="w-full"><UserPlus size={17}/> Kayit ol</Button></Link>
        <Link href="/giris?next=/dashboard"><Button variant="outline" className="w-full"><LockKeyhole size={17}/> Giris yap</Button></Link>
      </div>
      <Link href="/" className="mt-5 inline-flex text-sm font-semibold text-mugla-navy/50 hover:text-mugla-navy">Ana sayfaya don</Link>
    </section>
  </main>

  return <>{children}</>
}
