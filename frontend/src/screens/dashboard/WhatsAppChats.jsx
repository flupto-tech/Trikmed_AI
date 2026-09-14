'use client'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Send, Bot, User, Zap, X, MoreVertical, PenSquare,
  Smile, Paperclip, Mic, Image, FileText, Camera, MapPin, UserRound,
  FileImage, File, AlertCircle,
} from 'lucide-react'
// emoji-mart removed — replaced with lightweight inline picker below
import { patients } from '../../data/mockData'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { Button } from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { trapFocus, getFocusableElements } from '../../components/ui/focusUtils'
// TODO: Ashutosh uncomment ↓
// import { whatsappApi } from '../../services/whatsappApi'

// ── Local WhatsApp mock data ──────────────────────────────────────────────────
const whatsappChats = [
  {
    id: 'WA001', name: 'Amit Sharma', phone: '+91 98765 43210', avatar: 'AS',
    lastMessage: '✅ Appointment confirmed for 3:30 PM', lastTime: '10:31 AM',
    unread: 0, status: 'online',
    messages: [
      { id:1, from:'patient', text:"Hi, I need to book an appointment with Dr. Sharma", time:'10:28 AM', ai:false },
      { id:2, from:'bot', text:"👋 Welcome to City Care Clinic!\n\nI'm your AI receptionist. Available slots today:\n📅 2:00 PM\n📅 3:30 PM\n📅 5:00 PM\n\nReply with your preferred time or type 'more' for tomorrow's slots.", time:'10:28 AM', ai:true },
      { id:3, from:'patient', text:'3:30 PM please', time:'10:30 AM', ai:false },
      { id:4, from:'bot', text:"✅ *Appointment Confirmed!*\n\n👨‍⚕️ Dr. Rajesh Sharma\n🕐 Today at 3:30 PM\n📍 City Care Clinic, MG Road\n\nReminder will be sent 1 hour before 🔔\n\nNeed to cancel? Reply 'cancel'", time:'10:31 AM', ai:true },
    ],
  },
  {
    id: 'WA002', name: 'Priya Gupta', phone: '+91 97654 11111', avatar: 'PG',
    lastMessage: 'Thank you doctor 🙏', lastTime: '09:15 AM',
    unread: 1, status: 'offline',
    messages: [
      { id:1, from:'bot', text:"⏰ *Reminder:* Your appointment with Dr. Rajesh Sharma is in 1 hour.\n\n🕐 10:00 AM today\n📍 City Care Clinic, MG Road\n\nReply 'confirm' to confirm or 'reschedule' to change.", time:'09:00 AM', ai:true },
      { id:2, from:'patient', text:'confirm', time:'09:10 AM', ai:false },
      { id:3, from:'bot', text:"✅ Great! We'll see you at 10:00 AM. Please bring any previous reports.", time:'09:10 AM', ai:true },
      { id:4, from:'patient', text:'Thank you doctor 🙏', time:'09:15 AM', ai:false },
    ],
  },
  {
    id: 'WA003', name: 'Suresh Verma', phone: '+91 96543 22222', avatar: 'SV',
    lastMessage: '💊 Take Metformin 500mg twice daily', lastTime: 'Yesterday',
    unread: 0, status: 'offline',
    messages: [
      { id:1, from:'bot', text:"💊 *Medication Reminder*\n\nHi Suresh! Time for your evening medicine:\n• Metformin 500mg — 1 tablet\n• Glimepiride 1mg — 1 tablet\n\nDon't skip! 🙏", time:'08:00 PM', ai:true },
      { id:2, from:'patient', text:'Done ✅', time:'08:30 PM', ai:false },
      { id:3, from:'bot', text:'Great job staying consistent! Your next appointment is in 5 days. Stay healthy! 💪', time:'08:30 PM', ai:true },
    ],
  },
  {
    id: 'WA004', name: 'Meena Singh', phone: '+91 95432 33333', avatar: 'MS',
    lastMessage: 'Is Dr. Sharma available on Saturday?', lastTime: 'Yesterday',
    unread: 2, status: 'online',
    messages: [
      { id:1, from:'patient', text:'Is Dr. Sharma available on Saturday?', time:'06:30 PM', ai:false },
      { id:2, from:'bot', text:"Yes! Dr. Sharma is available on Saturday.\n\nAvailable slots:\n📅 10:00 AM\n📅 11:30 AM\n📅 4:00 PM\n📅 5:30 PM\n\nWhich slot would you prefer?", time:'06:30 PM', ai:true },
      { id:3, from:'patient', text:'11:30 AM please. My name is Meena Singh', time:'06:32 PM', ai:false },
      { id:4, from:'bot', text:"✅ Booked! Appointment confirmed:\n\n👤 Meena Singh\n👨‍⚕️ Dr. Rajesh Sharma\n📅 This Saturday at 11:30 AM\n\nSee you then! 🙏", time:'06:32 PM', ai:true },
    ],
  },
  {
    id: 'WA005', name: 'Rajesh Patel', phone: '+91 94321 44444', avatar: 'RP',
    lastMessage: 'Missed call follow-up sent automatically', lastTime: '2 days ago',
    unread: 0, status: 'offline',
    messages: [
      { id:1, from:'bot', text:"👋 Hi! We noticed you called City Care Clinic but we couldn't connect.\n\nBook your appointment instantly here 👇\nOr reply with your preferred time and we'll confirm right away!", time:'02:21 PM', ai:true },
      { id:2, from:'patient', text:'Yes I called. Need appointment tomorrow', time:'03:00 PM', ai:false },
      { id:3, from:'bot', text:"Tomorrow's available slots:\n📅 09:30 AM\n📅 11:00 AM\n📅 02:00 PM\n📅 04:30 PM\n\nWhich time works?", time:'03:00 PM', ai:true },
      { id:4, from:'patient', text:'11 AM', time:'03:02 PM', ai:false },
      { id:5, from:'bot', text:'✅ Confirmed! Rajesh Patel — Tomorrow 11:00 AM. See you!', time:'03:02 PM', ai:true },
    ],
  },
  {
    id: 'WA006', name: 'Kavya Joshi', phone: '+91 93210 55555', avatar: 'KJ',
    lastMessage: 'Please reschedule to 5 PM', lastTime: '2 days ago',
    unread: 0, status: 'offline',
    messages: [
      { id:1, from:'bot', text:"⏰ Reminder: Your appointment is tomorrow at 3:00 PM.\n\nReply 'confirm' or 'reschedule'", time:'06:00 PM', ai:true },
      { id:2, from:'patient', text:'Please reschedule to 5 PM', time:'06:15 PM', ai:false },
      { id:3, from:'bot', text:"✅ Rescheduled! New time: Tomorrow at 5:00 PM\n\nWe'll send a reminder an hour before. See you!", time:'06:15 PM', ai:true },
    ],
  },
]

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  panelBg:   'var(--color-surface)', headerBg:  'var(--color-surface)',
  rowHover:  'var(--color-surface-subtle)', rowActive: 'var(--color-blue-light)',
  inputField:'var(--color-surface-subtle)', divider:   'var(--color-border)',
  iconColor: 'var(--color-text-muted)', white:     'var(--color-text-primary)', muted:     'var(--color-text-muted)',
  teal:      'var(--color-blue)', inBubble:  'var(--color-surface)', outBubble: 'var(--color-blue-light)',
  chatBg:    'var(--color-background)', attachBg:  'var(--color-surface)',
  navy:      'var(--color-navy)', coral: 'var(--color-coral)',
}
const CHAT_BG = {
  backgroundColor: C.chatBg,
  backgroundImage: 'linear-gradient(180deg, rgba(239,246,255,0.55), rgba(249,250,251,0.86))',
}
const URL_RE = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/gi

function fmtBytes(b) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

// ── Read ticks ────────────────────────────────────────────────────────────────
function ReadTicks() {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" style={{ display:'inline', verticalAlign:'middle', marginLeft:2 }}>
      <path d="M.075 5.293L4.5 9.718l.53-.53L1.135 5.29z" fill={C.teal}/>
      <path d="M14.296.147L5.5 8.943 1.851 5.294.791 6.354l4.709 4.709 9.855-9.855z" fill={C.teal}/>
    </svg>
  )
}

// ── Shared icon button ────────────────────────────────────────────────────────
function HBtn({ children, onClick, title, ariaLabel, danger, active }) {
  const [h,setH] = useState(false)
  const accessibleName = ariaLabel || title
  return (
    <button type="button" title={title || accessibleName} aria-label={accessibleName} onClick={onClick}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ width:36, height:36, borderRadius:'var(--radius-md)', border:'none', cursor:'pointer',
        background: h ? (danger?'var(--color-error-bg)':'var(--color-surface-subtle)') : active?'var(--color-blue-light)':'transparent',
        color: h&&danger ? 'var(--color-error-text)' : active ? C.teal : C.iconColor,
        display:'flex', alignItems:'center', justifyContent:'center',
        transition:'background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)', flexShrink:0 }}>
      {children}
    </button>
  )
}

function useDialogAccessibility(onClose, active = true) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!active) return undefined
    const previousActiveElement = document.activeElement

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
      trapFocus(event, dialogRef.current)
    }

    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => {
      getFocusableElements(dialogRef.current)[0]?.focus()
    })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousActiveElement && document.contains(previousActiveElement)) {
        previousActiveElement.focus?.()
      }
    }
  }, [active, onClose])

  return dialogRef
}

// ── Take Over button ──────────────────────────────────────────────────────────
function TakeOverBtn() {
  const [h,setH] = useState(false)
  return (
    <button type="button" onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ fontSize:12, fontWeight:700, color:C.navy,
        background: h?'var(--color-surface-subtle)':'var(--color-surface)',
        border:'1.5px solid var(--color-border)', borderRadius:'var(--radius-btn)',
        padding:'7px 12px', cursor:'pointer', transition:'background var(--duration-fast) var(--ease-out)', flexShrink:0 }}>
      Take over
    </button>
  )
}

// ── Camera Modal ──────────────────────────────────────────────────────────────
function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef()
  const canvasRef = useRef()
  const dialogRef = useDialogAccessibility(onClose)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState('')
  const [captured, setCaptured] = useState(null)

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: { facingMode:'user' } })
      .then(s => { setStream(s); if (videoRef.current) videoRef.current.srcObject = s })
      .catch(() => setError('Camera permission denied or not available'))
    return () => stream?.getTracks().forEach(t => t.stop())
  }, [])

  const capture = () => {
    const v = videoRef.current, c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    setCaptured(c.toDataURL('image/jpeg', 0.8))
  }

  const send = () => {
    if (captured) { onCapture(captured); onClose() }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-camera-title"
        style={{ background:'#ffffff', borderRadius:12, overflow:'hidden', width:480, maxWidth:'95vw' }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:C.headerBg }}>
          <span id="whatsapp-camera-title" style={{ color:C.white, fontWeight:600, fontSize:15 }}>Take Photo</span>
          <HBtn ariaLabel="Close camera dialog" onClick={onClose}><X size={18}/></HBtn>
        </div>
        <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12 }}>
          {error ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'16px', background:'rgba(220,38,38,0.1)', borderRadius:8, color:'#f87171' }}>
              <AlertCircle size={18}/> <span style={{ fontSize:14 }}>{error}</span>
            </div>
          ) : captured ? (
            <img src={captured} style={{ width:'100%', borderRadius:8, maxHeight:320, objectFit:'contain', background:'#000' }} alt="captured"/>
          ) : (
            <video ref={videoRef} autoPlay muted style={{ width:'100%', borderRadius:8, maxHeight:320, background:'#000' }}/>
          )}
          <canvas ref={canvasRef} style={{ display:'none' }}/>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            {!captured && !error && (
              <Button onClick={capture}>Capture</Button>
            )}
            {captured && (
              <>
                <Button variant="secondary" onClick={() => setCaptured(null)}>Retake</Button>
                <Button onClick={send}>Send</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Contact Modal ─────────────────────────────────────────────────────────────
function ContactModal({ onSend, onClose }) {
  const [q, setQ] = useState('')
  const dialogRef = useDialogAccessibility(onClose)
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) || p.phone.includes(q)
  ).slice(0, 12)

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-contact-title"
        style={{ background:'#ffffff', borderRadius:12, width:400, maxWidth:'95vw', maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:C.headerBg, flexShrink:0 }}>
          <span id="whatsapp-contact-title" style={{ color:C.white, fontWeight:600, fontSize:15 }}>Send Contact</span>
          <HBtn ariaLabel="Close contact dialog" onClick={onClose}><X size={18}/></HBtn>
        </div>
        <div style={{ padding:'8px 12px', background:C.panelBg, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:C.inputField, borderRadius:8, height:35, padding:'0 12px' }}>
            <Search size={14} style={{ color:C.muted }}/>
            <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search patients…"
              aria-label="Search patients to share contact"
              style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:14, color:C.white }}/>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {filtered.map(p => {
            const initials = p.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
            return (
              <button type="button" key={p.id} onClick={()=>{ onSend(p); onClose() }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'10px 16px', cursor:'pointer', border:'none', borderBottom:`1px solid ${C.divider}`, background:'transparent', textAlign:'left' }}
                onMouseEnter={e=>e.currentTarget.style.background=C.rowHover}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'#1A5CB5', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, flexShrink:0 }}>
                  {initials}
                </div>
                <div>
                  <p style={{ fontSize:14, fontWeight:500, color:C.white, margin:0 }}>{p.name}</p>
                  <p style={{ fontSize:12, color:C.muted, margin:'2px 0 0' }}>{p.phone}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Location Modal ────────────────────────────────────────────────────────────
function LocationModal({ onSend, onClose }) {
  const [loc, setLoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const dialogRef = useDialogAccessibility(onClose)

  useEffect(() => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); setLoading(false); return }
    navigator.geolocation.getCurrentPosition(
      pos => { setLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLoading(false) },
      () => {
        // Fallback: use Delhi coordinates for demo
        setLoc({ lat: 28.6139, lon: 77.2090, fallback: true })
        setLoading(false)
      }
    )
  }, [])

  const mapSrc = loc
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${loc.lon-0.008},${loc.lat-0.008},${loc.lon+0.008},${loc.lat+0.008}&layer=mapnik&marker=${loc.lat},${loc.lon}`
    : null

  const address = loc?.fallback
    ? 'New Delhi, India (demo location)'
    : loc ? `${loc.lat.toFixed(4)}°N, ${loc.lon.toFixed(4)}°E` : ''

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-location-title"
        style={{ background:'#ffffff', borderRadius:12, width:480, maxWidth:'95vw', overflow:'hidden' }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:C.headerBg }}>
          <span id="whatsapp-location-title" style={{ color:C.white, fontWeight:600, fontSize:15 }}>Send Location</span>
          <HBtn ariaLabel="Close location dialog" onClick={onClose}><X size={18}/></HBtn>
        </div>
        <div style={{ padding:16 }}>
          {loading && <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:C.muted, fontSize:14 }}>Getting location…</div>}
          {!loading && mapSrc && (
            <iframe src={mapSrc} style={{ width:'100%', height:240, border:'none', borderRadius:8 }} title="Location map" loading="lazy"/>
          )}
          {!loading && address && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12 }}>
              <MapPin size={16} style={{ color:C.teal, flexShrink:0 }}/>
              <span style={{ fontSize:13, color:C.white }}>{address}</span>
            </div>
          )}
          {error && <p style={{ color:'#f87171', fontSize:13, marginTop:8 }}>{error}</p>}
          {!loading && loc && (
            <Button fullWidth className="mt-3" onClick={() => { onSend({ lat: loc.lat, lon: loc.lon, address, mapSrc }); onClose() }}>
              Send Location
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Attachment bubble renderers ───────────────────────────────────────────────
function ImageBubble({ src, name }) {
  return (
    <div style={{ borderRadius:6, overflow:'hidden', marginBottom:4 }}>
      <img src={src} alt={name||'image'} style={{ maxWidth:'100%', maxHeight:200, objectFit:'contain', display:'block', borderRadius:6 }}/>
    </div>
  )
}
function DocumentBubble({ name, size, isOut }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, background: isOut?'rgba(15,35,66,0.08)':'var(--color-surface-subtle)', borderRadius:'var(--radius-md)', padding:'8px 10px', marginBottom:4, minWidth:180 }}>
      <div style={{ width:36, height:36, borderRadius:'var(--radius-md)', background: isOut?'rgba(15,35,66,0.10)':'var(--color-blue-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <File size={18} style={{ color: isOut?C.white:C.teal }}/>
      </div>
      <div style={{ minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:500, color:C.white, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{name}</p>
        {size && <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{fmtBytes(size)}</p>}
      </div>
    </div>
  )
}
function ContactBubble({ name, phone, isOut }) {
  const initials = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, background: isOut?'rgba(15,35,66,0.08)':'var(--color-surface-subtle)', borderRadius:'var(--radius-md)', padding:'8px 10px', marginBottom:4, minWidth:200 }}>
      <div style={{ width:36, height:36, borderRadius:'var(--radius-full)', background:'var(--color-blue)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>
        {initials}
      </div>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:C.white, margin:0 }}>{name}</p>
        <p style={{ fontSize:12, color:C.muted, margin:'2px 0 0' }}>{phone}</p>
      </div>
    </div>
  )
}
function LocationBubble({ address, lat, lon }) {
  const thumb = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=14&size=240x110&markers=${lat},${lon},red`
  return (
    <div style={{ borderRadius:8, overflow:'hidden', marginBottom:4, minWidth:220 }}>
      <div style={{ height:110, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
        <img src={thumb} alt="map" style={{ width:'100%', height:'100%', objectFit:'cover' }}
          onError={e=>{ e.target.style.display='none' }}/>
        <div style={{ position:'absolute', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <MapPin size={24} style={{ color:C.teal }}/>
        </div>
      </div>
      <div style={{ padding:'6px 10px', background:'#F7F9FF', display:'flex', alignItems:'center', gap:6 }}>
        <MapPin size={12} style={{ color:C.teal, flexShrink:0 }}/>
        <span style={{ fontSize:12, color:'var(--color-text-primary)' }}>{address}</span>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WhatsAppChats() {
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError,   setPageError]   = useState(null)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment ↓
      // const res = await whatsappApi.getConversations()
      // setChats(res)
    } catch (e) {
      console.error('Failed to load WhatsApp chats:', e)
      setPageError(e?.message || e?.detail || 'Failed to load WhatsApp chats')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const [chats, setChats]     = useState(whatsappChats)
  const [activeId, setActiveId] = useState(whatsappChats[0].id)
  const [input, setInput]     = useState('')
  const [search, setSearch]   = useState('')
  const [hoveredRowId, setHoveredRowId] = useState(null)

  // Panels
  // Left-panel header controls
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false)
  const [newChatOpen, setNewChatOpen]   = useState(false)
  const [newChatQuery, setNewChatQuery] = useState('')
  const [menuOpen, setMenuOpen]         = useState(false)

  // Chat input controls
  const [emojiOpen, setEmojiOpen]     = useState(false)
  const [attachOpen, setAttachOpen]   = useState(false)
  const [cameraOpen, setCameraOpen]   = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)

  // Pending attachments (shown above input, before send)
  const [pending, setPending] = useState([])

  // Link preview
  const [linkPreview, setLinkPreview] = useState(null)

  const bottomRef      = useRef()
  const photoRef       = useRef()
  const docRef         = useRef()
  const emojiAnchorRef = useRef()
  const attachAnchorRef = useRef()
  const menuRef        = useRef()
  const headerSearchRef = useRef()
  const closeNewChat = useCallback(() => {
    setNewChatOpen(false)
    setNewChatQuery('')
  }, [])
  const newChatDialogRef = useDialogAccessibility(closeNewChat, newChatOpen)

  const activeChat = useMemo(() => chats.find(c => c.id === activeId), [chats, activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'auto' })
  }, [activeId, activeChat?.messages?.length])

  // Detect URL in input for link preview
  useEffect(() => {
    const urls = input.match(URL_RE)
    if (urls && urls.length > 0) {
      const url = urls[0]
      try {
        const domain = new URL(url).hostname.replace('www.','')
        setLinkPreview({ url, domain, title: domain, description: url })
      } catch { setLinkPreview(null) }
    } else {
      setLinkPreview(null)
    }
  }, [input])

  // Close emoji/attach/menu popups on outside click
  useEffect(() => {
    if (!emojiOpen && !attachOpen && !menuOpen) return
    const handler = (e) => {
      if (emojiAnchorRef.current && !emojiAnchorRef.current.contains(e.target)) setEmojiOpen(false)
      if (attachAnchorRef.current && !attachAnchorRef.current.contains(e.target)) setAttachOpen(false)
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [emojiOpen, attachOpen, menuOpen])

  // ── Message sending ──
  const buildAndSend = useCallback((text, attachmentList) => {
    const msgs = []
    attachmentList.forEach(att => {
      msgs.push({ id: Date.now() + Math.random(), from:'doctor', time: now(), attachment: att })
    })
    if (text.trim()) {
      msgs.push({ id: Date.now() + Math.random(), from:'doctor', text: text.trim(), time: now() })
    }
    if (!msgs.length) return
    setChats(prev => prev.map(c =>
      c.id === activeId ? { ...c, messages:[...c.messages, ...msgs], lastMessage: text||'Attachment', unread:0 } : c
    ))
    setPending([])
    setInput('')
    setLinkPreview(null)
  }, [activeId])

  const sendMessage = () => buildAndSend(input, pending)

  // ── File handlers ──
  const handlePhotoFiles = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPending(p => [...p, { id:Date.now()+Math.random(), type:'image', src:ev.target.result, name:f.name, size:f.size }])
      reader.readAsDataURL(f)
    })
    e.target.value = ''
    setAttachOpen(false)
  }
  const handleDocFiles = (e) => {
    Array.from(e.target.files).forEach(f => {
      setPending(p => [...p, { id:Date.now()+Math.random(), type:'document', name:f.name, size:f.size }])
    })
    e.target.value = ''
    setAttachOpen(false)
  }

  const handleCameraCapture = (dataUrl) => {
    setPending(p => [...p, { id:Date.now(), type:'image', src:dataUrl, name:'photo.jpg' }])
  }
  const handleContactSend = (patient) => {
    buildAndSend('', [{ id:Date.now(), type:'contact', name:patient.name, phone:patient.phone }])
  }
  const handleLocationSend = (locData) => {
    buildAndSend('', [{ id:Date.now(), type:'location', ...locData }])
  }

  const removePending = (id) => setPending(p => p.filter(x => x.id !== id))

  const openChat = (id) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, unread:0 } : c))
    setActiveId(id)
  }
  const closeChat = () => setActiveId(null)

  const openOrCreateChat = (patient) => {
    const existing = chats.find(c => c.phone === patient.phone || c.name === patient.name)
    if (existing) {
      openChat(existing.id)
    } else {
      const newChat = {
        id: Date.now(), name: patient.name, phone: patient.phone || '',
        status: 'offline', lastMessage: '', lastTime: '', unread: 0, messages: [],
      }
      setChats(prev => [newChat, ...prev])
      setActiveId(newChat.id)
    }
    setNewChatOpen(false)
    setNewChatQuery('')
  }

  const ATTACH_OPTIONS = [
    { key:'photos',   label:'Photos & Videos', Icon:Image,     bg:'#bf59cf', action:()=>{ photoRef.current?.click(); setAttachOpen(false) } },
    { key:'document', label:'Document',        Icon:FileText,  bg:'#5157ae', action:()=>{ docRef.current?.click();   setAttachOpen(false) } },
    { key:'camera',   label:'Camera',          Icon:Camera,    bg:'#0b8b4a', action:()=>{ setCameraOpen(true);        setAttachOpen(false) } },
    { key:'contact',  label:'Contact',         Icon:UserRound, bg:'#009de2', action:()=>{ setContactOpen(true);       setAttachOpen(false) } },
    { key:'location', label:'Location',        Icon:MapPin,    bg:'#0b8b4a', action:()=>{ setLocationOpen(true);      setAttachOpen(false) } },
  ]

  const normalizedSearch = search.toLowerCase()
  const filteredChats = useMemo(() => chats.filter(c =>
    c.name.toLowerCase().includes(normalizedSearch) || c.phone.includes(search)
  ), [chats, normalizedSearch, search])
  const normalizedNewChatQuery = newChatQuery.toLowerCase()
  const filteredPatients = useMemo(() => patients.filter(p =>
    p.name.toLowerCase().includes(normalizedNewChatQuery) || (p.phone||'').includes(newChatQuery)
  ), [patients, normalizedNewChatQuery, newChatQuery])

  if (pageLoading) return <LoadingSpinner message="Loading chats…" />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <>
      <style>{`
        .wa-page {
          height: calc(100vh - 112px);
          min-height: 640px;
          display: grid;
          grid-template-columns: minmax(320px, 368px) minmax(0, 1fr);
          overflow: hidden;
          border: calc(var(--space-0-5) / 2) solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
          box-shadow: var(--shadow-sm);
          font-family: var(--font-body);
        }
        .wa-sidebar {
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: var(--color-surface);
          border-right: calc(var(--space-0-5) / 2) solid var(--color-border);
        }
        .wa-main {
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: var(--color-background);
        }
        .wa-thread {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .wa-thread-scroll {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-6) min(7vw, var(--space-12));
          display: flex;
          flex-direction: column;
        }
        .wa-conversation-row:focus-visible {
          outline: 2px solid var(--color-blue);
          outline-offset: -2px;
        }
        .wa-message-wrap {
          max-width: min(680px, 72%);
          position: relative;
        }
        .wa-bubble {
          border: calc(var(--space-0-5) / 2) solid rgba(15, 35, 66, 0.08);
        }
        .wa-composer {
          flex-shrink: 0;
          background: var(--color-surface);
          border-top: calc(var(--space-0-5) / 2) solid var(--color-border);
        }
        @media (max-width: 900px) {
          .wa-page {
            grid-template-columns: 320px minmax(0, 1fr);
          }
          .wa-thread-scroll {
            padding: var(--space-4);
          }
        }
        @media (max-width: 720px) {
          .wa-page {
            height: calc(100vh - 96px);
            min-height: 560px;
            grid-template-columns: 1fr;
          }
          .wa-sidebar[data-hidden-mobile="true"],
          .wa-main[data-hidden-mobile="true"] {
            display: none;
          }
          .wa-message-wrap {
            max-width: 88%;
          }
        }
      `}</style>
      {/* Hidden file inputs */}
      <input ref={photoRef} type="file" accept="image/*,video/*" multiple hidden onChange={handlePhotoFiles}/>
      <input ref={docRef}   type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" multiple hidden onChange={handleDocFiles}/>

      <div className="wa-page">

        {/* ══ LEFT PANEL ══════════════════════════════════════════════════ */}
        <div className="wa-sidebar" data-hidden-mobile={activeChat ? 'true' : undefined}>

          {/* Top bar – animates to search bar */}
          <AnimatePresence initial={false} mode="wait">
            {headerSearchOpen ? (
              <motion.div key="search-bar"
                initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                transition={{ duration:0.15 }}
                style={{ minHeight:68, display:'flex', alignItems:'center', gap:'var(--space-3)', padding:'0 var(--space-4)', background:C.headerBg, borderBottom:'calc(var(--space-0-5) / 2) solid var(--color-border)', flexShrink:0 }}>
                <button onClick={()=>{ setHeaderSearchOpen(false); setSearch('') }}
                  aria-label="Close conversation search"
                  style={{ width:36, height:36, borderRadius:'var(--radius-md)', border:'none', cursor:'pointer', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:C.teal }}>
                  <X size={20}/>
                </button>
                <div style={{ flex:1, display:'flex', alignItems:'center', gap:'var(--space-2)', background:C.inputField, borderRadius:'var(--radius-btn)', minHeight:42, padding:'0 var(--space-3)', border:'calc(var(--space-0-5) / 2) solid var(--color-border)' }}>
                  <Search size={15} style={{ color:C.muted, flexShrink:0 }}/>
                  <input ref={headerSearchRef} type="text" placeholder="Search conversations…" value={search}
                    aria-label="Search conversations"
                    onChange={e=>setSearch(e.target.value)} autoFocus
                    style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:14, color:C.white }}/>
                  {search && (
                    <button type="button" aria-label="Clear conversation search" onClick={()=>setSearch('')} style={{ background:'transparent', border:'none', cursor:'pointer', color:C.muted, display:'flex', padding:0 }}><X size={14}/></button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="header-bar"
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
                transition={{ duration:0.15 }}
                style={{ minHeight:68, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'var(--space-4)', padding:'0 var(--space-4)', background:C.headerBg, borderBottom:'calc(var(--space-0-5) / 2) solid var(--color-border)', flexShrink:0 }}>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:'var(--text-h5)', fontWeight:700, color:C.white, margin:0 }}>Patient inbox</p>
                  <p style={{ fontSize:'var(--text-xs)', color:C.muted, margin:'var(--space-1) 0 0' }}>AI-assisted WhatsApp conversations</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'var(--space-1)' }}>
                  <HBtn title="Search" onClick={()=>setHeaderSearchOpen(true)}><Search size={20}/></HBtn>
                  <HBtn title="New chat" onClick={()=>{ setNewChatOpen(true); setNewChatQuery('') }}><PenSquare size={20}/></HBtn>
                  {/* Menu button + dropdown */}
                  <div ref={menuRef} style={{ position:'relative' }}>
                    <HBtn title="Menu" active={menuOpen} onClick={()=>setMenuOpen(p=>!p)}><MoreVertical size={20}/></HBtn>
                    {menuOpen && (
                      <div style={{ position:'absolute', top:'calc(100% + 4px)', right:0, zIndex:200,
                        background:'var(--color-surface)', borderRadius:'var(--radius-md)', minWidth:180,
                        border:'calc(var(--space-0-5) / 2) solid var(--color-border)',
                        boxShadow:'var(--shadow-lg)', overflow:'hidden' }}>
                        {[
                          { label:'Starred Messages', icon:'★' },
                          { label:'Settings',         icon:'⚙' },
                          { label:'Logout',           icon:'⏻' },
                        ].map(item => (
                          <button key={item.label} onClick={()=>setMenuOpen(false)}
                            style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'11px 16px',
                              background:'transparent', border:'none', cursor:'pointer', textAlign:'left',
                              color:C.white, fontSize:14 }}
                            onMouseEnter={e=>e.currentTarget.style.background='var(--color-surface-subtle)'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <span style={{ fontSize:16, color:C.muted }}>{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conversation list */}
          <div style={{ flex:1, overflowY:'auto', padding:'var(--space-2) 0' }}>
            {filteredChats.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No conversations found"
                description="Try a different patient name or phone number."
                style={{ minHeight:'280px', padding:'var(--space-8) var(--space-4)' }}
              />
            ) : filteredChats.map(chat => {
                const isActive  = chat.id === activeId
                const isHovered = hoveredRowId === chat.id
                const initials  = chat.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
                return (
                  <button type="button" key={chat.id} onClick={()=>openChat(chat.id)}
                    className="wa-conversation-row"
                    aria-pressed={isActive}
                    onMouseEnter={()=>setHoveredRowId(chat.id)}
                    onMouseLeave={()=>setHoveredRowId(null)}
                    style={{ width:'100%', minHeight:78, display:'flex', alignItems:'center', gap:'var(--space-3)', padding:'0 var(--space-4)', cursor:'pointer',
                      background: isActive?C.rowActive : isHovered?C.rowHover:'transparent',
                      border:'none', borderBottom:`1px solid ${C.divider}`, borderLeft:`3px solid ${isActive ? 'var(--color-blue)' : 'transparent'}`,
                      transition:'background var(--duration-fast) var(--ease-out)', boxSizing:'border-box', textAlign:'left' }}>
                    {/* Avatar */}
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <div style={{ width:48, height:48, borderRadius:'var(--radius-full)', background:'var(--color-blue)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:15, fontWeight:800 }}>
                        {initials}
                      </div>
                      {chat.status==='online' && (
                        <div style={{ position:'absolute', bottom:2, right:2, width:11, height:11, borderRadius:'50%', background:'var(--color-success-text)', border:`2px solid ${isActive ? C.rowActive : C.panelBg}` }}/>
                      )}
                    </div>
                    {/* Text */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:3 }}>
                        <span style={{ fontSize:'var(--text-sm)', fontWeight:700, color:C.white, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, minWidth:0 }}>{chat.name}</span>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:'var(--text-2xs)', color:chat.unread>0?C.teal:C.muted, flexShrink:0, marginLeft:8 }}>{chat.lastTime}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:'var(--text-xs)', color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{chat.lastMessage || 'No messages yet'}</span>
                        {chat.unread>0 && (
                          <Badge variant="coral" size="sm" type="solid" style={{ minWidth:20, borderRadius:'var(--radius-full)', marginLeft:8, flexShrink:0 }}>{chat.unread}</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            }
          </div>
        </div>

        {/* ══ RIGHT PANEL ═════════════════════════════════════════════════ */}
        <div className="wa-main" data-hidden-mobile={!activeChat ? 'true' : undefined}>
          <AnimatePresence mode="wait">

            {activeChat && (
              <motion.div key={activeChat.id} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.12 }}
                className="wa-thread">

                {/* Chat header */}
                <div style={{ minHeight:72, display:'flex', alignItems:'center', gap:'var(--space-3)', padding:'var(--space-3) var(--space-5)', background:C.headerBg, borderBottom:'calc(var(--space-0-5) / 2) solid var(--color-border)', flexShrink:0 }}>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <div style={{ width:44, height:44, borderRadius:'var(--radius-full)', background:'var(--color-blue)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800 }}>
                      {activeChat.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    {activeChat.status==='online' && (
                      <div style={{ position:'absolute', bottom:1, right:1, width:10, height:10, borderRadius:'50%', background:'var(--color-success-text)', border:`2px solid ${C.headerBg}` }}/>
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:'var(--text-lg)', fontWeight:700, color:C.white, lineHeight:1.2, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{activeChat.name}</p>
                    <p style={{ fontSize:'var(--text-xs)', color:activeChat.status==='online'?'var(--color-success-text)':C.muted, margin:'var(--space-1) 0 0' }}>
                      {activeChat.status==='online'?'Online':'Offline'}
                    </p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)', flexWrap:'wrap', justifyContent:'flex-end' }}>
                    <Badge variant="green" size="lg" type="dot"><Zap size={12}/> AI Active</Badge>
                    <TakeOverBtn/>
                    <HBtn title="Close" onClick={closeChat} danger><X size={18}/></HBtn>
                  </div>
                </div>

                {/* Messages */}
                <div className="wa-thread-scroll" style={CHAT_BG}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:'var(--space-4)' }}>
                    <span style={{ background:'var(--color-surface)', color:C.muted, fontFamily:'var(--font-mono)', fontSize:'var(--text-2xs)', padding:'var(--space-1) var(--space-3)', borderRadius:'var(--radius-sm)', border:'calc(var(--space-0-5) / 2) solid var(--color-border)' }}>TODAY</span>
                  </div>

                  {activeChat.messages.map((msg, i) => {
                    const isPatient  = msg.from==='patient'
                    const isBot      = msg.from==='bot'
                    const isDoctor   = msg.from==='doctor'
                    const isOut      = isBot||isDoctor
                    const prev = activeChat.messages[i-1]
                    const next = activeChat.messages[i+1]
                    const sameAsPrev = prev && prev.from===msg.from
                    const sameAsNext = next && next.from===msg.from
                    const showTail   = !sameAsNext
                    const topMargin  = sameAsPrev ? 2 : 8

                    return (
                      <div key={msg.id} style={{ display:'flex', justifyContent:isPatient?'flex-start':'flex-end', marginTop:topMargin }}>
                        <div className="wa-message-wrap">
                          {!sameAsPrev && isOut && (
                            <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:3, justifyContent:'flex-end' }}>
                              {isBot   && <><Bot  size={10} style={{ color:C.muted }}/><span style={{ fontSize:11, color:C.muted }}>AI Receptionist</span></>}
                              {isDoctor&& <><User size={10} style={{ color:C.muted }}/><span style={{ fontSize:11, color:C.muted }}>Doctor (Manual)</span></>}
                            </div>
                          )}
                          <div className="wa-bubble" style={{
                            background: isPatient ? C.inBubble : isBot ? C.outBubble : 'var(--color-success-bg)', color:C.white,
                            fontSize:14, lineHeight:1.5, whiteSpace:'pre-wrap', wordBreak:'break-word',
                            borderRadius: isPatient ? (showTail?'var(--radius-xs) var(--radius-md) var(--radius-md) var(--radius-md)':'var(--radius-md)') : (showTail?'var(--radius-md) var(--radius-xs) var(--radius-md) var(--radius-md)':'var(--radius-md)'),
                            padding: msg.attachment ? 'var(--space-2)' : 'var(--space-2) var(--space-3) var(--space-6)',
                            boxShadow:'var(--shadow-xs)', position:'relative', minWidth:80,
                          }}>
                            {/* Attachment content */}
                            {msg.attachment?.type==='image'    && <ImageBubble    src={msg.attachment.src}  name={msg.attachment.name}/>}
                            {msg.attachment?.type==='document' && <DocumentBubble name={msg.attachment.name} size={msg.attachment.size} isOut={isOut}/>}
                            {msg.attachment?.type==='contact'  && <ContactBubble  name={msg.attachment.name} phone={msg.attachment.phone} isOut={isOut}/>}
                            {msg.attachment?.type==='location' && <LocationBubble lat={msg.attachment.lat} lon={msg.attachment.lon} address={msg.attachment.address}/>}
                            {/* Text (may accompany attachment) */}
                            {msg.text && <span>{msg.text}</span>}
                            {/* Time */}
                            <span style={{ position:'absolute', bottom:5, right:8, display:'flex', alignItems:'center', gap:2, fontFamily:'var(--font-mono)', fontSize:'var(--text-2xs)', color:C.muted, whiteSpace:'nowrap' }}>
                              {msg.time}{isOut && <ReadTicks/>}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef}/>
                </div>

                {/* Bottom bar */}
                <div className="wa-composer">

                  {/* Pending attachments preview */}
                  {pending.length > 0 && (
                    <div style={{ display:'flex', gap:'var(--space-2)', padding:'var(--space-3) var(--space-5)', flexWrap:'wrap', background:'var(--color-surface-subtle)', borderTop:`1px solid ${C.divider}` }}>
                      {pending.map(att => (
                        <div key={att.id} style={{ position:'relative', flexShrink:0 }}>
                          {att.type==='image' ? (
                            <div style={{ position:'relative' }}>
                              <img src={att.src} alt={att.name} style={{ width:80, height:80, objectFit:'cover', borderRadius:8, display:'block' }}/>
                              <button aria-label={`Remove ${att.name}`} onClick={()=>removePending(att.id)} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'var(--color-navy)', border:'2px solid var(--color-surface)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
                                <X size={10}/>
                              </button>
                            </div>
                          ) : att.type==='document' ? (
                            <div style={{ display:'flex', alignItems:'center', gap:8, background:C.inputField, borderRadius:'var(--radius-md)', padding:'6px 10px', maxWidth:200 }}>
                              <File size={16} style={{ color:C.teal, flexShrink:0 }}/>
                              <div style={{ minWidth:0 }}>
                                <p style={{ fontSize:12, color:C.white, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>{att.name}</p>
                                <p style={{ fontSize:11, color:C.muted, margin:'1px 0 0' }}>{fmtBytes(att.size)}</p>
                              </div>
                              <button aria-label={`Remove ${att.name}`} onClick={()=>removePending(att.id)} style={{ background:'transparent', border:'none', color:C.muted, cursor:'pointer', padding:0, flexShrink:0 }}><X size={14}/></button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Link preview */}
                  {linkPreview && (
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'var(--space-3) var(--space-5)', background:'var(--color-blue-light)', borderTop:`1px solid ${C.divider}` }}>
                      <div style={{ width:4, alignSelf:'stretch', background:C.teal, borderRadius:2, flexShrink:0 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:600, color:C.teal, margin:0 }}>{linkPreview.domain}</p>
                        <p style={{ fontSize:12, color:C.muted, margin:'2px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{linkPreview.url}</p>
                      </div>
                      <button aria-label="Dismiss link preview" onClick={()=>setLinkPreview(null)} style={{ background:'transparent', border:'none', color:C.muted, cursor:'pointer', padding:0, flexShrink:0 }}><X size={14}/></button>
                    </div>
                  )}

                  {/* AI notice */}
                  <div role="status" aria-live="polite" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-2)', margin:'var(--space-3) var(--space-5) 0', padding:'var(--space-2) var(--space-3)', background:'var(--color-blue-light)', border:'calc(var(--space-0-5) / 2) solid var(--color-info-border)', borderRadius:'var(--radius-md)' }}>
                    <Zap size={13} style={{ color:C.teal }} fill={C.teal}/>
                    <span style={{ fontSize:'var(--text-xs)', color:'var(--color-info-text)' }}>AI is handling this conversation. Type below to send a manual message.</span>
                  </div>

                  {/* Input row */}
                  <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)', padding:'var(--space-3) var(--space-5)', position:'relative' }}>
                    {/* Emoji button + popup */}
                    <div ref={emojiAnchorRef} style={{ position:'relative', flexShrink:0 }}>
                      <HBtn title="Emoji" onClick={()=>setEmojiOpen(p=>!p)} active={emojiOpen}><Smile size={24}/></HBtn>
                      {emojiOpen && (
                        <div style={{ position:'absolute', bottom:'calc(100% + 8px)', left:0, zIndex:100,
                          background:'var(--color-surface)', borderRadius:'var(--radius-md)', padding:'var(--space-2)',
                          border:'calc(var(--space-0-5) / 2) solid var(--color-border)',
                          boxShadow:'var(--shadow-lg)', display:'flex', flexWrap:'wrap', gap:2, width:220 }}>
                          {['😊','😂','❤️','👍','🙏','😢','😍','🔥','✅','😎','🎉','👋','💊','🏥','⚕️','💉','🌡️','🩺','📋','⭐'].map(em=>(
                            <button key={em} onClick={()=>{ setInput(p=>p+em); setEmojiOpen(false) }}
                              style={{ fontSize:20, background:'none', border:'none', cursor:'pointer', padding:'4px', borderRadius:4, lineHeight:1 }}
                              title={em}>{em}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Attachment button + popup */}
                    <div ref={attachAnchorRef} style={{ position:'relative', flexShrink:0 }}>
                      <HBtn title="Attach" onClick={()=>setAttachOpen(p=>!p)} active={attachOpen}><Paperclip size={22}/></HBtn>
                      {attachOpen && (
                        <div style={{ position:'absolute', bottom:'calc(100% + 8px)', left:0, zIndex:100,
                          background:C.attachBg, borderRadius:'var(--radius-md)', padding:'var(--space-2) 0',
                          border:'calc(var(--space-0-5) / 2) solid var(--color-border)',
                          boxShadow:'var(--shadow-lg)', minWidth:220 }}>
                          {ATTACH_OPTIONS.map(opt => (
                            <button key={opt.key} onClick={opt.action}
                              style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'12px 20px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', transition:'background 0.1s' }}
                              onMouseEnter={e=>e.currentTarget.style.background='var(--color-surface-subtle)'}
                              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                              <div style={{ width:42, height:42, borderRadius:'50%', background:opt.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <opt.Icon size={20} color="#fff"/>
                              </div>
                              <span style={{ fontSize:14, color:C.white, fontWeight:500 }}>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Text input */}
                    <div style={{ flex:1, background:C.inputField, borderRadius:'var(--radius-btn)', display:'flex', alignItems:'center', padding:'0 var(--space-4)', minHeight:46, border:'calc(var(--space-0-5) / 2) solid var(--color-border)' }}>
                      <input type="text" value={input} onChange={e=>setInput(e.target.value)}
                        onKeyDown={e=>e.key==='Enter' && sendMessage()}
                        aria-label="Type a message"
                        placeholder="Type a message"
                        style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:15, color:C.white }}/>
                    </div>

                    {/* Send / mic */}
                    <button onClick={sendMessage}
                      aria-label={(input.trim()||pending.length) ? 'Send message' : 'Record voice message'}
                      style={{ width:46, height:46, borderRadius:'var(--radius-btn)', background:C.navy, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background var(--duration-fast) var(--ease-out)' }}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--color-blue)'}
                      onMouseLeave={e=>e.currentTarget.style.background=C.navy}>
                      {(input.trim()||pending.length) ? <Send size={18} color="#fff"/> : <Mic size={18} color="#fff"/>}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Empty state */}
            {!activeChat && (
              <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', ...CHAT_BG }}>
                <EmptyState
                  icon={Bot}
                  title="Select a patient conversation"
                  description="The AI receptionist keeps conversations moving. Open a thread to review the context or send a manual reply."
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {cameraOpen   && <CameraModal   onCapture={handleCameraCapture} onClose={()=>setCameraOpen(false)}/>}
      {contactOpen  && <ContactModal  onSend={handleContactSend}      onClose={()=>setContactOpen(false)}/>}
      {locationOpen && <LocationModal onSend={handleLocationSend}     onClose={()=>setLocationOpen(false)}/>}

      {/* ── New Chat modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {newChatOpen && (
          <motion.div key="new-chat-overlay"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={closeNewChat}>
            <motion.div initial={{ scale:0.94, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.94, opacity:0 }}
              transition={{ duration:0.15 }}
              ref={newChatDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="whatsapp-new-chat-title"
              style={{ background:'#ffffff', borderRadius:12, width:400, maxWidth:'95vw', maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}
              onClick={e=>e.stopPropagation()}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:C.headerBg, flexShrink:0 }}>
                <span id="whatsapp-new-chat-title" style={{ color:C.white, fontWeight:600, fontSize:15 }}>New Chat</span>
                <HBtn ariaLabel="Close new chat dialog" onClick={closeNewChat}><X size={18}/></HBtn>
              </div>
              {/* Search */}
              <div style={{ padding:'8px 12px', background:C.panelBg, flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, background:C.inputField, borderRadius:8, height:36, padding:'0 12px' }}>
                  <Search size={14} style={{ color:C.muted }}/>
                  <input autoFocus type="text" placeholder="Search patients…" value={newChatQuery}
                    onChange={e=>setNewChatQuery(e.target.value)}
                    style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:14, color:C.white }}/>
                  {newChatQuery && (
                    <button type="button" aria-label="Clear patient search" onClick={()=>setNewChatQuery('')} style={{ background:'transparent', border:'none', cursor:'pointer', color:C.muted, display:'flex', padding:0 }}><X size={13}/></button>
                  )}
                </div>
              </div>
              {/* Patient list */}
              <div style={{ flex:1, overflowY:'auto' }}>
                {filteredPatients.map(p => {
                    const initials = p.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
                    return (
                      <button key={p.id} onClick={()=>openOrCreateChat(p)}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'10px 16px',
                          background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}
                        onMouseEnter={e=>e.currentTarget.style.background=C.rowHover}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <div style={{ width:42, height:42, borderRadius:'50%', background:'#1A5CB5', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, flexShrink:0 }}>
                          {initials}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontSize:14, fontWeight:500, color:C.white, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                          {p.phone && <p style={{ fontSize:12, color:C.muted, margin:'2px 0 0' }}>{p.phone}</p>}
                        </div>
                      </button>
                    )
                  })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function now() {
  return new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })
}
