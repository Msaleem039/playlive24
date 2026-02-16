'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/input'
import { toast } from 'sonner'

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  username: string
  initialName: string
  initialCommissionPercentage: number
  onSubmit: (data: {
    name: string
    password?: string
    commissionPercentage: number
  }) => Promise<void>
  isLoading?: boolean
}

export default function EditUserModal({
  isOpen,
  onClose,
  userId,
  username,
  initialName,
  initialCommissionPercentage,
  onSubmit,
  isLoading = false
}: EditUserModalProps) {
  const [name, setName] = useState(initialName)
  const [password, setPassword] = useState('')
  const [commissionPercentage, setCommissionPercentage] = useState(initialCommissionPercentage.toString())

  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setPassword('')
      setCommissionPercentage(initialCommissionPercentage.toString())
    }
  }, [isOpen, initialName, initialCommissionPercentage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    const commissionValue = parseFloat(commissionPercentage)
    if (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 100) {
      toast.error('Commission percentage must be between 0 and 100')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        password: password.trim() || undefined,
        commissionPercentage: commissionValue
      })
    } catch (error) {
      // Error is handled in parent component
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#00A66E] text-white px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between rounded-t-lg sticky top-0 z-10">
          <h2 className="text-sm sm:text-base font-semibold">Edit User</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            disabled={isLoading}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              disabled
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              required
              disabled={isLoading}
              className="text-xs sm:text-sm py-1.5 sm:py-2"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
              Password <span className="text-gray-500 text-[10px] sm:text-xs">(optional)</span>
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={isLoading}
              className="text-xs sm:text-sm py-1.5 sm:py-2"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
              Commission % <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={commissionPercentage}
              onChange={(e) => setCommissionPercentage(e.target.value)}
              placeholder="0.00"
              min="0"
              max="100"
              step="0.01"
              required
              disabled={isLoading}
              className="text-xs sm:text-sm py-1.5 sm:py-2"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-[#00A66E] text-white rounded-md hover:bg-[#008a5a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

