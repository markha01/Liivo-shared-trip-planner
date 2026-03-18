import { NextResponse } from 'next/server'
import { initDb, query } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb()
    const { name, country, notes, emoji } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Place name is required' }, { status: 400 })
    }

    const result = await query(
      'UPDATE destinations SET name=$1, country=$2, notes=$3, emoji=$4 WHERE id=$5 RETURNING *',
      [name.trim(), country?.trim() || null, notes?.trim() || null, emoji || '🗺️', params.id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error updating place:', error)
    return NextResponse.json({ error: 'Failed to update place' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb()
    const result = await query('DELETE FROM destinations WHERE id=$1 RETURNING id', [params.id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting place:', error)
    return NextResponse.json({ error: 'Failed to delete place' }, { status: 500 })
  }
}
