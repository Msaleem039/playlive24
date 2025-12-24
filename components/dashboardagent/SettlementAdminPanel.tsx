"use client"

import { useState, useMemo } from "react"
import { RefreshCw, BarChart3, Play, Target, BookOpen, FileText, Menu } from "lucide-react"
import { Button } from "@/components/utils/button"
import { useGetPendingSettlementsQuery } from "@/app/services/Api"
import { FancySettlementScreen } from "./FancySettlementScreen"
import { MatchOddsSettlementScreen } from "./MatchOddsSettlementScreen"
import { BookmakerSettlementScreen } from "./BookmakerSettlementScreen"
import { SettlementResultsScreen } from "./SettlementResultsScreen"

export function SettlementAdminPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeScreen, setActiveScreen] = useState<"all" | "fancy" | "matchOdds" | "bookmaker" | "results">("all")

  const { data: pendingData } = useGetPendingSettlementsQuery({}, { 
    pollingInterval: 30000
  })

  const matches = useMemo(() => {
    if (!pendingData) return []
    const response = pendingData as any
    if (response.data && Array.isArray(response.data)) {
      return response.data
    }
    return Array.isArray(response) ? response : []
  }, [pendingData])

  const stats = useMemo(() => {
    const response = pendingData as any
    const totalMatches = response?.totalMatches || matches.length
    const totalPendingBets = response?.totalPendingBets || 0
    const totalAmount = matches.reduce((sum: number, match: any) => {
      return sum + (match.matchOdds?.totalAmount || 0) + (match.fancy?.totalAmount || 0) + (match.bookmaker?.totalAmount || 0)
    }, 0)
    
    const fancyMatches = matches.filter((m: any) => (m.fancy?.count || 0) > 0).length
    const matchOddsMatches = matches.filter((m: any) => (m.matchOdds?.count || 0) > 0).length
    const bookmakerMatches = matches.filter((m: any) => (m.bookmaker?.count || 0) > 0).length

    return {
      totalMatches,
      totalPendingBets,
      totalAmount,
      fancyMatches,
      matchOddsMatches,
      bookmakerMatches
    }
  }, [matches, pendingData])

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col border-r border-gray-200`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-lg font-bold text-[#00A66E]">Settlement</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-2 space-y-1">
            <button
              onClick={() => setActiveScreen("all")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeScreen === "all"
                  ? "bg-[#00A66E] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <BarChart3 className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">All Markets</span>}
            </button>

            <button
              onClick={() => setActiveScreen("matchOdds")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
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
              onClick={() => setActiveScreen("fancy")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
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
              onClick={() => setActiveScreen("bookmaker")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
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
              onClick={() => setActiveScreen("results")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
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
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Matches:</span>
                <span className="font-semibold">{stats.totalMatches}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Bets:</span>
                <span className="font-semibold">{stats.totalPendingBets}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold text-green-600">Rs{stats.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00A66E] to-[#00C97A] text-white shadow-lg">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Settlement Admin Panel</h1>
                <p className="text-sm text-white/80">Manage and monitor all settlements</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
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
