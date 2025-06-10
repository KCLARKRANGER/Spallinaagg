"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TimeAdjuster } from "@/components/time-adjuster"
import { Save } from "lucide-react"
import type { ScheduleEntry } from "@/types/schedule"
import { convertTo24HourFormat } from "@/lib/time-utils"
import { getDriverForTruck } from "@/lib/driver-data"

interface DriverSummaryProps {
  entries: ScheduleEntry[]
  onUpdateDriverName: (oldName: string, newName: string) => void
  onUpdateDriverTime: (driverName: string, field: "showUpTime" | "time", newValue: string) => void
}

interface DriverInfo {
  truckNumber: string
  name: string
  showUpTime: string
  loadTime: string
  actualDriverName?: string // Added to store the actual driver name from DRIVER_DATA
}

export function DriverSummary({ entries, onUpdateDriverName, onUpdateDriverTime }: DriverSummaryProps) {
  const [drivers, setDrivers] = useState<DriverInfo[]>([])
  const [editingName, setEditingName] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!entries || entries.length === 0) return

    // Extract unique drivers and their earliest times
    const driverMap = new Map<string, DriverInfo>()

    // Filter out TBD entries
    const validEntries = entries.filter((entry) => entry.truckDriver && entry.truckDriver !== "TBD")

    validEntries.forEach((entry) => {
      if (!entry.truckDriver) return

      const truckNumber = entry.truckDriver
      const showUpTime = entry.showUpTime || ""
      const loadTime = entry.time || ""

      // Get the actual driver name from DRIVER_DATA if it's a truck number
      let actualDriverName = ""
      if (/^(SMI)?\d+[Ps]?$/i.test(truckNumber)) {
        const driverEntry = getDriverForTruck(truckNumber)
        if (driverEntry && driverEntry.name) {
          actualDriverName = driverEntry.name
        }
      }

      if (!driverMap.has(truckNumber)) {
        driverMap.set(truckNumber, {
          truckNumber,
          name: truckNumber,
          showUpTime,
          loadTime,
          actualDriverName,
        })
      } else {
        // If we already have this driver, update times if the new ones are earlier
        const existing = driverMap.get(truckNumber)!

        if (showUpTime && (!existing.showUpTime || showUpTime < existing.showUpTime)) {
          existing.showUpTime = showUpTime
        }

        if (loadTime && (!existing.loadTime || loadTime < existing.loadTime)) {
          existing.loadTime = loadTime
        }

        driverMap.set(truckNumber, existing)
      }
    })

    // Convert to array and sort by show-up time
    const driversArray = Array.from(driverMap.values())

    // Sort by show-up time (chronologically)
    driversArray.sort((a, b) => {
      // If both have show-up times, compare them
      if (a.showUpTime && b.showUpTime) {
        return a.showUpTime.localeCompare(b.showUpTime)
      }
      // If only one has a show-up time, prioritize the one with a time
      if (a.showUpTime) return -1
      if (b.showUpTime) return 1

      // If neither has a show-up time, compare load times
      if (a.loadTime && b.loadTime) {
        return a.loadTime.localeCompare(b.loadTime)
      }
      // If only one has a load time, prioritize the one with a time
      if (a.loadTime) return -1
      if (b.loadTime) return 1

      // If neither has any time, sort by name
      return a.name.localeCompare(b.name)
    })

    setDrivers(driversArray)

    // Initialize editing state for names
    const initialEditState: Record<string, string> = {}
    driversArray.forEach((driver) => {
      initialEditState[driver.truckNumber] = driver.actualDriverName || driver.name
    })
    setEditingName(initialEditState)
  }, [entries])

  const handleNameChange = (truckNumber: string, value: string) => {
    setEditingName((prev) => ({
      ...prev,
      [truckNumber]: value,
    }))
  }

  const handleSaveName = (truckNumber: string) => {
    const newName = editingName[truckNumber]
    if (newName !== truckNumber) {
      onUpdateDriverName(truckNumber, newName)
    }
  }

  const handleShowUpTimeChange = (truckNumber: string, value: string) => {
    onUpdateDriverTime(truckNumber, "showUpTime", value)
  }

  const handleLoadTimeChange = (truckNumber: string, value: string) => {
    onUpdateDriverTime(truckNumber, "time", value)
  }

  if (drivers.length === 0) {
    return (
      <div className="p-4 bg-muted rounded-md">
        <h3 className="text-xl font-bold mb-2">Driver Summary</h3>
        <p className="text-muted-foreground">No driver information available.</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-muted/30 rounded-md">
      <h3 className="text-xl font-bold mb-4">Driver Summary</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left border">Truck #</th>
              <th className="p-2 text-left border">Driver Name</th>
              <th className="p-2 text-left border">Show-up Time</th>
              <th className="p-2 text-left border">Load Time</th>
              <th className="p-2 text-left border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver, index) => (
              <tr key={`${driver.truckNumber}-${index}`} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                <td className="p-2 border">{driver.truckNumber}</td>
                <td className="p-2 border">
                  <Input
                    value={editingName[driver.truckNumber] || ""}
                    onChange={(e) => handleNameChange(driver.truckNumber, e.target.value)}
                    className="h-8"
                    placeholder={driver.actualDriverName || "Enter driver name"}
                  />
                </td>
                <td className="p-2 border">
                  <TimeAdjuster
                    value={convertTo24HourFormat(driver.showUpTime) || ""}
                    onChange={(value) => handleShowUpTimeChange(driver.truckNumber, value)}
                    className="h-8"
                    placeholder="HH:MM"
                    step={5}
                  />
                </td>
                <td className="p-2 border">
                  <TimeAdjuster
                    value={convertTo24HourFormat(driver.loadTime) || ""}
                    onChange={(value) => handleLoadTimeChange(driver.truckNumber, value)}
                    className="h-8"
                    placeholder="HH:MM"
                    step={5}
                  />
                </td>
                <td className="p-2 border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveName(driver.truckNumber)}
                    title="Save driver name"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
