import { NextResponse } from 'next/server'
import { initDb, query } from '@/lib/db'

export async function GET(request: Request) {
  await initDb()
  const result = await query(
    "SELECT id FROM trips WHERE name = 'Summer in the Mediterranean 2025' LIMIT 1"
  )
  const base = new URL(request.url).origin
  if (result.rows.length > 0) {
    return NextResponse.redirect(`${base}/trip/${result.rows[0].id}`)
  }
  return NextResponse.redirect(`${base}/`)
}
