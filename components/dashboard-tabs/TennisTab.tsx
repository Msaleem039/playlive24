'use client'

import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'
import { useGetTabBannersQuery, useGetTennisMatchesQuery } from '@/app/services/Api'
import { FancyresTabScoreLine } from '@/components/dashboard-tabs/FancyresTabScoreLine'
import { RefreshCw } from 'lucide-react'

export default function TennisTab() {
  const router = useRouter()
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isAgent = userRole === 'AGENT'
  const { data: tabBannersData } = useGetTabBannersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: matchesData, isLoading, isError, refetch } = useGetTennisMatchesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000,
  })
  const bannerSource = ((tabBannersData as any)?.data ?? tabBannersData) as any
  const bannerUrl =
    bannerSource?.tennis?.imageUrl ||
    bannerSource?.TENNIS?.imageUrl ||
    undefined
  const eventsSource = (matchesData as any)?.data ?? matchesData
  const liveEvents = Array.isArray(eventsSource?.live) ? eventsSource.live : []
  const upcomingEvents = Array.isArray(eventsSource?.upcoming) ? eventsSource.upcoming : []
  const events = [...liveEvents, ...upcomingEvents]
  const formatMatchDateLabel = (dateStart?: string) => {
    if (!dateStart) return '-'
    const date = new Date(dateStart)
    if (Number.isNaN(date.getTime())) return '-'
    const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
    const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
    return `${datePart} ${timePart}`
  }

  const handleMatchSelect = (eventId: string, marketId?: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fromMainPage', 'true')
      sessionStorage.setItem('liveSport', 'tennis')
    }
    if (isAgent) {
      router.push(`/agent/match-book/${eventId}`)
    } else {
      const marketQuery = marketId ? `&marketid=${encodeURIComponent(marketId)}` : ''
      router.push(`/live/${eventId}?sport=tennis${marketQuery}`)
    }
  }

  return (
    <div className="bg-white">
      <div className="bg-[#00A66E] text-white px-2 sm:px-4 py-2 font-bold flex items-center justify-between gap-2">
        <span className="text-[0.7rem] sm:text-[0.75rem]">Tennis</span>
        <button type="button" onClick={() => refetch()} className="p-1 rounded hover:bg-white/20 transition-colors">
          <RefreshCw className="w-3.5 h-3.5 opacity-90" />
        </button>
      </div>
      {bannerUrl && (
        <div className="w-full border-b border-gray-200 bg-black/5">
          <img
            src={bannerUrl}
            alt="Tennis banner"
            className="w-full h-auto object-cover"
          />
        </div>
      )}
      <div className="divide-y divide-gray-200">
        {isLoading && <div className="text-xs text-gray-600 px-3 py-4">Loading tennis matches...</div>}
        {isError && <div className="text-xs text-red-600 px-3 py-4">Failed to load tennis matches.</div>}
        {!isLoading && !isError && events.length === 0 && <div className="text-xs text-gray-500 px-3 py-4">No tennis matches available.</div>}

        {!isLoading && !isError && events.map((item: any, index: number) => {
          const eventId = item?.EventId || item?.eventId || item?.event?.id
          const marketId = item?.MarketId || item?.marketId
          const eventName = item?.Event || item?.event?.name || item?.name || '-'
          const startTime = item?.StartTime || item?.event?.openDate || item?.startTime
          const isLive = item?.live === true
          const [teamA, teamB] = String(eventName).split(/\s+v\s+|\s+vs\s+/i).map((s: string) => s.trim())

          if (!eventId) return null

          return (
            <div
              key={`${eventId}-${marketId || 'match'}`}
              onClick={() => handleMatchSelect(String(eventId), marketId ? String(marketId) : undefined)}
              className={`flex flex-col sm:grid sm:grid-cols-[minmax(220px,1fr)_28px_34px_34px] gap-2 px-2 py-2 ${
                isLive ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
              } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
            >
              <div className="flex flex-col gap-1 text-xs sm:text-sm min-w-0">
                <div className="flex items-center gap-2 text-[11px] sm:text-[12px] flex-wrap">
                  <span className="font-bold truncate">{formatMatchDateLabel(startTime)}</span>
                  <span className="text-gray-300 hidden sm:inline">|</span>
                  {isLive ? (
                    <>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                      <span className="text-red-600 font-bold text-[10px] sm:text-xs">Live</span>
                    </>
                  ) : (
                    <span className="text-blue-600 font-bold text-[10px] sm:text-xs">Upcoming</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[13px] sm:text-sm truncate">{teamA || eventName}</span>
                  {teamB && <span className="text-gray-400 text-xs">v</span>}
                  {teamB && <span className="font-bold text-[13px] sm:text-sm truncate">{teamB}</span>}
                </div>
                {isLive && (
                  <FancyresTabScoreLine eventId={String(eventId)} sport="tennis" isLive={isLive} />
                )}
              </div>

              <div className="hidden sm:flex items-center justify-center">
                <span className="w-5 h-5" />
              </div>
              <div className="hidden sm:flex items-center justify-center">
                <span className="w-7 h-7 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center text-[10px] font-bold">BM</span>
              </div>
              <div className="hidden sm:flex items-center justify-center">
                <span className="w-7 h-7 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center text-[10px] font-bold">F</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
