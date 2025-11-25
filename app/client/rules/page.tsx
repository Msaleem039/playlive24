"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { selectCurrentUser } from "@/app/store/slices/authSlice"
import DashboardHeader from "@/components/dashboard-header"

export default function ClientRulesPage() {
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
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Rules &amp; Guidelines</h1>
        <p className="text-sm text-gray-600">
          Publish your client-facing rules and betting guidelines here. Update this placeholder with the
          official content or CMS-driven copy later.
        </p>
      </div>
    </div>
  )
}

