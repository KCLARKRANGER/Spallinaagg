"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Save, X, UserPlus } from "lucide-react"
import type { ScheduleEntry, TruckType } from "@/types/schedule"
import { calculateStartTime } from "@/lib/time-utils"
import { getDriverNames, getDriverForTruck, getAvailableTruckTypes } from "@/lib/driver-data"
import { DriverSelector } from "@/components/driver-selector"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Import the TruckSelector component
import { TruckSelector } from "@/components/truck-selector"

interface EditableRowProps {
  entry: ScheduleEntry
  index: number
  type: TruckType
  onCancel: () => void
  onSave: (entry: ScheduleEntry, index: number, type: TruckType) => void
}

export function EditableRow({ entry, index, type, onCancel, onSave }: EditableRowProps) {
  const [editedEntry, setEditedEntry] = useState<ScheduleEntry>({ ...entry })
  const [driverDialogOpen, setDriverDialogOpen] = useState(false)
  const [selectedTruckType, setSelectedTruckType] = useState<string | null>(null)

  // Get driver names from our hardcoded data
  const driverNames = getDriverNames()

  // Get available truck types
  const truckTypes = getAvailableTruckTypes()

  // Calculate start time based on the current time value
  const startTime = calculateStartTime(editedEntry.time)

  // Check if the truck driver field contains a truck number
  const isTruckNumber = editedEntry.truckDriver && /^(SMI)?\d+[Ps]?$/i.test(editedEntry.truckDriver)

  // If it's a truck number, try to get the driver
  const truckDriver = isTruckNumber ? getDriverForTruck(editedEntry.truckDriver)?.name || "" : editedEntry.truckDriver

  const handleChange = (field: keyof ScheduleEntry, value: string) => {
    setEditedEntry((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDriverSelect = (driverName: string) => {
    handleChange("truckDriver", driverName)
    setDriverDialogOpen(false)
  }

  const openDriverSelector = (truckType?: string) => {
    setSelectedTruckType(truckType || null)
    setDriverDialogOpen(true)
  }

  return (
    <tr className="bg-primary/5">
      <td className="p-2 border">
        <Input value={editedEntry.jobName} onChange={(e) => handleChange("jobName", e.target.value)} className="h-8" />
      </td>
      <td className="p-2 border">
        <div className="text-sm text-muted-foreground">{startTime}</div>
      </td>
      <td className="p-2 border">
        <Input value={editedEntry.time} onChange={(e) => handleChange("time", e.target.value)} className="h-8" />
      </td>
      <td className="p-2 border">
        <Input
          value={editedEntry.location}
          onChange={(e) => handleChange("location", e.target.value)}
          className="h-8"
        />
      </td>
      <td className="p-2 border">
        <div className="flex flex-col gap-2">
          <Input
            value={editedEntry.truckDriver}
            onChange={(e) => handleChange("truckDriver", e.target.value)}
            className="h-8"
            placeholder="Enter truck # or driver name"
          />

          <TruckSelector truckType={type} onSelectTruck={(truckId) => handleChange("truckDriver", truckId)} />

          <div className="flex gap-2">
            <Dialog open={driverDialogOpen} onOpenChange={setDriverDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <UserPlus className="h-4 w-4 mr-1" />
                  All Drivers
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Select Driver</DialogTitle>
                </DialogHeader>
                <DriverSelector onSelectDriver={handleDriverSelect} initialTruckType={selectedTruckType || undefined} />
              </DialogContent>
            </Dialog>

            <Select onValueChange={(value) => openDriverSelector(value)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="By Truck Type" />
              </SelectTrigger>
              <SelectContent>
                {truckTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isTruckNumber && truckDriver && (
            <div className="mt-1 text-xs text-muted-foreground">
              Driver: {truckDriver}
              {getDriverForTruck(editedEntry.truckDriver)?.truckType && (
                <span className="ml-1">({getDriverForTruck(editedEntry.truckDriver)?.truckType})</span>
              )}
            </div>
          )}
        </div>
      </td>
      <td className="p-2 border">
        <Input
          value={editedEntry.materials}
          onChange={(e) => handleChange("materials", e.target.value)}
          className="h-8"
        />
      </td>
      <td className="p-2 border">
        <Input value={editedEntry.qty} onChange={(e) => handleChange("qty", e.target.value)} className="h-8" />
      </td>
      <td className="p-2 border">
        <Input value={editedEntry.notes} onChange={(e) => handleChange("notes", e.target.value)} className="h-8" />
      </td>
      <td className="p-2 border">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onSave(editedEntry, index, type)}>
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
