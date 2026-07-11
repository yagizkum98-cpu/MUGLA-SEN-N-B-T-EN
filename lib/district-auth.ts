'use client'

import {findDistrictDashboard} from '@/lib/district-dashboards'

const SESSION_KEY='mugla-district-panel-session-v1'

type DistrictSession={slug:string;name:string;loginAt:string}

function readSessions():DistrictSession[]{
  if(typeof window==='undefined')return []
  try{
    const value=JSON.parse(localStorage.getItem(SESSION_KEY)??'[]')
    return Array.isArray(value)?value:[]
  }catch{return []}
}

export function getDistrictSession(slug:string){
  return readSessions().find(session=>session.slug===slug)??null
}

export function loginDistrictPanel(slug:string,code:string){
  const district=findDistrictDashboard(slug)
  if(!district)throw new Error('Ilce paneli bulunamadi.')
  if(code.trim().toLocaleUpperCase('tr')!==district.accessCode)throw new Error('Panel giris kodu hatali.')
  const next=[...readSessions().filter(session=>session.slug!==slug),{slug:district.slug,name:district.name,loginAt:new Date().toISOString()}]
  localStorage.setItem(SESSION_KEY,JSON.stringify(next))
  return district
}

export function logoutDistrictPanel(slug:string){
  localStorage.setItem(SESSION_KEY,JSON.stringify(readSessions().filter(session=>session.slug!==slug)))
}
