"use client"

import React, { memo, useCallback, useMemo } from "react"
import { SportsSectionOptimized } from "@/components/sports"
import { getMatchesBySport } from "@/lib/data/mockMatches"
import InPlayTab from "@/components/dashboard-tabs/InPlayTab"
import CricketTab from "@/components/dashboard-tabs/CricketTab"
import SoccerTab from "@/components/dashboard-tabs/SoccerTab"
import TennisTab from "@/components/dashboard-tabs/TennisTab"
import HorseTab from "@/components/dashboard-tabs/HorseTab"
import GreyhoundTab from "@/components/dashboard-tabs/GreyhoundTab"
import { useCricketMatches } from "@/app/hooks/useCricketMatches"

interface DashboardContentProps {
  tab: string
}

// Memoized home content component
const HomeContent = memo(({ 
  onPinMatch, 
  onBookmarkMatch, 
  onFantasyMatch 
}: { 
  onPinMatch?: (matchId: string) => void
  onBookmarkMatch?: (matchId: string) => void
  onFantasyMatch?: (matchId: string) => void
}) => {
  const { matches: cricketMatches, loading: cricketLoading } = useCricketMatches()
  
  // Memoized matches data to prevent unnecessary recalculations
  const matches = useMemo(() => {
    return {
      cricket: cricketLoading ? [] : (cricketMatches as any[]),
      soccer: getMatchesBySport("soccer"),
      tennis: getMatchesBySport("tennis"),
      horse: getMatchesBySport("horse"),
      greyhound: getMatchesBySport("greyhound")
    }
  }, [cricketMatches, cricketLoading])
  
  // Memoized sport sections
  const sportSections = useMemo(() => {
    return Object.entries(matches).map(([sport, sportMatches]) => (
      <SportsSectionOptimized
        key={sport}
        sport={sport.charAt(0).toUpperCase() + sport.slice(1)}
        matches={sportMatches as any[]}
        showViewMore={true}
        onPinMatch={onPinMatch}
        onBookmarkMatch={onBookmarkMatch}
        onFantasyMatch={onFantasyMatch}
      />
    ))
  }, [matches, onPinMatch, onBookmarkMatch, onFantasyMatch])

  return (
    <div className="space-y-6">
      {sportSections}
    </div>
  )
})

HomeContent.displayName = 'HomeContent'

// Memoized gaming section component
const GamingSection = memo(({ tab }: { tab: string }) => (
  <section className="bg-white rounded-md shadow-sm border border-gray-200">
    <div className="bg-[#00A66E] text-white font-bold px-4 py-3 rounded-t-md">{tab}</div>
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{tab} Games</h2>
      <p className="text-gray-600">Gaming content for {tab} will be implemented here.</p>
    </div>
  </section>
))

GamingSection.displayName = 'GamingSection'

// Memoized sport section component
const SportSection = memo(({ 
  tab, 
  onPinMatch, 
  onBookmarkMatch, 
  onFantasyMatch 
}: { 
  tab: string
  onPinMatch?: (matchId: string) => void
  onBookmarkMatch?: (matchId: string) => void
  onFantasyMatch?: (matchId: string) => void
}) => {
  // Memoized matches for specific sport
  const matches = useMemo(() => {
    return getMatchesBySport(tab) as any[]
  }, [tab])

  return (
    <div>
      <SportsSectionOptimized
        sport={tab}
        matches={matches}
        showViewMore={true}
        onPinMatch={onPinMatch}
        onBookmarkMatch={onBookmarkMatch}
        onFantasyMatch={onFantasyMatch}
      />
    </div>
  )
})

SportSection.displayName = 'SportSection'

const DashboardContentOptimized = memo(({ tab }: DashboardContentProps) => {
  // Memoized action handlers
  const handlePinMatch = useCallback((matchId: string) => {
    console.log('Pin match:', matchId)
    // Implement pin logic here
  }, [])
  
  const handleBookmarkMatch = useCallback((matchId: string) => {
    console.log('Bookmark match:', matchId)
    // Implement bookmark logic here
  }, [])
  
  const handleFantasyMatch = useCallback((matchId: string) => {
    console.log('Fantasy match:', matchId)
    // Implement fantasy logic here
  }, [])

  // Memoized content based on tab
  const content = useMemo(() => {
    switch (tab) {
      case "Home":
        return (
          <HomeContent 
            onPinMatch={handlePinMatch}
            onBookmarkMatch={handleBookmarkMatch}
            onFantasyMatch={handleFantasyMatch}
          />
        )
      case "In-Play":
        return <InPlayTab />
      case "Cricket":
        return <CricketTab />
      case "Soccer":
        return <SoccerTab />
      case "Tennis":
        return <TennisTab />
      case "Horse":
        return <HorseTab />
      case "Greyhound":
        return <GreyhoundTab />
      default:
        if (["Lobby", "Aviator", "Indian Poker", "Casino", "Evolution"].includes(tab)) {
          return <GamingSection tab={tab} />
        }
        return (
          <SportSection 
            tab={tab}
            onPinMatch={handlePinMatch}
            onBookmarkMatch={handleBookmarkMatch}
            onFantasyMatch={handleFantasyMatch}
          />
        )
    }
  }, [tab, handlePinMatch, handleBookmarkMatch, handleFantasyMatch])

  return <>{content}</>
})

DashboardContentOptimized.displayName = 'DashboardContentOptimized'

export default DashboardContentOptimized
