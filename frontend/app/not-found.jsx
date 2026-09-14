'use client'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#F7F9FF', padding: 24, textAlign: 'center',
    }}>
      <p style={{ fontSize: 72, fontWeight: 800, color: '#DDE4F0', margin: '0 0 8px', lineHeight: 1 }}>
        404
      </p>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F2D5E', margin: '0 0 8px' }}>
        Page not found
      </h1>
      <p style={{ fontSize: 13, color: '#6B7A9A', margin: '0 0 24px' }}>
        This page doesn't exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link href="/"
          style={{
            padding: '10px 24px', borderRadius: 8,
            background: '#1A5CB5', color: '#fff', fontSize: 13,
            fontWeight: 700, textDecoration: 'none',
          }}>
          Go home
        </Link>
        <Link href="/portal"
          style={{
            padding: '10px 24px', borderRadius: 8,
            border: '1px solid #DDE4F0', background: '#fff',
            color: '#0F2D5E', fontSize: 13, fontWeight: 600,
            textDecoration: 'none',
          }}>
          Portal
        </Link>
      </div>
    </div>
  )
}
