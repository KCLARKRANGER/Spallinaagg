"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ScheduleData, ScheduleEntry, TruckType } from "@/types/schedule"
import { exportToPDF } from "@/lib/export-utils"
import { Printer, Edit, Save, X, FileIcon as FilePdf, Trash2, Copy, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { format, parse, isValid } from "date-fns"
import { TruckDisplay } from "@/components/truck-display"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
}

// Additional colors for dynamically discovered truck types
const additionalColors = [
  "bg-red-100 dark:bg-red-900",
  "bg-pink-100 dark:bg-pink-900",
  "bg-indigo-100 dark:bg-indigo-900",
  "bg-teal-100 dark:bg-teal-900",
  "bg-cyan-100 dark:bg-cyan-900",
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
  }

  // Additional print colors for dynamic truck types
  const additionalPrintColors = [
    "#fee2e2", // red-100
    "#fce7f3", // pink-100
    "#e0e7ff", // indigo-100
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

// Helper function to calculate start time (15 minutes before load time)
function calculateStartTime(loadTime: string): string {
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

    // Subtract 15 minutes
    minutes -= 15
    if (minutes < 0) {
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
  }
}

// Function to extract the most common date from entries
function extractReportDate(data: ScheduleData): Date {
  // Default to today if we can't determine a date
  const today = new Date()

  if (!data || !data.allEntries || data.allEntries.length === 0) {
    return today
  }

  // Count occurrences of each date
  const dateCounts: Record<string, number> = {}
  let maxCount = 0
  let mostCommonDateStr = ""

  // First, try to find the most common date
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
    // Try different date formats
    const formats = ["MM/dd/yyyy", "M/d/yyyy", "yyyy-MM-dd", "MMMM d yyyy", "MMMM do yyyy"]

    for (const formatStr of formats) {
      try {
        const parsedDate = parse(mostCommonDateStr, formatStr, new Date())
        if (isValid(parsedDate)) {
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
          return parsedDate
        }
      } catch (e) {
        // Fall back to today
      }
    }
  }

  // If we couldn't determine a date, use today
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
  // Skip rendering if entries are empty
  if (entries.length === 0) return null

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
              <th className="p-2 text-left border">Start Time</th>
              <th className="p-2 text-left border">Load Time</th>
              <th className="p-2 text-left border">Location</th>
              <th className="p-2 text-left border">Driver</th>
              <th className="p-2 text-left border">Materials</th>
              <th className="p-2 text-left border">Quantity</th>
              <th className="p-2 text-left border">Notes</th>
              {editMode && <th className="p-2 text-left border">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              const isEditing = editingEntry?.index === index && editingEntry?.type === type

              // Extract time from date if time is not available
              let displayTime = entry.time
              if (!displayTime && entry.date) {
                const dateTimeMatch = entry.date.match(/(\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?)/i)
                if (dateTimeMatch) {
                  displayTime = dateTimeMatch[1]
                }
              }

              // Calculate start time
              const startTime = calculateStartTime(displayTime)

              if (isEditing) {
                return (
                  <EditableRow
                    key={`${entry.jobName}-${entry.truckDriver}-${index}-edit`}
                    entry={{ ...entry, time: displayTime || entry.time }}
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
                  <td className="p-2 border">{convertTo24HourFormat(startTime)}</td>
                  <td className="p-2 border">{convertTo24HourFormat(displayTime)}</td>
                  <td className="p-2 border">{entry.location}</td>
                  <td className="p-2 border">
                    {/^(SMI)?\d+[Ps]?$/i.test(entry.truckDriver) ? (
                      <TruckDisplay truckNumber={entry.truckDriver} showType={true} />
                    ) : (
                      <span className="font-medium">{entry.truckDriver}</span>
                    )}
                  </td>
                  <td className="p-2 border">{entry.materials}</td>
                  <td className="p-2 border">{entry.qty}</td>
                  <td className="p-2 border">{entry.notes}</td>
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

function EditableRow({ entry, index, type, onCancel, onSave }: EditableRowProps) {
  const [editedEntry, setEditedEntry] = useState<ScheduleEntry>({ ...entry })

  // Calculate start time based on the current time value
  const startTime = calculateStartTime(editedEntry.time)

  const handleChange = (field: keyof ScheduleEntry, value: string) => {
    setEditedEntry((prev) => ({
      ...prev,
      [field]: value,
    }))
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
        <div className="text-sm text-muted-foreground">{startTime}</div>
      </td>
      <td className="p-2 border">
        <Input value={editedEntry.time} onChange={(e) => handleChange("time", e.target.value)} className="h-8" />
      </td>
      <td className="p-2 border">
        <Input
          value={editedEntry.location}
          onChange={(e) => handleChange("location", e.target.value)}
          className="h-8"
        />
      </td>
      <td className="p-2 border">
        <Input
          value={editedEntry.truckDriver}
          onChange={(e) => handleChange("truckDriver", e.target.value)}
          className="h-8"
        />
      </td>
      <td className="p-2 border">
        <Input
          value={editedEntry.materials}
          onChange={(e) => handleChange("materials", e.target.value)}
          className="h-8"
        />
      </td>
      <td className="p-2 border">
        <Input value={editedEntry.qty} onChange={(e) => handleChange("qty", e.target.value)} className="h-8" />
      </td>
      <td className="p-2 border">
        <Input value={editedEntry.notes} onChange={(e) => handleChange("notes", e.target.value)} className="h-8" />
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

export function ScheduleReport({ data: initialData }: ScheduleReportProps) {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [data, setData] = useState<ScheduleData>(initialData)
  const [editMode, setEditMode] = useState(false)
  const [editingEntry, setEditingEntry] = useState<{ index: number; type: TruckType } | null>(null)

  // Extract the report date from the data
  const reportDate = useMemo(() => extractReportDate(data), [data])

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

    return newData
  }, [data])

  const handlePDFExport = () => {
    // Format the date for the filename using the report date
    const dateStr = format(reportDate, "yyyy-MM-dd")

    // Calculate unassigned drivers for each truck type
    const unassignedSummary: Record<TruckType, number> = {}
    let totalUnassigned = 0
    let totalOrders = 0

    // Process each truck type
    Object.entries(sortedData.byTruckType).forEach(([type, entries]) => {
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

      // Export the PDF with the report date and unassigned summary
      exportToPDF(sortedData, `${dateStr}.Spallina.Materials.Trucking.Schedule`, reportDate, {
        unassignedSummary,
        totalUnassigned,
        totalOrders,
      })

      // Reset button after a delay
      setTimeout(() => {
        button.innerHTML = originalContent
        button.disabled = false
      }, 3000)
    } else {
      exportToPDF(sortedData, `${dateStr}.Spallina.Materials.Trucking.Schedule`, reportDate, {
        unassignedSummary,
        totalUnassigned,
        totalOrders,
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handlePrintPreview = () => {
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
            font-size: 12pt;
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
            font-size: 18pt;
            margin: 0;
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
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 0.15in;
            padding: 5pt;
            border-radius: 4pt;
            page-break-after: avoid;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            margin-bottom: 0.25in;
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
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .page-number {
            text-align: right;
            font-size: 10pt;
          }
          .page-break {
            page-break-before: always;
          }
          @page {
            @bottom-right {
              content: "Page " counter(page) " of " counter(pages);
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Aggregate & Concrete Schedule</h1>
          <p>${formattedDate}</p>
        </div>
    `)

    // Add all truck types in a single consolidated report
    printWindow.document.write(`
      <div>
    `)

    // Add each truck type section
    truckTypes.forEach((type, typeIndex) => {
      const entries = sortedData.byTruckType[type]
      if (entries.length === 0) return

      // Add a page break class for large sections (except the first one)
      const pageBreakClass = typeIndex > 0 && entries.length > 10 ? 'class="page-break"' : ""

      printWindow.document.write(`
        <div ${pageBreakClass} class="truck-section">
          <div class="truck-title" style="background-color: ${getPrintTruckTypeColor(type)}">${type}</div>
          <table>
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Start Time</th>
                <th>Load Time</th>
                <th>Location</th>
                <th>Driver</th>
                <th>Materials</th>
                <th>Quantity</th>
                <th>Notes</th>
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

        // Calculate start time
        const startTime = calculateStartTime(displayTime)

        printWindow.document.write(`
          <tr>
            <td>${entry.jobName}</td>
            <td>${convertTo24HourFormat(startTime)}</td>
            <td>${convertTo24HourFormat(displayTime)}</td>
            <td>${entry.location}</td>
            <td><strong>${entry.truckDriver}</strong></td>
            <td>${entry.materials}</td>
            <td>${entry.qty}</td>
            <td>${entry.notes}</td>
          </tr>
        `)
      })

      printWindow.document.write(`
            </tbody>
          </table>
        </div>
      `)
    })

    printWindow.document.write(`
      </div>
      </body>
      </html>
    `)

    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
    }
  }

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

    // Add the new entry to allEntries
    newData.allEntries.push(newEntry)

    setData(newData)

    // Start editing the new entry
    const newIndex = newData.byTruckType[type].length - 1
    setEditingEntry({ index: newIndex, type })
  }

  const truckTypes = Object.keys(sortedData.byTruckType) as TruckType[]

  // Format the report date for display
  const formattedReportDate = format(reportDate, "MMMM d, yyyy")

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
      </CardHeader>
      <CardContent>
        {/* Print header - only visible when printing */}
        <div className="hidden print:block print-header">
          <h1 className="text-2xl font-bold">Aggregate & Concrete Schedule</h1>
          <p>{formattedReportDate}</p>
        </div>

        {/* Report date display - visible in UI */}
        <div className="mb-4 text-center">
          <h2 className="text-xl font-semibold">Schedule for {formattedReportDate}</h2>
        </div>

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
          {truckTypes.map((type) => (
            <div key={type} className="print-truck-section">
              <TruckTypeSection
                type={type}
                entries={sortedData.byTruckType[type]}
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
