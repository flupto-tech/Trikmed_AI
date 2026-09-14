'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, Plus, Star } from 'lucide-react'
import { searchMedicines } from '../../../lib/medicines-data'
import { getCustomMedicines, getFavourites } from '../../../lib/rxStorage'

const LIGHT = { navy:'#0F2342', coral:'#E84C3D', cream:'#F7F5F0', surface:'#FAFAF7', border:'#D3D1C7', muted:'#6B7A9A', blue:'#1A5CB5', dropBg:'#fff', dropBorder:'#D3D1C7', hover:'#F7F5F0' }
const DARK  = { navy:'#F0F0F0', coral:'#E84C3D', cream:'#243040', surface:'#243040', border:'#2A3A50', muted:'#7A93AC', blue:'#4A90D9', dropBg:'#1A2332', dropBorder:'#2A3A50', hover:'#243040' }

// Highlight matching substring in text
function Highlight({ text='', query='', baseColor, highlightColor }) {
  if (!query || !text) return <span style={{ color:baseColor }}>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span style={{ color:baseColor }}>{text}</span>
  return (
    <span style={{ color:baseColor }}>
      {text.slice(0, idx)}
      <mark style={{ background:'rgba(232,76,61,.25)', color:highlightColor, borderRadius:2, padding:'0 1px' }}>{text.slice(idx, idx+query.length)}</mark>
      {text.slice(idx+query.length)}
    </span>
  )
}

export default function MedicineSearch({ doctorId='dr001', onSelect, onAddCustom, dark=false }) {
  const C = dark ? DARK : LIGHT
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [favIds, setFavIds] = useState([])
  const ref = useRef(null)
  const inputRef = useRef(null)
  const timer = useRef(null)

  useEffect(() => { setFavIds(getFavourites(doctorId).map(f=>f.id)) }, [doctorId])

  useEffect(() => {
    clearTimeout(timer.current)
    if (q.length < 2) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(() => {
      const custom = getCustomMedicines(doctorId)
      const r = searchMedicines(q, custom).slice(0, 8)
      setResults(r); setOpen(true)
    }, 280)
    return () => clearTimeout(timer.current)
  }, [q, doctorId])

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }

  function pick(med) {
    onSelect({
      id: med.id,
      brandName: med.brandName,
      genericName: med.genericName,
      strength: med.strengths?.[0] || '',
      strengths: med.strengths || [],
      form: med.form,
      dosage: med.defaultDosage || '',
      timing: med.defaultTiming || '',
      duration: med.defaultDuration || '',
      notes: '',
      isCustom: med.isCustom || false,
    })
    setQ(''); setResults([]); setOpen(false)
  }

  function addCustom() {
    setOpen(false)
    setQ('')
    onAddCustom?.()
  }

  const hasResults = results.length > 0

  return (
    <div ref={ref} style={{ position:'relative', width:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, border:`1.5px dashed ${C.coral}`, borderRadius:8, padding:'0 12px', background:C.surface, minHeight:44 }}>
        <Search size={14} color={C.coral}/>
        <input
          ref={inputRef}
          value={q}
          onChange={e=>setQ(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={()=>q.length>=2&&setOpen(true)}
          placeholder="Search medicine (brand or generic)…"
          style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:14, color:C.navy, padding:'10px 0', fontFamily:'inherit' }}/>
      </div>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:200, background:C.dropBg, border:`1px solid ${C.dropBorder}`, borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.18)', overflow:'hidden' }}>
          {hasResults ? (
            <>
              {results.map(med => (
                <button key={med.id} onClick={()=>pick(med)}
                  style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 12px', border:'none', background:'none', cursor:'pointer', textAlign:'left', borderBottom:`1px solid ${C.dropBorder}`, fontFamily:'inherit' }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.hover}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  {favIds.includes(med.id) && <Star size={11} fill={C.coral} color={C.coral} style={{flexShrink:0}}/>}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
                      <Highlight text={med.brandName} query={q} baseColor={C.navy} highlightColor={C.coral}/>
                      {med.isCustom && <span style={{ fontSize:10, background: dark?'rgba(74,144,217,.15)':'#EFF6FF', color:C.blue, padding:'1px 5px', borderRadius:4 }}>Custom</span>}
                    </div>
                    <div style={{ fontSize:11, marginTop:2 }}>
                      <Highlight text={med.genericName} query={q} baseColor={C.muted} highlightColor={C.coral}/>
                      {med.form && <span style={{ color:C.muted }}> · {med.form}</span>}
                      {med.strengths?.length>0 && <span style={{ color:C.muted }}> · {med.strengths[0]}</span>}
                    </div>
                  </div>
                  {med.category && <span style={{ fontSize:10, color:C.muted, flexShrink:0 }}>{med.category}</span>}
                </button>
              ))}
              <button onClick={addCustom}
                style={{ display:'flex', alignItems:'center', gap:6, width:'100%', padding:'8px 12px', border:'none', background:'none', cursor:'pointer', color:C.coral, fontSize:12, fontWeight:600, fontFamily:'inherit', borderTop:`1px solid ${C.dropBorder}` }}>
                <Plus size={12}/>Add custom medicine
              </button>
            </>
          ) : (
            <div style={{ padding:'10px 12px' }}>
              <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>No results for "{q}"</div>
              <button onClick={addCustom}
                style={{ display:'flex', alignItems:'center', gap:6, width:'100%', padding:'7px 10px', border:`1px dashed ${C.coral}`, borderRadius:6, background:'none', cursor:'pointer', color:C.coral, fontSize:13, fontWeight:600, fontFamily:'inherit' }}>
                <Plus size={13}/>Add "{q}" as custom medicine
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
