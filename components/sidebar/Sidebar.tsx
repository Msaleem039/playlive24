"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight, Play, Trophy, Users, Clock } from "lucide-react"
import { getCricketMatches, getSoccerMatches, getTennisMatches, getHorseRaces, type Match } from "@/lib/api/sports"

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
  selectedTab: string
  onSelectTab: (tab: string) => void
}

type LiveMatch = {
  id: string
  homeTeam: string
  awayTeam: string
  score: string
  time: string
  status: "live" | "upcoming"
}

type CricketMatch = {
  id: string
  homeTeam: string
  awayTeam: string
  score: string
  time: string
  status: "live" | "upcoming"
  series: string
}

// Mock data - replace with API calls
const liveMatches: LiveMatch[] = [
  { id: "1", homeTeam: "India", awayTeam: "Australia", score: "245/3", time: "45.2", status: "live" },
  { id: "2", homeTeam: "England", awayTeam: "Pakistan", score: "180/2", time: "38.1", status: "live" },
  { id: "3", homeTeam: "South Africa", awayTeam: "New Zealand", score: "0/0", time: "10:30", status: "upcoming" },
]

const cricketMatches: CricketMatch[] = [
  { id: "1", homeTeam: "India", awayTeam: "Australia", score: "245/3", time: "45.2", status: "live", series: "World Cup 2024" },
  { id: "2", homeTeam: "England", awayTeam: "Pakistan", score: "180/2", time: "38.1", status: "live", series: "T20 Series" },
  { id: "3", homeTeam: "South Africa", awayTeam: "New Zealand", score: "0/0", time: "10:30", status: "upcoming", series: "Test Series" },
]

const sidebarItems = [
  {
    id: "in-play",
    label: "In-Play",
    icon: <Play className="w-5 h-5" />,
    hasDropdown: false,
    color: "bg-green-500"
  },
  {
    id: "cricket",
    label: "Cricket",
    icon: <Trophy className="w-5 h-5" />,
    hasDropdown: true,
    color: "bg-amber-600"
  },
  {
    id: "soccer",
    label: "Soccer",
    icon: <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center"><div className="w-3 h-3 bg-white rounded-full"></div></div>,
    hasDropdown: true,
    color: "bg-green-600"
  },
  {
    id: "tennis",
    label: "Tennis",
    icon: <div className="w-5 h-5 bg-yellow-400 rounded-full"></div>,
    hasDropdown: true,
    color: "bg-yellow-500"
  },
  {
    id: "horse",
    label: "Horse",
    icon: <div className="w-5 h-5 bg-amber-800 rounded-full"></div>,
    hasDropdown: true,
    color: "bg-amber-700"
  },
  {
    id: "greyhound",
    label: "Greyhound",
    icon: <div className="w-5 h-5 bg-gray-600 rounded-full"></div>,
    hasDropdown: true,
    color: "bg-gray-600"
  }
]

const gamingItems = [
  { id: "lobby", label: "Lobby" },
  { id: "aviator", label: "Aviator" },
  { id: "indian-poker", label: "Indian Poker" },
  { id: "casino", label: "Casino" },
  { id: "evolution", label: "Evolution" },
  { id: "ezugi", label: "Ezugi" },
  { id: "live-casino", label: "Live Casino" }
]

export default function Sidebar({ isOpen, onClose, selectedTab, onSelectTab }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [matches, setMatches] = useState<Record<string, Match[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
    
    // Fetch data when expanding
    if (!expandedItems.includes(itemId) && !matches[itemId]) {
      fetchMatchesForTab(itemId)
    }
  }

  const fetchMatchesForTab = async (tab: string) => {
    setLoading(prev => ({ ...prev, [tab]: true }))
    
    try {
      let data: Match[] = []
      switch (tab) {
        case "cricket":
          data = await getCricketMatches()
          break
        case "soccer":
          data = await getSoccerMatches()
          break
        case "tennis":
          data = await getTennisMatches()
          break
        case "horse":
          data = await getHorseRaces()
          break
        default:
          data = []
      }
      setMatches(prev => ({ ...prev, [tab]: data }))
    } catch (error) {
      console.error(`Error fetching ${tab} matches:`, error)
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }))
    }
  }

  const getMatchesForTab = (tab: string) => {
    return matches[tab] || []
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 left-0 bottom-0 w-60 bg-white z-50 shadow-xl overflow-y-auto no-scrollbar"
          >
            {/* Header */}
            <div className="h-12 bg-[#334443] flex items-center justify-between px-4">
              <div className="text-white font-bold text-lg">
                Playlive<span className="text-green-400">7</span>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="py-2">
              {/* Sports Section */}
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Sports & Live Events
                </h3>
                {sidebarItems.map((item) => (
                  <div key={item.id} className="mb-1">
                    <button
                      onClick={() => {
                        if (item.hasDropdown) {
                          toggleExpanded(item.id)
                        } else {
                          onSelectTab(item.id)
                          onClose()
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100 rounded ${
                        selectedTab === item.id ? "bg-gray-100" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${item.color}`}>
                          {item.icon}
                        </div>
                        <span className="font-medium text-gray-800">{item.label}</span>
                      </div>
                      {item.hasDropdown && (
                        <div className="text-gray-400">
                          {expandedItems.includes(item.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedItems.includes(item.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-9 border-l-2 border-gray-200 pl-3 py-2">
                            {loading[item.id] ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                              </div>
                            ) : getMatchesForTab(item.id).length > 0 ? (
                              getMatchesForTab(item.id).map((match) => (
                                <div key={match.id} className="mb-2 p-2 bg-gray-50 rounded">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-800">
                                      {match.homeTeam} vs {match.awayTeam}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      match.status === "live" 
                                        ? "bg-red-100 text-red-800" 
                                        : match.status === "upcoming"
                                        ? "bg-[#5A7ACD] text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}>
                                      {match.status === "live" ? "LIVE" : match.status === "upcoming" ? "UPCOMING" : "FINISHED"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-gray-600">
                                    <span>{match.score}</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {match.time}
                                    </span>
                                  </div>
                                  {"series" in match && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {match.series}
                                    </div>
                                  )}
                                  {"league" in match && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {match.league}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500 py-2">
                                No matches available
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Gaming Section */}
              <div className="px-4 py-2 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Gaming & Casino
                </h3>
                {gamingItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id)
                      onClose()
                    }}
                    className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 rounded mb-1 ${
                      selectedTab === item.id ? "bg-gray-100" : ""
                    }`}
                  >
                    <span className="font-medium text-gray-800">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
