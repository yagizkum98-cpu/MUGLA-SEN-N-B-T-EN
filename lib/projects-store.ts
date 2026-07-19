'use client'

import {useCallback,useEffect,useState} from 'react'
import {categoryColor, normalizeProjectCategory} from '@/lib/project-taxonomy'

export type ProjectStatus='Başvuru'|'İncelemede'|'Uygun'|'Oylamada'|'Yılın Kazanan Adayı'|'İhale Aşamasında'|'Devam Ediyor'|'Tamamlandı'|'Yapılamadı'|'Ertelendi'
export type ProjectModerationStatus='Bekliyor'|'Onaylandı'|'Reddedildi'

export type ProjectRecord={
  id:string
  projectCode:string
  title:string
  category:string
  subcategory?:string
  targetGroup?:string
  district:string
  country?:string
  countryCode?:string
  province?:string
  applicantDistrict?:string
  budget:number
  votes:number
  progress:number
  lat:number
  lng:number
  color:string
  status:ProjectStatus
  moderationStatus:ProjectModerationStatus
  createdAt:string
  purpose?:string
  summary?:string
  activities?:string
  expectedResults?:string
  attachments?:{name:string;size:number;type:string}[]
  ownerId?:string
  ownerName?:string
  ownerEmail?:string
  applicantType?:string
  mergedFrom?:string[]
  mergeNote?:string
}

export type NewProject=Omit<ProjectRecord,'id'|'projectCode'|'votes'|'progress'|'createdAt'|'moderationStatus'> & {moderationStatus?:ProjectModerationStatus}

const STORAGE_KEY='mugla-senin-butcen-projects-v1'
const CHANGE_EVENT='mugla-projects-changed'

function readProjects():ProjectRecord[]{
  if(typeof window==='undefined')return []
  try{
    const value=JSON.parse(localStorage.getItem(STORAGE_KEY)??'[]')
    return Array.isArray(value)?value:[]
  }catch{return []}
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

function withDefaults(project:ProjectRecord):ProjectRecord{
  return {...project,moderationStatus:project.moderationStatus??'Onaylandı'}
}

function normalizeProject(project:ProjectRecord):ProjectRecord{
  const category=normalizeProjectCategory(project.category)
  const color=project.category===category&&project.color?project.color:categoryColor(category)
  return {...project,category,color,projectCode:project.projectCode??fallbackProjectCode(project),moderationStatus:project.moderationStatus??'Onaylandı'}
}

function isPublished(project:ProjectRecord){
  return !['Bekliyor','Reddedildi'].includes(String(project.moderationStatus))
}

export function useProjects(){
  const[projects,setProjects]=useState<ProjectRecord[]>([])
  const[ready,setReady]=useState(false)

  useEffect(()=>{
    const sync=()=>{setProjects(readProjects().map(normalizeProject));setReady(true)}
    sync()
    window.addEventListener('storage',sync)
    window.addEventListener(CHANGE_EVENT,sync)
    return()=>{window.removeEventListener('storage',sync);window.removeEventListener(CHANGE_EVENT,sync)}
  },[])

  const save=useCallback((next:ProjectRecord[])=>{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(next))
    setProjects(next)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  },[])

  const addProject=useCallback((input:NewProject)=>{
    const current=readProjects().map(normalizeProject)
    const createdAt=new Date().toISOString()
    const project:ProjectRecord={...input,projectCode:nextProjectCode(current,createdAt),moderationStatus:input.moderationStatus??'Bekliyor',id:crypto.randomUUID(),votes:0,progress:input.status==='Tamamlandı'?100:0,createdAt}
    save([project,...current])
    return project
  },[save])

  const removeProject=useCallback((id:string)=>save(readProjects().filter(project=>project.id!==id)),[save])
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
      return {...project,moderationStatus,status:approved?'Oylamada':project.status,progress:approved?0:project.progress}
    }))
  },[save])
  const voteProject=useCallback((id:string,delta:1|-1)=>{
    save(readProjects().map(project=>{
      if(project.id!==id||!isPublished(project)||!['Oylamada','Yılın Kazanan Adayı'].includes(String(project.status)))return project
      return {...project,votes:Math.max(0,project.votes+delta)}
    }))
  },[save])

  return{projects,ready,addProject,mergeProjects,removeProject,reviewProject,voteProject}
}

export function formatBudget(value:number){return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(value)}
