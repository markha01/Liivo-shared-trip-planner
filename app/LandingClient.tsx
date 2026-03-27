'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, ThumbsUp, ClipboardList } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: MapPin,
    color: 'bg-primary/20 text-primary',
    title: 'Add places',
    desc: 'Everyone chips in destinations and we keep them organised.',
  },
  {
    icon: ThumbsUp,
    color: 'bg-accent/20 text-accent',
    title: 'Vote together',
    desc: 'Thumbs up the best ideas. The group decides democratically.',
  },
  {
    icon: ClipboardList,
    color: 'bg-lime/20 text-lime',
    title: 'See the plan',
    desc: 'Itinerary built automatically from the highest-voted activities.',
  },
]

export default function LandingClient() {
  const router = useRouter()
  const [joinUrl, setJoinUrl] = useState('')
  const [joinError, setJoinError] = useState('')

  function joinTrip() {
    setJoinError('')
    const match = joinUrl.match(/\/trip\/([a-f0-9-]{36})/)
    if (match) {
      router.push(`/trip/${match[1]}`)
    } else if (/^[a-f0-9-]{36}$/.test(joinUrl.trim())) {
      router.push(`/trip/${joinUrl.trim()}`)
    } else {
      setJoinError("That link doesn't look right. Paste the full trip link.")
    }
  }

  return (
    <main className="min-h-screen bg-dark-bg overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full filter blur-[100px] animate-blob" />
        <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-accent/10 rounded-full filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[30%] w-[450px] h-[450px] bg-primary/8 rounded-full filter blur-[100px] animate-blob animation-delay-4000" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-dark-border/50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold text-white">Trippin&apos;</span>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-powder/60 hover:text-white text-sm transition">
              Demo
            </Link>
            <Link
              href="/login"
              className="text-powder/60 hover:text-white text-sm transition"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-6">
            Plan together, travel better
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Plan trips.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #A878F8 0%, #2192D9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Together.
            </span>
          </h1>

          <p className="text-powder/70 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Share one link with your group. Add destinations, suggest activities,
            and vote on your favorites to build the perfect itinerary.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3.5 rounded-xl transition text-base"
            >
              Get started free
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto bg-dark-card hover:bg-dark-border border border-dark-border text-white font-semibold px-8 py-3.5 rounded-xl transition text-base"
            >
              See a demo →
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-dark-card border border-dark-border rounded-2xl p-6"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-white font-semibold mb-1">{f.title}</h3>
              <p className="text-powder/50 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Join by link */}
      <section className="relative z-10 max-w-lg mx-auto px-6 pb-24">
        <div className="bg-dark-card/50 border border-dark-border rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Already have a link?</h2>
          <p className="text-powder/50 text-sm mb-4">Paste a trip link to join without an account.</p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Paste trip link here"
              value={joinUrl}
              onChange={(e) => setJoinUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinTrip()}
              className="flex-1 bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-white placeholder-powder/30 focus:outline-none focus:border-primary transition text-sm"
            />
            <button
              onClick={joinTrip}
              className="bg-dark-border hover:bg-dark-border/80 text-white px-4 py-2.5 rounded-xl transition font-medium text-sm whitespace-nowrap"
            >
              Open
            </button>
          </div>
          {joinError && <p className="text-red-400 text-xs mt-2">{joinError}</p>}
        </div>
      </section>
    </main>
  )
}
