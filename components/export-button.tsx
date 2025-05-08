"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import type { ScheduleData } from "@/types/schedule"
import { getDriverForTruck } from "@/lib/driver-data"

interface ExportButtonProps {
  data: ScheduleData
  driverSummary?: Array<{ name: string; truckNumber: string; time: string }>
}

export function ExportButton({ data, driverSummary = [] }: ExportButtonProps) {
  const handleExport = () => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow pop-ups to export the schedule")
      return
    }

    // Generate simple HTML content
    const html = generateSimpleHTML(data, driverSummary)

    // Write the HTML to the new window
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  return (
    <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white">
      <Printer className="h-4 w-4 mr-2" />
      Export Schedule
    </Button>
  )
}

// Helper function to get driver name from truck ID
function getDriverNameFromTruck(truckId: string): string {
  if (!truckId) return "TBD"

  // Use the getDriverForTruck function from driver-data.ts
  const driver = getDriverForTruck(truckId)

  // If we found a driver with a name, return it
  if (driver && driver.name && driver.name.trim() !== "") {
    return driver.name
  }

  // Otherwise return the truck ID
  return truckId
}

// Generate a simple HTML table
function generateSimpleHTML(
  data: ScheduleData,
  driverSummary: Array<{ name: string; truckNumber: string; time: string }>,
) {
  // Get today's date
  const today = new Date()
  const dateString = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Start building HTML
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Schedule Report - ${dateString}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          font-size: 12px;
        }
        h1 {
          font-size: 18px;
          margin-bottom: 10px;
          text-align: center;
        }
        h2 {
          font-size: 16px;
          margin-top: 20px;
          margin-bottom: 10px;
          background-color: #f0f0f0;
          padding: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #000;
          padding: 5px;
          text-align: left;
        }
        th {
          background-color: #f0f0f0;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .print-button {
          text-align: center;
          margin-bottom: 20px;
        }
        .print-button button {
          padding: 10px 20px;
          background-color: #4CAF50;
          color: white;
          border: none;
          cursor: pointer;
        }
        .page-break {
          page-break-before: always;
        }
        .continued {
          font-style: italic;
          font-size: 10px;
          text-align: right;
          margin-bottom: 5px;
        }
        @media print {
          .print-button {
            display: none;
          }
          @page {
            size: landscape;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-button">
        <button onclick="window.print()">Print</button>
      </div>
      <h1>Schedule Report - ${dateString}</h1>
  `

  // Group entries by truck type
  const entriesByType = data.byTruckType || {}

  // Sort truck types (matching PDF example order)
  const truckTypeOrder = [
    "ASPHALT",
    "Dump Truck",
    "Slinger",
    "Trailer",
    "Triaxle",
    "6 Wheeler",
    "Mixer",
    "Conveyor",
    "Contractor",
  ]

  const sortedTruckTypes = Object.keys(entriesByType).sort((a, b) => {
    // Custom sort based on predefined order
    const aIndex = truckTypeOrder.indexOf(a)
    const bIndex = truckTypeOrder.indexOf(b)

    // If both types are in our predefined list, sort by that order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }

    // If only one type is in our list, prioritize it
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1

    // Otherwise sort alphabetically
    return a.localeCompare(b)
  })

  // Process each truck type - all on the same page
  sortedTruckTypes.forEach((truckType, index) => {
    const entries = entriesByType[truckType] || []

    // Skip if no entries
    if (entries.length === 0) return

    // Add truck type header
    html += `<h2>${truckType} Schedule</h2>`

    // Start table
    html += `
      <table>
        <thead>
          <tr>
            <th>Job Name</th>
            <th>Start Time</th>
            <th>Load Time</th>
            <th>Location</th>
            <th>Driver</th>
            <th>Materials</th>
            <th>Pit Location</th>
            <th>Quantity</th>
            <th># Trucks</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
    `

    // Sort entries by start time
    entries.sort((a, b) => {
      const aTime = a.showUpTime || ""
      const bTime = b.showUpTime || ""
      return aTime.localeCompare(bTime)
    })

    // Add entries
    entries.forEach((entry) => {
      // Get driver name from truck ID
      const driverName = entry.truckDriver ? getDriverNameFromTruck(entry.truckDriver) : ""

      html += `
        <tr>
          <td>${entry.jobName || ""}</td>
          <td>${entry.showUpTime || ""}</td>
          <td>${entry.time || ""}</td>
          <td>${entry.location || ""}</td>
          <td>${driverName}</td>
          <td>${entry.materials || ""}</td>
          <td>${entry.pit || ""}</td>
          <td>${entry.qty || ""}</td>
          <td>${entry.numTrucks || "1"}</td>
          <td>${entry.notes || ""}</td>
        </tr>
      `
    })

    // Close table
    html += `
        </tbody>
      </table>
    `
  })

  // Add driver summary on its own page
  html += `
    <div class="page-break"></div>
    <h2>Spallina Drivers Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Driver Name</th>
          <th>Truck #</th>
          <th>Show-up Time</th>
        </tr>
      </thead>
      <tbody>
  `

  // Process all drivers from entries
  const drivers = new Map()

  data.allEntries?.forEach((entry) => {
    if (entry.truckDriver) {
      // Get driver name from truck ID
      const name = getDriverNameFromTruck(entry.truckDriver)

      drivers.set(entry.truckDriver, {
        name: name,
        truckNumber: entry.truckDriver,
        time: entry.showUpTime || "",
      })
    }
  })

  // Sort drivers by show-up time
  const sortedDrivers = Array.from(drivers.values()).sort((a, b) => {
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time.localeCompare(b.time)
  })

  // Add driver rows
  sortedDrivers.forEach((driver) => {
    html += `
      <tr>
        <td>${driver.name}</td>
        <td>${driver.truckNumber}</td>
        <td>${driver.time}</td>
      </tr>
    `
  })

  // Close driver table
  html += `
      </tbody>
    </table>
  `

  // Close HTML
  html += `
    </body>
    </html>
  `

  return html
}
