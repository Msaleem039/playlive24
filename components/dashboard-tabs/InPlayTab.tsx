"use client"

import { useState, useEffect, memo, useCallback, useMemo } from "react"
import { Play, Gamepad2, Trophy, Target, Zap, Tv, Pin, Radio } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCricketMatches } from "@/app/hooks/useCricketMatches"
import { useCricketLiveUpdates } from "@/app/hooks/useWebSocket"
import { useFormattedDateTime } from "@/lib/utils/dateFormatter"
import { CricketMatch } from "@/lib/types/cricket"

interface LiveMatch {
  id: string
  sport: string
  date: string
  time: string
  teams: string
  status: "live" | "upcoming" | "finished"
  odds: {
    team1: string
    team2: string
    draw?: string
    over?: string
    under?: string
  }
  hasStream: boolean
  hasBookmaker: boolean
  hasFantasy: boolean
}

// const MOCK_LIVE_MATCHES: LiveMatch[] = [
//   {
//     id: "1",
//     sport: "cricket",
//     date: "23 Oct",
//     time: "08:30",
//     teams: "Australia v India",
//     status: "live",
//     odds: {
//       team1: "1.64",
//       team2: "1.66",
//       over: "2.5",
//       under: "2.58"
//     },
//     hasStream: true,
//     hasBookmaker: true,
//     hasFantasy: true
//   },
//   {
//     id: "2",
//     sport: "cricket",
//     date: "23 Oct",
//     time: "12:00",
//     teams: "New Zealand v England",
//     status: "live",
//     odds: {
//       team1: "-",
//       team2: "-",
//       over: "-",
//       under: "-"
//     },
//     hasStream: false,
//     hasBookmaker: false,
//     hasFantasy: false
//   },
//   {
//     id: "3",
//     sport: "cricket",
//     date: "23 Oct",
//     time: "15:30",
//     teams: "Bangladesh v West Indies",
//     status: "live",
//     odds: {
//       team1: "1.14",
//       team2: "1.15",
//       over: "7.6",
//       under: "8.2"
//     },
//     hasStream: true,
//     hasBookmaker: true,
//     hasFantasy: true
//   }
// ]

// Memoized sport category button with signal icons
const SportCategoryButton = memo(({ 
  category, 
  isSelected, 
  onClick 
}: { 
  category: {
    id: string
    name: string
    icon: any
    count: number
    color: string
    isLive: boolean
  }
  isSelected: boolean
  onClick: (id: string) => void
}) => {
  const IconComponent = category.icon
  
  const handleClick = useCallback(() => {
    onClick(category.id)
  }, [category.id, onClick])

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center gap-1 sm:gap-2 px-4 sm:px-10 min-w-0 shrink-0 group"
    >
      <div className="relative">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
          category.color === "purple" ? "bg-purple-500" :
          category.color === "gray" ? "bg-gray-500" :
          category.color === "red" ? "bg-red-500" :
          category.color === "black" ? "bg-black" :
          "bg-yellow-500"
        } text-white group-hover:scale-105 transition-transform ${
          isSelected ? 'ring-2 ring-[#00A66E] ring-offset-2' : ''
        }`}>
          <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        
        {/* Live count badge */}
        {category.isLive && (
          <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white font-bold">
            {category.count}
          </div>
        )}
        
        {/* Signal icon for live sports */}
        {category.isLive && (
          <div className="absolute -bottom-1 -left-1">
            <Radio className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 bg-white rounded-full p-0.5" />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-gray-700 text-center leading-tight">
          {category.name}
        </span>
        {/* Signal icon next to text for live sports */}
        {category.isLive && (
          <Radio className="w-2 h-2 sm:w-3 sm:h-3 text-green-500" />
        )}
      </div>
    </button>
  )
})

SportCategoryButton.displayName = 'SportCategoryButton'

// Memoized match row component
const MatchRow = memo(({ match }: { match: any }) => {
  const router = useRouter()
  const formattedDateTime = useFormattedDateTime(match.date_start)
  // Use iplay field to determine live status
  const isLive = typeof match?.iplay === 'boolean' 
    ? match.iplay === true 
    : ((match.status === 3 || match.status === 5) && match.oddstype === "betfair")
  const isUpcoming = typeof match?.iplay === 'boolean' 
    ? match.iplay === false 
    : match.status === 1
  
  // Check if match has valid ID for navigation (declare once, use in both places)
  const matchId = match.gmid ?? match.match_id ?? match.id
  const canNavigate = !!matchId
  
  const handleMatchClick = useCallback(() => {
    // Allow navigation for both live and upcoming matches
    if (matchId) {
      // Set flag to auto-open TV when navigating from main page (only for live matches)
      if (isLive && typeof window !== 'undefined') {
        sessionStorage.setItem('fromMainPage', 'true')
      }
      router.push(`/live/${matchId}`)
    }
  }, [isLive, matchId, router])

  return (
    <div 
      className={`p-4 hover:bg-gray-50 ${canNavigate ? 'cursor-pointer' : ''}`}
      onClick={canNavigate ? handleMatchClick : undefined}
    >
      <div className="flex items-center justify-between">
        {/* Match Details */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">
              {formattedDateTime}
            </span>
            {isLive && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600 font-medium">Live Now</span>
              </>
            )}
            {isUpcoming && (
              <span className="text-sm text-blue-600 font-medium">Upcoming</span>
            )}
            <span className="text-sm text-gray-600">{match.title}</span>
          </div>
          
          {/* Team Scores */}
          <div className="flex items-center gap-4 text-sm mb-2">
            <div className="flex items-center gap-2">
              {match.teama?.logo_url ? (
                <img 
                  src={match.teama.logo_url} 
                  alt={match.teama.name}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                  {match.teama?.short_name?.charAt(0) || 'T'}
                </div>
              )}
              <span className="font-medium">{match.teama?.short_name}</span>
              {match.teama?.scores && (
                <span className="text-gray-600 font-semibold">{match.teama.scores}</span>
              )}
            </div>
            <span className="text-gray-400 font-bold">vs</span>
            <div className="flex items-center gap-2">
              {match.teamb?.logo_url ? (
                <img 
                  src={match.teamb.logo_url} 
                  alt={match.teamb.name}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                  {match.teamb?.short_name?.charAt(0) || 'T'}
                </div>
              )}
              <span className="font-medium">{match.teamb?.short_name}</span>
              {match.teamb?.scores && (
                <span className="text-gray-600 font-semibold">{match.teamb.scores}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2 mr-4" onClick={(e) => e.stopPropagation()}>
          {match.commentary === 1 && (
            <Tv className="w-4 h-4 text-blue-500" />
          )}
          {match.session_odds_available && (
            <button 
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 bg-green-200 text-green-800 rounded-full flex items-center justify-center text-xs font-bold hover:bg-green-300 transition-colors"
            >
              BM
            </button>
          )}
          <button 
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 bg-green-200 text-green-800 rounded-full flex items-center justify-center text-xs font-bold hover:bg-green-300 transition-colors"
          >
            F
          </button>
        </div>

        {/* Match Info */}
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs text-gray-500">
            {match.format_str}
          </div>
          <div className="text-xs text-gray-500">
            ID: {match.gmid ?? match.match_id}
          </div>
        </div>

        {/* Pin Icon */}
        <button 
          onClick={(e) => e.stopPropagation()}
          className="ml-2"
        >
          <Pin className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    </div>
  )
})

MatchRow.displayName = 'MatchRow'

// Memoized sport section
const SportSection = memo(({ 
  title, 
  matches, 
  loading, 
  error 
}: { 
  title: string
  matches: any[]
  loading: boolean
  error: string | null
}) => {
  if (loading) {
    return (
      <div className="border-b border-gray-200">
        <div className="bg-[#00A66E] text-white px-4 py-1 text-[0.75rem] font-semibold">
          {title}
        </div>
        <div className="p-4 text-center text-gray-600">
          Loading {title.toLowerCase()} matches...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-b border-gray-200">
        <div className="bg-[#00A66E] text-white px-4 py-2 font-bold">
          {title}
        </div>
        <div className="p-4 text-center text-red-600">
          Error loading matches: {error}
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="border-b border-gray-200">
        <div className="bg-[#00A66E] text-white px-4 py-1 text-[0.75rem] font-semibold">
          {title}
        </div>
        <div className="p-4 text-center text-gray-600">
          No live {title.toLowerCase()} matches
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-gray-200">
      <div className="bg-[#00A66E] text-white px-4 py-2 text-[0.75rem] font-semibold">
        <span className="text-[0.75rem]">{title}</span>
      </div>
      <div className="divide-y divide-gray-200">
        {matches.map((match) => (
          <MatchRow key={match.match_id} match={match} />
        ))}
      </div>
    </div>
  )
})

SportSection.displayName = 'SportSection'

// Memoized loading component
const LoadingState = memo(() => (
  <div className="bg-white">
    <div className="bg-[#00A66E] text-white px-4 py-3 font-bold">
      In-Play
    </div>
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A66E] mx-auto mb-4"></div>
        <p className="text-gray-600">Loading In-Play matches...</p>
      </div>
    </div>
  </div>
))

LoadingState.displayName = 'LoadingState'

const InPlayTab = memo(() => {
  const [selectedCategory, setSelectedCategory] = useState("all-games")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  // WebSocket for live cricket updates
  const {
    isConnected,
    liveMatches: liveCricketMatches,
    lastUpdate
  } = useCricketLiveUpdates({
    url: 'ws://localhost:3000/entitysport',
    autoConnect: mounted
  })
  
  // Fetch live cricket matches from API as fallback
  const { matches: cricketMatches, loading: cricketLoading, error: cricketError } = useCricketMatches({
    page: 1,
    per_page: 20,
    status: 1 // Live matches only
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use live matches if available and connected, otherwise use API data
  const currentMatches = (isConnected && liveCricketMatches.length > 0) ? liveCricketMatches : cricketMatches
  
  // Calculate live counts for each sport using iplay field
  const liveCounts = useMemo(() => {
    // Filter for live matches using iplay field (iplay === true means live)
    const cricketLive = currentMatches.filter(match => 
      typeof match?.iplay === 'boolean' 
        ? match.iplay === true
        : ((match.status === 3 || match.status === 5) && match.oddstype === "betfair")
    ).length
    
    const soccerLive = 0 // Would come from soccer WebSocket
    const tennisLive = 0 // Would come from tennis WebSocket
    const allLive = cricketLive + soccerLive + tennisLive
    
    return {
      cricket: cricketLive,
      soccer: soccerLive,
      tennis: tennisLive,
      all: allLive
    }
  }, [currentMatches])

  const SPORT_CATEGORIES = [
    { id: "watch-live", name: "Watch Live", icon: Play, count: 0, color: "purple", isLive: false },
    { id: "all-games", name: "All Games", icon: Gamepad2, count: liveCounts.all, color: "gray", isLive: liveCounts.all > 0 },
    { id: "cricket", name: "Cricket", icon: Trophy, count: liveCounts.cricket, color: "red", isLive: liveCounts.cricket > 0 },
    { id: "soccer", name: "Soccer", icon: Target, count: liveCounts.soccer, color: "black", isLive: liveCounts.soccer > 0 },
    { id: "tennis", name: "Tennis", icon: Zap, count: liveCounts.tennis, color: "yellow", isLive: liveCounts.tennis > 0 },
  ]

  // Memoized category selection handler
  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId)
  }, [])

  // Memoized matches for current category - sorted with live matches first
  const matches = useMemo(() => {
    let filteredMatches: CricketMatch[] = []
    
    if (selectedCategory === "all-games" || selectedCategory === "cricket") {
      filteredMatches = currentMatches
    } else if (selectedCategory === "soccer") {
      filteredMatches = [] // Would come from soccer WebSocket
    } else if (selectedCategory === "tennis") {
      filteredMatches = [] // Would come from tennis WebSocket
    }
    
    // Filter and sort: use iplay field to determine live status
    const filtered = filteredMatches.filter(match => {
      // Use iplay field if available
      if (typeof match?.iplay === 'boolean') {
        return match.iplay === true || match.iplay === false // Include live and upcoming
      }
      // Fallback to legacy logic
      if (match.status === 2) return false // Exclude completed matches
      if (match.status === 4) return false // Exclude cancelled/abandoned matches
      if (match.status === 3 || match.status === 5) return match.oddstype === "betfair" // Only live matches with betfair odds
      if (match.status === 1) return true // Include upcoming matches (not started)
      return false
    })
    
    // Sort: live matches (iplay === true) first, then upcoming (iplay === false)
    return filtered.sort((a, b) => {
      const aIsLive = typeof a?.iplay === 'boolean' ? a.iplay === true : (a.status === 3 || a.status === 5)
      const bIsLive = typeof b?.iplay === 'boolean' ? b.iplay === true : (b.status === 3 || b.status === 5)
      if (aIsLive && !bIsLive) return -1 // a is live, b is not - a comes first
      if (!aIsLive && bIsLive) return 1  // b is live, a is not - b comes first
      return 0 // Both same status, maintain order
    })
  }, [selectedCategory, currentMatches])

  // Memoized sport categories with selection state
  const sportCategories = useMemo(() => {
    return SPORT_CATEGORIES.map(category => ({
      ...category,
      isSelected: selectedCategory === category.id
    }))
  }, [selectedCategory])

  if (!mounted) {
    return <LoadingState />
  }

  return (
    <div className="bg-white">
      {/* In-Play Header */}
      <div className="bg-[#00A66E] text-white px-4 py-1 font-semibold">
        <span className="text-[0.75rem]">In-Play</span>
      </div>

      {/* Sport Categories Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 sm:gap-6 px-2 sm:px-4 py-3 overflow-x-auto">
          {sportCategories.map((category) => (
            <SportCategoryButton
              key={category.id}
              category={category}
              isSelected={category.isSelected}
              onClick={handleCategorySelect}
            />
          ))}
        </div>
      </div>

      {/* Cricket Section */}
      {(selectedCategory === "all-games" || selectedCategory === "cricket") && (
        <SportSection
          title="Cricket"
          matches={matches}
          loading={cricketLoading}
          error={cricketError}
        />
      )}

      {/* Soccer Section */}
      {(selectedCategory === "all-games" || selectedCategory === "soccer") && (
        <SportSection
          title="Soccer"
          matches={[]}
          loading={false}
          error={null}
        />
      )}

      {/* Tennis Section */}
      {(selectedCategory === "all-games" || selectedCategory === "tennis") && (
        <SportSection
          title="Tennis"
          matches={[]}
          loading={false}
          error={null}
        />
      )}
    </div>
  )
})

InPlayTab.displayName = 'InPlayTab'

export default InPlayTab
