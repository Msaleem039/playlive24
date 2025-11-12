import React, { useState } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/utils/button'
import { Input } from '@/components/input'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

interface DateFilterProps {
  fromDate: string
  toDate: string
  onFromDateChange: (date: string) => void
  onToDateChange: (date: string) => void
  onSubmit: () => void
  onReset: () => void
}

const formatDate = (date: Date | undefined) =>
  date?.toLocaleDateString('en-US') ?? ''

export function DateFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onSubmit,
  onReset,
}: DateFilterProps) {
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)

  const handleFromSelect = (day: Date | undefined) => {
    if (!day) return
    onFromDateChange(formatDate(day))
    setFromOpen(false)
  }

  const handleToSelect = (day: Date | undefined) => {
    if (!day) return
    onToDateChange(formatDate(day))
    setToOpen(false)
  }

  return (
    <div className="bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="flex items-center space-x-2 relative">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">From Date:</label>
          <div className="relative">
            <Input
              role="presentation"
              readOnly
              value={fromDate}
              onClick={() => setFromOpen((prev) => !prev)}
              className="w-32 pr-8 cursor-pointer"
            />
            <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            {fromOpen && (
              <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                <DayPicker
                  mode="single"
                  selected={fromDate ? new Date(fromDate) : undefined}
                  onSelect={handleFromSelect}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 relative">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">To Date:</label>
          <div className="relative">
            <Input
              role="presentation"
              readOnly
              value={toDate}
              onClick={() => setToOpen((prev) => !prev)}
              className="w-32 pr-8 cursor-pointer"
            />
            <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            {toOpen && (
              <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                <DayPicker
                  mode="single"
                  selected={toDate ? new Date(toDate) : undefined}
                  onSelect={handleToSelect}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={onSubmit}
            className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-4 sm:px-6 text-sm"
          >
            Submit
          </Button>
          <Button
            onClick={onReset}
            className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 text-sm"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
