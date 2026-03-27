import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { initDb, query } from '@/lib/db'
import { signJwt } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    await initDb()
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await signJwt({ id: user.id, email: user.email, displayName: user.display_name })

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, displayName: user.display_name },
    })
    response.cookies.set('liivo_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 })
  }
}
