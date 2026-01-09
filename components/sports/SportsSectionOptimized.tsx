"use client"

import React, { memo, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import MatchCardOptimized from "./MatchCardOptimized"
import { CricketMatch } from "@/lib/types/cricket"

interface SportsSectionProps {
  sport: string
  matches: CricketMatch[]
  showViewMore?: boolean
  onPinMatch?: (matchId: string) => void
  onBookmarkMatch?: (matchId: string) => void
  onFantasyMatch?: (matchId: string) => void
}

// Function to get sport-specific background color
const getSportHeaderColor = (sport: string): string => {
  const sportLower = sport.toLowerCase().trim()
  
  switch (sportLower) {
    case 'cricket':
      return 'bg-[#005461]' // Green for Cricket
    case 'soccer':
    case 'football':
      return 'bg-[#0066CC]' // Blue for Soccer
    case 'tennis':
      return 'bg-[#018790]' // Orange/Red for Tennis
    case 'horse':
    case 'horse racing':
      return 'bg-[#36656B]' // Saddle Brown for Horse Racing
    case 'greyhound':
    case 'greyhound racing':
      return 'bg-[#6B7280]' // Gray for Greyhound Racing
    case 'badminton':
      return 'bg-[#10B981]' // Emerald Green for Badminton
    case 'basketball':
      return 'bg-[#FF6B00]' // Orange for Basketball
    case 'baseball':
      return 'bg-[#1E40AF]' // Deep Blue for Baseball
    case 'hockey':
      return 'bg-[#059669]' // Teal Green for Hockey
    case 'rugby':
      return 'bg-[#DC2626]' // Red for Rugby
    case 'volleyball':
      return 'bg-[#EA580C]' // Orange Red for Volleyball
    case 'kabaddi':
      return 'bg-[#7C3AED]' // Purple for Kabaddi
    case 'cycling':
      return 'bg-[#0284C7]' // Sky Blue for Cycling
    case 'running':
      return 'bg-[#F59E0B]' // Amber for Running
    case 'boxing':
      return 'bg-[#991B1B]' // Dark Red for Boxing
    case 'mma':
    case 'ufc':
      return 'bg-[#1F2937]' // Dark Gray for MMA/UFC
    default:
      return 'bg-[#00A66E]' // Default green
  }
}

// Memoized header component
const SportsHeader = memo(({ sport }: { sport: string }) => {
  const headerColor = getSportHeaderColor(sport)
  
  return (
    <div className={`${headerColor} text-white px-4 py-1 rounded-t-lg`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-normal">{sport}</h3>
        <div className="hidden sm:flex items-center gap-2">
          <button className="bg-white/20 text-white text-xs px-2 py-1 rounded hover:bg-white/30 transition-colors">
            BM
          </button>
          <button className="bg-white/20 text-white text-xs px-2 py-1 rounded hover:bg-white/30 transition-colors">
            F
          </button>
        </div>
      </div>
    </div>
  )
})

SportsHeader.displayName = 'SportsHeader'

// Memoized matches list component
const MatchesList = memo(({ 
  matches, 
  onPinMatch, 
  onBookmarkMatch, 
  onFantasyMatch 
}: { 
  matches: CricketMatch[]
  onPinMatch?: (matchId: string) => void
  onBookmarkMatch?: (matchId: string) => void
  onFantasyMatch?: (matchId: string) => void
}) => {
  if (matches.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No matches available
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {matches.map((match, index) => {
        const matchId = match?.match_id ? String(match.match_id) : `match-${index}`
        return (
          <MatchCardOptimized
            key={matchId}
            match={match}
            sport=""
            onPin={onPinMatch}
            onBookmark={onBookmarkMatch}
            onFantasy={onFantasyMatch}
          />
        )
      })}
    </div>
  )
})

MatchesList.displayName = 'MatchesList'

// Memoized view more button
const ViewMoreButton = memo(({ 
  showAll, 
  onToggle, 
  hasMore 
}: { 
  showAll: boolean
  onToggle: () => void
  hasMore: boolean
}) => {
  if (!hasMore) return null

  return (
    <div className="p-4 text-right">
      <button
        onClick={onToggle}
        className="text-[#00A66E] hover:text-[#008a5a] font-medium text-sm transition-colors"
      >
        {showAll ? "Show Less" : "View More..."}
      </button>
    </div>
  )
})

ViewMoreButton.displayName = 'ViewMoreButton'

const SportsSectionOptimized = memo(({ 
  sport, 
  matches, 
  showViewMore = true,
  onPinMatch,
  onBookmarkMatch,
  onFantasyMatch
}: SportsSectionProps) => {
  const [showAll, setShowAll] = React.useState(false)
  
  // Memoized display matches to prevent unnecessary recalculations
  // Sort: live matches (iplay === true) first, then upcoming (iplay === false)
  const displayMatches = useMemo(() => {
    const sorted = [...matches].sort((a, b) => {
      const aIsLive = typeof (a as any)?.iplay === 'boolean' ? (a as any).iplay === true : false
      const bIsLive = typeof (b as any)?.iplay === 'boolean' ? (b as any).iplay === true : false
      if (aIsLive && !bIsLive) return -1 // a is live, b is not - a comes first
      if (!aIsLive && bIsLive) return 1  // b is live, a is not - b comes first
      return 0 // Both same status, maintain order
    })
    return showAll ? sorted : sorted.slice(0, 5)
  }, [matches, showAll])
  
  // Memoized hasMore calculation
  const hasMore = useMemo(() => {
    return matches.length > 5
  }, [matches.length])
  
  // Memoized toggle handler
  const handleToggle = useCallback(() => {
    setShowAll(prev => !prev)
  }, [])
  
  // Memoized action handlers
  const handlePinMatch = useCallback((matchId: string) => {
    onPinMatch?.(matchId)
  }, [onPinMatch])
  
  const handleBookmarkMatch = useCallback((matchId: string) => {
    onBookmarkMatch?.(matchId)
  }, [onBookmarkMatch])
  
  const handleFantasyMatch = useCallback((matchId: string) => {
    onFantasyMatch?.(matchId)
  }, [onFantasyMatch])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
    >
      <SportsHeader sport={sport} />
      
      <MatchesList 
        matches={displayMatches}
        onPinMatch={handlePinMatch}
        onBookmarkMatch={handleBookmarkMatch}
        onFantasyMatch={handleFantasyMatch}
      />
      
      {showViewMore && (
        <ViewMoreButton 
          showAll={showAll}
          onToggle={handleToggle}
          hasMore={hasMore}
        />
      )}
    </motion.div>
  )
})

SportsSectionOptimized.displayName = 'SportsSectionOptimized'

export default SportsSectionOptimized



















