import { NextResponse } from 'next/server'
import { initDb, query } from '@/lib/db'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb()
    const voterId = request.headers.get('x-voter-id') || ''

    const tripResult = await query('SELECT * FROM trips WHERE id = $1', [params.id])
    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const destResult = await query(
      'SELECT * FROM destinations WHERE trip_id = $1 ORDER BY position, created_at',
      [params.id]
    )

    const actResult = await query(
      `SELECT a.*,
        COUNT(CASE WHEN v.vote_type = 'up' THEN 1 END)::int as upvotes,
        COUNT(CASE WHEN v.vote_type = 'down' THEN 1 END)::int as downvotes,
        MAX(CASE WHEN v.voter_id = $2 THEN v.vote_type END) as user_vote
       FROM activities a
       LEFT JOIN votes v ON v.activity_id = a.id
       WHERE a.trip_id = $1
       GROUP BY a.id
       ORDER BY a.created_at`,
      [params.id, voterId]
    )

    const destinations = destResult.rows.map((dest) => ({
      ...dest,
      activities: actResult.rows.filter((a) => a.destination_id === dest.id),
    }))

    return NextResponse.json({ ...tripResult.rows[0], destinations })
  } catch (error) {
    console.error('Error fetching trip:', error)
    return NextResponse.json({ error: 'Failed to load trip' }, { status: 500 })
  }
}
