"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatTime, parseTimeString, addMinutesToTime, addMinutesToTimeString } from "@/lib/time-utils"
import type { ScheduleEntry } from "@/types/schedule"
import { TimeOffsetSelector } from "./time-offset-selector"
import { TimeAdjuster } from "./time-adjuster"

interface EditableRowProps {
  entry: ScheduleEntry
  onSave: (updatedEntry: ScheduleEntry) => void
  onCancel: () => void
}

export function EditableRow({ entry, onSave, onCancel }: EditableRowProps) {
  const [editedEntry, setEditedEntry] = useState<ScheduleEntry>({ ...entry })
  const [timeOffset, setTimeOffset] = useState<number>(15) // Default 15 minutes

  // Calculate initial time offset when component mounts
  useEffect(() => {
    // If the entry has a specific showUpOffset, use that value
    if (entry.showUpOffset) {
      const offsetValue = Number(entry.showUpOffset)
      console.log(`EditableRow: Using entry's showUpOffset: ${offsetValue} minutes for ${entry.jobName}`)
      setTimeOffset(offsetValue)
    }
    // Otherwise, try to calculate it from start and load times
    else if (entry.startTime && entry.loadTime) {
      const startTimeDate = parseTimeString(entry.startTime)
      const loadTimeDate = parseTimeString(entry.loadTime)

      if (startTimeDate && loadTimeDate) {
        // Calculate difference in minutes
        const diffMs = loadTimeDate.getTime() - startTimeDate.getTime()
        const diffMinutes = Math.round(diffMs / 60000)
        console.log(`EditableRow: Calculated offset from times: ${diffMinutes} minutes for ${entry.jobName}`)
        setTimeOffset(diffMinutes > 0 ? diffMinutes : 15)
      }
    }
    // Default to 15 minutes if no other information is available
    else {
      console.log(`EditableRow: No offset information available, using default: 15 minutes for ${entry.jobName}`)
      setTimeOffset(15)
    }
  }, [entry.startTime, entry.loadTime, entry.showUpOffset, entry.jobName])

  const handleInputChange = (field: keyof ScheduleEntry, value: string) => {
    setEditedEntry((prev) => ({ ...prev, [field]: value }))

    // Special handling for time fields
    if (field === "startTime") {
      // When start time changes, update load time based on offset
      const startTime = parseTimeString(value)
      if (startTime) {
        const newLoadTime = addMinutesToTime(startTime, timeOffset)
        setEditedEntry((prev) => ({ ...prev, loadTime: formatTime(newLoadTime) }))
      }
    } else if (field === "loadTime") {
      // When load time changes independently, recalculate the offset
      const startTime = parseTimeString(editedEntry.startTime || "")
      const loadTime = parseTimeString(value)

      if (startTime && loadTime) {
        const diffMs = loadTime.getTime() - startTime.getTime()
        const diffMinutes = Math.round(diffMs / 60000)
        setTimeOffset(diffMinutes > 0 ? diffMinutes : 0)
      }
    }
  }

  const handleShowUpTimeChange = (newTime: string) => {
    setEditedEntry((prev) => ({ ...prev, showUpTime: newTime }))

    // Update load time based on offset
    if (newTime) {
      const loadTime = addMinutesToTimeString(newTime, Number(editedEntry.showUpOffset || timeOffset))
      setEditedEntry((prev) => ({ ...prev, time: loadTime }))
    }
  }

  const handleLoadTimeChange = (newTime: string) => {
    setEditedEntry((prev) => ({ ...prev, time: newTime }))

    // Update show-up time based on offset
    if (newTime) {
      const showUpTime = addMinutesToTimeString(newTime, -Number(editedEntry.showUpOffset || timeOffset))
      setEditedEntry((prev) => ({ ...prev, showUpTime: showUpTime }))
    }
  }

  const handleOffsetChange = (newOffsetMinutes: number) => {
    setTimeOffset(newOffsetMinutes)
    setEditedEntry((prev) => ({ ...prev, showUpOffset: newOffsetMinutes.toString() }))

    // Recalculate show-up time based on load time and new offset
    if (editedEntry.time) {
      const showUpTime = addMinutesToTimeString(editedEntry.time, -newOffsetMinutes)
      setEditedEntry((prev) => ({ ...prev, showUpTime: showUpTime }))
    }
    // Alternatively, recalculate load time based on show-up time and new offset
    else if (editedEntry.showUpTime) {
      const loadTime = addMinutesToTimeString(editedEntry.showUpTime, newOffsetMinutes)
      setEditedEntry((prev) => ({ ...prev, time: loadTime }))
    }
  }

  return (
    <tr className="bg-blue-50 border-b">
      <td className="p-2">
        <Input
          value={editedEntry.jobNumber || ""}
          onChange={(e) => handleInputChange("jobNumber", e.target.value)}
          className="w-full"
        />
      </td>
      <td className="p-2">
        <TimeAdjuster
          value={editedEntry.showUpTime || ""}
          onChange={handleShowUpTimeChange}
          className="w-full"
          placeholder="HH:MM"
          step={5}
        />
      </td>
      <td className="p-2">
        <TimeAdjuster
          value={editedEntry.time || ""}
          onChange={handleLoadTimeChange}
          className="w-full"
          placeholder="HH:MM"
          step={5}
        />
      </td>
      <td className="p-2">
        <TimeOffsetSelector currentOffset={timeOffset} onOffsetChange={handleOffsetChange} />
      </td>
      <td className="p-2">
        <Input
          value={editedEntry.contractor || ""}
          onChange={(e) => handleInputChange("contractor", e.target.value)}
          className="w-full"
        />
      </td>
      <td className="p-2">
        <Input
          value={editedEntry.material || ""}
          onChange={(e) => handleInputChange("material", e.target.value)}
          className="w-full"
        />
      </td>
      <td className="p-2">
        <Input
          value={editedEntry.quantity?.toString() || ""}
          onChange={(e) => handleInputChange("quantity", e.target.value)}
          className="w-full"
          type="number"
        />
      </td>
      <td className="p-2">
        <Input
          value={editedEntry.numberOfTrucks?.toString() || ""}
          onChange={(e) => handleInputChange("numberOfTrucks", e.target.value)}
          className="w-full"
          type="number"
        />
      </td>
      <td className="p-2">
        <Textarea
          value={editedEntry.notes || ""}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          className="w-full"
          rows={2}
        />
      </td>
      <td className="p-2">
        <div className="flex space-x-2">
          <Button onClick={() => onSave(editedEntry)} variant="default" size="sm">
            Save
          </Button>
          <Button onClick={onCancel} variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      </td>
    </tr>
  )
}
