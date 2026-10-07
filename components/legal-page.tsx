import Link from 'next/link'
import {ArrowLeft, ShieldCheck} from 'lucide-react'
import type {LegalPageContent} from '@/lib/legal-pages'
import {SiteUserMenu} from '@/components/site-user-menu'

export function LegalPage({content}: {content: LegalPageContent}) {
  return <main className="min-h-screen bg-mugla-sand text-mugla-navy">
    <header className="border-b border-mugla-navy/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-mugla-navy/65 hover:text-mugla-navy"><ArrowLeft size={16}/> Ana sayfa</Link>
        <SiteUserMenu/>
      </div>
    </header>

    <section className="mx-auto max-w-5xl px-5 py-10">
      <div className="rounded-lg border border-mugla-navy/10 bg-white p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.22em] text-mugla-orange">{content.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-black md:text-5xl">{content.title}</h1>
            <p className="mt-4 leading-7 text-mugla-navy/60">{content.description}</p>
          </div>
          <span className="grid h-14 w-14 place-items-center rounded-lg bg-mugla-sand text-mugla-cyan"><ShieldCheck size={24}/></span>
        </div>
        <p className="mt-6 rounded-lg bg-mugla-sand px-4 py-3 text-sm font-bold text-mugla-navy/55">Son güncelleme: {content.updatedAt}</p>
      </div>

      <div className="mt-6 grid gap-4">
        {content.sections.map(section => <section key={section.title} className="rounded-lg border border-mugla-navy/10 bg-white p-5">
          <h2 className="text-xl font-black">{section.title}</h2>
          <p className="mt-3 leading-7 text-mugla-navy/65">{section.body}</p>
        </section>)}
      </div>
    </section>
  </main>
}
