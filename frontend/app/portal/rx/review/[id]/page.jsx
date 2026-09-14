'use client'
import dynamic from 'next/dynamic'
const ReviewConsult = dynamic(() => import('../../../../../src/screens/portal/rx/ReviewConsult'), { ssr: false })
export default function Page({ params }) { return <ReviewConsult reviewId={params.id} /> }
