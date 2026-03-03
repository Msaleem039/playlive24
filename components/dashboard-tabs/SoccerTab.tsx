"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { selectCurrentUser } from "@/app/store/slices/authSlice"
import { useGetSoccerMatchesQuery } from "@/app/services/Api"
import { Trophy, RefreshCw, Clock, Radio } from "lucide-react"

export default function SoccerTab() {
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [activeSubTab, setActiveSubTab] = useState<'live' | 'upcoming'>('live')
  const router = useRouter()
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isAgent = userRole === 'AGENT'

  // Fetch soccer matches from API
  const { 
    data: matchesData, 
    isLoading, 
    error, 
    refetch 
  } = useGetSoccerMatchesQuery(undefined, {
    skip: !mounted,
    pollingInterval: 30000, // Poll every 30 seconds
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset page when sub-tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeSubTab])

  // Normalize API response: raw array, or wrapped in { data: [] } / { matches: [] }, or { live: [], upcoming: [] }
  const { liveMatches, upcomingMatches } = useMemo(() => {
    const raw = matchesData
    if (!raw) return { liveMatches: [], upcomingMatches: [] }

    let list: any[] = []
    if (Array.isArray(raw)) {
      list = raw
    } else if (Array.isArray((raw as any)?.data)) {
      list = (raw as any).data
    } else if (Array.isArray((raw as any)?.matches)) {
      list = (raw as any).matches
    } else if (Array.isArray((raw as any)?.live) || Array.isArray((raw as any)?.upcoming)) {
      return {
        liveMatches: (raw as any).live || [],
        upcomingMatches: (raw as any).upcoming || [],
      }
    }

    const isLive = (m: any) => m?.live === true || m?.live === "true" || m?.live === 1
    const isUpcoming = (m: any) => m?.upcoming === true || m?.upcoming === "true" || m?.upcoming === 1
    return {
      liveMatches: list.filter(isLive),
      upcomingMatches: list.filter(isUpcoming),
    }
  }, [matchesData])

  // Filter matches based on active sub-tab
  const filteredMatches = activeSubTab === 'live' ? liveMatches : upcomingMatches

  // Calculate pagination for filtered matches
  const paginatedMatches = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage
    const endIndex = startIndex + perPage
    return filteredMatches.slice(startIndex, endIndex)
  }, [filteredMatches, currentPage, perPage])

  const totalFilteredPages = Math.ceil(filteredMatches.length / perPage)

  const formatMatchTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const hours = date.getUTCHours().toString().padStart(2, '0')
      const minutes = date.getUTCMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    } catch {
      return '--:--'
    }
  }

  const formatMatchDateLabel = (dateString: string) => {
    try {
      const d = new Date(dateString)
      const day = d.getUTCDate().toString().padStart(2, '0')
      const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
      let hours = d.getUTCHours()
      const minutes = d.getUTCMinutes().toString().padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHours = (hours % 12) || 12
      return `${day} ${month} ${displayHours}:${minutes} ${ampm}`
    } catch {
      return '-- -- --:-- --'
    }
  }

  const handleMatchClick = (eventId: string) => {
    if (!eventId) return

    // For agents, navigate to agent match book detail page
    if (isAgent) {
      router.push(`/agent/match-book/${eventId}`)
      return
    }

    // For other roles, only navigate for live matches
    if (activeSubTab !== 'live') {
      return
    }

    // Set flag to auto-open TV when navigating from main page
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fromMainPage', 'true')
      sessionStorage.setItem('liveSport', 'soccer')
    }
    router.push(`/live/${eventId}?sport=soccer`)
  }

  if (!mounted) {
    return (
      <div className="bg-white">
        <div className="bg-[#00A66E] text-white px-4 py-3 font-bold flex items-center justify-between">
          <span>Soccer</span>
          <RefreshCw className="w-4 h-4 animate-spin" />
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00A66E]" />
            <p className="text-gray-600">Loading soccer matches...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white">
        <div className="bg-[#00A66E] text-white px-4 py-3 font-bold flex items-center justify-between">
          <span>Soccer</span>
          <RefreshCw className="w-4 h-4 animate-spin" />
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00A66E]" />
            <p className="text-gray-600">Loading soccer matches...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white">
        <div className="bg-[#00A66E] text-white px-4 py-3 font-bold flex items-center justify-between">
          <span>Soccer</span>
          <button 
            onClick={() => refetch()}
            className="hover:bg-white/20 p-1 rounded"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-red-600 mb-2">Error loading soccer matches</p>
            <button 
              onClick={() => refetch()}
              className="text-[#00A66E] hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      {/* Sport Header */}
      <div className="bg-[#00A66E] text-white px-2 sm:px-4 py-1 font-semibold flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <span className="text-[0.7rem] sm:text-[0.75rem]">Soccer</span>
          {/* Live Count with Signal Icon */}
          {liveMatches.length > 0 && (
            <button 
              onClick={() => router.push('/live?sport=soccer')}
              className="flex items-center gap-1 bg-red-500 hover:bg-red-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold transition-colors"
            >
              <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>{liveMatches.length}</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button 
            onClick={() => refetch()}
            className="hover:bg-white/20 p-1 rounded flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Sub-tabs for Live and Upcoming */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveSubTab('live')}
            className={`flex-1 px-1 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
              activeSubTab === 'live'
                ? 'bg-[#005461] text-white border-b-2 border-[#00A66E]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Radio className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-[10px] sm:text-sm truncate">
                Live ({liveMatches.length})
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab('upcoming')}
            className={`flex-1 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-normal transition-colors ${
              activeSubTab === 'upcoming'
                ? 'bg-[#005461] text-white border-b-2 border-[#00A66E]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-[10px] sm:text-sm truncate">
                Upcoming ({upcomingMatches.length})
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Matches List */}
      {paginatedMatches.length === 0 ? (
        <div className="flex items-center justify-center py-8 px-4">
          <div className="text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 text-sm sm:text-base">
              No {activeSubTab === 'live' ? 'live' : 'upcoming'} soccer matches found
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {paginatedMatches.map((match: any, index: number) => {
            const event = match?.event || {}
            const eventId = event?.id
            const matchName = event?.name || 'Match'
            const openDate = event?.openDate
            const isLive = activeSubTab === 'live'

            return (
              <div 
                key={eventId || index} 
                onClick={() => handleMatchClick(eventId)}
                className={`flex flex-col sm:grid sm:grid-cols-[minmax(220px,1fr)_80px] gap-2 px-2 sm:px-2 py-2 ${
                  isLive ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
                } ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
                style={{ minHeight: '60px' }}
              >
                {/* Match Details Section */}
                <div className="flex flex-col gap-1 text-xs sm:text-sm sm:pr-4 min-w-0 sm:col-span-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] flex-wrap">
                    <span className="font-semibold truncate">
                      {openDate ? formatMatchDateLabel(openDate) : '-- -- --:-- --'}
                    </span>
                    <span className="text-gray-300 hidden sm:inline">|</span>
                    {isLive && (
                      <>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                        <span className="text-red-600 font-medium text-[10px] sm:text-xs">Live</span>
                      </>
                    )}
                    {!isLive && (
                      <span className="text-blue-600 font-medium text-[10px] sm:text-xs">Upcoming</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="font-medium truncate">{matchName}</span>
                    {event?.countryCode && (
                      <span className="text-gray-500 text-[10px] sm:text-xs">
                        ({event.countryCode})
                      </span>
                    )}
                  </div>
                </div>

                {/* Market Count */}
                <div className="hidden sm:flex items-center justify-center">
                  <span className="text-xs text-gray-600">
                    {match?.marketCount || 0} Markets
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Match Count and Pagination */}
      {filteredMatches.length > 0 && (
        <div className="px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 text-center sm:text-left">
              Showing {paginatedMatches.length} of {filteredMatches.length} {activeSubTab === 'live' ? 'live' : 'upcoming'} match{filteredMatches.length !== 1 ? 'es' : ''}
            </div>
            
            {/* Pagination */}
            {totalFilteredPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs md:text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">←</span>
                </button>
                
                <span className="text-[10px] sm:text-xs md:text-sm text-gray-600 px-1.5 sm:px-2">
                  {currentPage}/{totalFilteredPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalFilteredPages, prev + 1))}
                  disabled={currentPage === totalFilteredPages}
                  className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs md:text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
