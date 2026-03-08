'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp } from 'lucide-react'

interface MarketListProps {
  eventId: string
  sportName: string
  onMatchSelect?: (eventId: string) => void
}

export function MarketList({ eventId, sportName, onMatchSelect }: MarketListProps) {
  const router = useRouter()

  const handleViewMatch = React.useCallback(() => {
    if (onMatchSelect) {
      onMatchSelect(eventId)
    } else {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('fromMainPage', 'true')
        sessionStorage.setItem('liveSport', sportName.toLowerCase())
      }
      router.push(`/live/${eventId}?sport=${sportName.toLowerCase()}`)
    }
  }, [eventId, sportName, router, onMatchSelect])

  return (
    <div className="py-3 px-2">
      <button
        type="button"
        onClick={handleViewMatch}
        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-[#00A66E] bg-[#00A66E]/10 hover:bg-[#00A66E]/20 rounded-lg transition-colors"
      >
        <TrendingUp className="w-3.5 h-3.5" /> View full match
      </button>
    </div>
  )
}
