"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { ScheduleData, ScheduleEntry, TruckType } from "@/types/schedule"
import { Edit, Save, X, Trash2, Copy, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { format, parse, isValid } from "date-fns"
import { TruckDisplay } from "@/components/truck-display"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TruckSelector } from "@/components/truck-selector"
import { TimeAdjuster } from "@/components/time-adjuster"
import { addMinutesToTimeString, convertTo24HourFormat } from "@/lib/time-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { DriverSummary } from "./driver-summary"
// Add the import for the ExportButton component
import { ExportButton } from "./export-button"

interface ScheduleReportProps {
  data: ScheduleData
  onUpdateData?: (updatedData: ScheduleData) => void
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
    ASPHALT: "#fbcfe8", // pink-100
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

  // Debug logging for entries of this truck type
  console.log(`TruckTypeSection: ${type} with ${completeEntries.length} entries`)
  completeEntries.forEach((entry, idx) => {
    console.log(
      `Entry ${idx}: Job=${entry.jobName}, Time=${entry.time}, ShowUpTime=${entry.showUpTime}, Interval=${entry.interval}, Offset=${entry.showUpOffset || "15 (default)"}`,
    )
  })

  // Group entries by job name to verify if staggering is working
  const entriesByJob: Record<string, ScheduleEntry[]> = {}
  completeEntries.forEach((entry) => {
    if (!entriesByJob[entry.jobName]) {
      entriesByJob[entry.jobName] = []
    }
    entriesByJob[entry.jobName].push(entry)
  })

  // Log job groups to check if times are staggered
  Object.entries(entriesByJob).forEach(([jobName, jobEntries]) => {
    if (jobEntries.length > 1) {
      console.log(`Job ${jobName} has ${jobEntries.length} entries:`)
      jobEntries.forEach((entry, idx) => {
        console.log(
          `  Entry ${idx}: Time=${entry.time}, ShowUpTime=${entry.showUpTime}, Offset=${entry.showUpOffset || "15 (default)"}`,
        )
      })
    }
  })

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

              // Get the show-up time, ensuring we use the correct offset
              let showUpTime = entry.showUpTime || ""

              // If show-up time is not available but we have a load time, calculate it
              // using the specific offset for this entry
              if (!showUpTime && displayTime) {
                // Get the specific offset for this entry, defaulting to 15 if not specified
                const offset = entry.showUpOffset ? Number.parseInt(entry.showUpOffset, 10) : 15

                // Check if this is an ASPHALT entry (case-insensitive check)
                const normalizedTruckType = entry.truckType.toUpperCase().trim().replace(/\s+/g, " ")
                const isAsphaltEntry =
                  normalizedTruckType === "ASPHALT" ||
                  normalizedTruckType === "ASPHALT TRUCK" ||
                  normalizedTruckType.includes("ASPHALT")
                console.log(
                  `ASPHALT CHECK in UI - Entry: ${entry.jobName}, Type: "${entry.truckType}", Normalized: "${normalizedTruckType}", Is ASPHALT? ${isAsphaltEntry}`,
                )

                // Log for debugging, especially for ASPHALT entries
                console.log(
                  `Entry ${entry.jobName} (${entry.truckDriver}): Using offset: ${offset} minutes (from CSV: ${entry.showUpOffset || "not specified"})${isAsphaltEntry ? " - ASPHALT ENTRY" : ""}`,
                )

                // Convert display time to 24-hour format first
                const formattedTime = convertTo24HourFormat(displayTime)
                if (formattedTime && formattedTime !== displayTime) {
                  showUpTime = addMinutesToTimeString(formattedTime, -offset)
                  console.log(
                    `Entry ${entry.jobName} (${entry.truckDriver}): Calculated show-up time = ${showUpTime} (${offset} minutes before ${formattedTime})${isAsphaltEntry ? " - ASPHALT ENTRY" : ""}`,
                  )
                } else {
                  showUpTime = "N/A"
                }
              }

              // If still no show-up time, display N/A
              if (!showUpTime) showUpTime = "N/A"

              // Log the calculated times for debugging
              console.log(
                `Entry ${entry.jobName} (${entry.truckDriver}): Load=${displayTime}, ShowUp=${showUpTime}, Offset=${entry.showUpOffset || "15 (default)"}`,
              )

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
          <TimeAdjuster
            value={editedEntry.showUpTime || ""}
            onChange={handleShowUpTimeChange}
            className="h-8"
            placeholder="HH:MM"
            step={5}
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
        <TimeAdjuster
          value={editedEntry.time || ""}
          onChange={handleLoadTimeChange}
          className="h-8"
          placeholder="HH:MM"
          step={5}
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
          type="number"
          min="1"
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

export function ScheduleReport({ data: initialData, onUpdateData }: ScheduleReportProps) {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [data, setData] = useState<ScheduleData>(initialData)
  const [editMode, setEditMode] = useState(false)
  const [editingEntry, setEditingEntry] = useState<{ index: number; type: TruckType } | null>(null)
  const [dispatcherNotes, setDispatcherNotes] = useState<string>(initialData.dispatcherNotes || "")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    console.log("ScheduleReport: Data received:", initialData)
    setData(initialData)
    setDispatcherNotes(initialData.dispatcherNotes || "")
  }, [initialData])

  // Function to group entries by truck type
  const groupEntriesByType = (entries: ScheduleEntry[]): Record<TruckType, ScheduleEntry[]> => {
    const grouped: Record<TruckType, ScheduleEntry[]> = {} as Record<TruckType, ScheduleEntry[]>

    if (!entries) return grouped

    entries.forEach((entry) => {
      if (!entry.truckType) {
        entry.truckType = "Undefined" // Ensure every entry has a truckType
      }
      if (!grouped[entry.truckType]) {
        grouped[entry.truckType] = []
      }
      grouped[entry.truckType].push(entry)
    })

    return grouped
  }

  // Group entries by truck type
  const groupedEntries = groupEntriesByType(data.allEntries)

  // Handlers for editing actions
  const handleStartEditing = (index: number, type: TruckType) => {
    setEditingEntry({ index, type })
  }

  const handleCancelEditing = () => {
    setEditingEntry(null)
  }

  const handleUpdateEntry = (updatedEntry: ScheduleEntry, index: number, type: TruckType) => {
    console.log(`Updating entry at index ${index} of type ${type} with`, updatedEntry)

    try {
      // Create a copy of the current entries
      const updatedAllEntries = [...data.allEntries]

      // Find the actual index in allEntries
      const actualIndex = data.allEntries.findIndex(
        (entry) => entry.jobName === updatedEntry.jobName && entry.truckDriver === updatedEntry.truckDriver,
      )

      if (actualIndex !== -1) {
        updatedAllEntries[actualIndex] = updatedEntry
      } else {
        updatedAllEntries[index] = updatedEntry
      }

      const updatedData: ScheduleData = {
        ...data,
        allEntries: updatedAllEntries,
        byTruckType: groupEntriesByType(updatedAllEntries),
      }

      // Update local state
      setData(updatedData)

      // Call the onUpdateData prop if it exists
      if (typeof onUpdateData === "function") {
        onUpdateData(updatedData)
      } else {
        console.warn("onUpdateData is not a function or is undefined")
      }

      setEditingEntry(null)

      toast({
        title: "Entry updated",
        description: "The schedule entry has been successfully updated.",
      })
    } catch (error) {
      console.error("Error updating entry:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating the entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEntry = (index: number, type: TruckType) => {
    console.log(`Deleting entry at index ${index} of type ${type}`)
    try {
      const updatedAllEntries = data.allEntries.filter((_, i) => i !== index)

      const updatedData: ScheduleData = {
        ...data,
        allEntries: updatedAllEntries,
        byTruckType: groupEntriesByType(updatedAllEntries),
      }

      // Update local state
      setData(updatedData)

      // Call the onUpdateData prop if it exists
      if (typeof onUpdateData === "function") {
        onUpdateData(updatedData)
      } else {
        console.warn("onUpdateData is not a function or is undefined")
      }

      toast({
        title: "Entry deleted",
        description: "The schedule entry has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast({
        title: "Delete failed",
        description: "There was an error deleting the entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDuplicateEntry = (index: number, type: TruckType) => {
    console.log(`Duplicating entry at index ${index} of type ${type}`)
    try {
      const entryToDuplicate = data.allEntries[index]
      const duplicatedEntry = { ...entryToDuplicate } // Create a shallow copy

      const updatedAllEntries = [...data.allEntries]
      updatedAllEntries.splice(index + 1, 0, duplicatedEntry) // Insert after the original

      const updatedData: ScheduleData = {
        ...data,
        allEntries: updatedAllEntries,
        byTruckType: groupEntriesByType(updatedAllEntries),
      }

      // Update local state
      setData(updatedData)

      // Call the onUpdateData prop if it exists
      if (typeof onUpdateData === "function") {
        onUpdateData(updatedData)
      } else {
        console.warn("onUpdateData is not a function or is undefined")
      }

      toast({
        title: "Entry duplicated",
        description: "The schedule entry has been successfully duplicated.",
      })
    } catch (error) {
      console.error("Error duplicating entry:", error)
      toast({
        title: "Duplication failed",
        description: "There was an error duplicating the entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddEntry = (type: TruckType) => {
    console.log(`Adding new entry of type ${type}`)
    try {
      const newEntry = createBlankEntry(type)
      const updatedAllEntries = [...data.allEntries, newEntry]

      const updatedData: ScheduleData = {
        ...data,
        allEntries: updatedAllEntries,
        byTruckType: groupEntriesByType(updatedAllEntries),
      }

      // Update local state
      setData(updatedData)

      // Call the onUpdateData prop if it exists
      if (typeof onUpdateData === "function") {
        onUpdateData(updatedData)
      } else {
        console.warn("onUpdateData is not a function or is undefined")
      }

      toast({
        title: "New entry added",
        description: `A new entry for ${type} has been added.`,
      })
    } catch (error) {
      console.error("Error adding entry:", error)
      toast({
        title: "Add failed",
        description: "There was an error adding the entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value
    setDispatcherNotes(newNotes)

    try {
      // Update the data object immediately
      const updatedData: ScheduleData = {
        ...data,
        dispatcherNotes: newNotes,
      }

      // Update local state
      setData(updatedData)

      // Call the onUpdateData prop if it exists
      if (typeof onUpdateData === "function") {
        onUpdateData(updatedData) // Optimistically update the parent component
      } else {
        console.warn("onUpdateData is not a function or is undefined")
      }
    } catch (error) {
      console.error("Error updating notes:", error)
    }
  }

  const handleToggleEditMode = () => {
    setEditMode(!editMode)
    if (editMode) {
      setEditingEntry(null) // Cancel any active editing
    }
  }

  // Handle driver name updates
  const handleUpdateDriverName = (oldName: string, newName: string) => {
    console.log(`Updating driver name from ${oldName} to ${newName}`)

    try {
      // Update all entries with this driver name
      const updatedAllEntries = data.allEntries.map((entry) => {
        if (entry.truckDriver === oldName) {
          return { ...entry, truckDriver: newName }
        }
        return entry
      })

      const updatedData: ScheduleData = {
        ...data,
        allEntries: updatedAllEntries,
        byTruckType: groupEntriesByType(updatedAllEntries),
      }

      // Update local state
      setData(updatedData)

      // Call the onUpdateData prop if it exists
      if (typeof onUpdateData === "function") {
        onUpdateData(updatedData)
      } else {
        console.warn("onUpdateData is not a function or is undefined")
      }

      toast({
        title: "Driver name updated",
        description: `Updated driver name from ${oldName} to ${newName}`,
      })
    } catch (error) {
      console.error("Error updating driver name:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating the driver name. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle driver time updates
  const handleUpdateDriverTime = (driverName: string, field: "showUpTime" | "time", newValue: string) => {
    console.log(`Updating ${field} for driver ${driverName} to ${newValue}`)

    try {
      // Update all entries with this driver name
      const updatedAllEntries = data.allEntries.map((entry) => {
        if (entry.truckDriver === driverName) {
          return { ...entry, [field]: newValue }
        }
        return entry
      })

      const updatedData: ScheduleData = {
        ...data,
        allEntries: updatedAllEntries,
        byTruckType: groupEntriesByType(updatedAllEntries),
      }

      // Update local state
      setData(updatedData)

      // Call the onUpdateData prop if it exists
      if (typeof onUpdateData === "function") {
        onUpdateData(updatedData)
      } else {
        console.warn("onUpdateData is not a function or is undefined")
      }
    } catch (error) {
      console.error(`Error updating driver ${field}:`, error)
      toast({
        title: "Update failed",
        description: `There was an error updating the driver ${field}. Please try again.`,
        variant: "destructive",
      })
    }
  }

  const allTruckTypes = Object.keys(groupedEntries)

  // Render fallback UI if no entries are available
  if (!data || !data.allEntries || data.allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <h2 className="text-lg font-semibold">No schedule entries found.</h2>
        <p className="text-muted-foreground">Please add entries to the schedule.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Schedule Report</h2>
        <div className="flex gap-2">
          <ExportButton
            data={data}
            driverSummary={data.allEntries?.map((entry) => ({
              name: entry.truckDriver || "",
              truckNumber: entry.truckDriver || "",
              time: entry.showUpTime || entry.time || "",
            }))}
          />
          <Button variant="outline" onClick={handleToggleEditMode}>
            {editMode ? "View Mode" : "Edit Mode"}
          </Button>
        </div>
      </div>

      {/* Driver Summary Section */}
      <div className="mb-6">
        <DriverSummary
          entries={data.allEntries}
          onUpdateDriverName={handleUpdateDriverName}
          onUpdateDriverTime={handleUpdateDriverTime}
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="dispatcherNotes">Dispatcher Notes:</Label>
        <Textarea
          id="dispatcherNotes"
          value={dispatcherNotes}
          onChange={handleNotesChange}
          placeholder="Enter notes for the dispatcher"
          className="mt-1"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Types</TabsTrigger>
          {allTruckTypes.map((type) => (
            <TabsTrigger key={type} value={type}>
              {type}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all">
          {allTruckTypes.map((type) => (
            <TruckTypeSection
              key={type}
              type={type}
              entries={groupedEntries[type] || []}
              editMode={editMode}
              editingEntry={editingEntry}
              onStartEditing={handleStartEditing}
              onCancelEditing={handleCancelEditing}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
              onDuplicateEntry={handleDuplicateEntry}
              onAddEntry={handleAddEntry}
            />
          ))}
        </TabsContent>
        {allTruckTypes.map((type) => (
          <TabsContent key={type} value={type}>
            <TruckTypeSection
              type={type}
              entries={groupedEntries[type] || []}
              editMode={editMode}
              editingEntry={editingEntry}
              onStartEditing={handleStartEditing}
              onCancelEditing={handleCancelEditing}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
              onDuplicateEntry={handleDuplicateEntry}
              onAddEntry={handleAddEntry}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
