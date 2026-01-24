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
    <div className="w-full bg-white rounded-lg border-2 border-gray-300 shadow-md">
      <div className="px-3 sm:px-4 py-2.5 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
        <span className="text-sm sm:text-base font-bold text-gray-900">
          Your Pending Settlements
        </span>
        {isLoading && (
          <span className="text-xs sm:text-sm text-gray-600 animate-pulse">Loading...</span>
        )}
      </div>
      <div className="max-h-48 overflow-y-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-bold text-gray-700 border-b border-gray-200">Bet</th>
              <th className="px-3 py-2 text-center font-bold text-gray-700 border-b border-gray-200">Amount</th>
              <th className="px-3 py-2 text-center font-bold text-gray-700 border-b border-gray-200">Odds</th>
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
              
              return (
                <tr 
                  key={bet.id || idx} 
                  className="border-b border-gray-100 transition-colors"
                  style={{ backgroundColor: bgColor }}
                >
                  <td className="px-3 py-2">
                    <div className="font-semibold text-gray-900 truncate">
                      {bet.betName || 'Bet'}
                    </div>
                    <div className="text-[10px] text-gray-600 truncate mt-0.5">
                      {bet.marketName || bet.gtype || 'MATCH'}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-900 font-medium">
                    Rs {(bet.amount || bet.betValue || 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-900 font-medium">
                    {bet.odds ?? bet.betRate ?? '--'}
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


