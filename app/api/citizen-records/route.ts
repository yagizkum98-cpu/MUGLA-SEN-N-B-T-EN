import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

const TABLE='citizen_records'
const requiredTextFields=['id','name','email','phone','nationality','province','district','createdAt'] as const
type IncomingCitizen=Record<string,unknown>&{id:string;name:string;email:string}
type StoredCitizenRow={id:string;data:IncomingCitizen;updated_at:string}
const allowedOrigins=[
  'https://muglabutcesenin.vercel.app',
  'https://muglabutcesenin-vatandas.vercel.app',
  'https://muglabutcesenin-belediye.vercel.app',
  'https://muglabutcesenin-crm.vercel.app',
  'https://muglabutcesenin-superadmin.vercel.app',
  'https://api.muglabutcesenin.com',
]

declare global{
  // eslint-disable-next-line no-var
  var muglaCitizenFallbackStore:Map<string,StoredCitizenRow>|undefined
}

function fallbackStore(){
  globalThis.muglaCitizenFallbackStore??=new Map<string,StoredCitizenRow>()
  return globalThis.muglaCitizenFallbackStore
}

function corsHeaders(request:Request){
  const origin=request.headers.get('origin')??''
  return {
    'Access-Control-Allow-Origin':allowedOrigins.includes(origin)?origin:allowedOrigins[0],
    'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
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

function normalizeIncomingCitizen(value:unknown):IncomingCitizen{
  if(!value||typeof value!=='object')throw new Error('Vatandas verisi gecersiz.')
  const citizen=value as Record<string,unknown>
  for(const field of requiredTextFields){
    if(!String(citizen[field]??'').trim())throw new Error(`${field} alani zorunlu.`)
  }
  return {
    ...citizen,
    id:String(citizen.id),
    name:String(citizen.name).trim(),
    email:String(citizen.email).trim().toLocaleLowerCase('tr'),
    phone:String(citizen.phone).trim(),
    nationality:String(citizen.nationality)==='foreign'?'foreign':'tc',
    country:citizen.country?String(citizen.country).trim():undefined,
    province:String(citizen.province||'Mugla').trim(),
    district:String(citizen.district||'Mentese').trim(),
    lastLoginAt:citizen.lastLoginAt?String(citizen.lastLoginAt):undefined,
  }
}

export async function OPTIONS(request:Request){
  return new NextResponse(null,{status:204,headers:corsHeaders(request)})
}

export async function GET(request:Request){
  try{
    const supabase=supabaseAdmin()
    if(!supabase){
      const rows=Array.from(fallbackStore().values()).sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)))
      return NextResponse.json({users:rows.map(row=>row.data),synced:false},{headers:corsHeaders(request)})
    }
    const {data,error}=await supabase.from(TABLE).select('data,updated_at').order('updated_at',{ascending:false})
    if(error)throw error
    return NextResponse.json({users:(data??[]).map(row=>row.data).filter(Boolean),synced:true},{headers:corsHeaders(request)})
  }catch(cause){
    const message=cause instanceof Error?cause.message:'Vatandas kayitlari okunamadi.'
    return NextResponse.json({error:message},{status:400,headers:corsHeaders(request)})
  }
}

export async function POST(request:Request){
  try{
    const body=await request.json()
    const user=normalizeIncomingCitizen(body?.user)
    const now=new Date().toISOString()
    const supabase=supabaseAdmin()
    if(!supabase){
      fallbackStore().set(user.id,{id:user.id,data:user,updated_at:now})
      return NextResponse.json({user,synced:false},{headers:corsHeaders(request)})
    }
    const {data,error}=await supabase
      .from(TABLE)
      .upsert({id:user.id,data:user,updated_at:now},{onConflict:'id'})
      .select('data')
      .single()

    if(error)throw error
    return NextResponse.json({user:data?.data??user,synced:true},{headers:corsHeaders(request)})
  }catch(cause){
    const message=cause instanceof Error?cause.message:'Vatandas kaydi olusturulamadi.'
    return NextResponse.json({error:message},{status:400,headers:corsHeaders(request)})
  }
}
