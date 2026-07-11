'use client'

import {useState} from 'react'
import {ChevronDown,HelpCircle,Search} from 'lucide-react'

const faqs=[
  ['Muğla Senin Bütçen nedir?','Vatandaşların, gençlerin, sivil toplum kuruluşlarının, akademisyenlerin, girişimcilerin ve Muğla’yı ziyaret eden kişilerin proje önerileri sunabildiği, projeleri değerlendirebildiği ve bütçe süreçlerine katılabildiği dijital katılımcı bütçe platformudur.'],
  ['Bu platformun amacı nedir?','Muğla’nın geleceğini ortak akılla şekillendirmek, vatandaşların karar alma süreçlerine doğrudan katılımını sağlamak ve belediye yatırımlarını toplumun ihtiyaçlarına göre önceliklendirmektir.'],
  ['Kimler katılabilir?','Muğla’da yaşayan vatandaşlar, öğrenciler, gençler, kadınlar, STK’lar, kooperatifler, akademisyenler, girişimciler ile yerli ve yabancı ziyaretçiler katılabilir.'],
  ['Muğla’da yaşamıyor olsam da katılabilir miyim?','Evet. Muğla’nın gelişimine katkı sunmak isteyen herkes fikir ve proje önerebilir. Bazı oylama süreçlerinde yerel katılımcılara öncelik verilebilir.'],
  ['Platforma nasıl kayıt olabilirim?','E-posta ve şifreyle hesap oluşturabilir; ayrıca yapılandırıldığında Google veya e‑Devlet hesabınızla kayıt olup giriş yapabilirsiniz.'],
  ['Proje önerisi nasıl sunabilirim?','“Fikir Gönder” bölümünde proje adı, amaç, özet, faaliyetler, beklenen sonuçlar, konum ve tahmini bütçe bilgilerini girip destekleyici belgelerinizi ekleyerek başvurabilirsiniz.'],
  ['Birden fazla proje sunabilir miyim?','Evet. Farklı temalarda ve farklı ilçeler için birden fazla proje önerisi sunabilirsiniz.'],
  ['Proje önerileri hangi alanlarda olabilir?','Ulaşım, çevre, iklim, kültür ve sanat, turizm, gençlik, spor, eğitim, teknoloji, kırsal kalkınma ve sosyal hizmetler gibi alanlarda proje sunulabilir.'],
  ['Yapay zekâ değerlendirmesi nedir?','Yapay zekâ; maliyet, çevresel etki, sosyal fayda, uygulanabilirlik ve sürdürülebilirlik başlıklarında ön değerlendirme yaparak proje sahibine ve uzmanlara destekleyici geri bildirim sunar.'],
  ['Yapay zekâ projeleri reddedebilir mi?','Hayır. Yapay zekâ yalnızca destekleyici analiz üretir. Nihai karar uzman ekipler ve yetkili belediye birimleri tarafından verilir.'],
  ['Projeler nasıl değerlendirilir?','Projeler ön kontrol, yapay zekâ analizi, teknik uygunluk, bütçe uygunluğu ve uygun bulunması hâlinde halk oylaması aşamalarından geçer.'],
  ['Oylama nasıl yapılır?','Onaylanan projeler belirlenen dönemlerde halk oylamasına açılır. Kayıtlı ve gerekli doğrulamaları tamamlamış kullanıcılar platform üzerinden oy kullanabilir.'],
  ['Bir projeye kaç kez oy verebilirim?','Her kullanıcı, ilgili dönem için belirlenen oy limiti ve kimlik doğrulama kuralları çerçevesinde oy kullanabilir.'],
  ['Oylama sonuçları şeffaf olacak mı?','Evet. Sonuçlar proje bazında ve açık biçimde platform üzerinden yayımlanacaktır.'],
  ['Kazanan projeler ne zaman uygulanır?','Seçilen projeler yıllık bütçe planlamasına dâhil edilir ve teknik hazırlıkların ardından uygulama takvimine alınır.'],
  ['Projelerin uygulama sürecini takip edebilir miyim?','Evet. Bütçe durumu, ilerleme yüzdesi, hedef tamamlanma tarihi ve güncel proje içerikleri platformda yayımlanacaktır.'],
  ['Tematik bütçe nedir?','Belirli bir yıl veya dönem için Gençlik, İklim, Akıllı Şehir ya da Kültür ve Miras gibi bir temaya özel bütçe ayrılmasıdır.'],
  ['Gençler için özel bir alan olacak mı?','Evet. Gençlik Meclisi ve Gençlik Bütçesi modülleriyle gençlerin kendi projelerini geliştirmeleri ve oylamaları desteklenecektir.'],
  ['Çocuklar katılabilecek mi?','Evet. “Çocuk Bütçesi” kapsamında çocukların yaşlarına uygun yöntemlerle fikirlerini paylaşabilecekleri özel alanlar planlanmaktadır.'],
  ['Projelerimi düzenleyebilir miyim?','Teknik inceleme süreci başlamadan önce proje sahibi başvurusunu düzenleyebilir.'],
  ['Aynı proje başka biri tarafından da önerilmişse ne olur?','Benzer projeler tespit edilerek birleştirilebilir veya proje sahipleri ortak geliştirme sürecine yönlendirilebilir.'],
  ['Platform ücretsiz mi?','Evet. Muğla Senin Bütçen platformuna katılım tamamen ücretsizdir.'],
  ['Proje önerim kabul edilirse herhangi bir ücret veya ödül alacak mıyım?','Muğla Senin Bütçen, toplumsal katılımı ve ortak aklı teşvik eden bir katılımcı bütçe platformudur. Bu nedenle proje önerilerinin kabul edilmesi veya oylama sonucunda seçilmesi durumunda doğrudan nakdi bir ödeme veya proje bedeli yapılması esas değildir. Ancak belediyenin ilgili mevzuatı ve yıllık uygulama esasları doğrultusunda başarılı proje sahiplerine Başarı Belgesi veya Katılım Sertifikası verilebilir; platform üzerinde "Muğla İnovasyon Elçisi", "Katılım Lideri" gibi dijital rozetler ve unvanlar kazandırılabilir; proje sahipleri lansman, çalıştay veya belediye etkinliklerinde fikirlerini sunmaya davet edilebilir; uygun görülen projelerde uygulama sürecine danışman veya gönüllü paydaş olarak katılım sağlanabilir; girişimcilik niteliği taşıyan projeler ilgili hibe, fon, kuluçka veya yatırım programlarına yönlendirilebilir. Platformun temel amacı ödül dağıtmak değil, vatandaşların fikirlerini belediye yatırımlarına dönüştürerek Muğla’nın geleceğini birlikte şekillendirmektir. En büyük kazanım, önerilen bir projenin hayata geçirilmesi ve toplum için kalıcı değer üretmesidir.'],
  ['Kişisel verilerim korunuyor mu?','Evet. Kişisel veriler ilgili mevzuat ve KVKK kapsamında, gerekli teknik ve idari güvenlik tedbirleriyle korunur.'],
  ['Platformun diğer katılımcı bütçe uygulamalarından farkı nedir?','Yapay zekâ destekli analiz, açık veri yaklaşımı, küresel katılım, tematik bütçe, harita tabanlı proje geliştirme ve şeffaf proje takibi özelliklerini birlikte sunar.'],
  ['Uzun vadeli hedef nedir?','Muğla’yı dijital demokrasi, açık veri ve ortak akıl temelinde vatandaşların ve uzmanların birlikte tasarladığı örnek bir şehir hâline getirmektir.'],
  ['Muğla’nın geleceğini gerçekten değiştirebilir miyim?','Evet. Platformun temel amacı, bireysel fikirlerin şehir politikalarına ve yatırımlarına dönüşebilmesini sağlamaktır.'],
  ['Projem seçilmese bile katkım değerli mi?','Kesinlikle. Her fikir gelecekteki planlamalara, yeni projelere ve stratejik kararlara veri ve ilham sağlar.'],
  ['Muğla Senin Bütçen neden önemlidir?','Çünkü şehirler, o şehirde yaşayan ve şehri deneyimleyen insanların ortak aklıyla daha doğru gelişir. Platform bu ortak aklı dijital ortamda bir araya getirir.']
] as const

export function FAQ(){
  const[query,setQuery]=useState('')
  const filtered=faqs.filter(([question,answer])=>`${question} ${answer}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')))
  return <section id="sss" className="bg-[#f4f1e8] px-[6vw] py-28 text-[#06283f]">
    <div className="mx-auto max-w-6xl">
      <div className="grid items-end gap-8 lg:grid-cols-[1fr_420px]">
        <div><span className="text-[10px] font-extrabold tracking-[3px] text-[#f58220]">MERAK ETTİKLERİNİZ</span><h2 className="mt-5 font-['Manrope'] text-5xl font-bold tracking-[-3px] sm:text-7xl">Sıkça Sorulan<br/><em className="font-serif font-normal text-[#f58220]">Sorular</em></h2><p className="mt-5 max-w-xl leading-7 text-[#59707c]">Katılım, proje gönderimi, değerlendirme, oylama ve uygulama süreçleri hakkında yanıtlar.</p></div>
        <label className="flex items-center gap-3 rounded-full border border-[#06283f22] bg-white px-5 shadow-sm"><Search size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} className="w-full bg-transparent py-4 outline-none" placeholder="Sorularda ara…"/></label>
      </div>
      <div className="mt-16 grid gap-3 lg:grid-cols-2 lg:items-start">{filtered.map(([question,answer],index)=><details key={question} className="group rounded-2xl border border-[#06283f18] bg-white px-5 open:shadow-lg"><summary className="flex cursor-pointer list-none items-center gap-4 py-5 font-bold"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#00a6c812] text-xs text-[#00a6c8]">{String(index+1).padStart(2,'0')}</span><span className="flex-1">{question}</span><ChevronDown className="shrink-0 transition-transform group-open:rotate-180" size={18}/></summary><p className="border-t border-[#06283f12] pb-6 pt-4 leading-7 text-[#59707c]">{answer}</p></details>)}</div>
      {!filtered.length&&<div className="mt-12 rounded-3xl border border-dashed border-[#06283f33] p-10 text-center text-[#59707c]"><HelpCircle className="mx-auto mb-3"/>Aramanızla eşleşen bir soru bulunamadı.</div>}
    </div>
  </section>
}
