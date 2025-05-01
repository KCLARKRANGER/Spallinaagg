"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface TimeOffsetSelectorProps {
  currentOffset: number // in minutes
  onOffsetChange: (newOffsetMinutes: number) => void
}

export function TimeOffsetSelector({ currentOffset, onOffsetChange }: TimeOffsetSelectorProps) {
  // Common offset options in minutes
  const offsetOptions = [
    { value: 10, label: "10 minutes" },
    { value: 15, label: "15 minutes" },
    { value: 20, label: "20 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ]

  // Find the closest preset option or use custom
  const [selectedOffset, setSelectedOffset] = useState<string>(
    offsetOptions.find((option) => option.value === currentOffset)?.value.toString() || "custom",
  )

  // For custom offset input
  const [customOffset, setCustomOffset] = useState<number>(
    offsetOptions.some((option) => option.value === currentOffset) ? 15 : currentOffset,
  )

  useEffect(() => {
    // Update the selected offset when the currentOffset prop changes
    const matchingOption = offsetOptions.find((option) => option.value === currentOffset)
    if (matchingOption) {
      setSelectedOffset(matchingOption.value.toString())
    } else {
      setSelectedOffset("custom")
      setCustomOffset(currentOffset)
    }
  }, [currentOffset])

  const handleOffsetChange = (value: string) => {
    setSelectedOffset(value)
    if (value !== "custom") {
      const numericValue = Number.parseInt(value, 10)
      onOffsetChange(numericValue)
    }
  }

  const handleCustomOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      setCustomOffset(value)
      onOffsetChange(value)
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor="time-offset">Time Offset</Label>
      <Select value={selectedOffset} onValueChange={handleOffsetChange}>
        <SelectTrigger id="time-offset" className="w-[180px]">
          <SelectValue placeholder="Select offset" />
        </SelectTrigger>
        <SelectContent>
          {offsetOptions.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {selectedOffset === "custom" && (
        <div className="mt-2">
          <Label htmlFor="custom-offset">Custom Offset (minutes)</Label>
          <input
            id="custom-offset"
            type="number"
            min="1"
            value={customOffset}
            onChange={handleCustomOffsetChange}
            className="w-full p-2 border rounded"
          />
        </div>
      )}
    </div>
  )
}
