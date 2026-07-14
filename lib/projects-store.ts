'use client'

import {useCallback,useEffect,useState} from 'react'

export type ProjectStatus='Başvuru'|'İncelemede'|'Uygun'|'Oylamada'|'Yılın Kazanan Adayı'|'İhale Aşamasında'|'Devam Ediyor'|'Tamamlandı'|'Yapılamadı'|'Ertelendi'
export type ProjectModerationStatus='Bekliyor'|'Onaylandı'|'Reddedildi'

export type ProjectRecord={
  id:string
  title:string
  category:string
  subcategory?:string
  district:string
  country?:string
  countryCode?:string
  province?:string
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
  mergedFrom?:string[]
  mergeNote?:string
}

export type NewProject=Omit<ProjectRecord,'id'|'votes'|'progress'|'createdAt'|'moderationStatus'> & {moderationStatus?:ProjectModerationStatus}

const STORAGE_KEY='mugla-senin-butcen-projects-v1'
const CHANGE_EVENT='mugla-projects-changed'

function readProjects():ProjectRecord[]{
  if(typeof window==='undefined')return []
  try{
    const value=JSON.parse(localStorage.getItem(STORAGE_KEY)??'[]')
    return Array.isArray(value)?value:[]
  }catch{return []}
}

function withDefaults(project:ProjectRecord):ProjectRecord{
  return {...project,moderationStatus:project.moderationStatus??'Onaylandı'}
}

function isPublished(project:ProjectRecord){
  return !['Bekliyor','Reddedildi'].includes(String(project.moderationStatus))
}

export function useProjects(){
  const[projects,setProjects]=useState<ProjectRecord[]>([])
  const[ready,setReady]=useState(false)

  useEffect(()=>{
    const sync=()=>{setProjects(readProjects().map(withDefaults));setReady(true)}
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
    const project:ProjectRecord={...input,moderationStatus:input.moderationStatus??'Bekliyor',id:crypto.randomUUID(),votes:0,progress:input.status==='Tamamlandı'?100:0,createdAt:new Date().toISOString()}
    save([project,...readProjects()])
    return project
  },[save])

  const removeProject=useCallback((id:string)=>save(readProjects().filter(project=>project.id!==id)),[save])
  const mergeProjects=useCallback((ids:string[],input:NewProject&{mergeNote?:string})=>{
    const uniqueIds=Array.from(new Set(ids))
    const current=readProjects()
    const sources=current.filter(project=>uniqueIds.includes(project.id))
    if(sources.length<2)throw new Error('Birleştirmek için en az iki başvuru seçin.')
    const project:ProjectRecord={
      ...input,
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
