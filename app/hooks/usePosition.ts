"use client"

import { useMemo } from "react"
import { calculatePositions, type Bet } from "@/lib/utils/positionCalculations"

// Re-export Bet interface for backward compatibility
export type { Bet }

// Re-export calculatePositions for backward compatibility
export { calculatePositions }

/**
 * Custom hook to calculate positions for selections based on bets
 * @param selections - Array of selection IDs
 * @param bets - Array of bet objects
 * @returns Record mapping selection ID to position value (memoized)
 */
export function usePosition(
  selections: string[],
  bets: Bet[]
): Record<string, number> {
  return useMemo(() => {
    return calculatePositions(selections, bets)
  }, [selections, bets])
}

