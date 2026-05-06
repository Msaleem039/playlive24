"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { selectCurrentUser } from "@/app/store/slices/authSlice"
import { useGetTabBannersQuery, useToggleMatchVisibilityMutation, useGetSuperAdminUsersQuery, usePlaceBetMutation } from "@/app/services/Api"
import { useGetCricketBookmakerFancyQuery } from "@/app/services/CricketApi"
import { useCricketMatches, isMatchLive } from "@/app/hooks/useCricketMatches"
import { useCricketLiveUpdates } from "@/app/hooks/useWebSocket"
import { Trophy, RefreshCw, Wifi, Clock, Users, Tv, Radio } from "lucide-react"
import { CricketMatch } from "@/lib/types/cricket"
import { toast } from "sonner"

export default function CricketTab() {
  const [useLiveUpdates, setUseLiveUpdates] = useState(true)
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined) // Show all matches (live + upcoming)
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10) // Show 10 matches per page
  const [blinkingOdds, setBlinkingOdds] = useState<Set<string>>(new Set())
  const [matchBlockedOverrides, setMatchBlockedOverrides] = useState<Record<string, boolean>>({})
  const [customBetModal, setCustomBetModal] = useState<{
    isOpen: boolean
    matchId: string
    eventId: string
    matchName: string
  }>({
    isOpen: false,
    matchId: '',
    eventId: '',
    matchName: '',
  })
  const previousOddsRef = useRef<Map<string, { [key: string]: string | number }>>(new Map())
  const [activeSubTab, setActiveSubTab] = useState<'live' | 'upcoming'>('live') // Sub-tab state
  const router = useRouter()
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isAgent = userRole === 'AGENT'
  const normalizedRole = String(userRole || '').toUpperCase().replace(/[-\s]+/g, '_')
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN'
  const [toggleMatchVisibility, { isLoading: isBlockingMatch }] = useToggleMatchVisibilityMutation()
  const { data: usersData, isLoading: isUsersLoading } = useGetSuperAdminUsersQuery(undefined, { skip: !isSuperAdmin })
  const { data: tabBannersData } = useGetTabBannersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const bannerSource = ((tabBannersData as any)?.data ?? tabBannersData) as any
  const bannerUrl =
    bannerSource?.cricket?.imageUrl ||
    bannerSource?.CRICKET?.imageUrl ||
    undefined
  // WebSocket for live updates - only on client
  const {
    isConnected,
    isConnecting,
    error: wsError,
    liveMatches,
    lastUpdate
  } = useCricketLiveUpdates({
    url: 'http://localhost:3000',
    autoConnect: useLiveUpdates && mounted
  })
  // console.log("bannerUrl", bannerUrl)
  // Fetch cricket matches from API - only on client
  const { 
    matches: apiMatches,
    loading: isLoading, 
    error, 
    refetch,
    totalItems,
    totalPages,
    live: apiLiveMatches,
    upcoming: apiUpcomingMatches
  } = useCricketMatches({
    page: currentPage,
    per_page: perPage,
    status: statusFilter
  })

  // Use live matches if available and connected, otherwise use API data
  const matches = (isConnected && liveMatches.length > 0) ? liveMatches : apiMatches
  const liveFromApi = (isConnected && liveMatches.length > 0) ? liveMatches : apiLiveMatches
  const upcomingFromApi = (isConnected && liveMatches.length > 0) ? [] : apiUpcomingMatches

  // Helper function to check if a match has valid team names (not placeholder names like "Team A", "Team B")
  const hasValidTeamNames = (match: any): boolean => {
    // Try to get teams from teama/teamb objects first
    let teamAName = match.teama?.short_name || match.teama?.name || ''
    let teamBName = match.teamb?.short_name || match.teamb?.name || ''
    
    // Fallback: extract from ename string (e.g., "India v South Africa")
    if (!teamAName || !teamBName) {
      const enameParts = (match.ename || '').split(/\s+v\s+/i)
      if (enameParts.length >= 2) {
        teamAName = teamAName || enameParts[0]?.trim() || ''
        teamBName = teamBName || enameParts[1]?.trim() || ''
      }
    }
    
    // Fallback to section array if available
    if ((!teamAName || !teamBName) && match.markets?.[0]?.section) {
      const teamNames = match.markets[0].section
        .map((s: any) => s.nat)
        .filter((t: string) => t && t !== 'The Draw')
      teamAName = teamAName || teamNames[0] || ''
      teamBName = teamBName || teamNames[1] || ''
    }
    
    // Normalize team names (trim and convert to lowercase for comparison)
    teamAName = (teamAName || '').trim()
    teamBName = (teamBName || '').trim()
    
    // Check if team names are valid (not placeholder names)
    const placeholderNames = ['team a', 'team b', 'team1', 'team2', 'team 1', 'team 2']
    const isTeamAValid = teamAName.length > 0 && !placeholderNames.includes(teamAName.toLowerCase())
    const isTeamBValid = teamBName.length > 0 && !placeholderNames.includes(teamBName.toLowerCase())
    
    // Both team names must be valid
    return isTeamAValid && isTeamBValid
  }

  // Use API-provided live and upcoming lists, or filter from matches as fallback
  const liveMatchesList = (liveFromApi.length > 0 
    ? liveFromApi 
    : matches.filter((m: any) => {
        // Use iplay field directly from API response
        if (typeof m?.iplay === 'boolean') {
          return m.iplay === true
        }
        // Fallback to legacy logic if iplay not available
        const statusText = (m?.status_str || m?.state || m?.match_status || '')
          .toString()
          .toLowerCase()
        const liveByNumeric = typeof m?.status === 'number' && isMatchLive(m.status)
        return liveByNumeric || (
          statusText.includes('live') ||
          m?.game_state === 3 ||
          m?.match_status === 'live'
        )
      })
  ).filter(hasValidTeamNames) // Filter out matches with invalid team names

  const upcomingMatchesList = (upcomingFromApi.length > 0
    ? upcomingFromApi
    : matches.filter((m: any) => {
        // Use iplay field directly from API response
        if (typeof m?.iplay === 'boolean') {
          return m.iplay === false
        }
        // Fallback to legacy logic if iplay not available
        const statusText = (m?.status_str || m?.state || m?.match_status || '')
          .toString()
          .toLowerCase()
        const liveByNumeric = typeof m?.status === 'number' && isMatchLive(m.status)
        const isLive = liveByNumeric || (
          statusText.includes('live') ||
          m?.game_state === 3 ||
          m?.match_status === 'live'
        )
        const completedKeywords = ['completed', 'finished', 'result']
        const isCompleted = completedKeywords.some(k => statusText.includes(k))
        return !isLive && !isCompleted
      })
  ).filter(hasValidTeamNames) // Filter out matches with invalid team names

  // Filter matches based on active sub-tab
  const filteredMatches = activeSubTab === 'live' ? liveMatchesList : upcomingMatchesList
  
  // Counts for header badge
  const liveCount = liveMatchesList.length
  const upcomingCount = upcomingMatchesList.length

  // Extract and format odds from match markets
  const matchesWithOdds = useMemo(() => {
    return filteredMatches.map((match: any) => {
      // Extract odds from match markets (MATCH_ODDS market)
      const matchOddsMarket = match.markets?.[0] || match.markets?.find((m: any) => m.mname === 'MATCH_ODDS')
      
      let team1Odds = '-'
      let team2Odds = '-'
      let overOdds = '-'
      let underOdds = '-'
      let total1Odds = '-'
      let total2Odds = '-'

      if (matchOddsMarket?.section && Array.isArray(matchOddsMarket.section)) {
        // Extract team names and their best back odds
        const teamSections = matchOddsMarket.section
          .filter((s: any) => s.nat && s.nat !== 'The Draw')
          .slice(0, 2) // Get first two teams

        if (teamSections.length >= 2) {
          // Get best back odds (highest) for each team
          const team1Section = teamSections[0]
          const team2Section = teamSections[1]
          
          const team1BackOdds = team1Section.odds
            ?.filter((o: any) => o.otype === 'back' && o.odds > 0)
            .sort((a: any, b: any) => b.odds - a.odds)[0]
          
          const team2BackOdds = team2Section.odds
            ?.filter((o: any) => o.otype === 'back' && o.odds > 0)
            .sort((a: any, b: any) => b.odds - a.odds)[0]

          team1Odds = team1BackOdds ? team1BackOdds.odds.toFixed(2) : '-'
          team2Odds = team2BackOdds ? team2BackOdds.odds.toFixed(2) : '-'
        }
      }

      // Fallback to legacy odds structure
      if (team1Odds === '-' || team2Odds === '-') {
        const odds = match?.live_odds || match?.odds || {}
        const matchOdds = odds?.matchodds || {}
        team1Odds = matchOdds?.team_a_odds || matchOdds?.team1 || team1Odds
        team2Odds = matchOdds?.team_b_odds || matchOdds?.team2 || team2Odds
        overOdds = odds?.over || overOdds
        underOdds = odds?.under || underOdds
        total1Odds = match?.total1 || total1Odds
        total2Odds = match?.total2 || total2Odds
      }

      return {
        ...match,
        formattedOdds: {
          team1: team1Odds,
          team2: team2Odds,
          over: overOdds,
          under: underOdds,
          total1: total1Odds,
          total2: total2Odds,
        }
      }
    })
  }, [filteredMatches])

  // Calculate pagination for filtered matches (client-side pagination)
  const paginatedMatchesWithOdds = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage
    const endIndex = startIndex + perPage
    return matchesWithOdds.slice(startIndex, endIndex)
  }, [matchesWithOdds, currentPage, perPage])

  const totalFilteredPages = Math.ceil(matchesWithOdds.length / perPage)

  // Detect odds changes and trigger blink animation
  useEffect(() => {
    if (!matchesWithOdds || matchesWithOdds.length === 0) return

    const changedOddsKeys = new Set<string>()
    const currentOddsMap = new Map<string, { [key: string]: string | number }>()

    // Build current odds map and detect changes
    matchesWithOdds.forEach((match: any, matchIndex: number) => {
      const matchId = match.gmid ?? match.match_id ?? match.id ?? matchIndex
      const oddsKey = `match-${matchId}`
      
      const currentOdds = {
        team1: match.formattedOdds?.team1 || '-',
        team2: match.formattedOdds?.team2 || '-',
        over: match.formattedOdds?.over || '-',
        under: match.formattedOdds?.under || '-',
        total1: match.formattedOdds?.total1 || '-',
        total2: match.formattedOdds?.total2 || '-',
      }

      currentOddsMap.set(oddsKey, currentOdds)

      const previous = previousOddsRef.current.get(oddsKey)
      if (previous) {
        // Check each odd type for changes
        const oddTypes = ['team1', 'team2', 'over', 'under', 'total1', 'total2'] as const
        oddTypes.forEach((type) => {
          if (previous[type] !== currentOdds[type]) {
            changedOddsKeys.add(`${oddsKey}-${type}`)
          }
        })
      }
    })

    // Update blinking odds if there are changes
    if (changedOddsKeys.size > 0) {
      setBlinkingOdds(new Set(changedOddsKeys))
      
      // Remove blink animation after 2 seconds
      setTimeout(() => {
        setBlinkingOdds((prev) => {
          const updated = new Set(prev)
          changedOddsKeys.forEach(key => updated.delete(key))
          return updated
        })
      }, 2000)
    }

    // Update previous odds reference
    previousOddsRef.current = currentOddsMap
  }, [matchesWithOdds])
 
  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset page when filters or sub-tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, activeSubTab])

  const handleRefresh = () => {
    refetch()
  }

  const handleToggleMatchBlocked = async (eventId: string, blockedNow: boolean) => {
    try {
      const nextBlocked = !blockedNow
      const response: any = await toggleMatchVisibility({ eventId, blocked: nextBlocked }).unwrap()
      const action = response?.action
      const serverBlocked = response?.isMatchOddsBlocked
      const fallbackBlocked = typeof serverBlocked === 'boolean' ? serverBlocked : nextBlocked
      setMatchBlockedOverrides((prev) => ({ ...prev, [eventId]: fallbackBlocked }))
      toast.success(
        response?.message ||
          (action === 'STOP' || fallbackBlocked ? 'Match odds stopped successfully' : 'Match odds allowed successfully')
      )
      refetch()
    } catch (toggleError: any) {
      toast.error(toggleError?.data?.error || toggleError?.data?.message || "Failed to update match odds status")
    }
  }

  const toggleLiveUpdates = () => {
    setUseLiveUpdates(!useLiveUpdates)
  }

  const formatMatchTime = (dateStart: string) => {
    try {
      const date = new Date(dateStart)
      // Use consistent UTC formatting to avoid server/client mismatch
      const hours = date.getUTCHours().toString().padStart(2, '0')
      const minutes = date.getUTCMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    } catch {
      return '--:--'
    }
  }

  const formatMatchDateLabel = (dateStart: string) => {
    try {
      const d = new Date(dateStart)
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

  if (!mounted) {
    return (
      <div className="bg-white">
        <div className="bg-[#00A66E] text-white px-4 py-3 font-bold flex items-center justify-between">
          <span>Cricket</span>
          <RefreshCw className="w-4 h-4 animate-spin" />
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00A66E]" />
            <p className="text-gray-600">Loading cricket matches...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white">
        <div className="bg-[#00A66E] text-white px-4 py-3 font-bold flex items-center justify-between">
          <span>Cricket</span>
          <RefreshCw className="w-4 h-4 animate-spin" />
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00A66E]" />
            <p className="text-gray-600">Loading cricket competitions...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white">
        <div className="bg-[#00A66E] text-white px-4 py-3 font-bold flex items-center justify-between">
          <span>Cricket</span>
          <button 
            onClick={handleRefresh}
            className="hover:bg-white/20 p-1 rounded"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-red-600 mb-2">Error loading competitions</p>
            <button 
              onClick={handleRefresh}
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
      <div className="bg-[#01411C] text-white px-2 sm:px-4 py-1 font-bold flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <span className="text-[0.7rem] sm:text-[0.75rem]">Cricket</span>
          {/* Live Count with Signal Icon */}
          {liveCount > 0 && (
            <button 
              onClick={() => router.push('/live?sport=cricket')}
              className="flex items-center gap-1 bg-red-500 hover:bg-red-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold transition-colors"
            >
              <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>{liveCount}</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Live Updates Toggle */}
          <button 
            onClick={toggleLiveUpdates}
            className={`flex items-center bg-black gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm ${
              useLiveUpdates 
                ? 'bg-white/20 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
            title={useLiveUpdates ? "Disable live updates" : "Enable live updates"}
          >
            <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="text-[10px] sm:text-xs hidden sm:inline">Live</span>
          </button>
          
          <button 
            onClick={handleRefresh}
            className="hover:bg-white/20 p-1 rounded flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
      {bannerUrl && (
  <div className="w-full border-b border-gray-200 bg-black/5">
    <img
      src={bannerUrl}
      alt="Cricket banner"
      className="w-full h-auto object-cover"
    />
  </div>
)}

      {/* Sub-tabs for Live and Upcoming */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveSubTab('live')}
            className={`flex-1 px-1 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold transition-colors ${
              activeSubTab === 'live'
                ? 'bg-[#01411C] text-white px-4 py-1 rounded-t-lg] text-white border-b-2 border-[#00A66E]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Radio className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-[10px] sm:text-sm truncate">
                Live ({liveCount})
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab('upcoming')}
            className={`flex-1 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-normal transition-colors ${
              activeSubTab === 'upcoming'
                ? 'bg-[#01411C] text-white border-b-2 border-[#00A66E]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-[10px] sm:text-sm truncate">
                Upcoming ({upcomingCount})
              </span>
            </div>
          </button>
        </div>
      </div>


      {/* Matches List - Split Layout: Table Left, Details Right */}
        {paginatedMatchesWithOdds.length === 0 ? (
          <div className="flex items-center justify-center py-8 px-4">
            <div className="text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 text-sm sm:text-base">No cricket matches found</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Column Headings (Match details left, fancy/odds right) */}
            {/* <div className="grid grid-cols-[minmax(220px,1fr)_28px_34px_34px_80px_80px_80px_80px_80px_80px] gap-2 px-2 py-2 bg-gray-50 border-b"> */}
              {/* <div className="text-xs font-bold text-gray-700">Match Details</div> */}
              {/* <div className="text-xs font-bold text-gray-700 text-center"></div> */}
              {/* <div className="text-xs font-bold text-gray-700 text-center">BM</div>
              <div className="text-xs font-bold text-gray-700 text-center">F</div>
              <div className="text-xs font-bold text-gray-700 text-center">Team 1</div>
              <div className="text-xs font-bold text-gray-700 text-center">Team 2</div>
              <div className="text-xs font-bold text-gray-700 text-center">Over</div>
              <div className="text-xs font-bold text-gray-700 text-center">Under</div>
              <div className="text-xs font-bold text-gray-700 text-center">Total 1</div>
              <div className="text-xs font-bold text-gray-700 text-center">Total 2</div>
            </div> */}

            {paginatedMatchesWithOdds.map((match: any, index: number) => {
              // Use formatted odds
              const team1Odds = match.formattedOdds?.team1 || '-'
              const team2Odds = match.formattedOdds?.team2 || '-'
              const overOdds = match.formattedOdds?.over || '-'
              const underOdds = match.formattedOdds?.under || '-'
              const total1Odds = match.formattedOdds?.total1 || '-'
              const total2Odds = match.formattedOdds?.total2 || '-'

              // Create unique keys for each odd type
              const matchId = match.gmid ?? match.match_id ?? match.id ?? index
              const oddKeys = {
                team1: `match-${matchId}-team1`,
                team2: `match-${matchId}-team2`,
                over: `match-${matchId}-over`,
                under: `match-${matchId}-under`,
                total1: `match-${matchId}-total1`,
                total2: `match-${matchId}-total2`,
              }

              // Check if match is live using iplay field
              const isLive = typeof match?.iplay === 'boolean' 
                ? match.iplay === true 
                : (() => {
                    // Fallback to legacy logic
                    const statusText = (match?.status_str || match?.state || match?.match_status || '')
                      .toString()
                      .toLowerCase()
                    const liveByNumeric = typeof match?.status === 'number' && isMatchLive(match.status)
                    return liveByNumeric || (
                      statusText.includes('live') ||
                      match?.game_state === 3 ||
                      match?.match_status === 'live'
                    )
                  })()

              const handleMatchClick = () => {
                // Use gmid first (from new API), then match_id, then id
                const matchId = match.gmid ?? match.match_id ?? match.id
                if (!matchId) return
                const marketId = match.marketId ?? match.markets?.[0]?.marketId ?? match.markets?.[0]?.mid

                // For agents, navigate to agent match book detail page
                if (isAgent) {
                  router.push(`/agent/match-book/${matchId}`)
                  return
                }

                // For other roles, only navigate for live matches
                if (!isLive) {
                  return
                }
                // Set flag to auto-open TV when navigating from main page (only for live matches)
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('fromMainPage', 'true')
                }
                const marketQuery = marketId ? `?marketid=${encodeURIComponent(String(marketId))}` : ''
                router.push(`/live/${matchId}${marketQuery}`)
              }
              const blockEventId = match.eventId ?? match.event_id ?? match.gmid ?? match.match_id ?? match.id
              const isBlocked =
                typeof match?.isMatchOddsBlocked === 'boolean'
                  ? match.isMatchOddsBlocked
                  : typeof match?.isMatchOddsAllowed === 'boolean'
                  ? !match.isMatchOddsAllowed
                  : match?.blocked === true || match?.isBlocked === true
              const effectiveBlocked =
                typeof matchBlockedOverrides[String(blockEventId)] === 'boolean'
                  ? matchBlockedOverrides[String(blockEventId)]
                  : isBlocked

              return (
                <div 
                  key={match.gmid ?? match.match_id ?? match.id ?? index} 
                  onClick={handleMatchClick}
                  className={`flex flex-col sm:grid sm:grid-cols-[minmax(220px,1fr)_28px_34px_34px_80px_80px_80px_80px_80px_80px] gap-2 px-2 sm:px-2 py-2 ${
                    isLive ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
                  } ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                  style={{ minHeight: '60px' }}
                >
                  {/* Match Details Section - Mobile: Top, Desktop: Left */}
                  <div className="flex flex-col gap-1 text-xs sm:text-sm sm:pr-4 min-w-0 sm:col-span-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] flex-wrap">
                      <span className="font-bold truncate">{formatMatchDateLabel(match.date_start_ist || match.date_start)}</span>
                      <span className="text-gray-300 hidden sm:inline">|</span>
                      {isLive && (
                        <>
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                          <span className="text-red-600 font-bold text-[10px] sm:text-xs">Live</span>
                        </>
                      )}
                      {!isLive && (
                        <span className="text-blue-600 font-bold text-[10px] sm:text-xs">Upcoming</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      {/* Extract team names from ename string or use teama/teamb */}
                      {(() => {
                        // Try to get teams from teama/teamb objects first
                        let teamAName = match.teama?.short_name || match.teama?.username
                        let teamBName = match.teamb?.short_name || match.teamb?.username
                        
                        // Fallback: extract from ename string (e.g., "India v South Africa")
                        if (!teamAName || !teamBName) {
                          const enameParts = (match.ename || '').split(/\s+v\s+/i)
                          if (enameParts.length >= 2) {
                            teamAName = teamAName || enameParts[0]?.trim() || 'Team A'
                            teamBName = teamBName || enameParts[1]?.trim() || 'Team B'
                          }
                        }
                        
                        // Fallback to section array if available
                        if ((!teamAName || !teamBName) && match.markets?.[0]?.section) {
                          const teamNames = match.markets[0].section
                            .map((s: any) => s.nat)
                            .filter((t: string) => t && t !== 'The Draw')
                          teamAName = teamAName || teamNames[0] || 'Team A'
                          teamBName = teamBName || teamNames[1] || 'Team B'
                        }
                        
                        return (
                          <>
                            <span className="font-bold truncate">{teamAName || 'Team A'}</span>
                            {(match.teama?.scores) && <span className="text-gray-600 text-[10px] sm:text-xs">{match.teama.scores}</span>}
                            <span className="text-gray-400">vs</span>
                            <span className="font-bold truncate">{teamBName || 'Team B'}</span>
                            {(match.teamb?.scores) && <span className="text-gray-600 text-[10px] sm:text-xs">{match.teamb.scores}</span>}
                          </>
                        )
                      })()}
                    </div>
                    {isSuperAdmin && blockEventId && (
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleToggleMatchBlocked(String(blockEventId), effectiveBlocked)
                          }}
                          disabled={isBlockingMatch}
                          className={`px-2 py-1 rounded text-[10px] sm:text-xs font-bold text-white disabled:opacity-60 ${
                            effectiveBlocked ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {effectiveBlocked ? 'BLOCKED' : 'ALLOWED'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const selectedMatchId = String(match.gmid ?? match.match_id ?? match.id ?? '')
                            const selectedEventId = String(blockEventId ?? '')
                            const teamNames = (match.ename || match.title || match.short_title || 'Match').toString()
                            if (!selectedMatchId || !selectedEventId) return
                            setCustomBetModal({
                              isOpen: true,
                              matchId: selectedMatchId,
                              eventId: selectedEventId,
                              matchName: teamNames,
                            })
                          }}
                          className="px-2 py-1 rounded text-[10px] sm:text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
                        >
                          PLACE BET
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile: Icons Row - TV and BM only (F button hidden on mobile) */}
                  {/* Icons removed from mobile view per user request - keeping mobile clean */}

                  {/* Desktop: TV icon column */}
                  <div className="hidden sm:flex items-center justify-center">
                    {match.commentary === 1 ? (
                      <Tv className="w-5 h-5 text-black" />
                    ) : (
                      <div className="w-5 h-5" />
                    )}
                  </div>

                  {/* Desktop: BM Button */}
                  <div className="hidden sm:flex items-center justify-center">
                    {match.session_odds_available ? (
                      <span className="w-7 h-7 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center text-[10px] font-bold">
                        BM
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-full" />
                    )}
                  </div>

                  {/* Desktop: F Button */}
                  <div className="hidden sm:flex items-center justify-center">
                    <span className="w-7 h-7 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center text-[10px] font-bold">
                      F
                    </span>
                  </div>

                  {/* Mobile: Odds Grid - Hidden on mobile per user request */}
                  {/* All odds display removed from mobile view */}

                  {/* Desktop: Fancy/Odds (right) */}
                  <div className={`hidden sm:flex w-full h-7 items-center justify-center text-xs font-bold transition-colors ${
                    blinkingOdds.has(oddKeys.team1)
                      ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4]'
                      : index % 2 === 0 ? 'bg-pink-100' : 'bg-[#AEDBFB]'
                  }`}>
                    {team1Odds !== '-' ? team1Odds : '-'}
                  </div>
                  <div className={`hidden sm:flex w-full h-7 items-center justify-center text-xs font-bold transition-colors ${
                    blinkingOdds.has(oddKeys.team2)
                      ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4]'
                      : index % 2 === 0 ? 'bg-[#AEDBFB]' : 'bg-pink-100'
                  }`}>
                    {team2Odds !== '-' ? team2Odds : '-'}
                  </div>
                  <div className={`hidden sm:flex w-full h-7 items-center justify-center text-xs font-bold transition-colors ${
                    blinkingOdds.has(oddKeys.over)
                      ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4]'
                      : index % 2 === 0 ? 'bg-pink-100' : 'bg-[#AEDBFB]'
                  }`}>
                    {overOdds !== '-' ? overOdds : '-'}
                  </div>
                  <div className={`hidden sm:flex w-full h-7 items-center justify-center text-xs font-bold transition-colors ${
                    blinkingOdds.has(oddKeys.under)
                      ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4]'
                      : index % 2 === 0 ? 'bg-[#AEDBFB]' : 'bg-pink-100'
                  }`}>
                    {underOdds !== '-' ? underOdds : '-'}
                  </div>
                  <div className={`hidden sm:flex w-full h-7 items-center justify-center text-xs font-bold transition-colors ${
                    blinkingOdds.has(oddKeys.total1)
                      ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4]'
                      : index % 2 === 0 ? 'bg-pink-100' : 'bg-[#AEDBFB]'
                  }`}>
                    {total1Odds !== '-' ? total1Odds : '-'}
                  </div>
                  <div className={`hidden sm:flex w-full h-7 items-center justify-center text-xs font-bold transition-colors ${
                    blinkingOdds.has(oddKeys.total2)
                      ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4]'
                      : index % 2 === 0 ? 'bg-[#AEDBFB]' : 'bg-pink-100'
                  }`}>
                    {total2Odds !== '-' ? total2Odds : '-'}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      {/* Match Count */}
      {matchesWithOdds.length > 0 && (
        <div className="px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 text-center sm:text-left">
              Showing {paginatedMatchesWithOdds.length} of {matchesWithOdds.length} {activeSubTab === 'live' ? 'live' : 'upcoming'} match{matchesWithOdds.length !== 1 ? 'es' : ''}
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
      <CustomBetModal
        isOpen={customBetModal.isOpen}
        onClose={() => setCustomBetModal({ isOpen: false, matchId: '', eventId: '', matchName: '' })}
        matchId={customBetModal.matchId}
        eventId={customBetModal.eventId}
        matchName={customBetModal.matchName}
        usersData={usersData}
        isUsersLoading={isUsersLoading}
      />
    </div>
  )
}

function CustomBetModal({
  isOpen,
  onClose,
  matchId,
  eventId,
  matchName,
  usersData,
  isUsersLoading,
}: {
  isOpen: boolean
  onClose: () => void
  matchId: string
  eventId: string
  matchName: string
  usersData: any
  isUsersLoading: boolean
}) {
  const [userId, setUserId] = useState('')
  const [fancyKey, setFancyKey] = useState('')
  const [betType, setBetType] = useState<'BACK' | 'LAY'>('BACK')
  const [betRate, setBetRate] = useState('')
  const [betvalue, setBetvalue] = useState('')
  const [winAmount, setWinAmount] = useState('')
  const [lossAmount, setLossAmount] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [placeBet, { isLoading: isPlacingBet }] = usePlaceBetMutation()
  const { data: bookmakerFancyData, isLoading: isFancyLoading } = useGetCricketBookmakerFancyQuery(
    { eventId },
    { skip: !isOpen || !eventId }
  )

  useEffect(() => {
    if (!isOpen) return
    setUserId('')
    setFancyKey('')
    setBetType('BACK')
    setBetRate('')
    setBetvalue('')
    setWinAmount('')
    setLossAmount('')
    setMessage(null)
  }, [isOpen, eventId, matchId])

  const clientUsers = useMemo(() => {
    const source = usersData as any
    const arr = Array.isArray(source)
      ? source
      : Array.isArray(source?.data)
      ? source.data
      : Array.isArray(source?.data?.users)
      ? source.data.users
      : Array.isArray(source?.users)
      ? source.users
      : []

    const resolveRole = (u: any): string => {
      const role = u?.role
      if (typeof role === 'string') return role
      if (role && typeof role === 'object') {
        return String(role?.role || role?.name || role?.roleName || '')
      }
      return ''
    }

    const mapped = arr
      .map((u: any) => ({
        id: String(u?.id ?? u?._id ?? u?.user_id ?? u?.userId ?? '').trim(),
        label: String(u?.name || u?.username || u?.email || 'User'),
        role: resolveRole(u).toUpperCase().replace(/[-\s]+/g, '_'),
      }))
      .filter((u: { id: string }) => u.id)

    return mapped.filter((u: { role: string }) => u.role === 'CLIENT')
  }, [usersData])

  const fancyOptions = useMemo(() => {
    let source: any[] = []
    if (bookmakerFancyData?.success && Array.isArray(bookmakerFancyData.data)) {
      source = bookmakerFancyData.data
    } else if (Array.isArray(bookmakerFancyData)) {
      source = bookmakerFancyData
    }

    const rows: Array<{
      key: string
      marketId: string
      market_name: string
      selection_id: number
      bet_name: string
      market_type: 'fancy'
      gtype: 'fancy'
    }> = []

    source.forEach((m: any) => {
      const gtype = String(m?.gtype || '').toLowerCase()
      if (!['fancy', 'fancy1', 'fancy2'].includes(gtype)) return
      const marketId = String(m?.mid ?? m?.marketId ?? m?.market_id ?? '').trim()
      const market_name = String(m?.mname || m?.market_name || '').trim()
      const sections = Array.isArray(m?.section) ? m.section : []
      sections.forEach((s: any, idx: number) => {
        const selection_id = Number(s?.sid ?? s?.selectionId ?? s?.selection_id)
        const bet_name = String(s?.nat || s?.runnerName || s?.name || `Runner ${idx + 1}`).trim()
        if (!marketId || !market_name || !Number.isFinite(selection_id) || !bet_name) return
        rows.push({
          key: `${marketId}-${selection_id}-${idx}`,
          marketId,
          market_name,
          selection_id,
          bet_name,
          market_type: 'fancy',
          gtype: 'fancy',
        })
      })
    })
    return rows
  }, [bookmakerFancyData])

  const selectedFancy = useMemo(() => fancyOptions.find((f) => f.key === fancyKey), [fancyOptions, fancyKey])
  const canSubmit = Boolean(
    userId && matchId && eventId && selectedFancy && betType && betRate.trim() && betvalue.trim() && winAmount.trim() && lossAmount.trim()
  )

  if (!isOpen) return null

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    if (!selectedFancy) return
    const payload = {
      bet_name: selectedFancy.bet_name,
      bet_rate: Number(betRate),
      bet_type: betType,
      betvalue: Number(betvalue),
      eventId,
      gtype: 'fancy',
      loss_amount: Number(lossAmount),
      marketId: selectedFancy.marketId,
      market_name: selectedFancy.market_name,
      market_type: 'fancy',
      match_id: matchId,
      selection_id: selectedFancy.selection_id,
      user_id: userId,
      win_amount: Number(winAmount),
    }
    try {
      await placeBet(payload).unwrap()
      setMessage({ type: 'success', text: 'Custom bet placed successfully.' })
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.data?.error || err?.data?.message || err?.message || 'Failed to place custom bet.',
      })
    }
  }

  const fieldClass =
    'w-full min-h-[44px] sm:min-h-0 border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-sm touch-manipulation'

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-3 bg-black/50">
      <div
        className="w-full sm:max-w-xl max-h-[100dvh] sm:max-h-[min(90dvh,720px)] flex flex-col bg-white shadow-xl border border-gray-200 border-b-0 sm:border-b rounded-t-2xl sm:rounded-lg overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-bet-modal-title"
      >
        <div className="shrink-0 px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2 bg-white">
          <h3 id="custom-bet-modal-title" className="text-base sm:text-lg font-bold text-gray-900 truncate pr-2">
            Place Custom Bet
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center text-gray-500 hover:text-gray-700 text-2xl sm:text-xl font-bold leading-none rounded-lg hover:bg-gray-100 touch-manipulation"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">User</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} className={fieldClass}>
                <option value="">{isUsersLoading ? 'Loading users...' : 'Select user'}</option>
                {clientUsers.map((u: { id: string; label: string }) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Match</label>
              <select value={matchId} disabled className={`${fieldClass} bg-gray-100`}>
                <option value={matchId}>{matchName || matchId}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Fancy</label>
              <select
                value={fancyKey}
                onChange={(e) => setFancyKey(e.target.value)}
                disabled={!eventId || isFancyLoading}
                className={`${fieldClass} disabled:bg-gray-100`}
              >
                <option value="">{isFancyLoading ? 'Loading fancy...' : 'Select fancy'}</option>
                {fancyOptions.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.market_name} - {f.bet_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bet Type</label>
                <select
                  value={betType}
                  onChange={(e) => setBetType(e.target.value as 'BACK' | 'LAY')}
                  className={fieldClass}
                >
                  <option value="BACK">BACK</option>
                  <option value="LAY">LAY</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bet Rate</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={betRate}
                  onChange={(e) => setBetRate(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Stake</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={betvalue}
                  onChange={(e) => setBetvalue(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Win Amount</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={winAmount}
                  onChange={(e) => setWinAmount(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Loss Amount</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={lossAmount}
                  onChange={(e) => setLossAmount(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            {message && (
              <p className={`text-sm font-bold ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-sm font-bold text-white bg-gray-500 rounded-lg hover:bg-gray-600 touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isPlacingBet}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-sm font-bold text-white bg-[#00A66E] rounded-lg hover:bg-[#008f5f] disabled:opacity-50 touch-manipulation"
            >
              {isPlacingBet ? 'Placing...' : 'Place Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

