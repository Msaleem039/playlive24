"use client"

import { useState } from "react"
import { useGetComplaintsQuery } from "@/app/services/Api"
import { RefreshCw, AlertCircle, Phone, MessageSquare, User } from "lucide-react"
import { Button } from "@/components/utils/button"

export default function ComplaintsView() {
  const { data, isLoading, error, refetch } = useGetComplaintsQuery({}, {
    pollingInterval: 30000 // Poll every 30 seconds
  })

  const complaints = data?.data || []
  const count = data?.count || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-[#00A66E]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">Failed to load complaints</p>
        <Button onClick={() => refetch()} className="bg-[#00A66E] hover:bg-[#00C97A] text-white">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">Complaints</h2>
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              {count}
            </span>
          </div>
          <Button
            onClick={() => refetch()}
            className="bg-[#00A66E] hover:bg-[#00C97A] text-white flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No complaints found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint: any) => (
            <div
              key={complaint.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
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
  )
}



