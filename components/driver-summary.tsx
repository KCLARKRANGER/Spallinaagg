"use client"

import type { ScheduleEntry } from "@/types/schedule"
import { convertTo24HourFormat, addMinutesToTimeString } from "@/lib/time-utils"

interface DriverSummaryProps {
  entries: ScheduleEntry[]
}

// SPALLINA trucks that get offset
const SPALLINA_TRUCKS_WITH_OFFSET = [
  // SMI trucks
  "SMI106",
  "SMI107",
  "SMI108",
  "SMI110",
  "SMI111",
  "SMI112",
  "SMI114",
  "SMI36",
  "SMI38",
  "SMI40",
  "SMI41",
  "SMI42",
  "SMI43",
  "SMI43P",
  "SMI43 PUP",
  "SMI46",
  "SMI48",
  "SMI48P",
  "SMI48 PUP",
  "SMI49",
  "SMI49P",
  "SMI49 PUP",
  "SMI50",
  "SMI50P",
  "SMI50 PUP",
  "SMI51",
  "SMI67",
  "SMI68",
  "SMI69",
  "SMI70",
  "SMI71",
  "SMI72",
  "SMI78",
  "SMI85",
  "SMI88",
  "SMI92",
  "SMI92S",
  "SMI94",
  "SMI94S",
  "SMI95",
  "SMI95S",
  "SMI96",
  "SMI96S",
  "SMI97",
  "SMI97S",
  // MMH trucks (Spallina fleet) - FIXED
  "MMH06",
  "MMH6",
  "MMH08",
  "MMH8",
  // SPA trucks - FIXED: Include SPA33
  "SPA106",
  "SPA107",
  "SPA108",
  "SPA110",
  "SPA111",
  "SPA112",
  "SPA114",
  "SPA33", // FIXED: SPA33 included
  "SPA36",
  "SPA38",
  "SPA40",
  "SPA41",
  "SPA42",
  "SPA43",
  "SPA43 PUP",
  "SPA46",
  "SPA48",
  "SPA48 PUP",
  "SPA49",
  "SPA49 PUP",
  "SPA50",
  "SPA50 PUP",
  "SPA51",
  "SPA67",
  "SPA68",
  "SPA69",
  "SPA70",
  "SPA71",
  "SPA72",
  "SPA78",
  "SPA85",
  "SPA88",
  "SPA92",
  "SPA92S",
  "SPA94",
  "SPA94S",
  "SPA95",
  "SPA95S",
  "SPA96",
  "SPA96S",
  "SPA97",
  "SPA97S",
]

// Function to check if a truck is a contractor
function isContractorTruck(truckDriver: string): boolean {
  if (!truckDriver || truckDriver.trim() === "" || truckDriver === "TBD") {
    return false
  }

  // FIRST: Check if it's a Spallina truck - if so, it's NOT a contractor
  if (isSpallinaTruckWithOffset(truckDriver)) {
    return false
  }

  const cleanName = truckDriver.replace(/^\*/, "").trim().toUpperCase()

  // Specific contractor trucks
  const contractorTrucks = [
    "WAT44",
    "WAT48",
    "MAT51",
    "NCHFB",
    "SNOWFLAKE",
    "SNOW2",
    "SNOW3",
    "SNOW4",
    "SNOW5",
    "SNOW5",
    "SNOW6",
    "SNOW7",
    "SICK",
    "YORK",
  ]

  return contractorTrucks.includes(cleanName) || cleanName.startsWith("CONTRACTOR") || cleanName.startsWith("*")
}

// Function to check if a truck should get offset
function isSpallinaTruckWithOffset(truckDriver: string): boolean {
  if (!truckDriver || truckDriver.trim() === "" || truckDriver === "TBD") {
    return false
  }

  const cleanName = truckDriver.replace(/^\*/, "").trim()

  // Check if it's in the Spallina trucks list FIRST (before contractor check)
  const isSpallinaTruck = SPALLINA_TRUCKS_WITH_OFFSET.some((spallinaTruck) => {
    const upperCleanName = cleanName.toUpperCase()
    const upperSpallinaTruck = spallinaTruck.toUpperCase()

    return (
      upperCleanName === upperSpallinaTruck ||
      upperCleanName === upperSpallinaTruck.replace(/P$/, " PUP") ||
      (spallinaTruck.includes("MMH") && (upperCleanName === "MMH6" || upperCleanName === "MMH06")) ||
      (spallinaTruck.includes("MMH") && (upperCleanName === "MMH8" || upperCleanName === "MMH08"))
    )
  })

  // If it's a Spallina truck, return true regardless of contractor patterns
  if (isSpallinaTruck) {
    return true
  }

  // Only check contractor status if it's NOT a Spallina truck
  return false
}

export function DriverSummary({ entries }: DriverSummaryProps) {
  // Create driver summary data - only show first chronological entry per truck
  const allDriverEntries: Array<{ truck: string; taskName: string; startTime: string; rawTime: string }> = []

  entries
    ?.filter((entry) => entry.truckDriver && entry.truckDriver !== "TBD" && entry.truckDriver.trim() !== "")
    .forEach((entry) => {
      // Calculate start time based on whether truck is Spallina with offset
      let startTime = entry.showUpTime || ""
      const displayTime = entry.time || ""

      if (!startTime && displayTime) {
        const isSpallinaWithOffset = isSpallinaTruckWithOffset(entry.truckDriver)

        if (isSpallinaWithOffset) {
          // Spallina truck with offset: apply the specific offset from showUpOffset field
          const offset = entry.showUpOffset ? Number.parseInt(entry.showUpOffset, 10) : 15
          const formattedTime = convertTo24HourFormat(displayTime)
          if (formattedTime) {
            startTime = addMinutesToTimeString(formattedTime, -offset)
          }
        } else {
          // Contractor/other truck: start time = load time (NO OFFSET)
          startTime = convertTo24HourFormat(displayTime) || displayTime
        }
      }

      const formattedStartTime = convertTo24HourFormat(startTime) || ""
      if (formattedStartTime) {
        allDriverEntries.push({
          truck: entry.truckDriver,
          taskName: entry.jobName || "",
          startTime: formattedStartTime,
          rawTime: formattedStartTime, // For sorting
        })
      }
    })

  // Group by truck and find the earliest start time for each truck
  const truckEarliestTimes = new Map<string, { truck: string; taskName: string; startTime: string }>()

  allDriverEntries.forEach((entry) => {
    const existingEntry = truckEarliestTimes.get(entry.truck)

    if (!existingEntry || entry.rawTime < existingEntry.startTime) {
      truckEarliestTimes.set(entry.truck, {
        truck: entry.truck,
        taskName: entry.taskName,
        startTime: entry.startTime,
      })
    }
  })

  // Convert to array and sort chronologically by start time
  const uniqueDriverEntries = Array.from(truckEarliestTimes.values()).sort((a, b) => {
    if (!a.startTime && !b.startTime) return 0
    if (!a.startTime) return 1
    if (!b.startTime) return -1
    return a.startTime.localeCompare(b.startTime)
  })

  if (uniqueDriverEntries.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No drivers assigned to any jobs yet.</p>
      </div>
    )
  }

  // Split entries into 3 equal columns for display
  const entriesPerColumn = Math.ceil(uniqueDriverEntries.length / 3)
  const column1 = uniqueDriverEntries.slice(0, entriesPerColumn)
  const column2 = uniqueDriverEntries.slice(entriesPerColumn, entriesPerColumn * 2)
  const column3 = uniqueDriverEntries.slice(entriesPerColumn * 2)

  return (
    <div className="driver-summary">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[column1, column2, column3].map(
          (columnEntries, columnIndex) =>
            columnEntries.length > 0 && (
              <div key={columnIndex} className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 print:text-lg">
                  <thead>
                    <tr className="bg-muted print:bg-gray-200">
                      <th className="p-3 text-left border border-gray-300 print:p-2 font-bold print:truck-header">
                        TRUCK
                      </th>
                      <th className="p-3 text-left border border-gray-300 print:p-2 font-bold">FIRST TASK</th>
                      <th className="p-3 text-left border border-gray-300 print:p-2 font-bold time-column">
                        START TIME
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {columnEntries.map((entry, index) => {
                      const isContractor = isContractorTruck(entry.truck)

                      return (
                        <tr
                          key={`${entry.truck}-${index}`}
                          className={`${index % 2 === 0 ? "bg-background" : "bg-muted/30"} print:bg-transparent`}
                        >
                          <td className="p-3 border border-gray-300 print:p-2 driver-column">
                            <span className="font-semibold">{isContractor ? `*${entry.truck}` : entry.truck}</span>
                          </td>
                          <td className="p-3 border border-gray-300 print:p-2">{entry.taskName}</td>
                          <td className="p-3 border border-gray-300 print:p-2 font-mono font-bold text-center time-column">
                            {entry.startTime}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ),
        )}
      </div>
    </div>
  )
}
