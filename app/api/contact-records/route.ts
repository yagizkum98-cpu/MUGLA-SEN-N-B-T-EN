import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

const TABLE='contact_records'
const requiredTextFields=['id','name','phone','email','topic','subject','message','createdAt'] as const
const allowedTopics=['Gorus','Oneri','Soru']
const allowedOrigins=[
  'https://muglaseninbutcen.vercel.app',
  'https://muglabutcesenin-vatandas.vercel.app',
  'https://muglabutcesenin-belediye.vercel.app',
]

type IncomingContact=Record<string,unknown>&{
  id:string
  name:string
  phone:string
  email:string
  topic:'Gorus'|'Oneri'|'Soru'
  subject:string
  message:string
  kvkkAccepted:boolean
  createdAt:string
}
type DeletedContact={id:string;deleted:true;deletedAt:string}
type StoredContactRow={id:string;data:IncomingContact|DeletedContact;updated_at:string}

declare global{
  // eslint-disable-next-line no-var
  var muglaContactFallbackStore:Map<string,StoredContactRow>|undefined
}

function fallbackStore(){
  globalThis.muglaContactFallbackStore??=new Map<string,StoredContactRow>()
  return globalThis.muglaContactFallbackStore
}

function corsHeaders(request:Request){
  const origin=request.headers.get('origin')??''
  return {
    'Access-Control-Allow-Origin':allowedOrigins.includes(origin)?origin:allowedOrigins[0],
    'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Vary':'Origin',
  }
}

function supabaseAdmin(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if(!url||!key)return null
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
}

function normalizeIncomingContact(value:unknown):IncomingContact{
  if(!value||typeof value!=='object')throw new Error('Iletisim verisi gecersiz.')
  const contact=value as Record<string,unknown>
  for(const field of requiredTextFields){
    if(!String(contact[field]??'').trim())throw new Error(`${field} alani zorunlu.`)
  }
  const topic=String(contact.topic)
  if(!allowedTopics.includes(topic))throw new Error('Iletisim alani gecersiz.')
  return {
    ...contact,
    id:String(contact.id),
    name:String(contact.name).trim(),
    phone:String(contact.phone).trim(),
    email:String(contact.email).trim(),
    topic:topic as IncomingContact['topic'],
    subject:String(contact.subject).trim(),
    message:String(contact.message).trim(),
    kvkkAccepted:Boolean(contact.kvkkAccepted),
    createdAt:String(contact.createdAt),
  }
}

function isDeletedContact(value:unknown):value is DeletedContact{
  return Boolean(value&&typeof value==='object'&&(value as Record<string,unknown>).deleted===true&&String((value as Record<string,unknown>).id??'').trim())
}

function contactResponse(rows:{data:unknown;updated_at?:string}[]){
  const sorted=[...rows].sort((a,b)=>String(b.updated_at??'').localeCompare(String(a.updated_at??'')))
  const deletedIds=sorted.map(row=>row.data).filter(isDeletedContact).map(contact=>contact.id)
  const deletedSet=new Set(deletedIds)
  const records=sorted.map(row=>row.data).filter((contact):contact is IncomingContact=>Boolean(contact&&typeof contact==='object'&&!isDeletedContact(contact)&&!deletedSet.has(String((contact as Record<string,unknown>).id??''))))
  return {records,deletedIds}
}

export async function OPTIONS(request:Request){
  return new NextResponse(null,{status:204,headers:corsHeaders(request)})
}

export async function GET(request:Request){
  try{
    const supabase=supabaseAdmin()
    if(!supabase){
      return NextResponse.json({...contactResponse(Array.from(fallbackStore().values())),synced:false},{headers:corsHeaders(request)})
    }
    const {data,error}=await supabase.from(TABLE).select('data,updated_at').order('updated_at',{ascending:false})
    if(error)throw error
    return NextResponse.json({...contactResponse(data??[]),synced:true},{headers:corsHeaders(request)})
  }catch(cause){
    const message=cause instanceof Error?cause.message:'Iletisim kayitlari okunamadi.'
    return NextResponse.json({error:message},{status:400,headers:corsHeaders(request)})
  }
}

export async function POST(request:Request){
  try{
    const body=await request.json()
    const contact=normalizeIncomingContact(body?.record)
    const supabase=supabaseAdmin()
    if(!supabase){
      fallbackStore().set(contact.id,{id:contact.id,data:contact,updated_at:new Date().toISOString()})
      return NextResponse.json({record:contact,synced:false},{headers:corsHeaders(request)})
    }
    const {data,error}=await supabase
      .from(TABLE)
      .upsert({id:contact.id,data:contact,updated_at:new Date().toISOString()},{onConflict:'id'})
      .select('data')
      .single()
    if(error)throw error
    return NextResponse.json({record:data?.data??contact,synced:true},{headers:corsHeaders(request)})
  }catch(cause){
    const message=cause instanceof Error?cause.message:'Iletisim talebi kaydedilemedi.'
    return NextResponse.json({error:message},{status:400,headers:corsHeaders(request)})
  }
}

export async function DELETE(request:Request){
  try{
    const url=new URL(request.url)
    const id=url.searchParams.get('id')
    if(!id)throw new Error('Iletisim id zorunlu.')
    const supabase=supabaseAdmin()
    const deletedContact:DeletedContact={id,deleted:true,deletedAt:new Date().toISOString()}
    if(!supabase){
      fallbackStore().set(id,{id,data:deletedContact,updated_at:deletedContact.deletedAt})
      return NextResponse.json({ok:true,synced:false},{headers:corsHeaders(request)})
    }
    const {error}=await supabase.from(TABLE).upsert({id,data:deletedContact,updated_at:deletedContact.deletedAt},{onConflict:'id'})
    if(error)throw error
    return NextResponse.json({ok:true,synced:true},{headers:corsHeaders(request)})
  }catch(cause){
    const message=cause instanceof Error?cause.message:'Iletisim kaydi silinemedi.'
    return NextResponse.json({error:message},{status:400,headers:corsHeaders(request)})
  }
}
