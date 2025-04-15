"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Wand2, AlertCircle, CheckCircle } from "lucide-react"
import type { ScheduleData, ScheduleEntry, TruckType } from "@/types/schedule"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { DRIVER_DATA, type DriverEntry, normalizeTruckType } from "@/lib/driver-data"

interface DriverAssignmentHelperProps {
  scheduleData: ScheduleData
  onAssignDrivers: (updatedSchedule: ScheduleData) => void
}

export function DriverAssignmentHelper({ scheduleData, onAssignDrivers }: DriverAssignmentHelperProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [assignmentResults, setAssignmentResults] = useState<{
    assigned: number
    unassigned: number
    byTruckType: Record<string, { assigned: number; unassigned: number }>
    assignedDrivers?: Array<{ truck: string; driver: string; jobName: string }>
  } | null>(null)

  // Get stored driver data from localStorage or use default
  const [storedDrivers] = useLocalStorage<DriverEntry[]>("driver-data", DRIVER_DATA)

  // Calculate unassigned entries
  const unassignedEntries = Object.entries(scheduleData.byTruckType).reduce(
    (acc, [type, entries]) => {
      const unassigned = entries.filter(
        (entry) => !entry.truckDriver || entry.truckDriver === "TBD" || entry.truckDriver === "",
      )

      if (unassigned.length > 0) {
        acc[type] = unassigned
      }

      return acc
    },
    {} as Record<TruckType, ScheduleEntry[]>,
  )

  const totalUnassigned = Object.values(unassignedEntries).reduce((sum, entries) => sum + entries.length, 0)

  // Get available drivers from stored data
  const availableDrivers = storedDrivers.filter(
    (driver) =>
      driver.status === "active" &&
      driver.name !== "No Driver" &&
      driver.name !== "Not Assigned" &&
      driver.name.trim() !== "" &&
      driver.truckType, // Must have a truck type
  )

  const handleAutoAssign = () => {
    setIsProcessing(true)

    try {
      // Create a deep copy of the schedule data
      const updatedSchedule = JSON.parse(JSON.stringify(scheduleData)) as ScheduleData

      // Track assignment results
      const results = {
        assigned: 0,
        unassigned: 0,
        byTruckType: {} as Record<string, { assigned: number; unassigned: number }>,
        assignedDrivers: [] as Array<{ truck: string; driver: string; jobName: string }>,
      }

      // Process each truck type
      Object.keys(updatedSchedule.byTruckType).forEach((truckType) => {
        results.byTruckType[truckType] = { assigned: 0, unassigned: 0 }

        // Get entries for this truck type
        const entries = updatedSchedule.byTruckType[truckType]

        // Normalize the truck type for matching
        const normalizedTruckType = normalizeTruckType(truckType) || truckType

        // Get available drivers for this truck type, sorted by priority
        const matchingDrivers = [...availableDrivers]
          .filter((driver) => {
            const driverTruckType = normalizeTruckType(driver.truckType) || driver.truckType
            return driverTruckType === normalizedTruckType
          })
          .sort((a, b) => {
            // Sort by priority (lower number = higher priority)
            return (a.priority ?? 999) - (b.priority ?? 999)
          })

        console.log(
          `Available drivers for ${truckType}:`,
          matchingDrivers.map((d) => `${d.id} (${d.name}) - Priority: ${d.priority}`),
        )

        // Create a copy of matching drivers that we can remove from as they get assigned
        const remainingDrivers = [...matchingDrivers]

        // Find unassigned entries
        entries.forEach((entry, index) => {
          if (!entry.truckDriver || entry.truckDriver === "TBD" || entry.truckDriver === "") {
            // If we still have matching drivers available
            if (remainingDrivers.length > 0) {
              // Take the next available driver
              const driver = remainingDrivers.shift()!

              // Assign the driver using their truck number
              const truckNumber = driver.id
              const driverName = driver.name
              const assignedValue = truckNumber

              // Assign the driver
              updatedSchedule.byTruckType[truckType][index].truckDriver = assignedValue

              // Update the corresponding entry in allEntries
              const allEntriesIndex = updatedSchedule.allEntries.findIndex(
                (e) => e === entry || (e.jobName === entry.jobName && (!e.truckDriver || e.truckDriver === "TBD")),
              )

              if (allEntriesIndex !== -1) {
                updatedSchedule.allEntries[allEntriesIndex].truckDriver = assignedValue
              }

              results.assigned++
              results.byTruckType[truckType].assigned++

              // Store the driver info for display
              results.assignedDrivers.push({
                truck: truckNumber,
                driver: driverName,
                jobName: entry.jobName,
              })
            } else {
              results.unassigned++
              results.byTruckType[truckType].unassigned++
            }
          }
        })
      })

      // Update state with results
      setAssignmentResults(results)

      // Pass the updated schedule back to the parent
      onAssignDrivers(updatedSchedule)
    } catch (error) {
      console.error("Error during auto-assignment:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (totalUnassigned === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Driver Assignment Helper
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">All drivers assigned</AlertTitle>
            <AlertDescription className="text-green-700">
              All orders in the schedule have drivers assigned.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
          Driver Assignment Helper
        </CardTitle>
        <CardDescription>
          {totalUnassigned} orders need drivers assigned.
          {availableDrivers.length > 0
            ? ` ${availableDrivers.length} drivers available.`
            : " No driver reference data available."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(unassignedEntries).map(([type, entries]) => (
            <div key={type} className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <span className="font-medium">{type}</span>
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="bg-amber-50">
                    {entries.length} unassigned
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {assignmentResults && (
          <Alert className="mt-4 bg-blue-50 border-blue-200">
            <AlertTitle className="text-blue-800">Assignment Results</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p>
                Successfully assigned {assignmentResults.assigned} drivers. {assignmentResults.unassigned} orders still
                need manual assignment.
              </p>

              <div className="mt-2 space-y-1">
                {Object.entries(assignmentResults.byTruckType)
                  .filter(([_, stats]) => stats.assigned > 0 || stats.unassigned > 0)
                  .map(([type, stats]) => (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span>{type}:</span>
                      <div>
                        <Badge variant="outline" className="bg-green-50 mr-1">
                          {stats.assigned} assigned
                        </Badge>
                        {stats.unassigned > 0 && (
                          <Badge variant="outline" className="bg-amber-50">
                            {stats.unassigned} pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {assignmentResults.assignedDrivers && assignmentResults.assignedDrivers.length > 0 && (
                <div className="mt-3 border-t pt-2">
                  <p className="font-medium mb-1">Assigned Trucks/Drivers:</p>
                  <div className="max-h-40 overflow-y-auto">
                    {assignmentResults.assignedDrivers.map((assignment, idx) => (
                      <div key={idx} className="text-sm py-1 border-b border-blue-100 last:border-0">
                        <span className="font-medium">{assignment.truck}</span>
                        {assignment.driver && <span className="text-xs ml-1">({assignment.driver})</span>}
                        <span className="text-xs ml-2 text-blue-600">→ {assignment.jobName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleAutoAssign} disabled={isProcessing || availableDrivers.length === 0}>
          <Wand2 className="h-4 w-4 mr-2" />
          {isProcessing ? "Assigning Drivers..." : "Auto-Assign Drivers"}
        </Button>
      </CardFooter>
    </Card>
  )
}
