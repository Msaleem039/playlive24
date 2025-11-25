"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronUp, Search, Download, FileText, User, Lock, Gamepad2, Plus, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { AddClientModal, AllUsersModal } from "./index"
import DepositCashModal from "@/components/modal/DepositCashModal"
import WithdrawCashModal from "@/components/modal/WithdrawCashModal"
import UserDetailsModal from "@/components/modal/UserDetailsModal"
import ChangePasswordModal from "@/components/modal/ChangePasswordModal"
import { useChangePasswordMutation, useGetUserQuery } from "@/app/services/Api"
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
  email: string
  role: string
  balance: number
  parentId: string
  commissionPercentage: number
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
  }>({
    isOpen: false,
    username: "",
    userId: undefined,
  })
  const [changePasswordModal, setChangePasswordModal] = useState<{
    isOpen: boolean
    username: string
  }>({
    isOpen: false,
    username: "",
  })
  const [changePassword] = useChangePasswordMutation()

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
    setUserDetailsModal({
      isOpen: true,
      username,
      userId,
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
    currentPassword: string
    newPassword: string
  }) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
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

  // Use API users or fallback to prop users
  const displayUsers = filteredUsers.length > 0 ? filteredUsers : (users || [])

  return (
    <div className="bg-white mt-6">
      {/* Tabs */}
      <div className="bg-gray-800 text-white mb-4">
        <div className="flex">
          <button
            onClick={() => setUserTab("Active Users")}
            className={`px-6 py-3 font-semibold relative ${
              userTab === "Active Users" 
                ? "text-white" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Active Users
            {userTab === "Active Users" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00A66E]"></div>
            )}
          </button>
          <button
            onClick={() => setUserTab("Close Users")}
            className={`px-6 py-3 font-semibold relative ${
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

      {/* Action Buttons */}
      {userTab === "Active Users" && (
        <div className="bg-white p-4 mb-4 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setIsAddUserModalOpen(true)}
                className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-6 py-2 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </Button>
              <Button 
                onClick={() => setIsAllUsersModalOpen(true)}
                className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-6 py-2 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                All User Sports Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table Controls - Show for both tabs */}
      <div className="bg-white p-4 mb-4 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={showRows}
                  onChange={(e) => setShowRows(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10 rows</option>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                </select>
                <span className="text-sm text-gray-700">rows</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleExportExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </Button>
                <Button
                  onClick={handleExportPDF}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Search:</span>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="pl-8 w-64"
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <ChevronUp className="w-4 h-4" />
                  </th>
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
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayUsers.map((user: UserData, index) => (
                  <tr key={user.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-600 rounded-full text-white text-xs font-bold flex items-center justify-center mr-2">
                          {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name || user.email || 'Unknown User'}</div>
                          <div className="text-xs text-gray-500">{user.id?.slice(0, 8) || 'N/A'}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        (user.role || '').toUpperCase() === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        (user.role || '').toUpperCase() === 'AGENT' ? 'bg-blue-100 text-blue-800' :
                        (user.role || '').toUpperCase() === 'CLIENT' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      ${formatBalance(user.balance)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.commissionPercentage || 0}%
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        <button className="w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700">
                          D
                        </button>
                        <button className="w-6 h-6 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700">
                          W
                        </button>
                        <button
                          onClick={() => handleDepositCash(user.name || user.email || '', user.id, user.email)}
                          className="w-6 h-6 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700"
                          title="Cash Deposit"
                        >
                          CD
                        </button>
                        <button
                          onClick={() => handleWithdrawCash(user.name || user.email || '', user.id, user.email)}
                          className="w-6 h-6 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700"
                          title="Cash Withdraw"
                        >
                          CW
                        </button>
                        <button className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600 whitespace-nowrap">
                          Log
                        </button>
                        <button
                          onClick={() => handleUserDetails(user.name || user.email || '', user.id, user.email)}
                          className="px-3 py-1.5 bg-[#00A66E] text-white text-xs font-bold rounded hover:bg-[#008a5a] whitespace-nowrap"
                          title="User Details"
                        >
                          User Setting
                        </button>
                        <button
                          onClick={() => handleChangePassword(user.name || user.email || '', user.email)}
                          className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600 whitespace-nowrap"
                          title="Change Password"
                        >
                          Change Password
                        </button>
                        <button className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600 whitespace-nowrap">
                          Game Control
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          name: "Murad", // TODO: Fetch from API based on userId
          exposure: "500000", // TODO: Fetch from API based on userId
          userStatus: "Active", // TODO: Fetch from API
          fancyBetStatus: "Active", // TODO: Fetch from API
          marketBetStatus: "Active", // TODO: Fetch from API
          casinoBetStatus: "Active", // TODO: Fetch from API
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

