import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { initDb, query } from '@/lib/db'
import { signJwt } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    await initDb()
    const { email, password, displayName } = await request.json()

    if (!email || !password || !displayName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const result = await query(
      'INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, display_name',
      [email.toLowerCase(), displayName.trim(), passwordHash]
    )

    const user = result.rows[0]
    const token = await signJwt({ id: user.id, email: user.email, displayName: user.display_name })

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, displayName: user.display_name },
    })
    response.cookies.set('liivo_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
