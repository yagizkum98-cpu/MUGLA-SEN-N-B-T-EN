import {NextResponse} from 'next/server'

function decodeState(value: string | null) {
  if (!value) return {next: '/vatandas/panel'}
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    const next = typeof parsed.next === 'string' && parsed.next.startsWith('/') && !parsed.next.startsWith('//') ? parsed.next : '/vatandas/panel'
    return {next}
  } catch {
    return {next: '/vatandas/panel'}
  }
}

function encodeProfile(value: Record<string, string>) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

async function oidcConfig(issuer: string) {
  const fallback = issuer.replace(/\/$/, '')
  try {
    const response = await fetch(`${fallback}/.well-known/openid-configuration`, {cache: 'no-store'})
    if (response.ok) return await response.json()
  } catch {}
  return {token_endpoint: `${fallback}/token`, userinfo_endpoint: `${fallback}/userinfo`}
}

export async function GET(request: Request) {
  const source = new URL(request.url)
  const code = source.searchParams.get('code')
  const {next} = decodeState(source.searchParams.get('state'))
  const issuer = process.env.EDEVLET_OIDC_ISSUER
  const client = process.env.EDEVLET_CLIENT_ID
  const secret = process.env.EDEVLET_CLIENT_SECRET

  if (!code || !issuer || !client) {
    return NextResponse.redirect(new URL(`/auth/edevlet/complete?error=edevlet_callback&next=${encodeURIComponent(next)}`, request.url))
  }

  try {
    const config = await oidcConfig(issuer)
    const redirectUrl = new URL('/api/auth/edevlet/callback', request.url)
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: client,
      redirect_uri: redirectUrl.toString(),
    })
    if (secret) body.set('client_secret', secret)

    const tokenResponse = await fetch(config.token_endpoint, {
      method: 'POST',
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      body,
      cache: 'no-store',
    })
    if (!tokenResponse.ok) throw new Error('token_exchange_failed')
    const token = await tokenResponse.json()

    let userinfo: Record<string, string> = {}
    if (token.access_token && config.userinfo_endpoint) {
      const userResponse = await fetch(config.userinfo_endpoint, {
        headers: {authorization: `Bearer ${token.access_token}`},
        cache: 'no-store',
      })
      if (userResponse.ok) userinfo = await userResponse.json()
    }

    const profile = {
      externalId: String(userinfo.sub || token.sub || token.id_token || crypto.randomUUID()),
      name: String(userinfo.name || `${userinfo.given_name ?? ''} ${userinfo.family_name ?? ''}`.trim() || 'e-Devlet Kullanicisi'),
      email: String(userinfo.email || ''),
      phone: String(userinfo.phone_number || ''),
      identityReference: String(userinfo.tckn || userinfo.national_id || userinfo.sub || ''),
    }
    return NextResponse.redirect(new URL(`/auth/edevlet/complete?profile=${encodeURIComponent(encodeProfile(profile))}&next=${encodeURIComponent(next)}`, request.url))
  } catch {
    return NextResponse.redirect(new URL(`/auth/edevlet/complete?error=edevlet_exchange&next=${encodeURIComponent(next)}`, request.url))
  }
}
