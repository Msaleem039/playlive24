"use client"
import { useMemo, useState } from "react"
import { Radio } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import DashboardTopBar from "./dashboard-top-bar"
import { useCricketLiveUpdates } from "@/app/hooks/useWebSocket"
import { useCricketMatches } from "@/app/hooks/useCricketMatches"
import { useGetNewsBarQuery } from "@/app/services/Api"

type DashboardHeaderProps = {
  selectedTab: string
  onSelectTab: (tab: string) => void
}

const TABS = [
  { name: "Home", hasLiveCount: false, liveCount: 0 },
  { name: "In-Play", hasLiveCount: false, liveCount: 0 },
  { name: "Cricket", hasLiveCount: true, liveCount: 0 }, // Has WebSocket connection
  { name: "Soccer", hasLiveCount: false, liveCount: 0 }, // No WebSocket yet
  { name: "Tennis", hasLiveCount: false, liveCount: 0 }, // No WebSocket yet
  { name: "Horse", hasLiveCount: false, liveCount: 0 },
  { name: "Greyhound", hasLiveCount: false, liveCount: 0 },
  { name: "Lobby", hasLiveCount: false, liveCount: 0 },
  { name: "Aviator", hasLiveCount: false, liveCount: 0 },
  { name: "Indian Poker", hasLiveCount: false, liveCount: 0 },
  { name: "Casino", hasLiveCount: false, liveCount: 0 },
  { name: "Evolution", hasLiveCount: false, liveCount: 0 },
]

export default function DashboardHeader({ selectedTab, onSelectTab }: DashboardHeaderProps) {
  const active = useMemo(() => selectedTab, [selectedTab])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // WebSocket for live cricket updates
  const {
    isConnected,
    liveMatches: liveCricketMatches,
  } = useCricketLiveUpdates({
    url: process.env.NEXT_PUBLIC_SOCKET_URL
      ? `${process.env.NEXT_PUBLIC_SOCKET_URL}/entitysport`
      : 'http://localhost:3000/entitysport',
    autoConnect: true,
    realtimeEvent: 'entitySportRealtimeData',
    listEvent: 'entitySportLiveData',
  })
  
  // Fetch cricket matches from API as fallback
  const { matches: cricketMatches } = useCricketMatches({
    page: 1,
    per_page: 20,
  })

  // Fetch news bar text
  const { data: newsBarData } = useGetNewsBarQuery({}, {
    pollingInterval: 60000 // Poll every minute
  })
  
  const newsBarText = newsBarData?.text || "Welcome to Playlive24 enjoy icc cricket world cup 2026"

  // Use live matches if available and connected, otherwise use API data
  const currentCricketMatches = (isConnected && liveCricketMatches.length > 0) 
    ? liveCricketMatches 
    : cricketMatches

  // Calculate live cricket matches count using iplay field
  const cricketLiveCount = useMemo(() => {
    const liveMatches = currentCricketMatches.filter((match: any) => {
      // Use iplay field directly from API response
      if (typeof match?.iplay === 'boolean') {
        return match.iplay === true
      }
      // Fallback to legacy logic if iplay not available
      const statusText = (match?.status_str || match?.state || match?.match_status || '')
        .toString()
        .toLowerCase()
      return (
        statusText.includes('live') ||
        match?.status === 3 ||
        match?.game_state === 3 ||
        match?.match_status === 'live'
      )
    })
    return liveMatches.length
  }, [currentCricketMatches])
  
  // Calculate live counts for each sport based on actual WebSocket data
  const tabsWithLiveCounts = useMemo(() => {
    return TABS.map(tab => {
      if (tab.name === "Cricket") {
        return { ...tab, liveCount: cricketLiveCount }
      }
      // Only show live counts for sports that have actual WebSocket data
      // Other sports will show 0 until their WebSocket connections are implemented
      return { ...tab, liveCount: 0 }
    })
  }, [cricketLiveCount])
  return (
    <div className="sticky top-0 z-50">
      {/* Top bar */}
      <DashboardTopBar onSidebarOpen={() => setIsSidebarOpen(true)} />
      {/* Marquee */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black text-emerald-400 py-1.5 sm:py-2 overflow-hidden relative">
        <div className="flex">
          {/* Duplicate content for seamless loop */}
          <div className="animate-marquee text-[0.65rem] sm:text-[0.70rem] md:text-[0.75rem] text-emerald-400 font-semibold whitespace-nowrap flex-shrink-0">
            {newsBarText}
          </div>
          <div className="animate-marquee text-[0.65rem] sm:text-[0.70rem] md:text-[0.75rem] text-emerald-400 font-semibold whitespace-nowrap flex-shrink-0 ml-8" aria-hidden="true">
            {newsBarText}
          </div>
        </div>
        {/* Gradient fade effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black via-transparent to-black z-10"></div>
      </div>
      {/* Nav bar */}
      <div className="bg-[#00A66E]">
        <nav className="w-full px-2 sm:px-6 lg:px-6 overflow-x-auto">
          <ul className="flex items-center h-10 gap-4 sm:gap-6 whitespace-nowrap py-1 no-scrollbar">
            {tabsWithLiveCounts.map((tab) => (
              <li key={tab.name} className="shrink-0 relative group">
                <button
                  onClick={() => onSelectTab(tab.name)}
                  className={`uppercase font-bold text-[0.68rem] px-3 py-2 rounded transition-colors ${
                    active === tab.name ? "text-black" : "text-black/80 hover:text-white"
                  }`}
                >
                  {tab.name}
                </button>
                
                {/* Live Count Badge with Signal Icon */}
                {tab.hasLiveCount && tab.liveCount > 0 && (
                  <div className="absolute -top-1 -right-1 flex items-center gap-1">
                    <div className="w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border border-white font-bold">
                      {tab.liveCount}
                    </div>
                    <Radio className="w-3 h-3 text-red-500" />
                  </div>
                )}
                
                {/* Hover line indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedTab={selectedTab}
        onSelectTab={onSelectTab}
      />
    </div>
  )
}


