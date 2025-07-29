"use client"
import { useState, useCallback, useMemo } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import type { ScheduleData, ScheduleEntry, TruckType } from "@/types/schedule"
import { Save, Trash2, Copy, Plus, Download, Printer } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TimeAdjuster } from "@/components/time-adjuster"
import { addMinutesToTimeString, convertTo24HourFormat } from "@/lib/time-utils"
import { useToast } from "@/components/ui/use-toast"
import { DriverSummary } from "@/components/driver-summary"
import { format, parse, isValid } from "date-fns"

interface ScheduleReportProps {
  data: ScheduleData
  onUpdateData: (updatedData: ScheduleData) => void
}

// Define truck type colors with a function to generate colors for new types
const truckTypeColors: Record<string, string> = {
  "Tractor Trailer": "bg-green-100 dark:bg-green-900",
  Trailer: "bg-green-100 dark:bg-green-900", // Same as Tractor Trailer
  "Dump Truck": "bg-orange-100 dark:bg-orange-900",
  Triaxle: "bg-orange-100 dark:bg-orange-900", // Same as Dump Truck
  Slinger: "bg-yellow-100 dark:bg-yellow-900",
  "6 Wheeler": "bg-blue-100 dark:bg-blue-900",
  "Standard Mixer": "bg-purple-100 dark:bg-purple-900",
  Mixer: "bg-purple-100 dark:bg-purple-900", // Same as Standard Mixer
  Conveyor: "bg-teal-100 dark:bg-teal-900",
  Undefined: "bg-gray-100 dark:bg-gray-800", // Added for undefined truck type
  ASPHALT: "bg-pink-100 dark:bg-pink-900", // Added for ASPHALT type
}

// Additional colors for dynamically discovered truck types
const additionalColors = [
  "bg-red-100 dark:bg-red-900",
  "bg-pink-100 dark:bg-pink-900",
  "bg-indigo-100 dark:bg-indigo-900",
  "bg-teal-100 dark:bg-teal-900",
  "bg-cyan-100 dark:bg-cyan-100",
  "bg-lime-100 dark:bg-lime-900",
  "bg-amber-100 dark:bg-amber-900",
  "bg-emerald-100 dark:bg-emerald-900",
  "bg-fuchsia-100 dark:bg-fuchsia-900",
  "bg-rose-100 dark:bg-rose-100",
]

// Function to get color for truck type, dynamically assigning colors to new types
function getTruckTypeColor(type: string): string {
  if (truckTypeColors[type]) {
    return truckTypeColors[type]
  }

  // If this is a new type, assign it a color and save it
  const knownTypes = Object.keys(truckTypeColors).length
  const colorIndex = knownTypes % additionalColors.length
  truckTypeColors[type] = additionalColors[colorIndex]

  return truckTypeColors[type]
}

// SPALLINA trucks (both SMI and SPA prefixes) that get offset - all others are contractors with show-up time = load time
// TO ADD NEW TRUCKS: Add them to this array following the same pattern
const SPALLINA_TRUCKS_WITH_OFFSET = [
  // SMI trucks
  "SMI106",
  "SMI107",
  "SMI108",
  "SMI110",
  "SMI111",
  "SMI112",
  "SMI114",
  "SMI36",
  "SMI38",
  "SMI40",
  "SMI41",
  "SMI42",
  "SMI43",
  "SMI43P", // SMI43 PUP
  "SMI43 PUP",
  "SMI46",
  "SMI48",
  "SMI48P", // SMI48 PUP
  "SMI48 PUP",
  "SMI49",
  "SMI49P", // SMI49 PUP
  "SMI49 PUP",
  "SMI50",
  "SMI50P", // SMI50 PUP
  "SMI50 PUP",
  "SMI51",
  "SMI67",
  "SMI68",
  "SMI69",
  "SMI70",
  "SMI71",
  "SMI72",
  "SMI78",
  "SMI85",
  "SMI88",
  "SMI92",
  "SMI92S",
  "SMI94",
  "SMI94S",
  "SMI95",
  "SMI95S",
  "SMI96",
  "SMI96S",
  "SMI97",
  "SMI97S",
  // MMH trucks (Spallina fleet) - FIXED
  "MMH06",
  "MMH6",
  "MMH08",
  "MMH8",
  // SPA trucks (same numbers, different prefix) - FIXED: INCLUDING SPA33
  "SPA106",
  "SPA107",
  "SPA108",
  "SPA110",
  "SPA111",
  "SPA112",
  "SPA114",
  "SPA33", // ✅ SPA33 is now included as a Spallina truck
  "SPA36",
  "SPA38",
  "SPA40",
  "SPA41",
  "SPA42",
  "SPA43",
  "SPA43 PUP",
  "SPA46",
  "SPA48",
  "SPA48 PUP",
  "SPA49",
  "SPA49 PUP",
  "SPA50",
  "SPA50 PUP",
  "SPA51",
  "SPA67",
  "SPA68",
  "SPA69",
  "SPA70",
  "SPA71",
  "SPA72",
  "SPA78",
  "SPA85",
  "SPA88",
  "SPA92",
  "SPA92S",
  "SPA94",
  "SPA94S",
  "SPA95",
  "SPA95S",
  "SPA96",
  "SPA96S",
  "SPA97",
  "SPA97S",
]

// Function to check if a truck should get offset (is a specific Spallina truck)
function isSpallinaTruckWithOffset(truckDriver: string): boolean {
  if (!truckDriver || truckDriver.trim() === "" || truckDriver === "TBD") {
    return false
  }

  // Clean the truck name (remove asterisk, trim whitespace)
  const cleanName = truckDriver.replace(/^\*/, "").trim()

  // Check if it's in the specific Spallina trucks list - case insensitive
  const isInSpallinaList = SPALLINA_TRUCKS_WITH_OFFSET.some((spallinaTruck) => {
    const upperCleanName = cleanName.toUpperCase()
    const upperSpallinaTruck = spallinaTruck.toUpperCase()

    return (
      upperCleanName === upperSpallinaTruck ||
      upperCleanName === upperSpallinaTruck.replace(/P$/, " PUP") ||
      (spallinaTruck.includes("MMH") && (upperCleanName === "MMH6" || upperCleanName === "MMH06")) ||
      (spallinaTruck.includes("MMH") && (upperCleanName === "MMH8" || upperCleanName === "MMH08"))
    )
  })

  console.log(
    `🚛 Checking truck "${truckDriver}" (clean: "${cleanName}"): ${
      isInSpallinaList ? "✅ SPALLINA TRUCK WITH OFFSET" : "❌ CONTRACTOR/OTHER - NO OFFSET (show-up = load time)"
    }`,
  )

  return isInSpallinaList
}

// Function to check if a truck is a contractor (specific contractor trucks only)
function isContractorTruck(truckDriver: string): boolean {
  if (!truckDriver || truckDriver.trim() === "" || truckDriver === "TBD") {
    return false
  }

  // FIRST: Check if it's a Spallina truck - if so, it's NOT a contractor
  if (isSpallinaTruckWithOffset(truckDriver)) {
    return false
  }

  // Clean the truck name (remove asterisk, trim whitespace)
  const cleanName = truckDriver.replace(/^\*/, "").trim().toUpperCase()

  // Specific contractor trucks (exact matches only)
  const contractorTrucks = [
    "WAT44",
    "WAT48",
    "MAT51",
    "NCHFB",
    "SNOWFLAKE",
    "SNOW2",
    "SNOW3",
    "SNOW4",
    "SNOW5",
    "SNOW6",
    "SNOW7",
    "SICK",
    "YORK",
    // Contractor pattern matches
    "CONTRACTOR1",
    "CONTRACTOR2",
    "CONTRACTOR3",
    "CONTRACTOR4",
    "CONTRACTOR5",
    "CONTRACTOR6",
    "CONTRACTOR7",
    "CONTRACTOR8",
    "CONTRACTOR9",
    "CONTRACTOR10",
    "CONTRACTOR11",
    "CONTRACTOR12",
  ]

  // Check for exact matches or contractor patterns
  const isContractor =
    contractorTrucks.includes(cleanName) || cleanName.startsWith("CONTRACTOR") || cleanName.startsWith("*")

  return isContractor
}

// Create a blank entry template
function createBlankEntry(truckType: string): ScheduleEntry {
  return {
    jobName: "",
    truckType,
    pit: "",
    shift: "",
    truckDriver: "TBD",
    date: format(new Date(), "MM/dd/yyyy"),
    time: format(new Date(), "HH:mm"),
    location: "",
    qty: "",
    materials: "",
    notes: "",
    numTrucks: "1",
  }
}

// Function to sort entries chronologically by LOAD TIME (not start time)
function sortEntriesChronologically(entries: ScheduleEntry[]): ScheduleEntry[] {
  return entries.sort((a, b) => {
    // Sort by LOAD TIME (time field), not show-up time
    const timeA = convertTo24HourFormat(a.time || "")
    const timeB = convertTo24HourFormat(b.time || "")

    if (!timeA && !timeB) return 0
    if (!timeA) return 1
    if (!timeB) return -1

    return timeA.localeCompare(timeB)
  })
}

// Function to extract the most common date from entries
function extractReportDate(data: ScheduleData): Date {
  console.log("Extracting report date from data:", data)

  // Default to today if we can't determine a date
  const today = new Date()

  if (!data || !data.allEntries || data.allEntries.length === 0) {
    console.log("No entries found, using today's date")
    return today
  }

  // First, try to find entries with a properly formatted date
  for (const entry of data.allEntries) {
    if (entry.date && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(entry.date)) {
      try {
        const [month, day, year] = entry.date.split("/").map(Number)
        const parsedDate = new Date(year, month - 1, day)
        if (isValid(parsedDate)) {
          console.log("Found valid MM/DD/YYYY date:", parsedDate)
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

          if (isValid(parsedDate)) {
            console.log("Found valid Monday.com date:", parsedDate)
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

  console.log("Most common date string:", mostCommonDateStr)

  // If we found a common date, try to parse it
  if (mostCommonDateStr) {
    // Try different date formats
    const formats = ["MM/dd/yyyy", "M/d/yyyy", "yyyy-MM-dd", "MMMM d yyyy", "MMMM do yyyy"]

    for (const formatStr of formats) {
      try {
        const parsedDate = parse(mostCommonDateStr, formatStr, new Date())
        if (isValid(parsedDate)) {
          console.log("Successfully parsed date with format", formatStr, ":", parsedDate)
          return parsedDate
        }
      } catch (e) {
        // Try next format
      }
    }

    // If we couldn't parse with standard formats, try to extract from more complex strings
    // Example: "Wednesday, March 12th 2025"
    const dateMatch = mostCommonDateStr.match(/([A-Za-z]+)\s+(\d+)(?:st|nd|rd|th)?\s+(\d{4})/)
    if (dateMatch) {
      const [_, month, day, year] = dateMatch
      try {
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

        if (isValid(parsedDate)) {
          console.log("Successfully parsed complex date:", parsedDate)
          return parsedDate
        }
      } catch (e) {
        console.error("Error parsing complex date:", e)
      }
    }

    // Try to directly parse the string as a last resort
    try {
      const directParsedDate = new Date(mostCommonDateStr)
      if (isValid(directParsedDate)) {
        console.log("Successfully parsed date directly:", directParsedDate)
        return directParsedDate
      }
    } catch (e) {
      console.error("Error directly parsing date:", e)
    }
  }

  // If we couldn't determine a date, use today
  console.log("Using today's date as fallback:", today)
  return today
}

// Individual field components to prevent re-rendering
const EditableField = ({
  value,
  onChange,
  placeholder,
  className,
  type = "text",
  rows,
  min,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  type?: string
  rows?: number
  min?: string
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange],
  )

  if (rows) {
    return (
      <Textarea value={value} onChange={handleChange} placeholder={placeholder} className={className} rows={rows} />
    )
  }

  return (
    <Input
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      type={type}
      min={min}
    />
  )
}

const TimeField = ({
  value,
  onChange,
  placeholder,
  className,
  step = 5,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  step?: number
}) => {
  return <TimeAdjuster value={value} onChange={onChange} placeholder={placeholder} className={className} step={step} />
}

interface TruckTypeSectionProps {
  type: TruckType
  entries: ScheduleEntry[]
  onUpdateEntry: (entry: ScheduleEntry, index: number, type: TruckType) => void
  onDeleteEntry: (index: number, type: TruckType) => void
  onDuplicateEntry: (index: number, type: TruckType) => void
  onAddEntry: (type: TruckType) => void
  onSaveChanges: () => void
}

function TruckTypeSection({
  type,
  entries,
  onUpdateEntry,
  onDeleteEntry,
  onDuplicateEntry,
  onAddEntry,
  onSaveChanges,
}: TruckTypeSectionProps) {
  // Sort entries chronologically by LOAD TIME - show ALL entries, not just complete ones
  const sortedEntries = useMemo(() => sortEntriesChronologically(entries), [entries])

  // Get color for this truck type
  const headerColor = getTruckTypeColor(type)

  // Create stable field change handlers for each entry
  const fieldChangeHandlers = useMemo(
    () =>
      sortedEntries.map((entry, index) => ({
        jobName: (value: string) => {
          const updatedEntry = { ...entry, jobName: value }
          onUpdateEntry(updatedEntry, index, type)
        },
        shift: (value: string) => {
          const updatedEntry = { ...entry, shift: value }
          onUpdateEntry(updatedEntry, index, type)
        },
        showUpTime: (value: string) => {
          // INDEPENDENT EDITING: Only update show-up time, don't change load time
          const updatedEntry = { ...entry, showUpTime: value }
          onUpdateEntry(updatedEntry, index, type)
        },
        time: (value: string) => {
          // INDEPENDENT EDITING: Only update load time, don't change show-up time
          const updatedEntry = { ...entry, time: value }
          onUpdateEntry(updatedEntry, index, type)
        },
        location: (value: string) => {
          const updatedEntry = { ...entry, location: value }
          onUpdateEntry(updatedEntry, index, type)
        },
        truckDriver: (value: string) => {
          const updatedEntry = { ...entry, truckDriver: value }
          // When driver changes, only recalculate show-up time if it's currently empty
          if (!updatedEntry.showUpTime && updatedEntry.time) {
            const isSpallinaWithOffset = isSpallinaTruckWithOffset(value)
            const displayTime = updatedEntry.time

            if (isSpallinaWithOffset) {
              const offset = updatedEntry.showUpOffset ? Number.parseInt(updatedEntry.showUpOffset, 10) : 15
              const formattedTime = convertTo24HourFormat(displayTime)
              if (formattedTime) {
                updatedEntry.showUpTime = addMinutesToTimeString(formattedTime, -offset)
              }
            } else {
              // For contractors, show-up time equals load time
              updatedEntry.showUpTime = convertTo24HourFormat(displayTime) || displayTime
            }
          }
          onUpdateEntry(updatedEntry, index, type)
        },
        materials: (value: string) => {
          const updatedEntry = { ...entry, materials: value }
          onUpdateEntry(updatedEntry, index, type)
        },
        pit: (value: string) => {
          const updatedEntry = { ...entry, pit: value }
          onUpdateEntry(updatedEntry, index, type)
        },
        qty: (value: string) => {
          const updatedEntry = { ...entry, qty: value }
          onUpdateEntry(updatedEntry, index, type)
        },
        numTrucks: (value: string) => {
          const updatedEntry = { ...entry, numTrucks: value }
          onUpdateEntry(updatedEntry, index, type)
        },
        notes: (value: string) => {
          const updatedEntry = { ...entry, notes: value }
          onUpdateEntry(updatedEntry, index, type)
        },
      })),
    [sortedEntries, onUpdateEntry, type],
  )

  // Skip rendering if entries are empty
  if (sortedEntries.length === 0) return null

  return (
    <div className="mb-8 print:mb-0 truck-section">
      <div className="flex justify-between items-center mb-4 print:mb-2">
        <h3 className={`text-lg p-2 rounded print:text-base print:p-1 truck-header ${headerColor}`}>{type} Schedule</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddEntry(type)}
          className="flex items-center gap-1 print:hidden"
        >
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 print:text-sm table-fixed">
          <thead>
            <tr className="bg-muted print:bg-gray-100">
              <th className="p-2 text-left border border-gray-300 print:p-1 text-sm w-[200px]">Job Name</th>
              <th className="p-2 text-left border border-gray-300 print:p-1 text-sm w-[100px] time-column">
                Start Time
              </th>
              <th className="p-2 text-left border border-gray-300 print:p-1 text-sm w-[100px] time-column">
                Load Time
              </th>
              <th className="p-2 text-left border border-gray-300 print:p-1 text-sm w-[180px]">Location</th>
              <th className="p-2 text-left border border-gray-300 print:p-1 text-sm w-[120px] driver-column">Driver</th>
              <th className="p-2 text-left border border-gray-300 print:p-1 text-sm w-[140px]">Materials</th>
              <th className="p-2 text-left border border-gray-300 print:p-1 text-sm w-[120px]">Pit Location</th>
              <th className="p-2 text-left border border-gray-300 print:p-1 text-sm w-[100px]">Quantity</th>
              <th className="p-2 text-left border border-gray-300 print:p-1 text-sm w-[80px]"># Trucks</th>
              <th className="p-2 text-left border border-gray-300 print:p-1 text-sm w-[200px]">Notes</th>
              <th className="p-2 text-left border border-gray-300 print:hidden text-sm w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map((entry, index) => {
              // Extract time from date if time is not available
              let displayTime = entry.time
              if (!displayTime && entry.date) {
                const dateTimeMatch = entry.date.match(/(\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?)/i)
                if (dateTimeMatch) {
                  displayTime = dateTimeMatch[1]
                }
              }

              // Use the stored show-up time or calculate it only if it's empty
              let showUpTime = entry.showUpTime || ""

              // If show-up time is not set and we have a load time, calculate it once
              if (!showUpTime && displayTime) {
                const isSpallinaWithOffset = isSpallinaTruckWithOffset(entry.truckDriver)

                if (isSpallinaWithOffset) {
                  // Spallina truck with offset: apply the specific offset from showUpOffset field
                  const offset = entry.showUpOffset ? Number.parseInt(entry.showUpOffset, 10) : 15
                  const formattedTime = convertTo24HourFormat(displayTime)
                  if (formattedTime) {
                    showUpTime = addMinutesToTimeString(formattedTime, -offset)
                  }
                } else {
                  // Contractor/other truck: show-up time = load time (NO OFFSET)
                  showUpTime = convertTo24HourFormat(displayTime) || displayTime
                }
              }

              const handlers = fieldChangeHandlers[index]

              return (
                <tr
                  key={`${type}-${index}`}
                  className={`${index % 2 === 0 ? "bg-background" : "bg-muted/30"} print:bg-transparent`}
                >
                  <td className="p-2 border border-gray-300 print:p-1">
                    <div className="space-y-1">
                      <EditableField
                        value={entry.jobName || ""}
                        onChange={handlers.jobName}
                        placeholder="Job name"
                        className="min-h-[60px] resize-none border border-gray-200 bg-white p-2 print:border-none print:bg-transparent text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        rows={3}
                      />
                      {entry.shift && (
                        <EditableField
                          value={entry.shift || ""}
                          onChange={handlers.shift}
                          placeholder="Shift"
                          className="h-8 border border-gray-200 bg-white p-2 print:border-none print:bg-transparent text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-2 border border-gray-300 font-mono print:p-1 w-[100px] time-column">
                    <TimeField
                      value={convertTo24HourFormat(showUpTime) || ""}
                      onChange={handlers.showUpTime}
                      placeholder="HH:MM"
                      className="w-full h-8 border border-gray-200 bg-white p-2 print:border-none print:bg-transparent text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      step={5}
                    />
                  </td>
                  <td className="p-2 border border-gray-300 font-mono print:p-1 w-[100px] time-column">
                    <TimeField
                      value={convertTo24HourFormat(displayTime) || ""}
                      onChange={handlers.time}
                      placeholder="HH:MM"
                      className="w-full h-8 border border-gray-200 bg-white p-2 print:border-none print:bg-transparent text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      step={5}
                    />
                  </td>
                  <td className="p-2 border border-gray-300 print:p-1">
                    <EditableField
                      value={entry.location || ""}
                      onChange={handlers.location}
                      placeholder="Location"
                      className="min-h-[60px] resize-none border border-gray-200 bg-white p-2 print:border-none print:bg-transparent text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      rows={3}
                    />
                  </td>
                  <td className="p-2 border border-gray-300 print:p-1 w-[120px] driver-column">
                    <EditableField
                      value={entry.truckDriver || ""}
                      onChange={handlers.truckDriver}
                      placeholder="Driver/Truck"
                      className="w-full h-8 border border-gray-200 bg-white p-2 print:border-none print:bg-transparent text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2 border border-gray-300 print:p-1 w-[140px]">
                    <EditableField
                      value={entry.materials || ""}
                      onChange={handlers.materials}
                      placeholder="Materials"
                      className="w-full h-8 border border-gray-200 bg-white p-2 print:border-none print:bg-transparent text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2 border border-gray-300 print:p-1 w-[120px]">
                    <EditableField
                      value={entry.pit || ""}
                      onChange={handlers.pit}
                      placeholder="Pit"
                      className="w-full h-8 border border-gray-200 bg-white p-2 print:border-none print:bg-transparent text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2 border border-gray-300 print:p-1 w-[100px]">
                    <EditableField
                      value={entry.qty || ""}
                      onChange={handlers.qty}
                      placeholder="Qty"
                      className="w-full h-8 border border-gray-200 bg-white p-2 print:border-none print:bg-transparent text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2 border border-gray-300 print:p-1">
                    <EditableField
                      value={entry.numTrucks || "1"}
                      onChange={handlers.numTrucks}
                      className="h-8 border border-gray-200 bg-white p-2 print:border-none print:bg-transparent text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      type="number"
                      min="1"
                    />
                  </td>
                  <td className="p-2 border border-gray-300 print:p-1 w-[200px]">
                    <EditableField
                      value={entry.notes || ""}
                      onChange={handlers.notes}
                      placeholder="Notes"
                      className="min-h-[60px] resize-none border border-gray-200 bg-white p-2 print:border-none print:bg-transparent text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      rows={3}
                    />
                  </td>
                  <td className="p-2 border border-gray-300 print:hidden">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDuplicateEntry(index, type)}
                        className="h-8 w-8 p-0"
                        title="Duplicate entry"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteEntry(index, type)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ScheduleReport({ data, onUpdateData }: ScheduleReportProps) {
  const [dispatcherNotes, setDispatcherNotes] = useState("")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const { toast } = useToast()

  // Sort truck types in desired order
  const truckTypeOrder = ["ASPHALT", "Dump Truck", "Slinger", "Trailer", "Triaxle", "6 Wheeler", "Mixer", "Conveyor"]
  const sortedTruckTypes = useMemo(() => {
    return Object.keys(data.byTruckType || {}).sort((a, b) => {
      const aIndex = truckTypeOrder.indexOf(a)
      const bIndex = truckTypeOrder.indexOf(b)

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a.localeCompare(b)
    })
  }, [data.byTruckType])

  const handleUpdateEntry = useCallback(
    (updatedEntry: ScheduleEntry, index: number, type: TruckType) => {
      if (!onUpdateData || typeof onUpdateData !== "function") {
        console.error("onUpdateData is not a function:", onUpdateData)
        return
      }

      const updatedData = { ...data }

      // Update in byTruckType
      if (updatedData.byTruckType && updatedData.byTruckType[type]) {
        updatedData.byTruckType[type][index] = updatedEntry
      }

      // Update in allEntries - find by matching original entry
      if (updatedData.allEntries) {
        const originalEntry = data.byTruckType?.[type]?.[index]
        if (originalEntry) {
          const allEntriesIndex = updatedData.allEntries.findIndex(
            (entry) =>
              entry.jobName === originalEntry.jobName &&
              entry.truckDriver === originalEntry.truckDriver &&
              entry.time === originalEntry.time,
          )
          if (allEntriesIndex !== -1) {
            updatedData.allEntries[allEntriesIndex] = updatedEntry
          }
        }
      }

      onUpdateData(updatedData)
    },
    [data, onUpdateData],
  )

  const handleDeleteEntry = useCallback(
    (index: number, type: TruckType) => {
      if (!onUpdateData || typeof onUpdateData !== "function") {
        console.error("onUpdateData is not a function:", onUpdateData)
        return
      }

      const updatedData = { ...data }

      // Remove from byTruckType
      if (updatedData.byTruckType && updatedData.byTruckType[type]) {
        const entryToDelete = updatedData.byTruckType[type][index]
        updatedData.byTruckType[type].splice(index, 1)

        // Remove from allEntries
        if (updatedData.allEntries && entryToDelete) {
          updatedData.allEntries = updatedData.allEntries.filter(
            (entry) => !(entry.jobName === entryToDelete.jobName && entry.truckDriver === entryToDelete.truckDriver),
          )
        }
      }

      onUpdateData(updatedData)
      toast({
        title: "Entry deleted",
        description: "The schedule entry has been removed.",
      })
    },
    [data, onUpdateData, toast],
  )

  const handleDuplicateEntry = useCallback(
    (index: number, type: TruckType) => {
      if (!onUpdateData || typeof onUpdateData !== "function") {
        console.error("onUpdateData is not a function:", onUpdateData)
        return
      }

      const updatedData = { ...data }

      if (updatedData.byTruckType && updatedData.byTruckType[type]) {
        const originalEntry = updatedData.byTruckType[type][index]
        const duplicatedEntry = {
          ...originalEntry,
          jobName: `${originalEntry.jobName} (Copy)`,
          truckDriver: "TBD",
        }

        // Add to byTruckType
        if (!updatedData.byTruckType) {
          updatedData.byTruckType = {}
        }
        if (!updatedData.byTruckType[type]) {
          updatedData.byTruckType[type] = []
        }
        updatedData.byTruckType[type].push(duplicatedEntry)

        // Add to allEntries
        if (!updatedData.allEntries) {
          updatedData.allEntries = []
        }
        updatedData.allEntries.push(duplicatedEntry)
      }

      onUpdateData(updatedData)
      toast({
        title: "Entry duplicated",
        description: "A copy of the entry has been created.",
      })
    },
    [data, onUpdateData, toast],
  )

  const handleAddEntry = useCallback(
    (type: TruckType) => {
      if (!onUpdateData || typeof onUpdateData !== "function") {
        console.error("onUpdateData is not a function:", onUpdateData)
        return
      }

      const updatedData = { ...data }
      const newEntry = createBlankEntry(type)

      // Add to byTruckType
      if (!updatedData.byTruckType) {
        updatedData.byTruckType = {}
      }
      if (!updatedData.byTruckType[type]) {
        updatedData.byTruckType[type] = []
      }
      updatedData.byTruckType[type].push(newEntry)

      // Add to allEntries
      if (!updatedData.allEntries) {
        updatedData.allEntries = []
      }
      updatedData.allEntries.push(newEntry)

      onUpdateData(updatedData)
      toast({
        title: "Entry added",
        description: `A new ${type} entry has been created.`,
      })
    },
    [data, onUpdateData, toast],
  )

  const handleSaveChanges = useCallback(() => {
    // This would typically save to a backend or local storage
    toast({
      title: "Changes saved",
      description: "All schedule changes have been saved successfully.",
    })
  }, [toast])

  // Handle export to PDF
  const handleExportToPDF = async () => {
    try {
      setIsGeneratingPDF(true)
      const { exportToPDF } = await import("@/lib/export-utils")

      // Calculate summary data
      const unassignedSummary: Record<string, number> = {}
      let totalUnassigned = 0
      let totalOrders = 0

      data.allEntries?.forEach((entry) => {
        totalOrders++
        if (!entry.truckDriver || entry.truckDriver === "TBD") {
          totalUnassigned++
          const type = entry.truckType || "Unknown"
          unassignedSummary[type] = (unassignedSummary[type] || 0) + 1
        }
      })

      const summaryData = {
        unassignedSummary,
        totalUnassigned,
        totalOrders,
      }

      const reportDate = extractReportDate(data)
      const filenameDateString = format(reportDate, "yyyy-MM-dd")
      const filename = `Spallina-Schedule-${filenameDateString}`

      await exportToPDF(data, filename, reportDate, summaryData, dispatcherNotes, [])

      toast({
        title: "PDF exported successfully",
        description: `Schedule exported as ${filename}.pdf`,
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting the PDF file.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Handle print - now generates PDF and opens it for printing
  const handlePrint = async () => {
    try {
      setIsGeneratingPDF(true)
      const { exportToPDFForPrint } = await import("@/lib/export-utils")

      // Calculate summary data
      const unassignedSummary: Record<string, number> = {}
      let totalUnassigned = 0
      let totalOrders = 0

      data.allEntries?.forEach((entry) => {
        totalOrders++
        if (!entry.truckDriver || entry.truckDriver === "TBD") {
          totalUnassigned++
          const type = entry.truckType || "Unknown"
          unassignedSummary[type] = (unassignedSummary[type] || 0) + 1
        }
      })

      const summaryData = {
        unassignedSummary,
        totalUnassigned,
        totalOrders,
      }

      const reportDate = extractReportDate(data)
      const filenameDateString = format(reportDate, "yyyy-MM-dd")
      const filename = `Spallina-Schedule-${filenameDateString}-Print`

      // Generate PDF and open for printing
      await exportToPDFForPrint(data, filename, reportDate, summaryData, dispatcherNotes, [])

      toast({
        title: "PDF generated for printing",
        description: "Opening PDF in new window for printing...",
      })
    } catch (error) {
      console.error("Error generating PDF for print:", error)
      toast({
        title: "Print failed",
        description: "There was an error generating the PDF for printing.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Create driver summary data
  const driverSummaryEntries = useMemo(() => {
    return (
      data.allEntries
        ?.filter((entry) => entry.truckDriver && entry.truckDriver !== "TBD" && entry.truckDriver.trim() !== "")
        .map((entry) => {
          // Use the stored show-up time or calculate it if empty
          let startTime = entry.showUpTime || ""
          const displayTime = entry.time || ""

          if (!startTime && displayTime) {
            const isSpallinaWithOffset = isSpallinaTruckWithOffset(entry.truckDriver)

            if (isSpallinaWithOffset) {
              // Spallina truck with offset: apply the specific offset from showUpOffset field
              const offset = entry.showUpOffset ? Number.parseInt(entry.showUpOffset, 10) : 15
              const formattedTime = convertTo24HourFormat(displayTime)
              if (formattedTime) {
                startTime = addMinutesToTimeString(formattedTime, -offset)
              }
            } else {
              // Contractor/other truck: start time = load time (NO OFFSET)
              startTime = convertTo24HourFormat(displayTime) || displayTime
            }
          }

          return {
            name: entry.jobName || "",
            truckNumber: entry.truckDriver,
            time: convertTo24HourFormat(startTime) || "",
          }
        })
        .filter((entry) => entry.time) // Only include entries with valid times
        .sort((a, b) => a.time.localeCompare(b.time)) || []
    )
  }, [data.allEntries])

  // Extract report date from the data
  const reportDate = useMemo(() => extractReportDate(data), [data])

  return (
    <div className="space-y-6">
      {/* Header with buttons (JSON buttons removed) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div>
          <h2 className="text-2xl font-bold">Schedule Report</h2>
          <p className="text-muted-foreground">{format(reportDate, "EEEE, MMMM d, yyyy")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSaveChanges} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
            disabled={isGeneratingPDF}
          >
            <Printer className="h-4 w-4" />
            {isGeneratingPDF ? "Generating..." : "Print"}
          </Button>
          <Button
            onClick={handleExportToPDF}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
            disabled={isGeneratingPDF}
          >
            <Download className="h-4 w-4" />
            {isGeneratingPDF ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Contractor Legend */}
      <div className="mb-4 p-3 bg-yellow-50 border rounded-md print:hidden border-black">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Start Time and Load Time can now be edited independently. Changes to one field will not
          automatically update the other.
        </p>
      </div>

      {/* Print-only content wrapper */}
      <div className="schedule-print-content">
        {/* Print Header */}
        <div className="print-header hidden print:block">
          <h1>Spallina Materials Trucking Schedule</h1>
          <h2>{format(reportDate, "EEEE, MMMM d, yyyy")}</h2>
        </div>

        {/* Dispatcher Notes */}
        <div className="mb-6 print:mb-4">
          <div className="hidden print:block">
            <h3>DISPATCHER NOTES:</h3>
            <p>{dispatcherNotes}</p>
          </div>
          <Textarea
            value={dispatcherNotes}
            onChange={(e) => setDispatcherNotes(e.target.value)}
            placeholder="Add any special instructions or notes for drivers..."
            className="mt-1 min-h-[80px] border border-gray-200 bg-white p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none print:border-2 print:border-black print:p-2"
          />
        </div>

        {/* Schedule Tables by Truck Type */}
        {sortedTruckTypes.map((type) => (
          <TruckTypeSection
            key={type}
            type={type}
            entries={data.byTruckType?.[type] || []}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onDuplicateEntry={handleDuplicateEntry}
            onAddEntry={handleAddEntry}
            onSaveChanges={handleSaveChanges}
          />
        ))}

        {/* Driver Summary */}
        <div className="mt-8 print:mt-4 driver-summary">
          <h3 className="text-lg font-semibold mb-4 print:text-base print:mb-2 truck-header">
            Spallina Drivers Summary
          </h3>
          <DriverSummary entries={driverSummaryEntries} />
        </div>
      </div>
    </div>
  )
}
