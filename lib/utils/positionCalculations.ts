/**
 * Position Calculation Utilities
 * 
 * This module provides modular functions for calculating betting positions.
 * Each function handles a specific aspect of position calculation.
 */

export interface Bet {
  selectionId: string
  betType: 'BACK' | 'LAY'
  odds: number
  stake: number
}

/**
 * Initialize positions map with all selections set to 0
 * @param selections - Array of selection IDs
 * @returns Record mapping selection ID to initial position (0)
 */
export function initializePositions(
  selections: string[]
): Record<string, number> {
  const position: Record<string, number> = {}
  
  for (const selection of selections) {
    position[selection] = 0
  }
  
  return position
}

/**
 * Calculate position impact for a BACK bet
 * @param isWinOutcome - Whether this selection is the winning outcome
 * @param odds - The odds for the bet
 * @param stake - The stake amount
 * @returns The position change for this selection
 */
export function calculateBackBetPosition(
  isWinOutcome: boolean,
  odds: number,
  stake: number
): number {
  if (isWinOutcome) {
    // If this selection wins: profit = (odds - 1) * stake
    return (odds - 1) * stake
  } else {
    // If this selection loses: loss = stake
    return -stake
  }
}

/**
 * Calculate position impact for a LAY bet
 * @param isWinOutcome - Whether this selection is the winning outcome
 * @param odds - The odds for the bet
 * @param stake - The stake amount
 * @returns The position change for this selection
 */
export function calculateLayBetPosition(
  isWinOutcome: boolean,
  odds: number,
  stake: number
): number {
  if (isWinOutcome) {
    // If this selection wins: loss = (odds - 1) * stake
    return -(odds - 1) * stake
  } else {
    // If this selection loses: profit = stake
    return stake
  }
}

/**
 * Calculate position impact for a single bet on a specific selection
 * @param bet - The bet object
 * @param selectionId - The selection ID to calculate for
 * @returns The position change for this selection
 */
export function calculateBetPosition(
  bet: Bet,
  selectionId: string
): number {
  const isWinOutcome = selectionId === bet.selectionId

  if (bet.betType === 'BACK') {
    return calculateBackBetPosition(isWinOutcome, bet.odds, bet.stake)
  }

  if (bet.betType === 'LAY') {
    return calculateLayBetPosition(isWinOutcome, bet.odds, bet.stake)
  }

  // Default: no change if bet type is unknown
  return 0
}

/**
 * Calculate positions for each selection based on bets
 * @param selections - Array of selection IDs
 * @param bets - Array of bet objects
 * @returns Record mapping selection ID to position value
 */
export function calculatePositions(
  selections: string[],
  bets: Bet[],
): Record<string, number> {
  // Initialize all positions to 0
  const position = initializePositions(selections)

  // Calculate projection for each bet
  for (const bet of bets) {
    for (const selection of selections) {
      const positionChange = calculateBetPosition(bet, selection)
      position[selection] += positionChange
    }
  }

  return position
}







