'use client'

import {useCallback,useEffect,useState} from 'react'
import {categoryColor, normalizeProjectCategory} from '@/lib/project-taxonomy'
import {createClient} from '@/lib/supabase/client'

export type ProjectStatus='Başvuru'|'İncelemede'|'Uygun'|'Oylamada'|'Yılın Kazanan Adayı'|'İhale Aşamasında'|'Devam Ediyor'|'Tamamlandı'|'Yapılamadı'|'Ertelendi'
export type ProjectModerationStatus='Bekliyor'|'Onaylandı'|'Reddedildi'
export type ProjectWorkflowStatus='Taslak'|'İlçe Admin İncelemesinde'|'Muğla BB İncelemesinde'|'Oylamaya Hazır'|'Oylamaya Sunulmadı'|'Yayında'|'Kazandı'|'Uygulanıyor'|'Tamamlandı'|'Revizyon İstendi'|'Eksik Belge'|'Reddedildi'

export type ProjectHistoryEntry={
  id:string
  date:string
  actor?:string
  action:string
  note?:string
}

export type ProjectRecord={
  id:string
  projectCode:string
  title:string
  shortDescription?:string
  category:string
  customTheme?:string
  subcategory?:string
  targetGroup?:string
  district:string
  country?:string
  countryCode?:string
  province?:string
  applicantDistrict?:string
  neighborhood?:string
  locationNote?:string
  budget:number
  financingSource?:string
  duration?:string
  priority?:string
  votes:number
  progress:number
  lat:number
  lng:number
  color:string
  status:ProjectStatus
  moderationStatus:ProjectModerationStatus
  workflowStatus?:ProjectWorkflowStatus
  createdAt:string
  createdByAdminId?:string
  createdByAdminName?:string
  source?:'citizen'|'municipality'
  purpose?:string
  summary?:string
  activities?:string
  expectedResults?:string
  attachments?:{name:string;size:number;type:string}[]
  image?:{name:string;size:number;type:string;dataUrl:string}
  videoUrl?:string
  socialImpact?:number
  environmentalImpact?:number
  economicImpact?:number
  accessibilityImpact?:number
  sustainabilityImpact?:number
  ownerId?:string
  ownerName?:string
  ownerEmail?:string
  applicantType?:string
  mergedFrom?:string[]
  mergeNote?:string
  processHistory?:ProjectHistoryEntry[]
}

export type NewProject=Omit<ProjectRecord,'id'|'projectCode'|'votes'|'progress'|'createdAt'|'moderationStatus'> & {moderationStatus?:ProjectModerationStatus}

const STORAGE_KEY='mugla-senin-butcen-projects-v1'
const CHANGE_EVENT='mugla-projects-changed'
const REMOTE_TABLE='project_records'
const SOCIAL_STOPS_CLEANUP_CUTOFF='2026-07-21T18:39:15.763Z'
const REMOVED_PROJECT_TITLES=['muğla sosyal duraklar','muğla sosyal duraklar projesi','mugla sosyal duraklar','mugla sosyal duraklar projesi','sosyal duraklar','sosyal duraklar projesi']

function normalizeText(value:unknown){
  return String(value??'').trim().toLocaleLowerCase('tr')
}

function hasApplicantData(project:Partial<ProjectRecord>){
  return Boolean(project.source==='citizen'||project.ownerId||project.ownerEmail||project.ownerName||project.applicantType||project.purpose||project.summary||project.activities||project.expectedResults||project.attachments?.length)
}

function isBeforeSocialStopsCleanup(project:Partial<ProjectRecord>){
  const createdAt=new Date(project.createdAt??'').getTime()
  return !Number.isFinite(createdAt)||createdAt<=new Date(SOCIAL_STOPS_CLEANUP_CUTOFF).getTime()
}

function isRemovedProject(project:Partial<ProjectRecord>&Pick<ProjectRecord,'title'>){
  const isLegacySocialStops=REMOVED_PROJECT_TITLES.includes(normalizeText(project.title))
  return isLegacySocialStops&&isBeforeSocialStopsCleanup(project)
}

function readProjects():ProjectRecord[]{
  if(typeof window==='undefined')return []
  try{
    const value=JSON.parse(localStorage.getItem(STORAGE_KEY)??'[]')
    return Array.isArray(value)?value.filter(project=>project?.title&&!isRemovedProject(project as ProjectRecord)):[]
  }catch{return []}
}

function mergeProjectsById(local:ProjectRecord[],remote:ProjectRecord[]){
  const map=new Map<string,ProjectRecord>()
  local.map(normalizeProject).forEach(project=>map.set(project.id,project))
  remote.map(normalizeProject).forEach(project=>map.set(project.id,project))
  return Array.from(map.values()).filter(project=>!isRemovedProject(project)).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
}

function saveLocalProjects(projects:ProjectRecord[]){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(projects))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

async function readRemoteProjects(){
  if(typeof window==='undefined')return null
  try{
    const{data,error}=await createClient().from(REMOTE_TABLE).select('data')
    if(error||!Array.isArray(data))return null
    return data.map(row=>row.data).filter(Boolean) as ProjectRecord[]
  }catch{return null}
}

async function upsertRemoteProjects(projects:ProjectRecord[]){
  if(typeof window==='undefined'||!projects.length)return
  try{
    await createClient().from(REMOTE_TABLE).upsert(projects.map(project=>({
      id:project.id,
      data:project,
      updated_at:new Date().toISOString(),
    })),{onConflict:'id'})
  }catch{}
}

async function deleteRemoteProject(id:string){
  if(typeof window==='undefined')return
  try{
    await createClient().from(REMOTE_TABLE).delete().eq('id',id)
  }catch{}
}

function projectYear(project:{createdAt?:string}){
  const year=new Date(project.createdAt??'').getFullYear()
  return Number.isFinite(year)?year:new Date().getFullYear()
}

function fallbackProjectCode(project:{id:string;createdAt?:string}){
  return `MSB-${projectYear(project)}-${project.id.replace(/[^a-z0-9]/gi,'').slice(0,6).toLocaleUpperCase('tr').padEnd(6,'0')}`
}

function nextProjectCode(projects:ProjectRecord[],createdAt:string){
  const year=projectYear({createdAt})
  const prefix=`MSB-${year}-`
  const used=new Set(projects.map(project=>project.projectCode??fallbackProjectCode(project)))
  let index=projects.filter(project=>(project.projectCode??fallbackProjectCode(project)).startsWith(prefix)).length+1
  let code=`${prefix}${String(index).padStart(4,'0')}`
  while(used.has(code)){
    index+=1
    code=`${prefix}${String(index).padStart(4,'0')}`
  }
  return code
}

function normalizeProject(project:ProjectRecord):ProjectRecord{
  const category=normalizeProjectCategory(project.category)
  const color=project.category===category&&project.color?project.color:categoryColor(category)
  const normalizedModerationStatus=normalizeModerationStatus(project)
  const isCitizenApplication=hasApplicantData(project)
  const needsProjectCenterIntake=isCitizenApplication&&!project.workflowStatus&&normalizedModerationStatus!=='Reddedildi'
  const workflowStatus=needsProjectCenterIntake?'İlçe Admin İncelemesinde':project.workflowStatus
  const status=needsProjectCenterIntake?'Başvuru':project.status
  const moderationStatus=needsProjectCenterIntake?'Bekliyor':isPendingReviewProject({...project,moderationStatus:normalizedModerationStatus,workflowStatus,status})?'Bekliyor':normalizedModerationStatus
  return {...project,category,color,projectCode:project.projectCode??fallbackProjectCode(project),moderationStatus,workflowStatus,status}
}

export function isPublishedProject(project:Pick<ProjectRecord,'moderationStatus'>){
  return !['Bekliyor','Reddedildi'].includes(String(project.moderationStatus))
}

export function isPendingReviewProject(project:Partial<ProjectRecord>){
  const moderationStatus=String(project.moderationStatus??'')
  const status=String(project.status??'')
  const workflowStatus=String(project.workflowStatus??'')
  if(moderationStatus==='Onaylandı'||moderationStatus==='Reddedildi')return false
  if(['İlçe Admin İncelemesinde','Muğla BB İncelemesinde','Revizyon İstendi','Eksik Belge'].includes(workflowStatus))return true
  return moderationStatus==='Bekliyor'||status.startsWith('Başvuru')
}

function normalizeModerationStatus(project:ProjectRecord):ProjectModerationStatus{
  const status=String(project.moderationStatus??'')
  if(status==='Bekliyor'||status==='Onaylandı'||status==='Reddedildi')return status
  const isCitizenApplication=isPendingReviewProject(project)||hasApplicantData(project)
  return isCitizenApplication?'Bekliyor':'Onaylandı'
}

export function useProjects(){
  const[projects,setProjects]=useState<ProjectRecord[]>([])
  const[ready,setReady]=useState(false)

  useEffect(()=>{
    const sync=()=>{setProjects(readProjects().map(normalizeProject));setReady(true)}
    const syncRemote=async()=>{
      const local=readProjects().map(normalizeProject)
      const remote=await readRemoteProjects()
      if(!remote){setProjects(local);setReady(true);return}
      const removedIds=[...local,...remote].filter(project=>isRemovedProject(project)).map(project=>project.id)
      const merged=mergeProjectsById(local,remote)
      saveLocalProjects(merged)
      setProjects(merged)
      setReady(true)
      if(merged.length)void upsertRemoteProjects(merged)
      removedIds.forEach(id=>void deleteRemoteProject(id))
    }
    sync()
    void syncRemote()
    window.addEventListener('storage',sync)
    window.addEventListener(CHANGE_EVENT,sync)
    return()=>{window.removeEventListener('storage',sync);window.removeEventListener(CHANGE_EVENT,sync)}
  },[])

  const save=useCallback((next:ProjectRecord[])=>{
    const normalized=next.filter(project=>!isRemovedProject(project)).map(normalizeProject)
    saveLocalProjects(normalized)
    setProjects(normalized)
    void upsertRemoteProjects(normalized)
  },[])

  const addProject=useCallback((input:NewProject)=>{
    const current=readProjects().map(normalizeProject)
    const createdAt=new Date().toISOString()
    const project:ProjectRecord={...input,projectCode:nextProjectCode(current,createdAt),moderationStatus:input.moderationStatus??'Bekliyor',id:crypto.randomUUID(),votes:0,progress:input.status==='Tamamlandı'?100:0,createdAt}
    save([project,...current])
    return project
  },[save])

  const removeProject=useCallback((id:string)=>{save(readProjects().filter(project=>project.id!==id));void deleteRemoteProject(id)},[save])
  const updateProject=useCallback((id:string,patch:Partial<ProjectRecord>)=>{
    let updated:ProjectRecord|null=null
    save(readProjects().map(project=>{
      if(project.id!==id)return project
      updated={...project,...patch}
      return updated
    }))
    return updated
  },[save])
  const mergeProjects=useCallback((ids:string[],input:NewProject&{mergeNote?:string})=>{
    const uniqueIds=Array.from(new Set(ids))
    const current=readProjects().map(normalizeProject)
    const sources=current.filter(project=>uniqueIds.includes(project.id))
    if(sources.length<2)throw new Error('BirleÅŸtirmek iÃ§in en az iki baÅŸvuru seÃ§in.')
    const project:ProjectRecord={
      ...input,
      projectCode:nextProjectCode(current,new Date().toISOString()),
      moderationStatus:'Onaylandı',
      id:crypto.randomUUID(),
      votes:0,
      progress:input.status==='Tamamlandı'?100:0,
      createdAt:new Date().toISOString(),
      mergedFrom:sources.map(project=>project.id),
      mergeNote:input.mergeNote,
      attachments:sources.flatMap(project=>project.attachments??[]),
    }
    save([project,...current.map(item=>uniqueIds.includes(item.id)?{...item,moderationStatus:'Reddedildi' as ProjectModerationStatus,mergeNote:`${project.title} projesi altında birleştirildi.`}:item)])
    return project
  },[save])
  const reviewProject=useCallback((id:string,moderationStatus:ProjectModerationStatus)=>{
    save(readProjects().map(project=>{
      if(project.id!==id)return project
      const approved=!['Bekliyor','Reddedildi'].includes(String(moderationStatus))
      return {...project,moderationStatus,status:approved?'Uygun':project.status,workflowStatus:approved?'Oylamaya Hazır':project.workflowStatus,progress:approved?0:project.progress}
    }))
  },[save])
  const voteProject=useCallback((id:string,delta:1|-1)=>{
    save(readProjects().map(project=>{
      if(project.id!==id||!isPublishedProject(project)||!['Oylamada','Yılın Kazanan Adayı'].includes(String(project.status)))return project
      return {...project,votes:Math.max(0,project.votes+delta)}
    }))
  },[save])

  return{projects,ready,addProject,mergeProjects,removeProject,reviewProject,voteProject,updateProject}
}

export function formatBudget(value:number){return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(value)}
