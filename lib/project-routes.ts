import type {ProjectRecord} from '@/lib/projects-store'

export function slugifyProject(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function projectSlug(project: Pick<ProjectRecord, 'id' | 'projectCode' | 'title'>) {
  const readable = slugifyProject(project.title) || slugifyProject(project.projectCode) || 'proje'
  return `${readable}-${project.id}`
}

export function projectPath(project: Pick<ProjectRecord, 'id' | 'projectCode' | 'title'>) {
  return `/projeler/${projectSlug(project)}`
}

export function projectIdFromSlug(slug: string) {
  const uuid = slug.match(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i)
  if (uuid) return uuid[0]
  const parts = slug.split('-').filter(Boolean)
  return parts[parts.length - 1] ?? slug
}

export function matchesProjectRoute(project: Pick<ProjectRecord, 'id' | 'projectCode' | 'title'>, slug: string) {
  return project.id === slug || project.projectCode === slug || projectSlug(project) === slug || slug.endsWith(`-${project.id}`)
}

export function isSelectedProject(project: Pick<ProjectRecord, 'moderationStatus' | 'status' | 'workflowStatus'>) {
  return project.moderationStatus === 'Onaylandı' && project.status !== 'Yılın Kazanan Adayı' &&
    (project.workflowStatus === 'Kazandı' || ['İhale Aşamasında', 'Devam Ediyor', 'Tamamlandı'].includes(project.status))
}
