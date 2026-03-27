'use client'

import * as React from 'react'
import { ChevronRight, Radio, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { useGetMatchesByCompetitionQuery } from '@/app/services/Api'
import { MarketList } from '@/components/dashboard-tabs/sports-betting/MarketList'

export interface MatchItem {
  eventId: string
  team1: string
  team2: string
  openDate?: string
  live?: boolean
  upcoming?: boolean
}

interface MatchListProps {
  competitionId: string
  sportId: number | string
  sportName: string
  onMatchSelect?: (eventId: string) => void
}

// API: GET cricketid/matches?sportId=&competitionId= → [{ event: { id, name }, eventId, live, upcoming }]
function normalizeMatches(data: unknown): MatchItem[] {
  if (!data) return []
  const mapOne = (x: any) => {
    const event = x?.event ?? x
    const eventId = String(x?.eventId ?? event?.id ?? x?.id ?? '')
    const name = event?.name ?? x?.name ?? ''
    const [t1, t2] = name ? name.split(/\s+v\s+|\s+vs\s+/i).map((s: string) => s.trim()) : ['', '']
    return {
      eventId,
      team1: (x?.team1 ?? t1) || name,
      team2: (x?.team2 ?? t2) || '',
      openDate: (x?.openDate ?? event?.openDate) ?? x?.startTime,
      live: x?.live === true || x?.live === 'true' || x?.live === 1,
      upcoming: x?.upcoming === true || x?.upcoming === 'true' || x?.upcoming === 1,
    }
  }
  if (Array.isArray(data)) return data.map(mapOne).filter((x) => x.eventId)
  const arr = (data as any)?.data ?? (data as any)?.matches
  if (Array.isArray(arr)) return arr.map(mapOne).filter((x) => x.eventId)
  return []
}

function formatDate(openDate?: string) {
  if (!openDate) return '--'
  try {
    const d = new Date(openDate)
    const day = d.getUTCDate().toString().padStart(2, '0')
    const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
    const hours = d.getUTCHours()
    const minutes = d.getUTCMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const h = (hours % 12) || 12
    return `${day} ${month} ${h}:${minutes} ${ampm}`
  } catch {
    return '--'
  }
}

export function MatchList({ competitionId, sportId, sportName, onMatchSelect }: MatchListProps) {
  const { data, isLoading, error, refetch } = useGetMatchesByCompetitionQuery(
    { sportId, competitionId },
    { skip: !competitionId || sportId == null }
  )

  const matches = normalizeMatches(data)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 px-2 text-gray-500 text-xs sm:text-sm">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Loading matches...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4 px-2">
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg bg-red-50 border border-red-200 py-4 px-3 text-center">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <p className="text-xs font-bold text-red-800">Failed to load matches</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs text-red-700 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!matches.length) {
    return (
      <div className="py-4 px-2 text-center text-gray-500 text-xs sm:text-sm">
        No matches in this competition
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-200">
      {matches.map((match) => (
        <MatchListItem
          key={match.eventId}
          match={match}
          sportName={sportName}
          onMatchSelect={onMatchSelect}
        />
      ))}
    </ul>
  )
}

function MatchListItem({
  match,
  sportName,
  onMatchSelect,
}: {
  match: MatchItem
  sportName: string
  onMatchSelect?: (eventId: string) => void
}) {
  const [expanded, setExpanded] = React.useState(false)
  const label = [match.team1, match.team2].filter(Boolean).join(' vs ') || 'Match'

  return (
    <li className="bg-white">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-2 px-2 sm:px-3 py-2.5 text-left hover:bg-gray-50 transition-colors rounded-none"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] sm:text-xs text-gray-500">
            <span>{formatDate(match.openDate)}</span>
            {match.live && (
              <span className="flex items-center gap-0.5 text-red-600 font-bold">
                <Radio className="w-2.5 h-2.5" /> Live
              </span>
            )}
            {match.upcoming && !match.live && (
              <span className="flex items-center gap-0.5 text-blue-600 font-bold">
                <Clock className="w-2.5 h-2.5" /> Upcoming
              </span>
            )}
          </div>
          <div className="font-bold text-xs sm:text-sm truncate mt-0.5">{label}</div>
        </div>
        <ChevronRight
          className={`w-4 h-4 flex-shrink-0 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="border-t border-gray-100 bg-white pl-2 sm:pl-4">
          <MarketList eventId={match.eventId} sportName={sportName} onMatchSelect={onMatchSelect} />
        </div>
      )}
    </li>
  )
}
