"use client"

import { useState, useEffect } from "react"
import { SportsSection } from "@/components/sports"
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

export default function DashboardContent({ tab }: DashboardContentProps) {
  const [mounted, setMounted] = useState(false)
  
  // Fetch cricket matches from API - only on client
  const { matches: cricketMatches, loading: cricketLoading, error: cricketError } = useCricketMatches({
    page: 1,
    per_page: 10,
    status: 1 // Live matches
  })
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Get matches for the selected sport
  const getMatchesForTab = (selectedTab: string) => {
    if (selectedTab === "Home") {
      // Show all sports on home page
      return {
        cricket: (mounted && !cricketLoading) ? cricketMatches : [], // Use real API data for cricket only when mounted
        soccer: getMatchesBySport("soccer"),
        tennis: getMatchesBySport("tennis"),
        horse: getMatchesBySport("horse"),
        greyhound: getMatchesBySport("greyhound")
      }
    } else {
      return { [selectedTab.toLowerCase()]: getMatchesBySport(selectedTab) }
    }
  }

  const matches = getMatchesForTab(tab) as Record<string, any[]>

  return (
    <>
      {tab === "Home" ? (
        <div className="space-y-6">
          {/* Show all sports sections */}
          {Object.entries(matches).map(([sport, sportMatches]) => (
            <SportsSection
              key={sport}
              sport={sport.charAt(0).toUpperCase() + sport.slice(1)}
              matches={sportMatches}
              showViewMore={true}
            />
          ))}
        </div>
      ) : tab === "In-Play" ? (
        <InPlayTab />
      ) : tab === "Cricket" ? (
        <CricketTab />
      ) : tab === "Soccer" ? (
        <SoccerTab />
      ) : tab === "Tennis" ? (
        <TennisTab />
      ) : tab === "Horse" ? (
        <HorseTab />
      ) : tab === "Greyhound" ? (
        <GreyhoundTab />
      ) : (
        <div>
          {/* Show specific sport */}
          <SportsSection
            sport={tab}
            matches={matches[tab.toLowerCase()] || []}
            showViewMore={true}
          />
        </div>
      )}

      {/* Gaming sections for non-sports tabs */}
      {["Lobby", "Aviator", "Indian Poker", "Casino", "Evolution"].includes(tab) && (
        <section className="bg-white rounded-md shadow-sm border border-gray-200">
          <div className="bg-[#00A66E] text-white font-bold px-4 py-3 rounded-t-md">{tab}</div>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{tab} Games</h2>
            <p className="text-gray-600">Gaming content for {tab} will be implemented here.</p>
          </div>
        </section>
      )}
    </>
  )
}

