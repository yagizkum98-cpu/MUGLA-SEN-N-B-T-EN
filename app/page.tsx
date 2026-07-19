'use client'

import Image from 'next/image'
import Link from 'next/link'
import {CheckCircle2, FileText, FolderKanban, Lightbulb, Mail, UserRound, Vote} from 'lucide-react'
import {useEffect, useState} from 'react'
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

type DecorativeLanguage = 'tr' | 'en' | 'ru' | 'zh-CN'

const worldCityLabels: Record<DecorativeLanguage, {top: string; bottom: string}> = {
  tr: {top: 'DÜNYA KENTİ', bottom: 'MUĞLA'},
  en: {top: 'WORLD CITY', bottom: 'MUĞLA'},
  ru: {top: 'МИРОВОЙ ГОРОД', bottom: 'МУГЛА'},
  'zh-CN': {top: '世界城市', bottom: '穆拉'},
}

function resolveDecorativeLanguage(value: string | null | undefined): DecorativeLanguage {
  if (value === 'en' || value === 'ru' || value === 'zh-CN') return value
  return 'tr'
}

function WorldCityMark({className = ''}: {className?: string}) {
  const [language, setLanguage] = useState<DecorativeLanguage>('tr')
  const label = worldCityLabels[language]

  useEffect(() => {
    setLanguage(resolveDecorativeLanguage(document.documentElement.lang))

    const handleLanguageChange = (event: Event) => {
      const detail = (event as CustomEvent<{language?: string}>).detail
      setLanguage(resolveDecorativeLanguage(detail?.language))
    }

    window.addEventListener('mugla-language-change', handleLanguageChange)
    return () => window.removeEventListener('mugla-language-change', handleLanguageChange)
  }, [])

  return <div className={`notranslate relative aspect-square ${className}`}>
    <div
      className="absolute inset-0 rounded-full shadow-[0_22px_70px_rgba(14,58,102,.22)]"
      style={{
        backgroundImage: "url('/landing/mugla-hero.png')",
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        WebkitMaskImage: 'radial-gradient(circle, transparent 0 34%, #000 35% 100%)',
        maskImage: 'radial-gradient(circle, transparent 0 34%, #000 35% 100%)',
      }}
    />
    <span className="absolute inset-[11%] rounded-full border-[11px] border-white/90"/>
    <span className="absolute inset-[29%] rounded-full border-[9px] border-white/95 bg-white/88 shadow-inner"/>
    <span className="absolute inset-[40%] rounded-full bg-white shadow-[0_8px_28px_rgba(14,58,102,.18)]"/>
    <span className="absolute inset-[36%] grid place-items-center rounded-full text-center font-black leading-none text-[#b3202c]">
      <span className="block text-[clamp(7px,1.3vw,13px)] tracking-wide">{label.top}</span>
      <span className="mt-1 block text-[clamp(7px,1.1vw,12px)] tracking-wide text-mugla-navy">{label.bottom}</span>
    </span>
  </div>
}

function DecorativeLogoBackground() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    let frame = 0
    const syncScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setScrollY(window.scrollY))
    }

    syncScroll()
    window.addEventListener('scroll', syncScroll, {passive: true})
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', syncScroll)
    }
  }, [])

  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
    <div
      className="absolute -left-28 top-[10vh] h-56 w-56 opacity-[.14] mix-blend-multiply blur-[.15px] sm:h-72 sm:w-72 lg:h-[420px] lg:w-[420px]"
      style={{transform: `translate3d(0, ${scrollY * 0.09}px, 0) rotate(-12deg)`}}
    >
      <WorldCityMark/>
    </div>
    <div
      className="absolute -right-32 top-[52vh] h-60 w-60 opacity-[.12] mix-blend-multiply blur-[.15px] sm:h-80 sm:w-80 lg:h-[460px] lg:w-[460px]"
      style={{transform: `translate3d(0, ${scrollY * -0.075}px, 0) rotate(10deg)`}}
    >
      <WorldCityMark/>
    </div>
  </div>
}

const projectStages = [
  ['1', 'Proje', 'Başvurularının', 'Alınması'],
  ['2', 'Ön ve Teknik', 'Değerlendirmelerin', 'Yapılması'],
  ['3', 'Projelerin', 'Oylamaya', 'Sunulması'],
  ['4', 'Oylama', 'Sonuçlarının', 'Açıklanması'],
  ['5', 'Uygulama', 'İzleme ve', 'Raporlama'],
]

function ProjectRoadmap() {
  return <section className="fade-up-card rounded-lg border border-mugla-navy/10 bg-white p-6 shadow-soft md:p-8">
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-black uppercase tracking-[.22em] text-mugla-orange">Yol Haritası</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-mugla-navy md:text-4xl">Projenin Aşamaları Nelerdir?</h2>
    </div>
    <div className="relative mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
      <div className="pointer-events-none absolute left-8 right-8 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-mugla-orange/0 via-mugla-orange/35 to-mugla-orange/0 lg:block"/>
      {projectStages.map(([number, ...lines], index) => (
        <div key={number} className="relative flex justify-center" style={{'--fade-delay': `${index * 70}ms`} as Record<string, string>}>
          <div className="relative grid aspect-square w-full max-w-[178px] place-items-center px-5 text-center text-white shadow-soft transition-transform hover:-translate-y-1">
            <span className="absolute inset-0 bg-mugla-navy [clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0_50%)]"/>
            <span className="absolute inset-[5px] bg-gradient-to-br from-mugla-blue via-mugla-cyan to-mugla-green [clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0_50%)]"/>
            <span className="absolute -top-2 grid h-10 w-10 place-items-center rounded-full border-4 border-white bg-mugla-orange text-lg font-black text-white shadow-md">{number}</span>
            <span className="relative mt-4 block text-sm font-black leading-5 md:text-[15px]">
              {lines.map(line => <span key={line} className="block">{line}</span>)}
            </span>
          </div>
        </div>
      ))}
    </div>
  </section>
}

export default function Home() {
  const {projects} = useProjects()
  const approved = projects.filter(project => !['Bekliyor', 'Reddedildi'].includes(String(project.moderationStatus)))
  const active = approved.filter(project => ['Oylamada', 'Yılın Kazanan Adayı'].includes(String(project.status)))
  const completed = approved.filter(project => String(project.status).startsWith('Tamamland'))
  const totalBudget = approved.reduce((sum, project) => sum + project.budget, 0)

  return <main className="relative min-h-screen overflow-hidden bg-mugla-sand text-mugla-navy">
    <DecorativeLogoBackground/>
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
          <Link href="/iletisim">İletişim</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/giris?mode=login&next=/vatandas/panel" className="inline-flex items-center gap-2 rounded-full border border-mugla-navy/15 bg-white px-4 py-2 text-sm font-bold text-mugla-navy hover:border-mugla-orange">
            Giriş yap <UserRound size={16}/>
          </Link>
        </div>
      </div>
    </header>

    <section id="mugla-senin-butcen" className="scroll-mt-24 border-b border-mugla-navy/10 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1.08fr_.92fr] lg:items-start lg:py-16">
        <article className="fade-up-card rounded-lg border border-mugla-navy/10 bg-mugla-sand/50 p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[.22em] text-mugla-orange">MUĞLA BÜYÜKŞEHİR BELEDİYESİ</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-mugla-navy md:text-4xl">SENİN BÜTÇEN</h2>
          <div className="mt-7 space-y-5 text-sm leading-7 text-mugla-navy/70 md:text-base">
            <p><strong className="text-mugla-navy">Değerli Muğlalılar,</strong></p>
            <p>Muğla Büyükşehir Belediyesi olarak katılımcı, şeffaf ve demokratik yerel yönetim anlayışımız doğrultusunda kentimizin geleceğini sizlerle birlikte şekillendiriyoruz.</p>
            <p>Senin Bütçen uygulamasıyla, kentimizin ihtiyaçlarını en iyi bilen Muğlalıların fikirlerini karar alma süreçlerinin merkezine taşıyoruz. Siz de çevreden ulaşıma, kültür ve sanattan gençlik, spor, tarım, kırsal kalkınma ve sosyal hizmetlere kadar birçok alanda yaşam kalitesini artıracak proje önerilerinizle bu sürece katkı sağlayabilirsiniz.</p>
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
      <div className="mx-auto max-w-6xl px-5 pb-12 lg:pb-16">
        <article className="fade-up-card grid overflow-hidden rounded-lg border border-mugla-navy/10 bg-white shadow-soft lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <div className="relative min-h-72 bg-mugla-sand lg:min-h-[430px]">
            <Image src="/landing/participatory-budget.png" alt="Muğla katılımcı bütçe illüstrasyonu" fill className="object-cover"/>
          </div>
          <div className="p-6 md:p-8 lg:p-10">
            <p className="text-xs font-black uppercase tracking-[.22em] text-mugla-orange">Katılımcı Bütçe Nedir?</p>
            <div className="mt-5 space-y-5 text-sm leading-7 text-mugla-navy/70 md:text-base">
              <p>Katılımcı Bütçe Uygulaması; halkın yerel ölçekte doğrudan bütçe harcamaları ve öncelikleri ile ilgili kararlara aktif katılımı anlamına geliyor. Şeffaflık, hesap verebilirlik ve kaynakların adil bir şekilde tahsis edilmesi gibi hususlar çerçevesinde şekillenen yeni bir yönetim anlayışını destekleyen katılımcı bütçe uygulaması; vatandaşların proje önerme ya da oy verme gibi çeşitli biçimlerle bütçenin tamamının ya da bir kısmının nasıl harcanacağına dair kararlara katıldığı bir süreçtir.</p>
              <p>Muğla Büyükşehir Belediyesi Katılımcı Bütçe Uygulaması; “Proje Başvurularının Alınması”, “Ön ve Teknik Değerlendirmelerin Yapılması”, “Projelerin Oylamaya Sunulması”, “Oylama Sonuçlarının Açıklanması” ile “Uygulama, İzleme ve Raporlama” aşamalarından oluşmaktadır. Bu yıl dördüncüsünü düzenleyeceğimiz Bütçe Senin uygulamamıza Türkiye’nin ve Dünya'nın her yerinden vatandaşlarımızın Muğla için katılımlarını bekliyoruz.</p>
            </div>
          </div>
        </article>
        <div className="mt-8">
          <ProjectRoadmap/>
        </div>
      </div>
    </section>

    <section className="relative overflow-hidden bg-mugla-navy text-white">
      <div className="absolute inset-0 opacity-25">
        <Image src="/landing/mugla-hero.png" alt="" fill priority className="object-cover"/>
      </div>
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.24em] text-mugla-cyan">Evrensel Katılımcı Bütçe uygulaması</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">Muğla için fikirleri toplayan, oylatan ve izleten sade platform.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">İlk aşamada hedef basit: vatandaş fikir göndersin, belediye projeleri yayınlasın, herkes durumu kolayca takip etsin.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/projeler" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-mugla-navy"><FolderKanban size={18}/> Projeleri gör</Link>
          </div>
        </div>
        <div className="grid content-end gap-3">
          <Stat label="Yayındaki proje" value={String(approved.length)} note="Belediye onayından geçen kayıtlar"/>
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
        <Link href="/kitapcik" className="rounded-lg border border-mugla-navy/10 p-6 hover:border-mugla-orange">
          <FileText className="text-mugla-green"/>
          <h3 className="mt-4 text-xl font-bold">Muğla Senin Bütçen Kitapçığı</h3>
          <p className="mt-2 text-sm leading-6 text-mugla-navy/60">Kitapçık PDF’i hazır olduğunda bu sekmede yayınlanır.</p>
        </Link>
        <Link href="/iletisim" className="rounded-lg border border-mugla-navy/10 p-6 hover:border-mugla-orange">
          <Mail className="text-mugla-orange"/>
          <h3 className="mt-4 text-xl font-bold">İletişim</h3>
          <p className="mt-2 text-sm leading-6 text-mugla-navy/60">Katılımcı bütçe süreciyle ilgili görüş, öneri ve sorularını ilet.</p>
        </Link>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-14">
      <div className="rounded-lg bg-mugla-navy p-7 text-white md:flex md:items-center md:justify-between md:gap-8">
        <div>
          <p className="text-sm font-bold text-mugla-cyan">{completed.length} tamamlanan proje</p>
          <h2 className="mt-2 text-2xl font-black">İlk sürüm için odak: az ekran, net yol, gerçek veri.</h2>
        </div>
      </div>
    </section>

    <footer className="border-t border-mugla-navy/10 bg-white px-5 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-mugla-navy/55">
        <span>© 2026 Muğla Büyükşehir Belediyesi</span>
        <div className="flex gap-4">
          <a href="#mugla-senin-butcen">Muğla Senin Bütçen</a>
          <Link href="/projeler">Projeler</Link>
          <Link href="/sss">S.S.S.</Link>
          <Link href="/kitapcik">Kitapçık</Link>
          <Link href="/iletisim">İletişim</Link>
        </div>
      </div>
    </footer>
  </main>
}

