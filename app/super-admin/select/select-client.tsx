'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'
import { 
  Shield, 
  LayoutDashboard, 
  ArrowRight,
  Settings,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

export default function SuperAdminSelectClient() {
  const router = useRouter()
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  useEffect(() => {
    // Client-side role check as backup
    if (!authUser) {
      router.push('/login')
      return
    }

    if (!isSuperAdmin) {
      router.push('/dashboard')
      return
    }
  }, [authUser, isSuperAdmin, router])

  if (!authUser || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A66E] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#00A66E] text-white px-4 py-3">
        <h1 className="text-lg font-bold">Super Admin - Select Dashboard</h1>
      </div>

      {/* Purple Bar */}
      {/* <div className="bg-purple-600 h-2"></div> */}

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00A66E] rounded-lg mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, Super Admin</h2>
            <p className="text-gray-600">Choose where you want to go</p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Admin Panel Option */}
            <Link
              href="/adminpanel/settlement-admin"
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="bg-black text-white px-4 py-2">
                <h3 className="font-semibold text-sm">SETTLEMENT ADMIN PANEL</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-[#00A66E] rounded-lg">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Settlement Admin Panel</h3>
                    <p className="text-sm text-gray-600">
                      Manage pending settlements, view bet details, and manually settle matches.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-sm text-[#00A66E] font-semibold">Go to Admin Panel</span>
                  <ArrowRight className="w-4 h-4 text-[#00A66E]" />
                </div>
              </div>
            </Link>

            {/* Dashboard Option */}
            <Link
              href="/super-admin"
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="bg-black text-white px-4 py-2">
                <h3 className="font-semibold text-sm">SUPER ADMIN DASHBOARD</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <LayoutDashboard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Super Admin Dashboard</h3>
                    <p className="text-sm text-gray-600">
                      Access the full dashboard with user management, matches, reports, and all administrative features.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-sm text-blue-600 font-semibold">Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-[#AEDBFB]rounded-lg mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">User Management</p>
                <p className="text-sm font-semibold text-gray-900">Full Control</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mb-2">
                  <Settings className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Settlement Control</p>
                <p className="text-sm font-semibold text-gray-900">Admin Panel</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mb-2">
                  <LayoutDashboard className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Complete Dashboard</p>
                <p className="text-sm font-semibold text-gray-900">All Features</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

