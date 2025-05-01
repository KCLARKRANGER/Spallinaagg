"use client"

import { useState } from "react"
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
  const [time, setTime] = useState(initialTime)

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    onTimeChange(driverName, truckNumber, newTime)
  }

  if (editMode) {
    return <TimeAdjuster value={time} onChange={handleTimeChange} className="h-8 w-24" step={5} />
  }

  return <span>{time}</span>
}
