"use client"

import { useState, useEffect, useMemo } from "react"
import { RefreshCw, BookOpen, Search, ChevronLeft, Zap, CheckCircle } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { useGetPendingBookmakerMarketsQuery, useSettleBookmakerMutation } from "@/app/services/Api"
import { toast } from "sonner"

export function BookmakerSettlementScreen() {
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Settlement form state
  const [eventId, setEventId] = useState("")
  const [selectionId, setSelectionId] = useState("")
  const [isCancel, setIsCancel] = useState(false)
  const [marketId, setMarketId] = useState("")
  
  const [settleBookmaker, { isLoading: isSettling }] = useSettleBookmakerMutation()

  const { data: pendingData, isLoading, refetch } = useGetPendingBookmakerMarketsQuery({}, { 
    pollingInterval: 30000
  })

  const matches = useMemo(() => {
    if (!pendingData) return []
    const response = pendingData as any
    // Handle the bookmaker markets endpoint response structure
    // Response format: { success: true, marketType: "bookmaker", data: [...], totalMatches: number, totalPendingBets: number }
    if (response.data && Array.isArray(response.data)) {
      // Filter matches that have bookmaker bets (though all should have them from this endpoint)
      return response.data.filter((match: any) => (match.bookmaker?.count || 0) > 0)
    }
    return []
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

  // Get available selection IDs for a match
  // Note: selectionId is now directly in bet.selectionId (not extracted from settlementId)
  const getAvailableSelectionIds = (match: any) => {
    if (!match?.bookmaker?.bets) return []
    
    const selectionIdMap: Record<string, { selectionId: string, betName: string, count: number, totalAmount: number, bets: any[] }> = {}
    
    match.bookmaker.bets.forEach((bet: any) => {
      // selectionId is directly in bet.selectionId (number or string)
      const selectionId = String(bet.selectionId || "")
      if (!selectionId) return
      
      if (!selectionIdMap[selectionId]) {
        selectionIdMap[selectionId] = {
          selectionId: selectionId,
          betName: bet.betName || 'Unknown',
          count: 0,
          totalAmount: 0,
          bets: []
        }
      }
      selectionIdMap[selectionId].count += 1
      selectionIdMap[selectionId].totalAmount += bet.amount || 0
      selectionIdMap[selectionId].bets.push(bet)
    })
    
    return Object.values(selectionIdMap).sort((a, b) => a.selectionId.localeCompare(b.selectionId))
  }

  // Get bets for selected selection ID
  const getBetsForSelectionId = (match: any, selId: string | null) => {
    if (!match?.bookmaker?.bets || !selId) return []
    return match.bookmaker.bets.filter((bet: any) => {
      // selectionId is directly in bet.selectionId
      return String(bet.selectionId || "") === selId
    })
  }

  // Group bets by settlementId for selected selection ID
  const groupedSettlements = useMemo(() => {
    if (!selectedMatch || !selectedSelectionId) return []
    
    const bets = getBetsForSelectionId(selectedMatch, selectedSelectionId)
    const grouped: Record<string, any> = {}
    
    bets.forEach((bet: any) => {
      const settlementId = bet.settlementId || 'unknown'
      if (!grouped[settlementId]) {
        grouped[settlementId] = {
          settlementId,
          betName: bet.betName || 'Unknown',
          count: 0,
          totalAmount: 0,
          bets: []
        }
      }
      grouped[settlementId].count += 1
      grouped[settlementId].totalAmount += bet.amount || 0
      grouped[settlementId].bets.push(bet)
    })
    
    return Object.values(grouped)
  }, [selectedMatch, selectedSelectionId])

  // Initialize form when match is selected
  useEffect(() => {
    if (selectedMatch) {
      const availableSelectionIds = getAvailableSelectionIds(selectedMatch)
      // Auto-select first available selection ID
      if (availableSelectionIds.length > 0 && !selectedSelectionId) {
        setSelectedSelectionId(availableSelectionIds[0].selectionId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMatch])

  // Extract marketId from bets for selected selection ID
  const extractMarketId = (match: any, selId: string | null) => {
    if (!match?.bookmaker?.bets || !selId) return ""
    
    // Find the first bet with this selectionId and get its marketId
    const bet = match.bookmaker.bets.find((b: any) => String(b.selectionId || "") === selId)
    if (bet?.marketId) {
      const marketId = String(bet.marketId)
      // Verify it's a long number (exchange market ID format - typically 10+ digits)
      if (marketId && /^\d+$/.test(marketId) && marketId.length >= 10) {
        return marketId
      }
      return marketId
    }
    return ""
  }

  // Initialize form when selection ID is selected
  useEffect(() => {
    if (selectedMatch && selectedSelectionId) {
      setEventId(selectedMatch.eventId || "")
      setSelectionId(selectedSelectionId)
      setIsCancel(false)
      // Auto-populate marketId from the bet data
      const extractedMarketId = extractMarketId(selectedMatch, selectedSelectionId)
      setMarketId(extractedMarketId)
    }
  }, [selectedMatch, selectedSelectionId])

  const handleSettle = async () => {
    if (!eventId.trim() || !selectionId.trim() || !marketId.trim()) {
      toast.error("Event ID, Selection ID, and Market ID are required")
      return
    }

    if (!selectedSelectionId) {
      toast.error("Please select a Selection ID")
      return
    }

    // Validate marketId is a valid number (exchange market ID format)
    const marketIdNum = marketId.trim()
    if (!/^\d+$/.test(marketIdNum)) {
      toast.error("Market ID must be a valid number (exchange market ID)")
      return
    }

    // Validate eventId is a valid number
    const eventIdNum = eventId.trim()
    if (!/^\d+$/.test(eventIdNum)) {
      toast.error("Event ID must be a valid number")
      return
    }

    // Validate selectionId (winnerSelectionId) is a valid number
    const selectionIdNum = selectionId.trim()
    if (!/^\d+$/.test(selectionIdNum)) {
      toast.error("Selection ID must be a valid number")
      return
    }

    const selectedSelectionData = getAvailableSelectionIds(selectedMatch).find(s => s.selectionId === selectedSelectionId)
    const betCount = selectedSelectionData?.count || 0
    const totalAmount = selectedSelectionData?.totalAmount || 0
    const betName = selectedSelectionData?.betName || selectedSelectionId
    
    const confirmMessage = `This will ${isCancel ? 'cancel/refund' : 'settle'} ALL ${betCount} Bookmaker bet(s) for Selection ID ${selectedSelectionId} (${betName}) (Total: Rs${totalAmount.toLocaleString()}).\n\nOther Selection IDs, Match Odds and Fancy bets will NOT be affected.\n\nContinue?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      // Payload format: { eventId: string, marketId: string, winnerSelectionId: string }
      // Example: { "eventId": "35100761", "marketId": "6230221786468", "winnerSelectionId": "1" }
      const payload = {
        eventId: eventIdNum,
        marketId: marketIdNum,
        winnerSelectionId: selectionIdNum
      }
      
      await settleBookmaker(payload).unwrap()
      toast.success(isCancel ? `Bookmaker bets cancelled successfully for Selection ID ${selectedSelectionId}` : `Bookmaker bets settled successfully for Selection ID ${selectedSelectionId}. ${betCount} bet(s) processed.`)
      refetch()
      setSelectedMatch(null)
      setSelectedSelectionId(null)
    } catch (error: any) {
      toast.error(error?.data?.error || error?.data?.message || "Failed to settle bookmaker bets")
    }
  }

  // Render selected match view
  if (selectedMatch) {
    return (
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        <button
          onClick={() => setSelectedMatch(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 md:mb-4 text-sm md:text-base"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Matches</span>
        </button>
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-3 md:p-4 mb-3 md:mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
            <span className="text-xl md:text-2xl font-bold truncate">{selectedMatch.homeTeam || "Team 1"}</span>
            <span className="text-base md:text-lg">vs</span>
            <span className="text-xl md:text-2xl font-bold truncate">{selectedMatch.awayTeam || "Team 2"}</span>
          </div>
          {selectedMatch.matchTitle && (
            <p className="text-xs md:text-sm text-white/80 mb-2 truncate">{selectedMatch.matchTitle}</p>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm">
            <span className="truncate">Match ID: {selectedMatch.matchId}</span>
            {selectedMatch.eventId && <span className="truncate">Event ID: {selectedMatch.eventId}</span>}
          </div>
        </div>

        {/* Selection ID Selection */}
        {selectedMatch && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-3 md:mb-4">
            <div className="p-3 md:p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Selection ID <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                {getAvailableSelectionIds(selectedMatch).map((selData) => (
                  <button
                    key={selData.selectionId}
                    onClick={() => {
                      setSelectedSelectionId(selData.selectionId)
                      // Reset form when switching selection IDs
                      setIsCancel(false)
                    }}
                    className={`p-2.5 md:p-3 rounded-lg border-2 transition-all text-left ${
                      selectedSelectionId === selData.selectionId
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-xs md:text-sm truncate">{selData.betName || `Selection ${selData.selectionId}`}</div>
                    <div className="text-xs text-gray-500 mt-1 break-words">
                      ID: {selData.selectionId} | {selData.count} bet{selData.count !== 1 ? 's' : ''} | Rs{selData.totalAmount.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedSelectionId && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 md:mb-6">
            <div className="bg-gray-50 px-3 md:px-6 py-3 md:py-4 border-b border-gray-200">
              <h3 className="font-semibold text-base md:text-lg truncate">
                Bookmaker Settlements - {getAvailableSelectionIds(selectedMatch).find(s => s.selectionId === selectedSelectionId)?.betName || `Selection ID: ${selectedSelectionId}`}
              </h3>
            </div>
            <div className="overflow-x-auto -mx-3 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-bold text-gray-700 uppercase">Selection</th>
                      <th className="px-3 md:px-6 py-2 md:py-4 text-center text-xs font-bold text-gray-700 uppercase">Bets Count</th>
                      <th className="px-3 md:px-6 py-2 md:py-4 text-right text-xs font-bold text-gray-700 uppercase">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupedSettlements.length > 0 ? (
                      groupedSettlements.map((group: any, index: number) => (
                        <tr key={group.settlementId || index} className="hover:bg-gray-50">
                          <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-semibold">
                            {group.betName || group.settlementId || "N/A"}
                          </td>
                          <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-center">
                            <span className="text-xs md:text-sm font-semibold text-green-600">
                              {group.count} {group.count === 1 ? 'bet' : 'bets'}
                            </span>
                          </td>
                          <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-right">
                            <span className="text-xs md:text-sm font-bold text-green-600">
                              Rs{group.totalAmount?.toLocaleString() || 0}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-3 md:px-6 py-8 md:py-12 text-center">
                          <p className="text-gray-500 font-medium text-sm md:text-base">No bookmaker bets found for this selection ID</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settlement Form */}
        {selectedSelectionId && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-3 md:px-6 py-3 md:py-4">
              <h3 className="font-semibold text-base md:text-lg flex items-center gap-2">
                <Zap className="w-4 h-4 md:w-5 md:h-5" />
                <span className="truncate">Settlement Details - Selection ID: {selectedSelectionId}</span>
              </h3>
            </div>
            <div className="p-3 md:p-6 space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event ID <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  placeholder="Enter event ID"
                  className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selection ID <span className="text-red-500">*</span>
                </label>
                {selectedMatch && getAvailableSelectionIds(selectedMatch).length > 0 ? (
                  <div className="relative">
                    <select
                      value={selectionId}
                      onChange={(e) => {
                        setSelectionId(e.target.value)
                        // Auto-populate marketId when selection changes
                        const extractedMarketId = extractMarketId(selectedMatch, e.target.value)
                        setMarketId(extractedMarketId)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A66E] focus:border-[#00A66E] bg-white text-sm text-gray-900 appearance-none cursor-pointer"
                      required
                      style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="" disabled>-- Select Selection ID --</option>
                      {getAvailableSelectionIds(selectedMatch).map((selData) => (
                        <option 
                          key={selData.selectionId} 
                          value={selData.selectionId}
                        >
                          {selData.betName || `Selection ${selData.selectionId}`} (ID: {selData.selectionId}) - {selData.count} bet{selData.count !== 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <Input
                    type="text"
                    value={selectionId}
                    onChange={(e) => setSelectionId(e.target.value)}
                    placeholder="Enter selection ID"
                    className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market ID <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-500 font-normal">(Exchange Market ID)</span>
                </label>
                <Input
                  type="text"
                  value={marketId}
                  onChange={(e) => setMarketId(e.target.value)}
                  placeholder="Enter market ID (auto-filled from bet data)"
                  className={`w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E] ${
                    marketId && marketId.length < 10 ? 'border-yellow-500' : ''
                  }`}
                  required
                />
                {marketId && (
                  <div className="mt-1">
                    <p className={`text-xs ${marketId.length < 10 ? 'text-yellow-600 font-semibold' : 'text-gray-500'}`}>
                      Market ID: {marketId} ({marketId.length} digits)
                      {marketId.length < 10 && marketId.length > 0 && (
                        <span className="ml-2">⚠️ This looks like a short ID. Please verify the full exchange market ID (should be 10+ digits)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <input
                  type="checkbox"
                  id="isCancel"
                  checked={isCancel}
                  onChange={(e) => setIsCancel(e.target.checked)}
                  className="w-4 h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
                />
                <label htmlFor="isCancel" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Cancel/Refund all bets
                </label>
              </div>


              <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 pt-3 md:pt-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setSelectedMatch(null)
                    setSelectedSelectionId(null)
                  }}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm md:text-base w-full sm:w-auto"
                  disabled={isSettling}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSettle}
                  disabled={isSettling || !selectedSelectionId || !eventId.trim() || !selectionId.trim() || !marketId.trim()}
                  className="px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-white font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base w-full sm:w-auto"
                >
                  {isSettling ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Settling...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {isCancel ? "Cancel Bets" : "Settle All Bets"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default view when no match is selected
  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-6">
      {/* Screen Header - Bookmaker Only */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-3 md:p-4 mb-4 md:mb-6 shadow-md">
        <div className="flex items-center gap-2 md:gap-3">
          <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
          <div>
            <h2 className="text-lg md:text-xl font-bold">Bookmaker Settlement</h2>
            <p className="text-xs md:text-sm text-white/80">Only matches with Bookmaker bets are shown</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 md:p-4 mb-4 md:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
          <Input
            type="text"
            placeholder="Search Bookmaker matches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 md:pl-10 w-full text-sm md:text-base"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 md:py-20">
          <RefreshCw className="w-8 h-8 md:w-10 md:h-10 animate-spin text-[#00A66E]" />
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-50 px-3 md:px-6 py-2 md:py-3 border-b border-green-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm md:text-base font-semibold text-green-900">
                Bookmaker Pending Settlements
              </h3>
              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                {filteredMatches.length} {filteredMatches.length === 1 ? 'match' : 'matches'}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-bold text-green-900 uppercase">Match ID</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-bold text-green-900 uppercase">Match Title</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-center text-xs font-bold text-green-900 uppercase">Bookmaker Bets</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-right text-xs font-bold text-green-900 uppercase">Amount</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-center text-xs font-bold text-green-900 uppercase">Actions</th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMatches.map((match: any, index: number) => (
                  <tr key={match.matchId || index} className="hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-mono">{match.matchId || "N/A"}</td>
                    <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                      {match.matchTitle || `${match.homeTeam || "N/A"} vs ${match.awayTeam || "N/A"}`}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs md:text-sm font-semibold">
                        <BookOpen className="w-3 h-3" />
                        {match.bookmaker?.count || 0} Bookmaker bet{match.bookmaker?.count !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-right">
                      <span className="text-xs md:text-sm font-bold text-green-600">
                        Rs{(match.bookmaker?.totalAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-center">
                      <Button
                        onClick={() => setSelectedMatch(match)}
                        className="text-[#00A66E] hover:text-[#00C97A] font-medium text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5"
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
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <BookOpen className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookmaker Pending</h3>
          <p className="text-gray-500 text-sm">There are no matches with Bookmaker bets requiring settlement.</p>
          <p className="text-gray-400 text-xs mt-2">Check Match Odds or Fancy screens for other bet types.</p>
        </div>
      )}
    </div>
  )
}

