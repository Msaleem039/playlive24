import { useMemo } from 'react'
import {
  useGetCricketMatchMarketsQuery,
  useGetCricketMatchOddsQuery,
  useGetCricketBookmakerFancyQuery,
  useGetCricketScorecardQuery,
  useGetFancyresTennisScoreQuery,
  useGetFancyresSoccerScoreQuery,
} from '@/app/services/CricketApi'
import type { MarketResponse } from '../types'
import { mapFancyresToLiveScorecard } from '../utils/mapFancyresToLiveScorecard'

function normalizeLegacyScorecard(score: any) {
  if (!score) return null

  const inningsRaw = Array.isArray(score?.Innings) ? score.Innings : []
  if (inningsRaw.length === 0) return null

  const innings = [...inningsRaw].sort((a: any, b: any) => Number(a?.InngNo || 0) - Number(b?.InngNo || 0))
  const firstInnings = innings[0] || {}
  const secondInnings = innings[1] || {}
  const currentInningsNumber = Number(score?.currentInningsNumber || innings[innings.length - 1]?.InngNo || 1)
  const currentInnings = innings.find((i: any) => Number(i?.InngNo) === currentInningsNumber) || innings[0] || {}

  const toScore = (inng: any) => (inng?.Summary ? String(inng.Summary).split('(')[0].trim() : `${inng?.Runs || ''}-${inng?.Wickets || ''}`.replace(/^-$/, ''))
  const toOvers = (inng: any) => {
    if (inng?.Overs && String(inng.Overs).trim() !== '') return String(inng.Overs)
    if (inng?.Summary && String(inng.Summary).includes('(')) return String(inng.Summary).split('(')[1].replace(')', '').trim()
    return ''
  }

  const team1Code = String(firstInnings?.Team || 'TEAM-1')
  const team2Code = String(secondInnings?.Team || 'TEAM-2')

  return {
    batsman: [],
    bowler: {},
    lastBowler: {},
    lastWicket: {},
    partnership: { player_a: { ball: 0, run: 0 }, player_b: { ball: 0, run: 0 }, ball: 0, run: 0 },
    sessionData: {},
    lastAllOvers: [],
    team1: {
      fullName: team1Code,
      shortName: team1Code,
      flag: '',
      score: toScore(firstInnings),
      overs: toOvers(firstInnings),
    },
    team2: {
      fullName: team2Code,
      shortName: team2Code,
      flag: '',
      score: toScore(secondInnings),
      overs: toOvers(secondInnings),
    },
    lastBalls: Array.isArray(score?.CurrentOver?.Balls) ? score.CurrentOver.Balls.map((b: any) => String(b)) : [],
    currentInningscurrentBall: '',
    needByBall: '',
    needByOver: score?.MatchCommentary || score?.commentry || '',
    matchType: '',
    runRate: currentInnings?.CRR || '',
    targetRun: 0,
    eventId: String(score?.EventId || ''),
    currentInnings: String(currentInningsNumber || ''),
    currentBall: String(score?.CurrentOver?.OverNumber || ''),
    matchName: `${team1Code} v ${team2Code}`,
  }
}

export type LiveDetailSport = 'cricket' | 'tennis' | 'soccer'

export function useMatchData(eventId: string, marketId?: string | null, sport: LiveDetailSport = 'cricket') {
  const marketIdentifier = (marketId || eventId || '').toString()
  const useFancyresScore = sport === 'tennis' || sport === 'soccer'

  // Fetch match detail using marketid from route param
  const { data: marketsData, isLoading: isLoadingMarkets, error: marketsError, refetch: refetchMarkets } = useGetCricketMatchMarketsQuery(
    { marketid: marketIdentifier },
    { skip: !marketIdentifier }
  )

  const marketsList = useMemo(() => {
    // Old: marketsData is MarketResponse[]
    if (Array.isArray(marketsData)) return marketsData as any[]

    // New: /match-detail might return { markets: [...] } or { data: { markets: [...] } }
    const source: any = (marketsData as any)?.data ?? marketsData
    if (Array.isArray(source?.markets)) return source.markets
    if (Array.isArray(source?.data)) return source.data
    return []
  }, [marketsData])

  // Fetch odds by eventId so Match Odds updates from match-level response
  const { data: oddsData, isLoading: isLoadingOdds, error: oddsError, refetch: refetchOdds } = useGetCricketMatchOddsQuery(
    { eventId },
    { 
      skip: !eventId,
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

  // Cricket scorecard (legacy / cricket only)
  const { data: scorecardData, isLoading: isLoadingCricketScorecard } = useGetCricketScorecardQuery(
    { eventId },
    {
      skip: !eventId || useFancyresScore,
      pollingInterval: 5000,
    }
  )

  const { data: fancyresTennisData, isLoading: isLoadingFancyresTennis } = useGetFancyresTennisScoreQuery(
    { eventId },
    {
      skip: !eventId || sport !== 'tennis',
      pollingInterval: 15000,
    }
  )

  const { data: fancyresSoccerData, isLoading: isLoadingFancyresSoccer } = useGetFancyresSoccerScoreQuery(
    { eventId },
    {
      skip: !eventId || sport !== 'soccer',
      pollingInterval: 15000,
    }
  )

  const isLoadingScorecard = useFancyresScore
    ? sport === 'tennis'
      ? isLoadingFancyresTennis
      : isLoadingFancyresSoccer
    : isLoadingCricketScorecard

  const fancyresRaw = sport === 'tennis' ? fancyresTennisData : sport === 'soccer' ? fancyresSoccerData : null

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
    if (Array.isArray(marketsList) && marketsList.length > 0) {
      const firstMarket = marketsList[0] as MarketResponse
      const startRaw = String(firstMarket.marketStartTime || '').trim() || firstMarket.event.openDate
      return {
        ename: firstMarket.event.name,
        stime: startRaw,
        iplay: false, // Will be determined from odds data
        tv: false, // Default, can be updated if available
        eventId: firstMarket.event.id,
        countryCode: firstMarket.event.countryCode,
        timezone: firstMarket.event.timezone
      }
    }
    
    return null
  }, [marketsList])

  // Extract scorecard data from API response
  const scorecard = useMemo(() => {
    if (useFancyresScore) {
      if (fancyresRaw == null) return null
      const title = matchData?.ename || ''
      return mapFancyresToLiveScorecard(fancyresRaw, title)
    }

    if (!scorecardData) return null
    // Handle API response structure: { message, code, error, data }
    if (scorecardData?.data && !scorecardData.error) {
      const normalized = normalizeLegacyScorecard(scorecardData.data)
      return normalized || scorecardData.data
    }
    // Fallback if data is directly in response
    if (scorecardData?.batsman || scorecardData?.team1) {
      return scorecardData
    }
    // New scorecard shape fallback (direct object with Innings/CurrentOver)
    const normalized = normalizeLegacyScorecard(scorecardData)
    if (normalized) return normalized
    return null
  }, [scorecardData, useFancyresScore, fancyresRaw, matchData?.ename])

  // Get eventId from match data or use matchId as fallback
  const currentEventId = useMemo(() => {
    // Try to get eventId from markets data first
    if (Array.isArray(marketsList) && marketsList.length > 0) {
      return (marketsList[0] as any)?.event?.id
    }
    // Try from matchData
    if (matchData?.eventId) {
      return matchData.eventId
    }
    // Fallback to eventId (which should be eventId)
    return eventId
  }, [marketsList, matchData, eventId])

  // Live TV URL (mis2.sqmr.xyz player; LiveTVSection builds iframe from currentEventId)
  const streamUrl = useMemo(() => {
    if (!currentEventId) return null
    const hasEventId = matchData?.eventId || (Array.isArray(marketsList) && marketsList.length > 0)
    if (!matchData?.tv && !hasEventId) return null
    return `https://mis2.sqmr.xyz/ank.php?eventId=${encodeURIComponent(String(currentEventId))}`
  }, [currentEventId, matchData, marketsList])

  return {
    marketsData: marketsList,
    oddsData,
    bookmakerFancyData,
    scorecardData,
    scorecard,
    matchData,
    currentEventId,
    streamUrl,
    isLoading,
    error,
    isLoadingScorecard,
    refetch
  }
}


