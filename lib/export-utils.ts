import type { ScheduleData, TruckType } from "@/types/schedule"
import { format } from "date-fns"
import jsPDF from "jspdf"

// Add this import at the top of the file
import { DRIVER_DATA } from "@/lib/driver-data"

// Mock DRIVER_DATA for demonstration purposes.  Replace with actual data source.
// const DRIVER_DATA = [
//   { id: "123", name: "John Doe" },
//   { id: "456", name: "Jane Smith" },
//   { id: "789", name: "Peter Jones" },
//   { id: "101", name: "Alice Brown" },
//   { id: "112", name: "Bob Williams" },
// ];

// Helper function to format truck/driver display for PDF
function formatTruckDriverForPDF(truckDriver: string, pdf: jsPDF): { text: string; height: number } {
  // Check if it's a truck number
  if (/^(SMI)?\d+[Ps]?$/i.test(truckDriver)) {
    const baseNumber = truckDriver.replace(/^SMI/i, "").replace(/[Ps]$/i, "")
    const driver = DRIVER_DATA.find((d) => d.id === baseNumber)

    if (driver && driver.name) {
      // Return truck number with driver name underneath
      return {
        text: `${truckDriver}\n${driver.name}`,
        height: 24, // Increased height for two lines
      }
    }
  }

  // Return just the driver name for non-truck entries
  return {
    text: truckDriver,
    height: 15, // Standard height
  }
}

// Helper function to convert time to 24-hour format
function convertTo24HourFormat(timeStr: string): string {
  if (!timeStr || timeStr === "N/A") return timeStr

  try {
    // Already in 24-hour format like "14:30"
    if (/^\d{1,2}:\d{2}$/.test(timeStr) && !timeStr.includes("AM") && !timeStr.includes("PM")) {
      const [hours, minutes] = timeStr.split(":").map((part) => Number.parseInt(part, 10))
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }

    // Military time format (e.g., "0900")
    if (/^\d{3,4}$/.test(timeStr)) {
      const paddedTime = timeStr.padStart(4, "0")
      const hours = Number.parseInt(paddedTime.substring(0, 2), 10)
      const minutes = Number.parseInt(paddedTime.substring(2, 4), 10)
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }

    // Standard time format with AM/PM (e.g., "9:00 AM")
    if (/^\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?$/i.test(timeStr)) {
      const timeParts = timeStr.split(":")
      let hours = Number.parseInt(timeParts[0], 10)
      const minutesPart = timeParts[1].replace(/[^\d]/g, "")
      const minutes = Number.parseInt(minutesPart, 10)

      // Handle AM/PM
      if (/PM/i.test(timeStr) && hours < 12) {
        hours += 12
      } else if (/AM/i.test(timeStr) && hours === 12) {
        hours = 0
      }

      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }

    return timeStr
  } catch (e) {
    console.error("Error converting time format:", e)
    return timeStr
  }
}

// Helper function to get print truck type color
function getPrintTruckTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    Trailer: "#d1fae5", // green-100
    "Dump Truck": "#ffedd5", // orange-100
    Slinger: "#fef9c3", // yellow-100
    Asphalt: "#dbeafe", // blue-100
    "Standard Mixer": "#dbeafe", // blue-100
    Conveyor: "#f3e8ff", // purple-100
  }

  // Additional print colors for dynamic truck types
  const additionalPrintColors = [
    "#fee2e2", // red-100
    "#fce7f3", // pink-100
    "#e0e7ff", // indigo-100
    "#ccfbf1", // teal-100
    "#cffafe", // cyan-100
    "#ecfccb", // lime-100
    "#fef3c7", // amber-100
    "#d1fae5", // emerald-100
    "#f5d0fe", // fuchsia-100
    "#ffe4e6", // rose-100
  ]

  if (colorMap[type]) {
    return colorMap[type]
  }

  // If this is a new type, assign it a print color
  const knownTypes = Object.keys(colorMap).length
  const colorIndex = knownTypes % additionalPrintColors.length

  return additionalPrintColors[colorIndex]
}

// Helper function to calculate start time
function calculateStartTime(loadTime: string): string {
  if (!loadTime) return "N/A"

  try {
    // Handle different time formats
    let hours = 0
    let minutes = 0

    // Military time format (e.g., "0900")
    if (/^\d{3,4}$/.test(loadTime)) {
      const timeStr = loadTime.padStart(4, "0")
      hours = Number.parseInt(timeStr.substring(0, 2), 10)
      minutes = Number.parseInt(timeStr.substring(2, 4), 10)
    }
    // Standard time format (e.g., "9:00 AM")
    else if (/^\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?$/i.test(loadTime)) {
      const timeParts = loadTime.split(":")
      hours = Number.parseInt(timeParts[0], 10)
      minutes = Number.parseInt(timeParts[1].replace(/[^\d]/g, ""), 10)

      // Handle AM/PM
      if (/PM/i.test(loadTime) && hours < 12) {
        hours += 12
      } else if (/AM/i.test(loadTime) && hours === 12) {
        hours = 0
      }
    } else {
      return "N/A"
    }

    // Subtract 15 minutes
    minutes -= 15
    if (minutes < 0) {
      minutes += 60
      hours -= 1
    }
    if (hours < 0) {
      hours += 24
    }

    // Format the start time in 24-hour format
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  } catch (e) {
    console.error("Error calculating start time:", e)
    return "N/A"
  }
}

export function exportToPDF(
  data: ScheduleData,
  fileName: string,
  reportDate: Date = new Date(),
  summaryData?: {
    unassignedSummary: Record<TruckType, number>
    totalUnassigned: number
    totalOrders: number
  },
) {
  try {
    // Create a PDF document directly
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "letter",
    })

    // Define page dimensions and margins
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 40 // 0.5 inch margin
    const contentWidth = pageWidth - 2 * margin

    // Set initial y position
    let y = margin

    // Add title and date
    pdf.setFontSize(18)
    pdf.setFont("helvetica", "bold")
    const title = "Spallina Materials Trucking Scheduler"
    const titleWidth = (pdf.getStringUnitWidth(title) * 18) / pdf.internal.scaleFactor
    pdf.text(title, (pageWidth - titleWidth) / 2, y)

    y += 25

    // Add date
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "normal")
    const dateText = format(reportDate, "MMMM d, yyyy")
    const dateWidth = (pdf.getStringUnitWidth(dateText) * 12) / pdf.internal.scaleFactor
    pdf.text(dateText, (pageWidth - dateWidth) / 2, y)

    y += 30

    // Add summary section if provided
    if (summaryData && summaryData.totalUnassigned > 0) {
      y += 20

      // Add summary title
      pdf.setFontSize(12)
      pdf.setFont("helvetica", "bold")
      pdf.text("Driver Assignment Summary", margin, y)

      y += 20

      // Add summary text
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.text(
        `${summaryData.totalUnassigned} out of ${summaryData.totalOrders} orders ` +
          `(${Math.round((summaryData.totalUnassigned / summaryData.totalOrders) * 100)}%) need drivers assigned.`,
        margin,
        y,
      )

      y += 20

      // Add details for each truck type with unassigned drivers
      Object.entries(summaryData.unassignedSummary).forEach(([type, count]) => {
        pdf.text(`${type}: ${count} unassigned`, margin + 10, y)
        y += 15
      })

      y += 10
    }

    // Get all truck types
    const truckTypes = Object.keys(data.byTruckType) as TruckType[]

    // Define table columns and their widths (in percentage of content width)
    const columns = [
      { header: "Job Name", width: 0.17 },
      { header: "Start", width: 0.06 },
      { header: "Load", width: 0.06 },
      { header: "Location", width: 0.19 },
      { header: "Driver", width: 0.12 },
      { header: "Materials", width: 0.14 },
      { header: "Qty", width: 0.1 },
      { header: "Notes", width: 0.16 },
    ]

    // Calculate actual column widths in points
    const colWidths = columns.map((col) => col.width * contentWidth)

    // Define row height
    const baseRowHeight = 25
    let dynamicRowHeight = baseRowHeight

    const headerRowHeight = 30

    // Process each truck type - data is already sorted by shift priority and time
    for (const type of truckTypes) {
      const entries = data.byTruckType[type]
      if (entries.length === 0) continue

      // Check if we need a new page for this truck type
      if (y + headerRowHeight + 40 > pageHeight - margin) {
        pdf.addPage()
        y = margin
      }

      // Add truck type header
      pdf.setFillColor(
        hexToRgb(getPrintTruckTypeColor(type)).r,
        hexToRgb(getPrintTruckTypeColor(type)).g,
        hexToRgb(getPrintTruckTypeColor(type)).b,
      )
      pdf.setDrawColor(0)
      pdf.rect(margin, y, contentWidth, 30, "FD")

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(14)
      pdf.setTextColor(0)
      pdf.text(type, margin + 10, y + 20)

      y += 40

      // Draw table header
      pdf.setFillColor(240, 240, 240) // Light gray for header
      pdf.rect(margin, y, contentWidth, headerRowHeight, "FD")

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(9) // Changed from 10 to 9

      let x = margin
      for (let i = 0; i < columns.length; i++) {
        pdf.rect(x, y, colWidths[i], headerRowHeight, "S")
        pdf.text(columns[i].header, x + 5, y + 18)
        x += colWidths[i]
      }

      y += headerRowHeight

      // Draw table rows
      pdf.setFont("helvetica", "normal")

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]

        // Extract time from date if time is not available
        let displayTime = entry.time
        if (!displayTime && entry.date) {
          const dateTimeMatch = entry.date.match(/(\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?)/i)
          if (dateTimeMatch) {
            displayTime = dateTimeMatch[1]
          }
        }

        // Calculate start time
        const startTime = calculateStartTime(displayTime)

        // Calculate dynamic row height based on all wrapped text fields
        const jobNameText = entry.jobName || ""
        const locationTextValue = entry.location || ""
        const materialsText = entry.materials || ""
        const notesText = entry.notes || ""

        const wrappedJobName = wrapText(jobNameText, colWidths[0] - 10, pdf)
        const wrappedLocation = wrapText(locationTextValue, colWidths[3] - 10, pdf)
        const wrappedMaterials = wrapText(materialsText, colWidths[5] - 10, pdf)
        const wrappedNotes = wrapText(notesText, colWidths[7] - 10, pdf)

        const jobNameLines = wrappedJobName.split("\n")
        const locationLines = wrappedLocation.split("\n")
        const materialsLines = wrappedMaterials.split("\n")
        const notesLines = wrappedNotes.split("\n")

        const maxLines = Math.max(jobNameLines.length, locationLines.length, materialsLines.length, notesLines.length)

        dynamicRowHeight = Math.max(baseRowHeight, maxLines * 12 + 5)

        // Check if we need a new page
        if (y + dynamicRowHeight > pageHeight - margin) {
          pdf.addPage()
          y = margin

          // Redraw the header on the new page
          pdf.setFillColor(240, 240, 240)
          pdf.rect(margin, y, contentWidth, headerRowHeight, "FD")

          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(9)

          x = margin
          for (let j = 0; j < columns.length; j++) {
            pdf.rect(x, y, colWidths[j], headerRowHeight, "S")
            pdf.text(columns[j].header, x + 5, y + 18)
            x += colWidths[j]
          }

          y += headerRowHeight
          pdf.setFont("helvetica", "normal")
        }

        // Set background color for alternating rows
        if (i % 2 === 0) {
          pdf.setFillColor(255, 255, 255) // White
        } else {
          pdf.setFillColor(249, 249, 249) // Light gray
        }
        pdf.rect(margin, y, contentWidth, dynamicRowHeight, "FD")

        // Draw cell borders and content
        x = margin

        // Job Name - with text wrapping
        pdf.rect(x, y, colWidths[0], dynamicRowHeight, "S")
        const jobNameText2 = entry.jobName || ""
        const wrappedJobName2 = wrapText(jobNameText2, colWidths[0] - 10, pdf)
        const jobNameLines2 = wrappedJobName2.split("\n")
        let jobNameY = y + 15
        const lineHeight = 12
        if (jobNameLines2.length > 1) {
          jobNameY = y + (dynamicRowHeight - jobNameLines2.length * lineHeight) / 2 + lineHeight
        }
        for (let lineIndex = 0; lineIndex < jobNameLines2.length; lineIndex++) {
          pdf.text(jobNameLines2[lineIndex], x + 5, jobNameY + lineIndex * lineHeight)
        }
        x += colWidths[0]

        // Start Time
        pdf.rect(x, y, colWidths[1], dynamicRowHeight, "S")
        pdf.text(convertTo24HourFormat(startTime) || "", x + 5, y + 15)
        x += colWidths[1]

        // Load Time
        pdf.rect(x, y, colWidths[2], dynamicRowHeight, "S")
        pdf.text(convertTo24HourFormat(displayTime) || "", x + 5, y + 15)
        x += colWidths[2]

        // Location - with text wrapping
        pdf.rect(x, y, colWidths[3], dynamicRowHeight, "S")
        const locationTextValue2 = entry.location || ""
        const wrappedLocation2 = wrapText(locationTextValue2, colWidths[3] - 10, pdf)
        const locationLines2 = wrappedLocation2.split("\n")
        let locationY = y + 15

        // If we have multiple lines, adjust positioning
        if (locationLines2.length > 1) {
          locationY = y + (dynamicRowHeight - locationLines2.length * lineHeight) / 2 + lineHeight
        }

        // Draw each line of the wrapped text
        for (let lineIndex = 0; lineIndex < locationLines2.length; lineIndex++) {
          pdf.text(locationLines2[lineIndex], x + 5, locationY + lineIndex * lineHeight)
        }
        x += colWidths[3]

        // Driver
        pdf.rect(x, y, colWidths[4], dynamicRowHeight, "S")
        const driverInfo = formatTruckDriverForPDF(entry.truckDriver || "", pdf)
        pdf.setFont("helvetica", "bold")

        // If it's a multi-line driver display (truck + driver name)
        if (driverInfo.text.includes("\n")) {
          const lines = driverInfo.text.split("\n")
          pdf.text(lines[0], x + 5, y + 12) // Truck number
          pdf.setFont("helvetica", "normal")
          pdf.text(lines[1], x + 5, y + 22) // Driver name
        } else {
          pdf.text(truncateText(driverInfo.text, colWidths[4] - 10, pdf), x + 5, y + 15)
        }

        pdf.setFont("helvetica", "normal")
        x += colWidths[4]

        // Materials - with text wrapping
        pdf.rect(x, y, colWidths[5], dynamicRowHeight, "S")
        const materialsText2 = entry.materials || ""
        const wrappedMaterials2 = wrapText(materialsText2, colWidths[5] - 10, pdf)
        const materialsLines2 = wrappedMaterials2.split("\n")
        let materialsY = y + 15
        if (materialsLines2.length > 1) {
          materialsY = y + (dynamicRowHeight - materialsLines2.length * lineHeight) / 2 + lineHeight
        }
        for (let lineIndex = 0; lineIndex < materialsLines2.length; lineIndex++) {
          pdf.text(materialsLines2[lineIndex], x + 5, materialsY + lineIndex * lineHeight)
        }
        x += colWidths[5]

        // Quantity - with text wrapping
        pdf.rect(x, y, colWidths[6], dynamicRowHeight, "S")
        const qtyText = entry.qty || ""
        // Ensure we're using the full width of the column for wrapping
        const wrappedQty = wrapText(qtyText, colWidths[6] - 10, pdf)
        const qtyLines = wrappedQty.split("\n")
        let qtyY = y + dynamicRowHeight / 2 // Center vertically

        // If we have multiple lines, adjust positioning
        if (qtyLines.length === 1) {
          qtyY = y + 15
        } else {
          qtyY = y + (dynamicRowHeight - qtyLines.length * lineHeight) / 2 + lineHeight
        }

        // Draw each line of the wrapped text
        for (let lineIndex = 0; lineIndex < qtyLines.length; lineIndex++) {
          pdf.text(qtyLines[lineIndex], x + 5, qtyY + lineIndex * lineHeight)
        }
        x += colWidths[6]

        // Notes - with text wrapping
        pdf.rect(x, y, colWidths[7], dynamicRowHeight, "S")
        const notesText2 = entry.notes || ""
        const wrappedNotes2 = wrapText(notesText2, colWidths[7] - 10, pdf)
        const notesLines2 = wrappedNotes2.split("\n")
        let notesY = y + 15
        if (notesLines2.length > 1) {
          notesY = y + (dynamicRowHeight - notesLines2.length * lineHeight) / 2 + lineHeight
        }
        for (let lineIndex = 0; lineIndex < notesLines2.length; lineIndex++) {
          pdf.text(notesLines2[lineIndex], x + 5, notesY + lineIndex * lineHeight)
        }

        y += dynamicRowHeight
      }

      // Add space after each truck type section
      y += 20
    }

    // Add page numbers and creation timestamp
    const totalPages = pdf.internal.getNumberOfPages()
    const creationTimestamp = format(new Date(), "MM/dd/yyyy HH:mm:ss")

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(10)
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 80, pageHeight - 20)

      // Add creation timestamp in small font at the bottom
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100) // Gray color
      pdf.text(`Created: ${creationTimestamp}`, margin, pageHeight - 20)
    }

    // Save the PDF
    const dateStr = format(reportDate, "yyyy-MM-dd")
    pdf.save(`${dateStr}.Spallina.Materials.Trucking.Schedule.pdf`)
  } catch (error) {
    console.error("Error generating PDF:", error)
    alert("There was an error generating the PDF. Please try again.")
  }
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string) {
  // Remove # if present
  hex = hex.replace(/^#/, "")

  // Parse the hex values
  const bigint = Number.parseInt(hex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255

  return { r, g, b }
}

// Helper function to truncate text that's too long for a cell
function truncateText(text: string, maxWidth: number, pdf: jsPDF): string {
  if (!text) return ""

  const textWidth = (pdf.getStringUnitWidth(text) * 10) / pdf.internal.scaleFactor

  if (textWidth <= maxWidth) {
    return text
  }

  // Truncate the text
  let truncated = text
  while ((pdf.getStringUnitWidth(truncated + "...") * 10) / pdf.internal.scaleFactor > maxWidth) {
    truncated = truncated.slice(0, -1)
    if (truncated.length <= 3) {
      return "..."
    }
  }

  return truncated + "..."
}

// Helper function to wrap text that's too long for a cell
function wrapText(text: string, maxWidth: number, pdf: jsPDF): string {
  if (!text) return ""

  const words = text.split(" ")
  let lines: string[] = []
  let currentLine = ""

  // Process each word
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = (pdf.getStringUnitWidth(testLine) * 10) / pdf.internal.scaleFactor

    if (testWidth <= maxWidth) {
      // Word fits on current line
      currentLine = testLine
    } else {
      // Word doesn't fit, start a new line
      if (currentLine) {
        lines.push(currentLine)
      }
      // If the word itself is too long, truncate it
      if ((pdf.getStringUnitWidth(word) * 10) / pdf.internal.scaleFactor > maxWidth) {
        currentLine = truncateText(word, maxWidth, pdf)
      } else {
        currentLine = word
      }
    }
  }

  // Add the last line
  if (currentLine) {
    lines.push(currentLine)
  }

  // Limit to 3 lines maximum to avoid excessive height
  if (lines.length > 3) {
    lines = lines.slice(0, 3)
    const lastLine = lines[2]
    lines[2] = truncateText(lastLine, maxWidth - 15, pdf) + "..."
  }

  return lines.join("\n")
}
