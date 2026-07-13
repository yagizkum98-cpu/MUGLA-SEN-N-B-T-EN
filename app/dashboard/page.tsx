import {DistrictDashboard} from '@/components/district-dashboard'
import {DashboardAuthGate} from '@/components/dashboard-auth-gate'

export default function Dashboard(){
  return <DashboardAuthGate><DistrictDashboard/></DashboardAuthGate>
}
