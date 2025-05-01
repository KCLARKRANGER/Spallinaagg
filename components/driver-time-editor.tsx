"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface DriverTimeEditorProps {
  driverName: string
  truckNumber: string
  initialTime: string
  onTimeChange: (driverName: string, truckNumber: string, newTime: string) => void
  editMode: boolean
}

export function DriverTimeEditor({
  driverName,
  truckNumber,
  initialTime,
  onTimeChange,
  editMode,
}: DriverTimeEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [timeValue, setTimeValue] = useState(initialTime)

  const handleSave = () => {
    onTimeChange(driverName, truckNumber, timeValue)
    setIsEditing(false)
  }

  if (!editMode) {
    return <span>{initialTime}</span>
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={timeValue}
          onChange={(e) => setTimeValue(e.target.value)}
          className="h-8 w-24"
          placeholder="HH:MM"
        />
        <Button variant="ghost" size="sm" onClick={handleSave} className="h-8 w-8 p-0">
          <Check className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className="cursor-pointer hover:underline hover:text-primary"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {initialTime}
    </div>
  )
}
