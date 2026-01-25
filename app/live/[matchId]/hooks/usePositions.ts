import { useEffect, useRef, useMemo, useCallback, useState } from 'react'

interface PositionsData {
  success?: boolean
  data?: {
    eventId?: string
    matchOdds?: Record<string, number>
    bookmaker?: Record<string, number>
    fancy?: Record<string, Record<string, number>>
  }
}

export interface OptimisticPosition {
  selectionId: string
  netValue: number
  marketType: 'matchOdds' | 'bookmaker' | 'fancy'
  fancyId?: string // Required for fancy markets
  fancyOutcome?: 'YES' | 'NO' // Required for fancy markets
}

export function usePositions(positionsData: PositionsData | undefined, matchId: string) {
  // State trigger to force useMemo recalculation when refs are updated
  const [positionsUpdateTrigger, setPositionsUpdateTrigger] = useState(0)
  
  // Stable positions state - persists across API updates (wallet-like behavior)
  const stablePositionsRef = useRef<{
    matchOdds: Record<string, number> // selectionId -> net
    bookmaker: Record<string, number> // selectionId -> net
    fancy: Record<string, Record<string, number>> // fancyId -> { YES/NO -> net }
    _lastMatchId?: string // Track last matchId to detect changes
  }>({
    matchOdds: {},
    bookmaker: {},
    fancy: {}
  })

  // Optimistic positions - stored separately, cleared when backend confirms
  const optimisticPositionsRef = useRef<{
    matchOdds: Record<string, number> // selectionId -> net
    bookmaker: Record<string, number> // selectionId -> net
    fancy: Record<string, Record<string, number>> // fancyId -> { YES/NO -> net }
  }>({
    matchOdds: {},
    bookmaker: {},
    fancy: {}
  })

  // Clear positions when matchId changes (prevent mixing positions across matches)
  useEffect(() => {
    stablePositionsRef.current.matchOdds = {}
    stablePositionsRef.current.bookmaker = {}
    stablePositionsRef.current.fancy = {}
    stablePositionsRef.current._lastMatchId = matchId
    // Also clear optimistic positions when match changes
    optimisticPositionsRef.current.matchOdds = {}
    optimisticPositionsRef.current.bookmaker = {}
    optimisticPositionsRef.current.fancy = {}
  }, [matchId])

  // Extract positions from API response - STABLE STATE (merges with existing, never clears)
  useEffect(() => {
    // Only update positions if API returns valid data
    if (positionsData?.success && positionsData?.data) {
      const data = positionsData.data

      // Extract matchOdds positions - already in normalized format: { [selectionId: string]: number }
      if (data.matchOdds && typeof data.matchOdds === 'object' && !Array.isArray(data.matchOdds)) {
        const matchOddsEntries = Object.entries(data.matchOdds)
        
        Object.entries(data.matchOdds).forEach(([selectionId, netValue]: [string, any]) => {
          const selectionIdStr = String(selectionId).trim()
          const selectionIdNum = Number(selectionId)
          
          if (netValue !== undefined && netValue !== null) {
            const numericValue = Number(netValue)
            
            // Store with the original string key (as backend provides) - this is the primary key
            stablePositionsRef.current.matchOdds[selectionIdStr] = numericValue
            
            // Also store with numeric string representation for compatibility
            // This ensures lookup works whether the key comes as "5728188" or 5728188
            if (!isNaN(selectionIdNum)) {
              const numericKeyStr = selectionIdNum.toString()
              // Only store with numeric key if it's different from the original string key
              // (to avoid duplicate storage when they're the same)
              if (numericKeyStr !== selectionIdStr) {
                stablePositionsRef.current.matchOdds[numericKeyStr] = numericValue
              }
            }
            
            // Backend reconciliation: Remove optimistic position if backend confirms this selectionId
            if (optimisticPositionsRef.current.matchOdds[selectionIdStr] !== undefined) {
              delete optimisticPositionsRef.current.matchOdds[selectionIdStr]
            }
          }
        })
        
        // Trigger useMemo recalculation after refs are updated
        setPositionsUpdateTrigger(prev => prev + 1)
      }

      // Extract bookmaker positions - same normalized format: { [selectionId: string]: number }
      if (data.bookmaker && typeof data.bookmaker === 'object') {
        Object.entries(data.bookmaker).forEach(([selectionId, netValue]: [string, any]) => {
          if (netValue !== undefined && netValue !== null) {
            const selectionIdStr = String(selectionId)
            stablePositionsRef.current.bookmaker[selectionIdStr] = Number(netValue)
            
            // Backend reconciliation: Remove optimistic position if backend confirms this selectionId
            if (optimisticPositionsRef.current.bookmaker[selectionIdStr] !== undefined) {
              delete optimisticPositionsRef.current.bookmaker[selectionIdStr]
            }
          }
        })
        
        // Trigger useMemo recalculation after refs are updated
        setPositionsUpdateTrigger(prev => prev + 1)
      }

      // Extract fancy positions - format: { [fancyId: string]: { YES: number, NO: number } }
      if (data.fancy && typeof data.fancy === 'object') {
        Object.entries(data.fancy).forEach(([fancyId, fancyPositions]: [string, any]) => {
          if (fancyPositions && typeof fancyPositions === 'object') {
            // Initialize fancy entry if not exists
            if (!stablePositionsRef.current.fancy[fancyId]) {
              stablePositionsRef.current.fancy[fancyId] = {}
            }
            
            // Extract YES/NO values directly - already numbers, no nested structure
            Object.entries(fancyPositions).forEach(([key, netValue]: [string, any]) => {
              if (netValue !== undefined && netValue !== null) {
                stablePositionsRef.current.fancy[fancyId][key] = Number(netValue)
                
                // Backend reconciliation: Remove optimistic position if backend confirms this fancyId + outcome
                if (optimisticPositionsRef.current.fancy[fancyId]?.[key] !== undefined) {
                  delete optimisticPositionsRef.current.fancy[fancyId][key]
                  // Clean up empty fancy entry
                  if (Object.keys(optimisticPositionsRef.current.fancy[fancyId]).length === 0) {
                    delete optimisticPositionsRef.current.fancy[fancyId]
                  }
                }
              }
            })
          }
        })
      }
    }
    // Note: We never clear positions even if API returns empty/partial response
  }, [positionsData])

  // Add optimistic position - called when user places a bet
  const addOptimisticPosition = useCallback((position: OptimisticPosition) => {
    const { selectionId, netValue, marketType, fancyId, fancyOutcome } = position
    
    if (marketType === 'matchOdds' || marketType === 'bookmaker') {
      // For matchOdds and bookmaker: use selectionId as key
      optimisticPositionsRef.current[marketType][String(selectionId)] = Number(netValue)
    } else if (marketType === 'fancy' && fancyId && fancyOutcome) {
      // For fancy: use fancyId and outcome (YES/NO) as keys
      if (!optimisticPositionsRef.current.fancy[fancyId]) {
        optimisticPositionsRef.current.fancy[fancyId] = {}
      }
      optimisticPositionsRef.current.fancy[fancyId][fancyOutcome] = Number(netValue)
    }
  }, [])

  // Memoized positions for rendering - merges backend (stable) with optimistic positions
  // Backend positions take precedence when both exist (seamless replacement)
  const positionsByMarketType = useMemo(() => {
    // Merge backend positions with optimistic positions
    // Backend takes precedence (seamless replacement when backend confirms)
    const mergedMatchOdds = {
      ...optimisticPositionsRef.current.matchOdds, // Optimistic first (will be overridden by backend)
      ...stablePositionsRef.current.matchOdds // Backend takes precedence
    }
    
    const mergedBookmaker = {
      ...optimisticPositionsRef.current.bookmaker,
      ...stablePositionsRef.current.bookmaker
    }
    
    // Merge fancy positions
    const mergedFancy: Record<string, Record<string, number>> = {}
    
    // Add all optimistic fancy positions
    Object.entries(optimisticPositionsRef.current.fancy).forEach(([fancyId, outcomes]) => {
      mergedFancy[fancyId] = { ...outcomes }
    })
    
    // Override with backend fancy positions (backend takes precedence)
    Object.entries(stablePositionsRef.current.fancy).forEach(([fancyId, outcomes]) => {
      if (!mergedFancy[fancyId]) {
        mergedFancy[fancyId] = {}
      }
      Object.entries(outcomes).forEach(([outcome, value]) => {
        mergedFancy[fancyId][outcome] = value
      })
    })
    
    return {
      matchOdds: mergedMatchOdds,
      bookmaker: mergedBookmaker,
      fancy: mergedFancy
    }
  }, [positionsData, positionsUpdateTrigger]) // Re-render when positionsData changes OR when refs are updated

  return {
    positionsByMarketType,
    addOptimisticPosition
  }
}

