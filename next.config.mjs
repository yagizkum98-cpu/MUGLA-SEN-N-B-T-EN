/** @type {import('next').NextConfig} */
const nextConfig = {
  // Windows'ta açık geliştirme süreci üretim önbelleğini kilitleyebiliyor.
  // Dev ve production çıktılarını ayırarak eksik vendor chunk hatalarını önler.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  async redirects() {
    return [
      {source: '/home', destination: '/', permanent: false},
      {source: '/butcem-istanbul', destination: '/nasil-isler', permanent: false},
      {source: '/butcem-mugla', destination: '/nasil-isler', permanent: false},
      {source: '/oylamaya-katil', destination: '/projeler#oy-ver', permanent: false},
      {source: '/secilmis-projeler', destination: '/secilen-projeler', permanent: false},
      {source: '/proje-ekle', destination: '/fikir-gonder', permanent: false},
      {source: '/sikca-sorulan-sorular', destination: '/sss', permanent: false},
      {source: '/projeler/detay/:id', destination: '/projeler/:id', permanent: false},
      {source: '/nasil-calisir', destination: '/nasil-isler', permanent: false},
      {source: '/oy-ver', destination: '/projeler#oy-ver', permanent: false},
      {source: '/sonuclar', destination: '/projeler#sonuclar', permanent: false},
      {source: '/kazanan-projeler', destination: '/projeler#sonuclar', permanent: false},
      {source: '/kayit', destination: '/giris?mode=register', permanent: false},
      {source: '/sifremi-unuttum', destination: '/giris', permanent: false},
      {source: '/cerez', destination: '/cerez-politikasi', permanent: false},
      {source: '/cerezler', destination: '/cerez-politikasi', permanent: false},
      {source: '/gizlilik-politikasi', destination: '/gizlilik', permanent: false},
      {source: '/kvkk-aydinlatma-metni', destination: '/aydinlatma-metni', permanent: false},
      {source: '/erisilebilirlik-beyani', destination: '/erisilebilirlik', permanent: false},
      {source: '/vatandas/basvurularim', destination: '/vatandas/panel#oylar', permanent: false},
      {source: '/vatandas/basvurularim/yeni', destination: '/fikir-gonder', permanent: false},
      {source: '/vatandas/oylama', destination: '/projeler', permanent: false},
      {source: '/vatandas/oylarim', destination: '/vatandas/panel#oylar', permanent: false},
      {source: '/vatandas/bildirimler', destination: '/vatandas/panel#profil', permanent: false},
      {source: '/vatandas/profil', destination: '/vatandas/panel#profil', permanent: false},
      {source: '/yonetim', destination: '/admin', permanent: false},
      {source: '/yonetim/:path*', destination: '/admin', permanent: false},
    ]
  },
}

export default nextConfig
