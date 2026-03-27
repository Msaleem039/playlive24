"use client"

import { useState } from "react"
import { X, Image as ImageIcon, Upload } from "lucide-react"
import { Button } from "@/components/utils/button"
import { useUploadTabBannerMutation } from "@/app/services/Api"
import { toast } from "sonner"

interface TabBannerModalProps {
  isOpen: boolean
  onClose: () => void
}

const TABS = ["cricket", "soccer", "tennis"] as const

export default function TabBannerModal({ isOpen, onClose }: TabBannerModalProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("cricket")
  const [file, setFile] = useState<File | null>(null)
  const [uploadTabBanner, { isLoading }] = useUploadTabBannerMutation()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error("Please select an image")
      return
    }

    const formData = new FormData()
    formData.append("image", file)

    try {
      await uploadTabBanner({ tab, formData }).unwrap()
      toast.success(`${tab.toUpperCase()} banner uploaded`)
      setFile(null)
      onClose()
    } catch (error: any) {
      toast.error(error?.data?.message || error?.data?.error || "Failed to upload banner")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            <h2 className="text-lg font-bold">Upload Tab Banner</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Tab</label>
            <select
              value={tab}
              onChange={(e) => setTab(e.target.value as (typeof TABS)[number])}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            >
              {TABS.map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Banner Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Field name used: image</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={onClose} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2" disabled={isLoading}>
              {isLoading ? (
                <span>Uploading...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

