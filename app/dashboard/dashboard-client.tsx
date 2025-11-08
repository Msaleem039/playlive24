'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { DashboardContentOptimized } from '@/components/dashboard'
import { ErrorBoundary } from '@/components/utils/ErrorBoundary'

export default function DashboardPageClient() {
  const [tab, setTab] = useState('Home')
  const mainRef = useRef<HTMLElement>(null)

  const handleTabChange = useCallback((newTab: string) => {
    setTab(newTab)
  }, [])

  // Reset scroll position when tab changes
  useEffect(() => {
    if (mainRef.current) {
      requestAnimationFrame(() => {
        mainRef.current?.scrollTo({ top: 0, behavior: 'instant' })
      })
    }
  }, [tab])

  // Prevent body scrolling when dashboard is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Fixed Header - No scrollbar here */}
      <div className="fixed top-0 left-0 right-0 z-30 flex-shrink-0">
        <DashboardHeader selectedTab={tab} onSelectTab={handleTabChange} />
      </div>

      {/* Spacer to push content below fixed header - Top bar (h-12=48px) + Marquee (py-1≈20px) + Nav bar (h-10=40px) */}
      <div className="h-[108px] flex-shrink-0" />

      {/* Scrollable content area - starts below header */}
      <main 
        ref={mainRef} 
        className="flex-1 relative z-10 overflow-x-hidden overflow-y-auto"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-5 lg:px-5 py-4">
          <ErrorBoundary>
            <DashboardContentOptimized tab={tab} />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
