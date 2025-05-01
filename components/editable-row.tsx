"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatTime, parseTimeString, addMinutesToTime } from "@/lib/time-utils"
import type { ScheduleEntry } from "@/types/schedule"
import { TimeOffsetSelector } from "./time-offset-selector"

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
    if (entry.startTime && entry.loadTime) {
      const startTimeDate = parseTimeString(entry.startTime)
      const loadTimeDate = parseTimeString(entry.loadTime)

      if (startTimeDate && loadTimeDate) {
        // Calculate difference in minutes
        const diffMs = loadTimeDate.getTime() - startTimeDate.getTime()
        const diffMinutes = Math.round(diffMs / 60000)
        setTimeOffset(diffMinutes)
      }
    }
  }, [entry.startTime, entry.loadTime])

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

  const handleOffsetChange = (newOffsetMinutes: number) => {
    setTimeOffset(newOffsetMinutes)

    // Recalculate load time based on start time and new offset
    if (editedEntry.startTime) {
      const startTime = parseTimeString(editedEntry.startTime)
      if (startTime) {
        const newLoadTime = addMinutesToTime(startTime, newOffsetMinutes)
        setEditedEntry((prev) => ({ ...prev, loadTime: formatTime(newLoadTime) }))
      }
    }
    // Alternatively, recalculate start time based on load time and new offset
    else if (editedEntry.loadTime) {
      const loadTime = parseTimeString(editedEntry.loadTime)
      if (loadTime) {
        const newStartTime = addMinutesToTime(loadTime, -newOffsetMinutes)
        setEditedEntry((prev) => ({ ...prev, startTime: formatTime(newStartTime) }))
      }
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
        <Input
          value={editedEntry.startTime || ""}
          onChange={(e) => handleInputChange("startTime", e.target.value)}
          className="w-full"
          placeholder="HH:MM AM/PM"
        />
      </td>
      <td className="p-2">
        <Input
          value={editedEntry.loadTime || ""}
          onChange={(e) => handleInputChange("loadTime", e.target.value)}
          className="w-full"
          placeholder="HH:MM AM/PM"
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
