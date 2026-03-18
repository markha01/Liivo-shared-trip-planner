import { NextResponse } from 'next/server'
import { initDb, query } from '@/lib/db'

export async function POST(request: Request) {
  try {
    await initDb()
    const { name, description } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Trip name is required' }, { status: 400 })
    }
    const result = await query(
      'INSERT INTO trips (name, description) VALUES ($1, $2) RETURNING *',
      [name.trim(), description?.trim() || null]
    )
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}
