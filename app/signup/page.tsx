import { redirect } from 'next/navigation'
import { getServerSession, getDashboardPath } from '@/lib/auth/session'
import SignupPageClient from './signup-client'

export default async function SignupPage() {
  const session = await getServerSession()

  // If already authenticated, redirect to dashboard (server-side, no flicker)
  if (session.isValid && session.user) {
    const dashboardPath = getDashboardPath(session.user.role)
    redirect(dashboardPath)
  }

  return <SignupPageClient />
}
