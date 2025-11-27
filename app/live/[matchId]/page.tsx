'use client'

import { useState, useMemo, useRef, useEffect, CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Pin, RefreshCw, Tv } from 'lucide-react'
import { useGetCricketMatchDetailQuery, useGetCricketMatchPrivateQuery } from '@/app/services/CricketApi'
import { useLiveOdds } from '@/app/hooks/useWebSocket'
import DashboardHeader from '@/components/dashboard-header'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'
import { usePlaceBetMutation } from '@/app/services/Api'
import { toast } from 'sonner'

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
  marketId?: number
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
    marketId?: number
    marketGType?: string
  } | null>(null)
  const [stake, setStake] = useState<string>('')
  const [odds, setOdds] = useState<string>('')

  const BACK_COLUMNS = 1
  const LAY_COLUMNS = 1

  const renderBetSlip = (wrapperClass = '', style?: CSSProperties) => {
    if (!selectedBet) return null

    const stakeValue = parseFloat(stake)
    const oddsValue = parseFloat(odds || selectedBet.odds)
    let plText = '0 / 0'
    if (!isNaN(stakeValue) && stakeValue > 0 && !isNaN(oddsValue) && oddsValue > 0) {
      plText =
        selectedBet.type === 'back'
          ? `${(stakeValue * (oddsValue - 1)).toFixed(2)} / ${stakeValue.toFixed(2)}`
          : `${stakeValue.toFixed(2)} / ${(stakeValue * (oddsValue - 1)).toFixed(2)}`
    }

    return (
      <div
        className={`bg-pink-50 border-t border-gray-200 flex flex-col ${wrapperClass}`}
        style={style}
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
              onClick={() => setBetSlipOpen(false)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-2 sm:px-4 py-2 rounded text-xs sm:text-sm font-semibold"
            >
              Close
            </button>
            <button
              onClick={() => {
                setStake('')
                setSelectedBet(null)
              }}
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
    )
  }

  const [placeBet, { isLoading: isPlaceBetLoading }] = usePlaceBetMutation()
  const isPlacingBet = isPlaceBetLoading

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

    const betType = selectedBet.type === 'back' ? 'BACK' : 'LAY'
    const winAmount = betType === 'BACK' ? betStake * (betRate - 1) : betStake
    const lossAmount = betType === 'BACK' ? betStake : betStake * (betRate - 1)

    // Try multiple user ID fields - backend might need numeric ID or specific field
    const userId = 
      (authUser as any)?.user_id ??           // Try user_id first (if backend uses this)
      (authUser as any)?.userId ??             // Try userId
      (authUser as any)?.id ??                 // Try id
      (authUser as any)?.numericId ??          // Try numericId if exists
      (typeof (authUser as any)?.id === 'number' ? (authUser as any)?.id : null) ?? // Try numeric id
      0

    // Log user ID for debugging
    console.log('Bet placement - User ID fields:', {
      user_id: (authUser as any)?.user_id,
      userId: (authUser as any)?.userId,
      id: (authUser as any)?.id,
      numericId: (authUser as any)?.numericId,
      selectedUserId: userId,
      fullUser: authUser
    })

    const payload = {
      selection_id: selectedBet.selectionId ?? 0,
      bet_type: betType,
      user_id: userId,
      bet_name: selectedBet.team,
      bet_rate: betRate,
      match_id: numericMatchId ?? 0,
      market_name: selectedBet.market,
      betvalue: betStake,
      market_type: 'in_play',
      win_amount: Number(winAmount.toFixed(2)),
      loss_amount: Number(lossAmount.toFixed(2)),
      gtype: selectedBet.marketGType || 'match_odds',
      runner_name_2: '',
    }

    try {
      const data = await placeBet(payload).unwrap()
      console.log('Bet placed successfully:', data)
      toast.success('Bet placed successfully.')
      setBetSlipOpen(false)
      setStake('')
      setSelectedBet(null)
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

  // Parse matchId to get gmid
  const numericMatchId = useMemo(() => {
    const parsed = parseInt(matchId, 10)
    return isNaN(parsed) ? null : parsed
  }, [matchId])

  // Fetch match details using the detail endpoint (for header info)
  const { data: matchDetailData, isLoading: isLoadingDetail, error: detailError, refetch: refetchDetail } = useGetCricketMatchDetailQuery(
    { sid: 4, gmid: numericMatchId! },
    { skip: !numericMatchId }
  )

  // Fetch match private data (for all markets - odds, fancy, etc.)
  const { data: matchPrivateData, isLoading: isLoadingPrivate, error: privateError, refetch: refetchPrivate } = useGetCricketMatchPrivateQuery(
    { sid: 4, gmid: numericMatchId! },
    { skip: !numericMatchId }
  )

  // Subscribe to live odds updates via WebSocket
  const liveOdds = useLiveOdds(4, numericMatchId)

  const isLoading = isLoadingDetail || isLoadingPrivate
  const error = detailError || privateError

  // Combined refetch function
  const refetch = () => {
    refetchDetail()
    refetchPrivate()
  }

  // Extract match info from detail response
  const matchData = useMemo(() => {
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
  }, [matchDetailData])

  // Extract all markets - prioritize live odds from WebSocket, fallback to API data
  const allMarkets = useMemo(() => {
    // Prioritize live odds data from WebSocket if available
    if (liveOdds?.data) {
      // Handle live odds response structure - could be direct array or wrapped
      let markets: any[] = []
      
      if (Array.isArray(liveOdds.data)) {
        markets = liveOdds.data
      } else if (liveOdds.data?.success && Array.isArray(liveOdds.data.data)) {
        markets = liveOdds.data.data
      } else if (liveOdds.data?.data && Array.isArray(liveOdds.data.data)) {
        markets = liveOdds.data.data
      }
      
      if (markets.length > 0) {
        console.log('[MatchDetail] Using live odds from WebSocket:', {
          matchId: numericMatchId,
          marketsFound: markets.length,
          markets: markets.map((m: any) => ({ gmid: m.gmid, mid: m.mid, mname: m.mname, gtype: m.gtype }))
        })
        return markets
      }
    }
    
    // Fallback to API data from private endpoint
    if (!matchPrivateData) return []
    
    // Handle API response structure
    let markets: any[] = []
    
    if (Array.isArray(matchPrivateData)) {
      markets = matchPrivateData
    } else if (matchPrivateData?.success && Array.isArray(matchPrivateData.data)) {
      markets = matchPrivateData.data
    }
    
    console.log('[MatchDetail] Using API markets:', {
      matchId: numericMatchId,
      marketsFound: markets.length,
      markets: markets.map((m: any) => ({ gmid: m.gmid, mid: m.mid, mname: m.mname, gtype: m.gtype }))
    })
    
    return markets
  }, [liveOdds, matchPrivateData, numericMatchId])

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

    return {
      title: matchData.ename || 'Match',
      date,
      time,
      isLive: matchData.iplay || false,
      hasLiveTV: (matchData.tv || false) && shouldShowTV // Only show TV if user role allows it
    }
  }, [matchData, shouldShowTV])

  // Streaming URL - key might come from API or be a constant
  // For now using a default key, can be updated if API provides it
  const streamKey = useMemo(() => {
    // Check if key comes from match data (add field if available in API)
    return matchData?.streamKey || matchData?.tvKey || matchData?.key || 'D247yfhffia1bjqbdj3913912' // Default key
  }, [matchData])

  const streamUrl = useMemo(() => {
    if (!numericMatchId) return null
    // Only generate stream URL if match has TV enabled
    if (!matchData?.tv) return null
    return `https://live.cricketid.xyz/directStream?gmid=${numericMatchId}&key=${streamKey}`
  }, [numericMatchId, streamKey, matchData])

  // Live Score URL
  const liveScoreUrl = useMemo(() => {
    if (!numericMatchId) return null
    return `https://score.akamaized.uk/diamond-live-score?gmid=${numericMatchId}`
  }, [numericMatchId])

  // Transform betting markets from private API response
  const bettingMarkets: BettingMarket[] = useMemo(() => {
    if (allMarkets.length === 0) {
      return []
    }

    // Process each market entry from private endpoint
    const markets: BettingMarket[] = []
    
    allMarkets.forEach((marketEntry: any) => {
      if (!marketEntry.section || marketEntry.section.length === 0) {
        return
      }

      const marketName = marketEntry.mname || 'MATCH_ODDS'
      const rows: MarketRow[] = []

      // Process each section (team/option) in this market
      marketEntry.section.forEach((section: any) => {
        // Skip "The Draw" for fancy markets if needed, or show all
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
          marketId: marketEntry.mid
        })
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
    const oddsMarkets = allMarkets.filter((m: any) => m.mname === 'MATCH_ODDS' || m.gtype === 'match').length
    const bmMarkets = allMarkets.filter((m: any) => m.mname === 'Bookmaker' || m.gtype === 'match1').length
    const fancyMarkets = allMarkets.filter((m: any) => m.gtype === 'fancy' || m.gtype === 'fancy2').length
    const oddevenMarkets = allMarkets.filter((m: any) => m.gtype === 'oddeven').length
    const casinoMarkets = allMarkets.filter((m: any) => m.gtype === 'cricketcasino').length
    
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

  // Error state - only show if matchId is invalid
  if (!numericMatchId) {
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
        <div className={`flex flex-col bg-white ${getLeftPanelClass()}`}>
          {/* Betting Markets Section - Scorecard integrated as first item */}
          <div className="relative">
            {/* Live Score iframe - First item in markets section */}
            {liveScoreUrl && (
              <div className="bg-white overflow-hidden relative" style={{ margin: 0, padding: 0 }}>
                <iframe
                  key={`live-score-${numericMatchId}`}
                  src={liveScoreUrl}
                  className="w-full border-0 block"
                  style={{ 
                    height: isMobile ? '300px' : '400px', 
                    margin: 0, 
                    padding: 0, 
                    display: 'block' 
                  }}
                  allow="autoplay; encrypted-media"
                  title="Live Score Details"
                  onError={() => {
                    console.error('[LiveScore] Failed to load live score:', liveScoreUrl)
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
            
          {/* Bet Slip positioning */}
          {betSlipOpen && renderBetSlip('lg:hidden', { maxHeight: isMobile ? '320px' : '360px' })}
          {(!displayMatchData.hasLiveTV || !streamUrl) && betSlipOpen && renderBetSlip('hidden md:flex flex-col', { maxHeight: '420px' })}

          {displayMarkets.length > 0 && (
            displayMarkets.map((market, marketIndex) => {
              // Position MATCH_ODDS to cover white area of scorecard
              const isMatchOdds = market.name === 'MATCH_ODDS'
              return (
            <div 
              key={marketIndex} 
                    className={`border-b border-gray-200 ${
                      isMatchOdds && liveScoreUrl && !isMobile 
                        ? 'absolute top-[180px] left-0 right-0 z-20 bg-white shadow-lg' 
                        : 'relative'
                    }`}
                    style={isMatchOdds && liveScoreUrl && !isMobile ? { marginTop: '0' } : {}}
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
                                      marketGType: market.gtype
                                    })
                                    setOdds(option.odds.toString())
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
                                      marketGType: market.gtype
                                    })
                                    setOdds(option.odds.toString())
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

            {betSlipOpen && renderBetSlip('flex-shrink-0', { maxHeight: '420px' })}

                  </div>
                )}
        
      </div>
    </div>
  )
}