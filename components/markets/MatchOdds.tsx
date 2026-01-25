'use client'

import { Pin, RefreshCw, CheckCircle } from 'lucide-react'
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
  positions?: Record<string, number> // selectionId -> net (final P/L if that runner wins)
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
              <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 w-20 sm:w-24">
                Team
              </th>
              {Array.from({ length: BACK_COLUMNS }).map((_, i) => (
                <th 
                  key={`back-${i}`} 
                  className="px-1 py-1.5 text-center text-xs font-semibold text-gray-700 w-[70px] sm:w-[75px]"
                >
                  Back
                </th>
              ))}
              {Array.from({ length: LAY_COLUMNS }).map((_, i) => (
                <th 
                  key={`lay-${i}`} 
                  className="px-1 py-1.5 text-center text-xs font-semibold text-gray-700 w-[70px] sm:w-[75px]"
                >
                  Lay
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {market.rows.map((row, rowIndex) => {
              // POSITION MAPPING: Match positions ONLY by selectionId comparison
              // 
              // STRICT RULES:
              // 1. Position API response is the single source of truth
              //    - net value = final profit/loss if that team wins
              // 2. Map ONLY by selectionId:
              //    - row.selectionId comes from Match Detail API
              //    - Position API runner keys are selectionIds
              //    - Do NOT use marketId (unreliable, comes from Fancy API)
              // 3. Frontend must NOT: calculate, transform, invert, or infer values
              // 4. Display net exactly as provided:
              //    - net > 0 → green profit
              //    - net < 0 → red loss
              //    - net = 0 or undefined → show nothing
              // 5. Each match handled independently (no mixing across matches)
              // 
              // Matching logic: Try multiple key formats to handle string/number variations
              const selectionIdStr = row.selectionId ? String(row.selectionId).trim() : ''
              const selectionIdNum = row.selectionId ? Number(row.selectionId) : NaN
              
              // Try multiple lookup strategies
              let netValue: number | undefined = undefined
              
              if (positions && selectionIdStr && Object.keys(positions).length > 0) {
                // Strategy 1: Direct string key lookup (exact match)
                netValue = positions[selectionIdStr]
                
                // Strategy 2: If not found, try numeric string key
                if (netValue === undefined && !isNaN(selectionIdNum)) {
                  netValue = positions[selectionIdNum.toString()]
                }
                
                // Strategy 3: Try all keys and find matching numeric value (loose comparison)
                if (netValue === undefined && !isNaN(selectionIdNum)) {
                  const matchingKey = Object.keys(positions).find(key => {
                    const keyTrimmed = String(key).trim()
                    const keyNum = Number(keyTrimmed)
                    // Match if: exact string match, or numeric match, or trimmed string match
                    return (keyTrimmed === selectionIdStr) || 
                           (!isNaN(keyNum) && keyNum === selectionIdNum) ||
                           (key === selectionIdStr)
                  })
                  if (matchingKey) {
                    netValue = positions[matchingKey]
                  }
                }
                
                // Strategy 4: Try with trimmed keys (handle whitespace issues)
                if (netValue === undefined) {
                  const matchingKey = Object.keys(positions).find(key => {
                    return String(key).trim() === selectionIdStr || String(key).trim() === String(row.selectionId).trim()
                  })
                  if (matchingKey) {
                    netValue = positions[matchingKey]
                  }
                }
              }
              
              // DISPLAY: Show net value exactly as backend provides
              // No calculations, no transformations, no inference
              
              return (
              <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="px-2 py-2">
                  <div className="font-medium text-xs sm:text-sm text-gray-900 truncate">
                    {row.team}
                  </div>
                  {netValue !== undefined && netValue !== null && netValue !== 0 ? (
                    // Show net value badge - exactly as backend provides
                    <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold mt-1 border ${
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
                {/* Back Odds */}
                {row.back.map((option, optIndex) => {
                  const oddKey = `${marketIndex}-${rowIndex}-back-${optIndex}`
                  const isBlinking = blinkingOdds.has(oddKey)
                  return (
                    <td key={`back-${optIndex}`} className="px-1 py-1">
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
                        className={`w-full flex flex-col items-center justify-center py-1.5 px-2 rounded-md transition-all duration-150 ${
                          option.odds === '0' || option.amount === '0'
                            ? 'bg-gray-100 cursor-not-allowed'
                            : isBlinking
                            ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4] cursor-pointer shadow-sm'
                            : 'bg-blue-300 hover:bg-blue-100 cursor-pointer border border-blue-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="font-semibold text-xs sm:text-sm text-gray-900 leading-tight">{option.odds}</div>
                        <div className="text-[10px] text-gray-600 leading-tight mt-0.5">{option.amount}</div>
                      </div>
                    </td>
                  )
                })}
                {/* Lay Odds */}
                {row.lay.map((option, optIndex) => {
                  const oddKey = `${marketIndex}-${rowIndex}-lay-${optIndex}`
                  const isBlinking = blinkingOdds.has(oddKey)
                  return (
                    <td key={`lay-${optIndex}`} className="px-1 py-1">
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
                        className={`w-full flex flex-col items-center justify-center py-1.5 px-2 rounded-md transition-all duration-150 ${
                          option.odds === '0' || option.amount === '0'
                            ? 'bg-gray-100 cursor-not-allowed'
                            : isBlinking
                            ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4] cursor-pointer shadow-sm'
                            : 'bg-pink-200 hover:bg-pink-100 cursor-pointer border border-pink-200 hover:border-pink-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="font-semibold text-xs sm:text-sm text-gray-900 leading-tight">{option.odds}</div>
                        <div className="text-[10px] text-gray-600 leading-tight mt-0.5">{option.amount}</div>
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
      <div className="bg-red-50 border-t border-red-200 px-3 sm:px-4 py-0.5">
        <div className="flex items-center gap-2 text-red-700">
          <CheckCircle className="w-2 h-2 flex-shrink-0" />
          <span className="text-[0.8rem]">
          Wrong trades are void. Only profit bets apply
          </span>
        </div>
      </div>
    </div>
  )
}

