'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [tripName, setTripName] = useState('')
  const [joinUrl, setJoinUrl] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function createTrip() {
    if (!tripName.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tripName.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/trip/${data.id}`)
      } else {
        setError(data.error || 'Something went wrong. Try again.')
      }
    } catch {
      setError('Could not connect. Check your internet and try again.')
    } finally {
      setCreating(false)
    }
  }

  function joinTrip() {
    setError('')
    const match = joinUrl.match(/\/trip\/([a-f0-9-]{36})/)
    if (match) {
      router.push(`/trip/${match[1]}`)
    } else if (/^[a-f0-9-]{36}$/.test(joinUrl.trim())) {
      router.push(`/trip/${joinUrl.trim()}`)
    } else {
      setError('That link doesn\'t look right. Paste the full trip link.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✈️</span>
            <span className="text-xl font-bold text-white">Liivo</span>
          </div>
          <a
            href="/demo"
            className="text-slate-400 hover:text-white text-sm transition"
          >
            See an example trip →
          </a>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pt-16 pb-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-6">🗺️</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Plan your next trip
            <br />
            <span className="text-indigo-400">with the whole group</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-sm mx-auto">
            Share one link. Everyone adds places, suggests activities, and votes on their favourites.
          </p>
        </div>

        {/* Create card */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-4 border border-slate-700 shadow-xl">
          <h2 className="text-white font-semibold text-lg mb-1">Start a new trip</h2>
          <p className="text-slate-500 text-sm mb-4">
            Give it a name, then share the link with your group.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. Bali girls trip, Euro summer 2025..."
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createTrip()}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              autoFocus
            />
            <button
              onClick={createTrip}
              disabled={!tripName.trim() || creating}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold px-6 py-3 rounded-xl transition whitespace-nowrap"
            >
              {creating ? 'Creating…' : 'Create trip →'}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {/* Join card */}
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-slate-300 font-semibold mb-3">Already have a link?</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Paste the trip link here"
              value={joinUrl}
              onChange={(e) => setJoinUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinTrip()}
              className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition"
            />
            <button
              onClick={joinTrip}
              className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-3 rounded-xl transition font-medium"
            >
              Open
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-12 text-center">
          {[
            { icon: '📍', title: 'Add places', desc: 'Everyone chips in destinations' },
            { icon: '🗳️', title: 'Vote together', desc: 'Thumbs up the best ideas' },
            { icon: '📋', title: 'See the plan', desc: 'Itinerary built from top votes' },
          ].map((f) => (
            <div key={f.title} className="p-3">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="text-white font-medium text-sm">{f.title}</div>
              <div className="text-slate-500 text-xs mt-1 leading-snug">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
