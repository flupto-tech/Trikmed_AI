'use client'
import dynamic from 'next/dynamic'
const NewRx = dynamic(() => import('../../../../src/screens/portal/rx/NewRx'), { ssr: false })
export default function Page() { return <NewRx doctorId="dr001"/> }
