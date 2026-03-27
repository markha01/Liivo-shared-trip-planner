import { NextResponse } from 'next/server'
import { initDb, query } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    await initDb()
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const result = await query(
      'SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    )
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json({ error: 'Failed to load trips' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDb()
    const user = await getSessionUser(request)
    const { name, description } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Trip name is required' }, { status: 400 })
    }
    const result = await query(
      'INSERT INTO trips (name, description, user_id) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), description?.trim() || null, user?.id || null]
    )
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}
