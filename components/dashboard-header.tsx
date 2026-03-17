"use client"
import { useMemo, useState } from "react"
import { Radio } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import DashboardTopBar from "./dashboard-top-bar"
import ComplaintModal from "./modal/ComplaintModal"
import { useCricketLiveUpdates } from "@/app/hooks/useWebSocket"
import { useCricketMatches } from "@/app/hooks/useCricketMatches"
import { useGetNewsBarQuery } from "@/app/services/Api"

type DashboardHeaderProps = {
  selectedTab: string
  onSelectTab: (tab: string) => void
}

// Simple wrapper to use the native <marquee> tag without TypeScript errors
const Marquee: any = 'marquee'

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
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false)
  
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
      {/* Marquee + Complain button */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-y border-gray-700/30">
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
        
        {/* Gradient fade overlays for smooth edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-900 via-gray-900/80 to-transparent z-10 pointer-events-none"></div>

        <div className="relative flex items-center justify-between py-1 sm:py-1 px-2 sm:px-4">
          <div className="flex-1 overflow-hidden">
            <Marquee className="whitespace-nowrap">
              <span className="px-8 text-[0.7rem] sm:text-[0.70rem] md:text-[0.8rem] font-semibold tracking-wide text-white">
                {newsBarText}
              </span>
            </Marquee>
          </div>
          <button
            type="button"
            onClick={() => setIsComplaintModalOpen(true)}
            className="ml-3 px-3 sm:px-2 py-1 rounded-full border border-red-400 bg-red-500/90 hover:bg-red-600 text-[0.65rem] sm:text-xs font-semibold tracking-wide text-white whitespace-nowrap shadow-sm"
          >
            COMPLAIN
          </button>
        </div>
      </div>
      {/* Nav bar */}
      <div className="bg-[#00A66E]">
        <nav className="w-full px-2 sm:px-6 lg:px-6 overflow-x-auto">
          <ul className="flex items-center h-10 gap-4 sm:gap-6 whitespace-nowrap py-1 no-scrollbar">
            {tabsWithLiveCounts.map((tab) => {
              const isActive = active === tab.name
              return (
                <li key={tab.name} className="shrink-0 relative group">
                  <button
                    onClick={() => onSelectTab(tab.name)}
                    className={`uppercase font-bold text-[0.68rem] px-3 py-2 rounded transition-colors ${
                      isActive
                        ? "bg-white/25 text-white shadow-sm border-b-2 border-white"
                        : "text-white/90 hover:text-white hover:bg-white/15"
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
                  
                  {/* Hover line indicator - only when not active */}
                  {!isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Complaint modal */}
      <ComplaintModal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
      />

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


