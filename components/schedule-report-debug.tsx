"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ScheduleData } from "@/types/schedule"
import { CheckCircle, AlertCircle } from "lucide-react"

interface ScheduleReportDebugProps {
  scheduleData: ScheduleData | null
}

export function ScheduleReportDebug({ scheduleData }: ScheduleReportDebugProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!scheduleData) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
            Debug Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>No schedule data loaded yet.</p>
        </CardContent>
      </Card>
    )
  }

  const { allEntries, byTruckType } = scheduleData
  const truckTypes = Object.keys(byTruckType)

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            Debug Information
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="font-medium">Total Entries: {allEntries.length}</p>
            <p className="font-medium">Truck Types: {truckTypes.join(", ")}</p>
          </div>

          {isExpanded && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Entries by Truck Type:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {truckTypes.map((type) => (
                    <li key={type}>
                      {type}: {byTruckType[type].length} entries
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">First 5 Entries:</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Job Name</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Truck Type</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Driver</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Time</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Show-up Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allEntries.slice(0, 5).map((entry, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-2 py-1 text-xs">{entry.jobName}</td>
                          <td className="px-2 py-1 text-xs">{entry.truckType}</td>
                          <td className="px-2 py-1 text-xs">{entry.truckDriver}</td>
                          <td className="px-2 py-1 text-xs">{entry.time}</td>
                          <td className="px-2 py-1 text-xs">{entry.showUpTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">ASPHALT Entries:</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Job Name</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Driver</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Time</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Show-up Time</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Offset</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byTruckType["ASPHALT"]?.map((entry, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-2 py-1 text-xs">{entry.jobName}</td>
                          <td className="px-2 py-1 text-xs">{entry.truckDriver}</td>
                          <td className="px-2 py-1 text-xs">{entry.time}</td>
                          <td className="px-2 py-1 text-xs">{entry.showUpTime}</td>
                          <td className="px-2 py-1 text-xs">{entry.showUpOffset} min</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
