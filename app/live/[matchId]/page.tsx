'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Pin, RefreshCw, Tv } from 'lucide-react'

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

export default function LiveMatchDetailPage() {
  const params = useParams()
  const matchId = params?.matchId as string
  
  const [liveToggle, setLiveToggle] = useState(true)
  const [selectedTab, setSelectedTab] = useState('all')

  // Dummy data - will be replaced with API data later
  const matchData = {
    title: 'Australia V India - International Twenty20 Matches',
    date: '02/11/2025',
    time: '13:15',
    isLive: true,
    hasLiveTV: true
  }

  // Dummy betting markets data
  const bettingMarkets: BettingMarket[] = [
    {
      name: 'MATCH_ODDS',
      min: 500,
      max: 500000,
      rows: [
        {
          team: 'Australia',
          back: [
            { odds: '1.99', amount: '2921.79' },
            { odds: '2', amount: '3602.19' },
            { odds: '2.02', amount: '6731.03' }
          ],
          lay: [
            { odds: '2.04', amount: '15.34' },
            { odds: '2.06', amount: '2805.35' },
            { odds: '2.08', amount: '3791.9' }
          ]
        },
        {
          team: 'India',
          back: [
            { odds: '1.94', amount: '2954.07' },
            { odds: '1.95', amount: '2659.77' },
            { odds: '1.96', amount: '47.11' }
          ],
          lay: [
            { odds: '1.97', amount: '4588.22' },
            { odds: '1.98', amount: '258.34' },
            { odds: '1.99', amount: '2283.35' }
          ]
        }
      ]
    },
    {
      name: 'TOSS',
      min: 500,
      max: 1000000,
      rows: [
        {
          team: 'Australia',
          back: [
            { odds: '1.96', amount: '100k' },
            { odds: '1.97', amount: '100k' },
            { odds: '1.98', amount: '100k' }
          ],
          lay: [
            { odds: '2.02', amount: '100k' },
            { odds: '2.03', amount: '100k' },
            { odds: '2.04', amount: '100k' }
          ]
        },
        {
          team: 'India',
          back: [
            { odds: '1.96', amount: '100k' },
            { odds: '1.97', amount: '100k' },
            { odds: '1.98', amount: '100k' }
          ],
          lay: [
            { odds: '2.02', amount: '100k' },
            { odds: '2.03', amount: '100k' },
            { odds: '2.04', amount: '100k' }
          ]
        }
      ]
    },
    {
      name: 'Bookmaker',
      min: 500,
      max: 2500000,
      rows: [
        {
          team: 'Australia',
          back: [
            { odds: '0', amount: '0' },
            { odds: '0', amount: '0' },
            { odds: '2.02', amount: '125000' }
          ],
          lay: [
            { odds: '2.07', amount: '125000' },
            { odds: '0', amount: '0' },
            { odds: '0', amount: '0' }
          ]
        },
        {
          team: 'India',
          back: [
            { odds: '0', amount: '0' },
            { odds: '0', amount: '0' },
            { odds: '1.93', amount: '125000' }
          ],
          lay: [
            { odds: '1.98', amount: '125000' },
            { odds: '0', amount: '0' },
            { odds: '0', amount: '0' }
          ]
        }
      ]
    }
  ]

  // Dummy bet history tabs
  const tabs = [
    { id: 'all', label: 'All', count: 0 },
    { id: 'odds', label: 'odds', count: 0 },
    { id: 'bm', label: 'bm', count: 0 },
    { id: 'fancy', label: 'fancy', count: 0 },
    { id: 'toss', label: 'toss', count: 0 },
    { id: 'tied', label: 'tied', count: 0 }
  ]

  // Dummy bet history data
  const betHistory: BetHistoryItem[] = []

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header Bar */}
      <div className="bg-[#00A66E] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-base sm:text-lg font-semibold">{matchData.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm sm:text-base">{matchData.date} {matchData.time}</span>
          {matchData.hasLiveTV && (
            <span className="flex items-center gap-1 text-sm">
              <Tv className="w-4 h-4" />
              Live TV
            </span>
          )}
          {/* Toggle Switch */}
          <button
            onClick={() => setLiveToggle(!liveToggle)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              liveToggle ? 'bg-white' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-[#00A66E] transition-transform ${
                liveToggle ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Content Area - Split Layout */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
        {/* Left Panel - Betting Markets */}
        <div className="flex-1 overflow-y-auto bg-white">
          {bettingMarkets.map((market, marketIndex) => (
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
                    <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1">
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
                        {row.back.map((option, optIndex) => (
                          <td key={`back-${optIndex}`} className="px-0.5 py-0.5">
                            <div
                              className={`w-full flex flex-col items-center justify-center py-1 rounded ${
                                option.odds === '0' || option.amount === '0'
                                  ? 'bg-gray-100'
                                  : 'bg-blue-100 hover:bg-blue-200 cursor-pointer'
                              }`}
                            >
                              <div className="font-semibold text-xs text-gray-900">{option.odds}</div>
                              <div className="text-[10px] text-gray-600">{option.amount}</div>
                            </div>
                          </td>
                        ))}
                        {/* Lay Odds - 3 columns */}
                        {row.lay.map((option, optIndex) => (
                          <td key={`lay-${optIndex}`} className="px-0.5 py-0.5">
                            <div
                              className={`w-full flex flex-col items-center justify-center py-1 rounded ${
                                option.odds === '0' || option.amount === '0'
                                  ? 'bg-gray-100'
                                  : 'bg-pink-100 hover:bg-pink-200 cursor-pointer'
                              }`}
                            >
                              <div className="font-semibold text-xs text-gray-900 ">{option.odds}</div>
                              <div className="text-[10px] text-gray-600">{option.amount}</div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Right Panel - User Activity/Bet History */}
        <div className="w-full lg:w-80 bg-white border-l border-gray-200 flex flex-col">
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
      </div>
    </div>
  )
}
