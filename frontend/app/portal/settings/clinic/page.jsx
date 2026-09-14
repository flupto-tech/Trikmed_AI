'use client'
import dynamic from 'next/dynamic'
const ClinicSettings = dynamic(() => import('../../../../src/screens/portal/settings/ClinicSettings'), { ssr: false })
export default function ClinicSettingsPage() { return <ClinicSettings /> }
