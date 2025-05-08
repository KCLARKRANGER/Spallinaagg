"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import type { ScheduleData } from "@/types/schedule"

interface ScheduleHeaderProps {
  data: ScheduleData
}

export function ScheduleHeader({ data }: ScheduleHeaderProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)

  // Extract the most common date from entries
  function extractReportDate(data: ScheduleData): Date {
    // Default to today if we can't determine a date
    const today = new Date()

    if (!data || !data.allEntries || data.allEntries.length === 0) {
      return today
    }

    // First, try to find entries with a properly formatted date
    for (const entry of data.allEntries) {
      if (entry.date && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(entry.date)) {
        try {
          const [month, day, year] = entry.date.split("/").map(Number)
          const parsedDate = new Date(year, month - 1, day)
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate
          }
        } catch (e) {
          // Continue to next entry
        }
      }
    }

    // Try to extract from the Monday.com format
    for (const entry of data.allEntries) {
      if (entry.date) {
        // Try to match Monday.com format: "Friday, May 2nd 2025, 7:00:00 am -04:00"
        const mondayMatch = entry.date.match(/([A-Za-z]+),\s+([A-Za-z]+)\s+(\d+)(?:st|nd|rd|th)?\s+(\d{4})/)
        if (mondayMatch) {
          try {
            const [_, dayOfWeek, month, day, year] = mondayMatch

            // Map month names to month numbers
            const monthMap: Record<string, number> = {
              January: 0,
              February: 1,
              March: 2,
              April: 3,
              May: 4,
              June: 5,
              July: 6,
              August: 7,
              September: 8,
              October: 9,
              November: 10,
              December: 11,
            }

            const monthNum = monthMap[month] || 0
            const parsedDate = new Date(Number(year), monthNum, Number(day))

            if (!isNaN(parsedDate.getTime())) {
              return parsedDate
            }
          } catch (e) {
            console.error("Error parsing Monday.com date:", e)
          }
        }
      }
    }

    // Count occurrences of each date
    const dateCounts: Record<string, number> = {}
    let maxCount = 0
    let mostCommonDateStr = ""

    // Try to find the most common date
    data.allEntries.forEach((entry) => {
      if (entry.date) {
        // Normalize the date format
        let dateStr = entry.date

        // If the date contains time, extract just the date part
        if (dateStr.includes(",")) {
          const parts = dateStr.split(",")
          if (parts.length >= 2) {
            dateStr = parts[1].trim()
          }
        }

        if (!dateCounts[dateStr]) {
          dateCounts[dateStr] = 0
        }
        dateCounts[dateStr]++

        if (dateCounts[dateStr] > maxCount) {
          maxCount = dateCounts[dateStr]
          mostCommonDateStr = dateStr
        }
      }
    })

    // If we found a common date, try to parse it
    if (mostCommonDateStr) {
      try {
        const directParsedDate = new Date(mostCommonDateStr)
        if (!isNaN(directParsedDate.getTime())) {
          return directParsedDate
        }
      } catch (e) {
        // Continue to other methods
      }
    }

    // If we couldn't determine a date, use today
    return today
  }

  useEffect(() => {
    if (data && data.allEntries && data.allEntries.length > 0) {
      const reportDate = extractReportDate(data)
      setDate(reportDate)
    }
  }, [data])

  return (
    <div className="flex flex-col items-center text-center mb-6">
      <h1 className="text-3xl font-bold tracking-tight">Spallina Materials Trucking Schedule</h1>
      <p className="text-xl mt-2">{date ? format(date, "EEEE, MMMM d, yyyy") : "Loading date..."}</p>
    </div>
  )
}
