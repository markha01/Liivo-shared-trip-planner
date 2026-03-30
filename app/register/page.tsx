'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const passwordValid = password.length === 0 || password.length >= 8
  const emailValid = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/dashboard')
      } else {
        setError(data.error || 'Registration failed')
        setShake(true)
        setTimeout(() => setShake(false), 600)
      }
    } catch {
      setError('Could not connect. Try again.')
      setShake(true)
      setTimeout(() => setShake(false), 600)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span
              className="text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #A878F8 0%, #2192D9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >Trippin&apos;</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-powder/70 text-sm">Free forever. No credit card needed.</p>
        </div>

        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-dark-card border border-dark-border rounded-2xl p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-powder/80 block mb-1.5">Display name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200" style={{ color: displayName ? '#1b5ed1' : 'rgba(178,219,247,0.4)' }} />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full bg-dark-surface border border-dark-border rounded-xl pl-10 pr-4 py-3 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-powder/80 block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200" style={{ color: email ? '#1b5ed1' : 'rgba(178,219,247,0.4)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={`w-full bg-dark-surface border rounded-xl pl-10 pr-4 py-3 text-white placeholder-powder/30 focus:outline-none transition text-sm ${
                    !emailValid ? 'border-red-600 focus:border-red-500' : 'border-dark-border focus:border-primary'
                  }`}
                />
              </div>
              {!emailValid && (
                <p className="text-red-400 text-xs mt-1">Enter a valid email address</p>
              )}
            </div>

            <div>
              <label className="text-sm text-powder/80 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200" style={{ color: password ? '#1b5ed1' : 'rgba(178,219,247,0.4)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  className={`w-full bg-dark-surface border rounded-xl pl-10 pr-10 py-3 text-white placeholder-powder/30 focus:outline-none transition text-sm ${
                    !passwordValid ? 'border-red-600 focus:border-red-500' : 'border-dark-border focus:border-primary'
                  }`}
                />
                {password.length >= 8 && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lime" />
                )}
              </div>
              {!passwordValid && (
                <p className="text-red-400 text-xs mt-1">Password must be at least 8 characters</p>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-xl px-3 py-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || !displayName || !email || !password}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-dark-border disabled:text-powder/30 text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-sm text-powder/50 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 transition font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
