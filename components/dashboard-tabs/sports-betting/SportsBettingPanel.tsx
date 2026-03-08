'use client'

import { CompetitionList } from './CompetitionList'

interface SportsBettingPanelProps {
  sportId: number
  sportName: string
  onMatchSelect?: (eventId: string) => void
}

export function SportsBettingPanel({ sportId, sportName, onMatchSelect }: SportsBettingPanelProps) {
  return (
    <div className="max-h-[70vh] overflow-y-auto bg-white">
      <CompetitionList
        sportId={sportId}
        sportName={sportName}
        onMatchSelect={onMatchSelect}
      />
    </div>
  )
}
