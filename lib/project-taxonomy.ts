export const projectCategories=[
  ['Ulaşım','#ef7d00'],
  ['İklim ve Çevre','#6a9d3b'],
  ['Sosyal Yaşam','#00a6c8'],
  ['Eğitim','#7c5bcc'],
  ['Kültür ve Sanat','#d946ef'],
  ['Spor','#2563eb'],
  ['Turizm','#0891b2'],
  ['Diğer','#64748b'],
] as const

export type ProjectCategory=typeof projectCategories[number][0]

export const projectSubcategories:Record<ProjectCategory,string[]>={
  'Ulaşım':['Toplu Taşıma','Otobüs Durakları','Minibüs / Dolmuş','Deniz Ulaşımı','Akıllı Ulaşım Sistemleri','Trafik Yönetimi','Akıllı Kavşaklar','Otopark','Katlı Otopark','Bisiklet Yolları','Bisiklet Parkları','Elektrikli Araç Şarj İstasyonları','Scooter ve Mikro Mobilite','Yaya Yolları','Engelli Ulaşımı','Yol Bakım ve Asfalt','Kavşak Düzenlemeleri','Trafik Güvenliği','Köprü / Alt Geçit / Üst Geçit','Kırsal Ulaşım','Deniz Taksi / Su Ulaşımı','Diğer'],
  'İklim ve Çevre':['Atık Yönetimi','Geri Dönüşüm','Sıfır Atık','Kompost','Temizlik Hizmetleri','Deniz Temizliği','Dere ve Kanal Temizliği','Hava Kalitesi','Gürültü Kirliliği','Yeşil Alanlar','Ağaçlandırma','Park ve Bahçeler','Yağmur Suyu Yönetimi','Yenilenebilir Enerji','Güneş Enerjisi','İklim Değişikliği','Su Tasarrufu','Biyolojik Çeşitlilik','Sokak Hayvanları','Tarım ve Kırsal Çevre','Diğer'],
  'Sosyal Yaşam':['Kadın Hizmetleri','Çocuk Hizmetleri','Yaşlı Destek Hizmetleri','Engelli Hizmetleri','Gençlik','Aile Destek Programları','Sosyal Yardımlar','Mahalle Yaşamı','Halk Sağlığı','Psikolojik Destek','Gıda Destekleri','Toplum Merkezleri','Gönüllülük','Dijital Belediyecilik','Vatandaş Katılımı','Afet ve Acil Durum','Güvenlik','Diğer'],
  'Eğitim':['Okul Destekleri','Kütüphaneler','Etüt Merkezleri','Dijital Eğitim','Meslek Edindirme','Yaşam Boyu Eğitim','STEM Eğitimleri','Yaz Okulları','Kodlama','Yapay Zeka','Robotik','Girişimcilik','Kariyer Destekleri','Burs Programları','Eğitim Teknolojileri','Çocuk Atölyeleri','Gençlik Akademileri','Diğer'],
  'Kültür ve Sanat':['Kültür Merkezleri','Müzeler','Kütüphaneler','Sanat Galerileri','Tiyatro','Sinema','Konser','Festival','Sergi','Halk Dansları','Yerel Kültür','Somut Kültürel Miras','Dijital Kültür','Sokak Sanatları','Sanat Atölyeleri','Kültür Rotaları','Turizm Entegrasyonu','Diğer'],
  'Spor':['Spor Tesisleri','Açık Spor Alanları','Yüzme Havuzları','Fitness Alanları','Bisiklet Sporları','Koşu Parkurları','Yürüyüş Rotaları','Çocuk Spor Alanları','Amatör Spor Kulüpleri','Su Sporları','Engelli Sporları','Gençlik Sporları','Turnuvalar','E-Spor','Spor Etkinlikleri','Diğer'],
  'Turizm':['Tanıtım Faaliyetleri','Dijital Turizm','Turizm Rotaları','Gastronomi','Kırsal Turizm','Ekoturizm','Kültür Turizmi','Deniz Turizmi','Kamp ve Karavan','Bisiklet Turizmi','Yürüyüş Rotaları','Likya Yolu','Akıllı Turizm','QR Rehber Sistemleri','Ziyaretçi Deneyimi','Turizm Etkinlikleri','Konaklama','Yat Limanları','Diğer'],
  'Diğer':['Teknoloji','Akıllı Şehir','Ekonomi','İstihdam','Tarım','Hayvancılık','Balıkçılık','Kentsel Tasarım','İmar','Kentsel Dönüşüm','Afet Yönetimi','Sağlık','Kamu Hizmetleri','Belediye Hizmetleri','Enerji','Dijital Dönüşüm','Girişimcilik','İnovasyon','Yerel Kalkınma','Diğer'],
}

export function subcategoriesFor(category:string){
  return projectSubcategories[category as ProjectCategory]??projectSubcategories['Diğer']
}
