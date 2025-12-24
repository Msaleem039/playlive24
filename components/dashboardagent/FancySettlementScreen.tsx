"use client"

import { useState, useEffect, useMemo } from "react"
import { RefreshCw, Target, Search, ChevronLeft, Zap } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { useGetPendingSettlementsQuery, useSettleFancyMutation } from "@/app/services/Api"
import { toast } from "sonner"
import { FancySettlementModal } from "./FancySettlementModal"

export function FancySettlementScreen() {
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [selectedBet, setSelectedBet] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const { data: pendingData, isLoading, refetch } = useGetPendingSettlementsQuery({}, { 
    pollingInterval: 30000
  })

  const matches = useMemo(() => {
    if (!pendingData) return []
    const response = pendingData as any
    if (response.data && Array.isArray(response.data)) {
      return response.data.filter((match: any) => (match.fancy?.count || 0) > 0)
    }
    return Array.isArray(response) ? response.filter((match: any) => (match.fancy?.count || 0) > 0) : []
  }, [pendingData])

  const filteredMatches = useMemo(() => {
    return matches.filter((match: any) => {
      const matchId = match.matchId || ""
      const matchTitle = match.matchTitle || ""
      const homeTeam = match.homeTeam || ""
      const awayTeam = match.awayTeam || ""
      const eventId = match.eventId || ""
      const searchLower = searchTerm.toLowerCase()
      
      return (
        matchId.toLowerCase().includes(searchLower) ||
        matchTitle.toLowerCase().includes(searchLower) ||
        homeTeam.toLowerCase().includes(searchLower) ||
        awayTeam.toLowerCase().includes(searchLower) ||
        eventId.toLowerCase().includes(searchLower)
      )
    })
  }, [matches, searchTerm])

  const handleBetClick = (match: any, bet: any) => {
    setSelectedMatch(match)
    setSelectedBet(bet)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedBet(null)
  }

  const handleSettle = () => {
    refetch()
    handleCloseModal()
  }

  if (selectedMatch && selectedBet) {
    return (
      <>
        <FancySettlementModal
          match={{ ...selectedMatch, selectedBet }}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSettle={handleSettle}
        />
        <div className="p-6">
          <button
            onClick={() => {
              setSelectedMatch(null)
              setSelectedBet(null)
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Matches</span>
          </button>
        </div>
      </>
    )
  }

  if (selectedMatch) {
    const fancyBets = selectedMatch.fancy?.bets || []
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <button
          onClick={() => setSelectedMatch(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Matches</span>
        </button>
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-4 mb-4">
          <h2 className="text-xl font-bold mb-2">
            {selectedMatch.matchTitle || `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`}
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <span>Match ID: {selectedMatch.matchId}</span>
            {selectedMatch.eventId && <span>Event ID: {selectedMatch.eventId}</span>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-lg">Fancy Bets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Bet ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Odds</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Bet Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Bet Name</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fancyBets.length > 0 ? (
                  fancyBets.map((bet: any, index: number) => (
                    <tr key={bet.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{bet.id || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        Rs{bet.amount?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{bet.odds || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          bet.betType === "BACK" ? "bg-green-100 text-green-800" :
                          bet.betType === "LAY" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {bet.betType || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{bet.betName || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Button
                          onClick={() => handleBetClick(selectedMatch, bet)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Zap className="w-3 h-3" />
                          Settle
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-gray-500 font-medium">No fancy bets found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search matches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-10 h-10 animate-spin text-[#00A66E]" />
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Match ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Match Title</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Bets</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMatches.map((match: any, index: number) => (
                  <tr key={match.matchId || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{match.matchId || "N/A"}</td>
                    <td className="px-6 py-4 text-sm">
                      {match.matchTitle || `${match.homeTeam || "N/A"} vs ${match.awayTeam || "N/A"}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-purple-600">
                        {match.fancy?.count || 0} bets
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-green-600">
                        Rs{(match.fancy?.totalAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Button
                        onClick={() => setSelectedMatch(match)}
                        className="text-[#00A66E] hover:text-[#00C97A] font-medium text-sm"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">No fancy matches found</p>
        </div>
      )}
    </div>
  )
}

