import {DistrictDashboard} from '@/components/district-dashboard'
import {AdminAuthGate} from '@/components/admin-auth-gate'

export default function Dashboard(){
  return <AdminAuthGate><DistrictDashboard/></AdminAuthGate>
}
