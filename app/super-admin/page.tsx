import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/session'
import DashboardLayout from '@/components/layouts/DashboardLayout'

export default async function SuperAdminPage() {
  const session = await getServerSession()

  // Redirect unauthenticated users to login (server-side, no flicker)
  if (!session.isValid || !session.user) {
    redirect('/login')
  }

  // Check role and redirect if not super admin
  const role = session.user.role?.toUpperCase().replace(/[-\s]+/g, '_')
  if (role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  return <DashboardLayout role="SUPER_ADMIN" />
}
