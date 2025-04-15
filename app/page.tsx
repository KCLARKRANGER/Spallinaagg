"use client"

import { useState } from "react"
import { ScheduleUploader } from "@/components/schedule-uploader"
import { ScheduleReport } from "@/components/schedule-report"
import { ScheduleSummary } from "@/components/schedule-summary"
import { DriverAssignmentHelper } from "@/components/driver-assignment-helper"
import { AvailableTrucks } from "@/components/available-trucks"
import { ScheduleHeader } from "@/components/schedule-header"
import { ScheduleFilters } from "@/components/schedule-filters"
import type { ScheduleData } from "@/types/schedule"
import { useLocalStorage } from "@/hooks/use-local-storage"

export default function Home() {
  const [scheduleData, setScheduleData] = useLocalStorage<ScheduleData | null>("scheduleData", null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTruckType, setSelectedTruckType] = useState("all")

  // Handle file upload
  const handleFileUpload = (data: ScheduleData) => {
    setScheduleData(data)
  }

  // Handle driver assignment
  const handleAssignDrivers = (updatedSchedule: ScheduleData) => {
    setScheduleData(updatedSchedule)
  }

  // Handle assigning a truck to an order
  const handleAssignTruck = (truckId: string, entryIndex: number, truckType: string) => {
    if (!scheduleData) return

    // Create a deep copy of the schedule data
    const updatedSchedule = JSON.parse(JSON.stringify(scheduleData)) as ScheduleData

    // Update the entry in the byTruckType object
    updatedSchedule.byTruckType[truckType][entryIndex].truckDriver = truckId

    // Find and update the entry in allEntries
    const entry = updatedSchedule.byTruckType[truckType][entryIndex]
    const allEntriesIndex = updatedSchedule.allEntries.findIndex(
      (e) => e.jobName === entry.jobName && (!e.truckDriver || e.truckDriver === "TBD"),
    )

    if (allEntriesIndex !== -1) {
      updatedSchedule.allEntries[allEntriesIndex].truckDriver = truckId
    }

    // Update the schedule data
    setScheduleData(updatedSchedule)
  }

  // Handle clearing filters
  const handleClearFilters = () => {
    setSelectedDate(undefined)
    setSearchTerm("")
    setSelectedTruckType("all")
  }

  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <ScheduleHeader />

      <div className="mt-6 space-y-6">
        {!scheduleData ? (
          <ScheduleUploader onUpload={handleFileUpload} />
        ) : (
          <>
            <ScheduleFilters
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onClearFilters={handleClearFilters}
              truckTypes={Object.keys(scheduleData.byTruckType)}
              selectedTruckType={selectedTruckType}
              onTruckTypeChange={setSelectedTruckType}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AvailableTrucks scheduleData={scheduleData} onAssignTruck={handleAssignTruck} />
                <ScheduleReport data={scheduleData} />
              </div>
              <div className="space-y-6">
                <ScheduleSummary data={scheduleData} />
                <DriverAssignmentHelper scheduleData={scheduleData} onAssignDrivers={handleAssignDrivers} />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
