/** @type {import('next').NextConfig} */
const nextConfig = {
  // Windows'ta açık geliştirme süreci üretim önbelleğini kilitleyebiliyor.
  // Dev ve production çıktılarını ayırarak eksik vendor chunk hatalarını önler.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
}

export default nextConfig
