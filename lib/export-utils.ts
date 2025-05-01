import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { ScheduleEntry } from "@/types/schedule"
import { format } from "date-fns"

// Define ScheduleData type
interface ScheduleData {
  scheduleEntries?: ScheduleEntry[]
  byTruckType?: Record<string, ScheduleEntry[]>
  allEntries?: ScheduleEntry[]
}

// Define TruckType type
type TruckType = "Trailer" | "Dump Truck" | "Slinger" | "Asphalt" | "Standard Mixer" | "Conveyor" | string

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

// Helper function to add minutes to a time string in HH:MM format
function addMinutesToTimeString(time: string, minutesToAdd: number): string {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time)) {
    return time // Return original if invalid format
  }

  try {
    const [hoursStr, minutesStr] = time.split(":")
    let hours = Number.parseInt(hoursStr, 10)
    let minutes = Number.parseInt(minutesStr, 10)

    minutes += minutesToAdd

    while (minutes >= 60) {
      minutes -= 60
      hours += 1
    }

    while (minutes < 0) {
      minutes += 60
      hours -= 1
    }

    hours = (hours + 24) % 24 // Keep within 0-23 range

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  } catch (e) {
    console.error("Error adding minutes to time:", e)
    return time // Return original on error
  }
}

// Export to PDF function
export function exportToPDF(
  data: ScheduleData,
  fileName: string,
  reportDate: Date | undefined = new Date(),
  summaryData?: {
    unassignedSummary: Record<TruckType, number>
    totalUnassigned: number
    totalOrders: number
  },
  dispatcherNotes?: string,
  driverSummary?: Array<{ name: string; time: string; truckNumber: string }>,
) {
  try {
    console.log("Starting PDF export with report date:", reportDate)

    // Log a sample of the data to verify time values
    if (data.byTruckType) {
      const sampleType = Object.keys(data.byTruckType)[0]
      if (sampleType && data.byTruckType[sampleType].length > 0) {
        const sampleEntry = data.byTruckType[sampleType][0]
        console.log("Sample entry for PDF:", {
          jobName: sampleEntry.jobName,
          time: sampleEntry.time,
          date: sampleEntry.date,
          showUpTime: sampleEntry.showUpTime,
          formattedTime: convertTo24HourFormat(sampleEntry.time || ""),
          formattedShowUpTime: convertTo24HourFormat(sampleEntry.showUpTime || ""),
        })
      }
    }

    // Ensure reportDate is a valid Date object
    let validReportDate = new Date()
    if (reportDate instanceof Date && !isNaN(reportDate.getTime())) {
      validReportDate = reportDate
    }

    console.log("Using report date:", validReportDate)

    // Format the date for display
    const dateText = format(validReportDate, "MMMM d, yyyy")
    console.log("Formatted date text:", dateText)

    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "letter",
    })

    // Define page dimensions and margins
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 40 // 0.5 inch margin

    // Set initial y position
    let y = margin

    // Add title and date
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    const title = "Spallina Materials Trucking Scheduler"
    const titleWidth = (doc.getStringUnitWidth(title) * 18) / doc.internal.scaleFactor
    doc.text(title, (pageWidth - titleWidth) / 2, y)
    y += 25

    // Add dispatcher notes if provided
    if (dispatcherNotes && dispatcherNotes.trim()) {
      y += 10
      doc.setFontSize(12)
      doc.setFont("helvetica", "bolditalic")
      const notesWidth = (doc.getStringUnitWidth(dispatcherNotes) * 12) / doc.internal.scaleFactor
      doc.text(dispatcherNotes, (pageWidth - notesWidth) / 2, y)
      y += 20
    }

    // Add date
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    const dateWidth = (doc.getStringUnitWidth(dateText) * 12) / doc.internal.scaleFactor
    doc.text(dateText, (pageWidth - dateWidth) / 2, y)

    y += 30

    // Check if we have byTruckType or allEntries
    if (!data.byTruckType && !data.allEntries) {
      throw new Error("Invalid data structure: missing byTruckType and allEntries")
    }

    // Use the correct data structure based on what's available
    const groupedData = data.byTruckType || {}

    // Filter out "Undefined" truck type from PDF export
    if (groupedData["Undefined"]) {
      console.log(`Removing ${groupedData["Undefined"].length} undefined truck type entries from PDF export`)
      delete groupedData["Undefined"]
    }

    // Then continue with sorting the remaining truck types
    // Sort truck types (Dump Truck, Slinger, Tractor Trailer, etc.)
    const sortedTruckTypes = Object.keys(groupedData).sort((a, b) => {
      // Put "Undefined" at the end
      if (a === "Undefined") return 1
      if (b === "Undefined") return -1
      return a.localeCompare(b)
    })

    // Get current timestamp for footer
    const timestamp = format(new Date(), "MM/dd/yyyy hh:mm a")
    console.log("Using timestamp for footer:", timestamp)

    // Process each truck type
    sortedTruckTypes.forEach((truckType, typeIndex) => {
      const entries = groupedData[truckType]
      console.log(`Processing truck type: ${truckType} with ${entries.length} entries`)

      // Sort entries by shift priority and then by time
      entries.sort((a, b) => {
        // First sort by shift priority
        const shiftOrder = { "1st": 1, "2nd": 2, Scheduled: 3, Any: 4 }
        const aShiftPriority = shiftOrder[a.shift as keyof typeof shiftOrder] || 5
        const bShiftPriority = shiftOrder[b.shift as keyof typeof shiftOrder] || 5

        if (aShiftPriority !== bShiftPriority) {
          return aShiftPriority - bShiftPriority
        }

        // Then sort by time
        return (a.time || "").localeCompare(b.time || "")
      })

      // Add section title for truck type
      if (typeIndex > 0) {
        y += 10 // Add space between sections
      }

      // Check if we need a new page
      if (y > 700) {
        doc.addPage()
        y = 20
      }

      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text(`${truckType} Schedule`, 14, y)
      y += 20 // Increase space after title

      // Prepare table data
      const tableData = entries.map((entry) => {
        // Extract time from date if time is not available
        let displayTime = entry.time
        if (!displayTime && entry.date) {
          const dateTimeMatch = entry.date.match(/(\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?)/i)
          if (dateTimeMatch) {
            displayTime = dateTimeMatch[1]
          }
        }

        // Calculate show-up time if not available
        let showUpTime = entry.showUpTime || ""
        if (!showUpTime && displayTime) {
          const offset = Number(entry.showUpOffset || "15")
          showUpTime = addMinutesToTimeString(convertTo24HourFormat(displayTime), -offset)
        }

        // Log the values for debugging
        console.log(
          `PDF Entry: ${entry.jobName}, Driver: ${entry.truckDriver}, ShowUpTime: ${showUpTime}, Load: ${displayTime}`,
        )

        // Ensure we're using the formatted times
        const formattedStartTime = convertTo24HourFormat(showUpTime)
        const formattedLoadTime = convertTo24HourFormat(displayTime || "")

        return [
          entry.jobName || "",
          formattedStartTime || "",
          formattedLoadTime || "",
          entry.location || "",
          entry.truckDriver || "",
          entry.materials || "",
          entry.pit || "",
          entry.qty || "",
          entry.numTrucks || "1",
          entry.notes || "",
        ]
      })

      // Define table headers
      const tableHeaders = [
        "Job Name",
        "Start Time",
        "Load Time",
        "Location",
        "Driver",
        "Materials",
        "Pit Location",
        "Quantity",
        "# Trucks",
        "Notes",
      ]

      // Use autoTable directly
      autoTable(doc, {
        startY: y,
        head: [tableHeaders],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: "auto" }, // Job Name
          1: { cellWidth: 40 }, // Start Time
          2: { cellWidth: 40 }, // Load Time
          3: { cellWidth: "auto" }, // Location
          4: { cellWidth: 60 }, // Driver
          5: { cellWidth: "auto" }, // Materials
          6: { cellWidth: 60 }, // Pit Location
          7: { cellWidth: 40 }, // Quantity
          8: { cellWidth: 40 }, // # Trucks
          9: { cellWidth: "auto" }, // Notes
        },
        didDrawPage: (data) => {
          // Add page number at the bottom (not bold)
          const pageCount = doc.getNumberOfPages()
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal") // Ensure normal (not bold) font
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" })

          // Add timestamp at the bottom left
          doc.text(timestamp, margin, pageHeight - 10)
        },
      })

      // Update Y position after table
      y = (doc as any).lastAutoTable.finalY + 20
    })

    // Add driver summary if provided
    if (driverSummary && driverSummary.length > 0) {
      // Add a new page for the driver summary
      doc.addPage()
      y = margin

      // Add title
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      const summaryTitle = "Spallina Drivers Summary"
      const summaryTitleWidth = (doc.getStringUnitWidth(summaryTitle) * 16) / doc.internal.scaleFactor
      doc.text(summaryTitle, (pageWidth - summaryTitleWidth) / 2, y)
      y += 20

      // Define table headers
      const headers = ["Driver Name", "Truck #", "Show-up Time"]

      // Prepare table data
      const tableData = driverSummary.map((driver) => [driver.name, driver.truckNumber, driver.time])

      // Use autoTable for the driver summary
      autoTable(doc, {
        startY: y,
        head: [headers],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: "auto" }, // Driver Name
          1: { cellWidth: "auto" }, // Truck #
          2: { cellWidth: "auto" }, // Show-up Time
        },
        didDrawPage: (data) => {
          // Add page number at the bottom
          const pageCount = doc.getNumberOfPages()
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" })

          // Add timestamp at the bottom left
          doc.text(timestamp, margin, pageHeight - 10)
        },
      })
    }

    // Save the PDF
    doc.save(`${fileName}.pdf`)
    console.log("PDF saved successfully")
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw error // Re-throw to allow caller to handle
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

  // Limit to 5 lines maximum for notes to show more content
  if (lines.length > 5) {
    lines = lines.slice(0, 5)
    const lastLine = lines[4]
    lines[4] = truncateText(lastLine, maxWidth - 15, pdf) + "..."
  }

  return lines.join("\n")
}
