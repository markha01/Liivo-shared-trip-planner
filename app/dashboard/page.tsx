import { redirect } from 'next/navigation'
import { getUserFromCookies } from '@/lib/auth'
import { initDb, query } from '@/lib/db'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const user = await getUserFromCookies()
  if (!user) redirect('/login')

  await initDb()
  const result = await query(
    'SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC',
    [user.id]
  )

  return <DashboardClient user={user} initialTrips={result.rows} />
}
