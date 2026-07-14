'use client'

export type VerificationMethod='edevlet'|'phone'|'email'|'google'|'apple'|'microsoft'|'passport'|'international-id'
export type LocalUser={
  id:string
  name:string
  email:string
  phone:string
  district:string
  passwordHash:string
  salt:string
  kvkkAcceptedAt:string
  createdAt:string
  verificationMethod:VerificationMethod
  verifiedAt:string
  verifiedBadge:string
  panelPath:string
  apiPath:string
  identityReference?:string
}

const USERS='mugla-auth-users-v1'
const SESSION='mugla-auth-session-v1'
export const AUTH_USERS_CHANGED_EVENT='mugla-auth-users-changed'

export function listLocalUsers():LocalUser[]{
  try{
    const value=JSON.parse(localStorage.getItem(USERS)??'[]')
    return Array.isArray(value)?value.map(user=>({
      ...user,
      verificationMethod:user.verificationMethod??'email',
      verifiedAt:user.verifiedAt??user.createdAt,
      verifiedBadge:user.verifiedBadge??'Doğrulanmış Kullanıcı',
      district:user.district??'Mentese',
        panelPath:user.panelPath??'/vatandas/panel',
        apiPath:user.apiPath??`/api/vatandas/${user.id}`,
      })):[] 
  }catch{return[]}
}

function bytesToBase64(bytes:Uint8Array){let value='';bytes.forEach(byte=>value+=String.fromCharCode(byte));return btoa(value)}
function base64ToBytes(value:string){return Uint8Array.from(atob(value),char=>char.charCodeAt(0))}
async function derive(password:string,salt:Uint8Array){const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const saltBuffer=new Uint8Array(salt).buffer;const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:saltBuffer,iterations:120000,hash:'SHA-256'},material,256);return bytesToBase64(new Uint8Array(bits))}

export async function registerUser(input:{name:string;email:string;phone:string;district:string;password:string;verificationMethod:VerificationMethod;verificationCode:string;verificationExpected:string;identityReference?:string;botAnswer:string;botExpected:string;website?:string}){
  const users=listLocalUsers()
  const email=input.email.trim().toLocaleLowerCase('tr')
  if(users.some(user=>user.email===email))throw new Error('Bu e-posta adresiyle daha önce kayıt oluşturulmuş.')
  if(input.website?.trim())throw new Error('Bot kontrolü başarısız.')
  if(input.botAnswer.trim()!==input.botExpected.trim())throw new Error('Lütfen bot kontrolü sorusunu doğru yanıtlayın.')
  if((input.verificationMethod==='phone'||input.verificationMethod==='email')&&input.verificationCode.trim()!==input.verificationExpected.trim())throw new Error('Doğrulama kodu hatalı.')
  if((input.verificationMethod==='passport'||input.verificationMethod==='international-id')&&String(input.identityReference??'').trim().length<6)throw new Error('Kimlik/pasaport referansı en az 6 karakter olmalıdır.')

  const salt=crypto.getRandomValues(new Uint8Array(16))
  const passwordHash=await derive(input.password,salt)
  const now=new Date().toISOString()
  const id=crypto.randomUUID()
  const user:LocalUser={
    id,
    name:input.name.trim(),
    email,
    phone:input.phone.trim(),
    district:input.district.trim()||'Mentese',
    passwordHash,
    salt:bytesToBase64(salt),
    kvkkAcceptedAt:now,
    createdAt:now,
    verificationMethod:input.verificationMethod,
    verifiedAt:now,
    verifiedBadge:'Doğrulanmış Kullanıcı',
    panelPath:'/vatandas/panel',
    apiPath:`/api/vatandas/${id}`,
    identityReference:input.identityReference?.trim(),
  }
  localStorage.setItem(USERS,JSON.stringify([...users,user]))
  window.dispatchEvent(new Event(AUTH_USERS_CHANGED_EVENT))
  return user
}

export async function loginUser(emailInput:string,password:string){
  const email=emailInput.trim().toLocaleLowerCase('tr')
  const user=listLocalUsers().find(item=>item.email===email)
  if(!user||await derive(password,base64ToBytes(user.salt))!==user.passwordHash)throw new Error('E-posta veya şifre hatalı.')
  localStorage.setItem(SESSION,user.id)
  window.dispatchEvent(new Event(AUTH_USERS_CHANGED_EVENT))
  return user
}

export function getCurrentUser(){if(typeof window==='undefined')return null;const id=localStorage.getItem(SESSION);return listLocalUsers().find(user=>user.id===id)??null}
export function logoutUser(){
  localStorage.removeItem(SESSION)
  window.dispatchEvent(new Event('mugla-auth-session-changed'))
}
