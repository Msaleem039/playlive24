"use client"

import { useState, useMemo, useEffect } from "react"
import { RefreshCw, BarChart3, Play, Target, BookOpen, FileText, Menu } from "lucide-react"
import { Button } from "@/components/utils/button"
import { useGetPendingMarketsQuery, useGetPendingFancyMarketsQuery, useGetPendingBookmakerMarketsQuery } from "@/app/services/Api"
import { FancySettlementScreen } from "./FancySettlementScreen"
import { MatchOddsSettlementScreen } from "./MatchOddsSettlementScreen"
import { BookmakerSettlementScreen } from "./BookmakerSettlementScreen"
import { SettlementResultsScreen } from "./SettlementResultsScreen"

export function SettlementAdminPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeScreen, setActiveScreen] = useState<"all" | "fancy" | "matchOdds" | "bookmaker" | "results">("all")

  // Set sidebar open on desktop by default
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const { data: marketsData } = useGetPendingMarketsQuery({}, { 
    pollingInterval: 30000
  })
  
  const { data: fancyMarketsData } = useGetPendingFancyMarketsQuery({}, { 
    pollingInterval: 30000
  })

  const stats = useMemo(() => {
    const marketsResponse = marketsData as any
    const fancyResponse = fancyMarketsData as any
    
    const marketsMatches = marketsResponse?.data || []
    const fancyMatches = fancyResponse?.data || []
    
    const totalMatches = (marketsResponse?.totalMatches || 0) + (fancyResponse?.totalMatches || 0)
    const totalPendingBets = (marketsResponse?.totalPendingBets || 0) + (fancyResponse?.totalPendingBets || 0)
    
    const totalAmount = [...marketsMatches, ...fancyMatches].reduce((sum: number, match: any) => {
      return sum + (match.matchOdds?.totalAmount || 0) + (match.fancy?.totalAmount || 0) + (match.bookmaker?.totalAmount || 0)
    }, 0)
    
    const fancyMatchesCount = fancyResponse?.totalMatches || 0
    const matchOddsMatches = marketsMatches.filter((m: any) => (m.matchOdds?.count || 0) > 0).length
    const bookmakerMatches = marketsMatches.filter((m: any) => (m.bookmaker?.count || 0) > 0).length

    return {
      totalMatches,
      totalPendingBets,
      totalAmount,
      fancyMatches: fancyMatchesCount,
      matchOddsMatches,
      bookmakerMatches
    }
  }, [marketsData, fancyMarketsData])

  const renderScreen = () => {
    switch (activeScreen) {
      case "fancy":
        return <FancySettlementScreen />
      case "matchOdds":
        return <MatchOddsSettlementScreen />
      case "bookmaker":
        return <BookmakerSettlementScreen />
      case "results":
        return <SettlementResultsScreen />
      default:
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="text-center py-20">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-lg">Select a market type from the sidebar</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col md:flex-row">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${
        sidebarOpen ? 'w-64' : 'w-0 md:w-20'
      } fixed md:relative z-50 md:z-auto bg-white shadow-lg transition-all duration-300 flex flex-col border-r border-gray-200 h-screen`}>
        <div className="p-3 md:p-4 border-b border-gray-200 flex items-center justify-between min-w-[64px]">
          {sidebarOpen && <h2 className="text-base md:text-lg font-bold text-[#00A66E]">Settlement</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 md:py-4">
          <div className="px-2 space-y-1">
            <button
              onClick={() => {
                setActiveScreen("all")
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base ${
                activeScreen === "all"
                  ? "bg-[#00A66E] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <BarChart3 className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">All Markets</span>}
            </button>

            <button
              onClick={() => {
                setActiveScreen("matchOdds")
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base ${
                activeScreen === "matchOdds"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Play className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">Match Odds</span>
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                    {stats.matchOddsMatches}
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveScreen("fancy")
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base ${
                activeScreen === "fancy"
                  ? "bg-purple-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Target className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">Fancy</span>
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                    {stats.fancyMatches}
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveScreen("bookmaker")
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base ${
                activeScreen === "bookmaker"
                  ? "bg-green-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <BookOpen className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">Bookmaker</span>
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                    {stats.bookmakerMatches}
                  </span>
                </div>
              )}
            </button>

            <div className="border-t border-gray-200 my-2"></div>

            <button
              onClick={() => {
                setActiveScreen("results")
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base ${
                activeScreen === "results"
                  ? "bg-gray-800 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FileText className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Results</span>}
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <div className="p-3 md:p-4 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-2 md:p-3 space-y-1.5 md:space-y-2">
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-gray-600">Total Matches:</span>
                <span className="font-semibold">{stats.totalMatches}</span>
              </div>
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-gray-600">Total Bets:</span>
                <span className="font-semibold">{stats.totalPendingBets}</span>
              </div>
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold text-green-600">Rs{stats.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full md:w-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00A66E] to-[#00C97A] text-white shadow-lg">
          <div className="px-3 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 md:gap-0 flex-1 min-w-0">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg md:text-2xl font-bold truncate">Settlement Admin Panel</h1>
                  <p className="text-xs md:text-sm text-white/80 hidden sm:block">Manage and monitor all settlements</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-1 md:gap-2 bg-white/20 hover:bg-white/30 px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all"
                >
                  <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Screen Content */}
        {renderScreen()}
      </div>
    </div>
  )
}
