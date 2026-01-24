import { useMemo, useEffect } from 'react'
import { useGetMyPendingBetsQuery } from '@/app/services/Api'

export function useUserPendingBets(matchId: string, authUser: any) {
  // Pending settlements/bets for logged-in user across matches
  const { data: myPendingBetsData, isLoading: isLoadingPendingBets, refetch: refetchPendingBets } = useGetMyPendingBetsQuery(undefined)

  const userPendingBets = useMemo(() => {
    if (!myPendingBetsData) return []
    const root = myPendingBetsData as any
    // Handle new API response structure: { success: true, data: [...], count: 5 }
    let all: any[] = []
    if (root.success && Array.isArray(root.data)) {
      all = root.data
    } else if (Array.isArray(root)) {
      all = root
    } else if (Array.isArray(root.results)) {
      all = root.results
    } else if (Array.isArray(root.data)) {
      all = root.data
    }
  
    const numeric = Number(matchId)
    const hasNumeric = !Number.isNaN(numeric)
  
    return all.filter((bet: any) => {
      const betMatchId = bet.match_id ?? bet.matchId ?? bet.match?.id ?? bet.eventId
      if (betMatchId == null) return false
  
      return hasNumeric
        ? String(betMatchId) === String(numeric)
        : String(betMatchId) === String(matchId)
    })
  }, [myPendingBetsData, matchId])

  // Refetch pending bets on mount and periodically
  useEffect(() => {
    if (authUser) {
      // Initial refetch
      refetchPendingBets()
      
      // Set up periodic refetch every 30 seconds
      const interval = setInterval(() => {
        refetchPendingBets()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [authUser, refetchPendingBets])

  return {
    userPendingBets,
    isLoadingPendingBets,
    refetchPendingBets
  }
}


