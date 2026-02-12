'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'
import { useGetAgentMatchBookQuery } from '@/app/services/Api'
import { useMatchData } from '@/app/live/[matchId]/hooks/useMatchData'
import { useMatchMarkets } from '@/app/live/[matchId]/hooks/useMatchMarkets'
import CommonHeader from '@/components/common-header'
import LiveScorecard from '@/components/scorecard/LiveScorecard'
import MatchOdds from '@/components/markets/MatchOdds'
import FancyDetail from '@/components/markets/FancyDetail'
import LiveTVSection from '@/components/live/LiveTVSection'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useGetMatchPositionsQuery } from '@/app/services/Api'

export default function AgentMatchBookPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.eventId as string
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isAgent = userRole === 'AGENT'
  const [activeTab, setActiveTab] = useState('Matches')
  const [liveToggle, setLiveToggle] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch match book data
  const { data: matchBookData, isLoading: isLoadingMatchBook, error: matchBookError, refetch: refetchMatchBook } = useGetAgentMatchBookQuery(
    eventId || '',
    { skip: !eventId || !isAgent, pollingInterval: 30000 }
  )

  // Fetch match data (scorecard, markets, odds)
  const {
    marketsData,
    oddsData,
    bookmakerFancyData,
    scorecard,
    matchData,
    currentEventId,
    streamUrl,
    isLoading: isLoadingMatchData,
    isLoadingScorecard,
    refetch: refetchMatchData
  } = useMatchData(eventId || '')

  // Extract marketIds
  const marketIds = useMemo(() => {
    if (!marketsData || !Array.isArray(marketsData)) return []
    return marketsData.map((market: any) => market.marketId)
  }, [marketsData])

  // Process markets
  const { bettingMarkets } = useMatchMarkets(
    marketsData,
    oddsData,
    bookmakerFancyData,
    eventId || '',
    null,
    marketIds
  )

  // Fetch positions
  const { data: positionsData } = useGetMatchPositionsQuery(
    { eventId: eventId || '' },
    { skip: !eventId, pollingInterval: 10000 }
  )

  // Extract positions by market type
  const positionsByMarketType = useMemo(() => {
    if (!positionsData?.data) return {}
    
    const positions: Record<string, Record<string, number>> = {}
    
    // Match Odds positions (by selectionId)
    if (positionsData.data.matchOddsPosition?.runners) {
      const matchOddsPositions: Record<string, number> = {}
      Object.entries(positionsData.data.matchOddsPosition.runners).forEach(([selectionId, runner]: [string, any]) => {
        matchOddsPositions[selectionId] = runner.net || 0
      })
      positions['match'] = matchOddsPositions
    }
    
    // Fancy positions (by outcome name like "YES", "NO")
    if (positionsData.data.fancyPosition && Array.isArray(positionsData.data.fancyPosition)) {
      const fancyPositions: Record<string, number> = {}
      positionsData.data.fancyPosition.forEach((fancy: any) => {
        if (fancy.outcome) {
          fancyPositions[fancy.outcome.toUpperCase()] = fancy.net || 0
        }
      })
      positions['fancy'] = fancyPositions
    }
    
    return positions
  }, [positionsData])

  // Separate Match Odds and Fancy markets
  const matchOddsMarket = useMemo(() => {
    return bettingMarkets.find(m => 
      (m.name?.toUpperCase() === 'MATCH_ODDS' || m.name?.toUpperCase() === 'MATCH ODDS') && 
      m.gtype === 'match'
    )
  }, [bettingMarkets])

  const fancyMarkets = useMemo(() => {
    return bettingMarkets.filter(m => 
      m.gtype === 'fancy' || 
      m.gtype === 'fancy1' || 
      m.gtype === 'fancy2' || 
      m.gtype === 'match1' ||
      m.gtype === 'oddeven' ||
      m.gtype === 'cricketcasino' ||
      m.gtype === 'meter'
    )
  }, [bettingMarkets])

  // Get all bets from match book data
  const allBets = useMemo(() => {
    if (!matchBookData?.matches?.[0]?.clients) return []
    const bets: any[] = []
    matchBookData.matches[0].clients.forEach((client: any) => {
      if (client.bets && Array.isArray(client.bets)) {
        client.bets.forEach((bet: any) => {
          bets.push({
            ...bet,
            clientName: client.clientName || client.clientUsername || bet.username || bet.userName || 'Unknown'
          })
        })
      }
    })
    return bets.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  }, [matchBookData])

  // Separate matched bets (match odds) and session bets (fancy)
  const matchedBets = useMemo(() => {
    return allBets.filter(bet => bet.gtype === 'matchodds' || bet.gtype === 'match')
  }, [allBets])

  const sessionBets = useMemo(() => {
    return allBets
      .filter(bet => bet.gtype === 'fancy' || bet.gtype === 'fancy1' || bet.gtype === 'fancy2' || bet.gtype === 'match1')
      .map(bet => {
        // Map betType for fancy bets: BACK -> YES, LAY -> NOT
        let displayBetType = bet.betType
        if (bet.gtype === 'fancy' || bet.gtype === 'fancy1' || bet.gtype === 'fancy2' || bet.gtype === 'match1') {
          if (bet.betType === 'BACK') {
            displayBetType = 'YES'
          } else if (bet.betType === 'LAY') {
            displayBetType = 'NOT'
          }
        }
        return { ...bet, displayBetType }
      })
  }, [allBets])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab !== 'Matches') {
      router.push('/agent-dashboard')
    }
  }

  const handleBetSelect = () => {
    // Bet selection handler (can be empty for agent view)
  }

  const handleRefresh = () => {
    refetchMatchBook()
    refetchMatchData()
  }

  if (!isAgent) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access denied. Agent role required.</p>
        </div>
      </div>
    )
  }

  if (isLoadingMatchBook || isLoadingMatchData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <CommonHeader activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00A66E]" />
            <p className="text-gray-600">Loading match book...</p>
          </div>
        </div>
      </div>
    )
  }

  if (matchBookError || !matchBookData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <CommonHeader activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading match book</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-[#00A66E] text-white rounded hover:bg-[#00b97b]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const matchBookMatch = matchBookData?.matches?.[0]
  const totals = {
    totalIfWin: matchBookData?.totalIfWin || 0,
    totalIfLose: matchBookData?.totalIfLose || 0,
    totalFancyPosition: matchBookData?.totalFancyPosition || 0,
    totalMatchOddsPosition: matchBookData?.totalMatchOddsPosition || 0,
    totalBets: matchBookData?.totalBets || 0,
    totalClients: matchBookData?.totalClients || 0,
    totalMatches: matchBookData?.totalMatches || 0,
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <CommonHeader activeTab={activeTab} onTabChange={handleTabChange} />
      
      <div className="min-h-[calc(100vh-110px)] p-2 sm:p-4">
        {/* Header with Back Button */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-[#00A66E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#00A66E] text-white rounded hover:bg-[#00b97b] transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Panel - Summary & Session Pre-Book */}
          <div className="lg:col-span-2 space-y-4">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total If Win</p>
                  <p className={`text-base font-bold ${totals.totalIfWin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totals.totalIfWin >= 0 ? '+' : ''}{totals.totalIfWin.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total If Lose</p>
                  <p className={`text-base font-bold ${totals.totalIfLose >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totals.totalIfLose >= 0 ? '+' : ''}{totals.totalIfLose.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Fancy Position</p>
                  <p className="text-base font-bold text-gray-900">
                    {totals.totalFancyPosition.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Match Odds Position</p>
                  <p className="text-base font-bold text-gray-900">
                    {totals.totalMatchOddsPosition.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Bets</p>
                  <p className="text-base font-bold text-gray-900">{totals.totalBets}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Clients</p>
                  <p className="text-base font-bold text-gray-900">{totals.totalClients}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Matches</p>
                  <p className="text-base font-bold text-gray-900">{totals.totalMatches}</p>
                </div>
              </div>
            </div>

            {/* Session Pre-Book */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Session Pre-Book</h3>
              <div className="space-y-2">
                {fancyMarkets.slice(0, 5).map((market, idx) => (
                  <div key={idx} className="text-xs text-gray-700 p-2 bg-gray-50 rounded">
                    {market.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Panel - Match Odds, Scorecard, RUNNER, SESSION */}
          <div className="lg:col-span-5 space-y-4">
            {/* Match Odds Header */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="bg-[#00A66E] text-white px-4 py-2 flex items-center justify-between">
                <h2 className="font-semibold text-sm">Match Odds</h2>
                <button
                  onClick={handleRefresh}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              {/* Scorecard */}
              {currentEventId && (
                <div className="border-b">
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
                </div>
              )}

              {/* Live TV */}
              {streamUrl && (
                <div className="border-b">
                  <LiveTVSection
                    streamUrl={streamUrl}
                    liveToggle={liveToggle}
                    onToggleChange={setLiveToggle}
                    canToggleTV={true}
                    numericMatchId={null}
                    isMobile={isMobile}
                    scorecard={scorecard}
                    matchData={matchData}
                    variant="mobile"
                  />
                </div>
              )}

              {/* RUNNER Section - Match Odds */}
              {matchOddsMarket && (
                <div className="border-b">
                  {/* <div className="bg-gray-100 px-4 py-2">
                    <h3 className="text-xs font-semibold text-gray-700">RUNNER</h3>
                  </div> */}
                  <MatchOdds
                    market={matchOddsMarket}
                    marketIndex={0}
                    blinkingOdds={new Set()}
                    isMobile={isMobile}
                    onBetSelect={handleBetSelect}
                    onRefresh={handleRefresh}
                    positions={positionsByMarketType['match']}
                  />
                </div>
              )}

              {/* SESSION Section - Fancy Markets */}
              {fancyMarkets.length > 0 && (
                <div>
                  <div className="bg-gray-100 px-4 py-2">
                    <h3 className="text-xs font-semibold text-gray-700">SESSION</h3>
                  </div>
                  {fancyMarkets.map((market, idx) => (
                    <FancyDetail
                      key={idx}
                      market={market}
                      marketIndex={idx}
                      blinkingOdds={new Set()}
                      isMobile={isMobile}
                      onBetSelect={handleBetSelect}
                      positions={positionsByMarketType['fancy']}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Matched Bet & Session Bet */}
          <div className="lg:col-span-5 space-y-4">
            {/* Matched Bet */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b">
                <h3 className="text-sm font-semibold text-gray-900">Matched Bet</h3>
                <button className="text-xs text-[#00A66E] hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">Sr.</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">Odds</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">Stake</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">BetType</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">Team</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">User</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchedBets.length > 0 ? (
                      matchedBets.slice(0, 10).map((bet, idx) => (
                        <tr key={bet.id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-2 py-2 text-gray-900">{idx + 1}</td>
                          <td className="px-2 py-2 text-gray-900">{bet.odds?.toFixed(2) || '-'}</td>
                          <td className="px-2 py-2 text-gray-900">{bet.amount?.toFixed(2) || '0.00'}</td>
                          <td className="px-2 py-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              bet.betType === 'BACK' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-pink-100 text-pink-700'
                            }`}>
                              {bet.betType}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-gray-900">{bet.betName || '-'}</td>
                          <td className="px-2 py-2 text-gray-600 text-[10px]">
                            {bet.clientName || bet.username || bet.userName || '-'}
                          </td>
                          <td className="px-2 py-2 text-gray-600 text-[10px]">
                            {bet.createdAt ? new Date(bet.createdAt).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-2 py-4 text-center text-gray-500 text-xs">No matched bets</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Session Bet */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b">
                <h3 className="text-sm font-semibold text-gray-900">Session Bet</h3>
                <button className="text-xs text-[#00A66E] hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">Sr.</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">Session</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">Rate</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">Stake</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">BetType</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionBets.length > 0 ? (
                      sessionBets.slice(0, 10).map((bet, idx) => (
                        <tr 
                          key={bet.id || idx} 
                          className={`border-b border-gray-100 hover:bg-gray-50 ${
                            bet.displayBetType === 'YES' ? 'bg-blue-50' : 'bg-pink-50'
                          }`}
                        >
                          <td className="px-2 py-2 text-gray-900">{idx + 1}</td>
                          <td className="px-2 py-2 text-gray-900 text-[10px]">{bet.betName || '-'}</td>
                          <td className="px-2 py-2 text-gray-900">{bet.odds?.toFixed(2) || '-'}</td>
                          <td className="px-2 py-2 text-gray-900">{bet.amount?.toFixed(2) || '0.00'}</td>
                          <td className="px-2 py-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              bet.displayBetType === 'YES' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-pink-100 text-pink-700'
                            }`}>
                              {bet.displayBetType || bet.betType}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-gray-600 text-[10px]">
                            {bet.clientName || bet.username || bet.userName || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center text-gray-500 text-xs">No session bets</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
