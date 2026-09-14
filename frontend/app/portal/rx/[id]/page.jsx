'use client'
import dynamic from 'next/dynamic'
const RxView = dynamic(() => import('../../../../src/screens/portal/rx/RxView'), { ssr: false })
export default function Page() { return <RxView/> }
