'use client'
import dynamic from 'next/dynamic'
const Page = dynamic(() => import('../../src/screens/Signup'), { ssr: false })
export default Page
