"use client"

import { useState } from "react"
import { ScheduleUploader } from "@/components/schedule-uploader"
import { ScheduleReport } from "@/components/schedule-report"
import { Button } from "@/components/ui/button"
import { Truck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { ScheduleData } from "@/types/schedule"

export default function Home() {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)

  const handleDataProcessed = (data: ScheduleData) => {
    setScheduleData(data)
  }

  const handleDataUpdate = (updatedData: ScheduleData) => {
    setScheduleData(updatedData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 bg-red-500">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Image
              src="/images/spallina-logo.jpg"
              alt="Spallina Materials Logo"
              width={80}
              height={80}
              className="rounded-lg shadow-md"
            />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Spallina Materials</h1>
              <p className="text-xl text-gray-600">Aggregate and Concrete Scheduler</p>
            </div>
          </div>
          <Link href="/trucks">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Truck className="h-4 w-4" />
              Manage Trucks
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        {!scheduleData ? (
          <div className="max-w-4xl mx-auto">
            <ScheduleUploader onDataProcessed={handleDataProcessed} />
          </div>
        ) : (
          <ScheduleReport data={scheduleData} onUpdateData={handleDataUpdate} />
        )}
      </div>
    </div>
  )
}
