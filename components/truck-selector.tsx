"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { DRIVER_DATA, type DriverEntry, normalizeTruckType } from "@/lib/driver-data"
import { Truck } from "lucide-react"

interface TruckSelectorProps {
  truckType: string
  onSelectTruck: (truckId: string) => void
}

export function TruckSelector({ truckType, onSelectTruck }: TruckSelectorProps) {
  const [storedDrivers] = useLocalStorage<DriverEntry[]>("driver-data", DRIVER_DATA)
  const [availableTrucks, setAvailableTrucks] = useState<DriverEntry[]>([])

  // Normalize the truck type for matching
  const normalizedTruckType = normalizeTruckType(truckType) || truckType

  // Get all active trucks of the matching type
  useEffect(() => {
    const trucks = storedDrivers.filter((driver) => {
      // Only include active trucks
      if (driver.status !== "active") return false

      // Skip entries without truck type
      if (!driver.truckType) return false

      // Match normalized truck types
      const driverTruckType = normalizeTruckType(driver.truckType) || driver.truckType
      return driverTruckType === normalizedTruckType
    })

    // Sort by priority and then by ID
    trucks.sort((a, b) => {
      // First sort by priority (lower number = higher priority)
      if ((a.priority ?? 999) !== (b.priority ?? 999)) {
        return (a.priority ?? 999) - (b.priority ?? 999)
      }

      // Then sort by ID
      return a.id.localeCompare(b.id, undefined, { numeric: true })
    })

    setAvailableTrucks(trucks)
  }, [truckType, storedDrivers, normalizedTruckType])

  if (availableTrucks.length === 0) {
    return null
  }

  return (
    <Select onValueChange={onSelectTruck}>
      <SelectTrigger className="h-8">
        <div className="flex items-center gap-1">
          <Truck className="h-3 w-3" />
          <span className="text-xs">Available Trucks</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {availableTrucks.map((truck) => (
          <SelectItem key={truck.id} value={truck.id}>
            <div className="flex flex-col">
              <span>{truck.id}</span>
              {truck.name && <span className="text-xs text-muted-foreground">{truck.name}</span>}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
