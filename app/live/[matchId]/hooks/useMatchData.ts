import { useMemo } from 'react'
import { useGetCricketMatchMarketsQuery, useGetCricketMatchOddsQuery, useGetCricketBookmakerFancyQuery, useGetCricketScorecardQuery } from '@/app/services/CricketApi'
import type { MarketResponse } from '../types'

export function useMatchData(eventId: string) {
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
    // Fallback to eventId (which should be eventId)
    return eventId
  }, [marketsData, matchData, eventId])

  // Streaming URL - using new tresting.com API
  const streamUrl = useMemo(() => {
    if (!currentEventId) return null
    // Generate stream URL if match has TV enabled OR if we have eventId (new API)
    const hasEventId = matchData?.eventId || (marketsData && Array.isArray(marketsData) && marketsData.length > 0)
    if (!matchData?.tv && !hasEventId) return null
    return `https://btocapi.tresting.com/embedN2?eventId=${currentEventId}`
  }, [currentEventId, matchData, marketsData])

  return {
    marketsData,
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


