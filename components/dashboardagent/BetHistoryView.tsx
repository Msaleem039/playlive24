"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/utils/button"
import { useGetUserBetsQuery } from "@/app/services/Api"
import { Loader2 } from "lucide-react"
import { useSelector } from "react-redux"
import { selectCurrentUser } from "@/app/store/slices/authSlice"

export function BetHistoryView() {
  const authUser = useSelector(selectCurrentUser)
  const userId = authUser?.id || ""
  
  const [limit, setLimit] = useState<number>(20)
  const [offset, setOffset] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<"Current" | "Past">("Past")

  // Fetch bet history with pagination
  const { data: betsData, isLoading, error } = useGetUserBetsQuery(
    { userId, limit, offset },
    { skip: !userId }
  )

  // Extract bets and pagination info from response
  const bets = useMemo(() => {
    if (!betsData) return []
    const root = betsData as any
    if (root.success && Array.isArray(root.data)) {
      return root.data
    } else if (Array.isArray(root)) {
      return root
    }
    return []
  }, [betsData])

  const paginationInfo = useMemo(() => {
    if (!betsData) return null
    const root = betsData as any
    return {
      count: root.count || 0,
      total: root.total || 0,
      limit: root.limit || limit,
      offset: root.offset || offset,
      hasMore: root.hasMore || false
    }
  }, [betsData, limit, offset])

  // Filter bets by status based on active tab
  const filteredBets = useMemo(() => {
    if (activeTab === "Current") {
      return bets.filter((bet: any) => bet.status === "PENDING")
    } else {
      return bets.filter((bet: any) => bet.status !== "PENDING")
    }
  }, [bets, activeTab])

  // Reset offset when tab changes
  useEffect(() => {
    setOffset(0)
  }, [activeTab])

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setOffset(0) // Reset to first page when changing limit
  }

  const summaryInfo = useMemo(() => {
    if (!betsData) return null
    const root = betsData as any
    const userSummary = root.user || root.data?.user
    if (!userSummary) return null

    const balance = Number(userSummary.balance ?? 0)
    const liability = Number(userSummary.liability ?? 0)
    const inAmount = Number(userSummary.in ?? 0)
    const outAmount = Number(userSummary.out ?? 0)
    const netPnl = inAmount - outAmount

    return { balance, liability, inAmount, outAmount, netPnl }
  }, [betsData])

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const cashHistory = useMemo(() => {
    if (!betsData) return []
    const root = betsData as any
    const items = root.cashHistory || root.data?.cashHistory || []
    if (!Array.isArray(items)) return []
    // Sort descending by date (latest first)
    return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [betsData])

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'WON':
        return 'text-green-600 font-bold'
      case 'LOST':
        return 'text-red-600 font-bold'
      case 'PENDING':
        return 'text-yellow-600 font-bold'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-black text-white px-4 py-1">
        <h1 className="text-base font-normal">Bet History</h1>
      </div>

      {/* Summary strip + cash history */}
      {(summaryInfo || cashHistory.length > 0) && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 sm:py-3 space-y-2 sm:space-y-3">
          {summaryInfo && (
            <div className="flex flex-wrap gap-3 sm:gap-6 text-[11px] sm:text-xs md:text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Balance:</span>
                <span className="font-bold text-green-600">
                  Rs {formatCurrency(summaryInfo.balance)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Liability:</span>
                <span className="font-bold text-red-600">
                  Rs {formatCurrency(summaryInfo.liability)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">In:</span>
                <span className="font-bold text-blue-600">
                  Rs {formatCurrency(summaryInfo.inAmount)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Out:</span>
                <span className="font-bold text-amber-700">
                  Rs {formatCurrency(summaryInfo.outAmount)}
                </span>
              </div>
              {/* <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Net P/L:</span>
                <span
                  className={`font-bold ${
                    summaryInfo.netPnl >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Rs {formatCurrency(summaryInfo.netPnl)}
                </span>
              </div> */}
            </div>
          )}

          {cashHistory.length > 0 && (
            <div className="border-t border-gray-200 pt-2 mt-1">
              <h2 className="text-[11px] sm:text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                Cash History
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-[320px] w-full text-[10px] sm:text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-bold text-gray-700">Date</th>
                      <th className="px-2 py-1.5 text-left font-bold text-gray-700">Type</th>
                      <th className="px-2 py-1.5 text-right font-bold text-gray-700">Amount</th>
                      <th className="px-2 py-1.5 text-left font-bold text-gray-700">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashHistory.map((entry: any) => (
                      <tr key={entry.id} className="border-t border-gray-100">
                        <td className="px-2 py-1.5 text-gray-800 whitespace-nowrap">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-2 py-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              (entry.type || "").toUpperCase() === "IN"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {(entry.type || "").toUpperCase() || "N/A"}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right font-bold text-gray-900">
                          Rs {formatCurrency(Number(entry.amount || 0))}
                        </td>
                        <td
                          className="px-2 py-1.5 text-gray-700 max-w-[160px] truncate"
                          title={entry.remarks || ""}
                        >
                          {entry.remarks || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Tab Navigation */}
      <div className="bg-gray-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab("Current")}
            className={`px-6 py-2 text-sm font-bold ${
              activeTab === "Current" 
                ? "bg-[#00A66E] text-white" 
                : "text-white hover:bg-gray-700"
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setActiveTab("Past")}
            className={`px-6 py-2 text-sm font-bold ${
              activeTab === "Past" 
                ? "bg-[#00A66E] text-white" 
                : "text-white hover:bg-gray-700"
            }`}
          >
            Past
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white mx-0 sm:mx-0 shadow-sm rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  #
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Match Name
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Market Name
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Selection Name
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Odds
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Stack
                </th>

                {/* <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Exposure
                </th> */}
                {/* <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Profit
                </th> */}
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Bet Type
                </th>
                {/* <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Ip Address
                </th> */}
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                {/* <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#00A66E]" />
                    <p className="text-gray-500 mt-2">Loading bet history...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-red-500">
                    Error loading bet history. Please try again.
                  </td>
                </tr>
              ) : filteredBets.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                    No Record Found
                  </td>
                </tr>
              ) : (
                filteredBets.map((bet: any, index: number) => {
                  // Find original index in full bets array for accurate row numbering
                  const originalIndex = bets.findIndex((b: any) => b.id === bet.id)
                  const rowNumber = originalIndex >= 0 ? offset + originalIndex + 1 : offset + index + 1
                  
                  return (
                  <tr key={bet.id || index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs text-gray-900">{rowNumber}</td>
                    <td className="px-3 py-2 text-xs text-gray-900">
                      {bet.match?.homeTeam || bet.match?.eventName || bet.matchId || 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900">{bet.marketName || 'N/A'}</td>
                    <td className="px-3 py-2 text-xs text-gray-900">{bet.betName || 'N/A'}</td>
                    <td className="px-3 py-2 text-xs text-gray-900">{bet.betRate || bet.odds || 'N/A'}</td>
                    <td className="px-3 py-2 text-xs text-gray-900">
                      Rs {(bet.betValue || bet.amount || 0).toLocaleString()}
                    </td>
                    {/* <td className="px-3 py-2 text-xs text-gray-900">
                      Rs {((bet.winAmount || 0) + (bet.lossAmount || 0)).toLocaleString()}
                    </td> */}
                    {/* <td className={`px-3 py-2 text-xs ${(bet.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {bet.pnl !== undefined && bet.pnl !== null ? `Rs ${bet.pnl.toLocaleString()}` : 'Rs 0'}
                    </td> */}
                    <td className="px-3 py-2 text-xs text-gray-900">
                      {bet.user?.name || bet.user?.username || 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        bet.betType === 'BACK' 
                          ? 'bg-[#AEDBFB] text-blue-800' 
                          : 'bg-pink-100 text-pink-800'
                      }`}>
                        {bet.betType || 'N/A'}
                      </span>
                    </td>
                    {/* <td className="px-3 py-2 text-xs text-gray-900">N/A</td> */}
                    <td className="px-3 py-2 text-xs text-gray-900">{formatDate(bet.createdAt)}</td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {paginationInfo && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Items per page:</span>
                <select 
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <span className="text-sm text-gray-700">
                Showing {paginationInfo.count > 0 ? offset + 1 : 0} to {Math.min(offset + paginationInfo.count, paginationInfo.total)} of {paginationInfo.total} results
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handlePageChange(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;&lt;&lt; Previous
              </Button>
              <Button 
                onClick={() => handlePageChange(offset + limit)}
                disabled={!paginationInfo.hasMore}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next &gt;&gt;&gt;
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
