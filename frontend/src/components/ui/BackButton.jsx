'use client'
import { useNavigate } from '../../utils/navigation'

export default function BackButton() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          navigate(-1)
        } else {
          navigate('/dashboard')
        }
      }}
      onMouseEnter={e => { e.currentTarget.style.color = '#0F2342' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'none',
        border: 'none',
        color: '#6B7280',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        padding: '6px 0',
        marginBottom: '16px',
        fontFamily: 'inherit',
        transition: 'color 0.15s',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2.5"
           strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Back
    </button>
  )
}
