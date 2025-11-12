"use client"

import { forwardRef, useState } from "react"
import DatePicker, {
  ReactDatePickerProps,
  registerLocale,
} from "react-datepicker"
import enGB from "date-fns/locale/en-GB"
import "react-datepicker/dist/react-datepicker.css"

registerLocale("en-GB", enGB)

type PickerProps = Omit<ReactDatePickerProps, "selected" | "onChange"> & {
  value?: Date | null
  onValueChange?: (date: Date | null) => void
}

export const CalendarDatePicker = forwardRef<HTMLDivElement, PickerProps>(
  ({ value, onValueChange, className = "", locale = "en-GB", ...rest }, ref) => {
    const [internalDate, setInternalDate] = useState<Date | null>(value ?? null)

    const handleChange = (date: Date | null) => {
      setInternalDate(date)
      onValueChange?.(date)
    }

    return (
      <div ref={ref} className={className}>
        <DatePicker
          selected={value ?? internalDate ?? new Date()}
          onChange={handleChange}
          locale={locale}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A66E]"
          calendarClassName="rounded-lg border border-gray-200 shadow-lg"
          dayClassName={() => "react-datepicker__day"}
          {...rest}
        />
      </div>
    )
  },
)

CalendarDatePicker.displayName = "CalendarDatePicker"
