'use client'

import {useCallback,useEffect,useState} from 'react'

export type ProjectStatus='Başvuru'|'İncelemede'|'Uygun'|'Oylamada'|'Devam Ediyor'|'Tamamlandı'
export type ProjectModerationStatus='Bekliyor'|'Onaylandı'|'Reddedildi'

export type ProjectRecord={
  id:string
  title:string
  category:string
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
  const reviewProject=useCallback((id:string,moderationStatus:ProjectModerationStatus)=>{
    save(readProjects().map(project=>{
      if(project.id!==id)return project
      return {...project,moderationStatus,status:moderationStatus==='Onaylandı'?'Oylamada':project.status,progress:moderationStatus==='Onaylandı'?0:project.progress}
    }))
  },[save])
  const voteProject=useCallback((id:string,delta:1|-1)=>{
    save(readProjects().map(project=>{
      if(project.id!==id||project.moderationStatus!=='Onaylandı'||project.status!=='Oylamada')return project
      return {...project,votes:Math.max(0,project.votes+delta)}
    }))
  },[save])

  return{projects,ready,addProject,removeProject,reviewProject,voteProject}
}

export function formatBudget(value:number){return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(value)}
