import Link from 'next/link'
import {ArrowRight, CheckCircle2, FileText, Search, ShoppingCart, UserRound} from 'lucide-react'
import {VOTE_CREDIT_LIMIT} from '@/lib/vote-rules'

const steps = [
  {title: 'Hesabınıza giriş yapın', icon: UserRound, text: 'Katılım hesabınızla giriş yapın. Hesabınız yoksa kayıt formunu tamamlayın.', href: '/giris?next=/projeler%23oy-ver', label: 'Giriş yap'},
  {title: 'Projeleri inceleyin', icon: Search, text: 'İlçe, tema ve yıl filtrelerinden yararlanın. Projenin amacı, bütçesi ve beklenen sonuçlarını ayrıntı sayfasından inceleyin.', href: '/projeler', label: 'Projeleri incele'},
  {title: 'Oylama sepetinizi oluşturun', icon: ShoppingCart, text: 'Oylamaya açık projeler arasından tercihlerinizi sepete ekleyin. Onaydan önce sepetinizde değişiklik yapabilirsiniz.', href: '/oylamaya-katil', label: 'Oylamaya katıl'},
  {title: 'Tercihlerinizi onaylayın', icon: CheckCircle2, text: 'Vatandaş panelinde sepetinizi kontrol edin ve oylarınızı onaylayın. Onaylanan tercihlerinizi aynı panelden takip edin.', href: '/giris?next=/vatandas/panel%23sepetim', label: 'Sepetime git'},
]

export default function VotingGuidePage() {
  return <main className="bg-white text-mugla-navy"><div className="mx-auto max-w-4xl px-5 py-10">
    <div className="flex items-center gap-3"><FileText size={28} className="text-mugla-orange"/><h1 className="text-3xl font-black">Oylama Kılavuzu</h1></div>
    <p className="mt-4 leading-7 text-mugla-navy/70">Muğla için öncelikli bulduğunuz projeleri destekleyin. Hesabınızın oy hakkı {VOTE_CREDIT_LIMIT} projedir; aynı projeye tekrar oy verilemez.</p>
    <ol className="mt-8 divide-y divide-mugla-navy/10 border-y border-mugla-navy/10">
      {steps.map((step, index) => <li key={step.title} className="flex gap-4 py-6"><span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-mugla-navy/5 font-bold">{index + 1}</span><div className="min-w-0"><h2 className="flex items-center gap-2 text-lg font-bold"><step.icon size={20} className="shrink-0 text-mugla-green"/>{step.title}</h2><p className="mt-2 leading-7 text-mugla-navy/70">{step.text}</p><Link href={step.href} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-mugla-cyan">{step.label}<ArrowRight size={16}/></Link></div></li>)}
    </ol>
    <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold"><Link href="/secilen-projeler">Seçilen projeler</Link><Link href="/sss">Sık sorulan sorular</Link><Link href="/iletisim">İletişim</Link></div>
  </div></main>
}
