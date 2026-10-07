export type LegalPageKey = 'kvkk' | 'gizlilik' | 'cerez-politikasi' | 'erisilebilirlik' | 'aydinlatma-metni'

export type LegalPageContent = {
  title: string
  eyebrow: string
  description: string
  updatedAt: string
  sections: {title: string; body: string}[]
}

export const legalPages: Record<LegalPageKey, LegalPageContent> = {
  kvkk: {
    eyebrow: 'Kişisel Veriler',
    title: 'KVKK Başvuru ve Veri İşleme Bilgilendirmesi',
    description: 'Muğla Bütçe Senin platformunda toplanan kişisel verilerin hangi amaçlarla işlendiğine dair özet bilgilendirme.',
    updatedAt: '7 Ekim 2026',
    sections: [
      {title: 'Amaç', body: 'Platform; vatandaş kaydı, proje başvurusu, oylama, iletişim talepleri ve belediye değerlendirme süreçlerinin yürütülmesi için gerekli bilgileri işler.'},
      {title: 'İşlenen Veri Kategorileri', body: 'Kimlik ve iletişim bilgileri, başvuru içeriği, ilçe/mahalle bilgisi, panel işlem kayıtları ve kullanıcının açıkça paylaştığı ek dosya bilgileri süreç kapsamında kullanılabilir.'},
      {title: 'Saklama ve Güvenlik', body: 'Veriler yalnızca katılımcı bütçe sürecinin gerektirdiği süre boyunca saklanmalı; üretim ortamında yetki, denetim kaydı ve erişim politikaları belediye güvenlik standartlarıyla güçlendirilmelidir.'},
      {title: 'Haklarınız', body: 'KVKK kapsamındaki başvuru, düzeltme, silme ve bilgi alma talepleri için belediyenin resmi iletişim kanalları veya bu platformdaki iletişim formu kullanılabilir.'},
    ],
  },
  gizlilik: {
    eyebrow: 'Gizlilik',
    title: 'Gizlilik Politikası',
    description: 'Platformu kullanan vatandaşların ve belediye yetkililerinin verilerinin nasıl korunduğunu açıklar.',
    updatedAt: '7 Ekim 2026',
    sections: [
      {title: 'Kapsam', body: 'Bu politika; kamuya açık sayfaları, vatandaş panelini, belediye yönetim panelini, CRM ekranlarını ve proje başvuru akışlarını kapsar.'},
      {title: 'Kullanım', body: 'Veriler başvuruları değerlendirmek, oylama süreçlerini işletmek, sonuçları raporlamak, geri bildirimlere yanıt vermek ve yetkili panel işlemlerini izlemek için kullanılır.'},
      {title: 'Paylaşım', body: 'Kişisel veriler kamuya açık proje listelerinde gösterilmez. Yetkili birimler yalnızca görevleriyle ilgili verilere erişmelidir.'},
      {title: 'Teknik Önlemler', body: 'Canlı kullanım öncesinde sunucu tarafı yetkilendirme, güvenli oturum yönetimi, oran sınırlama, denetim kayıtları ve veritabanı erişim kuralları tamamlanmalıdır.'},
    ],
  },
  'cerez-politikasi': {
    eyebrow: 'Çerezler',
    title: 'Çerez Politikası',
    description: 'Platformda kullanılan zorunlu oturum ve tercih kayıtlarına dair bilgilendirme.',
    updatedAt: '7 Ekim 2026',
    sections: [
      {title: 'Zorunlu Kayıtlar', body: 'Giriş oturumu, dil tercihi, sepet/oylama akışı ve panel görünürlüğü gibi temel işlevler için tarayıcıda zorunlu kayıtlar tutulabilir.'},
      {title: 'Analitik ve İzleme', body: 'Bu kod tabanında varsayılan olarak üçüncü taraf pazarlama çerezi kurulmamıştır. Üretimde analitik eklenecekse açık bilgilendirme ve gerekli izin mekanizması sağlanmalıdır.'},
      {title: 'Kontrol', body: 'Kullanıcılar tarayıcı ayarlarından çerezleri silebilir. Zorunlu kayıtların silinmesi oturumun kapanmasına veya başvuru taslaklarının kaybolmasına neden olabilir.'},
    ],
  },
  erisilebilirlik: {
    eyebrow: 'Erişilebilirlik',
    title: 'Erişilebilirlik Beyanı',
    description: 'Muğla Bütçe Senin hizmetinin erişilebilir ve kapsayıcı kullanım hedeflerini belirtir.',
    updatedAt: '7 Ekim 2026',
    sections: [
      {title: 'Hedef', body: 'Platform; klavye ile gezilebilir, okunabilir kontrasta sahip, açık başlık yapısı bulunan ve mobil cihazlarda kullanılabilir bir kamu hizmeti arayüzü olmayı hedefler.'},
      {title: 'Kapsayıcı İçerik', body: 'Proje başvuruları, oylama ve sonuç ekranlarında sade dil, anlamlı bağlantı metinleri ve hata durumlarında anlaşılır geri bildirim sağlanmalıdır.'},
      {title: 'Bildirim', body: 'Erişilebilirlik sorunu yaşayan kullanıcılar iletişim sayfasından geri bildirim gönderebilir. Bildirimler belediye ekiplerince değerlendirilmelidir.'},
    ],
  },
  'aydinlatma-metni': {
    eyebrow: 'Aydınlatma',
    title: 'Katılımcı Bütçe Aydınlatma Metni',
    description: 'Başvuru, değerlendirme, oylama ve uygulama izleme süreçlerine ilişkin kamuoyu bilgilendirmesi.',
    updatedAt: '7 Ekim 2026',
    sections: [
      {title: 'Süreç', body: 'Katılımcı bütçe süreci fikir toplama, ön değerlendirme, teknik/mali inceleme, oylama, sonuç ilanı ve uygulama izleme adımlarından oluşur.'},
      {title: 'Başvuru İçeriği', body: 'Başvuru sahipleri proje amacı, hedef kitle, konum, tahmini bütçe, beklenen sonuçlar ve varsa ek dokümanları platform üzerinden iletebilir.'},
      {title: 'Yayın İlkesi', body: 'Kamuya açık proje sayfalarında kişisel başvuru sahibi bilgileri yerine proje içeriği, ilçe, durum, bütçe ve uygulama bilgileri gösterilir.'},
      {title: 'Sorumluluk', body: 'Bu sayfa ürün içi bilgilendirme metnidir; nihai hukuki metinler belediyenin yetkili hukuk ve veri koruma birimlerince onaylanmalıdır.'},
    ],
  },
}
