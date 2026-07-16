import {notFound} from 'next/navigation'
import {DistrictDashboard} from '@/components/district-dashboard'
import {DistrictPanelGate} from '@/components/district-panel-gate'
import {AdminAuthGate} from '@/components/admin-auth-gate'
import {findDistrictDashboard,muglaDistrictDashboards} from '@/lib/district-dashboards'

export function generateStaticParams(){
  return muglaDistrictDashboards.map(district=>({district:district.slug}))
}

export default async function DistrictDashboardPage({params}:{params:Promise<{district:string}>}){
  const{district:slug}=await params
  const district=findDistrictDashboard(slug)
  if(!district)notFound()
  return <AdminAuthGate><DistrictPanelGate district={district}><DistrictDashboard district={district}/></DistrictPanelGate></AdminAuthGate>
}
