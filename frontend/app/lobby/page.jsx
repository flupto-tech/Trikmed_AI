'use client'
import dynamic from 'next/dynamic'
const Page = dynamic(() => import('../../src/screens/LobbyDisplay'), { ssr: false })
export default Page
