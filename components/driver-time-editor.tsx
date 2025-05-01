"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save, Edit, X } from "lucide-react"
import { TimeAdjuster } from "./time-adjuster"

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
  const [time, setTime] = useState(initialTime)

  const handleSave = () => {
    onTimeChange(driverName, truckNumber, time)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTime(initialTime)
    setIsEditing(false)
  }

  if (!editMode) {
    return <span>{initialTime}</span>
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <TimeAdjuster value={time} onChange={setTime} className="h-8 w-24" placeholder="HH:MM" step={5} />
        <Button variant="ghost" size="sm" onClick={handleSave} className="h-8 w-8 p-0">
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span>{initialTime}</span>
      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0 ml-2">
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  )
}
