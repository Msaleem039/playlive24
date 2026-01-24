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
    console.log('[Positions] Match changed, clearing positions:', { matchId, previousMatchId: stablePositionsRef.current._lastMatchId })
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
    console.log('🔵 [Positions] ========== RAW API RESPONSE ==========', {
      hasData: !!positionsData,
      success: positionsData?.success,
      fullResponse: JSON.stringify(positionsData, null, 2),
      eventId: positionsData?.data?.eventId,
      matchOdds: positionsData?.data?.matchOdds,
      matchOddsKeys: positionsData?.data?.matchOdds ? Object.keys(positionsData.data.matchOdds) : [],
      matchOddsValues: positionsData?.data?.matchOdds ? Object.values(positionsData.data.matchOdds) : []
    })

    // Only update positions if API returns valid data
    if (positionsData?.success && positionsData?.data) {
      const data = positionsData.data
      
      console.log('🟢 [Positions] Processing positions data - VALID RESPONSE:', {
        hasMatchOdds: !!data.matchOdds,
        matchOddsType: typeof data.matchOdds,
        matchOddsIsArray: Array.isArray(data.matchOdds),
        matchOddsValue: data.matchOdds,
        matchOddsStringified: JSON.stringify(data.matchOdds),
        hasBookmaker: !!data.bookmaker,
        bookmakerType: typeof data.bookmaker,
        bookmakerValue: data.bookmaker,
        hasFancy: !!data.fancy,
        fancyType: typeof data.fancy
      })

      // Extract matchOdds positions - already in normalized format: { [selectionId: string]: number }
      if (data.matchOdds && typeof data.matchOdds === 'object' && !Array.isArray(data.matchOdds)) {
        const backendSelectionIds = Object.keys(data.matchOdds)
        const matchOddsEntries = Object.entries(data.matchOdds)
        
        console.log('🟡 [Positions] Extracting matchOdds positions:', {
          backendSelectionIds: backendSelectionIds,
          backendSelectionIdsTypes: backendSelectionIds.map(id => ({ id, type: typeof id })),
          backendEntries: matchOddsEntries,
          backendEntriesCount: matchOddsEntries.length,
          currentStableKeys: Object.keys(stablePositionsRef.current.matchOdds),
          currentStableValues: Object.values(stablePositionsRef.current.matchOdds),
          willExtract: matchOddsEntries.length > 0
        })
        
        // CRITICAL: Only proceed if we have actual entries to extract
        if (matchOddsEntries.length === 0) {
          console.warn('⚠️ [Positions] matchOdds object exists but has no entries:', {
            matchOdds: data.matchOdds,
            matchOddsType: typeof data.matchOdds,
            matchOddsKeys: Object.keys(data.matchOdds),
            matchOddsStringified: JSON.stringify(data.matchOdds)
          })
        }
        
        Object.entries(data.matchOdds).forEach(([selectionId, netValue]: [string, any]) => {
          const originalSelectionId = selectionId
          const selectionIdStr = String(selectionId).trim()
          const selectionIdNum = Number(selectionId)
          
          console.log('🔍 [Positions] Processing individual matchOdds entry:', {
            originalSelectionId,
            selectionIdStr,
            selectionIdNum,
            netValue,
            netValueType: typeof netValue,
            netValueNumber: Number(netValue),
            isValid: netValue !== undefined && netValue !== null
          })
          
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
              console.log('✅ [Positions] Backend confirmed matchOdds position, removing optimistic:', {
                selectionId: selectionIdStr,
                optimisticValue: optimisticPositionsRef.current.matchOdds[selectionIdStr],
                backendValue: Number(netValue)
              })
              delete optimisticPositionsRef.current.matchOdds[selectionIdStr]
            }
            
            console.log('💾 [Positions] Stored matchOdds position:', {
              selectionId: selectionIdStr,
              net: Number(netValue),
              stored: stablePositionsRef.current.matchOdds[selectionIdStr],
              allStoredKeys: Object.keys(stablePositionsRef.current.matchOdds)
            })
          } else {
            console.warn('⚠️ [Positions] Skipping matchOdds position - invalid value:', {
              selectionId,
              netValue,
              type: typeof netValue
            })
          }
        })
        
        console.log('📊 [Positions] Final matchOdds positions after extraction:', {
          allPositions: stablePositionsRef.current.matchOdds,
          allPositionsStringified: JSON.stringify(stablePositionsRef.current.matchOdds),
          keys: Object.keys(stablePositionsRef.current.matchOdds),
          keysTypes: Object.keys(stablePositionsRef.current.matchOdds).map(k => ({ key: k, type: typeof k })),
          values: Object.values(stablePositionsRef.current.matchOdds),
          count: Object.keys(stablePositionsRef.current.matchOdds).length,
          remainingOptimistic: Object.keys(optimisticPositionsRef.current.matchOdds).length,
          optimisticKeys: Object.keys(optimisticPositionsRef.current.matchOdds)
        })
        
        // Trigger useMemo recalculation after refs are updated
        setPositionsUpdateTrigger(prev => prev + 1)
      } else {
        console.warn('⚠️ [Positions] No matchOdds data to extract:', {
          hasMatchOdds: !!data.matchOdds,
          type: typeof data.matchOdds,
          isArray: Array.isArray(data.matchOdds),
          value: data.matchOdds
        })
      }

      // Extract bookmaker positions - same normalized format: { [selectionId: string]: number }
      if (data.bookmaker && typeof data.bookmaker === 'object') {
        console.log('[Positions] Extracting bookmaker positions:', {
          bookmakerKeys: Object.keys(data.bookmaker),
          bookmakerEntries: Object.entries(data.bookmaker)
        })
        
        Object.entries(data.bookmaker).forEach(([selectionId, netValue]: [string, any]) => {
          if (netValue !== undefined && netValue !== null) {
            const selectionIdStr = String(selectionId)
            stablePositionsRef.current.bookmaker[selectionIdStr] = Number(netValue)
            
            // Backend reconciliation: Remove optimistic position if backend confirms this selectionId
            if (optimisticPositionsRef.current.bookmaker[selectionIdStr] !== undefined) {
              console.log('[Positions] Backend confirmed bookmaker position, removing optimistic:', {
                selectionId: selectionIdStr,
                optimisticValue: optimisticPositionsRef.current.bookmaker[selectionIdStr],
                backendValue: Number(netValue)
              })
              delete optimisticPositionsRef.current.bookmaker[selectionIdStr]
            }
            
            console.log('[Positions] Stored bookmaker position:', {
              selectionId: selectionIdStr,
              net: Number(netValue)
            })
          }
        })
        
        console.log('[Positions] Final bookmaker positions after extraction:', {
          allPositions: stablePositionsRef.current.bookmaker,
          keys: Object.keys(stablePositionsRef.current.bookmaker),
          remainingOptimistic: Object.keys(optimisticPositionsRef.current.bookmaker).length
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
                  console.log('[Positions] Backend confirmed fancy position, removing optimistic:', {
                    fancyId,
                    outcome: key,
                    optimisticValue: optimisticPositionsRef.current.fancy[fancyId][key],
                    backendValue: Number(netValue)
                  })
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
    
    console.log('[Positions] Adding optimistic position:', {
      selectionId,
      netValue,
      marketType,
      fancyId,
      fancyOutcome
    })
    
    if (marketType === 'matchOdds' || marketType === 'bookmaker') {
      // For matchOdds and bookmaker: use selectionId as key
      optimisticPositionsRef.current[marketType][String(selectionId)] = Number(netValue)
      console.log('[Positions] Stored optimistic position:', {
        marketType,
        selectionId: String(selectionId),
        netValue: Number(netValue),
        allOptimistic: optimisticPositionsRef.current[marketType]
      })
    } else if (marketType === 'fancy' && fancyId && fancyOutcome) {
      // For fancy: use fancyId and outcome (YES/NO) as keys
      if (!optimisticPositionsRef.current.fancy[fancyId]) {
        optimisticPositionsRef.current.fancy[fancyId] = {}
      }
      optimisticPositionsRef.current.fancy[fancyId][fancyOutcome] = Number(netValue)
      console.log('[Positions] Stored optimistic fancy position:', {
        fancyId,
        outcome: fancyOutcome,
        netValue: Number(netValue),
        allOptimistic: optimisticPositionsRef.current.fancy[fancyId]
      })
    } else {
      console.warn('[Positions] Invalid optimistic position data:', position)
    }
  }, [])

  // Memoized positions for rendering - merges backend (stable) with optimistic positions
  // Backend positions take precedence when both exist (seamless replacement)
  const positionsByMarketType = useMemo(() => {
    console.log('🔄 [Positions] ========== MERGING POSITIONS FOR RENDERING ==========')
    console.log('📦 [Positions] Before merge - Stable (Backend):', {
      matchOdds: stablePositionsRef.current.matchOdds,
      matchOddsKeys: Object.keys(stablePositionsRef.current.matchOdds),
      matchOddsKeysTypes: Object.keys(stablePositionsRef.current.matchOdds).map(k => ({ key: k, type: typeof k, value: stablePositionsRef.current.matchOdds[k] })),
      matchOddsCount: Object.keys(stablePositionsRef.current.matchOdds).length
    })
    console.log('📦 [Positions] Before merge - Optimistic:', {
      matchOdds: optimisticPositionsRef.current.matchOdds,
      matchOddsKeys: Object.keys(optimisticPositionsRef.current.matchOdds),
      matchOddsCount: Object.keys(optimisticPositionsRef.current.matchOdds).length
    })
    
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
    
    const result = {
      matchOdds: mergedMatchOdds,
      bookmaker: mergedBookmaker,
      fancy: mergedFancy
    }
    
    console.log('✅ [Positions] ========== FINAL MERGED POSITIONS (RETURNED TO COMPONENT) ==========', {
      matchOdds: result.matchOdds,
      matchOddsStringified: JSON.stringify(result.matchOdds),
      matchOddsKeys: Object.keys(result.matchOdds),
      matchOddsKeysDetailed: Object.keys(result.matchOdds).map(k => ({
        key: k,
        keyType: typeof k,
        keyAsNumber: Number(k),
        value: result.matchOdds[k],
        valueType: typeof result.matchOdds[k],
        isNaN: isNaN(Number(k))
      })),
      matchOddsValues: Object.values(result.matchOdds),
      matchOddsCount: Object.keys(result.matchOdds).length,
      matchOddsOptimistic: Object.keys(optimisticPositionsRef.current.matchOdds).length,
      matchOddsBackend: Object.keys(stablePositionsRef.current.matchOdds).length,
      bookmaker: result.bookmaker,
      bookmakerKeys: Object.keys(result.bookmaker),
      bookmakerOptimistic: Object.keys(optimisticPositionsRef.current.bookmaker).length,
      bookmakerBackend: Object.keys(stablePositionsRef.current.bookmaker).length,
      fullResult: JSON.stringify(result, null, 2)
    })
    
    return result
  }, [positionsData, positionsUpdateTrigger]) // Re-render when positionsData changes OR when refs are updated

  return {
    positionsByMarketType,
    addOptimisticPosition
  }
}

