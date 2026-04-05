'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useLazyGetUserQuery } from '@/app/services/Api'

interface ClientAccountStatementModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  username: string
}

export default function ClientAccountStatementModal({
  isOpen,
  onClose,
  userId,
  username
}: ClientAccountStatementModalProps) {
  const [showCashEntry, setShowCashEntry] = useState(true)
  const [showMarketPnl, setShowMarketPnl] = useState(true)
  const [showMarketCommission, setShowMarketCommission] = useState(false)
  const [showSessionPnl, setShowSessionPnl] = useState(false)
  const [showTossPnl, setShowTossPnl] = useState(false)
  const [betsPopoverIdx, setBetsPopoverIdx] = useState<number | null>(null)

  // Use lazy query for manual triggering
  const [triggerQuery, { data: statementData, isLoading, error, reset }] = useLazyGetUserQuery()

  // Build query params for statement (userId passed to fetch specific user's statement)
  const queryParams = useMemo(() => {
    if (!userId) return null
    
    const params: any = {
      type: 'statement',
      userId,
      showCashEntry: showCashEntry.toString(),
      showMarketPnl: showMarketPnl.toString(),
      showMarketCommission: showMarketCommission.toString(),
      showSessionPnl: showSessionPnl.toString(),
      showTossPnl: showTossPnl.toString()
    }
    return params
  }, [userId, showCashEntry, showMarketPnl, showMarketCommission, showSessionPnl, showTossPnl])

  // Track previous userId to detect changes
  const prevUserIdRef = useRef<string | null>(null)

  // Trigger query when modal opens or userId/filters change
  useEffect(() => {
    if (isOpen && userId && queryParams) {
      // If userId changed, reset first to clear old data
      if (prevUserIdRef.current !== null && prevUserIdRef.current !== userId) {
        reset()
      }
      prevUserIdRef.current = userId
      
      // Trigger query with fresh params
      triggerQuery(queryParams, true) // forceRefetch = true to bypass cache
    }
  }, [isOpen, userId, queryParams, triggerQuery, reset])

  // Reset data when modal closes or userId changes
  useEffect(() => {
    if (!isOpen) {
      reset()
      prevUserIdRef.current = null
    }
  }, [isOpen, reset])

  // Extract user info, statement (transactions), and bet history from response
  // Supports new format: { success, user: { id, openingBalance }, statement, pagination }
  // API returns array of [{ success, user, statement, pagination }, ...] - find the one matching userId
  const { userInfo, transactions } = useMemo(() => {
    if (!statementData || !userId) return { userInfo: null, transactions: [] }
    
    // New format: array of [{ success, user, statement, pagination }] - find matching user
    const items = Array.isArray(statementData) ? statementData : (statementData?.data && Array.isArray(statementData.data) ? statementData.data : [statementData])
    const resolved = items.find((item: any) => (item?.user?.id ?? item?.data?.user?.id) === userId)
    const data = resolved?.data || resolved
    
    if (resolved?.success && resolved?.user && Array.isArray(resolved?.statement)) {
      const u = resolved.user
      if (u.id !== userId) return { userInfo: null, transactions: [] }
      
      return {
        userInfo: {
          id: u.id,
          name: u.name || username,
          username: u.username || username,
          openingBalance: u.openingBalance,
          balance: u.openingBalance
        },
        transactions: resolved.statement
      }
    }
    
    // Legacy: array of user objects
    if (Array.isArray(statementData) && statementData.length > 0) {
      const userData = statementData.find((u: any) => u.id === userId) || statementData[0]
      if (userData.id !== userId) return { userInfo: null, transactions: [] }
      return {
        userInfo: userData,
        transactions: userData.transactions || []
      }
    }
    
    // Legacy: statementData.data
    if (statementData.data) {
      const d = statementData.data
      if (Array.isArray(d)) {
        const userData = d.find((u: any) => u.id === userId) || d[0]
        if (userData?.id !== userId) return { userInfo: null, transactions: [] }
        return {
          userInfo: userData,
          transactions: userData.transactions || []
        }
      }
      if (d.user && d.statement) {
        if (d.user.id !== userId) return { userInfo: null, transactions: [] }
        return {
          userInfo: { ...d.user, balance: d.user.openingBalance || d.user.balance },
          transactions: d.statement
        }
      }
      
      if (d.id === userId) {
        return {
          userInfo: d,
          transactions: d.transactions || []
        }
      }
    }
    
    // Legacy: single user object
    if (statementData.transactions && statementData.id === userId) {
      return {
        userInfo: statementData,
        transactions: statementData.transactions
      }
    }
    
      return { userInfo: null, transactions: [] }
  }, [statementData, userId, username])

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return ''
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return ''
    return numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Derive type from description: "Match Odds" -> MATCH, "Normal" -> SESSION
  const getStatementType = (description: string) => {
    const d = (description || '').toLowerCase()
    if (d.includes('match odds') || d.includes('match com')) return 'MATCH'
    if (d.includes('normal') || d.includes('fancy') || d.includes('session')) return 'SESSION'
    return d.includes('match') ? 'MATCH' : 'SESSION'
  }

  const getTypeColor = (type: string) => {
    const typeUpper = type?.toUpperCase() || ''
    if (typeUpper === 'MATCH') return 'bg-green-600 text-white'
    if (typeUpper === 'SESSION') return 'bg-amber-800 text-white'
    if (typeUpper === 'CASHIN') return 'bg-blue-600 text-white'
    if (typeUpper === 'CASHOUT') return 'bg-red-700 text-white'
    return 'bg-gray-600 text-white'
  }

  const getStatusColor = (status: string) => {
    const statusUpper = status?.toUpperCase() || ''
    if (statusUpper === 'WON') return 'bg-green-100 text-green-700'
    if (statusUpper === 'LOST') return 'bg-red-100 text-red-700'
    if (statusUpper === 'PENDING') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  const getBetTypeColor = (betType: string) => {
    const betTypeUpper = betType?.toUpperCase() || ''
    if (betTypeUpper === 'BACK') return 'bg-blue-100 text-blue-700'
    if (betTypeUpper === 'LAY') return 'bg-pink-100 text-pink-700'
    return 'bg-gray-100 text-gray-700'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-1 sm:p-2 md:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-full sm:max-w-6xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-black text-white px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xs sm:text-sm md:text-base font-bold">Client Account Statement</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Filters - match screenshot layout */}
        <div className="p-2 sm:p-3 md:p-4 border-b bg-gray-50 overflow-x-auto">
          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 items-center min-w-max">
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showCashEntry && showMarketPnl}
                onChange={(e) => { setShowCashEntry(e.target.checked); setShowMarketPnl(e.target.checked) }}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Show Cash Entry &amp; Market Profit &amp; Loss</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showCashEntry}
                onChange={(e) => setShowCashEntry(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Show Cash Entry</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showMarketCommission}
                onChange={(e) => setShowMarketCommission(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Market Commision</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showSessionPnl}
                onChange={(e) => setShowSessionPnl(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Session Profit &amp; Loss</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showTossPnl}
                onChange={(e) => setShowTossPnl(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Toss Profit &amp; Loss</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showMarketPnl}
                onChange={(e) => setShowMarketPnl(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Market Profit &amp; Loss</span>
            </label>
          </div>
        </div>

        {/* User Info */}
        {userInfo && (
          <div className="p-2 sm:p-3 md:p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs md:text-sm">
              <div className="truncate">
                <span className="text-gray-600">Name:</span>
                <span className="ml-1 sm:ml-2 font-bold truncate block">{userInfo.name || username}</span>
              </div>
              <div className="truncate">
                <span className="text-gray-600">User:</span>
                <span className="ml-1 sm:ml-2 font-bold truncate block">{userInfo.username || username}</span>
              </div>
              <div className="truncate">
                <span className="text-gray-600">Opening Balance:</span>
                <span className="ml-1 sm:ml-2 font-bold truncate block">{formatCurrency(userInfo.openingBalance ?? userInfo.balance)}</span>
              </div>
              <div className="truncate">
                <span className="text-gray-600">Balance:</span>
                <span className="ml-1 sm:ml-2 font-bold truncate block">{formatCurrency(userInfo.balance ?? userInfo.availableBalance)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs for Transactions and Bet History */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 sm:py-8 md:py-12">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 animate-spin text-[#00A66E]" />
              <span className="ml-2 sm:ml-3 text-[10px] sm:text-xs md:text-sm text-gray-600">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-6 sm:py-8 md:py-12">
              <div className="text-center">
                <p className="text-red-600 mb-2 text-xs sm:text-sm md:text-base">Error loading statement</p>
                <button
                  onClick={() => triggerQuery(queryParams)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base bg-[#00A66E] text-white rounded hover:bg-[#00b97b]"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Transactions Table - matches screenshot columns */}
              <div className="overflow-x-auto flex-1 relative">
                <table className="w-full text-[10px] sm:text-xs md:text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left font-bold text-gray-700">Date</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left font-bold text-gray-700">Type</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left font-bold text-gray-700">Description</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left font-bold text-gray-700">Win / Loss</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right font-bold text-gray-700">Decision Run</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right font-bold text-gray-700">Balance</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center font-bold text-gray-700">Bets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction: any, idx: number) => {
                        // New format: totalCredit, totalDebit, runningBalance, latestSettledAt, description, result, bets
                        // const credit = transaction.totalCredit ?? transaction.credit ?? transaction.cr ?? 0
                        // const debit = transaction.totalDebit ?? transaction.debit ?? transaction.dr ?? 0
                        const balance = transaction.runningBalance ?? transaction.balance ?? 0
                        const dateVal = transaction.latestSettledAt ?? transaction.date ?? transaction.createdAt
                        const typeVal = transaction.type ?? getStatementType(transaction.description || '')
                        const bets = transaction.bets || []
                        
                        return (
                          <tr key={transaction.marketId + '-' + transaction.selectionId + '-' + idx || idx} className="hover:bg-gray-50">
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-900 whitespace-nowrap">
                              {formatDate(dateVal)}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                              <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold ${getTypeColor(typeVal)}`}>
                                {typeVal || '-'}
                              </span>
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-700 max-w-[120px] sm:max-w-[200px] truncate" title={transaction.description || '-'}>
                              {transaction.description || transaction.desc || '-'}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                              {(() => {
                                const w = Number(transaction.win)
                                const l = Number(transaction.loss)
                                const hasWin = Number.isFinite(w) && w > 0
                                const hasLoss = Number.isFinite(l) && l > 0
                                if (hasWin) {
                                  return (
                                    <span className="font-bold text-green-600 whitespace-nowrap">
                                      {w.toFixed(2)}
                                    </span>
                                  )
                                }
                                if (hasLoss) {
                                  return (
                                    <span className="font-bold text-red-600 whitespace-nowrap">
                                      {l.toFixed(2)}
                                    </span>
                                  )
                                }
                                return <span className="text-gray-500">-</span>
                              })()}
                            </td>
                            {/* {/* <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right font-bold whitespace-nowrap text-green-600">
                              {credit > 0 ? formatCurrency(credit) : '0.00'}
                            </td> */}
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right font-bold whitespace-nowrap text-red-600">
                              {transaction.decisionRun}
                            </td> 
                            <td className={`px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right font-bold whitespace-nowrap ${
                              balance < 0 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {formatCurrency(balance)}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                              <button
                                type="button"
                                onClick={() => setBetsPopoverIdx(betsPopoverIdx === idx ? null : idx)}
                                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[9px] sm:text-[10px] font-bold rounded transition-colors"
                              >
                                Bets
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Bets detail modal - shows all bets for this marketId */}
        {betsPopoverIdx !== null && transactions[betsPopoverIdx] && (
          <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setBetsPopoverIdx(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">
                  Bets for Market ID: {transactions[betsPopoverIdx]?.marketId || '—'}
                </h3>
                <button onClick={() => setBetsPopoverIdx(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {(transactions[betsPopoverIdx]?.bets || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No bets for this entry</p>
                ) : (
                  <div className="space-y-3">
                    {(transactions[betsPopoverIdx]?.bets || []).map((bet: any, bi: number) => (
                      <div key={bet.id || bi} className="text-xs p-2 bg-gray-50 rounded border border-gray-100">
                        <span className={`px-2 py-0.5 rounded font-bold ${getBetTypeColor(bet.betType)}`}>{bet.betType}</span>
                        <div className="mt-1.5 grid grid-cols-2 gap-1 text-gray-700">
                          <span>Odds: {bet.odds}</span>
                          <span>Stake: {formatCurrency(bet.stake)}</span>
                          <span>P/L: <span className={bet.pnl >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{formatCurrency(bet.pnl)}</span></span>
                          <span>Status: {bet.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

