'use client'

import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'
import { SportsBettingPanel } from './sports-betting'
import { RefreshCw } from 'lucide-react'

const TENNIS_SPORT_ID = 2

export default function TennisTab() {
  const router = useRouter()
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isAgent = userRole === 'AGENT'

  const handleMatchSelect = (eventId: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fromMainPage', 'true')
      sessionStorage.setItem('liveSport', 'tennis')
    }
    if (isAgent) {
      router.push(`/agent/match-book/${eventId}`)
    } else {
      router.push(`/live/${eventId}?sport=tennis`)
    }
  }

  return (
    <div className="bg-white">
      <div className="bg-[#00A66E] text-white px-2 sm:px-4 py-2 font-semibold flex items-center justify-between gap-2">
        <span className="text-[0.7rem] sm:text-[0.75rem]">Tennis</span>
        <RefreshCw className="w-3.5 h-3.5 opacity-90" />
      </div>
      <SportsBettingPanel
        sportId={TENNIS_SPORT_ID}
        sportName="Tennis"
        onMatchSelect={handleMatchSelect}
      />
    </div>
  )
}
