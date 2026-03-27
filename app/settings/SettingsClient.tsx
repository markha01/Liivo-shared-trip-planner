'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { JwtPayload } from '@/lib/auth'

type Props = { user: JwtPayload }

export default function SettingsClient({ user }: Props) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function logout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  async function deleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/')
      }
    } catch {
      setDeleting(false)
    }
  }

  const initials = user.displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-powder/60 hover:text-white transition p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-white font-semibold">Settings</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Profile */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Profile</h2>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-white font-medium">{user.displayName}</p>
              <p className="text-powder/50 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-xl px-4 py-3">
            <p className="text-powder/40 text-xs mb-0.5">Email</p>
            <p className="text-white text-sm">{user.email}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Account</h2>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 bg-dark-surface hover:bg-dark-border border border-dark-border text-white px-4 py-3 rounded-xl transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4 text-powder/60" />
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>

        {/* Danger zone */}
        <div className="bg-dark-card border border-red-900/40 rounded-2xl p-6">
          <h2 className="text-red-400 font-semibold mb-1">Danger zone</h2>
          <p className="text-powder/40 text-sm mb-4">
            Permanently deletes your account and all associated data.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-xl text-sm font-medium transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete my account
          </button>
        </div>
      </main>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-sm p-6 shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Delete your account?</h3>
              <p className="text-powder/60 text-sm mb-6 leading-relaxed">
                This will permanently delete your account. Your trips will remain accessible via their shared links but won&apos;t appear in any dashboard.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-dark-surface hover:bg-dark-border text-white py-3 rounded-xl transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition text-sm"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
