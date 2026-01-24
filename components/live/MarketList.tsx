'use client'

import MatchOdds from '@/components/markets/MatchOdds'
import FancyDetail from '@/components/markets/FancyDetail'
import type { BettingMarket } from '@/app/live/[matchId]/types'

interface MarketListProps {
  markets: BettingMarket[]
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
    size?: number
  }) => void
  onRefresh?: () => void
  positionsByMarketType: {
    matchOdds: Record<string, number>
    bookmaker: Record<string, number>
    fancy: Record<string, Record<string, number>>
  }
}

export default function MarketList({
  markets,
  blinkingOdds,
  isMobile,
  onBetSelect,
  onRefresh,
  positionsByMarketType
}: MarketListProps) {
  return (
    <>
      {markets.map((market, marketIndex) => {
        // Determine if this is a match odds market or fancy market
        const marketName = (market.name || '').toUpperCase().trim()
        const marketType = (market.gtype || '').toLowerCase()
        // STRICT check: Only "MATCH_ODDS" or "MATCH ODDS" by name, not by type
        const isMatchOdds = marketName === 'MATCH_ODDS' || marketName === 'MATCH ODDS'
        const isFancy = marketType === 'fancy' || marketType === 'fancy2' || marketType === 'fancy1' || marketType === 'oddeven' || marketType === 'cricketcasino' || marketType === 'meter'
        
        // POSITION MAPPING: Pass normalized positions to MatchOdds component
        let positionsForMarket: Record<string, number> | undefined = undefined
        
        if (isMatchOdds) {
          // Match Odds: Pass normalized positions object
          positionsForMarket = positionsByMarketType.matchOdds
          
          console.log('🎯 [MarketList] ========== PASSING POSITIONS TO MATCHODDS ==========', {
            marketName: market.name,
            marketIndex,
            positions: positionsForMarket,
            positionsStringified: JSON.stringify(positionsForMarket, null, 2),
            positionsKeys: positionsForMarket ? Object.keys(positionsForMarket) : [],
            positionsKeysTypes: positionsForMarket ? Object.keys(positionsForMarket).map(k => ({
              key: k,
              type: typeof k,
              asNumber: Number(k),
              value: positionsForMarket![k],
              valueType: typeof positionsForMarket![k],
              isNaN: isNaN(Number(k))
            })) : [],
            positionsCount: positionsForMarket ? Object.keys(positionsForMarket).length : 0,
            marketRows: market.rows.map((r: any) => {
              const rowSelectionId = r.selectionId
              const rowSelectionIdStr = String(rowSelectionId)
              const rowSelectionIdNum = Number(rowSelectionId)
              const positionValue = positionsForMarket ? positionsForMarket[rowSelectionIdStr] : undefined
              const positionValueAlt = positionsForMarket && !isNaN(rowSelectionIdNum) ? positionsForMarket[String(rowSelectionIdNum)] : undefined
              const willMatch = positionValue !== undefined || positionValueAlt !== undefined
              
              // Log match prediction
              if (willMatch) {
                console.log('✅ [MarketList] PREDICTED MATCH for row:', {
                  team: r.team,
                  rowSelectionId,
                  rowSelectionIdStr,
                  positionValue,
                  positionValueAlt,
                  matchedKey: positionValue !== undefined ? rowSelectionIdStr : String(rowSelectionIdNum)
                })
              } else {
                console.warn('⚠️ [MarketList] PREDICTED NO MATCH for row:', {
                  team: r.team,
                  rowSelectionId,
                  rowSelectionIdStr,
                  availableKeys: positionsForMarket ? Object.keys(positionsForMarket) : [],
                  reason: positionsForMarket && Object.keys(positionsForMarket).length > 0
                    ? `Row selectionId "${rowSelectionIdStr}" not found in position keys: ${Object.keys(positionsForMarket).join(', ')}`
                    : 'No positions available'
                })
              }
              
              return {
                team: r.team,
                selectionId: rowSelectionId,
                selectionIdType: typeof rowSelectionId,
                selectionIdStr: rowSelectionIdStr,
                selectionIdNum: rowSelectionIdNum,
                positionValue: positionValue,
                positionValueAlt: positionValueAlt,
                willMatch: willMatch,
                allPositionKeys: positionsForMarket ? Object.keys(positionsForMarket) : [],
                matchDetails: positionsForMarket ? {
                  tryingKey: rowSelectionIdStr,
                  foundWithKey: positionValue !== undefined,
                  foundWithNumeric: positionValueAlt !== undefined,
                  availableKeys: Object.keys(positionsForMarket),
                  keyComparison: Object.keys(positionsForMarket).map(k => ({
                    key: k,
                    matches: k === rowSelectionIdStr || Number(k) === rowSelectionIdNum
                  }))
                } : null
              }
            })
          })
        } else if (marketType === 'match1' || marketType === 'bookmaker' || marketType === 'bookmatch') {
          // Bookmaker: Same normalized structure
          positionsForMarket = positionsByMarketType.bookmaker
          
          console.log('[Positions] Passing to Bookmaker component:', {
            marketName: market.name,
            marketIndex,
            positions: positionsForMarket,
            positionsKeys: positionsForMarket ? Object.keys(positionsForMarket) : []
          })
        }
        // Fancy markets: Do NOT pass positions (positions only in MatchOdds)
        
        // Use MatchOdds component for match odds markets
        if (isMatchOdds) {
          return (
            <MatchOdds
              key={marketIndex}
              market={market}
              marketIndex={marketIndex}
              blinkingOdds={blinkingOdds}
              isMobile={isMobile}
              onBetSelect={onBetSelect}
              onRefresh={onRefresh}
              positions={positionsForMarket}
            />
          )
        }

        // Use FancyDetail component for fancy markets
        if (isFancy) {
          return (
            <FancyDetail
              key={marketIndex}
              market={market}
              marketIndex={marketIndex}
              blinkingOdds={blinkingOdds}
              isMobile={isMobile}
              onBetSelect={onBetSelect}
            />
          )
        }

        // Fallback to MatchOdds for other markets (bookmaker, 1st Innings, Completed, etc.)
        return (
          <MatchOdds
            key={marketIndex}
            market={market}
            marketIndex={marketIndex}
            blinkingOdds={blinkingOdds}
            isMobile={isMobile}
            onBetSelect={onBetSelect}
            onRefresh={market.name === 'MATCH_ODDS' ? onRefresh : undefined}
            positions={positionsForMarket}
          />
        )
      })}
    </>
  )
}

