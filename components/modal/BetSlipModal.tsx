
'use client'

import { useState, useEffect, useRef } from 'react'
import { usePlaceBetMutation } from '@/app/services/Api'
import { toast } from 'sonner'

interface SelectedBet {
  team: string
  type: 'back' | 'lay'
  odds: string
  market: string
  selectionId?: number
  marketId?: number | string
  marketIdString?: string
  marketGType?: string
  size?: number // For fancy markets: the percentage/size value (100, 90, 120, etc.)
}

interface BetSlipModalProps {
  isOpen: boolean
  selectedBet: SelectedBet | null
  onClose: () => void
  onClear: () => void
  matchId: number | null
  authUser: any
  onBetPlaced?: () => void
  isMobile?: boolean
  eventId?: string | null
}

export default function BetSlipModal({
  isOpen,
  selectedBet,
  onClose,
  onClear,
  matchId,
  authUser,
  onBetPlaced,
  isMobile = false,
  eventId = null
}: BetSlipModalProps) {
  const [stake, setStake] = useState<string>('')
  const [odds, setOdds] = useState<string>('')
  const [placeBet, { isLoading: isPlacingBet }] = usePlaceBetMutation()
  const onCloseRef = useRef(onClose)

  // Keep onClose ref updated
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Update odds when selectedBet changes
  useEffect(() => {
    if (selectedBet) {
      setOdds(selectedBet.odds)
      setStake('')
    }
  }, [selectedBet])

  // Auto-close modal after 10 seconds when it opens
  useEffect(() => {
    if (isOpen && selectedBet) {
      const timer = setTimeout(() => {
        onCloseRef.current()
      }, 10000) // 10 seconds

      // Cleanup timer if component unmounts or modal closes
      return () => clearTimeout(timer)
    }
  }, [isOpen, selectedBet])

  if (!isOpen || !selectedBet) return null

  /**
   * Calculate profit/loss based on market type and bet type
   * Updated to handle decimal odds for match odds and percentage for fancy markets
   */
  const calculateProfitLoss = (
    stake: number,
    odds: number,
    betType: 'back' | 'lay',
    gtype: string,
    selectedBet?: SelectedBet | null
  ): { winAmount: number; lossAmount: number; plText: string } => {
  
    let win = 0
    let loss = 0
  
    // =========================
    // MATCH ODDS (EXCHANGE)
    // Odds are in decimal format (e.g., 1.7, 1.82)
    // Back 1.7, stake 100: profit = 100 * (1.7 - 1) = 70
    // Lay 1.82, stake 100: loss = 100 * (1.82 - 1) = 82
    // =========================
    if (gtype === 'match_odds' || gtype === 'match' || gtype === 'oddeven') {
      // Check if odds are already in decimal format (< 10) or multiplied by 100 (>= 10)
      const decimalOdds = odds < 10 ? odds : odds / 100
  
      if (betType === 'back') {
        // Back: profit = stake * (odds - 1), loss = stake
        win = stake * (decimalOdds - 1)
        loss = stake
      } else {
        // Lay: profit = stake, loss = stake * (odds - 1)
        win = stake
        loss = stake * (decimalOdds - 1)
      }
    }
  
    // =========================
    // BOOKMAKER
    // odds are percentage → 150 = 150%
    // =========================
    else if (gtype === 'bookmaker' || gtype === 'bookmatch') {
      const rate = odds / 100
  
      if (betType === 'back') {
        win = stake * rate
        loss = stake
      } else {
        win = stake
        loss = stake * rate
      }
    }
  
    // =========================
    // FANCY (RUN / POINT MARKET)
    // Use 'size' field (percentage) for calculation, not 'odds' field
    // size represents the market rate percentage (e.g., 100, 90, 120)
    // If size is 100 and bet value is 100: profit = 100, loss = 100
    // If size is 120 and bet value is 100: profit = 120 (120% of 100), loss = 100
    // =========================
    else if (gtype === 'fancy' || gtype === 'fancy1' || gtype === 'fancy2') {
      // For fancy markets, we need to get the size from selectedBet
      // If size is not provided, fallback to odds (for backward compatibility)
      // But ideally size should be passed from the bet selection
      const marketRate = (selectedBet?.size ?? parseFloat(odds.toString())) || 100
  
      if (betType === 'back') {
        // Back: profit = stake * (marketRate / 100), loss = stake
        win = (stake * marketRate) / 100
        loss = stake
      } else {
        // Lay: profit = stake, loss = stake * (marketRate / 100)
        win = stake
        loss = (stake * marketRate) / 100
      }
    }
  
    return {
      winAmount: Number(win.toFixed(2)),
      lossAmount: Number(loss.toFixed(2)),
      plText: `${win.toFixed(2)} / ${loss.toFixed(2)}`
    }
  }
  

  const stakeValue = parseFloat(stake)
  const oddsValue = parseFloat(odds || selectedBet.odds)
  let plText = '0 / 0'
  
  if (!isNaN(stakeValue) && stakeValue > 0 && !isNaN(oddsValue) && oddsValue > 0) {
    const result = calculateProfitLoss(
      stakeValue,
      oddsValue,
      selectedBet.type,
      selectedBet.marketGType || 'match_odds',
      selectedBet // Pass selectedBet to access size field for fancy markets
    )
    plText = result.plText
  }

  const handlePlaceBet = async () => {
    if (!selectedBet) {
      toast.error('Please select a bet first.')
      return
    }

    const betStake = parseFloat(stake)
    if (isNaN(betStake) || betStake <= 0) {
      toast.error('Please enter a valid stake amount.')
      return
    }

    const betRate = parseFloat(odds || selectedBet.odds)
    if (isNaN(betRate) || betRate <= 0) {
      toast.error('Invalid odds value.')
      return
    }

    // Calculate win_amount and loss_amount based on market type
    const { winAmount, lossAmount } = calculateProfitLoss(
      betStake,
      betRate,
      selectedBet.type,
      selectedBet.marketGType || 'match_odds',
      selectedBet // Pass selectedBet to access size field for fancy markets
    )

    const betType = selectedBet.type === 'back' ? 'BACK' : 'LAY'

    // Try multiple user ID fields - backend expects string user_id
    const userId = 
      (authUser as any)?.user_id ??           // Try user_id first (if backend uses this)
      (authUser as any)?.userId ??             // Try userId
      (authUser as any)?.id ??                 // Try id (convert to string)
      (authUser as any)?.numericId ??          // Try numericId if exists
      null

    if (!userId) {
      toast.error('User ID not found. Please login again.')
      return
    }

    // Get marketId - prefer marketIdString (full string format like "1.250049502"), fallback to marketId
    const marketIdValue = selectedBet.marketIdString || selectedBet.marketId?.toString() || ''
    
    // Get eventId - prefer from prop, fallback to matchId as string
    const eventIdValue = eventId || matchId?.toString() || ''

    if (!marketIdValue) {
      toast.error('Market ID not found. Please try again.')
      return
    }

    if (!eventIdValue) {
      toast.error('Event ID not found. Please try again.')
      return
    }

    // Determine market_type based on gtype
    const marketType = selectedBet.marketGType === 'fancy' || selectedBet.marketGType === 'fancy1' || selectedBet.marketGType === 'fancy2'
      ? 'fancy'
      : selectedBet.marketGType === 'bookmaker' || selectedBet.marketGType === 'bookmatch'
      ? 'bookmaker'
      : 'in_play'

    // Log for debugging
    console.log('Bet placement - Payload data:', {
      user_id: String(userId),
      match_id: String(matchId ?? ''),
      selection_id: selectedBet.selectionId,
      bet_type: betType,
      bet_rate: betRate,
      betvalue: betStake,
      marketId: marketIdValue,
      eventId: eventIdValue,
      bet_name: selectedBet.team,
      market_name: selectedBet.market,
      market_type: marketType,
      win_amount: winAmount,
      loss_amount: lossAmount,
      gtype: selectedBet.marketGType || 'match_odds',
      selectedBet
    })

    // API payload format - includes both new fields (marketId, eventId) and legacy fields
    const payload = {
      user_id: String(userId),
      match_id: String(matchId ?? ''),
      selection_id: selectedBet.selectionId ?? 0,
      bet_type: betType,
      bet_rate: betRate,
      betvalue: betStake,
      marketId: marketIdValue,
      eventId: eventIdValue,
      // Legacy required fields
      bet_name: selectedBet.team || '',
      market_name: selectedBet.market || '',
      market_type: marketType,
      win_amount: Number(winAmount.toFixed(2)),
      loss_amount: Number(lossAmount.toFixed(2)),
      gtype: selectedBet.marketGType || 'match_odds'
    }

    console.log('Placing bet with payload:', payload)

    try {
      const data = await placeBet(payload).unwrap()
      console.log('Bet placed successfully:', data)
      toast.success('Bet placed successfully.')
      onClose()
      setStake('')
      onClear()
      // Call callback to refetch pending bets
      if (onBetPlaced) {
        onBetPlaced()
      }
    } catch (error: any) {
      console.error('Error placing bet:', error)
      
      // Show specific error message from backend
      const errorMessage = 
        error?.data?.error || 
        error?.data?.message || 
        error?.message || 
        'Failed to place bet. Please try again.'
      
      toast.error(errorMessage)
      
      // If user not found, suggest checking user ID
      if (error?.data?.code === 'USER_NOT_FOUND' || errorMessage.includes('User not found')) {
        console.error('User ID issue - Current user:', {
          userId: userId,
          userObject: authUser,
          availableFields: Object.keys(authUser || {})
        })
      }
    }
  }

  const handleClear = () => {
    setStake('')
    onClear()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full max-w-md mx-2 sm:mx-4 mb-2 sm:mb-0" onClick={(e) => e.stopPropagation()}>
        <div
          className="bg-pink-50 border-t border-gray-200 flex flex-col rounded-t-lg sm:rounded-lg overflow-hidden shadow-xl"
          style={{ maxHeight: isMobile ? '360px' : '420px' }}
        >
          <div className="bg-gray-800 text-white px-3 sm:px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Bet Slip</span>
            <span className="text-xs text-gray-300 cursor-pointer hover:text-white">Edit Stakes</span>
          </div>

          <div className="p-3 sm:p-4 space-y-3 overflow-y-auto">
            <div className="grid grid-cols-4 gap-1 sm:gap-2 text-xs font-semibold text-gray-700">
              <div className="bg-gray-200 px-1 sm:px-2 py-1 rounded text-center sm:text-left">Bet for</div>
              <div className="bg-gray-200 px-1 sm:px-2 py-1 rounded text-center">Odds</div>
              <div className="bg-gray-200 px-1 sm:px-2 py-1 rounded text-center">Stake</div>
              <div className="bg-gray-200 px-1 sm:px-2 py-1 rounded text-center">P/L</div>
            </div>

            <div className="grid grid-cols-4 gap-1 sm:gap-2 items-center">
              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate text-center sm:text-left">
                {selectedBet.team}
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                  className="w-full px-1 sm:px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                />
                <div className="flex flex-col">
                  <button className="text-xs">▲</button>
                  <button className="text-xs">▼</button>
                </div>
              </div>
              <div>
                <input
                  type="text"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  placeholder="Stake"
                  className="w-full px-1 sm:px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                />
              </div>
              <div className="text-xs sm:text-sm text-gray-700 text-center">{plText}</div>
            </div>

            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              {[100, 200, 500, 1000, 2000, 5000, 10000, 20000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setStake(amount.toString())}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-1 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm font-medium"
                >
                  {isMobile && amount >= 1000 ? `${amount / 1000}k` : amount.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="flex gap-1 sm:gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-2 sm:px-4 py-2 rounded text-xs sm:text-sm font-semibold"
              >
                Close
              </button>
              <button
                onClick={handleClear}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-2 sm:px-4 py-2 rounded text-xs sm:text-sm font-semibold"
              >
                Clear
              </button>
              <button
                onClick={handlePlaceBet}
                disabled={isPlacingBet}
                className="flex-1 bg-[#00A66E] hover:bg-[#008a5a] text-white px-2 sm:px-4 py-2 rounded text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingBet ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

