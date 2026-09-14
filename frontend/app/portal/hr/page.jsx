'use client'
import dynamic from 'next/dynamic'
const HRModule = dynamic(() => import('../../../src/screens/portal/HRModule'), { ssr: false })
export default function Page() { return <HRModule /> }
