'use client'

import Image from 'next/image'
import Link from 'next/link'
import {ArrowRight, CheckCircle2, FileText, FolderKanban, Lightbulb, Vote} from 'lucide-react'
import {formatBudget, useProjects} from '@/lib/projects-store'

function Stat({label, value, note}: {label: string; value: string; note: string}) {
  return <div className="rounded-lg border border-mugla-navy/10 bg-white p-5">
    <p className="text-sm text-mugla-navy/55">{label}</p>
    <strong className="mt-2 block text-3xl">{value}</strong>
    <p className="mt-1 text-xs text-mugla-navy/45">{note}</p>
  </div>
}

function Step({icon: Icon, title, text}: {icon: typeof Lightbulb; title: string; text: string}) {
  return <div className="rounded-lg border border-mugla-navy/10 bg-white p-5">
    <span className="grid h-11 w-11 place-items-center rounded-lg bg-mugla-sand text-mugla-orange"><Icon size={21}/></span>
    <h3 className="mt-5 text-lg font-bold">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-mugla-navy/60">{text}</p>
  </div>
}

export default function Home() {
  const {projects} = useProjects()
  const approved = projects.filter(project => !['Bekliyor', 'Reddedildi'].includes(String(project.moderationStatus)))
  const active = approved.filter(project => ['Oylamada', 'Yılın Kazanan Adayı'].includes(String(project.status)))
  const completed = approved.filter(project => String(project.status).startsWith('Tamamland'))
  const totalBudget = approved.reduce((sum, project) => sum + project.budget, 0)

  return <main className="min-h-screen bg-mugla-sand text-mugla-navy">
    <header className="sticky top-0 z-30 border-b border-mugla-navy/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white p-1 shadow-sm">
            <Image src="/partners/mugla-buyuksehir.png" alt="Mugla Buyuksehir Belediyesi" width={720} height={721} className="h-full w-full object-contain"/>
          </span>
          <span className="text-sm font-bold leading-tight">Mugla Senin<br/><span className="text-mugla-orange">Butcen</span></span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-mugla-navy/65 md:flex">
          <a href="#mugla-senin-butcen">Muğla Senin Bütçen</a>
          <Link href="/projeler">Projeler</Link>
          <Link href="/sss">S.S.S.</Link>
          <Link href="/kitapcik">Muğla Senin Bütçen Kitapçığı</Link>
        </nav>
        <Link href="/giris?next=/fikir-gonder" className="inline-flex items-center gap-2 rounded-full bg-mugla-orange px-4 py-2 text-sm font-bold text-white">
          Fikir gonder <ArrowRight size={16}/>
        </Link>
      </div>
    </header>

    <section id="mugla-senin-butcen" className="scroll-mt-24 border-b border-mugla-navy/10 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1.08fr_.92fr] lg:items-start lg:py-16">
        <article className="fade-up-card rounded-lg border border-mugla-navy/10 bg-mugla-sand/50 p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[.22em] text-mugla-orange">MUĞLA BÜYÜKŞEHİR BELEDİYESİ</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-mugla-navy md:text-4xl">BÜTÇEM MUĞLA</h2>
          <div className="mt-7 space-y-5 text-sm leading-7 text-mugla-navy/70 md:text-base">
            <p><strong className="text-mugla-navy">Değerli Muğlalılar,</strong></p>
            <p>Muğla Büyükşehir Belediyesi olarak katılımcı, şeffaf ve demokratik yerel yönetim anlayışımız doğrultusunda kentimizin geleceğini sizlerle birlikte şekillendiriyoruz.</p>
            <p>Bütçem Muğla uygulamasıyla, kentimizin ihtiyaçlarını en iyi bilen Muğlalıların fikirlerini karar alma süreçlerinin merkezine taşıyoruz. Siz de çevreden ulaşıma, kültür ve sanattan gençlik, spor, tarım, kırsal kalkınma ve sosyal hizmetlere kadar birçok alanda yaşam kalitesini artıracak proje önerilerinizle bu sürece katkı sağlayabilirsiniz.</p>
            <p>Her bir fikir, Muğla'nın daha yaşanabilir, sürdürülebilir, erişilebilir ve güçlü bir kent olmasına katkı sunacaktır. Katılımcı bütçe modeliyle ortak aklı büyütüyor, kaynaklarımızı vatandaşlarımızın öncelikleri doğrultusunda birlikte planlıyoruz.</p>
            <p>Muğla Büyükşehir Belediyesi olarak; doğasını koruyan, kültürünü yaşatan, üretimi destekleyen ve insan odaklı hizmet anlayışıyla geleceğe güvenle bakan bir Muğla'yı hep birlikte inşa edeceğimize inanıyoruz.</p>
            <p><strong className="text-mugla-navy">Gelin, Muğla'nın geleceğini birlikte tasarlayalım. Çünkü en değerli fikir sizden gelir.</strong></p>
            <p><strong className="text-mugla-navy">Saygılarımızla,</strong></p>
            <p><strong className="text-mugla-navy">Muğla Büyükşehir Belediyesi</strong></p>
          </div>
          <div className="mt-8 rounded-lg bg-white p-4 shadow-sm">
            <Image src="/partners/mugla-buyuksehir.png" alt="Muğla Büyükşehir Belediyesi logosu" width={720} height={721} className="h-auto max-h-28 w-full object-contain"/>
          </div>
        </article>
        <aside className="fade-up-card overflow-hidden rounded-lg border border-mugla-navy/10 bg-white shadow-soft">
          <div className="relative aspect-[4/5] bg-mugla-sand">
            <Image src="/partners/ahmet-aras.webp" alt="Ahmet Aras - Muğla Büyükşehir Belediyesi Başkanı" fill className="object-cover"/>
          </div>
          <div className="p-5 text-center">
            <p className="text-lg font-black text-mugla-navy">Ahmet Aras</p>
            <p className="mt-1 text-sm font-semibold text-mugla-navy/55">Muğla Büyükşehir Belediyesi Başkanı</p>
          </div>
        </aside>
      </div>
    </section>

    <section className="relative overflow-hidden bg-mugla-navy text-white">
      <div className="absolute inset-0 opacity-25">
        <Image src="/landing/mugla-hero.png" alt="" fill priority className="object-cover"/>
      </div>
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.24em] text-mugla-cyan">Katılımcı bütçe MVP</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">Muğla için fikirleri toplayan, oylatan ve izleten sade platform.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">İlk aşamada hedef basit: vatandaş fikir göndersin, belediye projeleri yayınlasın, herkes durumu kolayca takip etsin.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/giris?next=/fikir-gonder" className="inline-flex items-center gap-2 rounded-full bg-mugla-orange px-5 py-3 font-bold text-white"><Lightbulb size={18}/> Fikir gonder</Link>
            <Link href="/projeler" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-mugla-navy"><FolderKanban size={18}/> Projeleri gör</Link>
          </div>
        </div>
        <div className="grid content-end gap-3">
          <Stat label="Yayındaki proje" value={String(approved.length)} note="Admin onayından geçen kayıtlar"/>
          <Stat label="Aktif oylama" value={String(active.length)} note="Vatandasin oy verebildigi projeler"/>
          <Stat label="Görünen bütçe" value={formatBudget(totalBudget)} note="Onaylı proje portföyü"/>
        </div>
      </div>
    </section>

    <section id="nasil" className="mx-auto max-w-6xl px-5 py-14">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-mugla-orange">Basit akış</p>
        <h2 className="mt-3 text-3xl font-black md:text-4xl">MVP deneyimi dört adımda ilerler.</h2>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Step icon={Lightbulb} title="Fikir al" text="Vatandaş giriş yapar ve fikrini kısa bir formla iletir."/>
        <Step icon={CheckCircle2} title="Onayla" text="Başvurular incelenir, uygun projeler yayına alınır."/>
        <Step icon={Vote} title="Oy ver" text="Onaylı projeler listelenir ve destek sayısı takip edilir."/>
        <Step icon={FolderKanban} title="Takip et" text="Proje durumu, bütçe ve ilerleme bilgileri sade biçimde görünür."/>
      </div>
    </section>

    <section className="border-y border-mugla-navy/10 bg-white">
      <div className="mx-auto grid max-w-6xl gap-4 px-5 py-12 md:grid-cols-3">
        <Link href="/projeler" className="rounded-lg border border-mugla-navy/10 p-6 hover:border-mugla-orange">
          <FolderKanban className="text-mugla-orange"/>
          <h3 className="mt-4 text-xl font-bold">Projeler</h3>
          <p className="mt-2 text-sm leading-6 text-mugla-navy/60">Tüm onaylı projeleri ara, filtrele, oy ver ve durumlarını gör.</p>
        </Link>
        <Link href="/giris?next=/fikir-gonder" className="rounded-lg border border-mugla-navy/10 p-6 hover:border-mugla-orange">
          <Lightbulb className="text-mugla-cyan"/>
          <h3 className="mt-4 text-xl font-bold">Fikir Gönder</h3>
          <p className="mt-2 text-sm leading-6 text-mugla-navy/60">Muğla için önerini kısa bir başvuru formuyla ilet.</p>
        </Link>
        <Link href="/kitapcik" className="rounded-lg border border-mugla-navy/10 p-6 hover:border-mugla-orange">
          <FileText className="text-mugla-green"/>
          <h3 className="mt-4 text-xl font-bold">Muğla Senin Bütçen Kitapçığı</h3>
          <p className="mt-2 text-sm leading-6 text-mugla-navy/60">Kitapçık PDF’i hazır olduğunda bu sekmede yayınlanır.</p>
        </Link>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-14">
      <div className="rounded-lg bg-mugla-navy p-7 text-white md:flex md:items-center md:justify-between md:gap-8">
        <div>
          <p className="text-sm font-bold text-mugla-cyan">{completed.length} tamamlanan proje</p>
          <h2 className="mt-2 text-2xl font-black">İlk sürüm için odak: az ekran, net yol, gerçek veri.</h2>
        </div>
        <Link href="/giris?next=/fikir-gonder" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-mugla-navy md:mt-0">
          Basla <CheckCircle2 size={18}/>
        </Link>
      </div>
    </section>

    <footer className="border-t border-mugla-navy/10 bg-white px-5 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-mugla-navy/55">
        <span>Muğla Senin Bütçen MVP</span>
        <div className="flex gap-4">
          <a href="#mugla-senin-butcen">Muğla Senin Bütçen</a>
          <Link href="/projeler">Projeler</Link>
          <Link href="/sss">S.S.S.</Link>
          <Link href="/kitapcik">Kitapçık</Link>
          <Link href="/giris?next=/dashboard">Dashboard</Link>
          <Link href="/admin/giris">Admin</Link>
        </div>
      </div>
    </footer>
  </main>
}
