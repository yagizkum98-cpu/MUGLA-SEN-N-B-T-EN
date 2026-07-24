export const projectCategories=[
  ['Ulaşım','#ef7d00'],
  ['Çevre ve İklim Değişikliği','#6a9d3b'],
  ['Su Yönetimi','#0284c7'],
  ['Tarım','#65a30d'],
  ['Hayvan Hakları','#f59e0b'],
  ['Yeşil Alan Yönetimi','#16a34a'],
  ['İmar ve Şehircilik','#9333ea'],
  ['Sosyal Yaşam','#00a6c8'],
  ['Engelsiz Yaşam','#0f766e'],
  ['Spor','#2563eb'],
  ['Eğitim','#7c3aed'],
  ['Kültürel Miras ve Eşsiz Yaşam','#0891b2'],
  ['Afet ve Risk Yönetimi','#dc2626'],
  ['Yapay Zeka ve Dijitalleşme','#0ea5e9'],
  ['Katılımcı ve Yenilikçi Yönetim','#14b8a6'],
  ['Diğer','#64748b'],
] as const

export type ProjectCategory=typeof projectCategories[number][0]

export const targetGroups=['Herkes','Çocuk','Engelli','Hayvanlar','Kadınlar','Gençler','65 Yaş Üstü'] as const
export type TargetGroup=typeof targetGroups[number]

export const projectSubcategories:Record<ProjectCategory,string[]>={
  'Ulaşım':['Toplu Taşıma','Otobüs Durakları','Minibüs / Dolmuş','Deniz Ulaşımı','Akıllı Ulaşım Sistemleri','Trafik Yönetimi','Akıllı Kavşaklar','Otopark','Katlı Otopark','Bisiklet Yolları','Bisiklet Parkları','Elektrikli Araç Şarj İstasyonları','Scooter ve Mikro Mobilite','Yaya Yolları','Engelli Ulaşımı','Yol Bakım ve Asfalt','Kavşak Düzenlemeleri','Trafik Güvenliği','Köprü / Alt Geçit / Üst Geçit','Kırsal Ulaşım','Deniz Taksi / Su Ulaşımı','Diğer'],
  'Çevre ve İklim Değişikliği':['Atık Yönetimi','Geri Dönüşüm','Sıfır Atık','Kompost','Temizlik Hizmetleri','Deniz Temizliği','Dere ve Kanal Temizliği','Hava Kalitesi','Gürültü Kirliliği','Yeşil Alanlar','Ağaçlandırma','Park ve Bahçeler','Yağmur Suyu Yönetimi','Yenilenebilir Enerji','Güneş Enerjisi','İklim Değişikliği','Su Tasarrufu','Biyolojik Çeşitlilik','Sokak Hayvanları','Tarım ve Kırsal Çevre','Diğer'],
  'Su Yönetimi':['İçme Suyu','Su Tasarrufu','Yağmur Suyu Yönetimi','Dere ve Kanal Yönetimi','Atık Su','Gri Su Kullanımı','Sulama Sistemleri','Kıyı ve Deniz Suyu','Taşkın ve Sel Önleme','Su Kalitesi','Diğer'],
  'Tarım':['Tarımsal Üretim','Kooperatifler','Yerel Üretici Desteği','Sulama','Toprak Sağlığı','Seracılık','Arıcılık','Balıkçılık','Kırsal Kalkınma','Tarımsal Eğitim','Pazar ve Lojistik','Diğer'],
  'Hayvan Hakları':['Sokak Hayvanları','Barınaklar','Kısırlaştırma','Beslenme Odakları','Veteriner Hizmetleri','Sahiplendirme','Hayvan Refahı','Yaban Hayatı','Acil Müdahale','Farkındalık','Diğer'],
  'Yeşil Alan Yönetimi':['Park ve Bahçeler','Kent Ormanları','Ağaçlandırma','Peyzaj Yönetimi','Yeşil Koridorlar','Rekreasyon Alanları','Çocuk Parkları','Kıyı Yeşil Alanları','Bakım ve Sulama','Biyoçeşitlilik','Diğer'],
  'İmar ve Şehircilik':['İmar Planları','Kentsel Tasarım','Mekansal Planlama','Kentsel Dönüşüm','Kamusal Alan Tasarımı','Yapılaşma ve Ruhsat','Kent Estetiği','Sokak Sağlıklaştırma','Meydan Düzenlemeleri','Kıyı Planlaması','Diğer'],
  'Sosyal Yaşam':['Kadın Hizmetleri','Çocuk Hizmetleri','Yaşlı Destek Hizmetleri','Engelli Hizmetleri','Gençlik','Aile Destek Programları','Sosyal Yardımlar','Mahalle Yaşamı','Halk Sağlığı','Psikolojik Destek','Gıda Destekleri','Toplum Merkezleri','Gönüllülük','Dijital Belediyecilik','Vatandaş Katılımı','Afet ve Acil Durum','Güvenlik','Diğer'],
  'Engelsiz Yaşam':['Engelsiz Kamusal Alan','Erişilebilir Ulaşım','Engelli Hizmetleri','Dijital Erişilebilirlik','Erişilebilir Eğitim','Engelli Sporları','Bakım ve Destek Hizmetleri','İstihdam ve Sosyal Katılım','Farkındalık','Diğer'],
  'Spor':['Spor Tesisleri','Açık Spor Alanları','Yüzme Havuzları','Fitness Alanları','Bisiklet Sporları','Koşu Parkurları','Yürüyüş Rotaları','Çocuk Spor Alanları','Amatör Spor Kulüpleri','Su Sporları','Engelli Sporları','Gençlik Sporları','Turnuvalar','E-Spor','Spor Etkinlikleri','Diğer'],
  'Eğitim':['Okul Destekleri','Derslik ve Atölye','Kütüphane','Dijital Eğitim','Mesleki Eğitim','Yaşam Boyu Öğrenme','Çocuk Eğitim Programları','Gençlik Eğitimleri','Engelli Eğitim Erişimi','Bilim ve Teknoloji Atölyeleri','Diğer'],
  'Kültürel Miras ve Eşsiz Yaşam':['Kültür Merkezleri','Müzeler','Kütüphaneler','Sanat Galerileri','Tiyatro','Sinema','Konser','Festival','Sergi','Halk Dansları','Yerel Kültür','Somut Kültürel Miras','Dijital Kültür','Sokak Sanatları','Sanat Atölyeleri','Kültür Rotaları','Turizm Entegrasyonu','Kültürel Mirasın Korunması','Somut Olmayan Kültürel Miras','Yerel Bellek','Tarihi Yapılar','Gastronomi Mirası','Yerel Üretim','Ege ve Akdeniz Yaşamı','Doğa ve Kültür Deneyimi','Müze ve Arşiv','Tanıtım Faaliyetleri','Dijital Turizm','Turizm Rotaları','Gastronomi','Kırsal Turizm','Ekoturizm','Kültür Turizmi','Deniz Turizmi','Kamp ve Karavan','Bisiklet Turizmi','Yürüyüş Rotaları','Likya Yolu','Akıllı Turizm','QR Rehber Sistemleri','Ziyaretçi Deneyimi','Turizm Etkinlikleri','Konaklama','Yat Limanları','Diğer'],
  'Afet ve Risk Yönetimi':['Afet Hazırlığı','Risk Azaltma','Acil Durum Toplanma Alanları','Deprem Güvenliği','Yangınla Mücadele','Sel ve Taşkın Yönetimi','Erken Uyarı Sistemleri','Kriz Koordinasyonu','Gönüllü Afet Ekipleri','İklim Afetleri','Diğer'],
  'Yapay Zeka ve Dijitalleşme':['Yapay Zeka Uygulamaları','Akıllı Şehir Sistemleri','Açık Veri','Dijital Katılım','Mobil Uygulamalar','Veri Analitiği','Dijital Yetkinlik','Siber Güvenlik','Sensör ve IoT','Dijital Erişilebilirlik','Diğer'],
  'Katılımcı ve Yenilikçi Yönetim':['Katılımcı Bütçe','Mahalle Meclisleri','Ortak Akıl Çalışmaları','Şeffaflık ve Hesap Verebilirlik','Gönüllülük','Sivil Toplum İş Birliği','Sosyal İnovasyon','Hizmet Tasarımı','Yerel Demokrasi','Vatandaş Deneyimi','Diğer'],
  'Diğer':['Teknoloji','Akıllı Şehir','Ekonomi','İstihdam','Tarım','Hayvancılık','Balıkçılık','Kentsel Tasarım','İmar','Kentsel Dönüşüm','Afet Yönetimi','Sağlık','Kamu Hizmetleri','Belediye Hizmetleri','Enerji','Dijital Dönüşüm','Girişimcilik','İnovasyon','Yerel Kalkınma','Diğer'],
}

export function normalizeProjectCategory(category:string){
  return ['Turizm','Kültür ve Sanat','Kültürel Miras ve Turizm'].includes(category) ? 'Kültürel Miras ve Eşsiz Yaşam' : category
}

export function categoryColor(category:string){
  const normalized=normalizeProjectCategory(category)
  return projectCategories.find(item=>item[0]===normalized)?.[1]??'#64748b'
}

export function subcategoriesFor(category:string){
  return projectSubcategories[normalizeProjectCategory(category) as ProjectCategory]??projectSubcategories['Diğer']
}
