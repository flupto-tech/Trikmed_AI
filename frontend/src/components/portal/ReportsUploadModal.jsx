'use client'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Camera, Upload, Trash2, CheckCircle, SkipForward } from 'lucide-react'
import { updateReviewEntry } from '../../../lib/reviews'
import { getSession } from '../../utils/auth'

const MAX_PHOTOS = 10

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ReportsUploadModal({ entry, onClose, onSaved }) {
  const session   = getSession()
  const fileRef   = useRef(null)
  const camRef    = useRef(null)

  const [photos,   setPhotos]   = useState(entry.reportsUploaded || [])
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState(null)
  const [dragging, setDragging] = useState(false)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function readFiles(files) {
    if (photos.length + files.length > MAX_PHOTOS) {
      showToast(`Maximum ${MAX_PHOTOS} photos allowed`)
      return
    }
    const results = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const dataUrl = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload  = e => res(e.target.result)
        r.onerror = rej
        r.readAsDataURL(file)
      })
      results.push({
        filename:   file.name || `report-${Date.now()}.jpg`,
        dataUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: session?.name || 'Staff',
      })
    }
    setPhotos(prev => [...prev, ...results])
  }

  function handleFiles(e) { if (e.target.files) readFiles(e.target.files) }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files) readFiles(e.dataTransfer.files)
  }

  function removePhoto(idx) { setPhotos(prev => prev.filter((_, i) => i !== idx)) }

  async function handleSave() {
    setSaving(true)
    updateReviewEntry(entry.id, {
      reportsUploaded: photos,
      reportsStatus:   'uploaded',
    })
    setSaving(false)
    onSaved()
  }

  async function handleSkip() {
    updateReviewEntry(entry.id, { reportsStatus: 'manual' })
    onSaved()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,35,66,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0' }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 560, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #E4E6EB', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F2342', margin: 0 }}>
                {entry.patientName} — Add Reports
              </h2>
              <p style={{ fontSize: 12, color: '#6B7A9A', margin: '3px 0 0' }}>
                Upload test reports to send to doctor
              </p>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E4E6EB', background: '#F4F5F7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7A9A' }}>
              <X size={14}/>
            </button>
          </div>
        </div>

        {/* Context */}
        <div style={{ padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #E4E6EB', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7A9A', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Original Visit</div>
              <div style={{ fontSize: 13, color: '#0F2342', fontWeight: 600 }}>{fmtDate(entry.consultationDate)}</div>
            </div>
            {entry.testsRecommended && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7A9A', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Tests Ordered</div>
                <div style={{ fontSize: 13, color: '#0F2342' }}>{entry.testsRecommended}</div>
              </div>
            )}
          </div>
          {entry.diagnosis?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7A9A', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Tentative Diagnosis</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {entry.diagnosis.map(d => (
                  <span key={d} style={{ fontSize: 12, padding: '2px 10px', borderRadius: 8, background: '#ECFDF5', color: '#166534', fontWeight: 600 }}>{d}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upload area */}
        <div style={{ padding: '16px 20px', flex: 1 }}>

          {/* Quick action buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <button onClick={() => camRef.current?.click()}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, border: '2px solid #0D9488', background: '#F0FDFA', color: '#0D9488', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Camera size={16}/> Take Photo
            </button>
            <button onClick={() => fileRef.current?.click()}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, border: '2px solid #D1D5DB', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Upload size={16}/> From Device
            </button>
          </div>

          {/* Hidden inputs */}
          <input ref={camRef}  type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={handleFiles}/>
          <input ref={fileRef} type="file" accept="image/*"                       multiple style={{ display: 'none' }} onChange={handleFiles}/>

          {/* Drag-drop zone — only shown when no photos yet */}
          {photos.length === 0 && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{ border: `2px dashed ${dragging ? '#0D9488' : '#D1D5DB'}`, borderRadius: 10, padding: '28px 20px', textAlign: 'center', background: dragging ? '#F0FDFA' : '#FAFAFA', transition: 'all .15s', marginBottom: 12 }}>
              <Upload size={24} color="#9CA3AF" style={{ margin: '0 auto 8px' }}/>
              <div style={{ fontSize: 13, color: '#6B7A9A' }}>Drag & drop report images here</div>
            </div>
          )}

          {/* Thumbnails */}
          {photos.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7A9A', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                {photos.length} / {MAX_PHOTOS} photos
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid #E4E6EB' }}>
                    <img src={p.dataUrl} alt={p.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    <button onClick={() => removePhoto(i)}
                      style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,.55)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <Trash2 size={11}/>
                    </button>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 6px', background: 'linear-gradient(transparent,rgba(0,0,0,.5))', fontSize: 9, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.filename}
                    </div>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button onClick={() => fileRef.current?.click()}
                    style={{ aspectRatio: '1', borderRadius: 8, border: '2px dashed #D1D5DB', background: '#FAFAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontFamily: 'inherit' }}>
                    + Add
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '14px 20px 20px', borderTop: '1px solid #E4E6EB', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <button onClick={handleSave} disabled={saving || photos.length === 0}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, border: 'none', background: photos.length === 0 ? '#D1D5DB' : '#0D9488', color: '#fff', fontSize: 14, fontWeight: 700, cursor: photos.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
            <CheckCircle size={16}/>{saving ? 'Saving…' : 'Save & Send to Doctor'}
          </button>
          <button onClick={handleSkip}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 12, border: '1.5px solid #D1D5DB', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <SkipForward size={14}/> Skip — Doctor will check paper reports
          </button>
          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
            Skipping is normal — patient will carry paper reports directly to cabin
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#0F2342', color: '#fff', borderRadius: 10, padding: '8px 18px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', zIndex: 10 }}>
            {toast}
          </div>
        )}
      </motion.div>
    </div>
  )
}
