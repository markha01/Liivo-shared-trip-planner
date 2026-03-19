'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

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

const categoryColors: Record<string, string> = {
  'Food & Drinks': 'bg-orange-900/50 text-orange-300',
  Sightseeing: 'bg-blue-900/50 text-blue-300',
  Adventure: 'bg-green-900/50 text-green-300',
  Shopping: 'bg-pink-900/50 text-pink-300',
  Relaxation: 'bg-purple-900/50 text-purple-300',
  Nightlife: 'bg-violet-900/50 text-violet-300',
  Culture: 'bg-amber-900/50 text-amber-300',
  Nature: 'bg-teal-900/50 text-teal-300',
}

function categoryColor(cat: string | null) {
  return categoryColors[cat ?? ''] ?? 'bg-slate-700/60 text-slate-300'
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
          t
            ? {
                ...t,
                destinations: t.destinations.map((d) =>
                  d.id === addActivityFor ? { ...d, activities: [...d.activities, activity] } : d
                ),
              }
            : t
        )
        setNewActivity({ name: '', description: '', category: 'Sightseeing' })
        setAddActivityFor(null)
      }
    } finally {
      setAddingActivity(false)
    }
  }

  async function vote(activityId: string, voteType: 'up' | 'down') {
    const res = await fetch(`/api/activities/${activityId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-voter-id': getVoterId() },
      body: JSON.stringify({ vote_type: voteType }),
    })
    if (res.ok) {
      const counts = await res.json()
      setTrip((t) =>
        t
          ? {
              ...t,
              destinations: t.destinations.map((d) => ({
                ...d,
                activities: d.activities.map((a) => (a.id === activityId ? { ...a, ...counts } : a)),
              })),
            }
          : t
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
          t
            ? {
                ...t,
                destinations: t.destinations.map((d) =>
                  d.id === editingPlace.id ? { ...d, ...updated } : d
                ),
              }
            : t
        )
        setEditingPlace(null)
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
          t
            ? {
                ...t,
                destinations: t.destinations.map((d) => ({
                  ...d,
                  activities: d.activities.map((a) =>
                    a.id === editingActivity.id ? { ...a, ...updated } : a
                  ),
                })),
              }
            : t
        )
        setEditingActivity(null)
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
          t
            ? {
                ...t,
                destinations: t.destinations.map((d) => ({
                  ...d,
                  activities: d.activities.filter((a) => a.id !== editingActivity.id),
                })),
              }
            : t
        )
        setEditingActivity(null)
      }
    } finally {
      setDeletingActivity(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function copyLinkFromModal() {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">✈️</div>
          <p className="text-slate-400">Loading your trip…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-white font-semibold mb-2">Something went wrong</p>
          <p className="text-slate-400 mb-6">{error}</p>
          <a href="/" className="text-indigo-400 hover:text-indigo-300 transition">
            ← Go back home
          </a>
        </div>
      </div>
    )
  }

  if (!trip) return null

  const allActivities = trip.destinations.flatMap((d) => d.activities)
  const totalVotes = allActivities.reduce((acc, a) => acc + a.upvotes + a.downvotes, 0)

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sticky header */}
      <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setShowLeaveModal(true)}
              className="text-slate-400 hover:text-white transition flex-shrink-0 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-white font-bold truncate leading-tight">{trip.name}</h1>
              {trip.description && (
                <p className="text-slate-400 text-xs truncate hidden sm:block">{trip.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex-shrink-0"
          >
            <span>{copied ? '✓' : '🔗'}</span>
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex">
            {(
              [
                { key: 'places', label: '📍 Places', badge: trip.destinations.length },
                { key: 'activities', label: '✨ Things to do', badge: allActivities.length },
                { key: 'plan', label: '📋 Final plan', badge: null },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition -mb-px ${
                  tab === t.key
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
                {t.badge !== null && t.badge > 0 && (
                  <span className="ml-1.5 bg-slate-700 text-slate-300 text-xs px-1.5 py-0.5 rounded-full">
                    {t.badge}
                  </span>
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
              <p className="text-slate-400 text-sm">
                {trip.destinations.length === 0
                  ? 'No places added yet'
                  : `${trip.destinations.length} place${trip.destinations.length !== 1 ? 's' : ''} on this trip`}
              </p>
              <button
                onClick={() => setShowAddPlace(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                + Add a place
              </button>
            </div>

            {trip.destinations.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-5">🗺️</div>
                <p className="text-white font-semibold text-lg mb-2">Where are you headed?</p>
                <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                  Add the first destination and share the link with your group.
                </p>
                <button
                  onClick={() => setShowAddPlace(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition"
                >
                  Add first place
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trip.destinations.map((dest, i) => (
                  <div
                    key={dest.id}
                    onClick={() => setTab('activities')}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl p-5 text-left transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-4xl">{dest.emoji}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => startEditPlace(dest, e)}
                          className="text-slate-600 hover:text-slate-300 transition p-1 rounded-lg hover:bg-slate-600"
                          title="Edit place"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <span className="text-slate-600 text-xs font-mono">#{i + 1}</span>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold text-lg leading-tight">{dest.name}</h3>
                    {dest.country && <p className="text-slate-400 text-sm mt-0.5">{dest.country}</p>}
                    {dest.notes && (
                      <p className="text-slate-500 text-xs mt-2 line-clamp-2">{dest.notes}</p>
                    )}
                    <div className="mt-3 flex items-center gap-1 text-slate-500 text-sm">
                      <span>✨</span>
                      <span>
                        {dest.activities.length}{' '}
                        {dest.activities.length === 1 ? 'activity' : 'activities'} suggested
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── THINGS TO DO ── */}
        {tab === 'activities' && (
          <div>
            {trip.destinations.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-5">✨</div>
                <p className="text-white font-semibold text-lg mb-2">Add places first</p>
                <p className="text-slate-400 mb-8">
                  Once you have destinations, you can suggest things to do there.
                </p>
                <button
                  onClick={() => setTab('places')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition"
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
                          <span className="text-slate-500 text-sm">{dest.country}</span>
                        )}
                      </div>
                      <button
                        onClick={() => setAddActivityFor(dest.id)}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition"
                      >
                        + Suggest
                      </button>
                    </div>

                    {dest.activities.length === 0 ? (
                      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 text-center">
                        <p className="text-slate-500 text-sm mb-2">Nothing suggested yet</p>
                        <button
                          onClick={() => setAddActivityFor(dest.id)}
                          className="text-indigo-400 text-sm hover:text-indigo-300 transition"
                        >
                          Be the first to suggest something
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dest.activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="bg-slate-800 border border-slate-700 rounded-xl p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h4 className="text-white font-medium">{activity.name}</h4>
                                  {activity.category && (
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${categoryColor(activity.category)}`}
                                    >
                                      {activity.category}
                                    </span>
                                  )}
                                </div>
                                {activity.description && (
                                  <p className="text-slate-400 text-sm leading-relaxed">
                                    {activity.description}
                                  </p>
                                )}
                              </div>

                              {/* Edit + Vote buttons */}
                              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => startEditActivity(activity)}
                                  className="text-slate-600 hover:text-slate-300 transition p-1 rounded-lg hover:bg-slate-700"
                                  title="Edit suggestion"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => vote(activity.id, 'up')}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition ${
                                    activity.user_vote === 'up'
                                      ? 'bg-green-700/40 text-green-300 border border-green-600/60'
                                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-transparent'
                                  }`}
                                >
                                  👍 {activity.upvotes}
                                </button>
                                <button
                                  onClick={() => vote(activity.id, 'down')}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition ${
                                    activity.user_vote === 'down'
                                      ? 'bg-red-700/40 text-red-300 border border-red-600/60'
                                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-transparent'
                                  }`}
                                >
                                  👎 {activity.downvotes}
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
              <p className="text-slate-400 text-sm">
                {totalVotes > 0
                  ? `Activities ranked by group votes · ${totalVotes} total votes`
                  : 'Head to "Things to do" and vote to build your plan.'}
              </p>
            </div>

            {trip.destinations.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-5">📋</div>
                <p className="text-white font-semibold text-lg mb-2">Nothing planned yet</p>
                <p className="text-slate-400 mb-8">
                  Add places and activities, then vote to shape the final itinerary.
                </p>
                <button
                  onClick={() => setTab('places')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition"
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
                      {/* Timeline connector */}
                      {destIndex < trip.destinations.length - 1 && (
                        <div className="absolute left-6 top-14 bottom-0 w-px bg-slate-700/60" />
                      )}

                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 z-10">
                          {dest.emoji}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold leading-tight">{dest.name}</h3>
                          {dest.country && (
                            <p className="text-slate-400 text-sm">{dest.country}</p>
                          )}
                          {dest.notes && (
                            <p className="text-slate-500 text-xs mt-0.5">{dest.notes}</p>
                          )}
                        </div>
                      </div>

                      {sorted.length === 0 ? (
                        <div className="ml-14 bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                          <p className="text-slate-500 text-sm">No activities suggested yet.</p>
                        </div>
                      ) : (
                        <div className="ml-14 space-y-2">
                          {sorted.map((activity, i) => {
                            const score = activity.upvotes - activity.downvotes
                            const isTopPick = i === 0 && score > 0

                            return (
                              <div
                                key={activity.id}
                                className={`bg-slate-800 border rounded-xl p-4 transition ${
                                  isTopPick ? 'border-green-700/60' : 'border-slate-700'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    {isTopPick && (
                                      <p className="text-green-400 text-xs font-medium mb-1">
                                        ⭐ Top pick
                                      </p>
                                    )}
                                    <h4 className="text-white font-medium">{activity.name}</h4>
                                    {activity.description && (
                                      <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                                        {activity.description}
                                      </p>
                                    )}
                                    {activity.category && (
                                      <span
                                        className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${categoryColor(activity.category)}`}
                                      >
                                        {activity.category}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-center flex-shrink-0 min-w-[40px]">
                                    <div
                                      className={`text-xl font-bold ${
                                        score > 0
                                          ? 'text-green-400'
                                          : score < 0
                                          ? 'text-red-400'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {score > 0 ? '+' : ''}
                                      {score}
                                    </div>
                                    <div className="text-slate-600 text-xs">votes</div>
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
      {showAddPlace && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-5">Add a place</h3>

            <div className="mb-4">
              <label className="text-slate-400 text-sm block mb-2">Pick an icon</label>
              <div className="flex gap-2 flex-wrap">
                {['🗺️', '🏛️', '🌊', '🏖️', '⛰️', '🌆', '🌿', '🏜️', '🌅', '🏔️', '🗼', '🏝️'].map(
                  (e) => (
                    <button
                      key={e}
                      onClick={() => setNewPlace((p) => ({ ...p, emoji: e }))}
                      className={`w-10 h-10 rounded-lg text-xl transition ${
                        newPlace.emoji === e ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {e}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <input
                type="text"
                placeholder="Place name (e.g. Barcelona)"
                value={newPlace.name}
                onChange={(e) => setNewPlace((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addPlace()}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                autoFocus
              />
              <input
                type="text"
                placeholder="Country (optional)"
                value={newPlace.country}
                onChange={(e) => setNewPlace((p) => ({ ...p, country: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
              <input
                type="text"
                placeholder="Notes (optional — e.g. 3 nights, first stop)"
                value={newPlace.notes}
                onChange={(e) => setNewPlace((p) => ({ ...p, notes: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddPlace(false)
                  setNewPlace({ name: '', country: '', emoji: '🗺️', notes: '' })
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={addPlace}
                disabled={!newPlace.name.trim() || addingPlace}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-medium transition"
              >
                {addingPlace ? 'Adding…' : 'Add place'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Activity Modal ── */}
      {addActivityFor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-1">Suggest something to do</h3>
            <p className="text-slate-400 text-sm mb-5">
              in{' '}
              <span className="text-indigo-400 font-medium">
                {trip.destinations.find((d) => d.id === addActivityFor)?.name}
              </span>
            </p>

            <div className="space-y-3 mb-5">
              <input
                type="text"
                placeholder="What's the activity? (e.g. Sunset cruise)"
                value={newActivity.name}
                onChange={(e) => setNewActivity((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                autoFocus
              />
              <textarea
                placeholder="Details (optional) — tips, duration, booking info…"
                value={newActivity.description}
                onChange={(e) => setNewActivity((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition resize-none"
              />
              <select
                value={newActivity.category}
                onChange={(e) => setNewActivity((p) => ({ ...p, category: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
              >
                {[
                  'Sightseeing',
                  'Food & Drinks',
                  'Adventure',
                  'Culture',
                  'Relaxation',
                  'Shopping',
                  'Nightlife',
                  'Nature',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAddActivityFor(null)
                  setNewActivity({ name: '', description: '', category: 'Sightseeing' })
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={addActivity}
                disabled={!newActivity.name.trim() || addingActivity}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-medium transition"
              >
                {addingActivity ? 'Adding…' : 'Add suggestion'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Edit Place Modal ── */}
      {editingPlace && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-5">Edit place</h3>

            <div className="mb-4">
              <label className="text-slate-400 text-sm block mb-2">Pick an icon</label>
              <div className="flex gap-2 flex-wrap">
                {['🗺️', '🏛️', '🌊', '🏖️', '⛰️', '🌆', '🌿', '🏜️', '🌅', '🏔️', '🗼', '🏝️'].map((e) => (
                  <button
                    key={e}
                    onClick={() => setEditPlaceData((p) => ({ ...p, emoji: e }))}
                    className={`w-10 h-10 rounded-lg text-xl transition ${
                      editPlaceData.emoji === e ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-slate-700 hover:bg-slate-600'
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
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                autoFocus
              />
              <input
                type="text"
                placeholder="Country (optional)"
                value={editPlaceData.country}
                onChange={(e) => setEditPlaceData((p) => ({ ...p, country: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={editPlaceData.notes}
                onChange={(e) => setEditPlaceData((p) => ({ ...p, notes: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex gap-3 mb-3">
              <button
                onClick={() => setEditingPlace(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={savePlace}
                disabled={!editPlaceData.name.trim() || savingPlace}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-medium transition"
              >
                {savingPlace ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            <button
              onClick={deletePlace}
              disabled={deletingPlace}
              className="w-full bg-red-900/40 hover:bg-red-900/70 border border-red-800/50 text-red-400 hover:text-red-300 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {deletingPlace ? 'Deleting…' : 'Delete this place'}
            </button>
          </div>
        </div>
      )}

      {/* ── Leave Confirmation Modal ── */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="text-3xl mb-3">⚠️</div>
            <h3 className="text-white font-semibold text-lg mb-2">Save your link before you go!</h3>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              This trip only exists at this URL. If you leave without saving the link, you won&apos;t be able to find it again.
            </p>

            <div className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-5">
              <span className="text-slate-400 text-xs truncate flex-1 font-mono select-all">
                {typeof window !== 'undefined' ? window.location.href : ''}
              </span>
              <button
                onClick={copyLinkFromModal}
                className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >
                {linkCopied ? '✓ Copied!' : 'Copy link'}
              </button>
            </div>

            <p className="text-slate-400 text-sm mb-4">Are you sure you want to leave?</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition"
              >
                No, stay
              </button>
              <a
                href="/"
                className="flex-1 bg-red-900/50 hover:bg-red-900/80 border border-red-800/50 text-red-300 hover:text-red-200 py-3 rounded-xl font-medium transition text-center"
              >
                Yes, leave
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Activity Modal ── */}
      {editingActivity && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-5">Edit suggestion</h3>

            <div className="space-y-3 mb-5">
              <input
                type="text"
                placeholder="Activity name"
                value={editActivityData.name}
                onChange={(e) => setEditActivityData((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                autoFocus
              />
              <textarea
                placeholder="Details (optional)"
                value={editActivityData.description}
                onChange={(e) => setEditActivityData((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition resize-none"
              />
              <select
                value={editActivityData.category}
                onChange={(e) => setEditActivityData((p) => ({ ...p, category: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
              >
                {['Sightseeing', 'Food & Drinks', 'Adventure', 'Culture', 'Relaxation', 'Shopping', 'Nightlife', 'Nature'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="flex gap-3 mb-3">
              <button
                onClick={() => setEditingActivity(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={saveActivity}
                disabled={!editActivityData.name.trim() || savingActivity}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-medium transition"
              >
                {savingActivity ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            <button
              onClick={deleteActivity}
              disabled={deletingActivity}
              className="w-full bg-red-900/40 hover:bg-red-900/70 border border-red-800/50 text-red-400 hover:text-red-300 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {deletingActivity ? 'Deleting…' : 'Delete this suggestion'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
