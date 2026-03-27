import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJwtSync } from '@/lib/auth-edge'

const PROTECTED_PATHS = ['/dashboard', '/settings']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const token = request.cookies.get('liivo_session')?.value
  if (!token || !verifyJwtSync(token)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
}
