import { redirect } from 'next/navigation'
import LoginForm from '@/app/ui/LoginForm'
import { getSession } from '@/app/lib/session'

export default async function HomePage() {
  const session = await getSession()
  if (session?.authenticated) redirect('/portal')
  return <LoginForm />
}
