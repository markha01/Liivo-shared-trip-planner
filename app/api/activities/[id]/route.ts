import { NextResponse } from 'next/server'
import { initDb, query } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb()
    const { name, description, category } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Activity name is required' }, { status: 400 })
    }

    const result = await query(
      'UPDATE activities SET name=$1, description=$2, category=$3 WHERE id=$4 RETURNING *',
      [name.trim(), description?.trim() || null, category || 'Sightseeing', params.id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb()
    const result = await query('DELETE FROM activities WHERE id=$1 RETURNING id', [params.id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
  }
}
