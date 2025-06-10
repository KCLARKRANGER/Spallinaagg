"use client"

import { Button } from "@/components/ui/button"
import { Printer, FileDown } from "lucide-react"
import type { ScheduleData } from "@/types/schedule"
import { getDriverForTruck } from "@/lib/driver-data"
import { format, parse, isValid } from "date-fns"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface ExportPrintButtonsProps {
  data: ScheduleData
  driverSummary?: Array<{ name: string; truckNumber: string; time: string }>
}

export function ExportPrintButtons({ data, driverSummary = [] }: ExportPrintButtonsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  // Extract the report date from the schedule data
  const reportDate = extractReportDate(data)

  // Format the date string for display
  const dateString = format(reportDate, "EEEE, MMMM d, yyyy")

  // Format the date string for filename (no spaces or special chars)
  const filenameDateString = format(reportDate, "yyyy-MM-dd")
  const filename = `Spallina-Trucking-Schedule-${filenameDateString}.pdf`

  // Handle print button click
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Please allow pop-ups to print the schedule",
        variant: "destructive",
      })
      return
    }

    // Generate HTML content
    const html = generateHTML(data, driverSummary)

    // Write the HTML to the new window
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  // Handle export to PDF button click
  const handleExportToPDF = async () => {
    try {
      setIsExporting(true)

      // Dynamically import html2pdf.js
      const html2pdf = (await import("html2pdf.js")).default

      // Create a temporary container for the HTML content
      const container = document.createElement("div")
      container.innerHTML = generateHTML(data, driverSummary)
      container.style.position = "absolute"
      container.style.left = "-9999px"
      document.body.appendChild(container)

      // Configure html2pdf options
      const options = {
        margin: 10,
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      }

      // Generate and download the PDF
      await html2pdf().from(container).set(options).save()

      // Clean up
      document.body.removeChild(container)

      toast({
        title: "Success",
        description: `Schedule exported as ${filename}`,
      })
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast({
        title: "Error",
        description: "Failed to export schedule to PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleExportToPDF} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isExporting}>
        <FileDown className="h-4 w-4 mr-2" />
        {isExporting ? "Exporting..." : "Export to PDF"}
      </Button>

      <Button onClick={handlePrint} variant="outline">
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>
    </div>
  )
}

// Extract the most common date from entries
function extractReportDate(data: ScheduleData): Date {
  // Default to today if we can't determine a date
  const today = new Date()

  if (!data || !data.allEntries || data.allEntries.length === 0) {
    return today
  }

  // First, try to find entries with a properly formatted date
  for (const entry of data.allEntries) {
    if (entry.date && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(entry.date)) {
      try {
        const [month, day, year] = entry.date.split("/").map(Number)
        const parsedDate = new Date(year, month - 1, day)
        if (isValid(parsedDate)) {
          return parsedDate
        }
      } catch (e) {
        // Continue to next entry
      }
    }
  }

  // Try to extract from the Monday.com format
  for (const entry of data.allEntries) {
    if (entry.date) {
      // Try to match Monday.com format: "Friday, May 2nd 2025, 7:00:00 am -04:00"
      const mondayMatch = entry.date.match(/([A-Za-z]+),\s+([A-Za-z]+)\s+(\d+)(?:st|nd|rd|th)?\s+(\d{4})/)
      if (mondayMatch) {
        try {
          const [_, dayOfWeek, month, day, year] = mondayMatch

          // Map month names to month numbers
          const monthMap: Record<string, number> = {
            January: 0,
            February: 1,
            March: 2,
            April: 3,
            May: 4,
            June: 5,
            July: 6,
            August: 7,
            September: 8,
            October: 9,
            November: 10,
            December: 11,
          }

          const monthNum = monthMap[month] || 0
          const parsedDate = new Date(Number(year), monthNum, Number(day))

          if (isValid(parsedDate)) {
            return parsedDate
          }
        } catch (e) {
          console.error("Error parsing Monday.com date:", e)
        }
      }
    }
  }

  // Count occurrences of each date
  const dateCounts: Record<string, number> = {}
  let maxCount = 0
  let mostCommonDateStr = ""

  // Try to find the most common date
  data.allEntries.forEach((entry) => {
    if (entry.date) {
      // Normalize the date format
      let dateStr = entry.date

      // If the date contains time, extract just the date part
      if (dateStr.includes(",")) {
        const parts = dateStr.split(",")
        if (parts.length >= 2) {
          dateStr = parts[1].trim()
        }
      }

      if (!dateCounts[dateStr]) {
        dateCounts[dateStr] = 0
      }
      dateCounts[dateStr]++

      if (dateCounts[dateStr] > maxCount) {
        maxCount = dateCounts[dateStr]
        mostCommonDateStr = dateStr
      }
    }
  })

  // If we found a common date, try to parse it
  if (mostCommonDateStr) {
    // Try different date formats
    const formats = ["MM/dd/yyyy", "M/d/yyyy", "yyyy-MM-dd", "MMMM d yyyy", "MMMM do yyyy"]

    for (const formatStr of formats) {
      try {
        const parsedDate = parse(mostCommonDateStr, formatStr, new Date())
        if (isValid(parsedDate)) {
          return parsedDate
        }
      } catch (e) {
        // Try next format
      }
    }

    // If we couldn't parse with standard formats, try to extract from more complex strings
    // Example: "Wednesday, March 12th 2025"
    const dateMatch = mostCommonDateStr.match(/([A-Za-z]+)\s+(\d+)(?:st|nd|rd|th)?\s+(\d{4})/)
    if (dateMatch) {
      const [_, month, day, year] = dateMatch
      try {
        // Map month names to month numbers
        const monthMap: Record<string, number> = {
          January: 0,
          February: 1,
          March: 2,
          April: 3,
          May: 4,
          June: 5,
          July: 6,
          August: 7,
          September: 8,
          October: 9,
          November: 10,
          December: 11,
        }

        const monthNum = monthMap[month] || 0
        const parsedDate = new Date(Number(year), monthNum, Number(day))

        if (isValid(parsedDate)) {
          return parsedDate
        }
      } catch (e) {
        console.error("Error parsing complex date:", e)
      }
    }

    // Try to directly parse the string as a last resort
    try {
      const directParsedDate = new Date(mostCommonDateStr)
      if (isValid(directParsedDate)) {
        return directParsedDate
      }
    } catch (e) {
      console.error("Error directly parsing date:", e)
    }
  }

  // If we couldn't determine a date, use today
  return today
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

// Generate HTML for printing and PDF export
function generateHTML(
  data: ScheduleData,
  driverSummary: Array<{ name: string; truckNumber: string; time: string }>,
): string {
  // Extract the report date from the schedule data
  const reportDate = extractReportDate(data)

  // Format the date string
  const dateString = format(reportDate, "EEEE, MMMM d, yyyy")

  // Spallina Materials logo URL
  const logoUrl =
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Spallina.jpg-d9YdthrKQ8KKBMjr0z02HOvN9X2W6P.jpeg"

  // Start building HTML
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Spallina Materials Trucking Schedule - ${dateString}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          font-size: 12px;
        }
        .logo-container {
          text-align: center;
          margin-bottom: 15px;
        }
        .logo {
          max-width: 350px;
          height: auto;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 5px;
          text-align: center;
          font-weight: bold;
        }
        .date-subheading {
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 20px;
          text-align: center;
          font-weight: normal;
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
      
      <div class="logo-container">
        <img src="${logoUrl}" alt="Spallina Materials" class="logo" />
      </div>
      
      <h1>Spallina Materials Trucking Schedule</h1>
      <p class="date-subheading">${dateString}</p>
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
    <h1>Spallina Materials Trucking Schedule</h1>
    <p class="date-subheading">${dateString}</p>
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
