'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Pin, RefreshCw, Tv } from 'lucide-react'
import { useGetCricketMatchDetailQuery, useGetCricketMatchPrivateQuery } from '@/app/services/CricketApi'
import { useLiveOdds } from '@/app/hooks/useWebSocket'

interface BettingOption {
  odds: number | string
  amount: number | string
}

interface MarketRow {
  team: string
  back: BettingOption[]
  lay: BettingOption[]
}

interface BettingMarket {
  name: string
  min: number
  max: number
  rows: MarketRow[]
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
  const matchId = params?.matchId as string
  
  const [liveToggle, setLiveToggle] = useState(true)
  const [selectedTab, setSelectedTab] = useState('all')
  const [blinkingOdds, setBlinkingOdds] = useState<Set<string>>(new Set())
  const previousOddsRef = useRef<Map<string, { odds: string; amount: string }>>(new Map())

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
      hasLiveTV: matchData.tv || false
    }
  }, [matchData])

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

        // Pad to 3 items each for display (for standard match odds)
        // For fancy markets, show what's available
        const maxDisplay = marketEntry.gtype === 'match' || marketEntry.gtype === 'match1' ? 3 : Math.max(backOdds.length, layOdds.length, 3)
        while (backOdds.length < maxDisplay) {
          backOdds.push({ odds: '0', amount: '0' })
        }
        while (layOdds.length < maxDisplay) {
          layOdds.push({ odds: '0', amount: '0' })
        }

        // Take only first 3 for standard markets, all for fancy
        rows.push({
          team: section.nat || 'Unknown',
          back: backOdds.slice(0, maxDisplay),
          lay: layOdds.slice(0, maxDisplay)
        })
      })

      if (rows.length > 0) {
        markets.push({
          name: marketName,
          min: marketEntry.min || 500,
          max: marketEntry.max || (marketEntry.m || 500000),
          rows
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

  // Error state
  if (error || (!isLoading && (!matchData || allMarkets.length === 0))) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error ? 'Error loading match details' : 'Match not found'}
          </p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-[#00A66E] text-white rounded hover:bg-[#008a5a]"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header Bar */}
      <div className="bg-[#00A66E] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-base sm:text-lg font-semibold">{displayMatchData.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm sm:text-base">{displayMatchData.date} {displayMatchData.time}</span>
          {displayMatchData.hasLiveTV && streamUrl && (
            <>
              <span className="flex items-center gap-1 text-sm">
                <Tv className="w-4 h-4" />
                Live TV
              </span>
              {/* Live TV Toggle Switch */}
              <button
                onClick={() => setLiveToggle(!liveToggle)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  liveToggle ? 'bg-white' : 'bg-gray-300'
                }`}
                title={liveToggle ? 'Turn off Live TV' : 'Turn on Live TV'}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-[#00A66E] transition-transform ${
                    liveToggle ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              {/* Channel Name (CANAL+ SPORT 360) */}
              {liveToggle && (
                <div className="bg-black text-white px-3 py-1 rounded text-xs font-semibold">
                  CANAL+ SPORT 360
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content Area - Grid Layout: Fixed 50/50 split when TV available */}
      <div className={`h-[calc(100vh-64px)] ${
        displayMatchData.hasLiveTV && streamUrl
          ? 'grid grid-cols-12 gap-0' 
          : 'flex flex-col'
      }`}>
        {/* Left Panel - Betting Markets (with integrated scorecard) */}
        <div className={`flex flex-col overflow-hidden bg-white ${
          displayMatchData.hasLiveTV && streamUrl
            ? 'col-span-8 border-r border-gray-200' 
            : 'flex-1'
        }`}>
          {/* Betting Markets Section - Scorecard integrated as first item */}
          <div className="flex-1 overflow-y-auto">
            {/* Live Score iframe - First item in markets section */}
            {liveScoreUrl && (
              <div className="bg-white overflow-hidden" style={{ margin: 0, padding: 0 }}>
                <iframe
                  key={`live-score-${numericMatchId}`}
                  src={liveScoreUrl}
                  className="w-full border-0 block"
                  style={{ height: '400px', margin: 0, padding: 0, display: 'block' }}
                  allow="autoplay; encrypted-media"
                  title="Live Score Details"
                  onError={() => {
                    console.error('[LiveScore] Failed to load live score:', liveScoreUrl)
                  }}
                />
              </div>
            )}
          {displayMarkets.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No betting markets available
            </div>
          ) : (
            displayMarkets.map((market, marketIndex) => (
            <div key={marketIndex} className="border-b border-gray-200">
              {/* Market Header */}
              <div className="bg-[#00A66E] text-white px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4" />
                  <span className="font-semibold text-sm">{market.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-semibold">
                    BOOK
                  </button>
                  {market.name === 'MATCH_ODDS' && (
                    <button 
                      onClick={() => refetch()}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </button>
                  )}
                </div>
              </div>

              {/* Betting Limits */}
              <div className="bg-gray-50 px-4 py-1 text-xs text-gray-700 border-b">
                Min: {market.min.toLocaleString()} | Max: {market.max.toLocaleString()}
              </div>

              {/* Betting Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 w-20">Team</th>
                      {[...Array(3)].map((_, i) => (
                        <th key={`back-${i}`} className="px-0.5 py-1.5 text-center text-xs font-semibold text-gray-700 w-[45px]">
                          Back
                        </th>
                      ))}
                      {[...Array(3)].map((_, i) => (
                        <th key={`lay-${i}`} className="px-0.5 py-1.5 text-center text-xs font-semibold text-gray-700 w-[45px]">
                          Lay
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {market.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-0.5 py-0.5 font-medium text-sm text-gray-900">{row.team}</td>
                        {/* Back Odds - 3 columns */}
                        {row.back.map((option, optIndex) => {
                          const oddKey = `${marketIndex}-${rowIndex}-back-${optIndex}`
                          const isBlinking = blinkingOdds.has(oddKey)
                          return (
                          <td key={`back-${optIndex}`} className="px-0.5 py-0.5">
                            <div
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
                                className={`w-full flex flex-col items-center justify-center py-1 rounded transition-colors ${
                                option.odds === '0' || option.amount === '0'
                                  ? 'bg-gray-100'
                                    : isBlinking
                                    ? 'bg-yellow-400 animate-[blink_0.5s_ease-in-out_4]'
                                  : 'bg-pink-100 hover:bg-pink-200 cursor-pointer'
                              }`}
                            >
                              <div className="font-semibold text-xs text-gray-900 ">{option.odds}</div>
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
            ))
          )}
          </div>
        </div>

        {/* Right Panel - Live Video (if TV enabled and toggle ON) + Betting Summary */}
        {displayMatchData.hasLiveTV && streamUrl && liveToggle ? (
          <div className="col-span-4 bg-black flex flex-col">
            {/* Live Video Stream */}
            <div className="relative flex-1 bg-black" style={{ minHeight: '400px', aspectRatio: '16/9' }}>
              {liveToggle ? (
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
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-sm">
                  Live TV is turned off. Turn on the toggle to watch.
                </div>
              )}
              
              {/* Video Overlay - Score and Match Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 text-white">
                {/* Current Score Bar */}
                <div className="flex items-center justify-between mb-2 text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span>{(matchData?.ename?.split(/\s+v\s+/i)[0] || 'Team A')?.toUpperCase()}</span>
                    <span>{matchData?.teama?.scores || matchData?.team1_scores || '0-0'}</span>
                    <span className="text-xs font-normal text-gray-300">{matchData?.teama?.overs || '0'}</span>
                  </div>
                  <div className="text-xs text-gray-300">
                    {(matchData?.ename?.split(/\s+v\s+/i)[1] || 'Team B')?.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-300">
                    {(matchData?.ename?.split(/\s+v\s+/i)[0] || 'Team A')?.toUpperCase()} LEAD BY {(matchData?.lead_runs || matchData?.lead || '0')} RUNS
                  </div>
                </div>
                
                {/* Match Info Bar */}
                <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                  <span>DAY {matchData?.day || '1'} SESSION {matchData?.session || '1'}</span>
                  <span>SPEED {matchData?.speed || '0'} km/h</span>
                </div>
                
                {/* Player Scores */}
                {matchData?.current_batsmen && Array.isArray(matchData.current_batsmen) && matchData.current_batsmen.length > 0 && (
                  <div className="flex items-center gap-4 text-xs mb-2">
                    {matchData.current_batsmen.slice(0, 2).map((player: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="font-semibold">{player.name || `Player ${idx + 1}`}</span>
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
                        className={`w-5 h-5 rounded flex items-center justify-center font-medium ${
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
                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-white/20">
                  <button
                    onClick={() => {
                      // Toggle audio/mute
                    }}
                    className="p-1 hover:bg-white/20 rounded"
                    title="Toggle Audio"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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

            {/* Betting Summary Section */}
            <div className="h-[300px] bg-white flex flex-col border-t border-gray-200">
              {/* Tabs */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                <div className="flex gap-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={`px-2 py-1 text-xs font-medium whitespace-nowrap rounded transition-colors ${
                        selectedTab === tab.id
                          ? 'bg-[#00A66E] text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
                <button className="text-xs text-[#00A66E] hover:underline font-medium ml-2 whitespace-nowrap">
                  View All
                </button>
              </div>

              {/* Table Headers */}
              <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700">
                <div>User Name</div>
                <div>Market</div>
                <div>Rate</div>
                <div>Amount</div>
                <div>Date</div>
              </div>

              {/* Bet History Content */}
              <div className="flex-1 overflow-y-auto">
                {betHistory.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                    No bets available
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {betHistory.map((bet, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-5 gap-2 px-4 py-2 hover:bg-gray-50 text-xs"
                      >
                        <div className="truncate">{bet.userName}</div>
                        <div className="truncate">{bet.market}</div>
                        <div className="truncate">{bet.rate}</div>
                        <div className="truncate">{bet.amount}</div>
                        <div className="truncate">{bet.date}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Betting Summary Panel - Show when TV is off or not available */}
        {(!displayMatchData.hasLiveTV || !streamUrl || !liveToggle) && (
          <div className={`${
            displayMatchData.hasLiveTV && streamUrl 
              ? 'col-span-4' 
              : 'w-full'
          } bg-white ${displayMatchData.hasLiveTV && streamUrl ? 'border-l border-gray-200' : ''} flex flex-col`}>
          {/* Tabs */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-2 py-1 text-xs font-medium whitespace-nowrap rounded transition-colors ${
                    selectedTab === tab.id
                      ? 'bg-[#00A66E] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <button className="text-xs text-[#00A66E] hover:underline font-medium ml-2">
              View All
            </button>
          </div>

          {/* Table Headers */}
          <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700">
            <div>User Name</div>
            <div>Market</div>
            <div>Rate</div>
            <div>Amount</div>
            <div>Date</div>
          </div>

          {/* Bet History Content */}
          <div className="flex-1 overflow-y-auto">
            {betHistory.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No bets available
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {betHistory.map((bet, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-5 gap-2 px-4 py-2 hover:bg-gray-50 text-xs"
                  >
                    <div className="truncate">{bet.userName}</div>
                    <div className="truncate">{bet.market}</div>
                    <div className="truncate">{bet.rate}</div>
                    <div className="truncate">{bet.amount}</div>
                    <div className="truncate">{bet.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
