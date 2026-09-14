'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '../../utils/auth'
import SuperAdminDash   from './SuperAdminDash'
import ZoneManagerDash  from './ZoneManagerDash'
import CityManagerDash  from './CityManagerDash'
import SalesPersonDash  from './SalesPersonDash'
import MRDash           from './MRDash'
import InstallerDash    from './InstallerDash'
import HRModule         from './HRModule'

function ClinicRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard') }, [router])
  return null
}

export default function PortalOverview() {
  const session = getSession()
  if (!session) return null
  switch (session?.role) {
    case 'super':     return <SuperAdminDash/>
    case 'zone':      return <ZoneManagerDash/>
    case 'city':      return <CityManagerDash/>
    case 'sales':     return <SalesPersonDash/>
    case 'mr':        return <MRDash/>
    case 'installer': return <InstallerDash/>
    case 'hr':        return <HRModule/>
    case 'clinic':    return <ClinicRedirect/>
    default:          return <SuperAdminDash/>
  }
}
