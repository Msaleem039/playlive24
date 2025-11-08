import { redirect } from 'next/navigation'
import { getServerSession, getDashboardPath } from '@/lib/auth/session'
import DashboardPageClient from './dashboard-client'

export default async function DashboardPage() {
  const session = await getServerSession()

  // Redirect unauthenticated users to login (server-side, no flicker)
  if (!session.isValid || !session.user) {
    redirect('/login')
  }

  // Redirect to role-specific dashboard if needed
  const roleDashboard = getDashboardPath(session.user.role)
  if (roleDashboard !== '/dashboard') {
    redirect(roleDashboard)
  }

  return <DashboardPageClient />
}
