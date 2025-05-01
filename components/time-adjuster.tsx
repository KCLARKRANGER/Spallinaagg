"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronUp, ChevronDown } from "lucide-react"
import { addMinutesToTimeString } from "@/lib/time-utils"

interface TimeAdjusterProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  step?: number
  disabled?: boolean
}

export function TimeAdjuster({
  value,
  onChange,
  className = "",
  placeholder = "HH:MM",
  step = 5,
  disabled = false,
}: TimeAdjusterProps) {
  const [internalValue, setInternalValue] = useState(value)

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    onChange(newValue)
  }

  const incrementTime = () => {
    if (disabled) return

    try {
      const newTime = addMinutesToTimeString(internalValue, step)
      setInternalValue(newTime)
      onChange(newTime)
    } catch (error) {
      console.error("Error incrementing time:", error)
    }
  }

  const decrementTime = () => {
    if (disabled) return

    try {
      const newTime = addMinutesToTimeString(internalValue, -step)
      setInternalValue(newTime)
      onChange(newTime)
    } catch (error) {
      console.error("Error decrementing time:", error)
    }
  }

  return (
    <div className="flex items-center">
      <Input
        type="text"
        value={internalValue}
        onChange={handleInputChange}
        className={`${className} pr-12`} // Add padding for buttons
        placeholder={placeholder}
        disabled={disabled}
      />
      <div className="flex flex-col -ml-10 z-10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0"
          onClick={incrementTime}
          disabled={disabled}
        >
          <ChevronUp className="h-3 w-3" />
          <span className="sr-only">Increase time</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0"
          onClick={decrementTime}
          disabled={disabled}
        >
          <ChevronDown className="h-3 w-3" />
          <span className="sr-only">Decrease time</span>
        </Button>
      </div>
    </div>
  )
}
