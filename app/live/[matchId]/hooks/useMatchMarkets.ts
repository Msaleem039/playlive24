import { useMemo } from 'react'
import type { BettingMarket, MarketRow, BettingOption, MarketResponse, OddsResponse, MarketRunner, OddsRunner } from '../types'

const BACK_COLUMNS = 1
const LAY_COLUMNS = 1

export function useMatchMarkets(
  marketsData: any,
  oddsData: any,
  bookmakerFancyData: any,
  eventId: string,
  numericMatchId: number | null,
  marketIds: string[]
) {
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
    
    
    // Filter out markets with "2nd" in mname, "TOURNAMENT_WINNER", "Bookmaker Big Bash Cup", "Match Odds Including Tie", "Completed Match", "Super Over", "Line" markets, "Over Total" markets (case-insensitive)
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
      // Note: "Tied Match" markets are now included and will be displayed
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
      // CRITICAL: DO NOT exclude "Match Odds" - this is the main market we need!
      // Keep "Match Odds" and "MATCH_ODDS" - they have the correct selectionIds for positions
      // Exclude "Completed Match" markets
      if (mname === 'completed match' || mname.includes('completed match')) {
        return false
      }
      // Exclude "Super Over" markets
      if (mname === 'super over' || mname.includes('super over')) {
        return false
      }
      // For match-type markets: Keep only "MATCH_ODDS" or "Match Odds" (these have correct selectionIds)
      // Exclude other match-type markets
      const marketType = (market.gtype || '').toLowerCase()
      const marketNameUpper = (market.mname || market.marketName || '').toUpperCase().trim()
      if (marketType === 'match' && marketNameUpper !== 'MATCH_ODDS' && marketNameUpper !== 'MATCH ODDS') {
        return false
      }
      return true
    })
    
    return filteredMarkets
  }, [marketsData, oddsData, bookmakerFancyData, numericMatchId, eventId, marketIds])

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

        // DEBUG: Log all runners and their selectionIds before processing
        console.log('📊 [Market Transform] ========== PROCESSING MARKET RUNNERS ==========', {
          marketName,
          marketId: market.marketId,
          runnersCount: market.runners?.length || 0,
          allRunners: market.runners?.map((r: MarketRunner, idx: number) => ({
            index: idx,
            team: r.runnerName,
            selectionId: r.selectionId,
            selectionIdType: typeof r.selectionId,
            runnerData: r
          })) || [],
          note: 'These selectionIds MUST match position API keys for positions to display'
        })

        // Process each runner from the market
        market.runners.forEach((runner: MarketRunner, runnerIndex: number) => {
          // Skip runners with "Tie" as runnerName
          if (runner.runnerName === 'Tie' || runner.runnerName?.toLowerCase() === 'tie') {
            return
          }
          
          // CRITICAL: Position API uses selectionIds from DETAIL MATCH API (market runners), NOT from odds data
          // The detail match API already provides the correct selectionIds that match the position API
          // We should use market runner selectionId directly for position matching
          let oddsForRunner: OddsRunner | undefined = undefined
          
          // VALIDATE: Ensure runner.selectionId exists and is valid
          if (!runner.selectionId || runner.selectionId <= 0) {
            console.error('❌ [Market Transform] Invalid selectionId for runner:', {
              team: runner.runnerName,
              selectionId: runner.selectionId,
              runnerIndex,
              runnerData: runner,
              note: 'SelectionId must be a positive number to match position API'
            })
            // Skip this runner if selectionId is invalid
            return
          }
          
          // Use market runner selectionId directly - this matches the position API selectionIds
          let positionSelectionId: number = runner.selectionId
          
          console.log('🔗 [Market Transform] Starting selectionId mapping for runner:', {
            team: runner.runnerName,
            marketRunnerSelectionId: runner.selectionId,
            usingMarketSelectionId: true, // We use market selectionId directly
            hasOdds: !!market.odds,
            hasOddsRunners: !!(market.odds?.runners),
            oddsRunnersCount: market.odds?.runners?.length || 0
          })
          
          // Try to find odds runner for odds data (for displaying odds), but use market selectionId for positions
          if (market.odds?.runners && Array.isArray(market.odds.runners)) {
            // First try: Match by selectionId (if they happen to match)
            oddsForRunner = market.odds.runners.find((r: OddsRunner) => r.selectionId === runner.selectionId)
            
            if (oddsForRunner) {
              console.log('✅ [Market Transform] Found odds runner by selectionId:', {
                team: runner.runnerName,
                selectionId: runner.selectionId,
                willUseForOdds: true,
                willUseForPosition: true
              })
            } else {
              // Second try: Match by array position (runners are usually in same order)
              if (market.runners.length === market.odds.runners.length) {
                const runnerIndex = market.runners.findIndex((r: MarketRunner) => r.selectionId === runner.selectionId)
                
                if (runnerIndex >= 0 && runnerIndex < market.odds.runners.length) {
                  oddsForRunner = market.odds.runners[runnerIndex]
                  console.log('✅ [Market Transform] Found odds runner by array position:', {
                    team: runner.runnerName,
                    marketRunnerSelectionId: runner.selectionId,
                    oddsRunnerSelectionId: oddsForRunner.selectionId,
                    runnerIndex,
                    note: 'Using market selectionId for positions, odds selectionId for odds display'
                  })
                }
              }
              
              if (!oddsForRunner) {
                console.warn('⚠️ [Market Transform] No odds runner found, but using market selectionId for positions:', {
                  team: runner.runnerName,
                  marketRunnerSelectionId: runner.selectionId,
                  positionSelectionId: positionSelectionId,
                  availableOddsSelectionIds: market.odds.runners.map((r: OddsRunner) => r.selectionId),
                  note: 'Positions will use market selectionId, odds may be unavailable'
                })
              }
            }
          } else {
            console.log('ℹ️ [Market Transform] No odds data available, using market selectionId for positions:', {
              team: runner.runnerName,
              marketRunnerSelectionId: runner.selectionId,
              positionSelectionId: positionSelectionId
            })
          }
          
          // IMPORTANT: Always use market runner selectionId for position matching
          // This is the correct selectionId that matches the position API response
          console.log('✅ [Market Transform] Final position selectionId (from market runner):', {
            team: runner.runnerName,
            positionSelectionId: positionSelectionId,
            source: 'marketRunner',
            matchesPositionAPI: true
          })
          
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
            selectionId: positionSelectionId, // Use market runner selectionId directly (matches position API)
            back: backOdds,
            lay: layOdds
          })
          
          // Debug: Log final selectionId mapping
          console.log('📋 [Market Transform] Final row created with selectionId:', {
            team: runner.runnerName,
            marketRunnerSelectionId: runner.selectionId,
            finalRowSelectionId: positionSelectionId,
            finalRowSelectionIdType: typeof positionSelectionId,
            source: 'marketRunner (matches position API)',
            hasOddsRunner: !!oddsForRunner,
            oddsRunnerSelectionId: oddsForRunner?.selectionId,
            note: 'Position API uses market runner selectionIds, not odds selectionIds',
            rowData: {
              team: runner.runnerName || 'Unknown',
              selectionId: positionSelectionId,
              backCount: backOdds.length,
              layCount: layOdds.length
            }
          })
        })

        if (rows.length > 0) {
          const marketData = {
            name: marketName,
            min: 500, // Default min
            max: 500000, // Default max
            rows,
            gtype: 'match', // Default type
            marketId: parseInt(market.marketId.split('.')[1]) || undefined, // Extract numeric part for legacy compatibility
            marketIdString: market.marketId // Store full string for API calls
          }
          
          // CRITICAL: Log MATCH_ODDS market to verify correct selectionIds
          if (marketName.toUpperCase().trim() === 'MATCH_ODDS' || marketName.toUpperCase().trim() === 'MATCH ODDS') {
            console.log('✅ [Market Transform] ========== MATCH_ODDS MARKET CREATED ==========', {
              marketName: marketData.name,
              marketId: marketData.marketId,
              marketIdString: marketData.marketIdString,
              rowsCount: marketData.rows.length,
              rows: marketData.rows.map((r: any) => ({
                team: r.team,
                selectionId: r.selectionId,
                selectionIdType: typeof r.selectionId,
                note: 'These selectionIds MUST match position API keys'
              })),
              allSelectionIds: marketData.rows.map((r: any) => r.selectionId),
              note: 'This market will be used for position matching'
            })
          }
          
          markets.push(marketData)
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

  return { allMarkets, bettingMarkets }
}

