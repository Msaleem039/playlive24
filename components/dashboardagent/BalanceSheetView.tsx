"use client"

export function BalanceSheetView() {
  const greenData = [
    { username: "Settlement (Client)", amount: "20,000.00" },
    { username: "Cash to Upline", amount: "20,000.00" },
    { username: "Total", amount: "20,000.00" }
  ]

  const redData = [
    { username: "My ProfitLoss", amount: "0.00" },
    { username: "Upline ProfitLoss", amount: "20,000.00" },
    { username: "Total", amount: "0.00" }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#00A66E] text-white px-4 py-3">
        <h1 className="text-lg font-bold">Balance Sheet</h1>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Green Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-green-600 text-white px-4 py-3">
              <h3 className="font-bold text-lg">Green Section</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {greenData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.username}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                        {row.amount}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* Empty action column */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-800 h-2"></div>
          </div>

          {/* Red Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-red-600 text-white px-4 py-3">
              <h3 className="font-bold text-lg">Red Section</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {redData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.username}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                        {row.amount}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* Empty action column */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-800 h-2"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
