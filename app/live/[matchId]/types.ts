// Betting Market Interfaces
export interface BettingOption {
  odds: number | string
  amount: number | string
}

export interface MarketRow {
  team: string
  back: BettingOption[]
  lay: BettingOption[]
  selectionId?: number
}

export interface BettingMarket {
  name: string
  min: number
  max: number
  rows: MarketRow[]
  gtype?: string
  marketId?: number | string
  marketIdString?: string // Store the full marketId string for API calls
  gscode?: number // Game status code
  gstatus?: string // Game status (ACTIVE, SUSPENDED, etc.)
}

export interface BetHistoryItem {
  userName: string
  market: string
  rate: string
  amount: string
  date: string
}

// API Response interfaces
export interface ApiOdds {
  sid: number
  psid: number
  odds: number
  otype: 'back' | 'lay'
  oname: string
  tno: number
  size: number
}

export interface ApiSection {
  sid: number
  sno: number
  gstatus: string
  gscode: number
  nat: string
  odds: ApiOdds[]
}

export interface ApiMatchMarket {
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

export interface ApiResponse {
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
export interface MarketRunner {
  selectionId: number
  runnerName: string
  handicap: number
  sortPriority: number
}

export interface MarketResponse {
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

export interface OddsRunner {
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

export interface OddsResponse {
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

