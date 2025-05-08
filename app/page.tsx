"use client"

import { useState } from "react"
import { ScheduleUploader } from "@/components/schedule-uploader"
import { ScheduleReport } from "@/components/schedule-report"
import { ScheduleReportDebug } from "@/components/schedule-report-debug"
import type { ScheduleData, TruckType } from "@/types/schedule"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { ScheduleFilters } from "@/components/schedule-filters"
import { ScheduleHeader } from "@/components/schedule-header"

export default function Home() {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Filter state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTruckType, setSelectedTruckType] = useState("all")

  // Get unique truck types from the data
  const truckTypes: TruckType[] = scheduleData?.allEntries
    ? Array.from(new Set(scheduleData.allEntries.map((entry) => entry.truckType)))
    : []

  const handleClearFilters = () => {
    setSelectedDate(undefined)
    setSearchTerm("")
    setSelectedTruckType("all")
  }

  const handleScheduleDataLoaded = (data: ScheduleData) => {
    console.log("Schedule data loaded:", data)
    setScheduleData(data)
  }

  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col items-center mb-6">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Spallina.jpg-d9YdthrKQ8KKBMjr0z02HOvN9X2W6P.jpeg"
          alt="Spallina Materials"
          width={350}
          height={100}
          className="mb-4"
          priority
        />

        {scheduleData ? (
          <ScheduleHeader data={scheduleData} />
        ) : (
          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Spallina Materials Trucking Schedule</h1>
            <p className="text-xl mt-2">Upload a schedule to view details</p>
          </div>
        )}

        <div className="mt-4 w-full flex justify-end">
          <Link href="/trucks">
            <Button variant="outline">Manage Trucks</Button>
          </Link>
        </div>
      </div>

      <ScheduleUploader onScheduleDataLoaded={handleScheduleDataLoaded} />

      {scheduleData && (
        <>
          <div className="mt-6 mb-4">
            <ScheduleFilters
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onClearFilters={handleClearFilters}
              truckTypes={truckTypes}
              selectedTruckType={selectedTruckType}
              onTruckTypeChange={setSelectedTruckType}
            />
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Schedule Report</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
                  {showDebug ? "Hide Debug" : "Show Debug"}
                </Button>
              </div>
            </div>

            <ScheduleReport data={scheduleData} onUpdateData={setScheduleData} />

            {showDebug && <ScheduleReportDebug scheduleData={scheduleData} />}
          </div>
        </>
      )}

      <Toaster />
    </main>
  )
}
