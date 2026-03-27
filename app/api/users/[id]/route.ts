import { NextResponse } from 'next/server'
import { initDb, query } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb()
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.id !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await query('DELETE FROM users WHERE id = $1', [params.id])

    const response = NextResponse.json({ ok: true })
    response.cookies.set('liivo_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
