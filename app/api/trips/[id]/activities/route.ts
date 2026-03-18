import { NextResponse } from 'next/server'
import { initDb, query } from '@/lib/db'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb()
    const { destination_id, name, description, category } = await request.json()
    if (!name?.trim() || !destination_id) {
      return NextResponse.json({ error: 'Activity name and destination are required' }, { status: 400 })
    }

    const result = await query(
      'INSERT INTO activities (destination_id, trip_id, name, description, category) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [destination_id, params.id, name.trim(), description?.trim() || null, category || 'Sightseeing']
    )
    return NextResponse.json({ ...result.rows[0], upvotes: 0, downvotes: 0, user_vote: null })
  } catch (error) {
    console.error('Error adding activity:', error)
    return NextResponse.json({ error: 'Failed to add activity' }, { status: 500 })
  }
}
