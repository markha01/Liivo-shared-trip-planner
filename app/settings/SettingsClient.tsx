'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Trash2, ArrowLeft, AlertTriangle, Check, AlertCircle, Pencil, X } from 'lucide-react'
import Link from 'next/link'
import type { JwtPayload } from '@/lib/auth'

type Props = { user: JwtPayload }

type Section = 'name' | 'email' | 'password' | null

export default function SettingsClient({ user }: Props) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>(null)

  // Name
  const [newName, setNewName] = useState(user.displayName)
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState('')
  const [nameSuccess, setNameSuccess] = useState(false)

  // Email
  const [newEmail, setNewEmail] = useState(user.email)
  const [emailPassword, setEmailPassword] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  async function logout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  async function deleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
      if (res.ok) router.push('/')
    } catch {
      setDeleting(false)
    }
  }

  async function saveName() {
    setNameError('')
    if (!newName.trim()) { setNameError('Name cannot be empty'); return }
    setSavingName(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: newName }),
      })
      const data = await res.json()
      if (res.ok) {
        setNameSuccess(true)
        setTimeout(() => setNameSuccess(false), 2500)
        setActiveSection(null)
        router.refresh()
      } else {
        setNameError(data.error || 'Failed to update name')
      }
    } finally {
      setSavingName(false)
    }
  }

  async function saveEmail() {
    setEmailError('')
    if (!newEmail.trim()) { setEmailError('Email cannot be empty'); return }
    if (!emailPassword) { setEmailError('Enter your current password to confirm'); return }
    setSavingEmail(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, currentPassword: emailPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setEmailSuccess(true)
        setEmailPassword('')
        setTimeout(() => setEmailSuccess(false), 2500)
        setActiveSection(null)
        router.refresh()
      } else {
        setEmailError(data.error || 'Failed to update email')
      }
    } finally {
      setSavingEmail(false)
    }
  }

  async function savePassword() {
    setPasswordError('')
    if (!currentPassword) { setPasswordError('Enter your current password'); return }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
    setSavingPassword(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordSuccess(false), 2500)
        setActiveSection(null)
      } else {
        setPasswordError(data.error || 'Failed to update password')
      }
    } finally {
      setSavingPassword(false)
    }
  }

  function openSection(s: Section) {
    setActiveSection(s === activeSection ? null : s)
    setNameError(''); setEmailError(''); setPasswordError('')
    setNewName(user.displayName)
    setNewEmail(user.email)
    setEmailPassword(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
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
          <Link href="/dashboard" className="text-powder/60 hover:text-white transition p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-white font-semibold">Settings</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Profile */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-5">Profile</h2>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-white font-medium">{user.displayName}</p>
              <p className="text-powder/50 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Change name */}
            <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
              <button
                onClick={() => openSection('name')}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="text-powder/40 text-xs mb-0.5">Display name</p>
                  <p className="text-white text-sm">{user.displayName}</p>
                </div>
                {activeSection === 'name'
                  ? <X className="w-4 h-4 text-powder/40 flex-shrink-0" />
                  : <Pencil className="w-4 h-4 text-powder/30 hover:text-powder/60 transition flex-shrink-0" />
                }
              </button>
              <AnimatePresence>
                {activeSection === 'name' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-dark-border space-y-3">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveName()}
                        placeholder="Your name"
                        autoFocus
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition text-sm"
                      />
                      {nameError && (
                        <p className="flex items-center gap-1.5 text-red-400 text-xs">
                          <AlertCircle className="w-3.5 h-3.5" /> {nameError}
                        </p>
                      )}
                      {nameSuccess && (
                        <p className="flex items-center gap-1.5 text-lime text-xs">
                          <Check className="w-3.5 h-3.5" /> Name updated!
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveSection(null)}
                          className="flex-1 bg-dark-bg hover:bg-dark-border text-white py-2 rounded-xl text-sm transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveName}
                          disabled={savingName || !newName.trim()}
                          className="flex-1 bg-accent hover:bg-accent/90 disabled:bg-dark-border disabled:text-powder/30 text-white py-2 rounded-xl text-sm font-medium transition"
                        >
                          {savingName ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Change email */}
            <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
              <button
                onClick={() => openSection('email')}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="text-powder/40 text-xs mb-0.5">Email</p>
                  <p className="text-white text-sm">{user.email}</p>
                </div>
                {activeSection === 'email'
                  ? <X className="w-4 h-4 text-powder/40 flex-shrink-0" />
                  : <Pencil className="w-4 h-4 text-powder/30 hover:text-powder/60 transition flex-shrink-0" />
                }
              </button>
              <AnimatePresence>
                {activeSection === 'email' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-dark-border space-y-3">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="New email address"
                        autoFocus
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition text-sm"
                      />
                      <input
                        type="password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEmail()}
                        placeholder="Current password to confirm"
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition text-sm"
                      />
                      {emailError && (
                        <p className="flex items-center gap-1.5 text-red-400 text-xs">
                          <AlertCircle className="w-3.5 h-3.5" /> {emailError}
                        </p>
                      )}
                      {emailSuccess && (
                        <p className="flex items-center gap-1.5 text-lime text-xs">
                          <Check className="w-3.5 h-3.5" /> Email updated!
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveSection(null)}
                          className="flex-1 bg-dark-bg hover:bg-dark-border text-white py-2 rounded-xl text-sm transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEmail}
                          disabled={savingEmail || !newEmail.trim()}
                          className="flex-1 bg-accent hover:bg-accent/90 disabled:bg-dark-border disabled:text-powder/30 text-white py-2 rounded-xl text-sm font-medium transition"
                        >
                          {savingEmail ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Change password */}
            <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
              <button
                onClick={() => openSection('password')}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="text-powder/40 text-xs mb-0.5">Password</p>
                  <p className="text-white text-sm">••••••••</p>
                </div>
                {activeSection === 'password'
                  ? <X className="w-4 h-4 text-powder/40 flex-shrink-0" />
                  : <Pencil className="w-4 h-4 text-powder/30 hover:text-powder/60 transition flex-shrink-0" />
                }
              </button>
              <AnimatePresence>
                {activeSection === 'password' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-dark-border space-y-3">
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                        autoFocus
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition text-sm"
                      />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password (min 8 characters)"
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition text-sm"
                      />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && savePassword()}
                        placeholder="Confirm new password"
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition text-sm"
                      />
                      {passwordError && (
                        <p className="flex items-center gap-1.5 text-red-400 text-xs">
                          <AlertCircle className="w-3.5 h-3.5" /> {passwordError}
                        </p>
                      )}
                      {passwordSuccess && (
                        <p className="flex items-center gap-1.5 text-lime text-xs">
                          <Check className="w-3.5 h-3.5" /> Password updated!
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveSection(null)}
                          className="flex-1 bg-dark-bg hover:bg-dark-border text-white py-2 rounded-xl text-sm transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={savePassword}
                          disabled={savingPassword}
                          className="flex-1 bg-accent hover:bg-accent/90 disabled:bg-dark-border disabled:text-powder/30 text-white py-2 rounded-xl text-sm font-medium transition"
                        >
                          {savingPassword ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Account actions */}
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
