"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { ChevronDown, ChevronUp, Search, Download, FileText, Settings, User, Lock, Gamepad2, Eye, Plus, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { AddClientModal, AllUsersModal } from "@/components/dashboardagent"
import CommonHeader from "@/components/common-header"
import DepositCashModal from "@/components/modal/DepositCashModal"
import WithdrawCashModal from "@/components/modal/WithdrawCashModal"
import UserDetailsModal from "@/components/modal/UserDetailsModal"
import { useGetUserQuery } from "@/app/services/Api"
import { useSelector } from "react-redux"
import { selectCurrentUser } from "@/app/store/slices/authSlice"

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

export default function UserManagement() {
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'ADMIN'
  const [activeTab, setActiveTab] = useState("User List")
  const [userTab, setUserTab] = useState("Active Users")
  const [searchTerm, setSearchTerm] = useState("")
  const [showRows, setShowRows] = useState(25)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  
  // Fetch users from API
  const { data: apiUsers, isLoading, error } = useGetUserQuery(undefined, {})

  // Prevent body scrolling when dashboard is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])
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
    
    // Show all users in both tabs (you can add filtering logic based on user status if available)
    
    return filtered.slice(0, showRows)
  }, [apiUsers, searchTerm, showRows])

  const handleAddUser = () => {
    setIsAddUserModalOpen(true)
  }

  const handleExportExcel = () => {
    // Handle Excel export
    console.log("Export to Excel")
  }

  const handleExportPDF = () => {
    // Handle PDF export
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

  const handleDepositSubmit = async (data: {
    amount: string
    remarks: string
  }) => {
    console.log("Deposit Cash for", depositModal.username, ":", data)
    // TODO: Implement API call here
    // Example:
    // await depositCashAPI({
    //   username: depositModal.username,
    //   amount: data.amount,
    //   remarks: data.remarks,
    // })
  }

  const handleWithdrawSubmit = async (data: {
    amount: string
    remarks: string
  }) => {
    console.log("Withdraw Cash for", withdrawModal.username, ":", data)
    // TODO: Implement API call here
    // Example:
    // await withdrawCashAPI({
    //   username: withdrawModal.username,
    //   amount: data.amount,
    //   remarks: data.remarks,
    // })
  }

  const handleUserDetails = (user: UserData) => {
    const username = extractUsername(user.name, user.email)
    setUserDetailsModal({
      isOpen: true,
      username,
      userId: user.id,
      userData: user,
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
  }

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Header with Navigation - Fixed position */}
      <div className="fixed top-0 left-0 right-0 z-30 flex-shrink-0">
        <CommonHeader activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Spacer to push content below fixed header */}
      <div className="h-[90px] sm:h-[110px] flex-shrink-0" />

      {/* Main Content - Scrollable area */}
      <main ref={mainRef} className="flex-1 relative z-10 p-0 pt-0 overflow-x-hidden overflow-y-auto">

        {/* User Management Section - Only show when User List or User Management tab is active */}
        {(activeTab === "User List" || activeTab === "User Management") && (
          <div className="p-4 sm:p-6">
            {/* Tabs */}
            <div className="bg-gray-800 text-white mb-4">
              <div className="flex">
                <button
                  onClick={() => setUserTab("Active Users")}
                  className={`px-6 py-3 font-semibold border-b-2 ${
                    userTab === "Active Users" 
                      ? "border-white text-white" 
                      : "border-transparent text-gray-300 hover:text-white"
                  }`}
                >
                  Active Users
                </button>
                <button
                  onClick={() => setUserTab("Close Users")}
                  className={`px-6 py-3 font-semibold border-b-2 ${
                    userTab === "Close Users" 
                      ? "border-white text-white" 
                      : "border-transparent text-gray-300 hover:text-white"
                  }`}
                >
                  Close Users
                </button>
              </div>
            </div>

        {/* Action Buttons */}
        <div className="bg-white p-4 mb-4 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleAddUser}
                className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-6 py-2 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </Button>
              <Button className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-6 py-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                All User Sports Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Table Controls */}
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
                    Created At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#00A66E]" />
                        <span className="ml-3 text-gray-600">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="text-center">
                        <p className="text-red-600 mb-2">Error loading users</p>
                        <p className="text-sm text-gray-500">Please try again later</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <p className="text-gray-500">No users found</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user: UserData, index) => (
                    <tr key={user.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-purple-600 rounded text-white text-xs font-bold flex items-center justify-center mr-2">
                            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name || user.email || 'Unknown User'}</div>
                            <div className="text-xs text-gray-500">{user.id?.slice(0, 8) || 'N/A'}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email || 'N/A'}
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
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                        ${formatBalance(user.balance)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.commissionPercentage || 0}%
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }) : 'N/A'}
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
                            onClick={() => handleUserDetails(user)}
                            className="px-3 py-1.5 bg-[#00A66E] text-white text-xs font-bold rounded hover:bg-[#008a5a] whitespace-nowrap"
                          >
                            User Setting
                          </button>
                          <button className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600 whitespace-nowrap">
                            Change Password
                          </button>
                          <button className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600 whitespace-nowrap">
                            Game Control
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <span className="text-sm text-gray-700">
                  Showing 1 to {filteredUsers.length} of {apiUsers?.length || 0} entries
                </span>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers.length}</span> of{' '}
                    <span className="font-medium">{apiUsers?.length || 0}</span> entries
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <ChevronUp className="h-5 w-5" />
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      1
                    </button>
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
          </div>
        )}
      </main>

      {/* Add Client Modal */}
      {isAddUserModalOpen && (
        <AddClientModal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          onSubmit={(data) => {
            console.log('Add client:', data)
            // Handle client creation here
          }}
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
        initialData={userDetailsModal.userData ? {
          name: userDetailsModal.userData.name,
          exposure: userDetailsModal.userData.balance?.toString() || "0",
        } : undefined}
        onSubmit={handleUserDetailsSubmit}
      />
    </div>
  )
}

