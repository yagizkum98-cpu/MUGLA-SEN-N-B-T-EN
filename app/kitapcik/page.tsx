import Link from 'next/link'
import {ArrowLeft, FileText} from 'lucide-react'

const pdfPath = '/kitapcik/mugla-senin-butcen-kitapcigi.pdf'

export default function BookletPage() {
  return <main className="min-h-screen bg-mugla-sand text-mugla-navy">
    <header className="border-b border-mugla-navy/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-mugla-navy/65 hover:text-mugla-navy"><ArrowLeft size={16}/> Ana sayfa</Link>
        <span className="text-sm font-bold text-mugla-orange">PDF Kitapçık</span>
      </div>
    </header>

    <section className="mx-auto max-w-5xl px-5 py-10">
      <div className="rounded-lg border border-mugla-navy/10 bg-white p-8">
        <span className="grid h-14 w-14 place-items-center rounded-lg bg-mugla-sand text-mugla-orange"><FileText size={28}/></span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.22em] text-mugla-orange">Muğla Senin Bütçen Kitapçığı</p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">PDF alanı hazır.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-mugla-navy/60">Kitapçık dosyası hazır olduğunda bu sekmede yayınlanacak.</p>
        <div className="mt-6 rounded-lg border border-dashed border-mugla-navy/20 bg-mugla-sand p-5 text-sm text-mugla-navy/60">
          Beklenen dosya yolu: <b className="text-mugla-navy">public/kitapcik/mugla-senin-butcen-kitapcigi.pdf</b>
        </div>
        <Link href={pdfPath} className="mt-6 inline-flex rounded-full bg-mugla-orange px-5 py-3 text-sm font-bold text-white">PDF’i aç</Link>
      </div>
    </section>
  </main>
}
