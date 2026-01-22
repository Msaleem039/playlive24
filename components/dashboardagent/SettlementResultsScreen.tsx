"use client"

import { useState, useMemo } from "react"
import { RefreshCw, FileText, RotateCcw } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { useGetAllSettlementReportQuery, useGetSettlementHistoryQuery, useRollbackSettlementMutation } from "@/app/services/Api"
import { toast } from "sonner"

export function SettlementResultsScreen() {
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString()
  })
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString()
  })

  const { data: resultsData, isLoading: isLoadingResults, refetch: refetchResults } = useGetAllSettlementReportQuery({})
  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } = useGetSettlementHistoryQuery({
    startDate,
    endDate,
    limit: 100,
    offset: 0
  })
  const [rollbackSettlement, { isLoading: isRollingBack }] = useRollbackSettlementMutation()

  // Helper function to get or construct settlementId in the correct format
  // Format: CRICKET:{MARKET_TYPE}:{EVENT_ID}:{MARKET_ID}
  const getSettlementId = (result: any): string | null => {
    // If settlementId is already in the correct format (starts with "CRICKET:"), use it directly
    const existingId = result.settlementId || result.settlement_id
    if (existingId && typeof existingId === 'string' && existingId.startsWith('CRICKET:')) {
      return existingId
    }
    
    // Otherwise, try to construct it from available data
    const eventId = result.eventId || result.match?.eventId || result.match?.event_id || ""
    const marketType = result.marketType || result.marketName || ""
    const marketId = result.marketId || result.market_id || ""
    
    // Map market type names to API format
    const marketTypeMap: Record<string, string> = {
      'fancy': 'FANCY',
      'FANCY': 'FANCY',
      'match_odds': 'MATCHODDS',
      'matchOdds': 'MATCHODDS',
      'MATCHODDS': 'MATCHODDS',
      'MATCH_ODDS': 'MATCHODDS',
      'bookmaker': 'BOOKMAKER',
      'BOOKMAKER': 'BOOKMAKER',
    }
    
    const formattedMarketType = marketTypeMap[marketType] || marketType.toUpperCase()
    
    if (eventId && formattedMarketType && marketId) {
      return `CRICKET:${formattedMarketType}:${eventId}:${marketId}`
    }
    
    // If we can't construct it, return the existing ID (might work if backend accepts it)
    return existingId || null
  }

  const handleRollback = async (result: any) => {
    const settlementId = getSettlementId(result)
    
    if (!settlementId) {
      toast.error("Cannot rollback: Settlement ID is missing or invalid")
      return
    }
    
    if (!confirm(`Are you sure you want to rollback this settlement?\n\nSettlement ID: ${settlementId}`)) {
      return
    }
    
    try {
      console.log('[Rollback Settlement] Payload:', { settlementId })
      console.log('[Rollback Settlement] Result data:', result)
      
      await rollbackSettlement({ settlementId }).unwrap()
      toast.success("Settlement rolled back successfully")
      
      // Refetch data to get updated results
      refetchResults()
      refetchHistory()
    } catch (error: any) {
      console.error('[Rollback Settlement] Error:', error)
      const errorMessage = error?.data?.error || error?.data?.message || error?.message || "Failed to rollback settlement"
      toast.error(errorMessage)
    }
  }

  const allResults = useMemo(() => {
    const historyBets: any[] = []
    if (historyData?.data && Array.isArray(historyData.data)) {
      historyData.data.forEach((settlement: any) => {
        if (settlement.bets && Array.isArray(settlement.bets)) {
          settlement.bets.forEach((bet: any) => {
            historyBets.push({
              ...bet,
              settlementId: settlement.settlementId || settlement.id,
              settlement_id: settlement.settlementId || settlement.id,
              marketType: settlement.marketType,
              marketName: settlement.marketType,
              marketId: settlement.marketId || bet.marketId,
              eventId: settlement.eventId || settlement.match?.eventId,
              match: settlement.match,
              isRollback: settlement.isRollback
            })
          })
        }
      })
    }
    
    const oldResults = (resultsData as any)?.results || []
    return [...historyBets, ...oldResults]
  }, [historyData, resultsData])

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 sm:mb-6">
        <div className="bg-gray-50 px-3 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <Input
                type="datetime-local"
                value={startDate ? new Date(startDate).toISOString().slice(0, 16) : ""}
                onChange={(e) => setStartDate(new Date(e.target.value).toISOString())}
                className="w-full"
              />
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <Input
                type="datetime-local"
                value={endDate ? new Date(endDate).toISOString().slice(0, 16) : ""}
                onChange={(e) => setEndDate(new Date(e.target.value).toISOString())}
                className="w-full"
              />
            </div>
            <div className="flex items-end w-full sm:w-auto">
              <Button
                onClick={() => {
                  refetchHistory()
                  refetchResults()
                }}
                className="bg-[#00A66E] hover:bg-[#00C97A] text-white w-full sm:w-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {(isLoadingResults || isLoadingHistory) ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-10 h-10 animate-spin text-[#00A66E]" />
        </div>
      ) : allResults.length > 0 ? (
        <>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Settlement ID</th>
                    <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">User</th>
                    <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Match</th>
                    <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Bet Name</th>
                    <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Market</th>
                    <th className="px-4 xl:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Amount</th>
                    <th className="px-4 xl:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Odds</th>
                    <th className="px-4 xl:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="px-4 xl:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Win</th>
                    <th className="px-4 xl:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Loss</th>
                    <th className="px-4 xl:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">P/L</th>
                    <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                    <th className="px-4 xl:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allResults.map((result: any, index: number) => {
                    const displaySettlementId = getSettlementId(result) || result.settlementId || result.settlement_id || "N/A"
                    
                    return (
                    <tr key={result.id || index} className="hover:bg-gray-50">
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-xs xl:text-sm font-mono font-semibold text-gray-900" title={displaySettlementId}>
                          {displaySettlementId.length > 20 ? `${displaySettlementId.substring(0, 20)}...` : displaySettlementId}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-900">
                        {result.userName || result.user?.name || result.user?.username || "N/A"}
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-900">
                        {result.match?.homeTeam || result.match?.eventName || "N/A"}
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-900 font-medium">
                        {result.betName || "N/A"}
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-900">
                        {result.marketType || result.marketName || "N/A"}
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-xs xl:text-sm font-semibold text-gray-900">
                          Rs{result.amount?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-xs xl:text-sm font-semibold text-gray-900">
                          {result.odds || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 xl:px-3 py-1 rounded-full text-xs font-medium ${
                          result.status === "WON" ? "bg-green-100 text-green-800" :
                          result.status === "LOST" ? "bg-red-100 text-red-800" :
                          result.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                          result.isRollback ? "bg-orange-100 text-orange-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {result.isRollback ? "ROLLED BACK" : (result.status || "N/A")}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-xs xl:text-sm font-semibold text-green-600">
                          Rs{(result.pnl > 0 ? result.pnl : result.winAmount || 0)?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-xs xl:text-sm font-semibold text-red-600">
                          Rs{(result.pnl < 0 ? Math.abs(result.pnl) : result.lossAmount || 0)?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-xs xl:text-sm font-bold ${
                          (result.pnl || result.profitLoss || 0) >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {(result.pnl || result.profitLoss || 0) >= 0 ? "+" : ""}Rs{(result.pnl || result.profitLoss || 0)?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-500">
                        {result.settledAt || result.createdAt ? new Date(result.settledAt || result.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <Button
                          onClick={() => handleRollback(result)}
                          disabled={isRollingBack || result.isRollback}
                          className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-2 xl:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span className="hidden xl:inline">{result.isRollback ? "Rolled Back" : "Rollback"}</span>
                          <span className="xl:hidden">{result.isRollback ? "Back" : "↻"}</span>
                        </Button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile/Tablet Card View - Visible on mobile and tablet */}
          <div className="lg:hidden space-y-3">
            {allResults.map((result: any, index: number) => {
              const displaySettlementId = getSettlementId(result) || result.settlementId || result.settlement_id || "N/A"
              
              return (
                <div key={result.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono font-semibold text-gray-900 truncate mb-1" title={displaySettlementId}>
                        {displaySettlementId}
                      </div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {result.betName || "N/A"}
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.status === "WON" ? "bg-green-100 text-green-800" :
                        result.status === "LOST" ? "bg-red-100 text-red-800" :
                        result.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        result.isRollback ? "bg-orange-100 text-orange-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {result.isRollback ? "ROLLED BACK" : (result.status || "N/A")}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">User</div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {result.userName || result.user?.name || result.user?.username || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Match</div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {result.match?.homeTeam || result.match?.eventName || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Market</div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {result.marketType || result.marketName || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Date</div>
                      <div className="text-sm font-medium text-gray-900">
                        {result.settledAt || result.createdAt ? new Date(result.settledAt || result.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-gray-200">
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Amount</div>
                      <div className="text-sm font-semibold text-gray-900">
                        Rs{result.amount?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Odds</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {result.odds || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">P/L</div>
                      <div className={`text-sm font-bold ${
                        (result.pnl || result.profitLoss || 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {(result.pnl || result.profitLoss || 0) >= 0 ? "+" : ""}Rs{(result.pnl || result.profitLoss || 0)?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>

                  {/* Win/Loss Row */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Win</div>
                      <div className="text-sm font-semibold text-green-600">
                        Rs{(result.pnl > 0 ? result.pnl : result.winAmount || 0)?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Loss</div>
                      <div className="text-sm font-semibold text-red-600">
                        Rs{(result.pnl < 0 ? Math.abs(result.pnl) : result.lossAmount || 0)?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>

                  {/* Rollback Button - Always visible and prominent */}
                  <div className="pt-2">
                    <Button
                      onClick={() => handleRollback(result)}
                      disabled={isRollingBack || result.isRollback}
                      className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {result.isRollback ? "Rolled Back" : "Rollback Settlement"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="px-4 sm:px-6 py-12 text-center">
          <FileText className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-base sm:text-lg">No results found</p>
        </div>
      )}
    </div>
  )
}

