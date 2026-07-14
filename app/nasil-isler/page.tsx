'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Bike,
  Bot,
  Building2,
  Calculator,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  CircleDollarSign,
  ClipboardCheck,
  Construction,
  Droplets,
  FileImage,
  FileText,
  Gavel,
  Globe2,
  Hammer,
  HeartHandshake,
  Leaf,
  Lightbulb,
  Map,
  MapPin,
  Medal,
  MousePointer2,
  Play,
  Recycle,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Theater,
  TreePine,
  Users,
  Video,
  Vote,
} from 'lucide-react'
import { formatBudget, useProjects, type ProjectRecord } from '@/lib/projects-store'

const ideaFields = [
  ['Proje Adı', FileText],
  ['Açıklama', ClipboardCheck],
  ['Konum', MapPin],
  ['Fotoğraf', Camera],
  ['Video', Video],
  ['Tahmini Bütçe', Calculator],
] as const

const aiChecks = ['Sosyal Etki', 'Çevresel Etki', 'Maliyet', 'Uygulanabilirlik', 'Sürdürülebilirlik']
const experts = [
  ['Ulaşım', Building2],
  ['Çevre', Leaf],
  ['Fen İşleri', Hammer],
  ['Kültür', Theater],
  ['MUSKİ', Droplets],
] as const
const districts = ['Fethiye', 'Bodrum', 'Marmaris', 'Milas', 'Datça', 'Köyceğiz']
const badges = ['Muğla Elçisi', 'İklim Kahramanı', 'Gelecek Tasarımcısı', 'Katılım Lideri']

function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let step = 0
    const id = setInterval(() => {
      step += 1
      setCount(Math.round(value * Math.min(step / 36, 1)))
      if (step >= 36) clearInterval(id)
    }, 28)
    return () => clearInterval(id)
  }, [inView, value])

  return <span ref={ref}>{count.toLocaleString('tr-TR')}{suffix}</span>
}

const processStages = ['Başvuru', 'İnceleme', 'Uygunluk', 'Oylama', 'Uygulama', 'Tamamlandı'] as const
const publicSchedule = [
  { stage: 'Başvuru', start: '1 Mart 2026', end: '31 Mart 2026', time: '09:00 - 18:00', note: 'Vatandaş fikirleri ve ek dosyalar toplanır.' },
  { stage: 'İnceleme', start: '1 Nisan 2026', end: '14 Nisan 2026', time: '09:30 - 17:30', note: 'Eksik bilgi, mükerrer kayıt ve temel uygunluk kontrol edilir.' },
  { stage: 'Uygunluk', start: '15 Nisan 2026', end: '30 Nisan 2026', time: '10:00 - 17:00', note: 'Uzman ekipler uygulanabilir projeleri netleştirir.' },
  { stage: 'Oylama', start: '1 Mayıs 2026', end: '21 Mayıs 2026', time: '08:00 - 23:59', note: 'Onaylı projeler halk oylamasına açılır.' },
  { stage: 'Uygulama', start: '1 Haziran 2026', end: '30 Eylül 2026', time: '09:00 - 18:00', note: 'Kazanan projeler sahada uygulanır ve ilerleme yayınlanır.' },
  { stage: 'Tamamlandı', start: '1 Ekim 2026', end: '15 Ekim 2026', time: '10:00 - 16:00', note: 'Sonuçlar, etki verileri ve kapanış raporu paylaşılır.' },
] as const
const stageDurations = [7, 14, 10, 21, 45, 5] as const

function projectYear(project: ProjectRecord) {
  const date = new Date(project.createdAt)
  return Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear()
}

function dateText(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Tarih bekleniyor'
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function projectStageSchedule(project: ProjectRecord) {
  const created = new Date(project.createdAt)
  const anchor = Number.isNaN(created.getTime()) ? new Date() : created
  let cursor = anchor

  return processStages.map((stage, index) => {
    const start = cursor
    const end = addDays(start, stageDurations[index] - 1)
    cursor = addDays(end, 1)

    return {
      stage,
      start: dateText(start.toISOString()),
      end: dateText(end.toISOString()),
      time: index === 3 ? '08:00 - 23:59' : index === 5 ? '10:00 - 16:00' : '09:00 - 18:00',
    }
  })
}

function stageIndex(status: ProjectRecord['status']) {
  if (status === 'Tamamlandı') return 5
  if (status === 'Devam Ediyor') return 4
  if (status === 'Oylamada') return 3
  if (status === 'Uygun') return 2
  if (status === 'İncelemede') return 1
  return 0
}

function stageNote(project: ProjectRecord) {
  if (project.moderationStatus === 'Bekliyor') return 'Admin onayı bekleniyor.'
  if (project.moderationStatus === 'Reddedildi') return 'Yayın dışı bırakıldı.'
  if (project.status === 'Başvuru') return 'Başvuru kaydı alındı.'
  if (project.status === 'İncelemede') return 'Uzman ekip ön inceleme yapıyor.'
  if (project.status === 'Uygun') return 'Oylama veya uygulama takvimi için hazır.'
  if (project.status === 'Oylamada') return 'Vatandaş desteği toplanıyor.'
  if (project.status === 'Devam Ediyor') return 'Uygulama süreci sahada ilerliyor.'
  return 'Tamamlandı ve etki verileri yayınlanabilir.'
}

function Section({
  id,
  eyebrow,
  title,
  text,
  dark = false,
  children,
}: {
  id?: string
  eyebrow: string
  title: string
  text?: string
  dark?: boolean
  children: React.ReactNode
}) {
  return (
    <section id={id} className={`how-section ${dark ? 'is-dark' : ''}`}>
      <motion.div
        className="how-copy"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.55 }}
      >
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </motion.div>
      <motion.div
        className="how-visual"
        initial={{ opacity: 0, y: 34 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55, delay: 0.08 }}
      >
        {children}
      </motion.div>
    </section>
  )
}

export default function NasilIslerPage() {
  const { scrollYProgress } = useScroll()
  const progress = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const [slider, setSlider] = useState(50)
  const { projects } = useProjects()
  const [yearFilter, setYearFilter] = useState<'all' | number>('all')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const visibleProjects = projects.filter(project => project.moderationStatus !== 'Reddedildi')
  const activeVotingProjects = visibleProjects.filter(project => project.moderationStatus === 'Onaylandı' && ['Oylamada', 'Yılın Kazanan Adayı'].includes(String(project.status)))
  const liveVotingProject = activeVotingProjects[0] ?? null
  const liveVotingVotes = activeVotingProjects.reduce((sum, project) => sum + project.votes, 0)
  const projectYears = Array.from(new Set(visibleProjects.map(projectYear))).sort((a, b) => b - a)
  const filteredProcessProjects = visibleProjects.filter(project => yearFilter === 'all' || projectYear(project) === yearFilter)
  const selectedProcessProject = filteredProcessProjects.find(project => project.id === selectedProjectId) ?? null
  const totalVotes = visibleProjects.reduce((sum, project) => sum + project.votes, 0)
  const totalBudget = visibleProjects.reduce((sum, project) => sum + project.budget, 0)
  const totalProgress = visibleProjects.reduce((sum, project) => sum + project.progress, 0)
  const completedProjects = visibleProjects.filter(project => project.status === 'Tamamlandı').length
  const hasImpactData = visibleProjects.length > 0 || totalVotes > 0 || totalBudget > 0 || totalProgress > 0 || completedProjects > 0
  const liveResults = [
    { label: 'Bütçe', value: totalBudget, suffix: ' TL' },
    { label: 'Oy', value: totalVotes, suffix: '' },
    { label: 'Katılım', value: visibleProjects.length, suffix: '' },
    { label: 'Tamamlanan Proje', value: completedProjects, suffix: '' },
  ]
  const liveImpact = hasImpactData ? [
    { value: Math.round(visibleProjects.length * 6 + completedProjects * 24 + totalBudget / 250000), suffix: '', label: 'ağaç', Icon: TreePine },
    { value: Math.round(visibleProjects.length * 0.8 + completedProjects * 2 + totalBudget / 3500000), suffix: ' km', label: 'bisiklet yolu', Icon: Bike },
    { value: Math.round(visibleProjects.length + totalVotes + totalProgress * 3), suffix: '', label: 'vatandaş', Icon: Users },
    { value: Math.round(visibleProjects.length * 2 + completedProjects * 18 + totalVotes * 0.04 + totalBudget / 1000000), suffix: ' ton', label: 'karbon tasarrufu', Icon: Recycle },
  ] : [
    { value: 0, suffix: '', label: 'ağaç', Icon: TreePine },
    { value: 0, suffix: ' km', label: 'bisiklet yolu', Icon: Bike },
    { value: 0, suffix: '', label: 'vatandaş', Icon: Users },
    { value: 0, suffix: ' ton', label: 'karbon tasarrufu', Icon: Recycle },
  ]

  useEffect(() => {
    if (selectedProjectId && !filteredProcessProjects.some(project => project.id === selectedProjectId)) {
      setSelectedProjectId(null)
    }
  }, [filteredProcessProjects, selectedProjectId])

  return (
    <main className="how-page">
      <motion.div className="how-progress" style={{ width: progress }} />

      <header className="how-nav">
        <Link href="/" className="how-back"><Image className="topbar-municipality-logo" src="/partners/mugla-buyuksehir.png" alt="T.C. Muğla Büyükşehir Belediyesi" width={720} height={721} /><ArrowLeft size={17} /> Ana Sayfa</Link>
        <nav>
          <a href="#fikir">Fikir</a>
          <a href="#analiz">Analiz</a>
          <a href="#oylama">Oylama</a>
          <a href="#takvim">Takvim</a>
          <a href="#sonuc">Sonuç</a>
        </nav>
      </header>

      <section className="how-hero">
        <div className="how-hero-map" aria-hidden="true">
          <svg viewBox="0 0 820 440">
            <path d="M48 238 C104 178 156 210 203 163 C272 95 345 113 400 156 C462 205 513 149 580 181 C636 208 660 165 710 190 C758 214 781 245 792 289 C730 279 700 343 638 328 C576 312 540 368 478 334 C420 303 378 363 320 327 C262 291 207 342 157 304 C114 271 88 286 48 238Z" />
            {[[100,245],[210,170],[345,150],[455,218],[570,185],[676,255],[525,310],[265,302]].map(([cx, cy], index) => (
              <circle key={index} cx={cx} cy={cy} r="7" />
            ))}
            <polyline points="100,245 210,170 345,150 455,218 570,185 676,255 525,310 265,302 100,245" />
          </svg>
          <strong>Birlikte Tasarlıyoruz.</strong>
        </div>
        <motion.div className="how-hero-content" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}>
          <span>Muğla Senin Bütçen</span>
          <h1>Bir Fikir, Bir Şehri Değiştirebilir.</h1>
          <p>
            Vatandaşların, gençlerin, girişimcilerin ve dünyanın dört bir yanından katılımcıların şehir için fikir
            üretebildiği dijital katılımcı bütçe platformu.
          </p>
          <div>
            <Link href="/giris?next=/fikir-gonder" className="how-cta primary"><Send size={18} /> Hemen Fikir Gönder</Link>
            <a href="#uygulama-demo" className="how-cta secondary"><Play size={18} /> Nasıl Çalıştığını İzle</a>
          </div>
        </motion.div>
        <a className="how-scroll" href="#hayal"><ChevronDown /></a>
      </section>

      <section id="uygulama-demo" className="app-demo-section">
        <motion.div className="app-demo-copy" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span>Video yerine canlı anlatım</span>
          <h2>Uygulama nasıl çalışır?</h2>
          <p>Bir fikir gönderilir, yapay zekâ ön analiz yapar, uzmanlar inceler, halk oylar ve sonuçlar şeffaf biçimde takip edilir.</p>
        </motion.div>
        <div className="app-demo-stage">
          <motion.div className="demo-phone" initial={{ y: 22, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}>
            <div className="demo-phone-top"><i/><span>Muğla Senin Bütçen</span></div>
            <div className="demo-screen-flow">
              {[
                ['Fikir Gönder', 'Kent Bostanı', Lightbulb],
                ['AI Analizi', 'Etki skoru oluşuyor', Bot],
                ['Halk Oylaması', 'Destekler artıyor', Vote],
                ['Sonuç', 'Süreç şeffaf', BarChart3],
              ].map(([title, text, Icon], index) => (
                <motion.article
                  key={String(title)}
                  animate={{ opacity: [0, 1, 1, 0], x: ['18%', '0%', '0%', '-18%'] }}
                  transition={{ duration: 8, repeat: Infinity, delay: index * 2, times: [0, 0.12, 0.72, 1] }}
                >
                  <Icon />
                  <small>0{index + 1}</small>
                  <h3>{String(title)}</h3>
                  <p>{String(text)}</p>
                </motion.article>
              ))}
            </div>
          </motion.div>
          <div className="demo-orbit">
            {[
              ['Proje adı', FileText],
              ['Konum', MapPin],
              ['Bütçe', CircleDollarSign],
              ['Oy', Vote],
              ['Onay', Check],
            ].map(([label, Icon], index) => (
              <motion.div key={String(label)} className={`demo-chip chip-${index + 1}`} animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, delay: index * .25 }}>
                <Icon size={16} />
                <span>{String(label)}</span>
              </motion.div>
            ))}
          </div>
          <div className="demo-path">
            <svg viewBox="0 0 760 360"><motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2.4 }} d="M70 280 C190 100 310 320 420 150 S620 80 700 240"/></svg>
          </div>
        </div>
      </section>

      <section id="hayal" className="dream-section">
        <motion.h2 initial={{ opacity: 0.2 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.65 }}>
          Muğla'da değiştirmek istediğin bir şey mi var?
        </motion.h2>
        <motion.div className="bulb" initial={{ scale: 0.7, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}>
          <Lightbulb />
        </motion.div>
        <p>İlk adım sadece bir fikir.</p>
      </section>

      <Section id="fikir" eyebrow="1. Fikrini Paylaş" title="Projeni birkaç adımda anlat." text="Formu doldurdukça kart gerçek zamanlı oluşur ve Muğla ekibine iletilir.">
        <div className="idea-builder">
          <div className="idea-form">
            {ideaFields.map(([label, Icon], index) => (
              <motion.div key={label} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} viewport={{ once: true }}>
                <Icon size={17} />
                <span>{label}</span>
                <Check size={16} />
              </motion.div>
            ))}
          </div>
          <motion.article className="floating-card" whileInView={{ y: [-8, -24, -8], rotate: [0, 2, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <small>Yeni Fikir</small>
            <h3>Gölgelikli Bisiklet Rotası</h3>
            <p>Fethiye sahilinde güvenli, yeşil ve erişilebilir rota.</p>
            <b>Muğla'ya gönderiliyor</b>
          </motion.article>
        </div>
      </Section>

      <Section id="analiz" dark eyebrow="2. Yapay Zekâ Analizi" title="AI skoru net, anlaşılır ve şeffaf." text="Yapay zekâ fikirleri sosyal etki, maliyet ve uygulanabilirlik açısından ön değerlendirir.">
        <div className="ai-dashboard">
          <div className="score-ring"><CountUp value={85} suffix="/100" /></div>
          <div className="ai-checks">
            {aiChecks.map((item, index) => (
              <motion.div key={item} initial={{ width: '20%' }} whileInView={{ width: `${68 + index * 5}%` }} viewport={{ once: true }}>
                <span>{item}</span>
              </motion.div>
            ))}
          </div>
          <Bot className="ai-bot-icon" />
        </div>
      </Section>

      <Section eyebrow="3. Uzman İncelemesi" title="Her fikir doğru ekiplerden geçer." text="Ulaşım, çevre, fen işleri, kültür ve altyapı uzmanları projeyi sırayla değerlendirir.">
        <div className="expert-grid">
          {experts.map(([label, Icon], index) => (
            <motion.article key={label} whileHover={{ y: -8, rotateX: 6 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} viewport={{ once: true }}>
              <Icon />
              <h3>{label}</h3>
              <span><Check size={15} /> Onaylandı</span>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section id="oylama" eyebrow="4. Halk Oylaması" title="Projeler desteklenir, öncelikler görünür olur." text="Aktif oylama yoksa sayaç sıfırda kalır; onaylı proje oylamaya açıldığında kart ve oy sayısı anlık güncellenir.">
        <div className="vote-demo">
          <Smartphone className="phone-shell" />
          <motion.div className="vote-card" whileInView={{ x: [0, 38, 0], rotate: [0, 6, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
            <MapPin />
            <h3>{liveVotingProject?.title ?? 'Aktif oylama yok'}</h3>
            <p>{liveVotingProject ? `${liveVotingProject.district} · ${liveVotingProject.category}` : 'Onaylı bir proje oylamaya açıldığında burada canlı olarak yayınlanacak.'}</p>
          </motion.div>
          <div className="vote-actions"><span>{liveVotingProject ? 'Destekle' : 'Beklemede'}</span><b><CountUp value={liveVotingVotes} /> oy</b><span>{activeVotingProjects.length} aktif proje</span></div>
        </div>
      </Section>

      <Section dark eyebrow="Dünyadan Destek" title="Dünyanın Fikirleri Muğla İçin." text="Küresel katılımcılar iyi örnekleri, uzmanlığı ve yaratıcı fikirleri Muğla'ya taşır.">
        <div className="world-flow">
          <Globe2 />
          {[1, 2, 3, 4, 5].map((item) => <i key={item} className={`flow-${item}`} />)}
          <strong>Muğla</strong>
        </div>
      </Section>

      <Section id="sonuc" eyebrow="Sonuçlar" title="Bütçe, oy ve katılım tek ekranda." text="Veri yoksa tüm sonuçlar sıfırda kalır; proje, oy, bütçe ve tamamlanma bilgisi girildikçe anlık güncellenir.">
        <div className="result-board">
          {liveResults.map(({ label, value, suffix }) => (
            <article key={label}>
              <span>{label}</span>
              <b><CountUp value={value} suffix={suffix} /></b>
              <i />
            </article>
          ))}
        </div>
      </Section>

      <Section id="takvim" dark eyebrow="Zaman Takvimi" title="Her aşamanın başlangıç ve bitiş zamanı bellidir." text="Katılımcı bütçe süreci başvuru, inceleme, uygunluk, oylama, uygulama ve kapanış adımlarına ayrılır; her adımın tarih aralığı ve günlük çalışma saati şeffaf biçimde yayınlanır.">
        <div className="schedule-board">
          {publicSchedule.map((item, index) => (
            <motion.article
              key={item.stage}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <div className="schedule-index">
                <span>{index + 1}</span>
                <b>{item.stage}</b>
              </div>
              <div className="schedule-dates">
                <p><CalendarDays size={16} /> <strong>Başlangıç</strong> {item.start}</p>
                <p><CalendarDays size={16} /> <strong>Bitiş</strong> {item.end}</p>
                <p><Clock3 size={16} /> <strong>Saat</strong> {item.time}</p>
              </div>
              <small>{item.note}</small>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Uygulama Süreci" title="Her proje kendi yılı ve aşamasıyla izlenir." text="Girilen projeler kayıt yılına göre filtrelenir; proje kartına tıklanınca kapsamlı açık veri paneli açılır.">
        <div className="process-live">
          <div className="process-filter">
            <button className={yearFilter === 'all' ? 'active' : ''} onClick={() => setYearFilter('all')}>Tüm yıllar</button>
            {projectYears.map(year => (
              <button key={year} className={yearFilter === year ? 'active' : ''} onClick={() => setYearFilter(year)}>{year}</button>
            ))}
          </div>

          <div className="process-layout">
            <div className="process-projects">
              {filteredProcessProjects.length ? filteredProcessProjects.map(project => {
                const activeStage = stageIndex(project.status)
                return (
                  <motion.button
                    key={project.id}
                    className={`process-card ${selectedProjectId === project.id ? 'active' : ''}`}
                    onClick={() => setSelectedProjectId(project.id)}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <span>{projectYear(project)}</span>
                    <h3>{project.title}</h3>
                    <p>{project.district} · {project.category}</p>
                    <div className="process-mini">
                      {processStages.map((stage, index) => <i key={stage} className={index <= activeStage ? 'done' : ''} />)}
                    </div>
                    <small>{stageNote(project)}</small>
                  </motion.button>
                )
              }) : (
                <div className="process-empty">
                  <BarChart3 />
                  <b>Bu yıl için proje yok.</b>
                  <p>Proje girildiğinde kayıt yılına göre burada otomatik görünecek.</p>
                </div>
              )}
            </div>

            {selectedProcessProject ? (
              <motion.article className="project-panel" key={selectedProcessProject.id} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}>
                <div className="project-panel-head">
                  <span>Özel Proje Paneli</span>
                  <button onClick={() => setSelectedProjectId(null)}>Kapat</button>
                </div>
                <h3>{selectedProcessProject.title}</h3>
                <p>{stageNote(selectedProcessProject)}</p>

                <div className="panel-stats">
                  <div><span>Yıl</span><b>{projectYear(selectedProcessProject)}</b></div>
                  <div><span>Durum</span><b>{selectedProcessProject.status}</b></div>
                  <div><span>Bütçe</span><b>{formatBudget(selectedProcessProject.budget)}</b></div>
                  <div><span>Oy</span><b>{selectedProcessProject.votes.toLocaleString('tr-TR')}</b></div>
                </div>

                <div className="panel-progress">
                  {processStages.map((stage, index) => (
                    <div key={stage} className={index <= stageIndex(selectedProcessProject.status) ? 'done' : ''}>
                      <span>{index + 1}</span>
                      <b>{stage}</b>
                    </div>
                  ))}
                </div>

                <div className="panel-schedule">
                  <span>Aşama takvimi</span>
                  {projectStageSchedule(selectedProcessProject).map((item, index) => (
                    <section key={item.stage} className={index <= stageIndex(selectedProcessProject.status) ? 'done' : ''}>
                      <b>{item.stage}</b>
                      <p>{item.start} - {item.end}</p>
                      <small>{item.time}</small>
                    </section>
                  ))}
                </div>

                <div className="panel-detail-grid">
                  <section>
                    <span>Konum</span>
                    <p>{selectedProcessProject.country ?? 'Türkiye'} · {selectedProcessProject.province ?? 'Muğla'} · {selectedProcessProject.district}</p>
                  </section>
                  <section>
                    <span>Kayıt tarihi</span>
                    <p>{dateText(selectedProcessProject.createdAt)}</p>
                  </section>
                  <section>
                    <span>İlerleme</span>
                    <p>%{selectedProcessProject.progress}</p>
                  </section>
                  <section>
                    <span>Yayın durumu</span>
                    <p>{selectedProcessProject.moderationStatus}</p>
                  </section>
                </div>

                <div className="panel-copy">
                  {[
                    ['Amaç', selectedProcessProject.purpose],
                    ['Özet', selectedProcessProject.summary],
                    ['Faaliyetler', selectedProcessProject.activities],
                    ['Beklenen sonuçlar', selectedProcessProject.expectedResults],
                  ].map(([label, value]) => value ? <section key={label}><span>{label}</span><p>{value}</p></section> : null)}
                </div>

                <div className="panel-files">
                  <span>Dosyalar</span>
                  {selectedProcessProject.attachments?.length ? selectedProcessProject.attachments.map(file => (
                    <p key={`${file.name}-${file.size}`}><FileText size={15} /> {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  )) : <p>Bu proje için yayınlanmış ek dosya yok.</p>}
                </div>
              </motion.article>
            ) : (
              <div className="project-panel placeholder">
                <MousePointer2 />
                <h3>Proje paneli seçilmeyi bekliyor.</h3>
                <p>Soldaki proje kartlarından birine tıklayınca projenin aşaması, bütçesi, oyları, açıklamaları, konumu, dosyaları ve yayın bilgileri burada açılır.</p>
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section eyebrow="Önce / Sonra" title="Değişimi gözle görülür yap." text="Eski park ve yeni park görüntüsü tek slider ile karşılaştırılır.">
        <div className="before-after">
          <div className="after-view">Yeni Park</div>
          <div className="before-view" style={{ width: `${slider}%` }}>Eski Park</div>
          <input aria-label="Önce sonra karşılaştırması" type="range" min="8" max="92" value={slider} onChange={(event) => setSlider(Number(event.target.value))} />
          <i style={{ left: `${slider}%` }} />
        </div>
      </Section>

      <section className="complete-section">
        <motion.div initial={{ scale: 0.92, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}>
          <Sparkles />
          <h2>Fikriniz Gerçeğe Dönüştü.</h2>
          <p>Mutlu insanlar, güvenli yollar, yeşil alanlar ve kullanılan bir kamusal değer.</p>
        </motion.div>
      </section>

      <Section eyebrow="Etki Analizi" title="Sonuç sadece tamamlanmak değil, etki yaratmak." text="Veri yoksa sayaçlar sıfırda kalır; proje, oy, bütçe ve ilerleme girildikçe etki verileri anlık ve orantılı güncellenir.">
        <div className="impact-grid">
          {liveImpact.map(({ value, suffix, label, Icon }) => (
            <article key={label}>
              <Icon />
              <b><CountUp value={value} suffix={suffix} /></b>
              <span>{label}</span>
            </article>
          ))}
        </div>
      </Section>

      <Section dark eyebrow="Vatandaş Hikâyeleri" title="Söz vatandaşta." text="Kısa video kartları platformun gerçek etkisini anlatır.">
        <div className="story-carousel">
          {['Ben önerdim.', 'Mahallem değişti.', 'Artık çocuklarımız daha güvenli.'].map((story, index) => (
            <motion.article key={story} whileHover={{ y: -8 }}>
              <Play />
              <p>{story}</p>
              <small>Hikâye {index + 1}</small>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Rozet Kazan" title="Katılım görünür bir başarıya dönüşür." text="Katıldıkça yeni rozetler açılır ve profilinde yer alır.">
        <div className="badge-flight">
          {badges.map((badge, index) => (
            <motion.article key={badge} initial={{ opacity: 0, y: 40, rotate: -5 }} whileInView={{ opacity: 1, y: 0, rotate: index % 2 ? 4 : -4 }} transition={{ delay: index * 0.08 }} viewport={{ once: true }}>
              <Medal />
              <b>{badge}</b>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section dark eyebrow="Muğla'nın Ortak Akıl Haritası" title="İlçeler parlar, veriler konuşur." text="Haritada ilçenin üzerine gelince proje, katılım, bütçe ve tamamlanma bilgileri görünür.">
        <div className="district-orbit">
          <Map />
          {districts.map((district, index) => (
            <button key={district} style={{ left: `${14 + (index % 3) * 32}%`, top: `${24 + Math.floor(index / 3) * 34}%` }}>
              <span>{district}</span>
              <small>{12 + index * 4} proje</small>
            </button>
          ))}
        </div>
      </Section>

      <section className="how-final">
        <div className="how-final-bg" />
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span>Senin Fikrin</span>
          <h2>Muğla'nın Geleceği Birlikte Yazılıyor.</h2>
          <p>Bugün katıl. Yarının Muğla'sını birlikte tasarlayalım.</p>
          <div>
            <Link href="/giris?next=/fikir-gonder" className="how-cta primary"><Lightbulb size={18} /> Fikrimi Gönder</Link>
            <Link href="/projeler" className="how-cta secondary"><MousePointer2 size={18} /> Projeleri Keşfet</Link>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
