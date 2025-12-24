"use client"

import { useState, useMemo } from "react"
import { Settings, Eye, EyeOff, RefreshCw, Search } from "lucide-react"
import { useGetAdminMatchesQuery, useToggleMatchVisibilityMutation } from "@/app/services/Api"
import { toast } from "sonner"
import { Input } from "@/components/input"
import { Button } from "@/components/utils/button"

export default function GameControlsView() {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: matchesData, isLoading, refetch } = useGetAdminMatchesQuery({})
  const [toggleVisibility, { isLoading: isToggling }] = useToggleMatchVisibilityMutation()

  const matches = useMemo(() => {
    return matchesData?.data || matchesData || []
  }, [matchesData])

  const filteredMatches = useMemo(() => {
    if (!searchTerm.trim()) return matches
    
    const searchLower = searchTerm.toLowerCase()
    return matches.filter((match: any) => {
      const matchName = (match.name || match.matchTitle || match.title || "").toLowerCase()
      const eventId = String(match.eventId || match.event_id || "").toLowerCase()
      
      return (
        matchName.includes(searchLower) ||
        eventId.includes(searchLower)
      )
    })
  }, [matches, searchTerm])

  const handleToggleVisibility = async (eventId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    try {
      await toggleVisibility({ eventId, isEnabled: newStatus }).unwrap()
      toast.success(`Match ${newStatus ? 'enabled' : 'disabled'} successfully`)
      // Refetch to get updated data from server
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.error || error?.data?.message || "Failed to toggle match visibility")
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#00A66E]" />
                <h2 className="text-lg font-semibold text-gray-900">Match Visibility Controls</h2>
              </div>
              <Button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center gap-2 bg-[#00A66E] hover:bg-[#00b97b] text-white px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="p-4">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search matches by name or event ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-10 h-10 animate-spin text-[#00A66E]" />
              </div>
            ) : filteredMatches.length > 0 ? (
              <div className="space-y-4">
                {filteredMatches.map((match: any) => {
                  const eventId = match.eventId || match.event_id || ""
                  const matchName = match.name || match.matchTitle || match.title || "N/A"
                  const isEnabled = match.isEnabled === true
                  
                  return (
                    <div
                      key={eventId || match.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-2 truncate">
                          {matchName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                          {eventId && (
                            <span className="font-mono">Event ID: <strong>{eventId}</strong></span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            isEnabled
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {isEnabled ? "VISIBLE" : "HIDDEN"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleToggleVisibility(eventId, isEnabled)}
                          disabled={isToggling || !eventId}
                          className={`p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            isEnabled
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-green-500 hover:bg-green-600 text-white"
                          }`}
                          title={isEnabled ? "Disable match" : "Enable match"}
                        >
                          {isEnabled ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium text-lg">
                  {searchTerm ? "No matches found" : "No matches available"}
                </p>
                {searchTerm && (
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your search</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
