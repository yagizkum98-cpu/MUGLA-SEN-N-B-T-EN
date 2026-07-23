import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

const TABLE='project_records'
const requiredTextFields=['id','projectCode','title','district','category','status','moderationStatus','createdAt'] as const

function supabaseAdmin(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if(!url||!key)throw new Error('Supabase ortam degiskenleri eksik.')
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
}

function normalizeIncomingProject(value:unknown){
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
    status:'Başvuru',
    moderationStatus:'Bekliyor',
    workflowStatus:'İlçe Admin İncelemesinde',
    source:'citizen',
    progress:0,
    votes:0,
  }
}

export async function POST(request:Request){
  try{
    const body=await request.json()
    const project=normalizeIncomingProject(body?.project)
    const {data,error}=await supabaseAdmin()
      .from(TABLE)
      .upsert({id:project.id,data:project,updated_at:new Date().toISOString()},{onConflict:'id'})
      .select('data')
      .single()

    if(error)throw error
    return NextResponse.json({project:data?.data??project})
  }catch(cause){
    const message=cause instanceof Error?cause.message:'Proje Merkezi kaydi olusturulamadi.'
    return NextResponse.json({error:message},{status:400})
  }
}
