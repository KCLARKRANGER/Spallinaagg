"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ScheduleData, ScheduleEntry, TruckType } from "@/types/schedule"
import { exportToPDF } from "@/lib/export-utils"
import { Printer, Edit, Save, X, FileIcon as FilePdf, Trash2, Copy, Plus, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { format, parse, isValid } from "date-fns"
import { TruckDisplay } from "@/components/truck-display"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TruckSelector } from "@/components/truck-selector"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getDriverForTruck } from "@/lib/driver-data"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
// Add the import for the DriverTimeEditor component at the top of the file
import { DriverTimeEditor } from "@/components/driver-time-editor"

interface ScheduleReportProps {
  data: ScheduleData
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

// Update print colors function to handle dynamic truck types
function getPrintTruckTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    "Tractor Trailer": "#d1fae5", // green-100
    Trailer: "#d1fae5", // Same as Tractor Trailer
    "Dump Truck": "#ffedd5", // orange-100
    Triaxle: "#ffedd5", // Same as Dump Truck
    Slinger: "#fef9c3", // yellow-100
    "6 Wheeler": "#dbeafe", // blue-100
    "Standard Mixer": "#f3e8ff", // purple-100
    Mixer: "#f3e8ff", // Same as Standard Mixer
    Conveyor: "#ccfbf1", // teal-100
    Undefined: "#f3f4f6", // gray-100
  }

  // Additional print colors for dynamic truck types
  const additionalPrintColors = [
    "#fee2e2", // red-100
    "#fce7f3", // pink-100
    "#e0e7ff", // indigo-100",
    "#ccfbf1", // teal-100
    "#cffafe", // cyan-100
    "#ecfccb", // lime-100
    "#fef3c7", // amber-100
    "#d1fae5", // emerald-100
    "#f5d0fe", // fuchsia-100
    "#ffe4e6", // rose-100
  ]

  if (colorMap[type]) {
    return colorMap[type]
  }

  // If this is a new type, assign it a print color
  const knownTypes = Object.keys(colorMap).length
  const colorIndex = knownTypes % additionalPrintColors.length
  colorMap[type] = additionalPrintColors[colorIndex]

  return colorMap[type]
}

// Helper function to calculate start time based on load time and offset in minutes
function calculateStartTime(loadTime: string, offsetMinutes = 15): string {
  if (!loadTime) return "N/A"

  try {
    // Handle different time formats
    let hours = 0
    let minutes = 0

    // Military time format (e.g., "0900")
    if (/^\d{3,4}$/.test(loadTime)) {
      const timeStr = loadTime.padStart(4, "0")
      hours = Number.parseInt(timeStr.substring(0, 2), 10)
      minutes = Number.parseInt(timeStr.substring(2, 4), 10)
    }
    // Standard time format (e.g., "9:00 AM")
    else if (/^\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?$/i.test(loadTime)) {
      const timeParts = loadTime.split(":")
      hours = Number.parseInt(timeParts[0], 10)
      minutes = Number.parseInt(timeParts[1].replace(/[^\d]/g, ""), 10)

      // Handle AM/PM
      if (/PM/i.test(loadTime) && hours < 12) {
        hours += 12
      } else if (/AM/i.test(loadTime) && hours === 12) {
        hours = 0
      }
    } else {
      return "N/A"
    }

    // Subtract the offset minutes
    minutes -= offsetMinutes
    while (minutes < 0) {
      minutes += 60
      hours -= 1
    }
    if (hours < 0) {
      hours += 24
    }

    // Format the start time in 24-hour format
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  } catch (e) {
    console.error("Error calculating start time:", e)
    return "N/A"
  }
}

// Helper function to calculate load time based on start time and offset in minutes
function calculateLoadTime(startTime: string, offsetMinutes = 15): string {
  if (!startTime) return "N/A"

  try {
    // Parse the start time
    const [hoursStr, minutesStr] = startTime.split(":")
    let hours = Number.parseInt(hoursStr, 10)
    let minutes = Number.parseInt(minutesStr, 10)

    // Add the offset minutes
    minutes += offsetMinutes
    while (minutes >= 60) {
      minutes -= 60
      hours += 1
    }
    hours = hours % 24

    // Format the load time in 24-hour format
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  } catch (e) {
    console.error("Error calculating load time:", e)
    return "N/A"
  }
}

// Add a function to convert time to 24-hour format
function convertTo24HourFormat(timeStr: string): string {
  if (!timeStr || timeStr === "N/A") return timeStr

  try {
    // Already in 24-hour format like "14:30"
    if (/^\d{1,2}:\d{2}$/.test(timeStr) && !timeStr.includes("AM") && !timeStr.includes("PM")) {
      const [hours, minutes] = timeStr.split(":").map((part) => Number.parseInt(part, 10))
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }

    // Military time format (e.g., "0900")
    if (/^\d{3,4}$/.test(timeStr)) {
      const paddedTime = timeStr.padStart(4, "0")
      const hours = Number.parseInt(paddedTime.substring(0, 2), 10)
      const minutes = Number.parseInt(paddedTime.substring(2, 4), 10)
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }

    // Standard time format with AM/PM (e.g., "9:00 AM")
    if (/^\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?$/i.test(timeStr)) {
      const timeParts = timeStr.split(":")
      let hours = Number.parseInt(timeParts[0], 10)
      const minutesPart = timeParts[1].replace(/[^\d]/g, "")
      const minutes = Number.parseInt(minutesPart, 10)

      // Handle AM/PM
      if (/PM/i.test(timeStr) && hours < 12) {
        hours += 12
      } else if (/AM/i.test(timeStr) && hours === 12) {
        hours = 0
      }

      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }

    return timeStr
  } catch (e) {
    console.error("Error converting time format:", e)
    return timeStr
  }
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

// Function to check if an entry is complete (has all required fields)
function isEntryComplete(entry: ScheduleEntry): boolean {
  return !!(entry.jobName?.trim() && entry.location?.trim() && entry.qty?.trim() && entry.materials?.trim())
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

  // First, try to find entries with a Due Date field
  for (const entry of data.allEntries) {
    if (entry.date && entry.date.includes("Due Date:")) {
      try {
        const dateMatch = entry.date.match(/Due Date:\s*(.+)/)
        if (dateMatch && dateMatch[1]) {
          const parsedDate = new Date(dateMatch[1])
          if (isValid(parsedDate)) {
            console.log("Found valid Due Date:", parsedDate)
            return parsedDate
          }
        }
      } catch (e) {
        // Continue to next entry
      }
    }
  }

  // Try to extract from the Monday.com format
  for (const entry of data.allEntries) {
    if (entry.date) {
      // Try to match Monday.com format: "Monday, March 24th 2025, 7:00:00 am -04:00"
      const mondayMatch = entry.date.match(/([A-Za-z]+),\s+([A-Za-z]+)\s+(\d+)(?:st|nd|rd|th)?\s+(\d{4})/)
      if (mondayMatch) {
        try {
          const [_, dayOfWeek, month, day, year] = mondayMatch
          const dateStr = `${month} ${day}, ${year}`
          const parsedDate = new Date(dateStr)
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
        const dateStr = `${month} ${day} ${year}`
        const parsedDate = new Date(dateStr)
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

interface TruckTypeSectionProps {
  type: TruckType
  entries: ScheduleEntry[]
  editMode: boolean
  editingEntry: { index: number; type: TruckType } | null
  onStartEditing: (index: number, type: TruckType) => void
  onCancelEditing: () => void
  onUpdateEntry: (entry: ScheduleEntry, index: number, type: TruckType) => void
  onDeleteEntry: (index: number, type: TruckType) => void
  onDuplicateEntry: (index: number, type: TruckType) => void
  onAddEntry: (type: TruckType) => void
}

function TruckTypeSection({
  type,
  entries,
  editMode,
  editingEntry,
  onStartEditing,
  onCancelEditing,
  onUpdateEntry,
  onDeleteEntry,
  onDuplicateEntry,
  onAddEntry,
}: TruckTypeSectionProps) {
  // Filter out incomplete entries
  const completeEntries = entries.filter(isEntryComplete)

  // Skip rendering if entries are empty
  if (completeEntries.length === 0) return null

  // Get color for this truck type
  const headerColor = getTruckTypeColor(type)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xl font-bold p-2 rounded ${headerColor}`}>{type}</h3>
        {editMode && (
          <Button variant="outline" size="sm" onClick={() => onAddEntry(type)} className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left border">Task Name</th>
              <th className="p-2 text-left border">Show-up Time</th>
              <th className="p-2 text-left border">Load Time</th>
              <th className="p-2 text-left border">Location</th>
              <th className="p-2 text-left border">Driver</th>
              <th className="p-2 text-left border">Materials</th>
              <th className="p-2 text-left border">Pit Location</th>
              <th className="p-2 text-left border">Quantity</th>
              <th className="p-2 text-left border"># Trucks</th>
              <th className="p-2 text-left border w-[20%]">Notes</th>
              {editMode && <th className="p-2 text-left border">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {completeEntries.map((entry, index) => {
              const isEditing = editingEntry?.index === index && editingEntry?.type === type

              // Extract time from date if time is not available
              let displayTime = entry.time
              if (!displayTime && entry.date) {
                const dateTimeMatch = entry.date.match(/(\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?)/i)
                if (dateTimeMatch) {
                  displayTime = dateTimeMatch[1]
                }
              }

              // Calculate show-up time if not available
              let showUpTime = entry.showUpTime || ""

              // If show-up time is still not available but we have a load time, calculate it
              if (!showUpTime && displayTime) {
                const offset = Number(entry.showUpOffset || "15")
                showUpTime = addMinutesToTimeString(convertTo24HourFormat(displayTime), -offset)
              }

              // If still no show-up time, display N/A
              if (!showUpTime) showUpTime = "N/A"

              if (isEditing) {
                return (
                  <EditableRow
                    key={`${entry.jobName}-${entry.truckDriver}-${index}-edit`}
                    entry={{ ...entry, time: displayTime || entry.time, showUpTime }}
                    index={index}
                    type={type}
                    onCancel={onCancelEditing}
                    onSave={onUpdateEntry}
                  />
                )
              }

              return (
                <tr
                  key={`${entry.jobName}-${entry.truckDriver}-${index}`}
                  className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                >
                  <td className="p-2 border">
                    <div className="flex items-center">
                      <span>{entry.jobName}</span>
                      {entry.shift && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {entry.shift}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-2 border">{convertTo24HourFormat(showUpTime)}</td>
                  <td className="p-2 border">{convertTo24HourFormat(displayTime)}</td>
                  <td className="p-2 border">{entry.location}</td>
                  <td className="p-2 border">
                    {entry.truckDriver === "SMI-FIRST RETURNING TRUCK" ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-amber-600">FIRST RETURNING TRUCK</span>
                        <span className="text-xs text-amber-700">Any available truck</span>
                      </div>
                    ) : /^(SMI)?\d+[Ps]?$/i.test(entry.truckDriver) ? (
                      <TruckDisplay truckNumber={entry.truckDriver} showType={true} />
                    ) : (
                      <span className="font-medium">{entry.truckDriver}</span>
                    )}
                  </td>
                  <td className="p-2 border">{entry.materials}</td>
                  <td className="p-2 border">{entry.pit}</td>
                  <td className="p-2 border">{entry.qty}</td>
                  <td className="p-2 border">{entry.numTrucks || "1"}</td>
                  <td className="p-2 border">
                    <div className="whitespace-pre-wrap break-words max-w-full">{entry.notes}</div>
                  </td>
                  {editMode && (
                    <td className="p-2 border">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onStartEditing(index, type)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDuplicateEntry(index, type)}
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteEntry(index, type)}
                          title="Delete"
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface EditableRowProps {
  entry: ScheduleEntry
  index: number
  type: TruckType
  onCancel: () => void
  onSave: (entry: ScheduleEntry, index: number, type: TruckType) => void
}

// Define time offset options
const TIME_OFFSET_OPTIONS = [
  { value: "10", label: "10 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "20", label: "20 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
]

function EditableRow({ entry, index, type, onCancel, onSave }: EditableRowProps) {
  const [editedEntry, setEditedEntry] = useState<ScheduleEntry>({ ...entry })
  const [showUpOffset, setShowUpOffset] = useState<string>(entry.showUpOffset || "15") // Default to 15 minutes if not specified

  const handleChange = (field: keyof ScheduleEntry, value: string) => {
    setEditedEntry((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle show-up time change - updates load time based on offset
  const handleShowUpTimeChange = (value: string) => {
    handleChange("showUpTime", value)

    // If show-up time changes, update load time based on the offset
    if (value && /^\d{1,2}:\d{2}$/.test(value)) {
      const offsetMinutes = Number.parseInt(showUpOffset, 10)
      const newLoadTime = addMinutesToTimeString(value, offsetMinutes)
      handleChange("time", newLoadTime)
    }
  }

  // Handle load time change - updates show-up time based on offset
  const handleLoadTimeChange = (value: string) => {
    handleChange("time", value)

    // If load time changes, update show-up time based on the offset
    if (value && /^\d{1,2}:\d{2}$/.test(value)) {
      const offsetMinutes = Number.parseInt(showUpOffset, 10)
      const newShowUpTime = addMinutesToTimeString(value, -offsetMinutes)
      handleChange("showUpTime", newShowUpTime)
    }
  }

  // Handle offset change - recalculates show-up time based on load time
  const handleOffsetChange = (value: string) => {
    setShowUpOffset(value)
    handleChange("showUpOffset", value)

    // Update show-up time based on the new offset
    if (editedEntry.time && /^\d{1,2}:\d{2}$/.test(editedEntry.time)) {
      const offsetMinutes = Number.parseInt(value, 10)
      const newShowUpTime = addMinutesToTimeString(editedEntry.time, -offsetMinutes)
      handleChange("showUpTime", newShowUpTime)
    }
  }

  return (
    <tr className="bg-primary/5">
      <td className="p-2 border">
        <div className="space-y-2">
          <Input
            value={editedEntry.jobName}
            onChange={(e) => handleChange("jobName", e.target.value)}
            className="h-8"
            placeholder="Job name"
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="shift" className="text-xs whitespace-nowrap">
              Shift:
            </Label>
            <Select value={editedEntry.shift || ""} onValueChange={(value) => handleChange("shift", value)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st">1st</SelectItem>
                <SelectItem value="2nd">2nd</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Any">Any</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </td>
      <td className="p-2 border">
        <div className="space-y-2">
          <Input
            value={editedEntry.showUpTime || ""}
            onChange={(e) => handleShowUpTimeChange(e.target.value)}
            className="h-8"
            placeholder="HH:MM"
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="showUpOffset" className="text-xs whitespace-nowrap">
              Offset:
            </Label>
            <Select value={showUpOffset} onValueChange={handleOffsetChange}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Minutes before" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OFFSET_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </td>
      <td className="p-2 border">
        <Input
          value={editedEntry.time}
          onChange={(e) => handleLoadTimeChange(e.target.value)}
          className="h-8"
          placeholder="HH:MM"
        />
      </td>
      <td className="p-2 border">
        <Input
          value={editedEntry.location}
          onChange={(e) => handleChange("location", e.target.value)}
          className="h-8"
        />
      </td>
      <td className="p-2 border">
        <div className="space-y-2">
          <Input
            value={editedEntry.truckDriver}
            onChange={(e) => handleChange("truckDriver", e.target.value)}
            className="h-8"
            placeholder="Enter truck # or driver name"
          />

          <TruckSelector truckType={type} onSelectTruck={(truckId) => handleChange("truckDriver", truckId)} />
        </div>
      </td>
      <td className="p-2 border">
        <Input
          value={editedEntry.materials}
          onChange={(e) => handleChange("materials", e.target.value)}
          className="h-8"
        />
      </td>
      <td className="p-2 border">
        <Input value={editedEntry.pit} onChange={(e) => handleChange("pit", e.target.value)} className="h-8" />
      </td>
      <td className="p-2 border">
        <Input value={editedEntry.qty} onChange={(e) => handleChange("qty", e.target.value)} className="h-8" />
      </td>
      <td className="p-2 border">
        <Input
          value={editedEntry.numTrucks || "1"}
          onChange={(e) => handleChange("numTrucks", e.target.value)}
          className="h-8"
        />
      </td>
      <td className="p-2 border">
        <Textarea
          value={editedEntry.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          className="min-h-[60px] text-sm"
          placeholder="Enter notes"
        />
      </td>
      <td className="p-2 border">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onSave(editedEntry, index, type)}>
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

// Helper function to add minutes to a time string in HH:MM format
function addMinutesToTimeString(time: string, minutesToAdd: number): string {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time)) {
    return time // Return original if invalid format
  }

  try {
    const [hoursStr, minutesStr] = time.split(":")
    let hours = Number.parseInt(hoursStr, 10)
    let minutes = Number.parseInt(minutesStr, 10)

    minutes += minutesToAdd

    while (minutes >= 60) {
      minutes -= 60
      hours += 1
    }

    while (minutes < 0) {
      minutes += 60
      hours -= 1
    }

    hours = (hours + 24) % 24 // Keep within 0-23 range

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  } catch (e) {
    console.error("Error adding minutes to time:", e)
    return time // Return original on error
  }
}

export function ScheduleReport({ data: initialData }: ScheduleReportProps) {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [data, setData] = useState<ScheduleData>(initialData)
  const [editMode, setEditMode] = useState(false)
  const [editingEntry, setEditingEntry] = useState<{ index: number; type: TruckType } | null>(null)
  const [dispatcherNotes, setDispatcherNotes] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [driverSummary, setDriverSummary] = useState<Array<{ name: string; truckNumber: string; time: string }>>([])

  const { toast } = useToast()
  const router = useRouter()

  // Extract the report date from the data
  const reportDate = useMemo(() => {
    const extractedDate = extractReportDate(data)
    console.log("Extracted report date:", extractedDate)
    return extractedDate
  }, [data])

  // Update data when initialData changes (new file upload)
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Sort entries chronologically and trucks alphanumerically
  // Sort entries by shift priority and then chronologically
  const sortedData = useMemo(() => {
    const newData = { ...data }

    // Helper function to extract time
    const getTimeValue = (entry: ScheduleEntry): number => {
      // Try to parse time from time field
      if (entry.time) {
        // Handle various time formats
        if (/^\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?$/i.test(entry.time)) {
          // Standard time format like "9:00 AM" or "14:30"
          const timeParts = entry.time.split(":")
          let hours = Number.parseInt(timeParts[0], 10)
          const minutes = Number.parseInt(timeParts[1].replace(/[^\d]/g, ""), 10)

          // Check for AM/PM
          if (/PM/i.test(entry.time) && hours < 12) {
            hours += 12
          } else if (/AM/i.test(entry.time) && hours === 12) {
            hours = 0
          }

          return hours * 60 + minutes
        } else if (/^\d{3,4}$/.test(entry.time)) {
          // Military time like "0900" or "1430"
          const timeStr = entry.time.padStart(4, "0")
          const hours = Number.parseInt(timeStr.substring(0, 2), 10)
          const minutes = Number.parseInt(timeStr.substring(2, 4), 10)
          return hours * 60 + minutes
        }
      }

      // Try to extract time from date field if time field is empty or invalid
      if (entry.date) {
        // Check for date formats that might include time
        const dateTimeMatch = entry.date.match(/(\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?)/i)
        if (dateTimeMatch) {
          const timeStr = dateTimeMatch[1]
          const timeParts = timeStr.split(":")
          let hours = Number.parseInt(timeParts[0], 10)
          const minutes = Number.parseInt(timeParts[1].replace(/[^\d]/g, ""), 10)

          // Check for AM/PM
          if (/PM/i.test(timeStr) && hours < 12) {
            hours += 12
          } else if (/AM/i.test(entry.time) && hours === 12) {
            hours = 0
          }

          return hours * 60 + minutes
        }
      }

      // Default to midnight if no time can be extracted
      return 0
    }

    // Helper function to get shift priority (for sorting)
    const getShiftPriority = (shift: string): number => {
      const lowerShift = (shift || "").toLowerCase()
      if (lowerShift.includes("1st") || lowerShift === "1" || lowerShift === "first") {
        return 1
      } else if (lowerShift.includes("2nd") || lowerShift === "2" || lowerShift === "second") {
        return 2
      } else if (lowerShift.includes("sched")) {
        return 3
      } else if (lowerShift.includes("any")) {
        return 4
      }
      // Default priority for unknown shifts
      return 5
    }

    // Sort each truck type group
    Object.keys(newData.byTruckType).forEach((type) => {
      // First sort by shift priority, then by time, then by job name
      newData.byTruckType[type].sort((a, b) => {
        // First sort by shift priority
        const shiftPriorityA = getShiftPriority(a.shift)
        const shiftPriorityB = getShiftPriority(b.shift)

        if (shiftPriorityA !== shiftPriorityB) {
          return shiftPriorityA - shiftPriorityB
        }

        // If shifts are the same, sort by time
        const timeA = getTimeValue(a)
        const timeB = getTimeValue(b)

        if (timeA !== timeB) {
          return timeA - timeB
        }

        // If times are equal, sort by job name
        return a.jobName.localeCompare(b.jobName)
      })

      // Then sort trucks within the same job and shift alphanumerically
      const jobShiftGroups: Record<string, ScheduleEntry[]> = {}

      // Group by job name and shift
      newData.byTruckType[type].forEach((entry) => {
        const key = `${entry.jobName}|${entry.shift}|${entry.time}`
        if (!jobShiftGroups[key]) {
          jobShiftGroups[key] = []
        }
        jobShiftGroups[key].push(entry)
      })

      // Sort trucks within each job/shift group
      Object.keys(jobShiftGroups).forEach((key) => {
        jobShiftGroups[key].sort((a, b) => {
          return a.truckDriver.localeCompare(b.truckDriver, undefined, { numeric: true, sensitivity: "base" })
        })
      })

      // Flatten back to array, maintaining the shift and time order
      const sortedEntries: ScheduleEntry[] = []
      Object.keys(jobShiftGroups).forEach((key) => {
        sortedEntries.push(...jobShiftGroups[key])
      })

      newData.byTruckType[type] = sortedEntries
    })

    // Reclassify "Undefined" truck type entries as "Dump Truck"
    if (newData.byTruckType["Undefined"]) {
      const undefinedEntries = newData.byTruckType["Undefined"]
      console.log(`Found ${undefinedEntries.length} entries with undefined truck type - reclassifying as Dump Truck`)

      // Create Dump Truck category if it doesn't exist
      if (!newData.byTruckType["Dump Truck"]) {
        newData.byTruckType["Dump Truck"] = []
      }

      // Move entries to Dump Truck category
      undefinedEntries.forEach((entry) => {
        entry.truckType = "Dump Truck"
        newData.byTruckType["Dump Truck"].push(entry)
      })

      // Remove the Undefined category
      delete newData.byTruckType["Undefined"]
    }

    // Then return the filtered data
    return newData
  }, [data])

  // Get incomplete entries across all truck types
  const incompleteEntries = useMemo(() => {
    const allIncomplete: ScheduleEntry[] = []

    Object.entries(sortedData.byTruckType).forEach(([type, entries]) => {
      const incomplete = entries.filter((entry) => !isEntryComplete(entry))
      allIncomplete.push(...incomplete)
    })

    return allIncomplete
  }, [sortedData])

  // Generate driver summary - moved to useEffect to prevent infinite renders
  useEffect(() => {
    // Create a map to track the earliest time for each driver
    const driverTimesMap: Record<string, { time: string; truckNumber: string }> = {}

    // Process all entries to find drivers and their earliest times
    Object.entries(sortedData.byTruckType).forEach(([type, entries]) => {
      entries.filter(isEntryComplete).forEach((entry) => {
        // Skip entries without drivers or with placeholder drivers
        if (!entry.truckDriver || entry.truckDriver === "TBD" || entry.truckDriver === "") return

        // Skip FIRST RETURNING entries
        if (entry.truckDriver === "SMI-FIRST RETURNING TRUCK" || entry.truckDriver.includes("FIRST RETURNING")) return

        // Extract driver information
        let driverName = entry.truckDriver
        const truckNumber = entry.truckDriver

        // If it's a truck number, try to get the driver name
        if (/^(SMI)?(\d+[Ps]?|MMH\d+)$/i.test(entry.truckDriver)) {
          const driverInfo = getDriverForTruck(entry.truckDriver)
          if (driverInfo && driverInfo.name) {
            driverName = driverInfo.name
          }
        }

        // Skip if we couldn't determine a driver name
        if (!driverName || driverName === "TBD" || driverName === "No Driver" || driverName === "Not Assigned") return

        // Use the show-up time if available, otherwise use the load time
        let showUpTime = entry.showUpTime || ""
        if (!showUpTime) {
          // Extract time from date if time is not available
          let displayTime = entry.time
          if (!displayTime && entry.date) {
            const dateTimeMatch = entry.date.match(/(\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?)/i)
            if (dateTimeMatch) {
              displayTime = dateTimeMatch[1]
            }
          }
          showUpTime = displayTime
        }

        // Convert to 24-hour format for comparison
        const formattedTime = convertTo24HourFormat(showUpTime)

        // Update the driver's earliest time if this is earlier or if we don't have a time yet
        if (!driverTimesMap[driverName] || formattedTime < driverTimesMap[driverName].time) {
          driverTimesMap[driverName] = {
            time: formattedTime,
            truckNumber: truckNumber,
          }
        }
      })
    })

    // Convert the map to an array for easier use in the component
    const driverSummaryArray = Object.entries(driverTimesMap)
      .sort(([, a], [, b]) => a.time.localeCompare(b.time))
      .map(([name, info]) => ({ name, ...info }))

    // Update the state with the generated driver summary
    setDriverSummary(driverSummaryArray)
  }, [sortedData])

  // Update the handlePDFExport function to better handle errors
  const handlePDFExport = useCallback(() => {
    // Format the date for the filename using the report date
    const dateStr = format(reportDate, "yyyy-MM-dd")
    console.log("Using date for PDF filename:", dateStr)

    // Calculate unassigned drivers for each truck type
    const unassignedSummary: Record<TruckType, number> = {}
    let totalUnassigned = 0
    let totalOrders = 0

    // Create a filtered version of the data with only complete entries
    const filteredData = { ...sortedData }
    Object.keys(filteredData.byTruckType).forEach((type) => {
      filteredData.byTruckType[type] = filteredData.byTruckType[type].filter(isEntryComplete)
    })

    // Process each truck type
    Object.entries(filteredData.byTruckType).forEach(([type, entries]) => {
      const unassignedCount = entries.filter(
        (entry) => !entry.truckDriver || entry.truckDriver === "TBD" || entry.truckDriver === "",
      ).length

      if (unassignedCount > 0) {
        unassignedSummary[type as TruckType] = unassignedCount
        totalUnassigned += unassignedCount
      }

      totalOrders += entries.length
    })

    // Show loading state
    const button = document.querySelector("button[data-pdf-export]")
    if (button) {
      const originalContent = button.innerHTML
      button.innerHTML =
        '<svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating PDF...'
      button.disabled = true

      try {
        // Ensure reportDate is a valid Date object before passing it
        const validReportDate = reportDate instanceof Date && !isNaN(reportDate.getTime()) ? reportDate : new Date()
        console.log("Using valid report date for PDF:", validReportDate)

        // Verify that filteredData has the expected structure
        if (!filteredData || !filteredData.byTruckType) {
          throw new Error("Invalid data structure: missing byTruckType")
        }

        // First, ensure all time values are properly formatted in the data
        const pdfData = JSON.parse(JSON.stringify(filteredData)) // Deep clone to avoid modifying the original
        Object.keys(pdfData.byTruckType).forEach((type) => {
          pdfData.byTruckType[type].forEach((entry: any) => {
            // Extract time from date if time is not available
            if (!entry.time && entry.date) {
              const dateTimeMatch = entry.date.match(/(\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?)/i)
              if (dateTimeMatch) {
                entry.time = dateTimeMatch[1]
              }
            }

            // Ensure time is in a consistent format
            if (entry.time) {
              entry.time = convertTo24HourFormat(entry.time)
            }
          })
        })

        console.log("Exporting PDF with enhanced time data")
        exportToPDF(
          pdfData,
          `${dateStr}.Spallina.Materials.Trucking.Schedule`,
          validReportDate,
          {
            unassignedSummary,
            totalUnassigned,
            totalOrders,
          },
          dispatcherNotes,
          driverSummary,
        )
      } catch (error) {
        console.error("Error generating PDF:", error)
        alert("There was an error generating the PDF. Please try again.")
      } finally {
        // Reset button after a delay
        setTimeout(() => {
          button.innerHTML = originalContent
          button.disabled = false
        }, 3000)
      }
    } else {
      try {
        // Ensure reportDate is a valid Date object before passing it
        const validReportDate = reportDate instanceof Date && !isNaN(reportDate.getTime()) ? reportDate : new Date()
        console.log("Using valid report date for PDF (no button):", validReportDate)

        // Verify that filteredData has the expected structure
        if (!filteredData || !filteredData.byTruckType) {
          throw new Error("Invalid data structure: missing byTruckType")
        }

        exportToPDF(
          filteredData,
          `${dateStr}.Spallina.Materials.Trucking.Schedule`,
          validReportDate,
          {
            unassignedSummary,
            totalUnassigned,
            totalOrders,
          },
          dispatcherNotes,
          driverSummary,
        )
      } catch (error) {
        console.error("Error generating PDF:", error)
        alert("There was an error generating the PDF. Please try again.")
      }
    }
  }, [reportDate, sortedData, dispatcherNotes, driverSummary])

  const handlePrint = () => {
    window.print()
  }

  const handlePrintPreview = useCallback(() => {
    // Open a new window with just the print content
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    // Get all truck types, excluding "Unspecified"
    const truckTypes = Object.keys(sortedData.byTruckType) as TruckType[]

    // Format the report date
    const formattedDate = format(reportDate, "MMMM d, yyyy")

    // Create the print content
    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Schedule Report - ${format(reportDate, "MM/dd/yyyy")}</title>
      <style>
        @page {
          size: letter portrait;
          margin: 0.5in;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.3;
          color: black;
          background: white;
          margin: 0;
          padding: 0;
        }
        .print-header {
          text-align: center;
          margin-bottom: 0.25in;
        }
        .print-header h1 {
          font-size: 16pt;
          margin: 0;
          margin-bottom: 4pt;
        }
        .print-header p {
          font-size: 12pt;
          margin: 0;
        }
        .truck-section {
          margin-bottom: 0.5in;
          page-break-inside: avoid;
        }
        .truck-title {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 0.15in;
          padding: 5pt;
          border-radius: 4pt;
          page-break-after: avoid;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9pt;
          margin-bottom: 0.25in;
          table-layout: fixed;
        }
        thead {
          display: table-header-group; /* This makes headers repeat on each page */
        }
        tr {
          page-break-inside: avoid; /* Prevent rows from breaking across pages */
        }
        th, td {
          padding: 4pt;
          border: 1pt solid #000;
          text-align: left;
          vertical-align: top;
          overflow: hidden;
          word-wrap: break-word;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .page-footer {
          position: fixed;
          bottom: 0.25in;
          left: 0.5in;
          right: 0.5in;
          font-size: 8pt;
          text-align: center;
          border-top: 1pt solid #ddd;
          padding-top: 0.1in;
        }
        .page-number {
          float: right;
        }
        .timestamp {
          float: left;
        }
        .page-break {
          page-break-before: always;
        }
        
        /* Column widths */
        .col-job-name { width: 15%; }
        .col-start-time { width: 5%; }
        .col-load-time { width: 5%; }
        .col-location { width: 18%; }
        .col-driver { width: 10%; }
        .col-materials { width: 15%; }
        .col-pit { width: 8%; }
        .col-qty { width: 6%; }
        .col-trucks { width: 6%; }
        .col-notes { width: 12%; }
        
        /* Driver summary table */
        .driver-summary {
          margin-top: 0.5in;
          page-break-before: always;
        }
        .driver-summary h2 {
          font-size: 14pt;
          margin-bottom: 0.15in;
        }
        .driver-summary table {
          width: 100%;
        }
        .driver-summary th {
          background-color: #f0f0f0;
        }
        .col-driver-name { width: 40%; }
        .col-truck-num { width: 25%; }
        .col-show-time { width: 35%; }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>Spallina Materials Trucking Scheduler</h1>
        <p>${formattedDate}</p>
        ${dispatcherNotes.trim() ? `<p style="font-weight: bold; font-style: italic; margin-top: 6pt;">${dispatcherNotes}</p>` : ""}
      </div>
  `)

    // Add each truck type section
    truckTypes.forEach((type, typeIndex) => {
      const entries = sortedData.byTruckType[type].filter(isEntryComplete)
      if (entries.length === 0) return

      // Add a page break class for new truck types (except the first one)
      const pageBreakClass = typeIndex > 0 ? 'class="page-break"' : ""

      printWindow.document.write(`
      <div ${pageBreakClass} class="truck-section">
        <div class="truck-title" style="background-color: ${getPrintTruckTypeColor(type)}">${type} Schedule</div>
        <table>
          <thead>
            <tr>
              <th class="col-job-name">Job Name</th>
              <th class="col-start-time">Start<br>Time</th>
              <th class="col-load-time">Load<br>Time</th>
              <th class="col-location">Location</th>
              <th class="col-driver">Driver</th>
              <th class="col-materials">Materials</th>
              <th class="col-pit">Pit<br>Location</th>
              <th class="col-qty">Quantity</th>
              <th class="col-trucks"># Trucks</th>
              <th class="col-notes">Notes</th>
            </tr>
          </thead>
          <tbody>
    `)

      // Add rows for this truck type
      entries.forEach((entry, index) => {
        // Extract time from date if time is not available
        let displayTime = entry.time
        if (!displayTime && entry.date) {
          const dateTimeMatch = entry.date.match(/(\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?)/i)
          if (dateTimeMatch) {
            displayTime = dateTimeMatch[1]
          }
        }

        // Calculate show-up time if not available
        let showUpTime = entry.showUpTime || ""
        if (!showUpTime && displayTime) {
          const offset = Number(entry.showUpOffset || "15")
          showUpTime = addMinutesToTimeString(convertTo24HourFormat(displayTime), -offset)
        }

        // Log the values for debugging
        console.log(
          `Print Entry: ${entry.jobName}, Driver: ${entry.truckDriver}, ShowUpTime: ${showUpTime}, Load: ${displayTime}`,
        )

        printWindow.document.write(`
      <tr>
        <td class="col-job-name">${entry.jobName}</td>
        <td class="col-start-time">${convertTo24HourFormat(showUpTime)}</td>
        <td class="col-load-time">${convertTo24HourFormat(displayTime)}</td>
        <td class="col-location">${entry.location}</td>
        <td class="col-driver">${entry.truckDriver}</td>
        <td class="col-materials">${entry.materials}</td>
        <td class="col-pit">${entry.pit}</td>
        <td class="col-qty">${entry.qty}</td>
        <td class="col-trucks">${entry.numTrucks || "1"}</td>
        <td class="col-notes">${entry.notes}</td>
      </tr>
    `)
      })

      printWindow.document.write(`
          </tbody>
        </table>
        <div class="page-footer">
          <span class="timestamp">${format(new Date(), "MM/dd/yyyy hh:mm a")}</span>
          <span class="page-number">Page <span class="page-num"></span> of <span class="page-count"></span></span>
        </div>
      </div>
    `)
    })

    // Add driver summary section
    printWindow.document.write(`
<div class="driver-summary">
<h2>Spallina Drivers Summary</h2>
<table>
  <thead>
    <tr>
      <th class="col-driver-name">Driver Name</th>
      <th class="col-truck-num">Truck #</th>
      <th class="col-show-time">Show-up Time</th>
    </tr>
  </thead>
  <tbody>
    ${driverSummary
      .map(
        (driver) => `
      <tr>
        <td class="col-driver-name">${driver.name}</td>
        <td class="col-truck-num">${driver.truckNumber}</td>
        <td class="col-show-time">${driver.time}</td>
      </tr>
    `,
      )
      .join("")}
  </tbody>
</table>
<div class="page-footer">
  <span class="timestamp">${format(new Date(), "MM/dd/yyyy hh:mm a")}</span>
  <span class="page-number">Page <span class="page-num"></span> of <span class="page-count"></span></span>
</div>
</div>
`)

    printWindow.document.write(`
  <script>
    // Add page numbers after printing is prepared
    window.onload = function() {
      // Count the total number of pages
      const pageCount = Math.ceil(document.body.scrollHeight / 1056); // Approximate for letter size
      
      // Set the page count in all footers
      const pageCountElements = document.querySelectorAll('.page-count');
      pageCountElements.forEach(el => {
        el.textContent = pageCount.toString();
      });
      
      // Set individual page numbers
      const pageNumElements = document.querySelectorAll('.page-num');
      pageNumElements.forEach((el, index) => {
        el.textContent = (index + 1).toString();
      });
    };
  </script>
  </body>
  </html>
`)

    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 1000) // Small delay to ensure styles are applied
    }
  }, [reportDate, sortedData, dispatcherNotes, driverSummary])

  const toggleEditMode = () => {
    setEditMode(!editMode)
    setEditingEntry(null)
  }

  const startEditing = (index: number, type: TruckType) => {
    setEditingEntry({ index, type })
  }

  const cancelEditing = () => {
    setEditingEntry(null)
  }

  const updateEntry = (updatedEntry: ScheduleEntry, index: number, type: TruckType) => {
    // Create a deep copy of the data
    const newData = { ...data }

    // Update the entry in the byTruckType object
    newData.byTruckType[type][index] = updatedEntry

    // Find and update the entry in allEntries
    const allEntriesIndex = newData.allEntries.findIndex(
      (entry) => entry.jobName === updatedEntry.jobName && entry.truckDriver === updatedEntry.truckDriver,
    )

    if (allEntriesIndex !== -1) {
      newData.allEntries[allEntriesIndex] = updatedEntry
    }

    setData(newData)
    setEditingEntry(null)
  }

  // Function to delete an entry
  const deleteEntry = (index: number, type: TruckType) => {
    // Create a deep copy of the data
    const newData = { ...data }

    // Get the entry to be deleted
    const entryToDelete = newData.byTruckType[type][index]

    // Remove the entry from byTruckType
    newData.byTruckType[type].splice(index, 1)

    // Remove the entry from allEntries
    const allEntriesIndex = newData.allEntries.findIndex(
      (entry) => entry.jobName === entryToDelete.jobName && entry.truckDriver === entryToDelete.truckDriver,
    )

    if (allEntriesIndex !== -1) {
      newData.allEntries.splice(allEntriesIndex, 1)
    }

    setData(newData)
  }

  // Function to duplicate an entry
  const duplicateEntry = (index: number, type: TruckType) => {
    // Create a deep copy of the data
    const newData = { ...data }

    // Get the entry to be duplicated
    const entryToDuplicate = { ...newData.byTruckType[type][index] }

    // Add the duplicated entry to byTruckType
    newData.byTruckType[type].splice(index + 1, 0, entryToDuplicate)

    // Add the duplicated entry to allEntries
    newData.allEntries.push(entryToDuplicate)

    setData(newData)
  }

  // Function to add a new entry
  const addEntry = (type: TruckType) => {
    // Create a deep copy of the data
    const newData = { ...data }

    // Create a new blank entry
    const newEntry = createBlankEntry(type)

    // Add the new entry to byTruckType
    if (!newData.byTruckType[type]) {
      newData.byTruckType[type] = []
    }

    newData.byTruckType[type].push(newEntry)

    // Add to allEntries as well
    newData.allEntries.push(newEntry)

    setData(newData)
  }

  const truckTypes = Object.keys(sortedData.byTruckType) as TruckType[]

  // Format the report date for display
  const formattedReportDate = format(reportDate, "MMMM d, yyyy")

  // Add this function to handle driver time updates
  const handleDriverTimeChange = useCallback(
    (driverName: string, truckNumber: string, newTime: string) => {
      // Create a deep copy of the data
      const newData = JSON.parse(JSON.stringify(data)) as ScheduleData

      // Find all entries with this truck number
      let earliestEntry: ScheduleEntry | null = null
      let earliestEntryType = ""
      let earliestEntryIndex = -1
      let earliestTime = "23:59"

      // Find the earliest entry for this truck
      Object.entries(newData.byTruckType).forEach(([type, entries]) => {
        entries.forEach((entry, index) => {
          if (entry.truckDriver === truckNumber) {
            // Extract time from date if time is not available
            let displayTime = entry.time
            if (!displayTime && entry.date) {
              const dateTimeMatch = entry.date.match(/(\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?)/i)
              if (dateTimeMatch) {
                displayTime = dateTimeMatch[1]
              }
            }

            // Convert to 24-hour format for comparison
            const formattedTime = convertTo24HourFormat(displayTime || "")

            if (formattedTime < earliestTime) {
              earliestTime = formattedTime
              earliestEntry = entry
              earliestEntryType = type
              earliestEntryIndex = index
            }
          }
        })
      })

      // If we found the earliest entry, update its time
      if (earliestEntry && earliestEntryType) {
        // Calculate a new load time (15 minutes after the selected start time)
        const [hours, minutes] = newTime.split(":").map(Number)
        let newLoadHours = hours
        let newLoadMinutes = minutes + 15

        if (newLoadMinutes >= 60) {
          newLoadMinutes -= 60
          newLoadHours = (newLoadHours + 1) % 24
        }

        const newLoadTime = `${newLoadHours.toString().padStart(2, "0")}:${newLoadMinutes.toString().padStart(2, "0")}`

        // Update the entry's time
        newData.byTruckType[earliestEntryType][earliestEntryIndex].time = newLoadTime

        // Also update in allEntries
        const allEntriesIndex = newData.allEntries.findIndex(
          (entry) => entry.jobName === earliestEntry?.jobName && entry.truckDriver === truckNumber,
        )

        if (allEntriesIndex !== -1) {
          newData.allEntries[allEntriesIndex].time = newLoadTime
        }

        // Update the state
        setData(newData)

        // Show a toast notification
        toast({
          title: "Time updated",
          description: `Updated show-up time for ${driverName} (${truckNumber}) to ${newTime}`,
        })
      }
    },
    [data, toast],
  )

  return (
    <Card className="print:shadow-none" id="schedule-report">
      <CardHeader className="flex flex-row items-center justify-between print:hidden">
        <CardTitle>Schedule Report</CardTitle>
        <div className="flex gap-2">
          <Button variant={editMode ? "default" : "outline"} size="sm" onClick={toggleEditMode}>
            <Edit className="h-4 w-4 mr-2" />
            {editMode ? "Done Editing" : "Edit"}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintPreview}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button size="sm" onClick={handlePDFExport} data-pdf-export>
            <FilePdf className="h-4 w-4 mr-2" />
            Create PDF
          </Button>
        </div>
        {/* Dispatcher Notes Input (only in edit mode) */}
        {editMode && (
          <div className="mb-6 border p-4 rounded-md">
            <Label htmlFor="dispatcher-notes" className="mb-2 block font-medium">
              Dispatcher Notes (will appear at top of report if not empty)
            </Label>
            <Textarea
              id="dispatcher-notes"
              value={dispatcherNotes}
              onChange={(e) => setDispatcherNotes(e.target.value)}
              placeholder="Enter important notes for dispatchers here..."
              className="min-h-[80px]"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Print header - only visible when printing */}
        <div className="hidden print:block print-header">
          <h1 className="text-2xl font-bold">Aggregate & Concrete Schedule</h1>
          <p>{formattedReportDate}</p>
        </div>

        {/* Report date and dispatcher notes */}
        <div className="mb-4 text-center">
          <h2 className="text-xl font-semibold">Schedule for {formattedReportDate}</h2>

          {/* Dispatcher Notes */}
          {dispatcherNotes.trim() && (
            <div className="mt-4 mb-6 mx-auto max-w-3xl">
              <p className="text-center font-bold italic text-lg">{dispatcherNotes}</p>
            </div>
          )}
        </div>

        {/* Incomplete entries warning */}
        {incompleteEntries.length > 0 && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Incomplete Entries ({incompleteEntries.length})</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mb-2">
                The following entries are missing required information (Task Name, Location, Quantity, or Materials) and
                will not be displayed in the report:
              </p>
              <div className="max-h-40 overflow-y-auto border border-amber-200 rounded-md p-2 bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-200">
                      <th className="p-1 text-left">Task Name</th>
                      <th className="p-1 text-left">Truck Type</th>
                      <th className="p-1 text-left">Missing Fields</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incompleteEntries.map((entry, idx) => {
                      const missingFields = []
                      if (!entry.jobName?.trim()) missingFields.push("Task Name")
                      if (!entry.location?.trim()) missingFields.push("Location")
                      if (!entry.qty?.trim()) missingFields.push("Quantity")
                      if (!entry.materials?.trim()) missingFields.push("Materials")

                      return (
                        <tr key={idx} className="border-b border-amber-100">
                          <td className="p-1">{entry.jobName || "(Missing)"}</td>
                          <td className="p-1">{entry.truckType}</td>
                          <td className="p-1">{missingFields.join(", ")}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="print:hidden">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Trucks</TabsTrigger>
            {truckTypes.map((type) => (
              <TabsTrigger key={type} value={type}>
                {type}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            {truckTypes.map((type) => (
              <TruckTypeSection
                key={type}
                type={type}
                entries={sortedData.byTruckType[type]}
                editMode={editMode}
                editingEntry={editingEntry}
                onStartEditing={startEditing}
                onCancelEditing={cancelEditing}
                onUpdateEntry={updateEntry}
                onDeleteEntry={deleteEntry}
                onDuplicateEntry={duplicateEntry}
                onAddEntry={addEntry}
              />
            ))}
          </TabsContent>

          {truckTypes.map((type) => (
            <TabsContent key={type} value={type} className="space-y-8">
              <TruckTypeSection
                type={type}
                entries={sortedData.byTruckType[type]}
                editMode={editMode}
                editingEntry={editingEntry}
                onStartEditing={startEditing}
                onCancelEditing={cancelEditing}
                onUpdateEntry={updateEntry}
                onDeleteEntry={deleteEntry}
                onDuplicateEntry={duplicateEntry}
                onAddEntry={addEntry}
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* Print view - always shows all content */}
        <div className="hidden print:block space-y-8">
          {truckTypes.map((type) => {
            const completeEntries = sortedData.byTruckType[type].filter(isEntryComplete)
            if (completeEntries.length === 0) return null

            return (
              <div key={type} className="print-truck-section">
                <TruckTypeSection
                  type={type}
                  entries={completeEntries}
                  editMode={false}
                  editingEntry={null}
                  onStartEditing={() => {}}
                  onCancelEditing={() => {}}
                  onUpdateEntry={() => {}}
                  onDeleteEntry={() => {}}
                  onDuplicateEntry={() => {}}
                  onAddEntry={() => {}}
                />
              </div>
            )
          })}
        </div>
        {/* Driver Summary Section */}

        <div className="mt-12 pt-6 border-t">
          <h3 className="text-xl font-bold mb-4">
            First Scheduled Load: Schedule liable to change. Any changes will be made by direct contact from the
            Scheduling Manager.
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left border">Driver Name</th>
                  <th className="p-2 text-left border">Truck #</th>
                  <th className="p-2 text-left border">Show-up Time</th>
                </tr>
              </thead>
              <tbody>
                {driverSummary.map((driver, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <td className="p-2 border font-medium">{driver.name}</td>
                    <td className="p-2 border">{driver.truckNumber}</td>
                    <td className="p-2 border">
                      <DriverTimeEditor
                        driverName={driver.name}
                        truckNumber={driver.truckNumber}
                        initialTime={driver.time}
                        onTimeChange={handleDriverTimeChange}
                        editMode={editMode}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
