"use client"

import { useState } from "react"
import { TimeAdjuster } from "./time-adjuster"
import { Button } from "./ui/button"
import { Edit, Check, X } from "lucide-react"

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

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <TimeAdjuster value={time} onChange={setTime} className="h-8 w-24" step={5} />
        <Button variant="ghost" size="sm" onClick={handleSave} className="h-8 w-8 p-0">
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0">
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span>{initialTime}</span>
      {editMode && (
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-6 w-6 p-0 ml-1">
          <Edit className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
