import React from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/utils/button'
import { useGetUserQuery } from '@/app/services/Api'

interface AllUsersModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UserData {
  id: string
  name: string
  email: string
  role: string
  balance: number
  parentId: string
  commissionPercentage: number
  createdAt: string
  updatedAt: string
}

export function AllUsersModal({ isOpen, onClose }: AllUsersModalProps) {
  const { data: users, isLoading, error } = useGetUserQuery(undefined, {
    skip: !isOpen, // Only fetch when modal is open
  })

  if (!isOpen) return null

  const formatBalance = (balance: number | string | undefined | null) => {
    if (balance === null || balance === undefined) return '0.00'
    const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance
    if (isNaN(numBalance)) return '0.00'
    return numBalance.toFixed(2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800'
      case 'AGENT':
        return 'bg-blue-100 text-blue-800'
      case 'CLIENT':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border border-white/20">
        {/* Header */}
        <div className="bg-[#00A66E] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-lg font-bold">All Users Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-[#00A66E] hover:bg-[#00A66E]/80 rounded flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#00A66E]" />
              <span className="ml-3 text-gray-600">Loading users...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-red-600 mb-2">Error loading users</p>
                <p className="text-sm text-gray-500">Please try again later</p>
              </div>
            </div>
          ) : !users || users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user: UserData) => (
                    <tr key={user?.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-600 rounded-full text-white text-xs font-bold flex items-center justify-center mr-2">
                            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user?.name || user?.email || 'Unknown User'}</div>
                            <div className="text-xs text-gray-500">{user?.id?.slice(0, 8) || 'N/A'}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user?.role || '')}`}>
                          {user?.role || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${formatBalance(user?.balance)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user?.commissionPercentage || 0}%
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                        </div>
                      </td>
                      {/* <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          <button className="w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700">
                            D
                          </button>
                          <button className="w-6 h-6 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700">
                            W
                          </button>
                          <button className="w-6 h-6 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700" title="Cash Deposit">
                            CD
                          </button>
                          <button className="w-6 h-6 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700" title="Cash Withdraw">
                            CW
                          </button>
                          <button className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600 whitespace-nowrap">
                            Log
                          </button>
                          <button className="px-3 py-1.5 bg-[#00A66E] text-white text-xs font-bold rounded hover:bg-[#008a5a] whitespace-nowrap">
                            User Setting
                          </button>
                          <button className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600 whitespace-nowrap">
                            Change Password
                          </button>
                          <button className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600 whitespace-nowrap">
                            Game Control
                          </button>
                        </div>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-4 mt-6 border-t border-gray-200">
            <Button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
