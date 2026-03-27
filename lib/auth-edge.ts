// Edge Runtime compatible JWT check (no Node.js APIs)
// Used only by middleware.ts

export type JwtPayload = {
  id: string
  email: string
  displayName: string
}

export function verifyJwtSync(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    if (!payload.id) return null
    return payload as JwtPayload
  } catch {
    return null
  }
}
