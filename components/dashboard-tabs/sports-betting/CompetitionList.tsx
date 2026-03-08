'use client'

import * as React from 'react'
import { ChevronRight, Trophy, AlertCircle, RefreshCw } from 'lucide-react'
import { useGetSeriesQuery } from '@/app/services/Api'
import { MatchList } from '@/components/dashboard-tabs/sports-betting/MatchList'

export interface CompetitionItem {
  competitionId: string
  name: string
}

interface CompetitionListProps {
  sportId: number | string
  sportName: string
  onMatchSelect?: (eventId: string) => void
}

// API: GET cricketid/series?sportId=1|2 → [{ competition: { id, name }, competitionRegion, marketCount }]
function normalizeCompetitions(data: unknown): CompetitionItem[] {
  if (!data) return []
  if (Array.isArray(data)) {
    return data.map((x: any) => {
      const comp = x?.competition ?? x
      return {
        competitionId: String(comp?.id ?? comp?.competitionId ?? x?.competitionId ?? ''),
        name: comp?.name ?? x?.name ?? 'Competition',
      }
    }).filter((x) => x.competitionId)
  }
  const arr = (data as any)?.data ?? (data as any)?.competitions
  if (Array.isArray(arr)) {
    return arr.map((x: any) => {
      const comp = x?.competition ?? x
      return {
        competitionId: String(comp?.id ?? comp?.competitionId ?? x?.competitionId ?? ''),
        name: comp?.name ?? x?.name ?? 'Competition',
      }
    }).filter((x) => x.competitionId)
  }
  return []
}

export function CompetitionList({ sportId, sportName, onMatchSelect }: CompetitionListProps) {
  const { data, isLoading, error, refetch } = useGetSeriesQuery(sportId, {
    skip: sportId === undefined || sportId === null,
  })

  const competitions = normalizeCompetitions(data)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 px-4 text-gray-500 text-sm">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Loading {sportName} competitions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-6 px-4">
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-red-50 border border-red-200 py-6 px-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm font-medium text-red-800">Failed to load competitions</p>
          <p className="text-xs text-red-600">{(error as any)?.data?.message ?? (error as Error)?.message ?? 'Unknown error'}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-sm text-red-700 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!competitions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-gray-500 text-sm">
        <Trophy className="w-8 h-8 mb-2 text-gray-400" />
        <p>No competitions found for {sportName}</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-200">
      {competitions.map((comp) => (
        <CompetitionListItem
          key={comp.competitionId}
          competition={comp}
          sportId={sportId}
          sportName={sportName}
          onMatchSelect={onMatchSelect}
        />
      ))}
    </ul>
  )
}

function CompetitionListItem({
  competition,
  sportId,
  sportName,
  onMatchSelect,
}: {
  competition: CompetitionItem
  sportId: number | string
  sportName: string
  onMatchSelect?: (eventId: string) => void
}) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <li className="bg-white">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-2 px-3 py-3 text-left hover:bg-gray-50 transition-colors rounded-none"
        aria-expanded={expanded}
      >
        <span className="font-medium text-sm truncate">{competition.name}</span>
        <ChevronRight
          className={`w-4 h-4 flex-shrink-0 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/70 pl-2 sm:pl-4">
          <MatchList
            competitionId={competition.competitionId}
            sportId={sportId}
            sportName={sportName}
            onMatchSelect={onMatchSelect}
          />
        </div>
      )}
    </li>
  )
}
