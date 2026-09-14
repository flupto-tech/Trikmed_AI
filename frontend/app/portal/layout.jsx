'use client'
import dynamic from 'next/dynamic'
const AdminPortalLayout = dynamic(() => import('../../src/layouts/AdminPortalLayout'), { ssr: false })
export default function Layout({ children }) {
  return <AdminPortalLayout>{children}</AdminPortalLayout>
}
