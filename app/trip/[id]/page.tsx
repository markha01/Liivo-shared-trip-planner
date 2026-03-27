'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Sparkles, ClipboardList, Share2, ArrowLeft,
  ThumbsUp, ThumbsDown, Pencil, Plus, Star, AlertCircle, X, Check,
} from 'lucide-react'

type Activity = {
  id: string
  name: string
  description: string | null
  category: string | null
  upvotes: number
  downvotes: number
  user_vote: 'up' | 'down' | null
  destination_id: string
}

type Destination = {
  id: string
  name: string
  country: string | null
  emoji: string
  notes: string | null
  position: number
  activities: Activity[]
}

type Trip = {
  id: string
  name: string
  description: string | null
  destinations: Destination[]
}

type Tab = 'places' | 'activities' | 'plan'
type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' }

const categoryColors: Record<string, string> = {
  'Food & Drinks': 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  Sightseeing: 'bg-accent/15 text-accent border-accent/20',
  Adventure: 'bg-lime/15 text-lime border-lime/20',
  Shopping: 'bg-pink-500/15 text-pink-300 border-pink-500/20',
  Relaxation: 'bg-primary/15 text-primary border-primary/20',
  Nightlife: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  Culture: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  Nature: 'bg-teal-500/15 text-teal-300 border-teal-500/20',
}

function categoryColor(cat: string | null) {
  return categoryColors[cat ?? ''] ?? 'bg-dark-border text-powder border-dark-border'
}

function getVoterId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('liivo_voter_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('liivo_voter_id', id)
  }
  return id
}

const DEST_EMOJIS = ['🗺️', '🏛️', '🌊', '🏖️', '⛰️', '🌆', '🌿', '🏜️', '🌅', '🏔️', '🗼', '🏝️']
const CATEGORIES = ['Sightseeing', 'Food & Drinks', 'Adventure', 'Culture', 'Relaxation', 'Shopping', 'Nightlife', 'Nature']

export default function TripPage() {
  const params = useParams()
  const tripId = params.id as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('places')
  const [copied, setCopied] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Add place form
  const [showAddPlace, setShowAddPlace] = useState(false)
  const [newPlace, setNewPlace] = useState({ name: '', country: '', emoji: '🗺️', notes: '' })
  const [addingPlace, setAddingPlace] = useState(false)

  // Add activity form
  const [addActivityFor, setAddActivityFor] = useState<string | null>(null)
  const [newActivity, setNewActivity] = useState({ name: '', description: '', category: 'Sightseeing' })
  const [addingActivity, setAddingActivity] = useState(false)

  // Edit place
  const [editingPlace, setEditingPlace] = useState<Destination | null>(null)
  const [editPlaceData, setEditPlaceData] = useState({ name: '', country: '', emoji: '🗺️', notes: '' })
  const [savingPlace, setSavingPlace] = useState(false)
  const [deletingPlace, setDeletingPlace] = useState(false)

  // Edit activity
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [editActivityData, setEditActivityData] = useState({ name: '', description: '', category: 'Sightseeing' })
  const [savingActivity, setSavingActivity] = useState(false)
  const [deletingActivity, setDeletingActivity] = useState(false)

  function addToast(message: string, type: Toast['type'] = 'info') {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }

  const fetchTrip = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        headers: { 'x-voter-id': getVoterId() },
      })
      if (!res.ok) {
        setError(res.status === 404 ? 'Trip not found. Double-check the link.' : 'Failed to load trip.')
        return
      }
      setTrip(await res.json())
    } catch {
      setError('Could not connect. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchTrip()
  }, [fetchTrip])

  async function addPlace() {
    if (!newPlace.name.trim()) return
    setAddingPlace(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/destinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlace),
      })
      if (res.ok) {
        const dest = await res.json()
        setTrip((t) => t ? { ...t, destinations: [...t.destinations, dest] } : t)
        setNewPlace({ name: '', country: '', emoji: '🗺️', notes: '' })
        setShowAddPlace(false)
        addToast(`${dest.name} added!`, 'success')
      } else {
        addToast('Failed to add place', 'error')
      }
    } finally {
      setAddingPlace(false)
    }
  }

  async function addActivity() {
    if (!newActivity.name.trim() || !addActivityFor) return
    setAddingActivity(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newActivity, destination_id: addActivityFor }),
      })
      if (res.ok) {
        const activity = await res.json()
        setTrip((t) =>
          t ? {
            ...t,
            destinations: t.destinations.map((d) =>
              d.id === addActivityFor ? { ...d, activities: [...d.activities, activity] } : d
            ),
          } : t
        )
        setNewActivity({ name: '', description: '', category: 'Sightseeing' })
        setAddActivityFor(null)
        addToast('Activity added!', 'success')
      } else {
        addToast('Failed to add activity', 'error')
      }
    } finally {
      setAddingActivity(false)
    }
  }

  async function vote(activityId: string, voteType: 'up' | 'down') {
    // Optimistic update
    setTrip((t) =>
      t ? {
        ...t,
        destinations: t.destinations.map((d) => ({
          ...d,
          activities: d.activities.map((a) => {
            if (a.id !== activityId) return a
            const wasUp = a.user_vote === 'up'
            const wasDown = a.user_vote === 'down'
            const toggling = a.user_vote === voteType
            return {
              ...a,
              upvotes: voteType === 'up'
                ? toggling ? a.upvotes - 1 : a.upvotes + 1 + (wasDown ? 0 : 0)
                : wasUp ? a.upvotes - 1 : a.upvotes,
              downvotes: voteType === 'down'
                ? toggling ? a.downvotes - 1 : a.downvotes + 1
                : wasDown ? a.downvotes - 1 : a.downvotes,
              user_vote: toggling ? null : voteType,
            }
          }),
        })),
      } : t
    )

    const res = await fetch(`/api/activities/${activityId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-voter-id': getVoterId() },
      body: JSON.stringify({ vote_type: voteType }),
    })
    if (res.ok) {
      const counts = await res.json()
      setTrip((t) =>
        t ? {
          ...t,
          destinations: t.destinations.map((d) => ({
            ...d,
            activities: d.activities.map((a) => (a.id === activityId ? { ...a, ...counts } : a)),
          })),
        } : t
      )
    }
  }

  function startEditPlace(dest: Destination, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingPlace(dest)
    setEditPlaceData({ name: dest.name, country: dest.country ?? '', emoji: dest.emoji, notes: dest.notes ?? '' })
  }

  async function savePlace() {
    if (!editingPlace || !editPlaceData.name.trim()) return
    setSavingPlace(true)
    try {
      const res = await fetch(`/api/destinations/${editingPlace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPlaceData),
      })
      if (res.ok) {
        const updated = await res.json()
        setTrip((t) =>
          t ? {
            ...t,
            destinations: t.destinations.map((d) =>
              d.id === editingPlace.id ? { ...d, ...updated } : d
            ),
          } : t
        )
        setEditingPlace(null)
        addToast('Place updated!', 'success')
      }
    } finally {
      setSavingPlace(false)
    }
  }

  async function deletePlace() {
    if (!editingPlace) return
    setDeletingPlace(true)
    try {
      const res = await fetch(`/api/destinations/${editingPlace.id}`, { method: 'DELETE' })
      if (res.ok) {
        setTrip((t) =>
          t ? { ...t, destinations: t.destinations.filter((d) => d.id !== editingPlace.id) } : t
        )
        setEditingPlace(null)
        addToast('Place deleted', 'info')
      }
    } finally {
      setDeletingPlace(false)
    }
  }

  function startEditActivity(activity: Activity) {
    setEditingActivity(activity)
    setEditActivityData({
      name: activity.name,
      description: activity.description ?? '',
      category: activity.category ?? 'Sightseeing',
    })
  }

  async function saveActivity() {
    if (!editingActivity || !editActivityData.name.trim()) return
    setSavingActivity(true)
    try {
      const res = await fetch(`/api/activities/${editingActivity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editActivityData),
      })
      if (res.ok) {
        const updated = await res.json()
        setTrip((t) =>
          t ? {
            ...t,
            destinations: t.destinations.map((d) => ({
              ...d,
              activities: d.activities.map((a) =>
                a.id === editingActivity.id ? { ...a, ...updated } : a
              ),
            })),
          } : t
        )
        setEditingActivity(null)
        addToast('Activity updated!', 'success')
      }
    } finally {
      setSavingActivity(false)
    }
  }

  async function deleteActivity() {
    if (!editingActivity) return
    setDeletingActivity(true)
    try {
      const res = await fetch(`/api/activities/${editingActivity.id}`, { method: 'DELETE' })
      if (res.ok) {
        setTrip((t) =>
          t ? {
            ...t,
            destinations: t.destinations.map((d) => ({
              ...d,
              activities: d.activities.filter((a) => a.id !== editingActivity.id),
            })),
          } : t
        )
        setEditingActivity(null)
        addToast('Activity deleted', 'info')
      }
    } finally {
      setDeletingActivity(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    addToast('Link copied!', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  function copyLinkFromModal() {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <div className="h-14 bg-dark-surface border-b border-dark-border" />
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-dark-card border border-dark-border rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-white font-semibold mb-2">Something went wrong</p>
          <p className="text-powder/60 mb-6 text-sm">{error}</p>
          <a href="/" className="text-primary hover:text-primary/80 transition text-sm">
            ← Go back home
          </a>
        </div>
      </div>
    )
  }

  if (!trip) return null

  const allActivities = trip.destinations.flatMap((d) => d.activities)
  const totalVotes = allActivities.reduce((acc, a) => acc + a.upvotes + a.downvotes, 0)

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge: number | null }[] = [
    { key: 'places', label: 'Places', icon: <MapPin className="w-4 h-4" />, badge: trip.destinations.length },
    { key: 'activities', label: 'Things to do', icon: <Sparkles className="w-4 h-4" />, badge: allActivities.length },
    { key: 'plan', label: 'Final plan', icon: <ClipboardList className="w-4 h-4" />, badge: null },
  ]

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border ${
                toast.type === 'success'
                  ? 'bg-lime/15 border-lime/30 text-lime'
                  : toast.type === 'error'
                  ? 'bg-red-900/30 border-red-700/50 text-red-300'
                  : 'bg-dark-card border-dark-border text-powder'
              }`}
            >
              {toast.type === 'success' && <Check className="w-4 h-4" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sticky header */}
      <header className="bg-dark-surface/95 backdrop-blur border-b border-dark-border sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setShowLeaveModal(true)}
              className="text-powder/40 hover:text-white transition flex-shrink-0 p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-white font-bold truncate leading-tight">{trip.name}</h1>
              {trip.description && (
                <p className="text-powder/40 text-xs truncate hidden sm:block">{trip.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex-shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex relative">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition -mb-px ${
                  tab === t.key ? 'text-white' : 'text-powder/40 hover:text-powder/80'
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                {t.badge !== null && t.badge > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      tab === t.key ? 'bg-primary/30 text-primary' : 'bg-dark-card text-powder/40'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
                {tab === t.key && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">

        {/* ── PLACES ── */}
        {tab === 'places' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-powder/50 text-sm">
                {trip.destinations.length === 0
                  ? 'No places added yet'
                  : `${trip.destinations.length} place${trip.destinations.length !== 1 ? 's' : ''}`}
              </p>
              <button
                onClick={() => setShowAddPlace(true)}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" />
                Add a place
              </button>
            </div>

            {trip.destinations.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-dark-card border border-dark-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <p className="text-white font-semibold text-lg mb-2">Where are you headed?</p>
                <p className="text-powder/50 mb-8 max-w-xs mx-auto text-sm">
                  Add the first destination and share the link with your group.
                </p>
                <button
                  onClick={() => setShowAddPlace(true)}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium transition"
                >
                  Add first place
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {trip.destinations.map((dest, i) => (
                    <motion.div
                      key={dest.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setTab('activities')}
                      className="bg-dark-card hover:bg-dark-card/80 border border-dark-border hover:border-primary/30 rounded-2xl p-5 text-left transition cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{dest.emoji}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => startEditPlace(dest, e)}
                            className="text-powder/20 hover:text-powder/80 transition p-1 rounded-lg hover:bg-dark-border"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-powder/20 text-xs font-mono">#{i + 1}</span>
                        </div>
                      </div>
                      <h3 className="text-white font-semibold text-lg leading-tight group-hover:text-primary transition">
                        {dest.name}
                      </h3>
                      {dest.country && <p className="text-powder/50 text-sm mt-0.5">{dest.country}</p>}
                      {dest.notes && (
                        <p className="text-powder/30 text-xs mt-2 line-clamp-2">{dest.notes}</p>
                      )}
                      <div className="mt-3 flex items-center gap-1.5 text-powder/40 text-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {dest.activities.length}{' '}
                          {dest.activities.length === 1 ? 'activity' : 'activities'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* ── THINGS TO DO ── */}
        {tab === 'activities' && (
          <div>
            {trip.destinations.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-dark-card border border-dark-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <p className="text-white font-semibold text-lg mb-2">Add places first</p>
                <p className="text-powder/50 mb-8 text-sm">
                  Once you have destinations, you can suggest things to do.
                </p>
                <button
                  onClick={() => setTab('places')}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium transition"
                >
                  Go to Places
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {trip.destinations.map((dest) => (
                  <div key={dest.id}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{dest.emoji}</span>
                        <h3 className="text-white font-semibold">{dest.name}</h3>
                        {dest.country && (
                          <span className="text-powder/40 text-sm">{dest.country}</span>
                        )}
                      </div>
                      <button
                        onClick={() => setAddActivityFor(dest.id)}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Suggest
                      </button>
                    </div>

                    {dest.activities.length === 0 ? (
                      <div className="bg-dark-card/50 border border-dark-border rounded-xl p-5 text-center">
                        <p className="text-powder/30 text-sm mb-2">Nothing suggested yet</p>
                        <button
                          onClick={() => setAddActivityFor(dest.id)}
                          className="text-primary text-sm hover:text-primary/80 transition"
                        >
                          Be the first to suggest something
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dest.activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="bg-dark-card border border-dark-border rounded-xl p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h4 className="text-white font-medium">{activity.name}</h4>
                                  {activity.category && (
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full border ${categoryColor(activity.category)}`}
                                    >
                                      {activity.category}
                                    </span>
                                  )}
                                </div>
                                {activity.description && (
                                  <p className="text-powder/50 text-sm leading-relaxed">
                                    {activity.description}
                                  </p>
                                )}
                              </div>

                              {/* Edit + Vote */}
                              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => startEditActivity(activity)}
                                  className="text-powder/20 hover:text-powder/70 transition p-1 rounded-lg hover:bg-dark-border"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => vote(activity.id, 'up')}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition ${
                                    activity.user_vote === 'up'
                                      ? 'bg-lime/20 text-lime border border-lime/40'
                                      : 'bg-dark-surface text-powder/50 hover:bg-dark-border border border-transparent'
                                  }`}
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  {activity.upvotes}
                                </button>
                                <button
                                  onClick={() => vote(activity.id, 'down')}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition ${
                                    activity.user_vote === 'down'
                                      ? 'bg-red-900/30 text-red-300 border border-red-700/50'
                                      : 'bg-dark-surface text-powder/50 hover:bg-dark-border border border-transparent'
                                  }`}
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                  {activity.downvotes}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FINAL PLAN ── */}
        {tab === 'plan' && (
          <div>
            <div className="mb-6">
              <h2 className="text-white font-semibold mb-1">Your trip at a glance</h2>
              <p className="text-powder/40 text-sm">
                {totalVotes > 0
                  ? `Ranked by group votes · ${totalVotes} total votes`
                  : 'Vote on activities to shape the final plan.'}
              </p>
            </div>

            {trip.destinations.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-dark-card border border-dark-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-8 h-8 text-primary" />
                </div>
                <p className="text-white font-semibold text-lg mb-2">Nothing planned yet</p>
                <p className="text-powder/50 mb-8 text-sm">
                  Add places and activities, then vote to shape the itinerary.
                </p>
                <button
                  onClick={() => setTab('places')}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium transition"
                >
                  Start planning
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {trip.destinations.map((dest, destIndex) => {
                  const sorted = [...dest.activities].sort(
                    (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
                  )

                  return (
                    <div key={dest.id} className="relative">
                      {destIndex < trip.destinations.length - 1 && (
                        <div className="absolute left-6 top-14 bottom-0 w-px bg-dark-border" />
                      )}

                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-dark-card border border-dark-border rounded-xl flex items-center justify-center text-2xl flex-shrink-0 z-10">
                          {dest.emoji}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold leading-tight">{dest.name}</h3>
                          {dest.country && (
                            <p className="text-powder/50 text-sm">{dest.country}</p>
                          )}
                          {dest.notes && (
                            <p className="text-powder/30 text-xs mt-0.5">{dest.notes}</p>
                          )}
                        </div>
                      </div>

                      {sorted.length === 0 ? (
                        <div className="ml-14 bg-dark-card/50 border border-dark-border/50 rounded-xl p-4">
                          <p className="text-powder/30 text-sm">No activities suggested yet.</p>
                        </div>
                      ) : (
                        <div className="ml-14 space-y-2">
                          {sorted.map((activity, i) => {
                            const score = activity.upvotes - activity.downvotes
                            const isTopPick = i === 0 && score > 0

                            return (
                              <div
                                key={activity.id}
                                className={`bg-dark-card border rounded-xl p-4 transition ${
                                  isTopPick ? 'border-lime/40' : 'border-dark-border'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    {isTopPick && (
                                      <p className="flex items-center gap-1 text-lime text-xs font-medium mb-1">
                                        <Star className="w-3 h-3" />
                                        Top pick
                                      </p>
                                    )}
                                    <h4 className="text-white font-medium">{activity.name}</h4>
                                    {activity.description && (
                                      <p className="text-powder/50 text-sm mt-1 leading-relaxed">
                                        {activity.description}
                                      </p>
                                    )}
                                    {activity.category && (
                                      <span
                                        className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full border ${categoryColor(activity.category)}`}
                                      >
                                        {activity.category}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-center flex-shrink-0 min-w-[40px]">
                                    <div
                                      className={`text-xl font-bold ${
                                        score > 0 ? 'text-lime' : score < 0 ? 'text-red-400' : 'text-powder/30'
                                      }`}
                                    >
                                      {score > 0 ? '+' : ''}{score}
                                    </div>
                                    <div className="text-powder/30 text-xs">votes</div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Add Place Modal ── */}
      <AnimatePresence>
        {showAddPlace && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold text-lg">Add a place</h3>
                <button onClick={() => setShowAddPlace(false)} className="text-powder/40 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="text-powder/60 text-sm block mb-2">Pick an icon</label>
                <div className="flex gap-2 flex-wrap">
                  {DEST_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setNewPlace((p) => ({ ...p, emoji: e }))}
                      className={`w-10 h-10 rounded-lg text-xl transition ${
                        newPlace.emoji === e
                          ? 'bg-primary/30 ring-2 ring-primary'
                          : 'bg-dark-surface hover:bg-dark-border'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <input
                  type="text"
                  placeholder="Place name (e.g. Barcelona)"
                  value={newPlace.name}
                  onChange={(e) => setNewPlace((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addPlace()}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Country (optional)"
                  value={newPlace.country}
                  onChange={(e) => setNewPlace((p) => ({ ...p, country: e.target.value }))}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition"
                />
                <input
                  type="text"
                  placeholder="Notes (optional — e.g. 3 nights)"
                  value={newPlace.notes}
                  onChange={(e) => setNewPlace((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAddPlace(false); setNewPlace({ name: '', country: '', emoji: '🗺️', notes: '' }) }}
                  className="flex-1 bg-dark-surface hover:bg-dark-border text-white py-3 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={addPlace}
                  disabled={!newPlace.name.trim() || addingPlace}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-dark-border disabled:text-powder/30 text-white py-3 rounded-xl font-medium transition"
                >
                  {addingPlace ? 'Adding…' : 'Add place'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Activity Modal ── */}
      <AnimatePresence>
        {addActivityFor && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-semibold text-lg">Suggest something to do</h3>
                <button onClick={() => setAddActivityFor(null)} className="text-powder/40 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-powder/40 text-sm mb-5">
                in{' '}
                <span className="text-primary font-medium">
                  {trip.destinations.find((d) => d.id === addActivityFor)?.name}
                </span>
              </p>

              <div className="space-y-3 mb-5">
                <input
                  type="text"
                  placeholder="What's the activity? (e.g. Sunset cruise)"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition"
                  autoFocus
                />
                <textarea
                  placeholder="Details (optional) — tips, duration, booking info…"
                  value={newActivity.description}
                  onChange={(e) => setNewActivity((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition resize-none"
                />
                <select
                  value={newActivity.category}
                  onChange={(e) => setNewActivity((p) => ({ ...p, category: e.target.value }))}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setAddActivityFor(null); setNewActivity({ name: '', description: '', category: 'Sightseeing' }) }}
                  className="flex-1 bg-dark-surface hover:bg-dark-border text-white py-3 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={addActivity}
                  disabled={!newActivity.name.trim() || addingActivity}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-dark-border disabled:text-powder/30 text-white py-3 rounded-xl font-medium transition"
                >
                  {addingActivity ? 'Adding…' : 'Add suggestion'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Place Modal ── */}
      <AnimatePresence>
        {editingPlace && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold text-lg">Edit place</h3>
                <button onClick={() => setEditingPlace(null)} className="text-powder/40 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="text-powder/60 text-sm block mb-2">Pick an icon</label>
                <div className="flex gap-2 flex-wrap">
                  {DEST_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEditPlaceData((p) => ({ ...p, emoji: e }))}
                      className={`w-10 h-10 rounded-lg text-xl transition ${
                        editPlaceData.emoji === e
                          ? 'bg-primary/30 ring-2 ring-primary'
                          : 'bg-dark-surface hover:bg-dark-border'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <input
                  type="text"
                  placeholder="Place name"
                  value={editPlaceData.name}
                  onChange={(e) => setEditPlaceData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Country (optional)"
                  value={editPlaceData.country}
                  onChange={(e) => setEditPlaceData((p) => ({ ...p, country: e.target.value }))}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition"
                />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={editPlaceData.notes}
                  onChange={(e) => setEditPlaceData((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => setEditingPlace(null)}
                  className="flex-1 bg-dark-surface hover:bg-dark-border text-white py-3 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={savePlace}
                  disabled={!editPlaceData.name.trim() || savingPlace}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-dark-border disabled:text-powder/30 text-white py-3 rounded-xl font-medium transition"
                >
                  {savingPlace ? 'Saving…' : 'Save changes'}
                </button>
              </div>

              <button
                onClick={deletePlace}
                disabled={deletingPlace}
                className="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-800/40 text-red-400 hover:text-red-300 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {deletingPlace ? 'Deleting…' : 'Delete this place'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Activity Modal ── */}
      <AnimatePresence>
        {editingActivity && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold text-lg">Edit suggestion</h3>
                <button onClick={() => setEditingActivity(null)} className="text-powder/40 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-5">
                <input
                  type="text"
                  placeholder="Activity name"
                  value={editActivityData.name}
                  onChange={(e) => setEditActivityData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition"
                  autoFocus
                />
                <textarea
                  placeholder="Details (optional)"
                  value={editActivityData.description}
                  onChange={(e) => setEditActivityData((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition resize-none"
                />
                <select
                  value={editActivityData.category}
                  onChange={(e) => setEditActivityData((p) => ({ ...p, category: e.target.value }))}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => setEditingActivity(null)}
                  className="flex-1 bg-dark-surface hover:bg-dark-border text-white py-3 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveActivity}
                  disabled={!editActivityData.name.trim() || savingActivity}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-dark-border disabled:text-powder/30 text-white py-3 rounded-xl font-medium transition"
                >
                  {savingActivity ? 'Saving…' : 'Save changes'}
                </button>
              </div>

              <button
                onClick={deleteActivity}
                disabled={deletingActivity}
                className="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-800/40 text-red-400 hover:text-red-300 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {deletingActivity ? 'Deleting…' : 'Delete this suggestion'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Leave Confirmation Modal ── */}
      <AnimatePresence>
        {showLeaveModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-sm p-6 shadow-2xl"
            >
              <h3 className="text-white font-semibold text-lg mb-2">Save your link first!</h3>
              <p className="text-powder/50 text-sm mb-5 leading-relaxed">
                This trip only exists at this URL. Save it before leaving so you can find it again.
              </p>

              <div className="bg-dark-surface border border-dark-border rounded-xl px-3 py-2.5 flex items-center gap-2 mb-5">
                <span className="text-powder/40 text-xs truncate flex-1 font-mono select-all">
                  {typeof window !== 'undefined' ? window.location.href : ''}
                </span>
                <button
                  onClick={copyLinkFromModal}
                  className="flex-shrink-0 bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                >
                  {linkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 bg-dark-surface hover:bg-dark-border text-white py-3 rounded-xl font-medium transition"
                >
                  Stay
                </button>
                <a
                  href="/"
                  className="flex-1 bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 py-3 rounded-xl font-medium transition text-center"
                >
                  Leave
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
