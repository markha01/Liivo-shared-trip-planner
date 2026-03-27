import { redirect } from 'next/navigation'
import { getUserFromCookies } from '@/lib/auth'
import LandingClient from './LandingClient'

export default async function Home() {
  const user = await getUserFromCookies()
  if (user) redirect('/dashboard')
  return <LandingClient />
}
