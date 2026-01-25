import React, { useState, useRef, useEffect, useMemo } from 'react'
import { X, Loader2, MoreVertical, ChevronRight, ChevronLeft, Eye, Lock } from 'lucide-react'
import { Button } from '@/components/utils/button'
import { useGetUserQuery, useChangePasswordMutation } from '@/app/services/Api'
import ChangePasswordModal from '@/components/modal/ChangePasswordModal'
import { toast } from 'sonner'

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

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [dropdownDirection, setDropdownDirection] = useState<{ [key: string]: 'up' | 'down' }>({})
  const [subordinatesModal, setSubordinatesModal] = useState<{
    isOpen: boolean
    userId: string
    userName: string
  }>({
    isOpen: false,
    userId: "",
    userName: "",
  })
  const [changePasswordModal, setChangePasswordModal] = useState<{
    isOpen: boolean
    username: string
  }>({
    isOpen: false,
    username: "",
  })
  const [changePassword] = useChangePasswordMutation()
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const dropdownButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && dropdownRefs.current[openDropdownId]) {
        if (!dropdownRefs.current[openDropdownId]?.contains(event.target as Node)) {
          setOpenDropdownId(null)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdownId, isOpen])

  const handleViewSubordinates = (userId: string, userName: string) => {
    setSubordinatesModal({
      isOpen: true,
      userId,
      userName,
    })
    setOpenDropdownId(null)
  }

  const handleChangePassword = (userName: string) => {
    setChangePasswordModal({
      isOpen: true,
      username: userName,
    })
    setOpenDropdownId(null)
  }

  const handleChangePasswordSubmit = async (data: {
    password: string
    confirmPassword: string
  }) => {
    try {
      await changePassword({
        password: data.password,
        confirmPassword: data.confirmPassword,
      }).unwrap()
      toast.success("Password updated successfully")
      setChangePasswordModal({ ...changePasswordModal, isOpen: false })
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        error?.error?.data?.message ||
        error?.message ||
        "Failed to change password. Please try again."
      toast.error("Change password failed", {
        description: errorMessage,
      })
      throw error
    }
  }

  const toggleDropdown = (userId: string) => {
    if (openDropdownId === userId) {
      setOpenDropdownId(null)
    } else {
      // Check if dropdown should open upward
      const buttonElement = dropdownButtonRefs.current[userId]
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const spaceBelow = viewportHeight - rect.bottom
        const spaceAbove = rect.top
        const dropdownHeight = 200 // Approximate dropdown height
        
        // If not enough space below but enough space above, open upward
        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
          setDropdownDirection({ ...dropdownDirection, [userId]: 'up' })
        } else {
          setDropdownDirection({ ...dropdownDirection, [userId]: 'down' })
        }
      }
      setOpenDropdownId(userId)
    }
  }

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
        return 'bg-[#AEDBFB]text-blue-800'
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
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="relative" ref={(el) => { dropdownRefs.current[user?.id || ''] = el }}>
                          <button
                            ref={(el) => { dropdownButtonRefs.current[user?.id || ''] = el }}
                            onClick={() => toggleDropdown(user?.id || '')}
                            className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 whitespace-nowrap transition-colors flex items-center gap-1"
                            title="More Options"
                          >
                            <MoreVertical className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          
                          {openDropdownId === user?.id && (
                            <div className={`absolute right-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 ${
                              dropdownDirection[user?.id || ''] === 'up' 
                                ? 'bottom-full mb-1' 
                                : 'top-full mt-1'
                            }`}>
                              <div className="py-1">
                                <button
                                  onClick={() => handleViewSubordinates(user?.id || '', user?.name || user?.email || 'User')}
                                  className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={() => handleChangePassword(user?.name || user?.email || 'User')}
                                  className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                                >
                                  <Lock className="w-4 h-4" />
                                  <span>Change Password</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
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

      {/* Subordinates Full Screen View */}
      {subordinatesModal.isOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col">
          {/* Header */}
          <div className="bg-[#00A66E] text-white px-6 py-4 flex items-center justify-between shadow-md">
            <div>
              <h2 className="text-xl font-bold">Subordinates</h2>
              <p className="text-sm text-white/90 mt-1">
                {subordinatesModal.userName} - Hierarchical View
              </p>
            </div>
            <button
              onClick={() => setSubordinatesModal({ ...subordinatesModal, isOpen: false })}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <SubordinatesView userId={subordinatesModal.userId} />
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModal.isOpen}
        onClose={() => setChangePasswordModal({ ...changePasswordModal, isOpen: false })}
        username={changePasswordModal.username}
        onSubmit={handleChangePasswordSubmit}
      />
    </div>
  )
}

// Subordinates View Component - Wrapper for hierarchical navigation with initial parentId
function SubordinatesView({ userId }: { userId: string }) {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(userId)
  const [viewMode, setViewMode] = useState<'users' | 'bets'>('users')
  const [navigationPath, setNavigationPath] = useState<Array<{ id: string; name: string; role?: string }>>([])
  
  const queryParams = useMemo(() => {
    if (viewMode === 'bets') {
      return selectedParentId ? { parentId: selectedParentId, type: 'bets' } : undefined
    } else {
      return selectedParentId ? { parentId: selectedParentId } : undefined
    }
  }, [viewMode, selectedParentId])

  const { data: apiData, isLoading, error } = useGetUserQuery(queryParams, { skip: false })

  // Extract items from API response
  const items = useMemo(() => {
    if (!apiData) return []
    
    if (Array.isArray(apiData)) {
      return apiData
    }
    
    if (apiData.data) {
      if (Array.isArray(apiData.data)) {
        return apiData.data
      }
      if (typeof apiData.data === 'object') {
        return (apiData.data as any).bets || (apiData.data as any).users || (apiData.data as any).data || []
      }
    }
    
    if (typeof apiData === 'object') {
      return (apiData as any).bets || (apiData as any).users || (apiData as any).data || []
    }
    
    return []
  }, [apiData, viewMode])

  const handleItemClick = (item: any) => {
    if (viewMode === 'bets') {
      return
    }
    
    const userItem = item
    const itemRole = userItem.role?.toUpperCase() || ''
    
    if (itemRole === 'CLIENT') {
      setSelectedParentId(userItem.id)
      setViewMode('bets')
      setNavigationPath([...navigationPath, { id: userItem.id, name: userItem.name || userItem.username || 'Client', role: itemRole }])
    } else {
      setSelectedParentId(userItem.id)
      setViewMode('users')
      setNavigationPath([...navigationPath, { id: userItem.id, name: userItem.name || userItem.username || 'User', role: itemRole }])
    }
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setNavigationPath([])
      setSelectedParentId(userId)
      setViewMode('users')
    } else {
      const newPath = navigationPath.slice(0, index + 1)
      setNavigationPath(newPath)
      if (newPath.length === 0) {
        setSelectedParentId(userId)
      } else {
        setSelectedParentId(newPath[newPath.length - 1].id)
      }
      if (index < navigationPath.length - 1 && viewMode === 'bets') {
        setViewMode('users')
      }
    }
  }

  return (
    <div className="w-full">
      {/* Breadcrumb Navigation */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded hover:bg-gray-100"
          >
            Root
          </button>
          {navigationPath.map((path, index) => (
            <div key={path.id} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded hover:bg-gray-100"
              >
                {path.name}
              </button>
            </div>
          ))}
          {viewMode === 'bets' && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Bet History</span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'users' ? (
        <>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {navigationPath.length === 0 ? 'Subordinates' : 'Subordinates'}
            </h3>
          </div>
          
          {error ? (
            <div className="text-center py-12 text-red-500">
              Error loading data: {error && 'data' in error ? (error.data as any)?.message || 'Unknown error' : 'Failed to load'}
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#00A66E]" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No subordinates found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Username</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Balance</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item: any) => {
                    const userItem = item
                    const itemRole = userItem.role?.toUpperCase() || ''
                    
                    return (
                      <tr 
                        key={userItem.id || Math.random()} 
                        className="hover:bg-blue-50 transition-colors cursor-pointer group"
                        onClick={() => handleItemClick(userItem)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {userItem.name || userItem.username || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {userItem.username || userItem.name || '--'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            itemRole === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                            itemRole === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                            itemRole === 'AGENT' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {itemRole || '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          Rs {userItem.balance?.toLocaleString() || '0.00'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (userItem.id) {
                                handleItemClick(userItem)
                              }
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-blue-200 transition-colors"
                            type="button"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Bet History</h3>
            <button
              onClick={() => {
                setViewMode('users')
                setNavigationPath(navigationPath.slice(0, -1))
                setSelectedParentId(navigationPath.length > 1 ? navigationPath[navigationPath.length - 2].id : userId)
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors border border-gray-200"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          
          {error ? (
            <div className="text-center py-12 text-red-500">
              Error loading bets: {error && 'data' in error ? (error.data as any)?.message || 'Unknown error' : 'Failed to load'}
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#00A66E]" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No bets found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Market Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Market Name</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Odds</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Stake</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Net Profit</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item: any) => {
                    const betItem = item
                    // Use status from API if available, otherwise derive from netProfit
                    let status
                    if (betItem.status) {
                      const statusUpper = betItem.status.toUpperCase()
                      if (statusUpper === 'WIN') status = { text: 'WIN', color: 'text-green-600' }
                      else if (statusUpper === 'LOSS') status = { text: 'LOSS', color: 'text-red-600' }
                      else if (statusUpper === 'PENDING') status = { text: 'PENDING', color: 'text-yellow-600' }
                      else status = { text: betItem.status, color: 'text-yellow-600' }
                    } else {
                      // Fallback: derive from netProfit
                      status = betItem.netProfit === null || betItem.netProfit === undefined 
                        ? { text: 'PENDING', color: 'text-yellow-600' }
                        : betItem.netProfit > 0 
                          ? { text: 'WIN', color: 'text-green-600' }
                          : { text: 'LOSS', color: 'text-red-600' }
                    }
                    const stake = betItem.stake || betItem.betvalue || betItem.amount || 0
                    const displayName = betItem.name || betItem.marketName || '--'
                    
                    return (
                      <tr key={betItem.id || betItem.betId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">
                            {betItem.marketType || '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {displayName}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {betItem.odds?.toFixed(2) || '--'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          Rs {stake.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          <span className={betItem.netProfit && betItem.netProfit > 0 ? 'text-green-600' : betItem.netProfit && betItem.netProfit < 0 ? 'text-red-600' : 'text-gray-600'}>
                            {betItem.netProfit !== null && betItem.netProfit !== undefined 
                              ? `Rs ${betItem.netProfit.toFixed(2)}`
                              : '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {betItem.createdAt ? new Date(betItem.createdAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '--'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
