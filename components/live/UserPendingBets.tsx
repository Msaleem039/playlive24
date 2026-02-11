'use client'

interface UserPendingBetsProps {
  userPendingBets: any[]
  isLoading: boolean
}

export default function UserPendingBets({ userPendingBets, isLoading }: UserPendingBetsProps) {
  if (userPendingBets.length === 0 && !isLoading) {
    return (
      <div className="w-full bg-white rounded-lg border-2 border-gray-300 shadow-md">
        <div className="px-3 sm:px-4 py-2.5 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-gray-900">
            Your Pending Settlements
          </span>
        </div>
        <div className="px-3 sm:px-4 py-4 text-xs sm:text-sm text-gray-500 text-center">
          No pending settlements for this match.
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white  border-2 border-gray-300 shadow-md">
      <div className="px-2 sm:px-3 py-2 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
        <span className="text-sm sm:text-base font-bold text-gray-900">
          Your Pending Settlements
        </span>
        {isLoading && (
          <span className="text-xs sm:text-sm text-gray-600 animate-pulse">Loading...</span>
        )}
      </div>
      <div className="max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-2 sm:px-3 py-2 text-left font-bold text-gray-700 border-b border-gray-200 text-xs sm:text-sm">Bet</th>
              <th className="px-2 sm:px-3 py-2 text-center font-bold text-gray-700 border-b border-gray-200 text-xs sm:text-sm">Amount</th>
              <th className="px-2 sm:px-3 py-2 text-center font-bold text-gray-700 border-b border-gray-200 text-xs sm:text-sm">Odds</th>
            </tr>
          </thead>
          <tbody>
            {userPendingBets.map((bet: any, idx: number) => {
              // Determine bet type (can be 'BACK', 'LAY', 'back', or 'lay')
              const betType = (bet.betType ?? bet.bet_type ?? '').toLowerCase()
              const isLay = betType === 'lay'
              const isBack = betType === 'back'
              
              // Set background color based on bet type
              const bgColor = isLay ? '#FCCEE8' : isBack ? '#BEDBFF' : 'transparent'
              
              const oddsValue = bet.odds ?? bet.betRate ?? null
              
              return (
                <tr 
                  key={bet.id || idx} 
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                  style={{ backgroundColor: bgColor }}
                >
                  <td className="px-2 sm:px-3 py-2.5">
                    <div className="font-semibold text-gray-900 truncate text-xs sm:text-sm">
                      {bet.betName || 'Bet'}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-600 truncate mt-0.5">
                      {bet.marketName || bet.gtype || 'MATCH'}
                    </div>
                    {/* {oddsValue && (
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                        Odds: <span className="font-medium">{oddsValue}</span>
                      </div>
                    )} */}
                  </td>
                  <td className="px-1 sm:px-3 py-2 text-center text-gray-900 font-medium text-xs sm:text-sm">
                    Rs {(bet.amount || bet.betValue || 0).toLocaleString()}
                  </td>
                  <td className="px-1 sm:px-3 py-2 text-center text-gray-900 font-medium text-xs sm:text-sm">
                    {oddsValue ? oddsValue : '--'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}


