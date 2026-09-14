'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

export default function Toast({ toast }) {
  if (!toast) return null
  return (
    <AnimatePresence>
      <motion.div
        key={toast.id}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.22 }}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#0F2D5E', color: '#fff', borderRadius: 10,
          padding: '12px 18px', display: 'flex', alignItems: 'center',
          gap: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', minWidth: 240, maxWidth: 360,
        }}
      >
        <CheckCircle size={16} style={{ color: '#9DBDE8', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{toast.message}</span>
      </motion.div>
    </AnimatePresence>
  )
}
