"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { TruckDisplay } from "@/components/truck-display"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { DRIVER_DATA, type DriverEntry, normalizeTruckType } from "@/lib/driver-data"
import type { ScheduleData, ScheduleEntry } from "@/types/schedule"
import { Truck, Plus, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AvailableTrucksProps {
  scheduleData: ScheduleData
  onAssignTruck: (truckId: string, entryIndex: number, truckType: string) => void
}

export function AvailableTrucks({ scheduleData, onAssignTruck }: AvailableTrucksProps) {
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null)
  const [selectedTruckType, setSelectedTruckType] = useState<string | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number | null>(null)
  const [selectedOrderTruckType, setSelectedOrderTruckType] = useState<string | null>(null)

  // Get stored driver data from localStorage or use default
  const [storedDrivers] = useLocalStorage<DriverEntry[]>("driver-data", DRIVER_DATA)

  // Find trucks that are available but not in the schedule
  const availableTrucks = useMemo(() => {
    // Get all truck IDs from localStorage that are active
    const allTrucks = storedDrivers.filter(
      (driver) =>
        driver.status === "active" &&
        driver.id.trim() !== "" &&
        !driver.id.includes("MMH") && // Exclude MMH trucks as they're special cases
        driver.truckType, // Must have a truck type
    )

    // Get all truck IDs currently in the schedule
    const assignedTruckIds = new Set<string>()

    // Collect all truck/driver entries from the schedule
    Object.values(scheduleData.byTruckType).forEach((entries) => {
      entries.forEach((entry) => {
        if (
          entry.truckDriver &&
          entry.truckDriver !== "TBD" &&
          entry.truckDriver !== "" &&
          !entry.truckDriver.includes("MMH")
        ) {
          assignedTruckIds.add(entry.truckDriver)
        }
      })
    })

    // Filter out trucks that are already assigned
    return allTrucks.filter((truck) => !assignedTruckIds.has(truck.id))
  }, [scheduleData, storedDrivers])

  // Find orders that need drivers assigned
  const unassignedOrders = useMemo(() => {
    const orders: { entry: ScheduleEntry; index: number; truckType: string }[] = []

    Object.entries(scheduleData.byTruckType).forEach(([truckType, entries]) => {
      entries.forEach((entry, index) => {
        if (!entry.truckDriver || entry.truckDriver === "TBD" || entry.truckDriver === "") {
          orders.push({ entry, index, truckType })
        }
      })
    })

    return orders
  }, [scheduleData])

  // Handle selecting a truck to assign
  const handleSelectTruck = (truckId: string, truckType: string | undefined) => {
    setSelectedTruck(truckId)
    setSelectedTruckType(truckType || null)
    setAssignDialogOpen(true)
  }

  // Handle assigning the selected truck to an order
  const handleAssignTruck = () => {
    if (selectedTruck && selectedOrderIndex !== null && selectedOrderTruckType) {
      onAssignTruck(selectedTruck, selectedOrderIndex, selectedOrderTruckType)
      setAssignDialogOpen(false)
      setSelectedTruck(null)
      setSelectedTruckType(null)
      setSelectedOrderIndex(null)
      setSelectedOrderTruckType(null)
    }
  }

  // Filter unassigned orders to match the selected truck type
  const filteredUnassignedOrders = useMemo(() => {
    if (!selectedTruckType) return unassignedOrders

    return unassignedOrders.filter((order) => {
      const orderTruckType = normalizeTruckType(order.truckType) || order.truckType
      const selectedNormalizedType = normalizeTruckType(selectedTruckType) || selectedTruckType
      return orderTruckType === selectedNormalizedType
    })
  }, [unassignedOrders, selectedTruckType])

  // If there are no available trucks, show a message
  if (availableTrucks.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Available Trucks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>All active trucks are currently assigned to orders.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Truck className="h-5 w-5 mr-2" />
          Available Trucks ({availableTrucks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {availableTrucks.map((truck) => (
            <Button
              key={truck.id}
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-2 hover:bg-muted/50"
              onClick={() => handleSelectTruck(truck.id, truck.truckType)}
            >
              <div className="text-lg font-bold">{truck.id}</div>
              {truck.name && <div className="text-sm text-muted-foreground">{truck.name}</div>}
              {truck.truckType && (
                <Badge variant="outline" className="mt-1">
                  {truck.truckType}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Dialog for assigning truck to an order */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Truck to Order</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Selected Truck:</h3>
                {selectedTruck && (
                  <div className="p-3 border rounded-md">
                    <TruckDisplay truckNumber={selectedTruck} showType={true} />
                    {selectedTruckType && (
                      <div className="mt-2">
                        <Badge variant="outline">{selectedTruckType}</Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {filteredUnassignedOrders.length > 0 ? (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Select Order to Assign:</h3>
                  <Select
                    onValueChange={(value) => {
                      const [truckType, indexStr] = value.split("|")
                      setSelectedOrderTruckType(truckType)
                      setSelectedOrderIndex(Number.parseInt(indexStr))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUnassignedOrders.map((order, idx) => (
                        <SelectItem key={idx} value={`${order.truckType}|${order.index}`}>
                          {order.entry.jobName} - {order.entry.time} - {order.truckType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No matching orders found for this truck type ({selectedTruckType}).
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignTruck}
                disabled={selectedOrderIndex === null || filteredUnassignedOrders.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Truck
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
