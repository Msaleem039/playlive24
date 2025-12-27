'use client'

import { memo } from 'react'
import { Pin } from 'lucide-react'
import type { BettingMarket } from '@/app/live/[matchId]/types'

interface FancyDetailProps {
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
    size?: number // For fancy markets: the percentage/size value (100, 90, 120, etc.)
  }) => void
}

const YES_COLUMNS = 1
const NO_COLUMNS = 1

// Performance: Memoize component to prevent unnecessary re-renders
const FancyDetail = memo(function FancyDetail({
  market,
  marketIndex,
  blinkingOdds,
  isMobile,
  onBetSelect
}: FancyDetailProps) {
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
          <span className="font-semibold text-xs sm:text-sm">
            {market.name}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-semibold">
            BOOK
          </button>
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
              {Array.from({ length: YES_COLUMNS }).map((_, i) => (
                <th 
                  key={`yes-${i}`} 
                  className="px-0.5 py-1.5 text-center text-xs font-semibold text-gray-700 w-[20px] sm:w-[20px]"
                >
                  Yes
                </th>
              ))}
              {Array.from({ length: NO_COLUMNS }).map((_, i) => (
                <th 
                  key={`lay-${i}`} 
                  className="px-0.5 py-1.5 text-center text-xs font-semibold text-gray-700 w-[20px] sm:w-[20px]"
                >
                  NO
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {market.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-0.5 py-0.5 font-medium text-xs sm:text-sm text-gray-900 truncate">
                  {row.team}
                </td>
                {/* Yes Odds */}
                {row.back.map((option, optIndex) => {
                  const oddKey = `${marketIndex}-${rowIndex}-back-${optIndex}`
                  const isBlinking = blinkingOdds.has(oddKey)
                  return (
                    <td key={`yes-${optIndex}`} className="px-0.5 py-0.5">
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
                              marketGType: market.gtype,
                              size: typeof option.amount === 'number' ? option.amount : parseFloat(String(option.amount)) || 100 // Pass size (percentage) for fancy market calculation
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
                {/* No Odds */}
                {row.lay.map((option, optIndex) => {
                  const oddKey = `${marketIndex}-${rowIndex}-lay-${optIndex}`
                  const isBlinking = blinkingOdds.has(oddKey)
                  return (
                    <td key={`no-${optIndex}`} className="px-0.5 py-0.5">
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
                              marketGType: market.gtype,
                              size: typeof option.amount === 'number' ? option.amount : parseFloat(String(option.amount)) || 100 // Pass size (percentage) for fancy market calculation
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

FancyDetail.displayName = 'FancyDetail'

export default FancyDetail

