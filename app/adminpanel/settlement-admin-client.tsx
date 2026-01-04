'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'
import SettlementAdminLayout from '@/components/layouts/SettlementAdminLayout'
import Loader from '@/components/utils/Loader'

export default function SettlementAdminPanelClient() {
  const router = useRouter()
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isSettlementAdmin = userRole === 'SETTLEMENT_ADMIN'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const canAccess = isSettlementAdmin || isSuperAdmin

  useEffect(() => {
    // Client-side role check
    if (!authUser) {
      router.push('/login')
      return
    }

    // SETTLEMENT_ADMIN and SUPER_ADMIN roles can access
    if (!canAccess) {
      router.push('/dashboard')
      return
    }
  }, [authUser, canAccess, router])

  // Show loader while checking auth
  if (!authUser || !canAccess) {
    return <Loader />
  }

  return <SettlementAdminLayout />
}


