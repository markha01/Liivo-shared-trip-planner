'use client'

import { useState } from 'react'

type Activity = {
  id: string
  name: string
  description: string
  category: string
  upvotes: number
  downvotes: number
  user_vote: 'up' | 'down' | null
}

type Destination = {
  id: string
  name: string
  country: string
  emoji: string
  notes: string
  activities: Activity[]
}

type Tab = 'places' | 'activities' | 'plan'

const INITIAL_DESTINATIONS: Destination[] = [
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    emoji: '🏛️',
    notes: 'First stop — 4 nights',
    activities: [
      {
        id: 'a1',
        name: 'Colosseum & Roman Forum tour',
        description: 'Skip-the-line tickets, 3-hour guided tour. Book at least 2 weeks ahead — sells out fast.',
        category: 'Sightseeing',
        upvotes: 5,
        downvotes: 0,
        user_vote: null,
      },
      {
        id: 'a2',
        name: 'Vatican Museums & Sistine Chapel',
        description: 'Early 8am entry to beat the crowds. Half-day experience. Dress code: covered shoulders and knees.',
        category: 'Culture',
        upvotes: 4,
        downvotes: 1,
        user_vote: null,
      },
      {
        id: 'a3',
        name: 'Evening in Trastevere',
        description: 'Wander cobblestone streets, aperitivo at Bar San Calisto, dinner at Da Enzo al 29. Very local vibe.',
        category: 'Food & Drinks',
        upvotes: 6,
        downvotes: 0,
        user_vote: null,
      },
      {
        id: 'a4',
        name: 'Pasta-making class',
        description: "Learn to make fresh cacio e pepe with a local host. 2-hour class near Campo de' Fiori. Max 8 people.",
        category: 'Food & Drinks',
        upvotes: 3,
        downvotes: 2,
        user_vote: null,
      },
    ],
  },
  {
    id: 'amalfi',
    name: 'Amalfi Coast',
    country: 'Italy',
    emoji: '🌊',
    notes: 'Coastal road trip — 3 nights',
    activities: [
      {
        id: 'a5',
        name: 'Boat tour along the coastline',
        description: 'Half-day private boat with stops at sea caves and hidden beaches. Departs from Amalfi harbour at 9am.',
        category: 'Adventure',
        upvotes: 7,
        downvotes: 0,
        user_vote: null,
      },
      {
        id: 'a6',
        name: 'Path of the Gods hike',
        description: '7.5km trail from Bomerano down to Positano. Breathtaking views the entire way, 3–4 hours.',
        category: 'Adventure',
        upvotes: 4,
        downvotes: 2,
        user_vote: null,
      },
      {
        id: 'a7',
        name: 'Lazy day in Positano',
        description: 'Explore the village, swim at Spiaggia Grande, lunch at Il Tridente with sea views.',
        category: 'Relaxation',
        upvotes: 5,
        downvotes: 1,
        user_vote: null,
      },
      {
        id: 'a8',
        name: 'Limoncello tasting & seafood dinner',
        description: 'Visit a family-run limoncello distillery, then dinner at Ristorante Marina Grande with fresh catch of the day.',
        category: 'Food & Drinks',
        upvotes: 3,
        downvotes: 0,
        user_vote: null,
      },
    ],
  },
  {
    id: 'santorini',
    name: 'Santorini',
    country: 'Greece',
    emoji: '🌅',
    notes: 'Grand finale — 4 nights',
    activities: [
      {
        id: 'a9',
        name: 'Sunset at Oia village',
        description: 'Arrive 2 hours early for a good spot on the castle walls. Head to Sunset Bar for cocktails after.',
        category: 'Sightseeing',
        upvotes: 8,
        downvotes: 1,
        user_vote: null,
      },
      {
        id: 'a10',
        name: 'Catamaran cruise to hot springs',
        description: 'Full-day tour: soak in volcanic hot springs, swim at Red Beach, BBQ lunch on deck. One of the best days.',
        category: 'Adventure',
        upvotes: 6,
        downvotes: 0,
        user_vote: null,
      },
      {
        id: 'a11',
        name: 'Akrotiri archaeological site',
        description: 'Preserved Bronze Age city buried by volcanic eruption. 2 hours with an audio guide. Bring sunscreen.',
        category: 'Culture',
        upvotes: 3,
        downvotes: 1,
        user_vote: null,
      },
      {
        id: 'a12',
        name: 'Wine tasting at Santo Wines',
        description: 'Cliff-edge winery with local Assyrtiko white wine and sweeping caldera views. Book the sunset slot.',
        category: 'Food & Drinks',
        upvotes: 5,
        downvotes: 2,
        user_vote: null,
      },
    ],
  },
]

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

function categoryColor(cat: string) {
  return categoryColors[cat] ?? 'bg-slate-700/60 text-slate-300'
}

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>('places')
  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS)

  function vote(activityId: string, voteType: 'up' | 'down') {
    setDestinations((dests) =>
      dests.map((dest) => ({
        ...dest,
        activities: dest.activities.map((activity) => {
          if (activity.id !== activityId) return activity

          const prevVote = activity.user_vote
          let upvotes = activity.upvotes
          let downvotes = activity.downvotes

          // Remove previous vote
          if (prevVote === 'up') upvotes--
          if (prevVote === 'down') downvotes--

          // Toggle off if same vote
          if (prevVote === voteType) {
            return { ...activity, upvotes, downvotes, user_vote: null }
          }

          // Apply new vote
          if (voteType === 'up') upvotes++
          if (voteType === 'down') downvotes++
          return { ...activity, upvotes, downvotes, user_vote: voteType }
        }),
      }))
    )
  }

  const allActivities = destinations.flatMap((d) => d.activities)
  const totalVotes = allActivities.reduce((acc, a) => acc + a.upvotes + a.downvotes, 0)

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Demo banner */}
      <div className="bg-indigo-600/20 border-b border-indigo-500/30 px-4 py-2.5 text-center">
        <p className="text-indigo-300 text-sm">
          This is an example trip —{' '}
          <a href="/" className="text-white font-medium hover:underline">
            start your own →
          </a>
        </p>
      </div>

      {/* Sticky header */}
      <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <a href="/" className="text-slate-400 hover:text-white transition flex-shrink-0 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div className="min-w-0">
              <h1 className="text-white font-bold truncate leading-tight">
                Summer in the Mediterranean 2025
              </h1>
              <p className="text-slate-400 text-xs truncate hidden sm:block">
                Two weeks exploring the best of Italy and Greece with the whole squad ✈️
              </p>
            </div>
          </div>
          <a
            href="/"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex-shrink-0"
          >
            Start your trip →
          </a>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex">
            {(
              [
                { key: 'places', label: '📍 Places', badge: destinations.length },
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
            <div className="mb-5">
              <p className="text-slate-400 text-sm">{destinations.length} places on this trip</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {destinations.map((dest, i) => (
                <button
                  key={dest.id}
                  onClick={() => setTab('activities')}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl p-5 text-left transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{dest.emoji}</span>
                    <span className="text-slate-600 text-xs font-mono">#{i + 1}</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg leading-tight">{dest.name}</h3>
                  <p className="text-slate-400 text-sm mt-0.5">{dest.country}</p>
                  <p className="text-slate-500 text-xs mt-2 line-clamp-2">{dest.notes}</p>
                  <div className="mt-3 flex items-center gap-1 text-slate-500 text-sm">
                    <span>✨</span>
                    <span>
                      {dest.activities.length}{' '}
                      {dest.activities.length === 1 ? 'activity' : 'activities'} suggested
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── THINGS TO DO ── */}
        {tab === 'activities' && (
          <div className="space-y-8">
            {destinations.map((dest) => (
              <div key={dest.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{dest.emoji}</span>
                  <h3 className="text-white font-semibold">{dest.name}</h3>
                  <span className="text-slate-500 text-sm">{dest.country}</span>
                </div>

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
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${categoryColor(activity.category)}`}
                            >
                              {activity.category}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm leading-relaxed">
                            {activity.description}
                          </p>
                        </div>

                        {/* Vote buttons */}
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
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
              </div>
            ))}
          </div>
        )}

        {/* ── FINAL PLAN ── */}
        {tab === 'plan' && (
          <div>
            <div className="mb-6">
              <h2 className="text-white font-semibold mb-1">Your trip at a glance</h2>
              <p className="text-slate-400 text-sm">
                Activities ranked by group votes · {totalVotes} total votes
              </p>
            </div>

            <div className="space-y-8">
              {destinations.map((dest, destIndex) => {
                const sorted = [...dest.activities].sort(
                  (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
                )

                return (
                  <div key={dest.id} className="relative">
                    {destIndex < destinations.length - 1 && (
                      <div className="absolute left-6 top-14 bottom-0 w-px bg-slate-700/60" />
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 z-10">
                        {dest.emoji}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold leading-tight">{dest.name}</h3>
                        <p className="text-slate-400 text-sm">{dest.country}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{dest.notes}</p>
                      </div>
                    </div>

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
                                <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                                  {activity.description}
                                </p>
                                <span
                                  className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${categoryColor(activity.category)}`}
                                >
                                  {activity.category}
                                </span>
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
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
