"use client"

import { useState, useEffect, useRef } from "react"
import { useDispatch } from "react-redux"
import Cookies from "js-cookie"
import { SettlementAdminPanel } from "@/components/dashboardagent/SettlementAdminPanel"
import { setCredentials } from "@/app/store/slices/authSlice"
import Loader from "@/components/utils/Loader"
import CommonHeader from "@/components/common-header"

export default function SettlementAdminLayout() {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // On mount, try to rehydrate auth state from cookie
    const token = Cookies.get("token")
    const userJson = Cookies.get("auth_user")
    
    if (token && userJson) {
      try {
        const userObj = JSON.parse(userJson)
        dispatch(setCredentials({ token, user: userObj }))
      } catch (e) {
        console.error("Failed to parse user cookie", e)
      }
    }

    setLoading(false)
  }, [dispatch])

  // Ref for the main scrollable container
  const mainRef = useRef<HTMLElement>(null)

  // Prevent body scrolling when dashboard is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])


  if (loading) {
    return <Loader />
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Header without Navigation - Fixed position (SettlementAdminPanel has its own navigation) */}
      <div className="fixed top-0 left-0 right-0 z-30 flex-shrink-0">
        <CommonHeader />
      </div>

      {/* Spacer to push content below fixed header (top bar + marquee only, no nav bar) */}
      <div className="h-[50px] sm:h-[60px] flex-shrink-0" />

      {/* Main Content - Scrollable area */}
      <main ref={mainRef} className="flex-1 relative z-10 p-0 pt-0 overflow-x-hidden overflow-y-auto">
        <SettlementAdminPanel />
      </main>
    </div>
  )
}
