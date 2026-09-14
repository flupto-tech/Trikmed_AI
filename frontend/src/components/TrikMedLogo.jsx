/**
 * TrikMedLogo — reusable brand logo component.
 * size: 'sm' | 'md' | 'lg'
 * dark: true = white "Trik" text (for navy/dark backgrounds)
 */
export default function TrikMedLogo({ size = 'md', dark = false }) {
  const dims      = { sm: 24, md: 32, lg: 40 }
  const fontSizes = { sm: 11, md: 14, lg: 18 }
  const textSizes = { sm: 15, md: 20, lg: 26 }
  const s  = dims[size]
  const fs = fontSizes[size]
  const ts = textSizes[size]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: s, height: s, background: '#E84C3D', borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ color: 'white', fontWeight: 700, fontSize: fs }}>T</span>
      </div>
      <span style={{ fontWeight: 600, fontSize: ts }}>
        <span style={{ color: dark ? '#ffffff' : '#0F2342' }}>Trik</span>
        <span style={{ color: '#E84C3D' }}>Med</span>
      </span>
    </div>
  )
}
