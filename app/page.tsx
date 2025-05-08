"use client"

import { useState } from "react"
import { ScheduleUploader } from "@/components/schedule-uploader"
import { ScheduleReport } from "@/components/schedule-report"
import { ScheduleReportDebug } from "@/components/schedule-report-debug"
import type { ScheduleData } from "@/types/schedule"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  const handleScheduleDataLoaded = (data: ScheduleData) => {
    console.log("Schedule data loaded:", data)
    setScheduleData(data)
  }

  const handleUpdateScheduleData = (updatedData: ScheduleData) => {
    console.log("Updating schedule data:", updatedData)
    setScheduleData(updatedData)
  }

  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Aggregate & Concrete Scheduler</h1>
          <p className="text-muted-foreground">Upload and manage your trucking schedule</p>
        </div>
        <Link href="/trucks">
          <Button variant="outline">Manage Trucks</Button>
        </Link>
      </div>

      <ScheduleUploader onScheduleDataLoaded={handleScheduleDataLoaded} />

      {scheduleData && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Schedule Report</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
                {showDebug ? "Hide Debug" : "Show Debug"}
              </Button>
            </div>
          </div>

          <ScheduleReport data={scheduleData} onUpdateData={handleUpdateScheduleData} />

          {showDebug && <ScheduleReportDebug scheduleData={scheduleData} />}
        </div>
      )}

      <Toaster />
    </main>
  )
}
