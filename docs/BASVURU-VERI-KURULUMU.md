# Vatandas basvurusu ve belediye inceleme verisi

## Tespit edilen sorun

7 Ekim 2026 kontrolunde `api.muglabutcesenin.com` DNS ile cozumlenmedi.
Iki mevcut Vercel projesinde `/api/projects` `synced:false` dondurdu.
Eski API kalici veritabani yokken islem bellegine yazip basarili yanit
veriyordu. Bu kayitlar farkli sunucular ve uygulamalar arasinda paylasilmiyordu.
Form da sunucu aktarimi hatasini yakalayip yerel kaydi basarili kabul ediyordu.

## Yeni akis

1. Form basvuru sahibini ve form alanlarini toplar; tekrar denemelerde ayni UUID kullanilir.
2. `/api/projects` adresine `{action: "submit", project: ...}` gonderilir.
3. Sunucu basvuru sahibi, yil ve zorunlu alanlari kontrol eder.
4. Veritabani tek islemde yillik limiti kontrol eder, basvuru numarasini verir
   ve `Basvuru / Bekliyor / Ilce Admin Incelemesinde` durumunda kaydeder.
5. Yalnizca `persisted:true` ve sunucunun verdigi basvuru numarasi basari sayilir.
6. Vatandas sayaci ve belediye inceleme listesi ayni kayitlari `/api/projects`
   uzerinden okur. Bes saniyede bir, pencere odaklandiginda ve ag geri
   geldiginde yenilenir. Listeyi okumak kayitlari tekrar yazmaz.

Projelerin tarayici onbellegi kalici sunucu kaydinin yerine gecmez.
Yeni basvurular basarili sunucu yanitindan once onbellege kabul edilmez.
Eski yerel basvurular sunucuda bulunamiyorsa vatandas panelinde
"Gonderimi tamamlanmamis basvurular" listesine alinir. "Tekrar gonder"
dugmesi bunlari gercek kayit akisi ile merkeze gonderir. Ayni UUID tekrar
gonderildiginde kayit veya sayaç cogalmaz; onaylanmis kayit incelemeye geri donmez.

## Canli Supabase baglantisi

Mevcut Supabase hesabi/projesi ve Vercel ortam ayarlarina erisim olmadan
canli veritabani olusturulmus veya baglanmis kabul edilmez.

1. Ortak bir Supabase projesi secin.
2. SQL Editor'de once `supabase/project-records.sql`, sonra
   `supabase/project-submissions.sql` dosyasini uygulayin. Yeni bir proje
   kuruyorsaniz mevcut kullanici, iletisim ve tema akislari icin
   `supabase/citizen-records.sql`, `supabase/contact-records.sql` ve
   `supabase/annual-theme-settings.sql` dosyalarini da uygulayin.
3. Vercel'de `muglaseninbutcen` ve `mugla-senin-butcen` projelerinin Production
   ortamlarina ayni `NEXT_PUBLIC_SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY`
   degerlerini tanimlayin. Mevcut diger Supabase istemcileri icin ayni projeye
   ait `NEXT_PUBLIC_SUPABASE_ANON_KEY` kullanin.
4. `NEXT_PUBLIC_API_BASE_URL` bos birakilirsa her uygulama kendi `/api` yolunu
   kullanir; ortak Supabase projesi sayesinde kayitlar ayni veritabanina gider.
   Ayri API sunucusu gerekiyorsa bu degiskene kok HTTPS adresini yazin;
   sunucunun `PROJECTS_ALLOWED_ORIGINS` alanina vatandas ve belediye sitelerinin
   tam origin adreslerini ekleyin.
5. Ortam degiskenleri eklendikten sonra Vercel'de yeniden deploy edin.
6. Her iki uygulamada `/api/projects/health` HTTP 200 ve
   `{"ok":true,"persisted":true,"storage":"supabase",...}` donmelidir.
7. Vatandas basvurusu sonrasi belediyede Proje merkezi > Onay Bekleyen listesini kontrol edin.

Vercel'de veritabani eksikse POST ve GET HTTP 503 doner. Islem bellegine
yazilmaz; sahte bir basvuru numarasi veya basari ekrani uretilmez.
Gizli service role anahtari sadece sunucuda tutulur; `NEXT_PUBLIC_` oneki ile
tanımlanmamalidir. RPC yalnizca `service_role` icin calistirilabilir.

## Yerel calisma ve test

Supabase ayari olmayan yerel gelistirmede `.data/project-records.json`
dosyasi kullanilir. Ayni yerel uygulama sunucusunun yeniden baslatilmasi
kayitlari silmez. Bu depo tek sunuculu gelistirme icindir; Vercel'de kullanilmaz.

- `npm.cmd run test:data`: veri katmani testleri.
- `npm.cmd run build`: Next.js ve TypeScript kontrolu.
- `npm.cmd run test:browser`: ayri tarayici oturumlari ile basvuru, basarisiz
  aktarim ve eski yerel basvuru kurtarma testleri. Windows'ta kurulu Chrome,
  diger ortamlarda Playwright Chromium kullanilir.

Tarayici testleri uretim derlemesini 3010 portunda calistirir ve ayri bir
`.data/e2e-*.json` deposu kullanir; gercek basvurulara yazmaz.

## Sinirlar

Bu duzeltme kayit kaliciligini ve basvuru aktarimini kapsar. Depodaki mevcut
yerel kimlik dogrulama modeli ve genel proje guncelleme API'si ayri bir
sunucu oturumu/rol denetimi gelistirmesi gerektirir. Istemciye ait ownerId
kimlik dogrulama yerine gecmez. Mevcut IndexedDB ek dosyalari da belediyeye
ortak dosya deposundan sunulmamaktadir; bu degisiklik dosya icerigi aktarimi
kuruldugu iddiasinda bulunmaz.

Referanslar: [Supabase RPC](https://supabase.com/docs/reference/javascript/rpc),
[Supabase veritabani fonksiyonlari](https://supabase.com/docs/guides/database/functions),
[Next.js 15 dinamik route ayari](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-segment-config).
