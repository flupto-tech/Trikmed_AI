'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#F7F9FF', padding: 24, textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: '#FEE2E2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, marginBottom: 20,
          }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F2D5E', margin: '0 0 8px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 13, color: '#6B7A9A', margin: '0 0 24px', maxWidth: 360 }}>
            {error?.message || 'A critical error occurred. Please reload the page.'}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: '#1A5CB5', color: '#fff', fontSize: 13,
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
