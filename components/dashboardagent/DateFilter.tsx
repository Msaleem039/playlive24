import React from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/utils/button'
import { Input } from '@/components/input'

interface DateFilterProps {
  fromDate: string
  toDate: string
  onFromDateChange: (date: string) => void
  onToDateChange: (date: string) => void
  onSubmit: () => void
  onReset: () => void
}

export function DateFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onSubmit,
  onReset
}: DateFilterProps) {
  return (
    <div className="bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">From Date:</label>
          <div className="relative">
            <Input
              type="text"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="w-32 pr-8"
            />
            <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">To Date:</label>
          <div className="relative">
            <Input
              type="text"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="w-32 pr-8"
            />
            <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
