"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimeAdjusterProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  onChange: (value: string) => void
  step?: number // Minutes to adjust by
}

export function TimeAdjuster({ value, onChange, step = 5, className, ...props }: TimeAdjusterProps) {
  const [internalValue, setInternalValue] = useState(value)

  // Update internal value when prop value changes
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  // Handle direct input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value)

    // Only trigger onChange if the value is a valid time
    if (/^\d{1,2}:\d{2}$/.test(e.target.value)) {
      onChange(e.target.value)
    }
  }

  // Handle blur to format time properly
  const handleBlur = () => {
    if (internalValue && !/^\d{1,2}:\d{2}$/.test(internalValue)) {
      // Try to parse and format the time
      const timeMatch = internalValue.match(/(\d{1,2})[:\s]?(\d{2})/)
      if (timeMatch) {
        const [_, hours, minutes] = timeMatch
        const formattedTime = `${hours.padStart(2, "0")}:${minutes}`
        setInternalValue(formattedTime)
        onChange(formattedTime)
      } else {
        // Reset to previous valid value
        setInternalValue(value)
      }
    }
  }

  // Increment time by step minutes
  const incrementTime = () => {
    if (!internalValue || !/^\d{1,2}:\d{2}$/.test(internalValue)) return

    const [hours, minutes] = internalValue.split(":").map(Number)
    let newMinutes = minutes + step
    let newHours = hours

    if (newMinutes >= 60) {
      newMinutes -= 60
      newHours = (newHours + 1) % 24
    }

    const newTime = `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`
    setInternalValue(newTime)
    onChange(newTime)
  }

  // Decrement time by step minutes
  const decrementTime = () => {
    if (!internalValue || !/^\d{1,2}:\d{2}$/.test(internalValue)) return

    const [hours, minutes] = internalValue.split(":").map(Number)
    let newMinutes = minutes - step
    let newHours = hours

    if (newMinutes < 0) {
      newMinutes += 60
      newHours = (newHours - 1 + 24) % 24
    }

    const newTime = `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`
    setInternalValue(newTime)
    onChange(newTime)
  }

  return (
    <div className="flex items-center">
      <Input
        type="text"
        value={internalValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className={cn("flex-1", className)}
        placeholder="HH:MM"
        {...props}
      />
      <div className="flex flex-col ml-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0"
          onClick={incrementTime}
          title={`Increase by ${step} minutes`}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0"
          onClick={decrementTime}
          title={`Decrease by ${step} minutes`}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
