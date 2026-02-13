'use client'

import { useState, useMemo, useEffect } from 'react'
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

  // Use lazy query for manual triggering
  const [triggerQuery, { data: statementData, isLoading, error, reset }] = useLazyGetUserQuery()

  // Build query params (without parentId for statement type as per user's previous feedback)
  // Use userId parameter instead to fetch specific user's statement
  const queryParams = useMemo(() => {
    const params: any = {
      type: 'statement',
      showCashEntry: showCashEntry,
      showMarketPnl: showMarketPnl,
      showMarketCommission: showMarketCommission,
      showSessionPnl: showSessionPnl,
      showTossPnl: showTossPnl
    }
    // Include userId to fetch specific user's statement (not parentId as per previous feedback)
    if (userId) {
      params.userId = userId
    }
    return params
  }, [userId, showCashEntry, showMarketPnl, showMarketCommission, showSessionPnl, showTossPnl])

  // Trigger query when modal opens or userId/filters change
  useEffect(() => {
    if (isOpen && userId) {
      triggerQuery(queryParams)
    }
  }, [isOpen, userId, queryParams, triggerQuery])

  // Reset data when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  // Extract user info and transactions from response
  const { userInfo, transactions } = useMemo(() => {
    if (!statementData) return { userInfo: null, transactions: [] }
    
    // Response is an array with user object containing transactions
    if (Array.isArray(statementData) && statementData.length > 0) {
      const userData = statementData[0]
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
        transactions: userData.transactions || []
      }
    }
    
    // Fallback for other response structures
    if (statementData.data) {
      if (Array.isArray(statementData.data) && statementData.data.length > 0) {
        const userData = statementData.data[0]
        return {
          userInfo: userData,
          transactions: userData.transactions || []
        }
      }
      if (statementData.data.transactions) {
        return {
          userInfo: statementData.data,
          transactions: statementData.data.transactions
        }
      }
    }
    
    if (statementData.transactions) {
      return {
        userInfo: statementData,
        transactions: statementData.transactions
      }
    }
    
    return { userInfo: null, transactions: [] }
  }, [statementData])

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-black text-white px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Client Account Statement</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCashEntry}
                onChange={(e) => setShowCashEntry(e.target.checked)}
                className="w-4 h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-sm text-gray-700">Show Cash Entry</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMarketPnl}
                onChange={(e) => setShowMarketPnl(e.target.checked)}
                className="w-4 h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-sm text-gray-700">Market Profit & Loss</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMarketCommission}
                onChange={(e) => setShowMarketCommission(e.target.checked)}
                className="w-4 h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-sm text-gray-700">Market Commission</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSessionPnl}
                onChange={(e) => setShowSessionPnl(e.target.checked)}
                className="w-4 h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-sm text-gray-700">Session Profit & Loss</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showTossPnl}
                onChange={(e) => setShowTossPnl(e.target.checked)}
                className="w-4 h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-sm text-gray-700">Toss Profit & Loss</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCashEntry && showMarketPnl}
                onChange={(e) => {
                  setShowCashEntry(e.target.checked)
                  setShowMarketPnl(e.target.checked)
                }}
                className="w-4 h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-sm text-gray-700">Show Cash Entry & Market Profit & Loss</span>
            </label>
          </div>
        </div>

        {/* User Info */}
        {userInfo && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-semibold">{userInfo.name || username}</span>
              </div>
              <div>
                <span className="text-gray-600">Username:</span>
                <span className="ml-2 font-semibold">{userInfo.username || username}</span>
              </div>
              <div>
                <span className="text-gray-600">Balance:</span>
                <span className="ml-2 font-semibold">{formatCurrency(userInfo.balance)}</span>
              </div>
              <div>
                <span className="text-gray-600">Available Balance:</span>
                <span className="ml-2 font-semibold">{formatCurrency(userInfo.availableBalance)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#00A66E]" />
              <span className="ml-3 text-gray-600">Loading statement...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-red-600 mb-2">Error loading statement</p>
                <button
                  onClick={() => triggerQuery(queryParams)}
                  className="px-4 py-2 bg-[#00A66E] text-white rounded hover:bg-[#00b97b]"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
        </div>
      </div>
    </div>
  )
}

