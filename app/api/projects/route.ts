import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

const TABLE='project_records'
const PROJECT_CENTER_STATUS='\u0042\u0061\u015f\u0076\u0075\u0072\u0075'
const PROJECT_CENTER_WORKFLOW='\u0130\u006c\u00e7\u0065\u0020\u0041\u0064\u006d\u0069\u006e\u0020\u0130\u006e\u0063\u0065\u006c\u0065\u006d\u0065\u0073\u0069\u006e\u0064\u0065'
const requiredTextFields=['id','projectCode','title','district','category','status','moderationStatus','createdAt'] as const
type IncomingProject=Record<string,unknown>&{id:string;projectCode:string;title:string}

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

export async function POST(request:Request){
  try{
    const body=await request.json()
    const project=normalizeIncomingProject(body?.project)
    const supabase=supabaseAdmin()
    if(!supabase){
      return NextResponse.json({project,synced:false})
    }
    const {data,error}=await supabase
      .from(TABLE)
      .upsert({id:project.id,data:project,updated_at:new Date().toISOString()},{onConflict:'id'})
      .select('data')
      .single()

    if(error)throw error
    return NextResponse.json({project:data?.data??project,synced:true})
  }catch(cause){
    const message=cause instanceof Error?cause.message:'Proje Merkezi kaydi olusturulamadi.'
    return NextResponse.json({error:message},{status:400})
  }
}
