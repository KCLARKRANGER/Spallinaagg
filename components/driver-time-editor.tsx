"use client"

import { useState } from "react"
import { TimeAdjuster } from "./time-adjuster"
import { Button } from "./ui/button"
import { Edit, X, Clock, Save } from "lucide-react"
import { Input } from "./ui/input"
import { useRef, useEffect } from "react"

interface DriverTimeEditorProps {
  driverName: string
  truckNumber: string
  initialTime: string
  onTimeChange: (driverName: string, truckNumber: string, newTime: string) => void
  editMode: boolean
  onDriverNameChange?: (oldName: string, truckNumber: string, newName: string) => void
  driverData?: any // added to avoid type errors
  setDrivers?: any // added to avoid type errors
}

export function DriverTimeEditor({
  driverName,
  truckNumber,
  initialTime,
  onTimeChange,
  editMode,
  onDriverNameChange,
  driverData,
  setDrivers,
}: DriverTimeEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [time, setTime] = useState(initialTime)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(driverName)
  const isComponentMounted = useRef(true)

  const handleSave = () => {
    onTimeChange(driverName, truckNumber, time)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTime(initialTime)
    setIsEditing(false)
  }

  const handleNameEditStart = () => {
    setIsEditingName(true)
    setEditedName(driverName)
  }

  const handleNameEditCancel = () => {
    setIsEditingName(false)
    setEditedName(driverName)
  }

  const handleNameEditSave = () => {
    if (onDriverNameChange && editedName !== driverName) {
      onDriverNameChange(driverName, truckNumber, editedName)
    }
    setIsEditingName(false)
  }

  const handleEditStart = () => {
    setIsEditing(true)
  }

  useEffect(() => {
    return () => {
      isComponentMounted.current = false
    }
  }, [])

  useEffect(() => {
    // Only update if we have valid data and the component is mounted
    if (driverData && isComponentMounted.current) {
      // Create a deep copy to avoid reference issues
      const updatedDrivers = JSON.parse(JSON.stringify(driverData))
      setDrivers(updatedDrivers)
    }
    // This dependency array should only include driverData
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverData])

  if (isEditingName) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="h-8 w-full"
            placeholder="Driver name"
          />
          <Button variant="ghost" size="sm" onClick={handleNameEditSave} title="Save">
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleNameEditCancel} title="Cancel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <TimeAdjuster value={time} onChange={setTime} className="h-8 w-24" placeholder="HH:MM" step={5} />
            <Button variant="ghost" size="sm" onClick={handleSave} title="Save">
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel} title="Cancel">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="font-medium">{initialTime}</span>
            {editMode && (
              <>
                <Button variant="ghost" size="sm" onClick={handleEditStart} title="Edit time">
                  <Clock className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleNameEditStart} title="Edit driver name">
                  <Edit className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
