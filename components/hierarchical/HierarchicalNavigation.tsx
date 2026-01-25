'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronRight, ChevronLeft, Trash2, Loader2 } from 'lucide-react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'
import { useGetUserQuery, useDeleteBetMutation } from '@/app/services/Api'
import { toast } from 'sonner'

interface UserItem {
  id: string
  name?: string
  username?: string
  role?: string
  balance?: number
  [key: string]: any
}

interface BetItem {
  id: string
  betId?: string
  name?: string
  marketType?: string
  marketName?: string
  odds?: number
  stake?: number
  betvalue?: number
  amount?: number
  netProfit?: number
  status?: string
  createdAt?: string
  [key: string]: any
}

interface NavigationPath {
  id: string
  name: string
  role?: string
}

export default function HierarchicalNavigation() {
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  
  // Navigation state - tracks the path: Admin → Agent → Client
  const [navigationPath, setNavigationPath] = useState<NavigationPath[]>([])
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'users' | 'bets'>('users')
  
  // Determine initial query based on role
  const initialQueryParams = useMemo(() => {
    // On page load, no parentId - backend returns based on logged-in role
    return undefined
  }, [])
  
  // Query for users/subordinates or bet history
  const queryParams = useMemo(() => {
    if (viewMode === 'bets') {
      return selectedParentId ? { parentId: selectedParentId, type: 'bets' } : undefined
    } else {
      return selectedParentId ? { parentId: selectedParentId } : undefined
    }
  }, [viewMode, selectedParentId])

  const { data: apiData, isLoading, error, refetch } = useGetUserQuery(
    queryParams,
    { skip: false }
  )
  
  const [deleteBet, { isLoading: isDeletingBet }] = useDeleteBetMutation()
  
  // Determine if current user is SUPER_ADMIN (only they can delete bets)
  // Check multiple possible formats: SUPER_ADMIN, super_admin, SUPERADMIN, etc.
  const isSuperAdmin = useMemo(() => {
    const roleUpper = userRole?.toUpperCase() || ''
    return roleUpper === 'SUPER_ADMIN' || roleUpper === 'SUPERADMIN' || roleUpper.includes('SUPER') && roleUpper.includes('ADMIN')
  }, [userRole])
  
  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('HierarchicalNavigation - User Role:', userRole)
      console.log('HierarchicalNavigation - Is Super Admin:', isSuperAdmin)
      console.log('HierarchicalNavigation - Auth User:', authUser)
    }
  }, [userRole, isSuperAdmin, authUser])
  
  // Extract items from API response
  const items = useMemo(() => {
    if (!apiData) return []
    
    // Handle direct array response
    if (Array.isArray(apiData)) {
      return apiData as (UserItem[] | BetItem[])
    }
    
    // Handle object with data property
    if (apiData.data) {
      if (Array.isArray(apiData.data)) {
        return apiData.data as (UserItem[] | BetItem[])
      }
      // If data is an object, try to extract array
      if (typeof apiData.data === 'object') {
        return (apiData.data as any).bets || (apiData.data as any).users || (apiData.data as any).data || []
      }
    }
    
    // Try to extract from root level
    if (typeof apiData === 'object') {
      return (apiData as any).bets || (apiData as any).users || (apiData as any).data || []
    }
    
    return []
  }, [apiData, viewMode])
  
  // Handle user/item click
  const handleItemClick = (item: UserItem | BetItem) => {
    if (viewMode === 'bets') {
      // In bet history view, items are bets - no further navigation
      return
    }
    
    const userItem = item as UserItem
    const itemRole = userItem.role?.toUpperCase() || ''
    
    // If clicked item is a CLIENT, switch to bet history view
    if (itemRole === 'CLIENT') {
      setSelectedParentId(userItem.id)
      setViewMode('bets')
      setNavigationPath([...navigationPath, { id: userItem.id, name: userItem.name || userItem.username || 'Client', role: itemRole }])
    } else {
      // For ADMIN or AGENT, drill down to next level
      setSelectedParentId(userItem.id)
      setViewMode('users')
      setNavigationPath([...navigationPath, { id: userItem.id, name: userItem.name || userItem.username || 'User', role: itemRole }])
    }
  }
  
  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Reset to root
      setNavigationPath([])
      setSelectedParentId(null)
      setViewMode('users')
    } else {
      // Navigate to specific level
      const newPath = navigationPath.slice(0, index + 1)
      setNavigationPath(newPath)
      if (newPath.length === 0) {
        setSelectedParentId(null)
      } else {
        setSelectedParentId(newPath[newPath.length - 1].id)
      }
      // If we're going back from bet history, switch to users view
      if (index < navigationPath.length - 1 && viewMode === 'bets') {
        setViewMode('users')
      }
    }
  }
  
  // Handle bet deletion (SUPER_ADMIN only)
  const handleDeleteBet = async (betId: string) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete bets')
      return
    }
    
    if (!confirm('Are you sure you want to delete this bet? This action cannot be undone.')) {
      return
    }
    
    try {
      await deleteBet(betId).unwrap()
      toast.success('Bet deleted successfully')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.error || error?.data?.message || 'Failed to delete bet')
    }
  }
  
  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '--'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }
  
  // Determine status from API response or derive from netProfit
  const getBetStatus = (betItem: BetItem) => {
    // If status is provided in API response, use it
    if (betItem.status) {
      const statusUpper = betItem.status.toUpperCase()
      if (statusUpper === 'WIN') return { text: 'WIN', color: 'text-green-600' }
      if (statusUpper === 'LOSS') return { text: 'LOSS', color: 'text-red-600' }
      if (statusUpper === 'PENDING') return { text: 'PENDING', color: 'text-yellow-600' }
      // Fallback to status as-is
      return { text: betItem.status, color: 'text-yellow-600' }
    }
    
    // Fallback: derive from netProfit if status not provided
    const netProfit = betItem.netProfit
    if (netProfit === null || netProfit === undefined) return { text: 'PENDING', color: 'text-yellow-600' }
    if (netProfit > 0) return { text: 'WIN', color: 'text-green-600' }
    if (netProfit < 0) return { text: 'LOSS', color: 'text-red-600' }
    return { text: 'PENDING', color: 'text-yellow-600' }
  }
  
  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Breadcrumb Navigation */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={(e) => {
              e.preventDefault()
              handleBreadcrumbClick(-1)
            }}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded hover:bg-gray-100"
          >
            {userRole === 'SUPER_ADMIN' ? 'Admins' : userRole === 'ADMIN' ? 'Agents' : 'Clients'}
          </button>
          {navigationPath.map((path, index) => (
            <div key={path.id} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleBreadcrumbClick(index)
                }}
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
      
      {/* Content Area */}
      <div className="p-4">
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
            <div>Role: {userRole}</div>
            <div>Is Super Admin: {isSuperAdmin ? 'Yes' : 'No'}</div>
            <div>View Mode: {viewMode}</div>
            <div>Selected Parent ID: {selectedParentId || 'none'}</div>
            <div>Items Count: {items.length}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            {error && <div className="text-red-600">Error: {JSON.stringify(error)}</div>}
          </div>
        )}
        
        {viewMode === 'users' ? (
          // Users List View
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {navigationPath.length === 0 
                  ? (userRole === 'SUPER_ADMIN' ? 'Admins' : userRole === 'ADMIN' ? 'Agents' : 'Clients')
                  : 'Subordinates'}
              </h2>
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
                No users found
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
                    {items.map((item: UserItem) => {
                      const userItem = item as UserItem
                      const itemRole = userItem.role?.toUpperCase() || ''
                      const isClient = itemRole === 'CLIENT'
                      const displayName = userItem.name || userItem.username || 'Unknown'
                      const displayUsername = userItem.username || userItem.name || '--'
                      
                      return (
                        <tr 
                          key={userItem.id || Math.random()} 
                          className="hover:bg-blue-50 transition-colors cursor-pointer group active:bg-blue-100"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (userItem.id) {
                              handleItemClick(userItem)
                            }
                          }}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {displayName}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {displayUsername}
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
                              className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-blue-200 transition-colors group-hover:bg-blue-100"
                              aria-label="View details"
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
          // Bet History View
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Bet History</h2>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setViewMode('users')
                  setNavigationPath(navigationPath.slice(0, -1))
                  setSelectedParentId(navigationPath.length > 1 ? navigationPath[navigationPath.length - 2].id : null)
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
                      {isSuperAdmin && (
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item: BetItem) => {
                      const betItem = item as BetItem
                      const betId = betItem.id || betItem.betId || ''
                      const status = getBetStatus(betItem)
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
                            {formatDate(betItem.createdAt)}
                          </td>
                          {isSuperAdmin && (
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (betId) {
                                    handleDeleteBet(betId)
                                  }
                                }}
                                disabled={isDeletingBet || !betId}
                                className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-red-200"
                                title="Delete bet (Super Admin only)"
                              >
                                {isDeletingBet ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          )}
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
    </div>
  )
}

