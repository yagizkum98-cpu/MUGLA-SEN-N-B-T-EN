import Link from 'next/link'
import {ArrowLeft, ChevronDown, HelpCircle} from 'lucide-react'

const sections = [
  {
    title: 'Genel Bilgiler',
    items: [
      ['Katılımcı Bütçe Uygulaması nedir?', 'Katılımcı bütçe, vatandaşların yerel yönetim bütçesinin belirli bir bölümüne ilişkin fikir geliştirdiği, proje önerdiği, uygun bulunan projeleri oyladığı ve seçilen projelerin uygulanmasını izlediği demokratik bir katılım yöntemidir.'],
      ['Muğla Büyükşehir Belediyesi neden Katılımcı Bütçe uyguluyor?', 'Muğla Büyükşehir Belediyesi, kent kaynaklarının vatandaşların öncelikleriyle daha uyumlu kullanılmasını, karar alma süreçlerinde şeffaflığın güçlenmesini ve Muğla’nın geleceğinin ortak akılla şekillenmesini amaçladığı için katılımcı bütçe uygulamasını hayata geçirir.'],
      ['2027 Yılı Katılımcı Bütçe Süreci nasıl işleyecek?', '2027 yılı süreci; proje başvurularının alınması, ön inceleme ve teknik değerlendirme, uygun projelerin oylamaya sunulması, seçilen projelerin belediye planlama süreçlerine dahil edilmesi ve uygulama aşamasının vatandaşlarla paylaşılması adımlarından oluşacaktır.'],
    ],
  },
  {
    title: 'Proje Başvurularının Alınması',
    items: [
      ['Proje başvuru koşulları nedir?', 'Başvuruların Muğla’ya kamusal fayda sağlaması, uygulanabilir olması, belediyenin görev ve yetki alanıyla ilişkili bulunması, başvuru formunda istenen bilgilerin eksiksiz girilmesi ve ilan edilen takvime uygun şekilde iletilmesi beklenir.'],
      ['Hangi alanda proje başvurusunda bulunabilirim?', 'Ulaşım, çevre, iklim, gençlik, kültür, spor, eğitim, sosyal yaşam, kırsal kalkınma, teknoloji, erişilebilirlik ve benzeri yerel yaşamı iyileştiren alanlarda proje başvurusu yapılabilir.'],
      ['Birden fazla başvuru ile başvurabilir miyim?', 'Evet. Bir kişi en fazla 5 farklı proje başvurusu yapabilir. Her başvurunun ayrı bir ihtiyaca, uygulanabilir bir öneriye ve açık bir proje tanımına sahip olması beklenir.'],
      ['Projemde değişiklik yapabilir miyim?', 'Başvuru gönderildikten sonra proje üzerinde değişiklik yapılamaz. Bu nedenle başvuruyu tamamlamadan önce proje adı, açıklama, bütçe, konum ve ek bilgilerin dikkatle kontrol edilmesi önerilir.'],
      ['Proje başvuru tarihleri sona erdikten sonra proje başvurusunda bulunulabilir miyim?', 'Hayır. Başvuru takvimi sona erdikten sonra yeni proje başvurusu alınamaz. Yeni öneriler ancak sonraki katılımcı bütçe döneminde değerlendirilebilir.'],
      ['Fikir maratonları nedir? Ne zaman olur? Nasıl katılırım?', 'Fikir maratonları, vatandaşların, uzmanların, gençlerin ve paydaşların belirli temalar etrafında birlikte proje fikri geliştirdiği çalışmalardır. Tarihleri ve katılım yöntemi belediye duyuruları ve platform üzerinden ilan edilir; katılım için ilgili duyurudaki başvuru adımlarının takip edilmesi yeterlidir.'],
    ],
  },
  {
    title: 'Projenin Oylanması',
    items: [
      ['Projemi kim oylayacak?', 'Teknik değerlendirmeden geçerek oylamaya kalan projeler, platforma kayıtlı ve gerekli doğrulamaları tamamlamış katılımcılar tarafından oylanacaktır. Oylama kuralları ilgili dönem duyurusunda ayrıca belirtilebilir.'],
      ['Projeler nasıl oylanacak?', 'Oylamaya açılan projeler platformda yayınlanır. Katılımcılar giriş yaptıktan sonra proje listesini inceleyerek belirlenen oy hakkı ve kurallar çerçevesinde tercihlerini kullanır.'],
      ['Birleştirilmiş proje nedir?', 'Benzer amaç, bölge veya faaliyet içeren proje önerilerinin daha güçlü ve uygulanabilir tek bir proje çatısı altında toplanmasıdır. Böylece aynı ihtiyaca yönelik tekrar eden başvurular birlikte değerlendirilebilir.'],
      ['Projemin birleştirilip birleştirilmediğinden nasıl haberdar olurum?', 'Projenizin başka başvurularla birleştirilmesi durumunda, başvuru sırasında paylaştığınız iletişim bilgileri veya kullanıcı paneliniz üzerinden bilgilendirme yapılır.'],
      ['Projemin oylamaya kaldığından nasıl haberdar olurum?', 'Projeniz oylamaya kaldığında platformdaki kullanıcı panelinizde durumu görebilir, ayrıca sistemde tanımlı iletişim bilgileriniz üzerinden bilgilendirme alabilirsiniz.'],
    ],
  },
  {
    title: 'Projenin Uygulanması',
    items: [
      ['Projem ne zaman uygulanacak?', 'Oylama ve değerlendirme süreçleri tamamlandıktan sonra seçilen projeler belediyenin 2027 yılı planlama, bütçe ve uygulama takvimine göre hayata geçirilir. Uygulama zamanı projenin kapsamına ve teknik hazırlık sürecine göre değişebilir.'],
      ['Projem nasıl uygulanacak?', 'Seçilen projeler ilgili belediye birimleri tarafından teknik, mali ve idari yönden planlanır. Gerekli hazırlıkların ardından proje uygulama aşamasına alınır ve süreç platform üzerinden izlenebilir hale getirilir.'],
      ['Projemin seçilmesi durumunda bir ücret alacak mıyım?', 'Hayır. Katılımcı bütçe sürecinde proje sahiplerine doğrudan ücret ödenmez. Ancak katkınızın görünür kılınması için katılım belgesi, teşekkür belgesi veya uygun görülen sembolik hediyeler takdim edilebilir.'],
    ],
  },
  {
    title: 'Projemin İzlenmesi',
    items: [
      ['Projemin seçilmesi hâlinde uygulandığını nasıl izleyeceğim?', 'Seçilen projelerin uygulama durumu, ilerleme bilgileri ve ilgili açıklamalar platform üzerinden paylaşılır. Kullanıcı panelinizden veya proje sayfasından projenin hangi aşamada olduğunu takip edebilirsiniz.'],
      ['2027 Yılı Katılımcı Bütçe uygulaması sürecine dair görüş ve önerilerimi nasıl iletebilirim?', 'Süreçle ilgili görüş ve önerilerinizi platformdaki iletişim/geri bildirim alanlarından, belediyenin resmi iletişim kanallarından veya süreç kapsamında duyurulacak toplantı ve etkinlikler aracılığıyla iletebilirsiniz.'],
    ],
  },
] as const

export default function FAQPage() {
  return <main className="min-h-screen bg-mugla-sand text-mugla-navy">
    <header className="border-b border-mugla-navy/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-mugla-navy/65 hover:text-mugla-navy"><ArrowLeft size={16}/> Ana sayfa</Link>
        <span className="text-sm font-bold text-mugla-orange">S.S.S.</span>
      </div>
    </header>

    <section className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-mugla-orange">Sıkça Sorulan Sorular</p>
        <h1 className="mt-3 text-3xl font-black md:text-5xl">2027 Katılımcı Bütçe Süreci</h1>
        <p className="mt-4 max-w-2xl leading-7 text-mugla-navy/60">Başvuru, oylama, uygulama ve izleme süreçlerine dair temel bilgiler.</p>
      </div>

      <div className="space-y-8">
        {sections.map((section, sectionIndex) => <section key={section.title} className="rounded-lg border border-mugla-navy/10 bg-white p-5 md:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-mugla-orange text-sm font-black text-white">{sectionIndex + 1}</span>
            <h2 className="text-2xl font-black">{section.title}</h2>
          </div>
          <div className="space-y-3">
            {section.items.map(([question, answer], index) => <details key={question} className="group rounded-lg border border-mugla-navy/10 bg-mugla-sand/40 px-4">
              <summary className="flex cursor-pointer list-none items-center gap-3 py-4 font-bold">
                <HelpCircle size={18} className="shrink-0 text-mugla-orange"/>
                <span className="flex-1">{index + 1}. {question}</span>
                <ChevronDown size={18} className="shrink-0 transition-transform group-open:rotate-180"/>
              </summary>
              <p className="border-t border-mugla-navy/10 pb-4 pt-3 leading-7 text-mugla-navy/65">{answer}</p>
            </details>)}
          </div>
        </section>)}
      </div>
    </section>
  </main>
}
