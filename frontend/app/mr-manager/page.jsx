'use client'
import dynamic from 'next/dynamic'
const MRManagerPage = dynamic(() => import('../../src/screens/mr-manager/MRManagerPage'), { ssr: false })
export default MRManagerPage
