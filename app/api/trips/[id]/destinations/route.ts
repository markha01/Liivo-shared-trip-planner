import { NextResponse } from 'next/server'
import { initDb, query } from '@/lib/db'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb()
    const { name, country, notes, emoji } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Place name is required' }, { status: 400 })
    }

    const posResult = await query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM destinations WHERE trip_id = $1',
      [params.id]
    )
    const position = posResult.rows[0].next_pos

    const result = await query(
      'INSERT INTO destinations (trip_id, name, country, notes, emoji, position) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [params.id, name.trim(), country?.trim() || null, notes?.trim() || null, emoji || '🗺️', position]
    )
    return NextResponse.json({ ...result.rows[0], activities: [] })
  } catch (error) {
    console.error('Error adding destination:', error)
    return NextResponse.json({ error: 'Failed to add place' }, { status: 500 })
  }
}
