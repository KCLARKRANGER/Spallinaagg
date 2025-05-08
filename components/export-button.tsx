"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { ScheduleData } from "@/types/schedule"
import { format } from "date-fns"
import { DRIVER_DATA } from "@/lib/driver-data"

interface ExportButtonProps {
  data: ScheduleData
  driverSummary?: Array<{ name: string; truckNumber: string; time: string; loadTime?: string }>
}

export function ExportButton({ data, driverSummary = [] }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        throw new Error("Could not open print window. Please check your popup settings.")
      }

      // Generate HTML content for the print window
      const html = generatePrintHTML(data, driverSummary)

      // Write the HTML to the new window
      printWindow.document.write(html)
      printWindow.document.close()

      // Wait for resources to load then print
      printWindow.onload = () => {
        printWindow.print()
        setIsExporting(false)
      }

      toast({
        title: "Export successful",
        description: "The schedule has been prepared for printing.",
      })
    } catch (error) {
      console.error("Export error:", error)
      setIsExporting(false)

      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <Button variant="default" onClick={handleExport} disabled={isExporting} className="flex items-center gap-2">
      <Printer className="h-4 w-4" />
      {isExporting ? "Preparing..." : "Export Schedule"}
    </Button>
  )
}

// Helper function to generate the HTML for printing
function generatePrintHTML(
  data: ScheduleData,
  driverSummary: Array<{ name: string; truckNumber: string; time: string; loadTime?: string }>,
) {
  const currentDate = new Date()
  const dateText = format(currentDate, "MMMM d, yyyy")
  const timestamp = format(currentDate, "MM/dd/yyyy hh:mm a")

  // Find driver name from truck number
  function getDriverName(truckNumber: string): string {
    // First check DRIVER_DATA
    const driverEntry = DRIVER_DATA.find((d) => d.id === truckNumber)
    if (driverEntry && driverEntry.name) {
      return driverEntry.name
    }

    // If not found, return the truck number as is
    return truckNumber
  }

  // Start building the HTML
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Spallina Materials Trucking Scheduler - ${dateText}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          font-size: 10pt;
        }
        .page {
          page-break-after: always;
          padding: 30px 40px;
          position: relative;
          box-sizing: border-box;
          min-height: 100vh;
        }
        .page:last-child {
          page-break-after: avoid;
        }
        h1 {
          font-size: 16pt;
          font-weight: bold;
          margin: 0 0 5px 0;
          padding: 0;
          text-align: center;
        }
        h2 {
          font-size: 14pt;
          font-weight: bold;
          margin: 20px 0 10px 0;
          padding: 0;
        }
        .date-display {
          text-align: center;
          margin: 0 0 15px 0;
          font-size: 11pt;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin-bottom: 0;
        }
        th, td {
          border: 1px solid #000;
          padding: 4px 6px;
          text-align: left;
          font-size: 9pt;
          overflow: hidden;
          word-wrap: break-word;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .footer {
          position: absolute;
          bottom: 10px;
          left: 40px;
          right: 40px;
          display: flex;
          justify-content: space-between;
          font-size: 8pt;
          color: #000;
        }
        .truck-type-header {
          font-size: 14pt;
          font-weight: bold;
          margin: 0 0 10px 0;
          padding: 0;
        }
        .notes {
          margin-top: 10px;
          font-style: italic;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .page {
            page-break-after: always;
            height: 100vh;
          }
          .no-print {
            display: none;
          }
        }
        .print-buttons {
          text-align: center;
          margin: 20px 0;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #fff;
          padding: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 1000;
        }
        .print-buttons button {
          padding: 8px 16px;
          margin: 0 5px;
          background: #4b5563;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .print-buttons button:hover {
          background: #374151;
        }
      </style>
    </head>
    <body>
      <div class="print-buttons no-print">
        <button onclick="window.print()">Print</button>
        <button onclick="window.close()">Close</button>
      </div>
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

  // Generate schedule by truck type
  let currentPage = 1
  const totalPages = getTotalPages(entriesByType, sortedTruckTypes, driverSummary)

  sortedTruckTypes.forEach((truckType, typeIndex) => {
    const entries = entriesByType[truckType] || []

    // Skip if empty
    if (entries.length === 0) return

    // Sort entries
    entries.sort((a, b) => {
      // Sort by show-up time
      const aTime = a.showUpTime || ""
      const bTime = b.showUpTime || ""
      return aTime.localeCompare(bTime)
    })

    // Start a new page for each truck type
    html += `
      <div class="page">
        <h1>Spallina Materials Trucking Scheduler</h1>
        <p class="date-display">${dateText}</p>
        <div class="truck-type-header">${truckType} Schedule</div>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Job Name</th>
              <th style="width: 5%;">Start<br>Time</th>
              <th style="width: 5%;">Load<br>Time</th>
              <th style="width: 17%;">Location</th>
              <th style="width: 8%;">Driver</th>
              <th style="width: 15%;">Materials</th>
              <th style="width: 12%;">Pit Location</th>
              <th style="width: 8%;">Quantity</th>
              <th style="width: 5%;">#<br>Trucks</th>
              <th style="width: 10%;">Notes</th>
            </tr>
          </thead>
          <tbody>
    `

    // Add entries
    entries.forEach((entry) => {
      // Get driver name from DRIVER_DATA if possible
      const driverName = entry.truckDriver || ""

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

    html += `
          </tbody>
        </table>
        <div class="footer">
          <span>Page ${currentPage} of ${totalPages}</span>
          <span>${timestamp}</span>
        </div>
      </div>
    `

    currentPage++
  })

  // Generate driver summary page
  html += `
    <div class="page">
      <h1>Spallina Drivers Summary</h1>
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

  // Process drivers
  // Get all drivers from the entries
  const drivers = new Map()

  data.allEntries?.forEach((entry) => {
    if (entry.truckDriver) {
      const driverName = getDriverName(entry.truckDriver)
      drivers.set(entry.truckDriver, {
        name: driverName,
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

  html += `
        </tbody>
      </table>
      <div class="footer">
        <span>Page ${currentPage} of ${totalPages}</span>
        <span>${timestamp}</span>
      </div>
    </div>
  `

  // Close the HTML
  html += `
    </body>
    </html>
  `

  return html
}

// Helper function to calculate total pages
function getTotalPages(entriesByType: Record<string, any[]>, sortedTruckTypes: string[], driverSummary: any[]) {
  // Count how many truck types have entries
  const truckTypePages = sortedTruckTypes.filter((type) => entriesByType[type] && entriesByType[type].length > 0).length

  // Add driver summary page
  return truckTypePages + 1
}
