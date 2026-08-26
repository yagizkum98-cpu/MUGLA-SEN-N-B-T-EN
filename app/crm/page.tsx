'use client'

import {useEffect} from 'react'
import {isLocalDomain, municipalityUrl} from '@/lib/domain-routing'

export default function CrmPage() {
  useEffect(() => {
    location.replace(isLocalDomain() ? '/admin#crm' : municipalityUrl('/admin#crm'))
  }, [])

  return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <p className="font-semibold text-mugla-navy/55">CRM verileri belediye paneline taşındı. Yönlendiriliyorsunuz...</p>
  </main>
}
