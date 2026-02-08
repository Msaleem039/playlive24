"use client"

import { useState } from "react"
import { X, Send, AlertCircle } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { useSubmitComplaintMutation } from "@/app/services/Api"
import { toast } from "sonner"

interface ComplaintModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ComplaintModal({ isOpen, onClose }: ComplaintModalProps) {
  const [name, setName] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [message, setMessage] = useState("")
  const [submitComplaint, { isLoading }] = useSubmitComplaintMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !contactNumber.trim() || !message.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      await submitComplaint({
        name: name.trim(),
        contactNumber: contactNumber.trim(),
        message: message.trim()
      }).unwrap()
      
      toast.success("Complaint submitted successfully!")
      // Reset form
      setName("")
      setContactNumber("")
      setMessage("")
      onClose()
    } catch (error: any) {
      toast.error(error?.data?.message || error?.data?.error || "Failed to submit complaint")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Submit Complaint</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border-gray-300 focus:border-red-500 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Enter your contact number"
              className="w-full border-gray-300 focus:border-red-500 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your complaint..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


