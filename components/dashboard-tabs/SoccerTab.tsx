'use client'

import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'
import { useGetTabBannersQuery } from '@/app/services/Api'
import { SportsBettingPanel } from './sports-betting'
import { RefreshCw } from 'lucide-react'

const SOCCER_SPORT_ID = 1

export default function SoccerTab() {
  const router = useRouter()
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isAgent = userRole === 'AGENT'
  const { data: tabBannersData } = useGetTabBannersQuery(undefined)
  const bannerUrl = (tabBannersData as any)?.soccer?.imageUrl as string | undefined

  const handleMatchSelect = (eventId: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fromMainPage', 'true')
      sessionStorage.setItem('liveSport', 'soccer')
    }
    if (isAgent) {
      router.push(`/agent/match-book/${eventId}`)
    } else {
      router.push(`/live/${eventId}?sport=soccer`)
    }
  }

  return (
    <div className="bg-white">
      <div className="bg-[#00A66E] text-white px-2 sm:px-4 py-2 font-semibold flex items-center justify-between gap-2">
        <span className="text-[0.7rem] sm:text-[0.75rem]">Soccer</span>
        <RefreshCw className="w-3.5 h-3.5 opacity-90" />
      </div>
      {bannerUrl && (
        <div className="px-2 sm:px-4 py-2 bg-black/5 border-b border-gray-200">
          <img src={bannerUrl} alt="Soccer banner" className="w-full h-16 sm:h-20 md:h-24 object-cover rounded-md" />
        </div>
      )}
      <SportsBettingPanel
        sportId={SOCCER_SPORT_ID}
        sportName="Soccer"
        onMatchSelect={handleMatchSelect}
      />
    </div>
  )
}
