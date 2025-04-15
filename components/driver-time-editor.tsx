"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, X, Save } from "lucide-react"

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
  const [selectedTime, setSelectedTime] = useState(initialTime)

  // Generate time options in 15-minute increments (00, 15, 30, 45)
  const timeOptions = Array.from({ length: 96 }).map((_, i) => {
    const hours = Math.floor(i / 4)
    const minutes = (i % 4) * 15
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  })

  const handleSave = () => {
    onTimeChange(driverName, truckNumber, selectedTime)
    setIsEditing(false)
  }

  if (!editMode) {
    return <span>{initialTime}</span>
  }

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <>
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder={initialTime} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={handleSave} title="Save">
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} title="Cancel">
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <span>{initialTime}</span>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} title="Edit Time">
            <Edit className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}
