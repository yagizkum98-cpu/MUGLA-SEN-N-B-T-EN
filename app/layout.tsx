import type { Metadata } from 'next'
import { LanguageToggle } from '@/components/language-toggle'
import './style.css'
import './globals.css'

export const metadata: Metadata = { title: 'Muğla Bütçe Senin', description: 'Muğla Büyükşehir Belediyesi katılımcı bütçe platformu' }

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="tr"><body><LanguageToggle />{children}</body></html>
}
