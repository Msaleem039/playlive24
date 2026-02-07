"use client"

import { useState, useEffect } from "react"
import { X, Edit3, Save } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { useGetNewsBarQuery, useUpdateNewsBarMutation } from "@/app/services/Api"
import { toast } from "sonner"

interface NewsBarModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewsBarModal({ isOpen, onClose }: NewsBarModalProps) {
  const [text, setText] = useState("")
  const { data, isLoading } = useGetNewsBarQuery({}, { skip: !isOpen })
  const [updateNewsBar, { isLoading: isUpdating }] = useUpdateNewsBarMutation()

  useEffect(() => {
    if (data?.text) {
      setText(data.text)
    }
  }, [data])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!text.trim()) {
      toast.error("News bar text cannot be empty")
      return
    }

    try {
      await updateNewsBar({ text: text.trim() }).unwrap()
      toast.success("News bar updated successfully!")
      onClose()
    } catch (error: any) {
      toast.error(error?.data?.message || error?.data?.error || "Failed to update news bar")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            <h2 className="text-lg font-bold">Update News Bar</h2>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  News Bar Text <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter news bar text"
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This text will be displayed in the marquee on the dashboard header
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white"
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

