'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RefreshCw, Tv } from 'lucide-react'
import { useGetCricketMatchMarketsQuery, useGetCricketMatchOddsQuery, useGetCricketBookmakerFancyQuery, useGetCricketScorecardQuery } from '@/app/services/CricketApi'
import LiveScorecard from '@/components/scorecard/LiveScorecard'
import DashboardHeader from '@/components/dashboard-header'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'
import { useGetMyPendingBetsQuery, useGetMatchPositionsQuery, useGetWalletQuery } from '@/app/services/Api'
import BetSlipModal from '@/components/modal/BetSlipModal'
import MatchOdds from '@/components/markets/MatchOdds'
import FancyDetail from '@/components/markets/FancyDetail'
import type {
  BettingOption,
  MarketRow,
  BettingMarket,
  BetHistoryItem,
  ApiOdds,
  ApiSection,
  ApiMatchMarket,
  ApiResponse,
  MarketRunner,
  MarketResponse,
  OddsRunner,
  OddsResponse
} from './types'

export default function LiveMatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params?.matchId as string
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isClient = userRole === 'CLIENT'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isAdmin = userRole === 'ADMIN'
  const shouldShowTV = !isSuperAdmin && !isAdmin // Hide TV for SUPER_ADMIN and ADMIN
  
  // Redirect SUPER_ADMIN and ADMIN away from detail page
  useEffect(() => {
    if (isSuperAdmin || isAdmin) {
      router.push('/dashboard')
    }
  }, [isSuperAdmin, isAdmin, router])

  // State for responsive layout
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  
  // State for iframe loading errors
  const [streamLoadError, setStreamLoadError] = useState(false)
  
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
  const [selectedTab, setSelectedTab] = useState('all')
  const [dashboardTab, setDashboardTab] = useState('Cricket')

  // Handle tab change - navigate to dashboard with selected tab
  const handleTabChange = (tab: string) => {
    setDashboardTab(tab)
    // Navigate to dashboard with the selected tab
    router.push('/dashboard')
    // Store the selected tab in sessionStorage so dashboard can use it
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedTab', tab)
    }
  }
  const [blinkingOdds, setBlinkingOdds] = useState<Set<string>>(new Set())
  const previousOddsRef = useRef<Map<string, { odds: string; amount: string }>>(new Map())
  
  // Stable positions state - persists across API updates (wallet-like behavior)
  // Match Odds: { selectionId: net } - net is final P/L if that runner wins
  // Bookmaker: { selectionId: net } - same structure
  // Fancy: { fancyId: { YES/NO: net } } - outcome-based net values
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

  const BACK_COLUMNS = 1
  const LAY_COLUMNS = 1

  // Pending settlements/bets for logged-in user across matches
  const { data: myPendingBetsData, isLoading: isLoadingPendingBets, refetch: refetchPendingBets } = useGetMyPendingBetsQuery(undefined)

  // Parse matchId to get eventId (for later use)
  const eventIdForPositions = matchId

  // Fetch match positions for profit/loss calculation
  const { data: positionsData, isLoading: isLoadingPositions, refetch: refetchPositions } = useGetMatchPositionsQuery(
    matchId ? { matchId } : { eventId: eventIdForPositions || '' },
    { skip: !matchId || !authUser, pollingInterval: 10000 }
  )

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

  const userPendingBets = useMemo(() => {
    if (!myPendingBetsData) return []
    const root = myPendingBetsData as any
    // Handle new API response structure: { success: true, data: [...], count: 5 }
    let all: any[] = []
    if (root.success && Array.isArray(root.data)) {
      all = root.data
    } else if (Array.isArray(root)) {
      all = root
    } else if (Array.isArray(root.results)) {
      all = root.results
    } else if (Array.isArray(root.data)) {
      all = root.data
    }
  
    const numeric = Number(matchId)
    const hasNumeric = !Number.isNaN(numeric)
  
    return all.filter((bet: any) => {
      const betMatchId = bet.match_id ?? bet.matchId ?? bet.match?.id ?? bet.eventId
      if (betMatchId == null) return false
  
      return hasNumeric
        ? String(betMatchId) === String(numeric)
        : String(betMatchId) === String(matchId)
    })
  }, [myPendingBetsData, matchId])

  const renderUserPendingBets = () => {
    if (!authUser) return null

    return (
      <div className="w-full bg-white rounded-lg border-2 border-gray-300 shadow-md">
        <div className="px-3 sm:px-4 py-2.5 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-gray-900">
            Your Pending Settlements
          </span>
          {isLoadingPendingBets && (
            <span className="text-xs sm:text-sm text-gray-600 animate-pulse">Loading...</span>
          )}
        </div>
        <div className="max-h-48 overflow-y-auto">
          {!isLoadingPendingBets && userPendingBets.length === 0 ? (
            <div className="px-3 sm:px-4 py-4 text-xs sm:text-sm text-gray-500 text-center">
              No pending settlements for this match.
            </div>
          ) : (
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 border-b border-gray-200">Bet</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-700 border-b border-gray-200">Amount</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-700 border-b border-gray-200">Odds</th>
                </tr>
              </thead>
              <tbody>
                {userPendingBets.map((bet: any, idx: number) => {
                  // Determine bet type (can be 'BACK', 'LAY', 'back', or 'lay')
                  const betType = (bet.betType ?? bet.bet_type ?? '').toLowerCase()
                  const isLay = betType === 'lay'
                  const isBack = betType === 'back'
                  
                  // Set background color based on bet type
                  const bgColor = isLay ? '#FCCEE8' : isBack ? '#BEDBFF' : 'transparent'
                  
                  return (
                    <tr 
                      key={bet.id || idx} 
                      className="border-b border-gray-100 transition-colors"
                      style={{ backgroundColor: bgColor }}
                    >
                    <td className="px-3 py-2">
                      <div className="font-semibold text-gray-900 truncate">
                        {bet.betName || 'Bet'}
                      </div>
                      <div className="text-[10px] text-gray-600 truncate mt-0.5">
                        {bet.marketName || bet.gtype || 'MATCH'}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-900 font-medium">
                      Rs {(bet.amount || bet.betValue || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-900 font-medium">
                      {bet.odds ?? bet.betRate ?? '--'}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  }


  // Refetch pending bets on mount and periodically
  useEffect(() => {
    if (authUser) {
      // Initial refetch
      refetchPendingBets()
      
      // Set up periodic refetch every 30 seconds
      const interval = setInterval(() => {
        refetchPendingBets()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [authUser, refetchPendingBets])

  // Responsive breakpoint detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    // Initial check
    checkScreenSize()

    // Add event listener
    window.addEventListener('resize', checkScreenSize)

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Parse matchId to get eventId (and numeric for legacy APIs)
  const eventId = matchId
  const numericMatchId = useMemo(() => {
    const parsed = parseInt(matchId, 10)
    return isNaN(parsed) ? null : parsed
  }, [matchId])

  // Fetch markets for the event
  const { data: marketsData, isLoading: isLoadingMarkets, error: marketsError, refetch: refetchMarkets } = useGetCricketMatchMarketsQuery(
    { eventId },
    { skip: !eventId }
  )

  // Extract marketIds from markets response
  const marketIds = useMemo(() => {
    if (!marketsData || !Array.isArray(marketsData)) return []
    return marketsData.map((market: MarketResponse) => market.marketId)
  }, [marketsData])

  // Fetch odds for all markets - uses direct API polling (backend cronjob updates odds)
  const { data: oddsData, isLoading: isLoadingOdds, error: oddsError, refetch: refetchOdds } = useGetCricketMatchOddsQuery(
    { marketIds },
    { 
      skip: marketIds.length === 0,
      // Enable polling to get updated odds from backend cronjob
      pollingInterval: 5000, // Poll every 5 seconds
    }
  )


  // Fetch bookmaker and fancy markets by eventId
  const { data: bookmakerFancyData, isLoading: isLoadingBookmakerFancy, error: bookmakerFancyError, refetch: refetchBookmakerFancy } = useGetCricketBookmakerFancyQuery(
    { eventId },
    { 
      skip: !eventId,
      // Enable polling to get updated fancy/bookmaker markets
      pollingInterval: 5000, // Poll every 5 seconds
    }
  )

  // Fetch scorecard data by eventId
  const { data: scorecardData, isLoading: isLoadingScorecard, error: scorecardError } = useGetCricketScorecardQuery(
    { eventId },
    {
      skip: !eventId,
      // Enable polling to get updated scorecard data
      pollingInterval: 5000, // Poll every 5 seconds
    }
  )

  const isLoading = isLoadingMarkets || isLoadingOdds || isLoadingBookmakerFancy
  const error = marketsError || oddsError || bookmakerFancyError

  // Combined refetch function
  const refetch = () => {
    refetchMarkets()
    refetchOdds()
    refetchBookmakerFancy()
  }

  // Extract match info - prioritize markets data, fallback to detail response
  const matchData = useMemo(() => {
    // Try to get match info from markets data first
    if (marketsData && Array.isArray(marketsData) && marketsData.length > 0) {
      const firstMarket = marketsData[0] as MarketResponse
      return {
        ename: firstMarket.event.name,
        stime: firstMarket.event.openDate,
        iplay: false, // Will be determined from odds data
        tv: false, // Default, can be updated if available
        eventId: firstMarket.event.id,
        countryCode: firstMarket.event.countryCode,
        timezone: firstMarket.event.timezone
      }
    }
    
    return null
  }, [marketsData])

  // Extract all markets - use new markets API with odds from direct API polling
  // Also merge bookmaker-fancy markets from the dedicated endpoint
  const allMarkets = useMemo(() => {
    let markets: any[] = []
    
    // Start with new markets + odds API data (using direct API polling)
    if (marketsData && Array.isArray(marketsData) && marketsData.length > 0) {
      // Combine markets with their odds from API (polled every 5 seconds)
      let combinedMarkets = marketsData.map((market: MarketResponse) => {
        // Get odds from API (polled data from backend cronjob)
        let oddsForMarket = null
        
        if (oddsData?.status && Array.isArray(oddsData.data)) {
          oddsForMarket = oddsData.data.find((odds: any) => odds.marketId === market.marketId)
        }
        
        return {
          ...market,
          odds: oddsForMarket
        }
      })
      
      markets = combinedMarkets
      
      console.log('[MatchDetail] Markets with odds (API polling):', {
        eventId,
        totalMarkets: combinedMarkets.length,
        marketsWithOdds: combinedMarkets.filter((m: any) => m.odds).length,
        hasApiOdds: !!oddsData?.status,
        pollingActive: marketIds.length > 0,
        markets: combinedMarkets.map((m: any) => ({ 
          marketId: m.marketId, 
          hasOdds: !!m.odds,
          isLive: m.odds?.inplay || false
        }))
      })
    }
    
    // Merge bookmaker-fancy markets from dedicated endpoint
    if (bookmakerFancyData) {
      let bookmakerFancyMarkets: any[] = []
      
      // Handle bookmaker-fancy response structure
      if (bookmakerFancyData?.success && Array.isArray(bookmakerFancyData.data)) {
        bookmakerFancyMarkets = bookmakerFancyData.data
      } else if (Array.isArray(bookmakerFancyData)) {
        bookmakerFancyMarkets = bookmakerFancyData
      }
      
      if (bookmakerFancyMarkets.length > 0) {
        console.log('[MatchDetail] Adding bookmaker-fancy markets:', {
          eventId,
          fancyMarketsFound: bookmakerFancyMarkets.length,
          markets: bookmakerFancyMarkets.map((m: any) => ({ 
            gmid: m.gmid, 
            mid: m.mid, 
            mname: m.mname, 
            gtype: m.gtype,
            status: m.status
          }))
        })
        
        // Merge bookmaker-fancy markets with existing markets
        // Avoid duplicates by checking market name and type
        const existingMarketKeys = new Set(
          markets.map((m: any) => `${m.marketName || m.mname || ''}_${m.gtype || ''}`)
        )
        
        bookmakerFancyMarkets.forEach((fancyMarket: any) => {
          const marketKey = `${fancyMarket.mname || ''}_${fancyMarket.gtype || ''}`
          if (!existingMarketKeys.has(marketKey)) {
            markets.push(fancyMarket)
            existingMarketKeys.add(marketKey)
          }
        })
      }
    }
    
    
    // Filter out markets with "2nd" in mname, "Tied Match", "TOURNAMENT_WINNER", "Bookmaker Big Bash Cup", "Match Odds Including Tie", "Completed Match", "Super Over", "Line" markets, "Over Total" markets (case-insensitive)
    const filteredMarkets = markets.filter((market: any) => {
      const mname = (market.mname || market.marketName || '').toLowerCase().trim()
      // Exclude markets with "2nd" in the name
      if (mname.includes('2nd')) {
        return false
      }
      // Exclude markets with "Line" in the name (e.g., "1st Innings 6 Overs Line", "2nd Innings 15 Overs Line")
      if (mname.includes('line')) {
        return false
      }
      // Exclude markets with "Over Total" in the name (e.g., "1st Innings 6 Over Total")
      if (mname.includes('over total')) {
        return false
      }
      // Exclude "Tied Match" markets (exact match or contains "tied match" as a phrase)
      if (mname === 'tied match' || mname.startsWith('tied match')) {
        return false
      }
      // Exclude "TOURNAMENT_WINNER" markets
      if (mname === 'tournament_winner' || mname.includes('tournament winner')) {
        return false
      }
      // Exclude "Bookmaker Big Bash Cup" markets
      if (mname.includes('bookmaker big bash cup')) {
        return false
      }
      // Exclude "Match Odds Including Tie" markets (including variations like "Match Odds (Inc. Tie)")
      if (mname === 'match odds including tie' || mname.includes('match odds including tie') || mname.includes('match odds (inc. tie)')) {
        return false
      }
      // Exclude "Match Odds" markets (with space)
      if (mname === 'match odds') {
        return false
      }
      // Exclude "Completed Match" markets
      if (mname === 'completed match' || mname.includes('completed match')) {
        return false
      }
      // Exclude "Super Over" markets
      if (mname === 'super over' || mname.includes('super over')) {
        return false
      }
      // Exclude match-type markets that are not MATCH_ODDS
      const marketType = (market.gtype || '').toLowerCase()
      const marketNameUpper = (market.mname || market.marketName || '').toUpperCase().trim()
      if (marketType === 'match' && marketNameUpper !== 'MATCH_ODDS' && marketNameUpper !== 'MATCH ODDS') {
        return false
      }
      return true
    })
    
    return filteredMarkets
  }, [marketsData, oddsData, bookmakerFancyData, numericMatchId, eventId, marketIds])

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

  // Get eventId from match data or use matchId as fallback
  const currentEventId = useMemo(() => {
    // Try to get eventId from markets data first
    if (marketsData && Array.isArray(marketsData) && marketsData.length > 0) {
      return marketsData[0].event.id
    }
    // Try from matchData
    if (matchData?.eventId) {
      return matchData.eventId
    }
    // Fallback to matchId (which should be eventId)
    return eventId || numericMatchId?.toString()
  }, [marketsData, matchData, eventId, numericMatchId])

  // Streaming URL - using new tresting.com API
  const streamUrl = useMemo(() => {
    if (!currentEventId) return null
    // Generate stream URL if match has TV enabled OR if we have eventId (new API)
    const hasEventId = matchData?.eventId || (marketsData && Array.isArray(marketsData) && marketsData.length > 0)
    if (!matchData?.tv && !hasEventId) return null
    return `https://btocapi.tresting.com/embedN2?eventId=${currentEventId}`
  }, [currentEventId, matchData, marketsData])

  // Extract scorecard data from API response
  const scorecard = useMemo(() => {
    if (!scorecardData) return null
    // Handle API response structure: { message, code, error, data }
    if (scorecardData?.data && !scorecardData.error) {
      return scorecardData.data
    }
    // Fallback if data is directly in response
    if (scorecardData?.batsman || scorecardData?.team1) {
      return scorecardData
    }
    return null
  }, [scorecardData])

  // Transform betting markets from new API or legacy API response
  const bettingMarkets: BettingMarket[] = useMemo(() => {
    if (allMarkets.length === 0) {
      return []
    }

    const markets: BettingMarket[] = []
    
    allMarkets.forEach((marketEntry: any) => {
      // Check if this is the new API format (has marketId and odds)
      if (marketEntry.marketId && marketEntry.odds) {
        const market = marketEntry as MarketResponse & { odds: OddsResponse['data'][0] }
        const marketName = market.marketName || 'MATCH_ODDS'
        const rows: MarketRow[] = []

        // Process each runner from the market
        market.runners.forEach((runner: MarketRunner) => {
          // Skip runners with "Tie" as runnerName
          if (runner.runnerName === 'Tie' || runner.runnerName?.toLowerCase() === 'tie') {
            return
          }
          
          // CRITICAL: Position API uses selectionIds from odds data, not from market runners
          // We need to match market runners to odds runners to get the correct selectionId
          let oddsForRunner: OddsRunner | undefined = undefined
          let positionSelectionId: number = runner.selectionId
          
          if (market.odds?.runners && Array.isArray(market.odds.runners)) {
            // First try: Match by selectionId (if they happen to match)
            oddsForRunner = market.odds.runners.find((r: OddsRunner) => r.selectionId === runner.selectionId)
            
            // Second try: Match by array position (runners are usually in same order)
            // This is the most reliable method since Position API uses odds selectionIds
            if (!oddsForRunner && market.runners.length === market.odds.runners.length) {
              const runnerIndex = market.runners.findIndex((r: MarketRunner) => r.selectionId === runner.selectionId)
              if (runnerIndex >= 0 && runnerIndex < market.odds.runners.length) {
                oddsForRunner = market.odds.runners[runnerIndex]
                positionSelectionId = oddsForRunner.selectionId
                console.log('[Market Transform] Matched by array position:', {
                  team: runner.runnerName,
                  marketRunnerIndex: runnerIndex,
                  marketRunnerSelectionId: runner.selectionId,
                  oddsRunnerSelectionId: oddsForRunner.selectionId,
                  positionSelectionId
                })
              }
            }
            
            // If we found an odds runner, use its selectionId for position matching
            if (oddsForRunner) {
              positionSelectionId = oddsForRunner.selectionId
            } else {
              console.warn('[Market Transform] No odds runner found for market runner:', {
                team: runner.runnerName,
                marketRunnerSelectionId: runner.selectionId,
                availableOddsSelectionIds: market.odds.runners.map((r: OddsRunner) => r.selectionId),
                marketRunnersCount: market.runners.length,
                oddsRunnersCount: market.odds.runners.length,
                marketRunnerIndex: market.runners.findIndex((r: MarketRunner) => r.selectionId === runner.selectionId)
              })
            }
          }
          
          const backOdds: BettingOption[] = []
          const layOdds: BettingOption[] = []

          // Extract back odds (availableToBack) - sort descending (highest first)
          if (oddsForRunner?.ex?.availableToBack && Array.isArray(oddsForRunner.ex.availableToBack)) {
            const sortedBack = [...oddsForRunner.ex.availableToBack]
              .sort((a, b) => b.price - a.price)
              .slice(0, BACK_COLUMNS)
            
            sortedBack.forEach((odd) => {
              backOdds.push({
                odds: odd.price.toString(),
                amount: odd.size >= 1000 ? `${(odd.size / 1000).toFixed(1)}k` : odd.size.toFixed(2)
              })
            })
          }

          // Extract lay odds (availableToLay) - sort ascending (lowest first)
          if (oddsForRunner?.ex?.availableToLay && Array.isArray(oddsForRunner.ex.availableToLay)) {
            const sortedLay = [...oddsForRunner.ex.availableToLay]
              .sort((a, b) => a.price - b.price)
              .slice(0, LAY_COLUMNS)
            
            sortedLay.forEach((odd) => {
              layOdds.push({
                odds: odd.price.toString(),
                amount: odd.size >= 1000 ? `${(odd.size / 1000).toFixed(1)}k` : odd.size.toFixed(2)
              })
            })
          }

          // Normalize to required columns
          while (backOdds.length < BACK_COLUMNS) {
            backOdds.push({ odds: '0', amount: '0' })
          }
          while (layOdds.length < LAY_COLUMNS) {
            layOdds.push({ odds: '0', amount: '0' })
          }

          rows.push({
            team: runner.runnerName || 'Unknown',
            selectionId: positionSelectionId, // Use selectionId from odds data for position matching
            back: backOdds,
            lay: layOdds
          })
          
          // Debug: Log selectionId mapping
          console.log('[Market Transform] SelectionId mapping:', {
            team: runner.runnerName,
            marketRunnerSelectionId: runner.selectionId,
            oddsRunnerSelectionId: oddsForRunner?.selectionId,
            positionSelectionId: positionSelectionId,
            hasOddsRunner: !!oddsForRunner,
            allOddsRunners: market.odds?.runners?.map((r: OddsRunner) => ({
              selectionId: r.selectionId
            })) || []
          })
        })

        if (rows.length > 0) {
          markets.push({
            name: marketName,
            min: 500, // Default min
            max: 500000, // Default max
            rows,
            gtype: 'match', // Default type
            marketId: parseInt(market.marketId.split('.')[1]) || undefined, // Extract numeric part for legacy compatibility
            marketIdString: market.marketId // Store full string for API calls
          })
        }
      } else {
        // Legacy format - process each market entry from private endpoint
        if (!marketEntry.section || marketEntry.section.length === 0) {
          return
        }

        const marketName = marketEntry.mname || 'MATCH_ODDS'
        const rows: MarketRow[] = []

        // Process each section (team/option) in this market
        marketEntry.section.forEach((section: any) => {
          const backOdds: BettingOption[] = []
          const layOdds: BettingOption[] = []

          // Separate back and lay odds, sort them appropriately
          const sortedOdds = [...(section.odds || [])].sort((a: any, b: any) => {
            // For back odds, sort descending (highest first - better for bettor)
            // For lay odds, sort ascending (lowest first - lower liability)
            if (a.otype === b.otype) {
              return a.otype === 'back' ? b.odds - a.odds : a.odds - b.odds
            }
            return 0
          })

          sortedOdds.forEach((odd: any) => {
            const formattedOdd = odd.odds === 0 ? '0' : odd.odds.toString()
            const formattedSize = odd.size >= 1000 
              ? `${(odd.size / 1000).toFixed(1)}k` 
              : odd.size === 0 ? '0' : odd.size.toFixed(2)

            if (odd.otype === 'back') {
              backOdds.push({
                odds: formattedOdd,
                amount: formattedSize
              })
            } else if (odd.otype === 'lay') {
              layOdds.push({
                odds: formattedOdd,
                amount: formattedSize
              })
            }
          })

          // Only keep the primary Back/Lay columns (best available odds)
          const normalizedBackOdds = backOdds.slice(0, BACK_COLUMNS)
          const normalizedLayOdds = layOdds.slice(0, LAY_COLUMNS)

          while (normalizedBackOdds.length < BACK_COLUMNS) {
            normalizedBackOdds.push({ odds: '0', amount: '0' })
          }
          while (normalizedLayOdds.length < LAY_COLUMNS) {
            normalizedLayOdds.push({ odds: '0', amount: '0' })
          }

          rows.push({
            team: section.nat || 'Unknown',
            selectionId: section.sid,
            back: normalizedBackOdds,
            lay: normalizedLayOdds
          })
        })

        if (rows.length > 0) {
          // Get gscode and gstatus from first section or market entry
          const firstSection = marketEntry.section?.[0]
          const gscode = firstSection?.gscode ?? marketEntry.gscode
          const gstatus = firstSection?.gstatus ?? marketEntry.gstatus
          
          markets.push({
            name: marketName,
            min: marketEntry.min || 500,
            max: marketEntry.max || (marketEntry.m || 500000),
            rows,
            gtype: marketEntry.gtype,
            marketId: marketEntry.mid,
            marketIdString: marketEntry.mid ? marketEntry.mid.toString() : undefined, // Convert mid to string for API calls
            gscode,
            gstatus
          })
        }
      }
    })

    // Sort markets in the correct order:
    // 1. MATCH_ODDS (first)
    // 2. Bookmaker-fancy (match1 type) - shown on top of normal fancy
    // 3. Fancy markets (fancy, fancy2, fancy1, oddeven, cricketcasino, meter)
    // 4. Other detail API markets (like "1st Innings 20 Overs Line", "Completed Match")
    const sortedMarkets = [...markets].sort((a: BettingMarket, b: BettingMarket) => {
      const aName = (a.name || '').toUpperCase()
      const bName = (b.name || '').toUpperCase()
      const aType = (a.gtype || '').toLowerCase()
      const bType = (b.gtype || '').toLowerCase()
      
      // Helper function to get sort priority
      const getPriority = (name: string, type: string): number => {
        // 1. MATCH_ODDS always first
        if (name === 'MATCH_ODDS' || name === 'MATCH ODDS') return 1
        // 2. Bookmaker-fancy (match1 type) - show on top of normal fancy
        if (type === 'match1' || name === 'BOOKMAKER') return 2
        // 3. Fancy markets
        if (type === 'fancy' || type === 'fancy2' || type === 'fancy1' || type === 'oddeven' || type === 'cricketcasino' || type === 'meter') return 3
        // 4. Other detail API markets (from new API format - no gtype or specific market names)
        // These include markets like "1st Innings 20 Overs Line", "Completed Match", etc.
        if (!type || type === '' || (type !== 'match1' && type !== 'match')) return 4
        // 5. Other match types
        return 5
      }
      
      const aPriority = getPriority(aName, aType)
      const bPriority = getPriority(bName, bType)
      
      // Sort by priority
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      // If same priority, maintain original order or sort by name
      return aName.localeCompare(bName)
    })

    return sortedMarkets
  }, [allMarkets])

  // Clear positions when matchId changes (prevent mixing positions across matches)
  useEffect(() => {
    console.log('[Positions] Match changed, clearing positions:', { matchId, previousMatchId: stablePositionsRef.current._lastMatchId })
    stablePositionsRef.current.matchOdds = {}
    stablePositionsRef.current.bookmaker = {}
    stablePositionsRef.current.fancy = {}
    stablePositionsRef.current._lastMatchId = matchId
  }, [matchId])

  // Extract positions from API response - STABLE STATE (merges with existing, never clears)
  // 
  // NEW API FORMAT (simplified):
  // {
  //   "eventId": "32547891",
  //   "matchOdds": {
  //     "681460": 122,    // ← Match Detail API selectionId
  //     "63361": 0        // ← Match Detail API selectionId
  //   },
  //   "bookmaker": {
  //     "681460": 120,
  //     "63361": -150
  //   },
  //   "fancy": {
  //     "fancyId_1": {
  //       "YES": 50,
  //       "NO": -100
  //     }
  //   }
  // }
  //
  // CRITICAL RULES:
  // 1. marketId is UNRELIABLE and completely ignored (not in new API)
  // 2. matchOdds and bookmaker are already normalized: { [selectionId: string]: number }
  // 3. Extract directly - NO calculations, NO transformations
  // 4. Each match handled independently (scoped by eventId)
  useEffect(() => {
    console.log('[Positions] Raw API response:', {
      hasData: !!positionsData,
      success: positionsData?.success,
      data: positionsData?.data,
      eventId: positionsData?.data?.eventId
    })

    // Only update positions if API returns valid data
    if (positionsData?.success && positionsData?.data) {
      const data = positionsData.data
      
      console.log('[Positions] Processing positions data:', {
        hasMatchOdds: !!data.matchOdds,
        matchOddsType: typeof data.matchOdds,
        matchOddsValue: data.matchOdds,
        hasBookmaker: !!data.bookmaker,
        bookmakerType: typeof data.bookmaker,
        bookmakerValue: data.bookmaker,
        hasFancy: !!data.fancy,
        fancyType: typeof data.fancy
      })

      // Extract matchOdds positions - already in normalized format: { [selectionId: string]: number }
      // Example: { "7337": 80, "10301": -200 }
      if (data.matchOdds && typeof data.matchOdds === 'object') {
        console.log('[Positions] Extracting matchOdds positions:', {
          matchOddsKeys: Object.keys(data.matchOdds),
          matchOddsEntries: Object.entries(data.matchOdds)
        })
        
        Object.entries(data.matchOdds).forEach(([selectionId, netValue]: [string, any]) => {
          // netValue is already a number (no nested object structure)
          // Store directly - NO calculations, NO transformations
          if (netValue !== undefined && netValue !== null) {
            stablePositionsRef.current.matchOdds[String(selectionId)] = Number(netValue)
            console.log('[Positions] Stored matchOdds position:', {
              selectionId: String(selectionId),
              net: Number(netValue),
              stored: stablePositionsRef.current.matchOdds[String(selectionId)]
            })
          } else {
            console.log('[Positions] Skipping matchOdds position - invalid value:', {
              selectionId,
              netValue,
              type: typeof netValue
            })
          }
        })
        
        console.log('[Positions] Final matchOdds positions after extraction:', {
          allPositions: stablePositionsRef.current.matchOdds,
          keys: Object.keys(stablePositionsRef.current.matchOdds),
          count: Object.keys(stablePositionsRef.current.matchOdds).length
        })
      } else {
        console.log('[Positions] No matchOdds data to extract:', {
          hasMatchOdds: !!data.matchOdds,
          type: typeof data.matchOdds
        })
      }

      // Extract bookmaker positions - same normalized format: { [selectionId: string]: number }
      // Example: { "7337": 120, "10301": -150 }
      if (data.bookmaker && typeof data.bookmaker === 'object') {
        console.log('[Positions] Extracting bookmaker positions:', {
          bookmakerKeys: Object.keys(data.bookmaker),
          bookmakerEntries: Object.entries(data.bookmaker)
        })
        
        Object.entries(data.bookmaker).forEach(([selectionId, netValue]: [string, any]) => {
          // netValue is already a number (no nested object structure)
          // Store directly - NO calculations, NO transformations
          if (netValue !== undefined && netValue !== null) {
            stablePositionsRef.current.bookmaker[String(selectionId)] = Number(netValue)
            console.log('[Positions] Stored bookmaker position:', {
              selectionId: String(selectionId),
              net: Number(netValue)
            })
          }
        })
        
        console.log('[Positions] Final bookmaker positions after extraction:', {
          allPositions: stablePositionsRef.current.bookmaker,
          keys: Object.keys(stablePositionsRef.current.bookmaker)
        })
      }

      // Extract fancy positions - format: { [fancyId: string]: { YES: number, NO: number } }
      // Example: { "fancyId_1": { "YES": 50, "NO": -100 } }
      if (data.fancy && typeof data.fancy === 'object') {
        Object.entries(data.fancy).forEach(([fancyId, fancyPositions]: [string, any]) => {
          // fancyPositions is already an object: { YES: number, NO: number }
          if (fancyPositions && typeof fancyPositions === 'object') {
            // Initialize fancy entry if not exists
            if (!stablePositionsRef.current.fancy[fancyId]) {
              stablePositionsRef.current.fancy[fancyId] = {}
            }
            
            // Extract YES/NO values directly - already numbers, no nested structure
            Object.entries(fancyPositions).forEach(([key, netValue]: [string, any]) => {
              // Key is "YES" or "NO", netValue is already a number
              if (netValue !== undefined && netValue !== null) {
                stablePositionsRef.current.fancy[fancyId][key] = Number(netValue)
              }
            })
          }
        })
      }
    }
    // Note: We never clear positions even if API returns empty/partial response
  }, [positionsData])

  // Memoized positions for rendering - always uses stable ref
  // Match Odds & Bookmaker: Record<selectionId, net>
  // Fancy: Record<fancyId, Record<YES/NO, net>>
  const positionsByMarketType = useMemo(() => {
    const result = {
      matchOdds: { ...stablePositionsRef.current.matchOdds }, // selectionId -> net (create new object for reactivity)
      bookmaker: { ...stablePositionsRef.current.bookmaker }, // selectionId -> net
      fancy: { ...stablePositionsRef.current.fancy } // fancyId -> { YES/NO -> net }
    }
    
    console.log('[Positions] Memoized positions for rendering:', {
      matchOdds: result.matchOdds,
      matchOddsKeys: Object.keys(result.matchOdds),
      matchOddsCount: Object.keys(result.matchOdds).length,
      bookmaker: result.bookmaker,
      bookmakerKeys: Object.keys(result.bookmaker),
      refMatchOdds: stablePositionsRef.current.matchOdds,
      refMatchOddsKeys: Object.keys(stablePositionsRef.current.matchOdds)
    })
    
    return result
  }, [positionsData]) // Re-render when positionsData changes (but positions persist in ref)

  // onPlaceBetClick function - simplified (no optimistic updates needed)
  const onPlaceBetClick = (newBet: {
    selectionId?: number
    type: 'back' | 'lay'
    odds: string
    stake?: string
    betvalue?: number
  }) => {
    // Position updates will come from API polling
    // No need for optimistic updates
  }

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

  // Use transformed markets only (no fallback/dummy data)
  const displayMarkets = bettingMarkets
  const displayMatchData = matchData ? transformedMatchData : {
    title: 'Match not found',
    date: '',
    time: '',
    isLive: false,
    hasLiveTV: false
  }

  // Calculate bet history tabs with counts from markets
  const tabs = useMemo(() => {
    // Handle both new API format (marketName) and legacy format (mname/gtype)
    const oddsMarkets = allMarkets.filter((m: any) => {
      if (m.marketName) {
        return m.marketName === 'Match Odds'
      }
      return m.mname === 'MATCH_ODDS' || m.gtype === 'match'
    }).length
    
    const bmMarkets = allMarkets.filter((m: any) => {
      if (m.marketName) {
        return m.marketName === 'Bookmaker'
      }
      return m.mname === 'Bookmaker' || m.gtype === 'match1'
    }).length
    
    const fancyMarkets = allMarkets.filter((m: any) => {
      if (m.marketName) {
        return m.marketName.toLowerCase().includes('fancy')
      }
      return m.gtype === 'fancy' || m.gtype === 'fancy2'
    }).length
    
    const oddevenMarkets = allMarkets.filter((m: any) => {
      if (m.marketName) {
        return m.marketName.toLowerCase().includes('odd') || m.marketName.toLowerCase().includes('even')
      }
      return m.gtype === 'oddeven'
    }).length
    
    const casinoMarkets = allMarkets.filter((m: any) => {
      if (m.marketName) {
        return m.marketName.toLowerCase().includes('casino')
      }
      return m.gtype === 'cricketcasino'
    }).length
    
    return [
      { id: 'all', label: 'All', count: allMarkets.length },
      { id: 'odds', label: 'odds', count: oddsMarkets },
      { id: 'bm', label: 'bm', count: bmMarkets },
      { id: 'fancy', label: 'fancy', count: fancyMarkets },
      { id: 'oddeven', label: 'oddeven', count: oddevenMarkets },
      { id: 'casino', label: 'casino', count: casinoMarkets }
    ]
  }, [allMarkets])

  // Bet history data (will be populated from API)
  const betHistory: BetHistoryItem[] = []

  // Responsive layout calculations
  const getMainLayoutClass = () => {
    if (!displayMatchData.hasLiveTV || !streamUrl) {
      return 'flex flex-col'
    }
    
    if (isMobile) {
      return 'flex flex-col'
    }
    
    if (isTablet) {
      return 'grid grid-cols-1 md:grid-cols-12 gap-0'
    }
    
    return 'grid grid-cols-12 gap-0'
  }

  const getLeftPanelClass = () => {
    if (!displayMatchData.hasLiveTV || !streamUrl) {
      return 'col-span-12'
    }
    
    if (isMobile) {
      return 'col-span-12'
    }
    
    if (isTablet) {
      return 'col-span-12 md:col-span-8 border-r border-gray-200'
    }
    
    return 'col-span-12 md:col-span-8 border-r border-gray-200'
  }

  const getRightPanelClass = () => {
    if (!displayMatchData.hasLiveTV || !streamUrl) {
      return 'col-span-12'
    }
    
    if (isMobile) {
      return 'col-span-12'
    }
    
    if (isTablet) {
      return 'col-span-12 md:col-span-4'
    }
    
    return 'col-span-12 md:col-span-4'
  }

  // Early return if SUPER_ADMIN or ADMIN tries to access (must be after all hooks)
  if (isSuperAdmin || isAdmin) {
    return null
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

  return (
    <div className="min-h-screen bg-white">
      {/* Dashboard Header - Only for CLIENT role */}
      {isClient && (
        <DashboardHeader 
          selectedTab={dashboardTab} 
          onSelectTab={handleTabChange} 
        />
      )}
      
      {/* Main Content Area - Responsive Grid Layout */}
      <div className={`${isClient ? 'min-h-[calc(100vh-108px)]' : 'min-h-[calc(100vh-64px)]'} ${getMainLayoutClass()}`}>
        {/* Left Panel - Betting Markets (with integrated scorecard) */}
        <div className={`flex flex-col bg-white ${getLeftPanelClass()} px-2 sm:px-0`} style={{ gap: 0 }}>
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
              <div className="bg-white flex flex-col sm:block md:hidden border-b border-gray-200">
                {/* Live TV Toggle Header */}
                <div className="bg-[#00A66E] text-white px-3 sm:px-4 py-2 flex items-center justify-between flex-shrink-0">
                  <span className="text-xs sm:text-sm font-semibold">Live TV</span>
          <button
            onClick={() => canToggleTV && setLiveToggle(!liveToggle)}
            disabled={!canToggleTV}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              !canToggleTV 
                ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                : liveToggle 
                  ? 'bg-white' 
                  : 'bg-gray-300'
            }`}
            title={
              !canToggleTV 
                ? 'Minimum wallet balance of Rs 200 required to access Live TV' 
                : liveToggle 
                  ? 'Turn off Live TV' 
                  : 'Turn on Live TV'
            }
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform flex items-center justify-center ${
                !canToggleTV
                  ? 'bg-gray-500'
                  : liveToggle
                    ? 'bg-[#00A66E] translate-x-5'
                    : 'bg-[#00A66E] translate-x-0'
              }`}
            >
              {liveToggle && canToggleTV ? (
                        <span className="text-white text-xs font-bold">✓</span>
              ) : (
                        <span className={`text-xs font-bold ${!canToggleTV ? 'text-gray-300' : 'text-white'}`}>−</span>
              )}
            </div>
          </button>
        </div>
                
                {/* Live Video Stream - Only show when toggle is ON */}
                {liveToggle && (
                  <div className="relative bg-gray-900 flex-shrink-0 flex items-center justify-center" style={{ minHeight: '250px', aspectRatio: '16/9' }}>
                    {!streamLoadError ? (
                      <>
                        <iframe
                          key={`stream-sm-md-${numericMatchId}-${liveToggle}`}
                          src={streamUrl}
                          className="w-full h-full border-0 absolute inset-0"
                          allow="autoplay; encrypted-media; fullscreen"
                          allowFullScreen
                          title="Live Match Stream"
                          onLoad={() => {
                            console.log('[Stream] Stream iframe loaded successfully')
                            setStreamLoadError(false)
                          }}
                          onError={() => {
                            console.error('[Stream] Failed to load stream:', streamUrl)
                            setStreamLoadError(true)
                          }}
                        />
                        {/* Loading overlay - shown initially */}
                        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10 pointer-events-none opacity-0 transition-opacity duration-300" id="stream-loading-overlay">
                          <div className="text-center text-white px-4">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
                            <p className="text-sm opacity-75">Loading stream...</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Error state when stream fails to load */
                      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
                        <div className="text-center text-white px-4">
                          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm font-medium mb-2">Stream Unavailable</p>
                          <p className="text-xs opacity-75 mb-4">The live stream is not available at this time.</p>
                          <button
                            onClick={() => {
                              setStreamLoadError(false)
                              // Force iframe reload by toggling
                              setLiveToggle(false)
                              setTimeout(() => setLiveToggle(true), 100)
                            }}
                            className="px-4 py-2 bg-[#00A66E] hover:bg-[#00C97A] text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    )}
                  
                  {/* Video Overlay - Score and Match Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 sm:p-3 text-white">
                    {/* Current Score Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1 sm:mb-2 text-xs sm:text-sm font-semibold gap-1">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="truncate">{(scorecard?.team1?.shortName || matchData?.ename?.split(/\s+v\s+/i)[0] || 'Team A')?.toUpperCase()}</span>
                        <span>{scorecard?.team1?.score || '0-0'}</span>
                        <span className="text-[5px] sm:text-xs font-normal text-gray-300">{scorecard?.team1?.overs || '0'}</span>
                      </div>
                      <div className="text-[5px] sm:text-xs text-gray-300 truncate">
                        {(scorecard?.team2?.shortName || matchData?.ename?.split(/\s+v\s+/i)[1] || 'Team B')?.toUpperCase()}
                      </div>
                    </div>
                
                    
                    {/* Player Scores */}
                    {/* {matchData?.current_batsmen && Array.isArray(matchData.current_batsmen) && matchData.current_batsmen.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs mb-1 sm:mb-2">
                        {matchData.current_batsmen.slice(0, 2).map((player: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="font-semibold truncate">{player.name || `Player ${idx + 1}`}</span>
                            <span>{player.runs || '0'}</span>
                            <span className="text-gray-400">({player.balls || '0'})</span>
                          </div>
                        ))}
                      </div>
                    )} */}
                    
           
                    {/* Video Controls */}
                    <div className="flex items-center justify-end gap-2 mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-white/20">
                      <button
                        onClick={() => {
                          // Toggle audio/mute
                        }}
                        className="p-1 hover:bg-white/20 rounded"
                        title="Toggle Audio"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.935 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.935l3.448-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          // Close video
                        }}
                        className="p-1 hover:bg-white/20 rounded"
                        title="Close Video"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Stream Branding (Top Right) */}
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-[10px] sm:text-xs font-semibold">
                    CANAL+ SPORT 360
                  </div>
                </div>
              )}
              </div>
            )}
            {displayMarkets.length > 0 ? (
              displayMarkets.map((market, marketIndex) => {
                // Determine if this is a match odds market or fancy market
                const marketName = (market.name || '').toUpperCase().trim()
                const marketType = (market.gtype || '').toLowerCase()
                // STRICT check: Only "MATCH_ODDS" or "MATCH ODDS" by name, not by type
                const isMatchOdds = marketName === 'MATCH_ODDS' || marketName === 'MATCH ODDS'
                const isFancy = marketType === 'fancy' || marketType === 'fancy2' || marketType === 'fancy1' || marketType === 'oddeven' || marketType === 'cricketcasino' || marketType === 'meter'
                
                const handleBetSelect = (bet: {
                  team: string
                  type: 'back' | 'lay'
                  odds: string
                  market: string
                  selectionId?: number
                  marketId?: number | string
                  marketIdString?: string
                  marketGType?: string
                  size?: number // For fancy markets: the percentage/size value
                }) => {
                  setSelectedBet(bet)
                  setBetSlipOpen(true)
                }

                // POSITION MAPPING: Pass normalized positions to MatchOdds component
                // 
                // NEW API FORMAT (already normalized):
                // {
                //   "matchOdds": { "7337": 80, "10301": -200 },
                //   "bookmaker": { "7337": 120, "10301": -150 }
                // }
                //
                // Matching in MatchOdds: String(row.selectionId) === Object.keys(positions)
                // 
                // RULES:
                // 1. marketId is UNRELIABLE and completely ignored (not in new API)
                // 2. Match ONLY by selectionId
                // 3. Positions shown ONLY in MatchOdds (not in Fancy)
                // 4. No calculations or transformations
                let positionsForMarket: Record<string, number> | undefined = undefined
                
                if (isMatchOdds) {
                  // Match Odds: Pass normalized positions object
                  // Component will match: String(row.selectionId) === positions[selectionId]
                  positionsForMarket = positionsByMarketType.matchOdds
                  
                  console.log('[Positions] Passing to MatchOdds component:', {
                    marketName: market.name,
                    marketIndex,
                    positions: positionsForMarket,
                    positionsKeys: positionsForMarket ? Object.keys(positionsForMarket) : [],
                    positionsCount: positionsForMarket ? Object.keys(positionsForMarket).length : 0,
                    marketRows: market.rows.map((r: any) => ({
                      team: r.team,
                      selectionId: r.selectionId,
                      selectionIdStr: String(r.selectionId),
                      willMatch: positionsForMarket ? positionsForMarket[String(r.selectionId)] !== undefined : false
                    }))
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
                      onBetSelect={handleBetSelect}
                      onRefresh={refetch}
                      positions={positionsForMarket}
                    />
                  )
                }

                // Use FancyDetail component for fancy markets
                // NOTE: Do NOT pass positions to FancyDetail (positions only shown in MatchOdds component)
                if (isFancy) {
                  return (
                    <FancyDetail
                      key={marketIndex}
                      market={market}
                      marketIndex={marketIndex}
                      blinkingOdds={blinkingOdds}
                      isMobile={isMobile}
                      onBetSelect={handleBetSelect}
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
                    onBetSelect={handleBetSelect}
                    onRefresh={market.name === 'MATCH_ODDS' ? refetch : undefined}
                    positions={positionsForMarket}
                  />
                )
              })
            ) : (
              // Empty state when no markets are available
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-white">
                <div className="text-center max-w-md">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Markets Available</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {displayMatchData.title !== 'Match not found' 
                      ? 'Betting markets are not available for this match at the moment. Please check back later.'
                      : 'Match data could not be loaded. Please verify the match ID and try again.'}
                  </p>
                  <button
                    onClick={refetch}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A66E] text-white rounded-lg hover:bg-[#00C97A] transition-colors text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </div>

          {authUser && (!displayMatchData.hasLiveTV || !streamUrl || isMobile) ? (
            <div className="px-3 sm:px-4 py-4 border-t-2 border-gray-200">
              {renderUserPendingBets()}
            </div>
          ) : null}
        </div>

        {/* Right Panel - Live Video (if TV enabled) + Betting Summary - Desktop only (md+) */}
        {displayMatchData.hasLiveTV && streamUrl && (
          <div className={`hidden md:flex bg-white flex-col ${getRightPanelClass()}`}>
            {/* Live TV Toggle Header - At top of TV section */}
            <div className="bg-[#00A66E] text-white px-3 sm:px-4 py-2 flex items-center justify-between flex-shrink-0">
              <span className="text-sm font-semibold">Live TV</span>
              <button
                onClick={() => canToggleTV && setLiveToggle(!liveToggle)}
                disabled={!canToggleTV}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  !canToggleTV 
                    ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                    : liveToggle 
                      ? 'bg-white' 
                      : 'bg-gray-300'
                }`}
                title={
                  !canToggleTV 
                    ? 'Minimum wallet balance of Rs 200 required to access Live TV' 
                    : liveToggle 
                      ? 'Turn off Live TV' 
                      : 'Turn on Live TV'
                }
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform flex items-center justify-center ${
                    !canToggleTV
                      ? 'bg-gray-500'
                      : liveToggle
                        ? 'bg-[#00A66E] translate-x-5'
                        : 'bg-[#00A66E] translate-x-0'
                  }`}
                >
                  {liveToggle && canToggleTV ? (
                    <span className="text-white text-xs font-bold">✓</span>
                  ) : (
                    <span className={`text-xs font-bold ${!canToggleTV ? 'text-gray-300' : 'text-white'}`}>−</span>
                  )}
                </div>
              </button>
            </div>
            
            {/* Live Video Stream - Only show when toggle is ON */}
            {liveToggle && (
              <div className="relative bg-gray-900 flex-shrink-0 flex items-center justify-center" style={{ 
                minHeight: isMobile ? '250px' : '400px', 
                aspectRatio: isMobile ? '16/9' : 'auto'
              }}>
                {!streamLoadError ? (
                  <>
                    <iframe
                      key={`stream-${numericMatchId}-${liveToggle}`}
                      src={streamUrl}
                      className="w-full h-full border-0 absolute inset-0"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                      title="Live Match Stream"
                      onLoad={() => {
                        console.log('[Stream] Stream iframe loaded successfully')
                        setStreamLoadError(false)
                      }}
                      onError={() => {
                        console.error('[Stream] Failed to load stream:', streamUrl)
                        setStreamLoadError(true)
                      }}
                    />
                    {/* Loading overlay - shown initially */}
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10 pointer-events-none opacity-0 transition-opacity duration-300" id="stream-loading-overlay-desktop">
                      <div className="text-center text-white px-4">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
                        <p className="text-sm opacity-75">Loading stream...</p>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Error state when stream fails to load */
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
                    <div className="text-center text-white px-4">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium mb-2">Stream Unavailable</p>
                      <p className="text-xs opacity-75 mb-4">The live stream is not available at this time.</p>
                      <button
                        onClick={() => {
                          setStreamLoadError(false)
                          // Force iframe reload by toggling
                          setLiveToggle(false)
                          setTimeout(() => setLiveToggle(true), 100)
                        }}
                        className="px-4 py-2 bg-[#00A66E] hover:bg-[#00C97A] text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
         
            </div>
            )}

            {/* Logged-in user's pending settlements for this match - shown below TV on desktop */}
            {authUser && (
              <div className="px-3 sm:px-4 py-4 border-t border-gray-200">
                {renderUserPendingBets()}
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