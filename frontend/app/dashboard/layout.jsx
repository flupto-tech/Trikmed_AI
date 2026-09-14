'use client'
import dynamic from 'next/dynamic'
const DashboardLayout = dynamic(() => import('../../src/layouts/DashboardLayout'), { ssr: false })
export default function Layout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
