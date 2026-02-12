'use client'

import { Pin, CheckCircle } from 'lucide-react'
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
  positions?: Record<string, number> // YES/NO -> net (outcome-based net value)
}

const YES_COLUMNS = 1
const NO_COLUMNS = 1

export default function FancyDetail({
  market,
  marketIndex,
  blinkingOdds,
  isMobile,
  onBetSelect,
  positions
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
        <table className="w-full text-[10px] sm:text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-1 sm:px-2 py-1 text-left text-[10px] sm:text-xs font-semibold text-gray-700 w-16 sm:w-20">
                Team
              </th>
              {Array.from({ length: NO_COLUMNS }).map((_, i) => (
                <th 
                  key={`no-${i}`} 
                  className="px-0.5 py-1 text-center text-[10px] sm:text-xs font-semibold text-gray-700 w-[50px] sm:w-[60px]"
                >
                  NO
                </th>
              ))}
              {Array.from({ length: YES_COLUMNS }).map((_, i) => (
                <th 
                  key={`yes-${i}`} 
                  className="px-0.5 py-1 text-center text-[10px] sm:text-xs font-semibold text-gray-700 w-[50px] sm:w-[60px]"
                >
                  Yes
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {market.rows.map((row, rowIndex) => {
              // FANCY DISPLAY RULE: Each YES/NO option shows its own outcome-based net value
              // Display each value ONLY under its own option - do NOT calculate or transform
              const positionKey = (row.team || '').toUpperCase().trim()
              const netValue = positions && positionKey ? positions[positionKey] : undefined
              
              // Split team text only on mobile if longer than 14 characters
              const teamText = row.team || ''
              const shouldSplit = isMobile && teamText.length > 14
              let firstLine = teamText
              let secondLine = ''
              
              if (shouldSplit) {
                // Try to split at word boundary around 14 characters
                const splitPoint = 14
                const beforeSplit = teamText.substring(0, splitPoint)
                const afterSplit = teamText.substring(splitPoint)
                
                // Look for last space before split point
                const lastSpaceIndex = beforeSplit.lastIndexOf(' ')
                if (lastSpaceIndex > 8) {
                  // Split at word boundary if it's not too early
                  firstLine = teamText.substring(0, lastSpaceIndex)
                  secondLine = teamText.substring(lastSpaceIndex + 1)
                } else {
                  // Split at character 14 if no good word boundary
                  firstLine = beforeSplit
                  secondLine = afterSplit
                }
              }
              
              return (
              <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-0.5 sm:px-1 py-0.5">
                  {shouldSplit ? (
                    // Two-line display for long text on mobile only
                    <div className="font-medium text-[10px] text-gray-900">
                      <div className="leading-tight break-words">{firstLine}</div>
                      <div className="leading-tight break-words">{secondLine}</div>
                    </div>
                  ) : (
                    // Single-line display for short text or desktop
                    <div className="font-medium text-[10px] sm:text-xs text-gray-900 truncate">
                      {row.team}
                    </div>
                  )}
                  {netValue !== undefined && netValue !== null && netValue !== 0 ? (
                    // Show net value badge - exactly as backend provides
                    <div className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold mt-0.5 border ${
                      netValue > 0
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : netValue < 0
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      {netValue > 0 ? '+' : ''}{netValue.toFixed(2)}
                    </div>
                  ) : null}
                </td>
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
                        className={`w-full flex flex-col items-center justify-center py-1 px-1 sm:py-1.5 sm:px-1.5 rounded transition-all duration-150 ${
                          option.odds === '0' || option.amount === '0'
                            ? 'bg-gray-100 cursor-not-allowed'
                            : isBlinking
                            ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4] cursor-pointer shadow-sm'
                            : 'bg-pink-200 hover:bg-pink-100 cursor-pointer border border-pink-200 hover:border-pink-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="font-semibold text-[10px] sm:text-xs text-gray-900 leading-tight">{option.odds}</div>
                        <div className="text-[9px] text-gray-600 leading-tight mt-0.5">{option.amount}</div>
                      </div>
                    </td>
                  )
                })}
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
                        className={`w-full flex flex-col items-center justify-center py-1 px-1 sm:py-1.5 sm:px-1.5 rounded transition-all duration-150 ${
                          option.odds === '0' || option.amount === '0'
                            ? 'bg-gray-100 cursor-not-allowed'
                            : isBlinking
                            ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4] cursor-pointer shadow-sm'
                            : 'bg-blue-300 hover:bg-blue-100 cursor-pointer border border-blue-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="font-semibold text-[10px] sm:text-xs text-gray-900 leading-tight">{option.odds}</div>
                        <div className="text-[9px] text-gray-600 leading-tight mt-0.5">{option.amount}</div>
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

      {/* Wrong Trade Warning */}
    
    </div>
  )
}

