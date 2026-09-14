'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Printer, MessageCircle, CheckCircle } from 'lucide-react'
import { getPrescription, savePrescription, getClinicConfig, generateRxNumber } from '../../../../lib/rxStorage'
import { buildWhatsAppMessage } from '../../../../lib/whatsappMessage'
import RxPrintLayout from '../../../components/rx/RxPrintLayout'
import { Button } from '../../../components/ui/Button'

const C = { navy:'#0F2342', coral:'#E84C3D', cream:'#F7F5F0', border:'#D3D1C7', muted:'#6B7A9A', green:'#16A34A' }

export default function RxView() {
  const router = useRouter()
  const [rx, setRx] = useState(null)
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [waSuccess, setWaSuccess] = useState(false)
  const [autoPrint, setAutoPrint] = useState(false)

  useEffect(() => {
    // Read rxId and ?print=1 from window.location (CSR only, ssr:false)
    const parts = window.location.pathname.split('/')
    const rxId = parts[parts.length - 1]
    const print = new URLSearchParams(window.location.search).get('print') === '1'
    setAutoPrint(print)
    if (!rxId) { setLoading(false); return }
    const data = getPrescription(rxId)
    setRx(data)
    setClinic(getClinicConfig())
    setLoading(false)
  }, [])

  function handlePrint() { window.print() }

  function handleDuplicate() {
    if (!rx) return
    const dup = {
      ...rx,
      id: undefined,
      rxNumber: generateRxNumber(),
      date: new Date().toISOString(),
      status: 'draft',
    }
    const saved = savePrescription(dup)
    router.push(`/portal/rx/${saved.id}`)
  }

  function handleWhatsApp() {
    const phone = rx?.patientPhone?.replace(/\D/g,'')
    if (!phone) { alert('No phone number on record for this patient.'); return }
    const msg = buildWhatsAppMessage(rx, clinic)
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    setWaSuccess(true)
    setTimeout(()=>setWaSuccess(false),3000)
  }

  const whatsappEnabled = clinic?.share?.whatsapp !== false

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:C.muted, fontFamily:'inherit' }}>
      Loading…
    </div>
  )

  if (!rx) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:12, fontFamily:'inherit' }}>
      <div style={{ fontSize:16, color:C.navy, fontWeight:600 }}>Prescription not found</div>
      <Button onClick={() => router.push('/portal/rx/history')}>View History</Button>
    </div>
  )

  const doc = clinic?.doctors?.find(d=>d.id===rx.doctorId) || clinic?.doctors?.find(d=>d.isPrimary) || clinic?.doctors?.[0] || {}

  return (
    <div style={{ background:C.cream, minHeight:'100vh', fontFamily:"'Segoe UI',Inter,sans-serif" }}>

      {/* Action bar — hidden on print */}
      <div className="no-print flex items-center gap-3 px-4 py-2.5" style={{ background: C.navy }}>
        <Button
          size="sm"
          icon={ArrowLeft}
          onClick={() => router.push('/portal/rx/new')}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-none focus:ring-white/30"
        >
          Back to Consultation
        </Button>
        <div className="flex-1" />
        {rx.status === 'draft' && (
          <span style={{ fontSize: 11, background: '#FFFBEB', color: '#92400E', padding: '3px 8px', borderRadius: 10, fontWeight: 600 }}>Draft</span>
        )}
        {rx.status === 'finalized' && (
          <span style={{ fontSize: 11, background: '#F0FDF4', color: '#15803D', padding: '3px 8px', borderRadius: 10, fontWeight: 600 }}>Finalized</span>
        )}
        <Button
          size="sm"
          icon={Copy}
          onClick={handleDuplicate}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-none focus:ring-white/30"
        >
          Duplicate
        </Button>
        {whatsappEnabled && (
          <Button
            size="sm"
            icon={waSuccess ? CheckCircle : MessageCircle}
            onClick={handleWhatsApp}
            className="border-none shadow-none focus:ring-green-400"
            style={{ background: waSuccess ? '#15803D' : '#25D366' }}
          >
            {waSuccess ? 'Sent!' : 'WhatsApp'}
          </Button>
        )}
        <Button size="sm" icon={Printer} onClick={handlePrint}>Print</Button>
      </div>

      {/* Print layout */}
      <div style={{ maxWidth:600, margin:'24px auto', padding:'0 12px 40px' }}>
        <RxPrintLayout rx={rx} clinic={clinic} doctor={doc} autoPrint={autoPrint}/>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}
