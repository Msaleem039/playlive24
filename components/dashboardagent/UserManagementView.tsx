"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronUp, Search, Download, FileText, User, Lock, Gamepad2, Plus, Users, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { AddClientModal, AllUsersModal } from "./index"
import DepositCashModal from "@/components/modal/DepositCashModal"
import WithdrawCashModal from "@/components/modal/WithdrawCashModal"
import UserDetailsModal from "@/components/modal/UserDetailsModal"
import ChangePasswordModal from "@/components/modal/ChangePasswordModal"
import { useChangePasswordMutation, useGetUserQuery, useToggleUserStatusMutation } from "@/app/services/Api"
import { toast } from "sonner"

interface UserProps {
  userTab: string
  setUserTab: (tab: string) => void
  users: any[]
  onAddUser: () => void
  onAllUsers: () => void
}

interface UserData {
  id: string
  name: string
  username?: string
  email: string
  role: string
  balance: number
  creditLimit?: number
  liability?: number
  plCash?: number
  availableBalance?: number
  parentId: string
  commissionPercentage: number
  isActive?: boolean
  createdAt: string
  updatedAt: string
}

export function UserManagementView({ userTab, setUserTab, users, onAddUser, onAllUsers }: UserProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showRows, setShowRows] = useState(25)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isAllUsersModalOpen, setIsAllUsersModalOpen] = useState(false)
  
  // Fetch users from API
  const { data: apiUsers, isLoading, error } = useGetUserQuery(undefined, {})
  const [depositModal, setDepositModal] = useState<{
    isOpen: boolean
    username: string
    userId?: string
  }>({
    isOpen: false,
    username: "",
    userId: undefined,
  })
  const [withdrawModal, setWithdrawModal] = useState<{
    isOpen: boolean
    username: string
    userId?: string
  }>({
    isOpen: false,
    username: "",
    userId: undefined,
  })
  const [userDetailsModal, setUserDetailsModal] = useState<{
    isOpen: boolean
    username: string
    userId?: string
    userData?: UserData
  }>({
    isOpen: false,
    username: "",
    userId: undefined,
    userData: undefined,
  })
  const [changePasswordModal, setChangePasswordModal] = useState<{
    isOpen: boolean
    username: string
  }>({
    isOpen: false,
    username: "",
  })
  const [changePassword] = useChangePasswordMutation()
  const [toggleUserStatus, { isLoading: isTogglingStatus }] = useToggleUserStatusMutation()

  // Format balance helper
  const formatBalance = (balance: number | string | undefined | null) => {
    if (balance === null || balance === undefined) return '0.00'
    const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance
    if (isNaN(numBalance)) return '0.00'
    return numBalance.toFixed(2)
  }

  // Filter and search users
  const filteredUsers = useMemo(() => {
    if (!apiUsers) return []
    
    let filtered = apiUsers as UserData[]
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.role.toLowerCase().includes(searchLower)
      )
    }
    
    // Filter by active/close users
    // For now, show all users in both tabs (you can add filtering logic based on user status if available)
    // If you have a status field in the API response, you can filter like:
    // if (userTab === "Close Users") {
    //   filtered = filtered.filter(user => user.status === "inactive" || user.status === "closed")
    // }
    
    return filtered.slice(0, showRows)
  }, [apiUsers, searchTerm, showRows, userTab])

  const handleExportExcel = () => {
    console.log("Export to Excel")
  }

  const handleExportPDF = () => {
    console.log("Export to PDF")
  }

  // Extract username from name or email
  const extractUsername = (name: string, email?: string): string => {
    return name || email?.split('@')[0] || 'User'
  }

  const handleDepositCash = (name: string, userId?: string, email?: string) => {
    const username = extractUsername(name, email)
    setDepositModal({
      isOpen: true,
      username,
      userId,
    })
  }

  const handleWithdrawCash = (name: string, userId?: string, email?: string) => {
    const username = extractUsername(name, email)
    setWithdrawModal({
      isOpen: true,
      username,
      userId,
    })
  }

  // This handler is no longer needed as the modal will handle API calls directly
  const handleDepositSubmit = async (data: { amount: string; remarks: string }) => {
    // This is handled inside DepositCashModal now
  }

  // This handler is no longer needed as the modal will handle API calls directly
  const handleWithdrawSubmit = async (data: { amount: string; remarks: string }) => {
    // This is handled inside WithdrawCashModal now
  }

  const handleUserDetails = (name: string, userId?: string, email?: string) => {
    const username = extractUsername(name, email)
    // Find the user data from the filtered users
    const userData = displayUsers.find((user: UserData) => user.id === userId) as UserData | undefined
    setUserDetailsModal({
      isOpen: true,
      username,
      userId,
      userData,
    })
  }

  const handleChangePassword = (name: string, email?: string) => {
    const username = extractUsername(name, email)
    setChangePasswordModal({
      isOpen: true,
      username,
    })
  }

  const handleUserDetailsSubmit = async (data: {
    name: string
    exposure: string
    userStatus: "Active" | "Inactive"
    fancyBetStatus: "Active" | "Inactive"
    marketBetStatus: "Active" | "Inactive"
    casinoBetStatus: "Active" | "Inactive"
  }) => {
    console.log("Update User Details for", userDetailsModal.username, ":", data)
    // TODO: Implement API call here
    // Example:
    // await updateUserDetailsAPI({
    //   userId: userDetailsModal.userId,
    //   username: userDetailsModal.username,
    //   ...data,
    // })
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

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserStatus({
        userId,
        isActive: !currentStatus,
      }).unwrap()
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        error?.error?.data?.message ||
        error?.message ||
        "Failed to toggle user status. Please try again."
      toast.error("Toggle status failed", {
        description: errorMessage,
      })
    }
  }

  // Use API users or fallback to prop users
  const displayUsers = filteredUsers.length > 0 ? filteredUsers : (users || [])

  return (
    <div className="bg-white mt-4">
      {/* Tabs */}
      <div className="bg-gray-800 text-white mb-3">
        <div className="flex">
          <button
            onClick={() => setUserTab("Active Users")}
            className={`px-6 py-2 text-xs sm:text-sm font-semibold relative ${
              userTab === "Active Users" 
                ? "text-white" 
                : "text-gray-400 hover:text-white text-xs sm:text-sm"
            }`}
          >
            Active Users
            {userTab === "Active Users" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00A66E]"></div>
            )}
          </button>
          <button
            onClick={() => setUserTab("Close Users")}
            className={`px-6 py-2 font-semibold text-xs sm:text-sm relative ${
              userTab === "Close Users" 
                ? "text-white" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Close Users
            {userTab === "Close Users" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00A66E]"></div>
            )}
          </button>
        </div>
      </div>

      {/* Combined Action Buttons and Table Controls */}
      <div className="bg-white p-2 sm:p-3 mb-3 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-between">
          {/* Left side: Action buttons (only for Active Users) and table controls */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {userTab === "Active Users" && (
              <>
                <Button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-4 sm:px-6 py-1.5 sm:py-2 flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  Add Client
                </Button>
                <Button 
                  onClick={() => setIsAllUsersModalOpen(true)}
                  className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-4 sm:px-6 py-1.5 sm:py-2 flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  All User Sports Settings
                </Button>
              </>
            )}
            <div className="flex gap-1.5 sm:gap-2">
              <Button
                onClick={handleExportExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1 text-xs sm:text-sm flex items-center gap-1"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                Excel
              </Button>
              <Button
                onClick={handleExportPDF}
                className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1 text-xs sm:text-sm flex items-center gap-1"
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                PDF
              </Button>
            </div>
          </div>
          {/* Right side: Search */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-700">Search:</span>
            <div className="relative">
              <Search className="hidden sm:block absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="pl-2 sm:pl-8 w-32 sm:w-64 text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
        ) : displayUsers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#00A66E]">
                    <tr>
                      <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-medium text-white uppercase tracking-wider min-w-[100px] sm:min-w-[130px]">
                        Login Name
                      </th>
                      <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-medium text-white uppercase tracking-wider min-w-[60px] sm:min-w-[80px]">
                        PL+Cash
                      </th>
                      <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-medium text-white uppercase tracking-wider min-w-[60px] sm:min-w-[80px]">
                        Balance
                      </th>
                      <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-medium text-white uppercase tracking-wider min-w-[60px] sm:min-w-[80px]">
                        Share
                      </th>
                      <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-medium text-white uppercase tracking-wider min-w-[60px] sm:min-w-[80px]">
                        Liability
                      </th>
                      <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-medium text-white uppercase tracking-wider min-w-[90px] sm:min-w-[110px]">
                        Available Balance
                      </th>
                      <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-medium text-white uppercase tracking-wider min-w-[45px] sm:min-w-[55px]">
                        Active
                      </th>
                      <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-medium text-white uppercase tracking-wider min-w-[55px] sm:min-w-[65px]">
                        Cash
                      </th>
                      <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-medium text-white uppercase tracking-wider w-auto">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayUsers.map((user: UserData, index) => (
                      <tr key={user.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                        <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 break-words leading-tight">
                            <span className="block sm:inline">{user.name || 'Unknown'}</span>
                            <span className="text-gray-600 text-[10px] sm:text-xs"> [{user.username || user.email?.split('@')[0] || user.name || 'N/A'}]</span>
                          </div>
                        </td>
                        <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-green-500">
                            ${formatBalance(user.plCash || 0)}
                          </div>
                        </td>
                        <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">
                            ${formatBalance(user.balance)}
                          </div>
                        </td>
                        <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">
                            ${formatBalance(user?.commissionPercentage || 0)}
                          </div>
                        </td>
                        <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-red-600 font-medium">
                            ${formatBalance(user.liability || 0)}
                          </div>
                        </td>
                        <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">
                            ${formatBalance(user.availableBalance || 0)}
                          </div>
                        </td>
                        <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.isActive ?? true)}
                            disabled={isTogglingStatus}
                            className="w-4 h-4 sm:w-4 sm:h-4 rounded flex items-center justify-center mx-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={user.isActive === false ? 'Click to activate' : 'Click to deactivate'}
                          >
                            {user.isActive !== false ? (
                              <div className="w-full h-full bg-green-500 rounded flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 sm:w-2.5 sm:h-2.5 text-white" />
                              </div>
                            ) : (
                              <div className="w-full h-full bg-red-500 rounded flex items-center justify-center">
                                <X className="w-2.5 h-2.5 sm:w-2.5 sm:h-2.5 text-white" />
                              </div>
                            )}
                          </button>
                        </td>
                        <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 whitespace-nowrap">
                          <div className="flex gap-0.5 sm:gap-1 justify-center sm:justify-start">
                            <button
                              onClick={() => handleDepositCash(user.name || user.email || '', user.id, user.email)}
                              className="w-5 h-5 sm:w-5 sm:h-5 bg-green-600 text-white text-[9px] sm:text-[10px] font-bold rounded hover:bg-green-700 transition-colors flex items-center justify-center"
                              title="Cash Deposit"
                            >
                              CD
                            </button>
                            <button
                              onClick={() => handleWithdrawCash(user.name || user.email || '', user.id, user.email)}
                              className="w-5 h-5 sm:w-5 sm:h-5 bg-red-600 text-white text-[9px] sm:text-[10px] font-bold rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                              title="Cash Withdraw"
                            >
                              CW
                            </button>
                          </div>
                        </td>
                        <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5">
                          <div className="flex flex-wrap gap-0.5 sm:gap-1 justify-start">
                            <button className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-orange-500 text-white text-[9px] sm:text-[10px] font-bold rounded hover:bg-orange-600 whitespace-nowrap transition-colors">
                              Log
                            </button>
                            <button
                              onClick={() => handleUserDetails(user.name || user.email || '', user.id, user.email)}
                              className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-[#00A66E] text-white text-[9px] sm:text-[10px] font-bold rounded hover:bg-[#008a5a] whitespace-nowrap transition-colors"
                              title="User Details"
                            >
                              User Setting
                            </button>
                            <button
                              onClick={() => handleChangePassword(user.name || user.email || '', user.email)}
                              className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-orange-500 text-white text-[9px] sm:text-[10px] font-bold rounded hover:bg-orange-600 whitespace-nowrap transition-colors"
                              title="Change Password"
                            >
                              Change Password
                            </button>
                            <button className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-orange-500 text-white text-[9px] sm:text-[10px] font-bold rounded hover:bg-orange-600 whitespace-nowrap transition-colors">
                              Game Control
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isAddUserModalOpen && (
        <AddClientModal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          onSubmit={(data) => {
            console.log('Add client:', data)
            setIsAddUserModalOpen(false)
          }}
        />
      )}

      {isAllUsersModalOpen && (
        <AllUsersModal
          isOpen={isAllUsersModalOpen}
          onClose={() => setIsAllUsersModalOpen(false)}
        />
      )}

      {/* Deposit Cash Modal */}
      <DepositCashModal
        isOpen={depositModal.isOpen}
        onClose={() => setDepositModal({ ...depositModal, isOpen: false })}
        username={depositModal.username}
        userId={depositModal.userId}
        onSubmit={handleDepositSubmit}
      />

      {/* Withdraw Cash Modal */}
      <WithdrawCashModal
        isOpen={withdrawModal.isOpen}
        onClose={() => setWithdrawModal({ ...withdrawModal, isOpen: false })}
        username={withdrawModal.username}
        userId={withdrawModal.userId}
        onSubmit={handleWithdrawSubmit}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={userDetailsModal.isOpen}
        onClose={() => setUserDetailsModal({ ...userDetailsModal, isOpen: false })}
        username={userDetailsModal.username}
        initialData={{
          name: userDetailsModal.userData?.name || "",
          exposure: userDetailsModal.userData?.balance?.toString() || "0",
          userStatus: "Active", // TODO: Fetch from API if available
          fancyBetStatus: "Active", // TODO: Fetch from API if available
          marketBetStatus: "Active", // TODO: Fetch from API if available
          casinoBetStatus: "Active", // TODO: Fetch from API if available
        }}
        onSubmit={handleUserDetailsSubmit}
      />

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


