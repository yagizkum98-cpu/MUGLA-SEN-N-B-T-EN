# Butce Senin: referans ve Mugla uygulamasi

## Referans incelemesi

Inceleme tarihi: 7 Ekim 2026.

Kaynak: https://butcesenin.istanbul/oylamaya-katil

Arama indeksinde dogrulanan ana menu basliklari: Secilen Projeler,
Butcem Istanbul, Oylamaya Katil, S.S.S., Butcem Istanbul Oylama Kilavuzu,
Iletisim ve Giris Yap. Ana icerige git baglantisi da gorunuyor.

Proje detay adresi ornegi: https://butcesenin.istanbul/projeler/detay/56052704

Canli site bu oturumda web aracinda 502, dogrudan HTTP istemcisinde baglanti
hatasi verdi. Menu basliklari ve detay adresi indeks kayitlarindan alindi.
Menu basliklarinin tamamini hedef URL'leriyle dogrulamak mumkun olmadi.
Asagidaki adresler Mugla uygulamasi icin belirlenen yerel adreslerdir.
Referans sitenin sunucu kodu, veritabani, kimlik dogrulama ve oy isleme
sistemi kamuya acik sayfalardan belirlenemez. Bu belgede bu bilesenler
referanstan cikartilmis gercekler olarak sunulmaz.

## Sayfa ve yonlendirme haritasi

| Kullanici adimi | Mugla adresi | Davranis |
| --- | --- | --- |
| Ana sayfa | `/` | Platformun kamuya acik girisi |
| Secilen projeler | `/secilen-projeler` | Onayli kazanan ve uygulama projeleri; ilce/yil/arama filtreleri |
| Surec | `/nasil-isler` | Basvuru, inceleme, oylama ve uygulama |
| Tum projeler | `/projeler` | Mevcut proje arama ve filtreleme |
| Oylama | `/oylamaya-katil` | `/projeler#oy-ver` yonlendirmesi |
| Sonuclar | `/sonuclar` | `/projeler#sonuclar`; kazananlar sekmesini acar |
| Proje ayrintisi | `/projeler/{baslik}-{id}` | Yayindaki proje; UUID kimligi korunur |
| Eski detay adresi | `/projeler/detay/{id}` | `/projeler/{id}`; kimlik veya proje koduyla bulma |
| Kilavuz | `/oylama-kilavuzu` | Giris, inceleme, sepet ve onay adimlari |
| S.S.S. | `/sss` | Mevcut soru ve cevaplar |
| Iletisim | `/iletisim` | Mevcut iletisim kaydi akisi |
| Basvuru | `/fikir-gonder` | Mevcut proje basvuru formu |
| Giris / kayit | `/giris`, `/kayit` | Giris sonrasi `next` adresine donus |
| Vatandas paneli | `/vatandas/panel` | Basvurular, sepet, oylar ve profil |
| Kitapcik | `/kitapcik` | Mevcut dokuman sayfasi |
| Yasal sayfalar | `/kvkk`, `/aydinlatma-metni`, `/gizlilik`, `/cerez-politikasi`, `/erisilebilirlik` | Ortak alt menuden erisim |

Uyumluluk adresleri `next.config.mjs` icindedir. `/home`,
`/butcem-istanbul`, `/butcem-mugla`, `/secilmis-projeler`,
`/proje-ekle` ve `/sikca-sorulan-sorular` da mevcut sayfalara yonlenir.
Yonlendirmeler 307'dir; tarayicida kalici olarak onbellege alinmaz.

Ana menu ve yasal baglantilar `lib/site-navigation.ts` uzerinden yonetilir.
`components/public-site-shell.tsx` kamuya acik sayfalarda ortak menu,
mobil menu, ana icerik baglantisi ve alt menuyu saglar. Yonetim ve vatandas
panelleri kendi arayuzlerini kullanir.

## Mevcut veri sistemi

| Bilesen | Istemci | HTTP yolu | Saklama |
| --- | --- | --- | --- |
| Projeler | `lib/projects-store.ts` | `/api/projects` | Supabase `project_records` |
| Oylama tanimlari | `app/admin/page.tsx` | `/api/votings` | `project_records` icinde ozel kayit |
| Vatandas kayitlari | `lib/local-auth.ts` | `/api/citizen-records` | Supabase `citizen_records` |
| Iletisim | `lib/contact-store.ts` | `/api/contact-records` | Supabase `contact_records` |
| Yillik temalar | `lib/annual-themes.ts` | `/api/annual-themes` | Supabase `annual_theme_settings` |
| Duyurular / etkinlikler | `lib/civic-updates.ts` | `/api/civic-updates` | `project_records` icinde ozel kayit |
| Yonetici kayitlari | `lib/admin-auth.ts` | `/api/admin-accounts` | `project_records` icinde ozel kayit |
| Oy sepeti / onay | `lib/vote-basket.ts` | Ayri oy onay API'si yok | Tarayici `localStorage` |

Proje listesi ve secilen projeler ayni `useProjects` veri kaynagini kullanir.
Secilen projelerde `Yilin Kazanan Adayi` kesin kazanan olarak gosterilmez.
Yayina onaylanmamis projeler kamuya acik ayrinti ekraninda gosterilmez;
basvuru sahibinin menu baglantisi kendi paneline gider. Bu gorunum filtresi
sunucu tarafinda yetkilendirme yerine gecmez.

Supabase yapilandirilmazsa API'ler bellekte gecici kayit tutar ve
`synced: false` dondurur. Sunucu yeniden baslatildiginda bu kayitlar kaybolur.
Tarayicidaki yerel kayitlar farkli cihazlar arasinda kalicilik saglamaz.
Prisma semasi depoda bulunur; mevcut proje ve sepet akisi Prisma uzerinden
calismaz. Veritabani semasinin bulunmasi baglantinin aktif oldugu anlamina gelmez.

## Yerel kurulum

1. `npm.cmd ci` ile kilit dosyasindaki paketleri kurun.
2. `.env.example` alanlarini `.env.local` icinde kendi degerlerinizle tanimlayin.
3. Supabase SQL Editor'de `supabase/project-records.sql`,
   `supabase/citizen-records.sql`, `supabase/contact-records.sql` ve
   `supabase/annual-theme-settings.sql` dosyalarini inceleyip uygulayin.
4. `npm.cmd run build` ile derlemeyi kontrol edin.
5. `npm.cmd run dev -- -p 3001` ile uygulamayi acin.
6. `npm.cmd run check:navigation -- http://localhost:3001` ile sayfalari ve
   yonlendirmeleri kontrol edin. Bu komut Node.js 22.18 veya ustunu gerektirir.

Yerel ortamda kamu, vatandas ve yonetim baglantilari ayni sunucuda kalir.
Ana sayfa yerelde yonetim girisine yonlenmez. Uzak alan adlari
`lib/domain-routing.ts` icindeki mevcut Vercel/API alan adlaridir.

## Gercek hizmete gecis icin eksik bilesenler

Bu degisiklik gezinme ve sayfa altyapisini kurar. Mevcut uygulamanin
asagidaki islevleri ayrica sunucu tarafina tasinmalidir:

- Kimlik dogrulama, oturum ve rol denetimi: mevcut yerel oturum ve istemci
  tabanli giris modeli yeterli bir sunucu yetkilendirmesi saglamiyor.
- Oy onayi: sunucuda tek islemle kayit, kullanici/donem/proje tekilligi,
  oy limiti ve aktif takvim denetimi gerekir. Mevcut sepet limiti 5'tir;
  yonetici ekranindaki 1/3/5 ayari sepete bagli degildir.
- Takvim: proje listesinde mevcut sabit 2026 tarihleri ve proje durumundan
  hesaplanan oylama acikligi, yonetim oylama kayitlariyla birlestirilmelidir.
- API'lerde ozel/kamu verisi ayrimi ve yazma yetkisi sunucuda uygulanmalidir.
  CORS alan adi listesi kimlik dogrulama degildir.
- E-posta/SMS aktivasyonu icin gercek servis baglantisi gerekir.

Bu servisler kurulmus veya referans siteden elde edilmis gibi gosterilmez.
Uzak veritabanina bu oturumda migration veya veri yazma islemi yapilmadi.
