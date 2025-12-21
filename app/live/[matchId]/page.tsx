'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Pin, RefreshCw, Tv } from 'lucide-react'
import { useGetCricketMatchDetailQuery, useGetCricketMatchPrivateQuery, useGetCricketMatchMarketsQuery, useGetCricketMatchOddsQuery, useGetCricketBookmakerFancyQuery } from '@/app/services/CricketApi'
import { useLiveOdds } from '@/app/hooks/useWebSocket'
import DashboardHeader from '@/components/dashboard-header'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'
import { useGetMyPendingBetsQuery } from '@/app/services/Api'
import BetSlipModal from '@/components/modal/BetSlipModal'

interface BettingOption {
  odds: number | string
  amount: number | string
}

interface MarketRow {
  team: string
  back: BettingOption[]
  lay: BettingOption[]
  selectionId?: number
}

interface BettingMarket {
  name: string
  min: number
  max: number
  rows: MarketRow[]
  gtype?: string
  marketId?: number | string
  marketIdString?: string // Store the full marketId string for API calls
}

interface BetHistoryItem {
  userName: string
  market: string
  rate: string
  amount: string
  date: string
}

// API Response interfaces
interface ApiOdds {
  sid: number
  psid: number
  odds: number
  otype: 'back' | 'lay'
  oname: string
  tno: number
  size: number
}

interface ApiSection {
  sid: number
  sno: number
  gstatus: string
  gscode: number
  nat: string
  odds: ApiOdds[]
}

interface ApiMatchMarket {
  gmid: number
  ename: string
  etid: number
  cid: number
  cname: string
  iplay: boolean
  stime: string
  tv: boolean
  bm: boolean
  f: boolean
  f1: boolean
  iscc: number
  mid: number
  mname: string
  status: string
  rc: number
  gscode: number
  m: number
  oid: number
  gtype: string
  section: ApiSection[]
}

interface ApiResponse {
  success: boolean
  msg: string
  status: number
  data: {
    t1: ApiMatchMarket[]  // Live matches
    t2?: ApiMatchMarket[] // Upcoming matches (optional)
  }
  lastUpdatedaAt?: string  // Note: typo in API response
}

// New API Response interfaces
interface MarketRunner {
  selectionId: number
  runnerName: string
  handicap: number
  sortPriority: number
}

interface MarketResponse {
  marketId: string
  competition: {
    id: string
    name: string
    provider: string
  }
  event: {
    id: string
    name: string
    countryCode: string
    timezone: string
    openDate: string
  }
  eventType: {
    id: string
    name: string
  }
  marketName: string
  runners: MarketRunner[]
  totalMatched: number
  marketStartTime: string
}

interface OddsRunner {
  selectionId: number
  handicap: number
  status: string
  lastPriceTraded: number
  totalMatched: number
  ex: {
    availableToBack: Array<{ price: number; size: number }>
    availableToLay: Array<{ price: number; size: number }>
    tradedVolume: Array<{ price: number; size: number }>
  }
}

interface OddsResponse {
  status: boolean
  data: Array<{
    marketId: string
    isMarketDataDelayed: boolean
    status: string
    betDelay: number
    inplay: boolean
    totalMatched: number
    totalAvailable: number
    runners: OddsRunner[]
  }>
}

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
  } | null>(null)

  const BACK_COLUMNS = 1
  const LAY_COLUMNS = 1

  // Pending settlements/bets for logged-in user across matches
  const { data: myPendingBetsData, isLoading: isLoadingPendingBets, refetch: refetchPendingBets } = useGetMyPendingBetsQuery(undefined)

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
                {userPendingBets.map((bet: any, idx: number) => (
                  <tr key={bet.id || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
                ))}
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

  // Fetch match details using the detail endpoint (for header info - legacy)
  const { data: matchDetailData, isLoading: isLoadingDetail, error: detailError, refetch: refetchDetail } = useGetCricketMatchDetailQuery(
    { sid: 4, gmid: numericMatchId! },
    { skip: !numericMatchId }
  )

  // Fetch match private data (for all markets - odds, fancy, etc. - legacy fallback)
  const { data: matchPrivateData, isLoading: isLoadingPrivate, error: privateError, refetch: refetchPrivate } = useGetCricketMatchPrivateQuery(
    { sid: 4, gmid: numericMatchId! },
    { skip: !numericMatchId }
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

  // Subscribe to live odds updates via WebSocket (legacy format only)
  // New API format uses direct API polling instead of WebSocket (backend has cronjob)
  const liveOdds = useLiveOdds(
    4, // legacy sid (fallback)
    numericMatchId, // legacy gmid (fallback)
    undefined, // Skip WebSocket for new API format - use direct API polling
    undefined // Skip WebSocket for new API format - use direct API polling
  )

  const isLoading = isLoadingMarkets || isLoadingOdds || isLoadingDetail || isLoadingPrivate || isLoadingBookmakerFancy
  const error = marketsError || oddsError || detailError || privateError || bookmakerFancyError

  // Combined refetch function
  const refetch = () => {
    refetchMarkets()
    refetchOdds()
    refetchDetail()
    refetchPrivate()
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
    
    // Fallback to legacy detail response
    if (!matchDetailData) return null
    
    // Handle response structure
    let match: any = null
    
    if (Array.isArray(matchDetailData) && matchDetailData.length > 0) {
      match = matchDetailData[0]
    } else if (matchDetailData?.success && matchDetailData?.data) {
      if (Array.isArray(matchDetailData.data) && matchDetailData.data.length > 0) {
        match = matchDetailData.data[0]
      }
    }
    
    return match
  }, [marketsData, matchDetailData])

  // Extract all markets - use new markets API with odds from direct API polling (no WebSocket for new API)
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
        
        // Only use WebSocket for legacy format (not for new API)
        if (!oddsForMarket && liveOdds?.data && numericMatchId) {
          // Legacy format WebSocket fallback
          if (Array.isArray(liveOdds.data)) {
            oddsForMarket = liveOdds.data.find((odds: any) => 
              odds.gmid && odds.gmid.toString() === numericMatchId.toString()
            )
          } else if (liveOdds.data?.data && Array.isArray(liveOdds.data.data)) {
            oddsForMarket = liveOdds.data.data.find((odds: any) => 
              odds.gmid && odds.gmid.toString() === numericMatchId.toString()
            )
          }
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
          marketName: m.marketName, 
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
    
    // If no new API markets, fallback to live odds from WebSocket (legacy format)
    if (markets.length === 0 && liveOdds?.data) {
      // Handle live odds response structure - could be direct array or wrapped
      if (Array.isArray(liveOdds.data)) {
        markets = liveOdds.data
      } else if (liveOdds.data?.success && Array.isArray(liveOdds.data.data)) {
        markets = liveOdds.data.data
      } else if (liveOdds.data?.data && Array.isArray(liveOdds.data.data)) {
        markets = liveOdds.data.data
      }
      
      if (markets.length > 0) {
        console.log('[MatchDetail] Using live odds from WebSocket (legacy):', {
          matchId: numericMatchId,
          marketsFound: markets.length,
          markets: markets.map((m: any) => ({ gmid: m.gmid, mid: m.mid, mname: m.mname, gtype: m.gtype }))
        })
      }
    }
    
    // Final fallback to API data from private endpoint
    if (markets.length === 0 && matchPrivateData) {
      // Handle API response structure
      if (Array.isArray(matchPrivateData)) {
        markets = matchPrivateData
      } else if (matchPrivateData?.success && Array.isArray(matchPrivateData.data)) {
        markets = matchPrivateData.data
      }
      
      console.log('[MatchDetail] Using legacy API markets:', {
        matchId: numericMatchId,
        marketsFound: markets.length,
        markets: markets.map((m: any) => ({ gmid: m.gmid, mid: m.mid, mname: m.mname, gtype: m.gtype }))
      })
    }
    
    // Filter out markets with "2nd" in mname and "Tied Match" markets (case-insensitive)
    const filteredMarkets = markets.filter((market: any) => {
      const mname = (market.mname || market.marketName || '').toLowerCase().trim()
      // Exclude markets with "2nd" in the name
      if (mname.includes('2nd')) {
        return false
      }
      // Exclude "Tied Match" markets (exact match or contains "tied match" as a phrase)
      if (mname === 'tied match' || mname.startsWith('tied match')) {
        return false
      }
      return true
    })
    
    return filteredMarkets
  }, [marketsData, oddsData, liveOdds, matchPrivateData, bookmakerFancyData, numericMatchId, eventId, marketIds])

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

  // Live Score URL - using new tresting.com API
  // Only show scorecard if we have a valid eventId from markets API (not fallback)
  const liveScoreUrl = useMemo(() => {
    // Prioritize eventId from markets data (most reliable)
    let validEventId: string | null = null
    
    if (marketsData && Array.isArray(marketsData) && marketsData.length > 0) {
      validEventId = marketsData[0].event.id
      console.log('[Scorecard] Using eventId from markets data:', validEventId)
    } else if (matchData?.eventId) {
      validEventId = matchData.eventId
      console.log('[Scorecard] Using eventId from matchData:', validEventId)
    } else {
      // Don't use fallback matchId - only show if we have real eventId
      console.log('[Scorecard] No valid eventId found, skipping scorecard')
      return null
    }
    
    if (!validEventId || validEventId === 'null' || validEventId === 'undefined' || validEventId.trim() === '') {
      console.log('[Scorecard] Invalid eventId value:', validEventId)
      return null
    }
    
    // const url = `https://score.tresting.com/socket-iframe-7/crickexpo/${validEventId.trim()}`
    // console.log('[Scorecard] Generated URL:', url)
    // return url
  }, [marketsData, matchData])

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
          const oddsForRunner = market.odds?.runners?.find((r: OddsRunner) => r.selectionId === runner.selectionId)
          
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
            selectionId: runner.selectionId,
            back: backOdds,
            lay: layOdds
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
          markets.push({
            name: marketName,
            min: marketEntry.min || 500,
            max: marketEntry.max || (marketEntry.m || 500000),
            rows,
            gtype: marketEntry.gtype,
            marketId: marketEntry.mid,
            marketIdString: marketEntry.mid ? marketEntry.mid.toString() : undefined // Convert mid to string for API calls
          })
        }
      }
    })

    return markets
  }, [allMarkets])

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
        <div className={`flex flex-col bg-white ${getLeftPanelClass()}`} style={{ gap: 0 }}>
          {/* Betting Markets Section - Scorecard integrated as first item */}
          <div className="relative" style={{ margin: 0, padding: 0, gap: 0 }}>
            {/* Live Score iframe - First item in markets section */}
            {liveScoreUrl && (
              <div 
                className="bg-gray-900 overflow-hidden relative" 
                style={{ 
                  margin: 0, 
                  marginBottom: 0,
                  padding: 0, 
                  lineHeight: 0,
                  fontSize: 0,
                  borderBottom: 'none'
                }}
              >
                <iframe
                  key={`live-score-${currentEventId || numericMatchId}`}
                  src={liveScoreUrl}
                  className="w-full border-0"
                  style={{ 
                    height: isMobile ? '380px' : '480px', 
                    margin: 0, 
                    padding: 0, 
                    display: 'block',
                    border: 'none',
                    overflow: 'hidden',
                    verticalAlign: 'top'
                  }}
                  allow="autoplay; encrypted-media"
                  scrolling="no"
                  frameBorder="0"
                  title="Live Score Details"
                  onLoad={() => {
                    console.log('[LiveScore] Scorecard iframe loaded successfully:', liveScoreUrl)
                  }}
                  onError={() => {
                    console.error('[LiveScore] Failed to load live score iframe:', liveScoreUrl)
                  }}
                />
              </div>
            )}

            {/* TV Section - Show below scorecard on sm/md screens, hidden on lg+ (where it's in right panel) */}
            {displayMatchData.hasLiveTV && streamUrl && (
              <div className="bg-white flex flex-col sm:block md:hidden border-b border-gray-200">
                {/* Live TV Toggle Header */}
                <div className="bg-[#00A66E] text-white px-3 sm:px-4 py-2 flex items-center justify-between flex-shrink-0">
                  <span className="text-xs sm:text-sm font-semibold">Live TV</span>
          <button
            onClick={() => setLiveToggle(!liveToggle)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              liveToggle ? 'bg-white' : 'bg-gray-300'
            }`}
            title={liveToggle ? 'Turn off Live TV' : 'Turn on Live TV'}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[#00A66E] transition-transform flex items-center justify-center ${
                liveToggle ? 'translate-x-5' : 'translate-x-0'
              }`}
            >
              {liveToggle ? (
                        <span className="text-white text-xs font-bold">✓</span>
              ) : (
                        <span className="text-gray-600 text-xs font-bold">−</span>
              )}
            </div>
          </button>
        </div>
                
                {/* Live Video Stream - Only show when toggle is ON */}
                {liveToggle && (
                  <div className="relative bg-black flex-shrink-0" style={{ minHeight: '250px', aspectRatio: '16/9' }}>
                    <iframe
                      key={`stream-sm-md-${numericMatchId}-${liveToggle}`}
                      src={streamUrl}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                      title="Live Match Stream"
                      onError={() => {
                        console.error('[Stream] Failed to load stream:', streamUrl)
                      }}
                    />
                  
                  {/* Video Overlay - Score and Match Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 sm:p-3 text-white">
                    {/* Current Score Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1 sm:mb-2 text-xs sm:text-sm font-semibold gap-1">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="truncate">{(matchData?.ename?.split(/\s+v\s+/i)[0] || 'Team A')?.toUpperCase()}</span>
                        <span>{matchData?.teama?.scores || matchData?.team1_scores || '0-0'}</span>
                        <span className="text-[10px] sm:text-xs font-normal text-gray-300">{matchData?.teama?.overs || '0'}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-300 truncate">
                        {(matchData?.ename?.split(/\s+v\s+/i)[1] || 'Team B')?.toUpperCase()}
                      </div>
                    </div>
                    
                    {/* Match Info Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] sm:text-xs text-gray-300 mb-1 sm:mb-2 gap-1">
                      <span>DAY {matchData?.day || '1'} SESSION {matchData?.session || '1'}</span>
                      <span>SPEED {matchData?.speed || '0'} km/h</span>
                    </div>
                    
                    {/* Player Scores */}
                    {matchData?.current_batsmen && Array.isArray(matchData.current_batsmen) && matchData.current_batsmen.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs mb-1 sm:mb-2">
                        {matchData.current_batsmen.slice(0, 2).map((player: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="font-semibold truncate">{player.name || `Player ${idx + 1}`}</span>
                            <span>{player.runs || '0'}</span>
                            <span className="text-gray-400">({player.balls || '0'})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* This Over */}
                    {matchData?.this_over && Array.isArray(matchData.this_over) && matchData.this_over.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                        <span className="text-gray-400 mr-1">THIS OVER:</span>
                        <div className="flex gap-0.5 sm:gap-1">
                          {matchData.this_over.map((ball: any, idx: number) => (
                            <span
                              key={idx}
                              className={`w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center font-medium text-[10px] sm:text-xs ${
                                ball === 0 ? 'bg-gray-700 text-gray-300' :
                                ball === 4 || ball === 6 ? 'bg-yellow-500 text-gray-900' :
                                'bg-green-600 text-white'
                              }`}
                            >
                              {ball}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
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
            {displayMarkets.length > 0 && (
              displayMarkets.map((market, marketIndex) => {
                return (
                <div 
                  key={marketIndex} 
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
                        {market.name === 'MATCH_ODDS' && (
                          <button 
                            onClick={() => refetch()}
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
                            <th className="px-1 sm:px-2 py-1.5 text-left text-xs font-semibold text-gray-700 w-16 sm:w-20">
                              Team
                            </th>
                            {Array.from({ length: BACK_COLUMNS }).map((_, i) => (
                              <th 
                                key={`back-${i}`} 
                                className="px-0.5 py-1.5 text-center text-xs font-semibold text-gray-700 w-[20px] sm:w-[20px]"
                              >
                                Back
                              </th>
                            ))}
                            {Array.from({ length: LAY_COLUMNS }).map((_, i) => (
                              <th 
                                key={`lay-${i}`} 
                                className="px-0.5 py-1.5 text-center text-xs font-semibold text-gray-700 w-[20px] sm:w-[20px]"
                              >
                                Lay
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {market.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-0.5 py-0.5 font-medium text-xs sm:text-sm text-gray-900 truncate">
                                {row.team}
                              </td>
                              {/* Back Odds - 3 columns */}
                              {row.back.map((option, optIndex) => {
                                const oddKey = `${marketIndex}-${rowIndex}-back-${optIndex}`
                                const isBlinking = blinkingOdds.has(oddKey)
                                return (
                                  <td key={`back-${optIndex}`} className="px-0.5 py-0.5">
                                    <div
                                      onClick={() => {
                                        if (option.odds !== '0' && option.amount !== '0') {
                                          setSelectedBet({
                                            team: row.team,
                                            type: 'back',
                                            odds: option.odds.toString(),
                                            market: market.name,
                                            selectionId: row.selectionId,
                                            marketId: market.marketId,
                                            marketIdString: market.marketIdString,
                                            marketGType: market.gtype
                                          })
                                          setBetSlipOpen(true)
                                        }
                                      }}
                                      className={`w-full flex flex-col items-center justify-center py-1 rounded transition-colors ${
                                        option.odds === '0' || option.amount === '0'
                                          ? 'bg-gray-100'
                                          : isBlinking
                                          ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4]'
                                          : 'bg-blue-100 hover:bg-blue-200 cursor-pointer'
                                      }`}
                                    >
                                      <div className="font-semibold text-xs text-gray-900">{option.odds}</div>
                                      <div className="text-[10px] text-gray-600">{option.amount}</div>
                                    </div>
                                  </td>
                                )
                              })}
                              {/* Lay Odds - 3 columns */}
                              {row.lay.map((option, optIndex) => {
                                const oddKey = `${marketIndex}-${rowIndex}-lay-${optIndex}`
                                const isBlinking = blinkingOdds.has(oddKey)
                                return (
                                  <td key={`lay-${optIndex}`} className="px-0.5 py-0.5">
                                    <div
                                      onClick={() => {
                                        if (option.odds !== '0' && option.amount !== '0') {
                                          setSelectedBet({
                                            team: row.team,
                                            type: 'lay',
                                            odds: option.odds.toString(),
                                            market: market.name,
                                            selectionId: row.selectionId,
                                            marketId: market.marketId,
                                            marketIdString: market.marketIdString,
                                            marketGType: market.gtype
                                          })
                                          setBetSlipOpen(true)
                                        }
                                      }}
                                      className={`w-full flex flex-col items-center justify-center py-1 rounded transition-colors ${
                                        option.odds === '0' || option.amount === '0'
                                          ? 'bg-gray-100'
                                          : isBlinking
                                          ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4]'
                                          : 'bg-pink-100 hover:bg-pink-200 cursor-pointer'
                                      }`}
                                    >
                                      <div className="font-semibold text-xs text-gray-900">{option.odds}</div>
                                      <div className="text-[10px] text-gray-600">{option.amount}</div>
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })
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
                onClick={() => setLiveToggle(!liveToggle)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  liveToggle ? 'bg-white' : 'bg-gray-300'
                }`}
                title={liveToggle ? 'Turn off Live TV' : 'Turn on Live TV'}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[#00A66E] transition-transform flex items-center justify-center ${
                    liveToggle ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  {liveToggle ? (
                    <span className="text-white text-xs font-bold">✓</span>
                  ) : (
                    <span className="text-gray-600 text-xs font-bold">−</span>
                  )}
                </div>
              </button>
            </div>
            
            {/* Live Video Stream - Only show when toggle is ON */}
            {liveToggle && (
              <div className="relative bg-white flex-shrink-0" style={{ 
                minHeight: isMobile ? '250px' : '400px', 
                aspectRatio: isMobile ? '16/9' : 'auto'
              }}>
                <iframe
                  key={`stream-${numericMatchId}-${liveToggle}`}
                  src={streamUrl}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  title="Live Match Stream"
                  onError={() => {
                    console.error('[Stream] Failed to load stream:', streamUrl)
                  }}
                />
              
              {/* Video Overlay - Score and Match Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 sm:p-3 text-white">
                {/* Current Score Bar */}
                <div className="flex items-center justify-between mb-1 sm:mb-2 text-xs sm:text-sm font-semibold">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="truncate max-w-[80px] sm:max-w-none">
                      {(matchData?.ename?.split(/\s+v\s+/i)[0] || 'Team A')?.toUpperCase()}
                    </span>
                    <span>{matchData?.teama?.scores || matchData?.team1_scores || '0-0'}</span>
                    <span className="text-xs font-normal text-gray-300">{matchData?.teama?.overs || '0'}</span>
                  </div>
                  <div className="text-xs text-gray-300 truncate max-w-[80px] sm:max-w-none">
                    {(matchData?.ename?.split(/\s+v\s+/i)[1] || 'Team B')?.toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-xs text-gray-300">
                    {(matchData?.ename?.split(/\s+v\s+/i)[0] || 'Team A')?.toUpperCase()} LEAD BY {(matchData?.lead_runs || matchData?.lead || '0')} RUNS
                  </div>
                </div>
                
                {/* Match Info Bar */}
                <div className="flex items-center justify-between text-xs text-gray-300 mb-1 sm:mb-2">
                  <span>DAY {matchData?.day || '1'} SESSION {matchData?.session || '1'}</span>
                  <span className="hidden sm:inline">SPEED {matchData?.speed || '0'} km/h</span>
                </div>
                
                {/* Player Scores */}
                {matchData?.current_batsmen && Array.isArray(matchData.current_batsmen) && matchData.current_batsmen.length > 0 && (
                  <div className="flex items-center gap-2 sm:gap-4 text-xs mb-1 sm:mb-2">
                    {matchData.current_batsmen.slice(0, 2).map((player: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="font-semibold truncate max-w-[60px] sm:max-w-none">
                          {player.name || `Player ${idx + 1}`}
                        </span>
                        <span>{player.runs || '0'}</span>
                        <span className="text-gray-400">({player.balls || '0'})</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* This Over */}
                {matchData?.this_over && Array.isArray(matchData.this_over) && matchData.this_over.length > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-gray-400 mr-1">THIS OVER:</span>
                    {matchData.this_over.map((ball: any, idx: number) => (
                      <span
                        key={idx}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center font-medium ${
                          ball === 0 ? 'bg-gray-700 text-gray-300' :
                          ball === 4 || ball === 6 ? 'bg-yellow-500 text-gray-900' :
                          'bg-green-600 text-white'
                        }`}
                      >
                        {ball}
                      </span>
                    ))}
                  </div>
                )}
                
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
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
                CANAL+ SPORT 360
              </div>
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
        onBetPlaced={refetchPendingBets}
        isMobile={isMobile}
        eventId={currentEventId}
      />
    </div>
  )
}