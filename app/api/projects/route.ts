import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

const TABLE='project_records'
const PROJECT_CENTER_STATUS='\u0042\u0061\u015f\u0076\u0075\u0072\u0075'
const PROJECT_CENTER_WORKFLOW='\u0130\u006c\u00e7\u0065\u0020\u0041\u0064\u006d\u0069\u006e\u0020\u0130\u006e\u0063\u0065\u006c\u0065\u006d\u0065\u0073\u0069\u006e\u0064\u0065'
const requiredTextFields=['id','projectCode','title','district','category','status','moderationStatus','createdAt'] as const
type IncomingProject=Record<string,unknown>&{id:string;projectCode:string;title:string}
type DeletedProject={id:string;deleted:true;deletedAt:string}
type StoredProjectRow={id:string;data:IncomingProject|DeletedProject;updated_at:string}
const allowedOrigins=[
  'https://muglaseninbutcen.vercel.app',
  'https://muglabutcesenin-vatandas.vercel.app',
  'https://muglabutcesenin-belediye.vercel.app',
]

declare global{
  // eslint-disable-next-line no-var
  var muglaProjectFallbackStore:Map<string,StoredProjectRow>|undefined
}

function fallbackStore(){
  globalThis.muglaProjectFallbackStore??=new Map<string,StoredProjectRow>()
  return globalThis.muglaProjectFallbackStore
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

function normalizeIncomingProject(value:unknown):IncomingProject{
  if(!value||typeof value!=='object')throw new Error('Proje verisi gecersiz.')
  const project=value as Record<string,unknown>
  for(const field of requiredTextFields){
    if(!String(project[field]??'').trim())throw new Error(`${field} alani zorunlu.`)
  }
  return {
    ...project,
    id:String(project.id),
    projectCode:String(project.projectCode),
    title:String(project.title).trim(),
    status:PROJECT_CENTER_STATUS,
    moderationStatus:'Bekliyor',
    workflowStatus:PROJECT_CENTER_WORKFLOW,
    source:'citizen',
    progress:0,
    votes:0,
  }
}

function isDeletedProject(value:unknown):value is DeletedProject{
  return Boolean(value&&typeof value==='object'&&(value as Record<string,unknown>).deleted===true&&String((value as Record<string,unknown>).id??'').trim())
}

function projectResponse(rows:{data:unknown;updated_at?:string}[]){
  const sorted=[...rows].sort((a,b)=>String(b.updated_at??'').localeCompare(String(a.updated_at??'')))
  const deletedIds=sorted.map(row=>row.data).filter(isDeletedProject).map(project=>project.id)
  const deletedSet=new Set(deletedIds)
  const projects=sorted.map(row=>row.data).filter((project):project is IncomingProject=>Boolean(project&&typeof project==='object'&&!isDeletedProject(project)&&!deletedSet.has(String((project as Record<string,unknown>).id??''))))
  return {projects,deletedIds}
}

export async function OPTIONS(request:Request){
  return new NextResponse(null,{status:204,headers:corsHeaders(request)})
}

export async function GET(request:Request){
  try{
    const supabase=supabaseAdmin()
    if(!supabase){
      const rows=Array.from(fallbackStore().values()).sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)))
      return NextResponse.json({...projectResponse(rows),synced:false},{headers:corsHeaders(request)})
    }
    const {data,error}=await supabase.from(TABLE).select('data,updated_at').order('updated_at',{ascending:false})
    if(error)throw error
    return NextResponse.json({...projectResponse(data??[]),synced:true},{headers:corsHeaders(request)})
  }catch(cause){
    const message=cause instanceof Error?cause.message:'Proje kayitlari okunamadi.'
    return NextResponse.json({error:message},{status:400,headers:corsHeaders(request)})
  }
}

export async function POST(request:Request){
  try{
    const body=await request.json()
    const project=normalizeIncomingProject(body?.project)
    const supabase=supabaseAdmin()
    if(!supabase){
      fallbackStore().set(project.id,{id:project.id,data:project,updated_at:new Date().toISOString()})
      return NextResponse.json({project,synced:false},{headers:corsHeaders(request)})
    }
    const {data,error}=await supabase
      .from(TABLE)
      .upsert({id:project.id,data:project,updated_at:new Date().toISOString()},{onConflict:'id'})
      .select('data')
      .single()

    if(error)throw error
    return NextResponse.json({project:data?.data??project,synced:true},{headers:corsHeaders(request)})
  }catch(cause){
    const message=cause instanceof Error?cause.message:'Proje Merkezi kaydi olusturulamadi.'
    return NextResponse.json({error:message},{status:400,headers:corsHeaders(request)})
  }
}

export async function DELETE(request:Request){
  try{
    const url=new URL(request.url)
    const id=url.searchParams.get('id')
    if(!id)throw new Error('Proje id zorunlu.')
    const supabase=supabaseAdmin()
    const deletedProject:DeletedProject={id,deleted:true,deletedAt:new Date().toISOString()}
    if(!supabase){
      fallbackStore().set(id,{id,data:deletedProject,updated_at:deletedProject.deletedAt})
      return NextResponse.json({ok:true,synced:false},{headers:corsHeaders(request)})
    }
    const {error}=await supabase.from(TABLE).upsert({id,data:deletedProject,updated_at:deletedProject.deletedAt},{onConflict:'id'})
    if(error)throw error
    return NextResponse.json({ok:true,synced:true},{headers:corsHeaders(request)})
  }catch(cause){
    const message=cause instanceof Error?cause.message:'Proje kaydi silinemedi.'
    return NextResponse.json({error:message},{status:400,headers:corsHeaders(request)})
  }
}
