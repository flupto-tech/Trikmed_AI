'use client'
import dynamic from 'next/dynamic'
const RxHistory = dynamic(() => import('../../../../src/screens/portal/rx/RxHistory'), { ssr: false })
export default function Page() { return <RxHistory doctorId="dr001"/> }
