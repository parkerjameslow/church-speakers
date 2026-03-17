import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import db from '@/lib/db'

export default async function Home() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  if (count === 0) redirect('/setup')

  const session = await getSession()
  if (!session) redirect('/login')

  redirect('/dashboard')
}
