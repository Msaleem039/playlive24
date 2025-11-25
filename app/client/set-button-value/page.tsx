"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { selectCurrentUser } from "@/app/store/slices/authSlice"
import DashboardHeader from "@/components/dashboard-header"

export default function ClientSetButtonValuePage() {
  const router = useRouter()
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isClient = userRole === 'CLIENT'
  const [dashboardTab, setDashboardTab] = useState('Home')

  // Handle tab change - navigate to dashboard with selected tab
  const handleTabChange = useCallback((tab: string) => {
    setDashboardTab(tab)
    if (tab !== 'Home') {
      router.push('/dashboard')
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('selectedTab', tab)
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-white">
      {isClient && (
        <DashboardHeader 
          selectedTab={dashboardTab} 
          onSelectTab={handleTabChange} 
        />
      )}
      <div className={`${isClient ? "pt-[108px]" : ""} min-h-[400px] bg-white rounded-lg shadow p-6`}>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Set Button Value</h1>
        <p className="text-sm text-gray-600">
          Configure the quick bet button values from this screen. Replace the placeholder content with the
          final settings form once it is ready.
        </p>
      </div>
    </div>
  )
}

