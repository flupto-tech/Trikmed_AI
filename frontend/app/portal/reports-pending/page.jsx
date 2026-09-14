'use client'
import dynamic from 'next/dynamic'
const ReportsPending = dynamic(() => import('../../../src/screens/portal/ReportsPending'), { ssr: false })
export default function Page() { return <ReportsPending /> }
