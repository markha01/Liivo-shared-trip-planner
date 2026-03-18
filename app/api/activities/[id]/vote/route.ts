import { NextResponse } from 'next/server'
import { initDb, query } from '@/lib/db'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb()
    const { vote_type } = await request.json()
    const voterId = request.headers.get('x-voter-id')

    if (!voterId) {
      return NextResponse.json({ error: 'Voter ID required' }, { status: 400 })
    }
    if (!['up', 'down'].includes(vote_type)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 })
    }

    const existing = await query(
      'SELECT * FROM votes WHERE activity_id = $1 AND voter_id = $2',
      [params.id, voterId]
    )

    if (existing.rows.length > 0) {
      if (existing.rows[0].vote_type === vote_type) {
        await query('DELETE FROM votes WHERE activity_id = $1 AND voter_id = $2', [params.id, voterId])
      } else {
        await query(
          'UPDATE votes SET vote_type = $1 WHERE activity_id = $2 AND voter_id = $3',
          [vote_type, params.id, voterId]
        )
      }
    } else {
      await query(
        'INSERT INTO votes (activity_id, voter_id, vote_type) VALUES ($1, $2, $3)',
        [params.id, voterId, vote_type]
      )
    }

    const counts = await query(
      `SELECT
        COUNT(CASE WHEN vote_type = 'up' THEN 1 END)::int as upvotes,
        COUNT(CASE WHEN vote_type = 'down' THEN 1 END)::int as downvotes,
        MAX(CASE WHEN voter_id = $2 THEN vote_type END) as user_vote
       FROM votes WHERE activity_id = $1`,
      [params.id, voterId]
    )

    return NextResponse.json(counts.rows[0])
  } catch (error) {
    console.error('Error voting:', error)
    return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 })
  }
}
