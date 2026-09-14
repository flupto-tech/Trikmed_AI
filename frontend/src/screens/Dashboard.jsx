'use client'
import { useEffect } from 'react'
import { useNavigate, Link } from '../utils/navigation'
import { motion } from 'framer-motion'
import { getSession, logout } from '../utils/auth'
import { Zap, LogOut, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const session = getSession()

  useEffect(() => {
    if (!session) navigate('/login')
  }, [session, navigate])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg w-full"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C3CE1] to-[#00D4AA] flex items-center justify-center">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="text-2xl font-bold text-white">
            Trik<span className="gradient-text">Med</span>
          </span>
        </div>

        <div className="glass-card rounded-xl p-8 mb-6">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#6C3CE1]/20 to-[#00D4AA]/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎉</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {session.name}!
          </h1>
          <p className="text-gray-400 text-sm mb-1">
            Logged in as <span className="text-[#8B5CF6]">{session.email}</span>
          </p>
          <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20 mt-1">
            {session.role === 'admin' ? '⚡ Admin' : '🏥 Clinic'} Account
          </span>

          <div className="mt-6 p-4 rounded-xl bg-[#6C3CE1]/5 border border-[#6C3CE1]/20">
            <p className="text-gray-400 text-sm leading-relaxed">
              Full dashboard coming soon! This is where you'll manage appointments, patients, reminders, analytics, and WhatsApp automation.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
          >
            Back to Home
            <ArrowRight size={15} />
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-400 hover:text-white rounded-xl border border-white/10 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </motion.div>
    </div>
  )
}
