import { redirect } from 'next/navigation'
import { getUserFromCookies } from '@/lib/auth'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const user = await getUserFromCookies()
  if (!user) redirect('/login')
  return <SettingsClient user={user} />
}
