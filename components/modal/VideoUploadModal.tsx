"use client"

import { useState, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, Video, Upload, FileVideo } from "lucide-react"
import { Button } from "@/components/utils/button"
import { toast } from "sonner"
import Cookies from "js-cookie"

interface VideoUploadModalProps {
  isOpen: boolean
  onClose: () => void
  currentVideoUrl?: string
}

export default function VideoUploadModal({
  isOpen,
  onClose,
  currentVideoUrl,
}: VideoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("video/")) {
        setError("Please select a valid video file")
        return
      }
      // Validate file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        setError("File size must be less than 500MB")
        return
      }
      setSelectedFile(file)
      setError(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!selectedFile) {
      setError("Please select a video file")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Upload file directly using fetch
      const token = Cookies.get('token')
      const response = await fetch('http://localhost:3000/site-video/upload', {
        method: 'POST',
        headers: {
          'authorization': token ? `Bearer ${token}` : '',
        },
        // Don't set Content-Type - browser will set it automatically with boundary for FormData
        body: formData,
      })

      if (!response.ok) {
        // Handle specific status codes
        if (response.status === 413) {
          const errorMsg = 'File size is too large. The server has a size limit. Please try a smaller file.'
          setError(errorMsg)
          toast.error("File too large", {
            description: errorMsg,
          })
          setIsUploading(false)
          return
        }

        // Try to get error message from response
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { message: `Server error: ${response.status} ${response.statusText}` }
        }

        const errorMessage = errorData.message || errorData.error || `Upload failed: ${response.status} ${response.statusText}`
        setError(errorMessage)
        toast.error("Video upload failed", {
          description: errorMessage,
        })
        setIsUploading(false)
        return
      }

      // Success
      toast.success("Video uploaded successfully")
      resetState()
      onClose()
      setIsUploading(false)
    } catch (error: any) {
      setIsUploading(false)
      const errorMessage = error?.message || "Failed to upload video. Please try again."
      setError(errorMessage)
      toast.error("Video upload failed", {
        description: errorMessage,
      })
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <div className="bg-[#006C4E] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6 text-white" />
                <div>
                  <p className="text-white text-sm uppercase tracking-wide">Super Admin</p>
                  <h2 className="text-white font-bold text-lg">Upload Site Video</h2>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white">
              {error && (
                <div className="px-6 pt-4">
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                    {error}
                  </div>
                </div>
              )}

              {/* File Upload Section */}
              <div className="px-6 py-4">
                <label className="text-sm font-semibold text-gray-800 mb-2 block flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#00A66E]" />
                  Select Video File
                </label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="video-file-input"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="video-file-input"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">MP4, WebM, MOV (MAX. 500MB)</p>
                    </div>
                  </label>
                  {selectedFile && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileVideo className="w-4 h-4 text-[#00A66E]" />
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {selectedFile.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00A66E] hover:bg-[#008a5a] text-white"
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload Video"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
