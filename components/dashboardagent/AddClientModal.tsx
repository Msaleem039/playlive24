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
  username: string
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
    username: '',
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
    if (!formData.username.trim()) {
      setError("Username is required")
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
        username: formData.username.trim(),
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
        description: `${formData.role} "${formData.username}" has been created successfully`
      })

      // Call the optional onSubmit callback if provided
      if (onSubmit) {
        onSubmit(formData)
      }

      // Reset form
      setFormData({
        name: '',
        username: '',
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
      username: '',
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
      <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-2xl mx-4 shadow-2xl border border-white/20">
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

          <div className="space-y-4 mb-6">
            {[
              { label: 'Name', type: 'text', field: 'name', placeholder: 'Name' },
              { label: 'Username', type: 'text', field: 'username', placeholder: 'Username' },
              { label: 'Password', type: 'password', field: 'password', placeholder: 'Password' },
            ].map((item) => (
              <div
                key={item.label}
                className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-4 py-3 flex flex-col md:flex-row md:items-center gap-3"
              >
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide md:w-48">
                  {item.label}
                </label>
                <Input
                  type={item.type}
                  value={formData[item.field as keyof ClientData]}
                  onChange={(e) => handleInputChange(item.field as keyof ClientData, e.target.value)}
                  placeholder={item.placeholder}
                  className="flex-1 border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                  required
                />
              </div>
            ))}

            {/* Role Field */}
            <div className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide md:w-48">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:border-[#00A66E] focus:ring-[#00A66E] focus:outline-none"
                required
              >
                <option value="CLIENT">Client</option>
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            {/* Balance Field */}
            <div className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide md:w-48">
                Balance
              </label>
              <Input
                type="number"
                value={formData.balance}
                onChange={(e) => handleInputChange('balance', e.target.value)}
                placeholder="0.00"
                className="flex-1 border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                step="0.01"
                min="0"
                required
              />
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
