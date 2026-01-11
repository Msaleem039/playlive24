'use client'

import { Pin, RefreshCw } from 'lucide-react'
import type { BettingMarket } from '@/app/live/[matchId]/types'

interface MatchOddsProps {
  market: BettingMarket
  marketIndex: number
  blinkingOdds: Set<string>
  isMobile: boolean
  onBetSelect: (bet: {
    team: string
    type: 'back' | 'lay'
    odds: string
    market: string
    selectionId?: number
    marketId?: number | string
    marketIdString?: string
    marketGType?: string
  }) => void
  onRefresh?: () => void
  positions?: Record<string, number | { profit: number; loss: number }>
}

const BACK_COLUMNS = 1
const LAY_COLUMNS = 1

export default function MatchOdds({
  market,
  marketIndex,
  blinkingOdds,
  isMobile,
  onBetSelect,
  onRefresh,
  positions
}: MatchOddsProps) {
  return (
    <div 
      className={`border-b border-gray-200 relative ${marketIndex === 0 ? 'border-t-0' : ''}`}
      style={{ 
        marginTop: marketIndex === 0 ? '0' : '0',
        marginBottom: '0',
        paddingTop: '0',
        paddingBottom: '0'
      }}
    >
      {/* Market Header */}
      <div className="bg-[#00A66E] text-white px-3 sm:px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pin className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="font-semibold text-xs sm:text-sm">{market.name}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-semibold">
            BOOK
          </button>
          {market.name === 'MATCH_ODDS' && onRefresh && (
            <button 
              onClick={onRefresh}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              {!isMobile && 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Betting Limits */}
      <div className="bg-gray-50 px-3 sm:px-4 py-1 text-xs text-gray-700 border-b">
        Min: {market.min.toLocaleString()} | Max: {market.max.toLocaleString()}
      </div>

      {/* Betting Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-1 sm:px-2 py-1.5 text-left text-xs font-semibold text-gray-700 w-16 sm:w-20">
                Team
              </th>
              {Array.from({ length: BACK_COLUMNS }).map((_, i) => (
                <th 
                  key={`back-${i}`} 
                  className="px-0.5 py-1.5 text-center text-xs font-semibold text-gray-700 w-[20px] sm:w-[20px]"
                >
                  Back
                </th>
              ))}
              {Array.from({ length: LAY_COLUMNS }).map((_, i) => (
                <th 
                  key={`lay-${i}`} 
                  className="px-0.5 py-1.5 text-center text-xs font-semibold text-gray-700 w-[20px] sm:w-[20px]"
                >
                  Lay
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {market.rows.map((row, rowIndex) => {
              // Get position for this team/runner
              const selectionIdStr = row.selectionId ? String(row.selectionId) : ''
              const positionValue = positions && selectionIdStr ? positions[selectionIdStr] : null
              
              // Handle both formats: number or { profit, loss } object
              // Calculate net position: if object format, use profit (net profit), otherwise use the number directly
              let netPosition: number | null = null
              
              if (positionValue != null) {
                if (typeof positionValue === 'object' && 'profit' in positionValue) {
                  // For object format: use profit value (which represents net profit/loss)
                  // profit shows the positive value, loss shows the negative value
                  // Display the profit if it exists and is non-zero, otherwise show loss
                  const profit = Number(positionValue.profit || 0)
                  const loss = Number(positionValue.loss || 0)
                  // Use profit if it's non-zero, otherwise use loss (which will be negative or zero)
                  netPosition = profit !== 0 ? profit : (loss !== 0 ? loss : 0)
                } else if (typeof positionValue === 'number') {
                  netPosition = positionValue
                }
              }
              
              // Show position if it's non-zero
              const hasPosition = netPosition !== null && netPosition !== 0
              
              return (
              <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-0.5 py-0.5">
                  <div className="font-medium text-xs sm:text-sm text-gray-900 truncate">
                    {row.team}
                  </div>
                  {hasPosition && (
                    <div className={`text-[10px] font-semibold mt-0.5 leading-tight ${
                      netPosition! >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {netPosition! >= 0 ? '+' : ''}{netPosition!.toFixed(2)}
                    </div>
                  )}
                </td>
                {/* Back Odds */}
                {row.back.map((option, optIndex) => {
                  const oddKey = `${marketIndex}-${rowIndex}-back-${optIndex}`
                  const isBlinking = blinkingOdds.has(oddKey)
                  return (
                    <td key={`back-${optIndex}`} className="px-0.5 py-0.5">
                      <div
                        onClick={() => {
                          if (option.odds !== '0' && option.amount !== '0') {
                            onBetSelect({
                              team: row.team,
                              type: 'back',
                              odds: option.odds.toString(),
                              market: market.name,
                              selectionId: row.selectionId,
                              marketId: market.marketId,
                              marketIdString: market.marketIdString,
                              marketGType: market.gtype
                            })
                          }
                        }}
                        className={`w-full flex flex-col items-center justify-center py-1 rounded transition-colors ${
                          option.odds === '0' || option.amount === '0'
                            ? 'bg-gray-100'
                            : isBlinking
                            ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4]'
                            : 'bg-blue-100 hover:bg-blue-200 cursor-pointer'
                        }`}
                      >
                        <div className="font-semibold text-xs text-gray-900">{option.odds}</div>
                        <div className="text-[10px] text-gray-600">{option.amount}</div>
                      </div>
                    </td>
                  )
                })}
                {/* Lay Odds */}
                {row.lay.map((option, optIndex) => {
                  const oddKey = `${marketIndex}-${rowIndex}-lay-${optIndex}`
                  const isBlinking = blinkingOdds.has(oddKey)
                  return (
                    <td key={`lay-${optIndex}`} className="px-0.5 py-0.5">
                      <div
                        onClick={() => {
                          if (option.odds !== '0' && option.amount !== '0') {
                            onBetSelect({
                              team: row.team,
                              type: 'lay',
                              odds: option.odds.toString(),
                              market: market.name,
                              selectionId: row.selectionId,
                              marketId: market.marketId,
                              marketIdString: market.marketIdString,
                              marketGType: market.gtype
                            })
                          }
                        }}
                        className={`w-full flex flex-col items-center justify-center py-1 rounded transition-colors ${
                          option.odds === '0' || option.amount === '0'
                            ? 'bg-gray-100'
                            : isBlinking
                            ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4]'
                            : 'bg-pink-100 hover:bg-pink-200 cursor-pointer'
                        }`}
                      >
                        <div className="font-semibold text-xs text-gray-900">{option.odds}</div>
                        <div className="text-[10px] text-gray-600">{option.amount}</div>
                      </div>
                    </td>
                  )
                })}
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

