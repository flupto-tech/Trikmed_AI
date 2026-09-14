'use client'
import dynamic from 'next/dynamic'
const Page = dynamic(() => import('../../../src/screens/LoginAdmin'), { ssr: false })
export default Page
