"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCricketMatches, isMatchLive } from "@/app/hooks/useCricketMatches"
import { useCricketLiveUpdates } from "@/app/hooks/useWebSocket"
import ConnectionIndicator from "@/components/utils/ConnectionIndicator"
import { Trophy, RefreshCw, Wifi, Clock, Users, Tv, Radio } from "lucide-react"
import { CricketMatch } from "@/lib/types/cricket"
import Image from "next/image"

export default function CricketTab() {
  const [useLiveUpdates, setUseLiveUpdates] = useState(true)
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined) // Show all matches (live + upcoming)
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10) // Show 10 matches per page
  const router = useRouter()
  
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
  
  // Fetch cricket matches from API - only on client
  const { 
    matches: apiMatches,
    loading: isLoading, 
    error, 
    refetch,
    totalItems,
    totalPages
  } = useCricketMatches({
    page: currentPage,
    per_page: perPage,
    status: statusFilter
  })

  // Use live matches if available and connected, otherwise use API data
  const matches = (isConnected && liveMatches.length > 0) ? liveMatches : apiMatches

  // Group into Live and Upcoming using same logic as /live page
  const liveMatchesList = matches.filter((m: any) => {
    const statusText = (m?.status_str || m?.state || m?.match_status || '')
      .toString()
      .toLowerCase()

    const liveByNumeric = typeof m?.status === 'number' && isMatchLive(m.status)
    const isLive = liveByNumeric || (
      statusText.includes('live') ||
      m?.game_state === 3 ||
      m?.match_status === 'live'
    )
    return isLive
  })

  const upcomingMatchesList = matches.filter((m: any) => {
    const statusText = (m?.status_str || m?.state || m?.match_status || '')
      .toString()
      .toLowerCase()

    const liveByNumeric = typeof m?.status === 'number' && isMatchLive(m.status)
    const isLive = liveByNumeric || (
      statusText.includes('live') ||
      m?.game_state === 3 ||
      m?.match_status === 'live'
    )

    const isUpcomingHeuristic = (
      statusText.includes('upcoming') ||
      statusText.includes('scheduled') ||
      statusText.includes('fixture') ||
      statusText.includes('not started') ||
      statusText === 'ns' ||
      m?.match_status === 'upcoming' ||
      m?.game_state === 1
    )

    const completedKeywords = ['completed', 'finished', 'result']
    const isCompleted = completedKeywords.some(k => statusText.includes(k))

    if (liveByNumeric === false) {
      return !isCompleted
    }

    return !isLive && isUpcomingHeuristic
  })

  // Exclude completed/cancelled
  const filteredMatches = [...liveMatchesList, ...upcomingMatchesList]
console.log("filteredMatches",filteredMatches)
  // Counts for header badge
  const liveCount = liveMatchesList.length
  const upcomingCount = upcomingMatchesList.length
 
  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  const handleRefresh = () => {
    refetch()
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
      {/* Fancy Header Section */}
      <div className="relative w-full h-[500px]">
  <Image
    src="https://e0.365dm.com/22/07/2048x1152/skysports-england-sri-lanka_5850215.jpg?20220730194242"
    alt="Cricket Header"
    fill
    className="object-cover"
  />
</div>


      {/* Sport Header */}
      <div className="bg-[#00A66E] text-white px-4 py-1 font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[0.75rem]">Cricket</span>
          {/* Live Count with Signal Icon */}
          {liveCount > 0 && (
            <button 
              onClick={() => router.push('/live?sport=cricket')}
              className="flex items-center gap-1 bg-red-500 hover:bg-red-600 px-2 py-1 rounded-full text-xs font-bold transition-colors"
            >
              <Radio className="w-3 h-3" />
              <span>{liveCount}</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Live Updates Toggle */}
          <button 
            onClick={toggleLiveUpdates}
            className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
              useLiveUpdates 
                ? 'bg-white/20 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
            title={useLiveUpdates ? "Disable live updates" : "Enable live updates"}
          >
            <Wifi className="w-3 h-3" />
            <span className="text-xs hidden sm:inline">Live</span>
          </button>
          
          {/* Connection Status */}
          <ConnectionIndicator 
            isConnected={isConnected}
            isConnecting={isConnecting}
            error={wsError}
            lastUpdate={lastUpdate}
            className="text-white"
          />
          
          <button 
            onClick={handleRefresh}
            className="hover:bg-white/20 p-1 rounded"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>


      {/* Matches List - Split Layout: Table Left, Details Right */}
        {filteredMatches.length === 0 ? (
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
              {/* <div className="text-xs font-semibold text-gray-700">Match Details</div> */}
              {/* <div className="text-xs font-semibold text-gray-700 text-center"></div> */}
              {/* <div className="text-xs font-semibold text-gray-700 text-center">BM</div>
              <div className="text-xs font-semibold text-gray-700 text-center">F</div>
              <div className="text-xs font-semibold text-gray-700 text-center">Team 1</div>
              <div className="text-xs font-semibold text-gray-700 text-center">Team 2</div>
              <div className="text-xs font-semibold text-gray-700 text-center">Over</div>
              <div className="text-xs font-semibold text-gray-700 text-center">Under</div>
              <div className="text-xs font-semibold text-gray-700 text-center">Total 1</div>
              <div className="text-xs font-semibold text-gray-700 text-center">Total 2</div>
            </div> */}

            {filteredMatches.map((match: any, index: number) => {
              // Extract odds data
              const odds = match?.live_odds || match?.odds || {}
              const matchOdds = odds?.matchodds || {}
              const team1Odds = matchOdds?.team_a_odds || matchOdds?.team1 || '-'
              const team2Odds = matchOdds?.team_b_odds || matchOdds?.team2 || '-'
              const overOdds = odds?.over || '-'
              const underOdds = odds?.under || '-'
              const total1Odds = match?.total1 || '-'
              const total2Odds = match?.total2 || '-'

              // Check if match is live
              const statusText = (match?.status_str || match?.state || match?.match_status || '')
                .toString()
                .toLowerCase()
              const liveByNumeric = typeof match?.status === 'number' && isMatchLive(match.status)
              const isLive = liveByNumeric || (
                statusText.includes('live') ||
                match?.game_state === 3 ||
                match?.match_status === 'live'
              )

              const handleMatchClick = () => {
                if (isLive) {
                  const matchId = match.match_id ?? match.id
                  if (matchId) {
                    router.push(`/live/${matchId}`)
                  }
                }
              }

              return (
                <div 
                  key={match.match_id ?? match.id ?? index} 
                  onClick={handleMatchClick}
                  className={`grid grid-cols-[minmax(220px,1fr)_28px_34px_34px_80px_80px_80px_80px_80px_80px] gap-2 px-2 py-2 hover:bg-gray-50 items-center ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  } ${isLive ? 'cursor-pointer' : ''}`}
                >
                  {/* Match Details (left) with TV + time + teams */}
                  <div className="flex flex-col gap-1 text-xs sm:text-sm pr-4">
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="font-semibold">{formatMatchDateLabel(match.date_start_ist || match.date_start)}</span>
                      <span className="text-gray-300">|</span>
                      {(match.status === 3 || match.status === 5 || match.status_str?.toLowerCase?.() === 'live') && (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-red-600 font-medium">Live Now</span>
                        </>
                      )}
                      {match.status === 1 && (
                        <span className="text-blue-600 font-medium">Upcoming</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{match.teama?.short_name || match.teama?.name}</span>
                      {(match.teama?.scores) && <span className="text-gray-600">{match.teama.scores}</span>}
                      <span className="text-gray-400">vs</span>
                      <span className="font-medium truncate">{match.teamb?.short_name || match.teamb?.name}</span>
                      {(match.teamb?.scores) && <span className="text-gray-600">{match.teamb.scores}</span>}
                    </div>
                    {/* Summary line */}
                    {/* <div className="text-[11px] text-gray-600 leading-tight truncate"> */}
                      {/* {(match.status_note || match.live || match.game_state_str || match.subtitle) && (
                        <span className="mr-2">{match.status_note || match.live || match.game_state_str || match.subtitle}</span>
                      )} */}
                      {/* {(match.competition?.abbr || match.competition?.title || match.format_str) && (
                        <span className="text-gray-500">{match.competition?.abbr || match.competition?.title || match.format_str}</span>
                      )} */}
                    {/* </div> */}
                  </div>

                  {/* TV icon column next to fancy */}
                  <div className="flex items-center justify-center">
                    {match.commentary === 1 ? (
                      <Tv className="w-5 h-5 text-black" />
                    ) : (
                      <div className="w-5 h-5" />
                    )}
                  </div>

                  {/* BM Button */}
                  <div className="flex items-center justify-center">
                    {match.session_odds_available ? (
                      <span className="w-7 h-7 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center text-[10px] font-bold">
                        BM
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-full" />
                    )}
                  </div>

                  {/* F Button */}
                  <div className="flex items-center justify-center">
                    <span className="w-7 h-7 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center text-[10px] font-bold">
                      F
                    </span>
                  </div>

                  {/* Fancy/Odds (right) */}
                  <div className={`w-full h-7 flex items-center justify-center text-xs font-medium ${index % 2 === 0 ? 'bg-pink-100' : 'bg-blue-100'}`}>
                    {team1Odds !== '-' ? team1Odds : '-'}
                  </div>
                  <div className={`w-full h-7 flex items-center justify-center text-xs font-medium ${index % 2 === 0 ? 'bg-blue-100' : 'bg-pink-100'}`}>
                    {team2Odds !== '-' ? team2Odds : '-'}
                  </div>
                  <div className={`w-full h-7 flex items-center justify-center text-xs font-medium ${index % 2 === 0 ? 'bg-pink-100' : 'bg-blue-100'}`}>
                    {overOdds !== '-' ? overOdds : '-'}
                  </div>
                  <div className={`w-full h-7 flex items-center justify-center text-xs font-medium ${index % 2 === 0 ? 'bg-blue-100' : 'bg-pink-100'}`}>
                    {underOdds !== '-' ? underOdds : '-'}
                  </div>
                  <div className={`w-full h-7 flex items-center justify-center text-xs font-medium ${index % 2 === 0 ? 'bg-pink-100' : 'bg-blue-100'}`}>
                    {total1Odds !== '-' ? total1Odds : '-'}
                  </div>
                  <div className={`w-full h-7 flex items-center justify-center text-xs font-medium ${index % 2 === 0 ? 'bg-blue-100' : 'bg-pink-100'}`}>
                    {total2Odds !== '-' ? total2Odds : '-'}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      {/* Match Count */}
      {filteredMatches.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Showing {filteredMatches.length} cricket matches ({liveCount} live, {upcomingCount} upcoming)
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>
                
                <span className="text-xs sm:text-sm text-gray-600 px-2">
                  {currentPage}/{totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


