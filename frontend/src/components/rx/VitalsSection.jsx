'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const C = { navy:'#0F2342', coral:'#E84C3D', cream:'#F7F5F0', surface:'#FAFAF7', border:'#D3D1C7', muted:'#6B7A9A' }

function VInput({ label, value, onChange, placeholder, unit }) {
  const [focus, setFocus] = useState(false)
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', border:`1.5px solid ${focus ? C.navy : C.border}`, borderRadius:7, background:'#fff', overflow:'hidden', transition:'border .15s' }}>
        <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
          style={{ flex:1, border:'none', outline:'none', padding:'9px 10px', fontSize:14, color:C.navy, background:'transparent', fontFamily:'inherit', minWidth:0 }}/>
        {unit && <span style={{ fontSize:11, color:C.muted, paddingRight:8, flexShrink:0 }}>{unit}</span>}
      </div>
    </div>
  )
}

export default function VitalsSection({ vitals, onChange, lastVisitVitals }) {
  const [open, setOpen] = useState(true)
  const up = (f,v) => onChange({ ...vitals, [f]:v })

  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', background:'#fff', marginBottom:14 }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', background:C.surface, border:'none', cursor:'pointer', borderBottom: open?`1px solid ${C.border}`:'none' }}>
        <span style={{ fontSize:12, fontWeight:700, color:C.navy, letterSpacing:'.06em' }}>VITALS</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {lastVisitVitals && open && (
            <button onClick={e=>{e.stopPropagation(); onChange({...lastVisitVitals})}}
              style={{ fontSize:11, color:C.coral, background:'none', border:`1px solid ${C.coral}`, borderRadius:4, padding:'2px 8px', cursor:'pointer', fontFamily:'inherit' }}>
              Same as last visit
            </button>
          )}
          {open ? <ChevronUp size={15} color={C.muted}/> : <ChevronDown size={15} color={C.muted}/>}
        </div>
      </button>
      {open && (
        <div style={{ padding:14, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10 }}>
          <VInput label="BP" value={vitals.bp} onChange={v=>up('bp',v)} placeholder="120/80" unit="mmHg"/>
          <VInput label="Pulse" value={vitals.pulse} onChange={v=>up('pulse',v)} placeholder="72" unit="bpm"/>
          <VInput label="Temp" value={vitals.temp} onChange={v=>up('temp',v)} placeholder="98.6" unit="°F"/>
          <VInput label="Weight" value={vitals.weight} onChange={v=>up('weight',v)} placeholder="70" unit="kg"/>
          <VInput label="SpO₂" value={vitals.spo2} onChange={v=>up('spo2',v)} placeholder="98" unit="%"/>
          <VInput label="Height" value={vitals.height} onChange={v=>up('height',v)} placeholder="165" unit="cm"/>
        </div>
      )}
    </div>
  )
}
