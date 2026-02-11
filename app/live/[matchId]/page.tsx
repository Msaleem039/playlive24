'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import LiveScorecard from '@/components/scorecard/LiveScorecard'
import DashboardHeader from '@/components/dashboard-header'
import CommonHeader from '@/components/common-header'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'
import { useGetMatchPositionsQuery, useGetWalletQuery } from '@/app/services/Api'
import BetSlipModal from '@/components/modal/BetSlipModal'
import UserPendingBets from '@/components/live/UserPendingBets'
import LiveTVSection from '@/components/live/LiveTVSection'
import MarketList from '@/components/live/MarketList'
import EmptyMarketsState from '@/components/live/EmptyMarketsState'
import { useMatchData } from './hooks/useMatchData'
import { useMatchMarkets } from './hooks/useMatchMarkets'
import { usePositions } from './hooks/usePositions'
import { useOddsBlinking } from './hooks/useOddsBlinking'
import { useResponsiveLayout } from './hooks/useResponsiveLayout'
import { useUserPendingBets } from './hooks/useUserPendingBets'

export default function LiveMatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params?.matchId as string
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isClient = userRole === 'CLIENT'
  const isAgent = userRole === 'AGENT'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isAdmin = userRole === 'ADMIN'
  const shouldShowTV = !isSuperAdmin && !isAdmin // Hide TV for SUPER_ADMIN and ADMIN
  const isAgentOrAdmin = isAgent || isAdmin || isSuperAdmin

  // TV toggle - check if coming from main page, otherwise default to false
  const [liveToggle, setLiveToggle] = useState(() => {
    if (typeof window !== 'undefined') {
      // Check if coming from main page (via sessionStorage or URL param)
      const fromMain = sessionStorage.getItem('fromMainPage') === 'true'
      if (fromMain) {
        sessionStorage.removeItem('fromMainPage') // Clear after use
        return true
      }
    }
    return false
  })
  const [dashboardTab, setDashboardTab] = useState('Cricket')
  const [commonHeaderTab, setCommonHeaderTab] = useState('Matches')

  // Handle tab change for CLIENT - navigate to dashboard with selected tab
  const handleTabChange = (tab: string) => {
    setDashboardTab(tab)
    // Navigate to dashboard with the selected tab
    router.push('/dashboard')
    // Store the selected tab in sessionStorage so dashboard can use it
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedTab', tab)
    }
  }

  // Handle tab change for AGENT/ADMIN - navigate to dashboard with selected tab
  const handleCommonHeaderTabChange = (tab: string) => {
    setCommonHeaderTab(tab)
    // Navigate to dashboard with the selected tab
    router.push('/dashboard')
    // Store the selected tab in sessionStorage so dashboard can use it
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedTab', tab)
    }
  }
  
  // Bet slip state
  const [betSlipOpen, setBetSlipOpen] = useState(false)
  const [selectedBet, setSelectedBet] = useState<{
    team: string
    type: 'back' | 'lay'
    odds: string
    market: string
    selectionId?: number
    marketId?: number | string
    marketIdString?: string
    marketGType?: string
    size?: number // For fancy markets: the percentage/size value
  } | null>(null)

  // Parse matchId to get eventId (and numeric for legacy APIs)
  const eventId = matchId
  const numericMatchId = useMemo(() => {
    const parsed = parseInt(matchId, 10)
    return isNaN(parsed) ? null : parsed
  }, [matchId])

  // Custom hooks
  const { 
    marketsData, 
    oddsData, 
    bookmakerFancyData, 
    scorecard, 
    matchData, 
    currentEventId, 
    streamUrl, 
    isLoading, 
    error, 
    isLoadingScorecard, 
    refetch 
  } = useMatchData(eventId)

  const { isMobile, isTablet, getMainLayoutClass, getLeftPanelClass, getRightPanelClass } = useResponsiveLayout()

  const { userPendingBets, isLoadingPendingBets, refetchPendingBets } = useUserPendingBets(matchId, authUser)

  // Extract marketIds from markets response
  const marketIds = useMemo(() => {
    if (!marketsData || !Array.isArray(marketsData)) return []
    return marketsData.map((market: any) => market.marketId)
  }, [marketsData])

  const { allMarkets, bettingMarkets } = useMatchMarkets(
    marketsData,
    oddsData,
    bookmakerFancyData,
    eventId,
    numericMatchId,
    marketIds
  )

  // Fetch match positions for profit/loss calculation
  // CRITICAL: API endpoint expects eventId parameter: /positions?eventId=35181859
  // Prioritize eventId (which equals matchId in this case, but use eventId for clarity)
  const positionsQueryParams = useMemo(() => {
    // Always use eventId parameter (matchId and eventId are the same value, but API expects eventId)
    const params = eventId ? { eventId } : { eventId: matchId || '' }
    return params
  }, [eventId, matchId, authUser])
  
  const { data: positionsData, isLoading: isLoadingPositions, refetch: refetchPositions, error: positionsError } = useGetMatchPositionsQuery(
    positionsQueryParams,
    { skip: !matchId || !authUser, pollingInterval: 10000 }
  )
  

  const { positionsByMarketType, addOptimisticPosition } = usePositions(positionsData, matchId)

  const blinkingOdds = useOddsBlinking(bettingMarkets)

  // Fetch wallet data for Live TV access check
  const { data: walletData } = useGetWalletQuery(undefined, {
    skip: !authUser,
    pollingInterval: 30000,
  })

  // Check if user can toggle TV (requires minimum wallet balance of Rs 200)
  const canToggleTV = useMemo(() => {
    if (!authUser) return false
    const balance = walletData?.balance ?? authUser?.balance ?? authUser?.walletBalance ?? authUser?.availableBalance ?? authUser?.available_balance ?? authUser?.chips ?? 0
    return Number(balance) >= 200
  }, [authUser, walletData])

  // Transform API data to component format
  const transformedMatchData = useMemo(() => {
    if (!matchData) {
      return {
        title: 'Loading...',
        date: '',
        time: '',
        isLive: false,
        hasLiveTV: false
      }
    }

    // Parse stime: "11/22/2025 9:30:00 AM"
    const dateTime = new Date(matchData.stime)
    const date = dateTime.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
    const time = dateTime.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    })

    // Check if match is live from odds data
    const isLive = oddsData?.data?.some((odds: any) => odds.inplay) || matchData.iplay || false

    // Check if we have eventId for TV (new API) or tv flag (legacy)
    const hasEventId = matchData?.eventId || (marketsData && Array.isArray(marketsData) && marketsData.length > 0)
    const hasTV = (matchData.tv || hasEventId) && shouldShowTV // Show TV if tv flag is set or we have eventId

    return {
      title: matchData.ename || 'Match',
      date,
      time,
      isLive,
      hasLiveTV: hasTV // Only show TV if user role allows it
    }
  }, [matchData, shouldShowTV, oddsData, marketsData])

  // onPlaceBetClick function - handles optimistic position updates
  const onPlaceBetClick = (newBet: {
    selectionId?: number
    type: 'back' | 'lay'
    odds: string
    stake?: string
    betvalue?: number
    marketGType?: string
    fancyId?: string
    fancyOutcome?: 'YES' | 'NO'
  }) => {
    // Optimistic updates are handled in onBetPlaced callback
    // This function is kept for compatibility but logic moved to onBetPlaced
  }

  // Use transformed markets only (no fallback/dummy data)
  const displayMarkets = bettingMarkets
  const displayMatchData = matchData ? transformedMatchData : {
    title: 'Match not found',
    date: '',
    time: '',
    isLive: false,
    hasLiveTV: false
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00A66E]" />
          <p className="text-gray-600">Loading match details...</p>
        </div>
      </div>
    )
  }

  // Error state - only show if eventId is invalid
  if (!eventId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Invalid match ID</p>
        </div>
      </div>
    )
  }

  const handleBetSelect = (bet: {
    team: string
    type: 'back' | 'lay'
    odds: string
    market: string
    selectionId?: number
    marketId?: number | string
    marketIdString?: string
    marketGType?: string
    size?: number
  }) => {
    // Only allow bet selection for CLIENT role
    if (!isClient) {
      return
    }
    setSelectedBet(bet)
    setBetSlipOpen(true)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Dashboard Header - For CLIENT role */}
      {isClient && (
        <DashboardHeader 
          selectedTab={dashboardTab} 
          onSelectTab={handleTabChange} 
        />
      )}
      
      {/* Common Header - For AGENT and ADMIN roles */}
      {isAgentOrAdmin && (
        <div className="sticky top-0 z-50">
          <CommonHeader 
            activeTab={commonHeaderTab} 
            onTabChange={handleCommonHeaderTabChange} 
          />
        </div>
      )}
      
      {/* Main Content Area - Responsive Grid Layout */}
      <div className={`${isClient ? 'min-h-[calc(100vh-108px)]' : isAgentOrAdmin ? 'min-h-[calc(100vh-110px)]' : 'min-h-[calc(100vh-64px)]'} ${getMainLayoutClass(displayMatchData.hasLiveTV, streamUrl)}`}>
        {/* Left Panel - Betting Markets (with integrated scorecard) */}
        <div className={`flex flex-col bg-white ${getLeftPanelClass(displayMatchData.hasLiveTV, streamUrl)} px-2 sm:px-0`} style={{ gap: 0 }}>
          {/* Betting Markets Section - Scorecard integrated as first item */}
          <div className="relative" style={{ margin: 0, padding: 0, gap: 0 }}>
            {/* Live Scorecard Component - First item in markets section */}
            {currentEventId && (
              <LiveScorecard
                data={scorecard}
                isLoading={isLoadingScorecard}
                isMobile={isMobile}
                matchDateTime={matchData ? (() => {
                  const dateTime = new Date(matchData.stime)
                  const day = dateTime.getDate()
                  const month = dateTime.toLocaleDateString('en-US', { month: 'short' })
                  const hours = dateTime.getHours()
                  const minutes = dateTime.getMinutes()
                  const ampm = hours >= 12 ? 'pm' : 'am'
                  const displayHours = hours % 12 || 12
                  const displayMinutes = minutes.toString().padStart(2, '0')
                  return `${day} ${month} ${displayHours}:${displayMinutes} ${ampm}`
                })() : null}
              />
            )}

            {/* TV Section - Show below scorecard on sm/md screens, hidden on lg+ (where it's in right panel) */}
            {displayMatchData.hasLiveTV && streamUrl && (
              <LiveTVSection
                streamUrl={streamUrl}
                liveToggle={liveToggle}
                onToggleChange={setLiveToggle}
                canToggleTV={canToggleTV}
                numericMatchId={numericMatchId}
                isMobile={isMobile}
                scorecard={scorecard}
                matchData={matchData}
                variant="mobile"
              />
            )}

            {/* Markets List */}
            {displayMarkets.length > 0 ? (
              <MarketList
                markets={displayMarkets}
                blinkingOdds={blinkingOdds}
                isMobile={isMobile}
                onBetSelect={handleBetSelect}
                onRefresh={refetch}
                positionsByMarketType={positionsByMarketType}
              />
            ) : (
              <EmptyMarketsState
                title={displayMatchData.title !== 'Match not found' ? 'No Markets Available' : 'Match not found'}
                message={displayMatchData.title !== 'Match not found' 
                  ? 'Betting markets are not available for this match at the moment. Please check back later.'
                  : 'Match data could not be loaded. Please verify the match ID and try again.'}
                onRefresh={refetch}
              />
            )}
          </div>

          {authUser && (!displayMatchData.hasLiveTV || !streamUrl || isMobile) ? (
            <div className="px-3 sm:px-4 py-4 border-t-2 border-gray-200">
              <UserPendingBets 
                userPendingBets={userPendingBets} 
                isLoading={isLoadingPendingBets} 
              />
            </div>
          ) : null}
        </div>

        {/* Right Panel - Live Video (if TV enabled) + Betting Summary - Desktop only (md+) */}
        {displayMatchData.hasLiveTV && streamUrl && (
          <div className={`hidden md:flex bg-white flex-col ${getRightPanelClass(displayMatchData.hasLiveTV, streamUrl)}`}>
            <LiveTVSection
              streamUrl={streamUrl}
              liveToggle={liveToggle}
              onToggleChange={setLiveToggle}
              canToggleTV={canToggleTV}
              numericMatchId={numericMatchId}
              isMobile={isMobile}
              scorecard={scorecard}
              matchData={matchData}
              variant="desktop"
            />

            {/* Logged-in user's pending settlements for this match - shown below TV on desktop */}
            {authUser && (
              <div className="px-3 sm:px-4 py-4 border-t border-gray-200">
                <UserPendingBets 
                  userPendingBets={userPendingBets} 
                  isLoading={isLoadingPendingBets} 
                />
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bet Slip Popup Modal */}
      <BetSlipModal
        isOpen={betSlipOpen}
        selectedBet={selectedBet}
        onClose={() => setBetSlipOpen(false)}
        onClear={() => setSelectedBet(null)}
        matchId={numericMatchId}
        authUser={authUser}
        onPlaceBetClick={onPlaceBetClick}
        onBetPlaced={(betData) => {
          // Add optimistic position update immediately (before backend confirms)
          if (selectedBet && betData) {
            const { stake, betvalue, odds } = betData
            const stakeValue = parseFloat(stake || '0')
            const oddsValue = parseFloat(odds || selectedBet.odds || '0')
            const betType = selectedBet.type
            const marketGType = selectedBet.marketGType || 'match'
            
            if (stakeValue > 0 && oddsValue > 0 && selectedBet.selectionId) {
              // Calculate net position change based on market type
              let netValue = 0
              
              if (marketGType === 'match' || marketGType === 'match_odds' || marketGType === 'oddeven') {
                // Match Odds: Calculate based on decimal odds
                let decimalOdds = oddsValue
                if (oddsValue >= 100) {
                  decimalOdds = oddsValue // Multiplier odds
                } else if (oddsValue >= 10) {
                  decimalOdds = oddsValue / 10 // Exchange odds × 10
                }
                
                if (betType === 'back') {
                  // Back: net = profit if wins = stake * (odds - 1)
                  netValue = stakeValue * (decimalOdds - 1)
                } else {
                  // Lay: net = -liability if wins = -stake * (odds - 1)
                  netValue = -stakeValue * (decimalOdds - 1)
                }
              } else if (marketGType === 'bookmaker' || marketGType === 'bookmatch' || marketGType === 'match1') {
                // Bookmaker: Calculate based on rate
                const rate = oddsValue >= 10 ? oddsValue / 100 : oddsValue
                
                if (betType === 'back') {
                  // Back: net = profit if wins = stake * rate
                  netValue = stakeValue * rate
                } else {
                  // Lay: net = -liability if wins = -stake * rate
                  netValue = -stakeValue * rate
                }
              } else if (marketGType === 'fancy' || marketGType === 'fancy1' || marketGType === 'fancy2') {
                // Fancy: Use size field for calculation
                const size = selectedBet.size || 100
                const rate = size / 100
                
                if (betType === 'back') {
                  // Back: net = profit if wins = stake * rate
                  netValue = stakeValue * rate
                } else {
                  // Lay: net = -liability if wins = -stake * rate
                  netValue = -stakeValue * rate
                }
              }
              
              // Determine market type for position storage
              let positionMarketType: 'matchOdds' | 'bookmaker' | 'fancy' = 'matchOdds'
              if (marketGType === 'bookmaker' || marketGType === 'bookmatch' || marketGType === 'match1') {
                positionMarketType = 'bookmaker'
              } else if (marketGType === 'fancy' || marketGType === 'fancy1' || marketGType === 'fancy2') {
                positionMarketType = 'fancy'
              }
              
              // Add optimistic position
              if (positionMarketType === 'fancy') {
                // For fancy markets: need fancyId and outcome (YES/NO)
                // FancyId can be derived from marketId or market name
                // Outcome is determined by the team name (YES/NO) or bet type
                // Note: Fancy positions use fancyId -> { YES/NO -> net } structure
                const fancyId = selectedBet.marketIdString || selectedBet.marketId?.toString() || selectedBet.market || 'unknown'
                
                // Determine outcome: In fancy markets, back typically means YES, lay means NO
                // But we should check the team name if available to be more accurate
                const teamName = (selectedBet.team || '').toUpperCase().trim()
                let fancyOutcome: 'YES' | 'NO' = 'YES'
                if (teamName === 'NO' || teamName.includes('NO')) {
                  fancyOutcome = 'NO'
                } else if (betType === 'lay') {
                  // Lay bets typically correspond to NO outcome
                  fancyOutcome = 'NO'
                }
                
                addOptimisticPosition({
                  selectionId: String(selectedBet.selectionId || ''),
                  netValue,
                  marketType: positionMarketType,
                  fancyId,
                  fancyOutcome
                })
              } else {
                // For matchOdds and bookmaker: use selectionId as key
                addOptimisticPosition({
                  selectionId: String(selectedBet.selectionId),
                  netValue,
                  marketType: positionMarketType
                })
              }
            }
          }
          
          // Refetch positions and pending bets from backend after bet is placed
          refetchPendingBets()
          refetchPositions()
        }}
        isMobile={isMobile}
        eventId={currentEventId}
      />
    </div>
  )
}
