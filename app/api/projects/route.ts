import {NextResponse} from 'next/server'
import {projectRepository, ProjectRepositoryError, type StoredProject} from '@/lib/server/project-repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const allowedOrigins = [
  'https://muglaseninbutcen.vercel.app', 'https://mugla-senin-butcen.vercel.app',
  'https://muglabutcesenin.vercel.app', 'https://muglabutcesenin-vatandas.vercel.app',
  'https://muglabutcesenin-belediye.vercel.app', 'https://muglabutcesenin-crm.vercel.app',
  'https://muglabutcesenin-superadmin.vercel.app',
]

function headers(request: Request) {
  const origin = request.headers.get('origin') || ''
  const allowed = [...allowedOrigins, new URL(request.url).origin, ...(process.env.PROJECTS_ALLOWED_ORIGINS || '').split(',').map(value => value.trim())]
  return {
    ...(allowed.includes(origin) ? {'Access-Control-Allow-Origin': origin} : {}),
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store', 'Vary': 'Origin',
  }
}
function failure(cause: unknown, request: Request) {
  const status = cause instanceof ProjectRepositoryError ? cause.status : 500
  const error = cause instanceof ProjectRepositoryError ? cause.message : 'Proje işlemi tamamlanamadı.'
  return NextResponse.json({error, persisted: false, synced: false}, {status, headers: headers(request)})
}
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {status: 204, headers: headers(request)})
}
export async function GET(request: Request) {
  try { return NextResponse.json(await projectRepository().list(), {headers: headers(request)}) }
  catch (cause) { return failure(cause, request) }
}
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => { throw new ProjectRepositoryError('Başvuru verisi geçersiz.', 400) })
    const repository = projectRepository()
    if (body?.action === 'submit') return NextResponse.json(await repository.submit(body.project), {headers: headers(request)})
    const project = body?.project
    if (!project || typeof project !== 'object' || Array.isArray(project)) throw new ProjectRepositoryError('Proje verisi geçersiz.', 400)
    for (const field of ['id', 'projectCode', 'title', 'district', 'category', 'status', 'moderationStatus', 'createdAt']) {
      if (typeof project[field] !== 'string' || !project[field].trim()) throw new ProjectRepositoryError(`${field} alanı zorunlu.`, 400)
    }
    return NextResponse.json(await repository.upsert(project as StoredProject), {headers: headers(request)})
  } catch (cause) { return failure(cause, request) }
}
export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) throw new ProjectRepositoryError('Proje kimliği zorunlu.', 400)
    return NextResponse.json(await projectRepository().remove(id), {headers: headers(request)})
  } catch (cause) { return failure(cause, request) }
}
