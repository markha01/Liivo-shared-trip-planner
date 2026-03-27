import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { initDb, query } from '@/lib/db'
import { getSessionUser, signJwt } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb()
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (user.id !== params.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { displayName, email, currentPassword, newPassword } = body

    // Fetch current user from DB
    const existing = await query('SELECT * FROM users WHERE id = $1', [params.id])
    if (existing.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const dbUser = existing.rows[0]

    // Password required when changing email or password
    if ((email || newPassword) && !currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
    }
    if (currentPassword) {
      const valid = await bcrypt.compare(currentPassword, dbUser.password_hash)
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    let updatedName = dbUser.display_name
    let updatedEmail = dbUser.email

    if (displayName && displayName.trim()) {
      updatedName = displayName.trim()
      await query('UPDATE users SET display_name = $1 WHERE id = $2', [updatedName, params.id])
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
      const taken = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase(), params.id])
      if (taken.rows.length > 0) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      updatedEmail = email.toLowerCase()
      await query('UPDATE users SET email = $1 WHERE id = $2', [updatedEmail, params.id])
    }

    if (newPassword) {
      if (newPassword.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      const hash = await bcrypt.hash(newPassword, 12)
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, params.id])
    }

    // Re-issue JWT with updated info
    const token = await signJwt({ id: params.id, email: updatedEmail, displayName: updatedName })
    const response = NextResponse.json({ ok: true })
    response.cookies.set('liivo_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}

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
