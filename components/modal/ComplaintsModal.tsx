"use client"

import { useState } from "react"
import { X, AlertCircle, Phone, MessageSquare, User, RefreshCw } from "lucide-react"
import { Button } from "@/components/utils/button"
import { useGetComplaintsQuery } from "@/app/services/Api"

interface ComplaintsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ComplaintsModal({ isOpen, onClose }: ComplaintsModalProps) {
  const { data, isLoading, error, refetch } = useGetComplaintsQuery({}, {
    skip: !isOpen,
    pollingInterval: 30000
  })

  const complaints = data?.data || []
  const count = data?.count || 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Complaints</h2>
            <span className="bg-white/20 text-xs font-semibold px-2 py-1 rounded-full">
              {count}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/20"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-[#00A66E]" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 mb-4">Failed to load complaints</p>
              <Button onClick={() => refetch()} className="bg-[#00A66E] hover:bg-[#00C97A] text-white">
                Try Again
              </Button>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No complaints found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint: any) => (
                <div
                  key={complaint.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Left Side - User Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="font-semibold text-gray-900">{complaint.name}</span>
                        {complaint.status && (
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              complaint.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : complaint.status === 'RESOLVED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {complaint.status}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{complaint.contactNumber}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                        <p className="text-gray-700 text-sm leading-relaxed">{complaint.message}</p>
                      </div>
                    </div>

                    {/* Right Side - Date */}
                    <div className="text-xs text-gray-500 flex-shrink-0">
                      {complaint.createdAt
                        ? new Date(complaint.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

