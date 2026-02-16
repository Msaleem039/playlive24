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
  const [activeTab, setActiveTab] = useState<'transactions' | 'betHistory'>('transactions')

  // Use lazy query for manual triggering
  const [triggerQuery, { data: statementData, isLoading, error, reset }] = useLazyGetUserQuery()

  // Build query params (without parentId for statement type as per user's previous feedback)
  // The API returns all subordinates' statements, we filter on frontend by userId
  const queryParams = useMemo(() => {
    if (!userId) return null
    
    const params: any = {
      type: 'statement',
      showCashEntry: showCashEntry.toString(),
      showMarketPnl: showMarketPnl.toString(),
      showMarketCommission: showMarketCommission.toString(),
      showSessionPnl: showSessionPnl.toString(),
      showTossPnl: showTossPnl.toString()
    }
    // Note: Not using parentId as per user's previous feedback
    // API returns all subordinates, we filter by userId on frontend
    
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

  // Extract user info, transactions, and bet history from response
  // Filter by userId to ensure we show only the relevant user's data
  const { userInfo, transactions, betHistory } = useMemo(() => {
    if (!statementData || !userId) return { userInfo: null, transactions: [], betHistory: [] }
    
    // Response is an array with user objects containing transactions
    if (Array.isArray(statementData) && statementData.length > 0) {
      // Find the user that matches the userId
      const userData = statementData.find((user: any) => user.id === userId) || statementData[0]
      
      // Double-check: only return data if it matches the requested userId
      if (userData.id !== userId) {
        return { userInfo: null, transactions: [], betHistory: [] }
      }
      
      return {
        userInfo: {
          id: userData.id,
          name: userData.name,
          username: userData.username,
          role: userData.role,
          balance: userData.balance,
          liability: userData.liability,
          availableBalance: userData.availableBalance,
          profitLoss: userData.profitLoss,
          plCash: userData.plCash,
          commissionPercentage: userData.commissionPercentage,
          isActive: userData.isActive
        },
        transactions: userData.transactions || [],
        betHistory: userData.betHistory?.data || userData.betHistory || []
      }
    }
    
    // Fallback for other response structures
    if (statementData.data) {
      if (Array.isArray(statementData.data) && statementData.data.length > 0) {
        // Find the user that matches the userId
        const userData = statementData.data.find((user: any) => user.id === userId) || statementData.data[0]
        
        // Double-check: only return data if it matches the requested userId
        if (userData.id !== userId) {
          return { userInfo: null, transactions: [], betHistory: [] }
        }
        
        return {
          userInfo: userData,
          transactions: userData.transactions || [],
          betHistory: userData.betHistory?.data || userData.betHistory || []
        }
      }
      if (statementData.data.transactions) {
        // Single user object
        if (statementData.data.id === userId) {
          return {
            userInfo: statementData.data,
            transactions: statementData.data.transactions,
            betHistory: statementData.data.betHistory?.data || statementData.data.betHistory || []
          }
        }
      }
    }
    
    // Single user object response
    if (statementData.transactions && statementData.id === userId) {
      return {
        userInfo: statementData,
        transactions: statementData.transactions,
        betHistory: statementData.betHistory?.data || statementData.betHistory || []
      }
    }
    
    return { userInfo: null, transactions: [], betHistory: [] }
  }, [statementData, userId])

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

  const getTypeColor = (type: string) => {
    const typeUpper = type?.toUpperCase() || ''
    if (typeUpper === 'MATCH') return 'bg-green-100 text-green-700'
    if (typeUpper === 'SESSION') return 'bg-green-100 text-green-700'
    if (typeUpper === 'CASHIN') return 'bg-blue-100 text-blue-700'
    if (typeUpper === 'CASHOUT') return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-700'
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
          <h2 className="text-xs sm:text-sm md:text-base font-semibold">Client Account Statement</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-2 sm:p-3 md:p-4 border-b bg-gray-50 overflow-x-auto">
          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 items-center min-w-max">
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showCashEntry}
                onChange={(e) => setShowCashEntry(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Cash Entry</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showMarketPnl}
                onChange={(e) => setShowMarketPnl(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Market P/L</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showMarketCommission}
                onChange={(e) => setShowMarketCommission(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Market Comm</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showSessionPnl}
                onChange={(e) => setShowSessionPnl(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Session P/L</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showTossPnl}
                onChange={(e) => setShowTossPnl(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Toss P/L</span>
            </label>
          </div>
        </div>

        {/* User Info */}
        {userInfo && (
          <div className="p-2 sm:p-3 md:p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs md:text-sm">
              <div className="truncate">
                <span className="text-gray-600">Name:</span>
                <span className="ml-1 sm:ml-2 font-semibold truncate block">{userInfo.name || username}</span>
              </div>
              <div className="truncate">
                <span className="text-gray-600">User:</span>
                <span className="ml-1 sm:ml-2 font-semibold truncate block">{userInfo.username || username}</span>
              </div>
              <div className="truncate">
                <span className="text-gray-600">Balance:</span>
                <span className="ml-1 sm:ml-2 font-semibold truncate block">{formatCurrency(userInfo.balance)}</span>
              </div>
              <div className="truncate">
                <span className="text-gray-600">Available:</span>
                <span className="ml-1 sm:ml-2 font-semibold truncate block">{formatCurrency(userInfo.availableBalance)}</span>
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
              {/* Tabs */}
              <div className="flex border-b bg-gray-50">
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                    activeTab === 'transactions' ? 'border-[#00A66E] text-[#00A66E]' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Transactions
                </button>
                <button
                  onClick={() => setActiveTab('betHistory')}
                  className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                    activeTab === 'betHistory' ? 'border-[#00A66E] text-[#00A66E]' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bet History ({betHistory.length})
                </button>
              </div>

              {/* Transactions Table */}
              {activeTab === 'transactions' && (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Result</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">CR</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">DR</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction: any, idx: number) => {
                        const credit = transaction.credit || transaction.cr || 0
                        const debit = transaction.debit || transaction.dr || 0
                        const balance = transaction.balance || 0
                        
                        return (
                          <tr key={transaction.id || idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                              {formatDate(transaction.date || transaction.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(transaction.type)}`}>
                                {transaction.type || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {transaction.description || transaction.desc || '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {transaction.result !== null && transaction.result !== undefined ? transaction.result : '-'}
                            </td>
                            <td className="px-4 py-3 text-right text-green-600 font-semibold whitespace-nowrap">
                              {credit > 0 ? formatCurrency(credit) : credit === 0 ? '0.00' : ''}
                            </td>
                            <td className="px-4 py-3 text-right text-red-600 font-semibold whitespace-nowrap">
                              {debit > 0 ? formatCurrency(debit) : debit === 0 ? '0.00' : ''}
                            </td>
                            <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                              balance < 0 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {formatCurrency(balance)}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              )}

              {/* Bet History Table */}
              {activeTab === 'betHistory' && (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-[10px] sm:text-xs md:text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Date</th>
                      <th className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Bet Name</th>
                      <th className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Type</th>
                      <th className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Market</th>
                      <th className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-right font-semibold text-gray-700 whitespace-nowrap">Amount</th>
                      <th className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-right font-semibold text-gray-700 whitespace-nowrap">Odds</th>
                      <th className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Status</th>
                      <th className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-right font-semibold text-gray-700 whitespace-nowrap">P/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {betHistory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 text-center text-gray-500 text-xs sm:text-sm">
                          No bet history found
                        </td>
                      </tr>
                    ) : (
                      betHistory.map((bet: any, idx: number) => {
                        const pnl = bet.pnl || 0
                        return (
                          <tr key={bet.id || idx} className="hover:bg-gray-50">
                            <td className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-gray-900 whitespace-nowrap">
                              <span className="text-[9px] sm:text-[10px] md:text-xs">{formatDate(bet.createdAt || bet.settledAt)}</span>
                            </td>
                            <td className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-gray-700 max-w-[80px] sm:max-w-[120px] md:max-w-none truncate">
                              {bet.betName || '-'}
                            </td>
                            <td className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2">
                              <span className={`px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] md:text-xs font-semibold ${getBetTypeColor(bet.betType)}`}>
                                {bet.betType || '-'}
                              </span>
                            </td>
                            <td className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-gray-700 max-w-[60px] sm:max-w-[100px] md:max-w-none truncate">
                              {bet.marketName || bet.marketType || '-'}
                            </td>
                            <td className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-right font-semibold whitespace-nowrap">
                              {formatCurrency(bet.amount || bet.betValue)}
                            </td>
                            <td className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-right font-semibold whitespace-nowrap">
                              {bet.odds || bet.betRate || '-'}
                            </td>
                            <td className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2">
                              <span className={`px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] md:text-xs font-semibold ${getStatusColor(bet.status)}`}>
                                {bet.status || '-'}
                              </span>
                            </td>
                            <td className={`px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-right font-semibold whitespace-nowrap ${
                              pnl >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(pnl)}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

