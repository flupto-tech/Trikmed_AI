'use client'
import dynamic from 'next/dynamic'
const Page = dynamic(() => import('../../../../src/screens/portal/ClinicDetail'), { ssr: false })
export default Page
