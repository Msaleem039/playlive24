import React, { useState, useEffect } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/utils/button'
import { Input } from '@/components/input'
import { useRegisterMutation } from '@/app/services/Api'
import { useDispatch, useSelector } from 'react-redux'
import { api } from '@/app/services/Api'
import { toast } from 'sonner'
import { selectCurrentUser } from '@/app/store/slices/authSlice'

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
  commissionPercentage: string
}

export function AddClientModal({ isOpen, onClose, onSubmit }: AddClientModalProps) {
  const dispatch = useDispatch()
  const authUser = useSelector(selectCurrentUser)
  const currentUserRole = (authUser?.role as string) || 'CLIENT'
  const [register, { isLoading }] = useRegisterMutation()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  // Determine available roles based on current user's role
  const getAvailableRoles = () => {
    if (currentUserRole === 'SUPER_ADMIN') {
      return [{ value: 'ADMIN', label: 'Admin' }]
    } else if (currentUserRole === 'ADMIN') {
      return [{ value: 'AGENT', label: 'Agent' }]
    } else if (currentUserRole === 'AGENT') {
      return [{ value: 'CLIENT', label: 'Client' }]
    }
    return []
  }

  const availableRoles = getAvailableRoles()
  const defaultRole = availableRoles[0]?.value || 'CLIENT'
  
  const [formData, setFormData] = useState<ClientData>({
    name: '',
    username: '',
    password: '',
    role: defaultRole,
    commissionPercentage: '0'
  })

  // Update role when modal opens or available roles change
  useEffect(() => {
    if (isOpen && availableRoles.length > 0) {
      const newDefaultRole = availableRoles[0].value
      setFormData(prev => ({
        ...prev,
        role: newDefaultRole,
        commissionPercentage: prev.commissionPercentage || '0'
      }))
    }
  }, [isOpen, currentUserRole])

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

    const commissionPercentageNum = parseFloat(formData.commissionPercentage)
    if (isNaN(commissionPercentageNum) || commissionPercentageNum < 0 || commissionPercentageNum > 100) {
      setError("Commission percentage must be a valid number between 0 and 100")
      return
    }

    try {
      // Prepare payload according to API structure
      const payload = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        password: formData.password,
        role: formData.role,
        commissionPercentage: commissionPercentageNum
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
        role: defaultRole,
        commissionPercentage: '0'
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
      role: defaultRole,
      commissionPercentage: '0'
    })
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 pt-20">
      <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-md mx-4 shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#00A66E] text-white px-3 py-2 rounded-t-lg flex items-center justify-between">
          <h2 className="text-base font-bold">Add Client</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-[#00A66E] hover:bg-[#00A66E]/80 rounded flex items-center justify-center"
            disabled={isLoading}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3">
          {/* Error Message */}
          {error && (
            <div className="mb-2 bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2 mb-3">
            {/* Name Field */}
            <div className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-2 py-1.5 flex flex-col md:flex-row md:items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide md:w-48">
                Name
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Name"
                className="flex-1 border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                required
              />
            </div>

            {/* Username Field */}
            <div className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-2 py-1.5 flex flex-col md:flex-row md:items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide md:w-48">
                Username
              </label>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Username"
                className="flex-1 border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                required
              />
            </div>

            {/* Password Field with Eye Icon */}
            <div className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-2 py-1.5 flex flex-col md:flex-row md:items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide md:w-48">
                Password
              </label>
              <div className="flex-1 relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Password"
                  className="w-full pr-10 border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Role Field */}
            <div className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-2 py-1.5 flex flex-col md:flex-row md:items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide md:w-48">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:border-[#00A66E] focus:ring-[#00A66E] focus:outline-none"
                required
              >
                {availableRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Commission Percentage Field */}
            <div className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-2 py-1.5 flex flex-col md:flex-row md:items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide md:w-48">
                Share Percentage %
              </label>
              <Input
                type="number"
                value={formData.commissionPercentage}
                onChange={(e) => handleInputChange('commissionPercentage', e.target.value)}
                placeholder="0"
                className="flex-1 border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                step="0.01"
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              onClick={handleClose}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
