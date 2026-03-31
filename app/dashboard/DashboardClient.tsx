'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MapPin, LogOut, Settings, ChevronDown, Plane, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { JwtPayload } from '@/lib/auth'

type Trip = {
  id: string
  name: string
  description: string | null
  created_at: string
}

type Props = {
  user: JwtPayload
  initialTrips: Trip[]
}

export default function DashboardClient({ user, initialTrips }: Props) {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNewTrip, setShowNewTrip] = useState(false)
  const [tripName, setTripName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  async function createTrip() {
    if (!tripName.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tripName.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setTrips((prev) => [data, ...prev])
        setTripName('')
        setShowNewTrip(false)
        router.push(`/trip/${data.id}`)
      } else {
        setCreateError(data.error || 'Failed to create trip')
      }
    } catch {
      setCreateError('Could not connect. Try again.')
    } finally {
      setCreating(false)
    }
  }

  async function saveEdit() {
    if (!editingTrip || !editName.trim()) return
    setSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/api/trips/${editingTrip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setTrips((prev) => prev.map((t) => t.id === editingTrip.id ? { ...t, name: editName.trim() } : t))
        setEditingTrip(null)
      } else {
        setEditError(data.error || 'Failed to save changes')
      }
    } catch {
      setEditError('Could not connect. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deletingTrip) return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/trips/${deletingTrip.id}`, { method: 'DELETE' })
      if (res.ok) {
        setTrips((prev) => prev.filter((t) => t.id !== deletingTrip.id))
        setDeletingTrip(null)
      } else {
        const data = await res.json()
        setDeleteError(data.error || 'Failed to delete trip')
      }
    } catch {
      setDeleteError('Could not connect. Try again.')
    } finally {
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
      {/* Navbar */}
      <header className="bg-dark-surface border-b border-dark-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Trippin&apos;
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 bg-dark-card hover:bg-dark-border border border-dark-border rounded-xl px-3 py-2 transition"
            >
              <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <span className="text-sm text-white hidden sm:block">{user.displayName}</span>
              <ChevronDown className="w-4 h-4 text-powder/50" />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-20 overflow-hidden"
                  >
                    <Link
                      href="/settings"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-powder hover:bg-dark-border hover:text-white transition"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-powder hover:bg-dark-border hover:text-white transition border-t border-dark-border"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Hero greeting */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-1">
            Hey {user.displayName.split(' ')[0]}, where to next?{' '}
            <span className="text-primary">✈️</span>
          </h1>
          <p className="text-powder/60 text-sm">Plan and manage all your group trips in one place.</p>
        </div>

        {/* New trip button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold">
            Your trips{' '}
            {trips.length > 0 && (
              <span className="text-powder/40 font-normal text-sm">({trips.length})</span>
            )}
          </h2>
          <button
            onClick={() => setShowNewTrip(true)}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            New trip
          </button>
        </div>

        {/* Trips grid */}
        {trips.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-dark-card border border-dark-border rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-primary" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">No trips yet</p>
            <p className="text-powder/50 mb-6 text-sm max-w-xs mx-auto">
              Create your first trip, share the link with your group, and start planning together.
            </p>
            <button
              onClick={() => setShowNewTrip(true)}
              className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              Create your first trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip, i) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative group"
              >
                <Link
                  href={`/trip/${trip.id}`}
                  className="block bg-dark-card border border-dark-border hover:border-primary/50 rounded-2xl p-5 transition"
                >
                  <div className="flex items-start gap-3 mb-3 pr-8">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold truncate group-hover:text-primary transition">
                        {trip.name}
                      </h3>
                      {trip.description && (
                        <p className="text-powder/50 text-xs mt-0.5 truncate">{trip.description}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-powder/30 text-xs">
                    Created{' '}
                    {new Date(trip.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </Link>

                {/* Three-dot menu */}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === trip.id ? null : trip.id)
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-powder/30 hover:text-powder hover:bg-dark-border transition"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {openMenuId === trip.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 top-full mt-1 w-36 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-20 overflow-hidden"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingTrip(trip)
                              setEditName(trip.name)
                              setEditError('')
                              setOpenMenuId(null)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-powder hover:bg-dark-border hover:text-white transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Rename
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingTrip(trip)
                              setDeleteError('')
                              setOpenMenuId(null)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-dark-border hover:text-red-300 transition border-t border-dark-border"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* New trip modal */}
      <AnimatePresence>
        {showNewTrip && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <h3 className="text-white font-semibold text-lg mb-1">Start a new trip</h3>
              <p className="text-powder/50 text-sm mb-5">Give it a name to get started.</p>

              <input
                type="text"
                placeholder="e.g. Tokyo with the squad, Euro summer…"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createTrip()}
                autoFocus
                className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition text-sm mb-4"
              />

              {createError && (
                <p className="text-red-400 text-sm mb-4">{createError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowNewTrip(false); setTripName(''); setCreateError('') }}
                  className="flex-1 bg-dark-surface hover:bg-dark-border text-white py-3 rounded-xl transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={createTrip}
                  disabled={!tripName.trim() || creating}
                  className="flex-1 bg-accent hover:bg-accent/90 disabled:bg-dark-border disabled:text-powder/30 text-white py-3 rounded-xl font-semibold transition text-sm"
                >
                  {creating ? 'Creating…' : 'Create trip'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename trip modal */}
      <AnimatePresence>
        {editingTrip && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <h3 className="text-white font-semibold text-lg mb-1">Rename trip</h3>
              <p className="text-powder/50 text-sm mb-5">Update the name for this trip.</p>

              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                autoFocus
                className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition text-sm mb-4"
              />

              {editError && (
                <p className="text-red-400 text-sm mb-4">{editError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setEditingTrip(null)}
                  className="flex-1 bg-dark-surface hover:bg-dark-border text-white py-3 rounded-xl transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={!editName.trim() || saving}
                  className="flex-1 bg-accent hover:bg-accent/90 disabled:bg-dark-border disabled:text-powder/30 text-white py-3 rounded-xl font-semibold transition text-sm"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deletingTrip && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <h3 className="text-white font-semibold text-lg mb-1">Delete trip?</h3>
              <p className="text-powder/50 text-sm mb-5">
                <span className="text-white font-medium">{deletingTrip.name}</span> and all its places and activities will be permanently deleted. This can&apos;t be undone.
              </p>

              {deleteError && (
                <p className="text-red-400 text-sm mb-4">{deleteError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingTrip(null)}
                  className="flex-1 bg-dark-surface hover:bg-dark-border text-white py-3 rounded-xl transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-dark-border disabled:text-powder/30 text-white py-3 rounded-xl font-semibold transition text-sm"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
