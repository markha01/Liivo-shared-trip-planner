import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Trippin' — Plan trips together",
  description: 'Share a link, add places, vote on activities, and build your itinerary together.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-dark-bg text-slate-100">{children}</body>
    </html>
  )
}
