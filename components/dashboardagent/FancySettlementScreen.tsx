"use client"

import { useState, useEffect, useMemo } from "react"
import { RefreshCw, Target, Search, ChevronLeft, Zap, CheckCircle } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { useGetPendingFancyMarketsQuery, useSettleFancyMutation, useCancelBetsMutation } from "@/app/services/Api"
import { toast } from "sonner"

export function FancySettlementScreen() {
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Settlement form state
  const [eventId, setEventId] = useState("")
  const [selectionId, setSelectionId] = useState("")
  const [decisionRun, setDecisionRun] = useState("")
  const [isCancel, setIsCancel] = useState(false)
  const [marketId, setMarketId] = useState("")
  
  const [settleFancy, { isLoading: isSettling }] = useSettleFancyMutation()
  const [cancelBets, { isLoading: isCancelling }] = useCancelBetsMutation()

  const { data: pendingData, isLoading, refetch } = useGetPendingFancyMarketsQuery({}, { 
    pollingInterval: 30000
  })

  const matches = useMemo(() => {
    if (!pendingData) return []
    const response = pendingData as any
    if (response.data && Array.isArray(response.data)) {
      return response.data.filter((match: any) => (match.fancy?.count || 0) > 0)
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

  // Extract selectionId from bet - prioritizes direct field, falls back to settlementId extraction
  const getSelectionIdFromBet = (bet: any): string => {
    // Priority 1: Use bet.selectionId directly (can be number or string)
    if (bet.selectionId != null) {
      return String(bet.selectionId)
    }
    // Priority 2: Try bet.selection_id
    if (bet.selection_id != null) {
      return String(bet.selection_id)
    }
    // Priority 3: Extract from settlementId (format: "eventId_selectionId")
    if (bet.settlementId && bet.settlementId.includes("_")) {
      const parts = bet.settlementId.split("_")
      return parts[1] || ""
    }
    return ""
  }

  // Extract selectionId from settlementId (format: "matchId_selectionId") - kept for backward compatibility
  const extractSelectionId = (settlementId: string) => {
    if (!settlementId || !settlementId.includes("_")) return ""
    const parts = settlementId.split("_")
    return parts[1] || ""
  }

  // Get available selection IDs for a match
  const getAvailableSelectionIds = (match: any) => {
    if (!match?.fancy?.bets) return []
    
    const selectionIdMap: Record<string, { selectionId: string, betName: string, count: number, totalAmount: number, bets: any[] }> = {}
    
    match.fancy.bets.forEach((bet: any) => {
      const selectionId = getSelectionIdFromBet(bet)
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
    if (!match?.fancy?.bets || !selId) return []
    return match.fancy.bets.filter((bet: any) => {
      const betSelectionId = getSelectionIdFromBet(bet)
      return betSelectionId === selId
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

  // Helper functions to extract data from bets (used in both button validation and handleSettle)
  const extractSelectionIdFromBet = (bet: any, fallbackSelectionId: string) => {
    if (bet.selectionId != null) {
      return String(bet.selectionId)
    }
    if (bet.selection_id != null) {
      return String(bet.selection_id)
    }
    if (bet.settlementId && bet.settlementId.includes("_")) {
      const parts = bet.settlementId.split("_")
      return parts[1] || fallbackSelectionId
    }
    return fallbackSelectionId
  }
  
  const extractMarketIdFromBet = (bet: any) => {
    if (bet.marketId != null) {
      return String(bet.marketId)
    }
    if (bet.market_id != null) {
      return String(bet.market_id)
    }
    if (bet.market?.marketId != null) {
      return String(bet.market.marketId)
    }
    return null
  }
  
  const extractEventIdFromBet = (bet: any, matchEventId?: string) => {
    if (bet.eventId != null) {
      return String(bet.eventId)
    }
    if (bet.event_id != null) {
      return String(bet.event_id)
    }
    if (matchEventId) {
      return String(matchEventId)
    }
    return null
  }

  // Check if cancel button should be enabled (can extract all required data from bets)
  const canCancelBets = useMemo(() => {
    if (!selectedMatch || !selectedSelectionId || !isCancel) return false
    
    const bets = getBetsForSelectionId(selectedMatch, selectedSelectionId)
    if (bets.length === 0) return false
    
    // Check if we have at least one bet with an ID
    const hasBetIds = bets.some((bet: any) => bet.id || bet.betId)
    if (!hasBetIds) return false
    
    // Check if we can extract selectionId
    const hasSelectionId = bets.some((bet: any) => {
      const selId = extractSelectionIdFromBet(bet, selectedSelectionId)
      return selId && selId !== ""
    })
    
    // Check if we can extract marketId
    const hasMarketId = bets.some((bet: any) => {
      const mktId = extractMarketIdFromBet(bet)
      return mktId && mktId !== ""
    })
    
    // Check if we can extract eventId
    const hasEventId = bets.some((bet: any) => {
      const evtId = extractEventIdFromBet(bet, selectedMatch.eventId)
      return evtId && evtId !== ""
    })
    
    return hasBetIds && hasSelectionId && hasMarketId && hasEventId
  }, [selectedMatch, selectedSelectionId, isCancel])

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

  // Initialize form when selection ID is selected
  useEffect(() => {
    if (selectedMatch && selectedSelectionId) {
      setEventId(selectedMatch.eventId || "")
      setSelectionId(selectedSelectionId)
      setDecisionRun("")
      setIsCancel(false)
      setMarketId("")
    }
  }, [selectedMatch, selectedSelectionId])

  const handleSettle = async () => {
    if (!eventId.trim() || !selectionId.trim()) {
      toast.error("Event ID and Selection ID are required")
      return
    }
    if (!isCancel && !decisionRun.trim()) {
      toast.error("Decision Run is required when not cancelling")
      return
    }

    if (!selectedSelectionId) {
      toast.error("Please select a Selection ID")
      return
    }

    const selectedSelectionData = getAvailableSelectionIds(selectedMatch).find(s => s.selectionId === selectedSelectionId)
    const bets = getBetsForSelectionId(selectedMatch, selectedSelectionId)
    const betCount = selectedSelectionData?.count || 0
    const totalAmount = selectedSelectionData?.totalAmount || 0
    const betName = selectedSelectionData?.betName || selectedSelectionId
    
    // Collect betIds and extract data from bets
    // Bet structure: { id, selectionId (number), marketId, eventId, settlementId }
    const betData = bets.map((bet: any) => {
      // Bet ID: prioritize 'id' field (as shown in API response), fallback to 'betId'
      const betId = bet.id || bet.betId || null
      if (!betId) return null
      
      return {
        betId: betId,
        selectionId: extractSelectionIdFromBet(bet, selectedSelectionId),
        marketId: extractMarketIdFromBet(bet),
        eventId: extractEventIdFromBet(bet, selectedMatch.eventId)
      }
    }).filter((item: any) => item != null && item.betId != null)
    
    const betIds = betData.map((item: any) => item.betId)
    
    // Extract selectionId from bets (should all be the same since we filtered by selectedSelectionId)
    const betSelectionIds = [...new Set(betData.map((item: any) => item.selectionId).filter((id: any) => id != null))]
    const betSelectionId = betSelectionIds.length > 0 ? String(betSelectionIds[0]) : selectionId.trim()
    
    // Extract marketId from bets (try to find a common one, or use form value)
    const betMarketIds = [...new Set(betData.map((item: any) => item.marketId).filter((id: any) => id != null && id !== ""))]
    const betMarketId = betMarketIds.length > 0 ? String(betMarketIds[0]) : marketId.trim()
    
    // Extract eventId from bets (should be same for all bets in a match)
    const betEventIds = [...new Set(betData.map((item: any) => item.eventId).filter((id: any) => id != null && id !== ""))]
    const betEventId = betEventIds.length > 0 ? String(betEventIds[0]) : eventId.trim()
    
    if (isCancel) {
      // Use cancelBets endpoint
      if (betIds.length === 0) {
        toast.error("No bet IDs found to cancel")
        return
      }
      
      // Validate required fields
      if (!betMarketId) {
        toast.error("Market ID is required for cancelling bets. Please enter it manually or ensure bets have marketId.")
        return
      }
      
      if (!betSelectionId) {
        toast.error("Selection ID could not be extracted from bets")
        return
      }
      
      if (!betEventId) {
        toast.error("Event ID is required for cancelling bets")
        return
      }
      
      // Verify selectionId matches
      if (betSelectionIds.length > 1) {
        toast.error(`Bets have different selection IDs (${betSelectionIds.join(', ')}). Cannot cancel bets with different selection IDs together.`)
        return
      }
      
      // Verify marketId matches if multiple found
      if (betMarketIds.length > 1) {
        toast.warning(`Bets have different market IDs (${betMarketIds.join(', ')}). Using first market ID: ${betMarketId}`)
      }
      
      const confirmMessage = `Cancelling ${betIds.length} Fancy bet(s) for Selection ID ${betSelectionId} (${betName}) - Total: Rs${totalAmount.toLocaleString()}`
      
      // Show info toast and proceed
      toast.info(confirmMessage, {
        duration: 3000,
      })

      try {
        const payload = {
          eventId: betEventId,
          marketId: betMarketId,
          selectionId: betSelectionId,
          betIds: betIds
        }
        
        await cancelBets(payload).unwrap()
        toast.success(`Fancy bets cancelled successfully for Selection ID ${betSelectionId}. ${betIds.length} bet(s) cancelled.`)
        refetch()
        setSelectedMatch(null)
        setSelectedSelectionId(null)
      } catch (error: any) {
        toast.error(error?.data?.error || error?.data?.message || "Failed to cancel fancy bets")
      }
    } else {
      // Use regular settlement
      const confirmMessage = `Settling ${betCount} Fancy bet(s) for Selection ID ${selectedSelectionId} (${betName}) - Total: Rs${totalAmount.toLocaleString()}`
      
      // Show info toast and proceed
      toast.info(confirmMessage, {
        duration: 3000,
      })

      try {
        await settleFancy({
          eventId: eventId.trim(),
          selectionId: selectionId.trim(),
          decisionRun: Number(decisionRun),
          isCancel: false,
          marketId: marketId.trim() || undefined
        }).unwrap()
        toast.success(`Fancy bets settled successfully for Selection ID ${selectedSelectionId}. ${betCount} bet(s) processed.`)
        refetch()
        setSelectedMatch(null)
        setSelectedSelectionId(null)
      } catch (error: any) {
        toast.error(error?.data?.error || error?.data?.message || "Failed to settle fancy bets")
      }
    }
  }

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
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-3 md:p-4 mb-3 md:mb-4">
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
                      setDecisionRun("")
                      setIsCancel(false)
                    }}
                    className={`p-2.5 md:p-3 rounded-lg border-2 transition-all text-left ${
                      selectedSelectionId === selData.selectionId
                        ? 'border-purple-600 bg-purple-50'
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
                Fancy Settlements - {getAvailableSelectionIds(selectedMatch).find(s => s.selectionId === selectedSelectionId)?.betName || `Selection ID: ${selectedSelectionId}`}
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
                            <span className="text-xs md:text-sm font-semibold text-purple-600">
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
                          <p className="text-gray-500 font-medium text-sm md:text-base">No fancy bets found for this selection ID</p>
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
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 md:px-6 py-3 md:py-4">
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
              <Input
                type="text"
                value={selectionId}
                onChange={(e) => setSelectionId(e.target.value)}
                placeholder="Enter selection ID"
                className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Market ID <span className={isCancel ? "text-red-500" : "text-gray-500"}>{isCancel ? "*" : "(Optional)"}</span>
              </label>
              <Input
                type="text"
                value={marketId}
                onChange={(e) => setMarketId(e.target.value)}
                placeholder="Enter market ID"
                className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                required={isCancel}
              />
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

            {!isCancel && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decision Run <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={decisionRun}
                  onChange={(e) => setDecisionRun(e.target.value)}
                  placeholder="Enter winning run value"
                  className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                  required={!isCancel}
                />
                <p className="text-xs text-gray-500 mt-1">
                  BACK wins if decisionRun &gt; betValue, LAY wins if decisionRun ≤ betValue
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 pt-3 md:pt-4 border-t border-gray-200">
              <Button
                onClick={() => {
                  setSelectedMatch(null)
                  setSelectedSelectionId(null)
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm md:text-base w-full sm:w-auto"
                disabled={isSettling || isCancelling}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSettle}
                disabled={
                  (isSettling || isCancelling) || 
                  !selectedSelectionId || 
                  (isCancel ? !canCancelBets : (!eventId.trim() || !selectionId.trim() || !decisionRun.trim()))
                }
                className="px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-white font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base w-full sm:w-auto"
              >
                {(isSettling || isCancelling) ? (
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

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-6">
      {/* Screen Header - Fancy Only */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-3 md:p-4 mb-4 md:mb-6 shadow-md">
        <div className="flex items-center gap-2 md:gap-3">
          <Target className="w-5 h-5 md:w-6 md:h-6" />
          <div>
            <h2 className="text-lg md:text-xl font-bold">Fancy Settlement</h2>
            <p className="text-xs md:text-sm text-white/80">Only matches with Fancy bets are shown</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 md:p-4 mb-4 md:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
          <Input
            type="text"
            placeholder="Search Fancy matches..."
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
          <div className="bg-purple-50 px-3 md:px-6 py-2 md:py-3 border-b border-purple-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm md:text-base font-semibold text-purple-900">
                Fancy Pending Settlements
              </h3>
              <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                {filteredMatches.length} {filteredMatches.length === 1 ? 'match' : 'matches'}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-bold text-purple-900 uppercase">Match ID</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-bold text-purple-900 uppercase">Match Title</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-center text-xs font-bold text-purple-900 uppercase">Fancy Bets</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-right text-xs font-bold text-purple-900 uppercase">Amount</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-center text-xs font-bold text-purple-900 uppercase">Actions</th>
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
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs md:text-sm font-semibold">
                          <Target className="w-3 h-3" />
                          {match.fancy?.count || 0} Fancy bet{match.fancy?.count !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-right">
                        <span className="text-xs md:text-sm font-bold text-green-600">
                          Rs{(match.fancy?.totalAmount || 0).toLocaleString()}
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
          <Target className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fancy Pending</h3>
          <p className="text-gray-500 text-sm">There are no matches with Fancy bets requiring settlement.</p>
          <p className="text-gray-400 text-xs mt-2">Check Match Odds or Bookmaker screens for other bet types.</p>
        </div>
      )}
    </div>
  )
}

