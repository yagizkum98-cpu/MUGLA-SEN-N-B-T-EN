'use client'

import {useCallback,useEffect,useState} from 'react'
import {AUTH_USERS_CHANGED_EVENT,listLocalUsers} from '@/lib/local-auth'

export type CrmRole='Vatandaş'|'STK'|'Akademisyen'|'Turist'|'Girişimci'|'İlçe Admin'|'Belediye Admin'|'Süper Admin'
export type Channel='SMS'|'E-posta'|'Push'|'WhatsApp'|'Telegram'

export type Citizen={
  id:string
  name:string
  email:string
  phone:string
  nationality:'tc'|'foreign'
  country?:string
  province:string
  district:string
  role:CrmRole
  age:number
  gender:'Kadın'|'Erkek'|'Belirtmek istemiyor'
  interests:string[]
  participationCount:number
  voteCount:number
  proposalCount:number
  badges:string[]
  lastLogin:string
  createdAt:string
}

export type Campaign={id:string;title:string;segment:string;channels:Channel[];status:'Taslak'|'Planlandı'|'Gönderildi';createdAt:string}

const CITIZENS='mugla-crm-citizens-v1'
const CAMPAIGNS='mugla-crm-campaigns-v1'
const EVENT='mugla-crm-changed'

function read<T>(key:string):T[]{if(typeof window==='undefined')return[];try{const data=JSON.parse(localStorage.getItem(key)??'[]');return Array.isArray(data)?data:[]}catch{return[]}}

function liveCitizens():Citizen[]{
  if(typeof window==='undefined')return[]
  return listLocalUsers().map(user=>({
    id:`auth-${user.id}`,
    name:user.name,
    email:user.email,
    phone:user.phone,
    nationality:user.nationality,
    country:user.country,
    province:user.province,
    district:user.district,
    role:'Vatandaş' as CrmRole,
    age:0,
    gender:'Belirtmek istemiyor' as const,
    interests:[],
    participationCount:0,
    voteCount:0,
    proposalCount:0,
    badges:[user.verifiedBadge],
    lastLogin:user.verifiedAt,
    createdAt:user.createdAt,
  }))
}

function mergedCitizens(){
  const manual=read<Citizen>(CITIZENS)
  const manualEmails=new Set(manual.map(citizen=>citizen.email.toLocaleLowerCase('tr')))
  return [...liveCitizens().filter(citizen=>!manualEmails.has(citizen.email.toLocaleLowerCase('tr'))),...manual.map(citizen=>({
    ...citizen,
    nationality:citizen.nationality??'tc',
    province:citizen.province??'Mugla',
  }))]
}

export function engagementScore(citizen:Citizen){
  const activity=citizen.participationCount*4+citizen.voteCount*3+citizen.proposalCount*8+citizen.badges.length*5
  const recency=citizen.lastLogin?Math.max(0,20-Math.floor((Date.now()-new Date(citizen.lastLogin).getTime())/86400000)):0
  return Math.min(100,activity+recency)
}

export function useCrm(){
  const[citizens,setCitizens]=useState<Citizen[]>([])
  const[campaigns,setCampaigns]=useState<Campaign[]>([])
  useEffect(()=>{const sync=()=>{setCitizens(mergedCitizens());setCampaigns(read<Campaign>(CAMPAIGNS))};sync();window.addEventListener('storage',sync);window.addEventListener(EVENT,sync);window.addEventListener(AUTH_USERS_CHANGED_EVENT,sync);return()=>{window.removeEventListener('storage',sync);window.removeEventListener(EVENT,sync);window.removeEventListener(AUTH_USERS_CHANGED_EVENT,sync)}},[])
  const save=useCallback(<T,>(key:string,value:T[])=>{localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new Event(EVENT))},[])
  const addCitizen=useCallback((input:Omit<Citizen,'id'|'createdAt'>)=>save(CITIZENS,[{...input,id:crypto.randomUUID(),createdAt:new Date().toISOString()},...read<Citizen>(CITIZENS)]),[save])
  const removeCitizen=useCallback((id:string)=>save(CITIZENS,read<Citizen>(CITIZENS).filter(x=>x.id!==id)),[save])
  const addCampaign=useCallback((input:Omit<Campaign,'id'|'createdAt'>)=>save(CAMPAIGNS,[{...input,id:crypto.randomUUID(),createdAt:new Date().toISOString()},...read<Campaign>(CAMPAIGNS)]),[save])
  return{citizens,campaigns,addCitizen,removeCitizen,addCampaign}
}
