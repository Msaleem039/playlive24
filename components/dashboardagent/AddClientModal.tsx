import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/utils/button'
import { Input } from '@/components/input'
import { useRegisterMutation } from '@/app/services/Api'
import { useDispatch } from 'react-redux'
import { api } from '@/app/services/Api'
import { toast } from 'sonner'

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: ClientData) => void
}

interface ClientData {
  name: string
  email: string
  password: string
  role: string
  balance: string
}

export function AddClientModal({ isOpen, onClose, onSubmit }: AddClientModalProps) {
  const dispatch = useDispatch()
  const [register, { isLoading }] = useRegisterMutation()
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<ClientData>({
    name: '',
    email: '',
    password: '',
    role: 'CLIENT',
    balance: '0'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required")
      return
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }
    if (!formData.password.trim()) {
      setError("Password is required")
      return
    }
    if (!formData.role) {
      setError("Role is required")
      return
    }

    const balanceNum = parseFloat(formData.balance)
    if (isNaN(balanceNum) || balanceNum < 0) {
      setError("Balance must be a valid number")
      return
    }

    try {
      // Prepare payload according to API structure
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        balance: balanceNum
      }

      console.log("Register API call - payload:", payload)
      
      const result = await register(payload).unwrap()
      
      console.log("Register API success:", result)

      // Invalidate user query cache to refresh user list
      dispatch(api.util.invalidateTags(['User']))

      // Show success toast
      toast.success("User Created Successfully", {
        description: `${formData.role} "${formData.name}" has been created successfully`
      })

      // Call the optional onSubmit callback if provided
      if (onSubmit) {
        onSubmit(formData)
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'CLIENT',
        balance: '0'
      })
      setError(null)
      onClose()
    } catch (error: any) {
      console.error("Error creating user:", error)
      const errorMessage = 
        error?.data?.message || 
        error?.data?.error || 
        error?.error?.data?.message ||
        error?.message || 
        "Failed to create user. Please try again."
      
      setError(errorMessage)
      toast.error("Registration Failed", {
        description: errorMessage
      })
    }
  }

  const handleInputChange = (field: keyof ClientData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  const handleClose = () => {
    // Reset form on close
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'CLIENT',
      balance: '0'
    })
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 top-20">
      <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-md mx-4 shadow-2xl border border-white/20">
        {/* Header */}
        <div className="bg-[#00A66E] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-lg font-bold">Add Client</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-[#00A66E] hover:bg-[#00A66E]/80 rounded flex items-center justify-center"
            disabled={isLoading}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Name Field */}
          <div className="mb-4">
            <div className="flex items-center justify-between py-3 border-b border-dashed border-gray-300">
              <label className="text-sm font-medium text-gray-700 w-32">
                Name
              </label>
              <div className="flex-1 ml-4">
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Name"
                  className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <div className="flex items-center justify-between py-3 border-b border-dashed border-gray-300">
              <label className="text-sm font-medium text-gray-700 w-32">
                Email
              </label>
              <div className="flex-1 ml-4">
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Email"
                  className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <div className="flex items-center justify-between py-3 border-b border-dashed border-gray-300">
              <label className="text-sm font-medium text-gray-700 w-32">
                Password
              </label>
              <div className="flex-1 ml-4">
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Password"
                  className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Role Field */}
          <div className="mb-4">
            <div className="flex items-center justify-between py-3 border-b border-dashed border-gray-300">
              <label className="text-sm font-medium text-gray-700 w-32">
                Role
              </label>
              <div className="flex-1 ml-4">
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-[#00A66E] focus:ring-[#00A66E] focus:outline-none"
                  required
                >
                  <option value="CLIENT">Client</option>
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Balance Field */}
          <div className="mb-6">
            <div className="flex items-center justify-between py-3 border-b border-dashed border-gray-300">
              <label className="text-sm font-medium text-gray-700 w-32">
                Balance
              </label>
              <div className="flex-1 ml-4">
                <Input
                  type="number"
                  value={formData.balance}
                  onChange={(e) => handleInputChange('balance', e.target.value)}
                  placeholder="0.00"
                  className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={handleClose}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
