import {NextResponse} from 'next/server'

function encodeState(value: {next: string}) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

async function authorizationEndpoint(issuer: string) {
  try {
    const response = await fetch(`${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`, {cache: 'no-store'})
    if (response.ok) {
      const config = await response.json()
      if (typeof config.authorization_endpoint === 'string') return config.authorization_endpoint
    }
  } catch {}
  return `${issuer.replace(/\/$/, '')}/authorize`
}

export async function GET(request: Request) {
  const source = new URL(request.url)
  const requested = source.searchParams.get('next') ?? '/vatandas/panel'
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/vatandas/panel'
  const issuer = process.env.EDEVLET_OIDC_ISSUER
  const client = process.env.EDEVLET_CLIENT_ID

  if (!issuer || !client) return NextResponse.redirect(new URL(`/auth/edevlet/login?next=${encodeURIComponent(next)}`, request.url))

  const redirectUrl = new URL('/api/auth/edevlet/callback', request.url)
  const url = new URL(await authorizationEndpoint(issuer))
  url.searchParams.set('client_id', client)
  url.searchParams.set('redirect_uri', redirectUrl.toString())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid profile email phone')
  url.searchParams.set('state', encodeState({next}))
  return NextResponse.redirect(url)
}
