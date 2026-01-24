import { useState, useEffect, useRef } from 'react'
import type { BettingMarket } from '../types'

export function useOddsBlinking(bettingMarkets: BettingMarket[]) {
  const [blinkingOdds, setBlinkingOdds] = useState<Set<string>>(new Set())
  const previousOddsRef = useRef<Map<string, { odds: string; amount: string }>>(new Map())

  // Detect odds changes and trigger blink animation
  useEffect(() => {
    if (!bettingMarkets || bettingMarkets.length === 0) return

    const changedOddsKeys = new Set<string>()
    const currentOddsMap = new Map<string, { odds: string; amount: string }>()

    // Build current odds map and detect changes
    bettingMarkets.forEach((market, marketIndex) => {
      market.rows.forEach((row, rowIndex) => {
        // Track back odds
        row.back.forEach((option, optIndex) => {
          const key = `${marketIndex}-${rowIndex}-back-${optIndex}`
          currentOddsMap.set(key, { odds: option.odds.toString(), amount: option.amount.toString() })
          
          const previous = previousOddsRef.current.get(key)
          if (previous && (previous.odds !== option.odds.toString() || previous.amount !== option.amount.toString())) {
            changedOddsKeys.add(key)
          }
        })
        
        // Track lay odds
        row.lay.forEach((option, optIndex) => {
          const key = `${marketIndex}-${rowIndex}-lay-${optIndex}`
          currentOddsMap.set(key, { odds: option.odds.toString(), amount: option.amount.toString() })
          
          const previous = previousOddsRef.current.get(key)
          if (previous && (previous.odds !== option.odds.toString() || previous.amount !== option.amount.toString())) {
            changedOddsKeys.add(key)
          }
        })
      })
    })

    // Update blinking odds if there are changes
    if (changedOddsKeys.size > 0) {
      setBlinkingOdds(new Set(changedOddsKeys))
      
      // Remove blink animation after 2 seconds
      setTimeout(() => {
        setBlinkingOdds((prev) => {
          const updated = new Set(prev)
          changedOddsKeys.forEach(key => updated.delete(key))
          return updated
        })
      }, 2000)
    }

    // Update previous odds reference
    previousOddsRef.current = currentOddsMap
  }, [bettingMarkets])

  return blinkingOdds
}


