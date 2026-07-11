'use client'

import {useCallback,useEffect,useState} from 'react'

export type CrmRole='Vatandaş'|'STK'|'Akademisyen'|'Turist'|'Girişimci'|'İlçe Admin'|'Belediye Admin'|'Süper Admin'
export type Channel='SMS'|'E-posta'|'Push'|'WhatsApp'|'Telegram'

export type Citizen={
  id:string
  name:string
  email:string
  phone:string
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

export function engagementScore(citizen:Citizen){
  const activity=citizen.participationCount*4+citizen.voteCount*3+citizen.proposalCount*8+citizen.badges.length*5
  const recency=citizen.lastLogin?Math.max(0,20-Math.floor((Date.now()-new Date(citizen.lastLogin).getTime())/86400000)):0
  return Math.min(100,activity+recency)
}

export function useCrm(){
  const[citizens,setCitizens]=useState<Citizen[]>([])
  const[campaigns,setCampaigns]=useState<Campaign[]>([])
  useEffect(()=>{const sync=()=>{setCitizens(read<Citizen>(CITIZENS));setCampaigns(read<Campaign>(CAMPAIGNS))};sync();window.addEventListener('storage',sync);window.addEventListener(EVENT,sync);return()=>{window.removeEventListener('storage',sync);window.removeEventListener(EVENT,sync)}},[])
  const save=useCallback(<T,>(key:string,value:T[])=>{localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new Event(EVENT))},[])
  const addCitizen=useCallback((input:Omit<Citizen,'id'|'createdAt'>)=>save(CITIZENS,[{...input,id:crypto.randomUUID(),createdAt:new Date().toISOString()},...read<Citizen>(CITIZENS)]),[save])
  const removeCitizen=useCallback((id:string)=>save(CITIZENS,read<Citizen>(CITIZENS).filter(x=>x.id!==id)),[save])
  const addCampaign=useCallback((input:Omit<Campaign,'id'|'createdAt'>)=>save(CAMPAIGNS,[{...input,id:crypto.randomUUID(),createdAt:new Date().toISOString()},...read<Campaign>(CAMPAIGNS)]),[save])
  return{citizens,campaigns,addCitizen,removeCitizen,addCampaign}
}
