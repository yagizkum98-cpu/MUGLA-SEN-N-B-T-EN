import {NextResponse} from 'next/server'
import {findDistrictDashboard,muglaDistrictDashboards} from '@/lib/district-dashboards'

const sampleMetrics={
  projectCount:0,
  activeVoting:0,
  totalVotes:0,
  totalBudget:0,
  participationRate:0,
  evaluationQueue:0,
  completedProjects:0,
}

export function generateStaticParams(){
  return muglaDistrictDashboards.map(district=>({district:district.slug}))
}

export async function GET(_request:Request,{params}:{params:Promise<{district:string}>}){
  const{district:slug}=await params
  const district=findDistrictDashboard(slug)
  if(!district)return NextResponse.json({error:'Ilce API bulunamadi.'},{status:404})

  return NextResponse.json({
    district:{name:district.name,slug:district.slug,panelPath:district.panelPath,apiPath:district.apiPath},
    metrics:sampleMetrics,
    endpoints:{
      overview:district.apiPath,
      projects:`${district.apiPath}/projects`,
      votes:`${district.apiPath}/votes`,
      budget:`${district.apiPath}/budget`,
    },
    message:`${district.name} ilce dashboard API hazir. Canli veriler proje ve CRM kayitlari baglandiginda bu endpoint uzerinden yayinlanabilir.`,
    updatedAt:new Date().toISOString(),
  })
}
