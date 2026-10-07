import {NextResponse} from 'next/server'
import {projectRepository, ProjectRepositoryError} from '@/lib/server/project-repository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    return NextResponse.json(await projectRepository().health(), {headers: {'Cache-Control': 'no-store'}})
  } catch (cause) {
    return NextResponse.json({ok: false, persisted: false, error: cause instanceof ProjectRepositoryError ? cause.message : 'Proje veritabanına erişilemiyor.'}, {status: 503, headers: {'Cache-Control': 'no-store'}})
  }
}
