export const publicNavigation = [
  {href: '/secilen-projeler', label: 'Seçilen Projeler'},
  {href: '/nasil-isler', label: 'Bütçem Muğla'},
  {href: '/projeler', label: 'Tüm Projeler'},
  {href: '/oylamaya-katil', label: 'Oylamaya Katıl'},
  {href: '/sss', label: 'S.S.S.'},
  {href: '/oylama-kilavuzu', label: 'Oylama Kılavuzu'},
  {href: '/iletisim', label: 'İletişim'},
] as const

export const legalNavigation = [
  {href: '/kvkk', label: 'KVKK'},
  {href: '/aydinlatma-metni', label: 'Aydınlatma Metni'},
  {href: '/gizlilik', label: 'Gizlilik'},
  {href: '/cerez-politikasi', label: 'Çerez Politikası'},
  {href: '/erisilebilirlik', label: 'Erişilebilirlik'},
] as const

export function isPublicPage(pathname: string) {
  return pathname === '/' || pathname === '/fikir-gonder' || pathname === '/kitapcik' ||
    pathname === '/projeler' || pathname.startsWith('/projeler/') ||
    publicNavigation.some(item => item.href === pathname) || legalNavigation.some(item => item.href === pathname)
}
