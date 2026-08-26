import {NextResponse, type NextRequest} from 'next/server'

const SUPER_ADMIN_DOMAIN = 'muglabutcesenin-superadmin.vercel.app'
const CRM_DOMAIN = 'muglabutcesenin-crm.vercel.app'
const MUNICIPALITY_DOMAIN = 'muglabutcesenin-belediye.vercel.app'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0]
  const {pathname} = request.nextUrl

  if (host === SUPER_ADMIN_DOMAIN && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  if (host === CRM_DOMAIN && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/crm'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/crm/:path*'],
}
