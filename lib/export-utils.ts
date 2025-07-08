import jsPDF from "jspdf"
import type { ScheduleData } from "@/types/schedule"
import { format } from "date-fns"
import { convertTo24HourFormat, addMinutesToTimeString } from "@/lib/time-utils"

// SPALLINA trucks that get offset
const SPALLINA_FLEET_TRUCKS = [
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
  "MMH06",
  "MMH6",
  "MMH08",
  "MMH8",
  "SPA106",
  "SPA107",
  "SPA108",
  "SPA110",
  "SPA111",
  "SPA112",
  "SPA114",
  "SPA33",
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

function isContractorTruck(truckDriver: string): boolean {
  if (!truckDriver || truckDriver.trim() === "" || truckDriver === "TBD") {
    return false
  }
  const cleanName = truckDriver.trim().toUpperCase()
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
    "SNOW6",
    "SNOW7",
    "SICK",
    "YORK",
  ]
  return contractorTrucks.includes(cleanName) || cleanName.startsWith("CONTRACTOR") || cleanName.startsWith("*")
}

function isSpallinaTruck(truckDriver: string): boolean {
  if (isContractorTruck(truckDriver)) return false
  const cleanTruckName = truckDriver.replace(/^\*/, "").trim()
  if (!cleanTruckName || cleanTruckName === "TBD") return false
  return SPALLINA_FLEET_TRUCKS.includes(cleanTruckName)
}

interface SummaryData {
  unassignedSummary: Record<string, number>
  totalUnassigned: number
  totalOrders: number
}

interface DriverSummaryItem {
  name: string
  truckNumber: string
  time: string
}

// Function to load image with CORS handling
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

export async function openPDFInNewWindow(pdfBlob: Blob, filename: string) {
  const pdfUrl = URL.createObjectURL(pdfBlob)
  const printWindow = window.open(pdfUrl, "_blank")
  if (!printWindow) {
    const a = document.createElement("a")
    a.href = pdfUrl
    a.download = `${filename}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } else {
    printWindow.addEventListener("load", () => {
      setTimeout(() => printWindow.print(), 1000)
    })
  }
}

// Enhanced table drawing function with section title in header
function drawTable(
  pdf: jsPDF,
  startY: number,
  sectionTitle: string,
  headers: string[],
  rows: string[][],
  columnWidths: number[],
): number {
  const margin = 15
  const baseRowHeight = 6
  const headerHeight = 8
  const sectionHeaderHeight = 10
  let currentY = startY

  // Draw section title header (black background)
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "bold")
  pdf.setFillColor(0, 0, 0) // Black background
  pdf.setTextColor(255, 255, 255) // White text

  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0)
  pdf.rect(margin, currentY, totalWidth, sectionHeaderHeight, "F")
  pdf.text(sectionTitle, margin + 5, currentY + 7)
  currentY += sectionHeaderHeight

  // Draw column headers
  pdf.setFontSize(8)
  pdf.setFillColor(220, 220, 220) // Light gray background
  pdf.setTextColor(0, 0, 0) // Black text

  let currentX = margin
  headers.forEach((header, i) => {
    pdf.rect(currentX, currentY, columnWidths[i], headerHeight, "FD")
    pdf.text(header, currentX + 2, currentY + 5)
    currentX += columnWidths[i]
  })
  currentY += headerHeight

  // Draw rows with proper text wrapping
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7)
  pdf.setFillColor(255, 255, 255)

  rows.forEach((row) => {
    // Calculate row height based on text wrapping
    let maxLines = 1
    const wrappedTexts: string[][] = []

    row.forEach((cell, i) => {
      const cellText = cell || ""
      if (cellText.length > 0) {
        const splitText = pdf.splitTextToSize(cellText, columnWidths[i] - 4)
        wrappedTexts[i] = Array.isArray(splitText) ? splitText : [splitText]
        maxLines = Math.max(maxLines, wrappedTexts[i].length)
      } else {
        wrappedTexts[i] = [""]
      }
    })

    const rowHeight = Math.max(baseRowHeight, maxLines * 4 + 2)

    // Check if we need a new page
    if (currentY + rowHeight > pdf.internal.pageSize.height - 20) {
      pdf.addPage()
      currentY = 20

      // Redraw section title header on new page
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "bold")
      pdf.setFillColor(0, 0, 0)
      pdf.setTextColor(255, 255, 255)
      pdf.rect(margin, currentY, totalWidth, sectionHeaderHeight, "F")
      pdf.text(`${sectionTitle} (Continued)`, margin + 5, currentY + 7)
      currentY += sectionHeaderHeight

      // Redraw column headers
      pdf.setFontSize(8)
      pdf.setFillColor(220, 220, 220)
      pdf.setTextColor(0, 0, 0)

      currentX = margin
      headers.forEach((header, i) => {
        pdf.rect(currentX, currentY, columnWidths[i], headerHeight, "FD")
        pdf.text(header, currentX + 2, currentY + 5)
        currentX += columnWidths[i]
      })
      currentY += headerHeight

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(7)
      pdf.setFillColor(255, 255, 255)
    }

    // Draw the row with wrapped text
    currentX = margin
    row.forEach((cell, i) => {
      pdf.rect(currentX, currentY, columnWidths[i], rowHeight, "D")

      // Draw wrapped text
      const textLines = wrappedTexts[i] || [""]
      textLines.forEach((line, lineIndex) => {
        if (line && lineIndex < 3) {
          // Limit to 3 lines max per cell
          pdf.text(line, currentX + 2, currentY + 4 + lineIndex * 4)
        }
      })

      currentX += columnWidths[i]
    })
    currentY += rowHeight
  })

  return currentY
}

async function generatePDF(
  data: ScheduleData,
  reportDate: Date,
  summaryData: any,
  dispatcherNotes: string,
  driverSummaryEntries: Array<{ name: string; truckNumber: string; time: string }>,
) {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = pdf.internal.pageSize.width
  const pageHeight = pdf.internal.pageSize.height
  const margin = 15
  const generatedTimestamp = format(new Date(), "MM/dd/yyyy HH:mm:ss")

  // Load logo once at the beginning
  let logoImg: HTMLImageElement | null = null
  try {
    logoImg = await loadImage("/images/spallina-logo.jpg")
  } catch (error) {
    console.warn("Could not load logo image:", error)
  }

  // Add logo and timestamp to first page
  if (logoImg) {
    const logoWidth = 60
    const logoHeight = 20
    const logoX = pageWidth - logoWidth - margin
    const logoY = 5
    pdf.addImage(logoImg, "JPEG", logoX, logoY, logoWidth, logoHeight)
  }

  // Add timestamp at top left
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(100, 100, 100)
  pdf.text(`Generated: ${generatedTimestamp}`, margin, 10)

  // Document header
  pdf.setFontSize(18)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(0, 0, 0)
  pdf.text("Spallina Materials Trucking Schedule", margin, 20)

  pdf.setFontSize(14)
  pdf.text(format(reportDate, "EEEE, MMMM d, yyyy"), margin, 27)

  pdf.setFontSize(10)
  pdf.setFont("helvetica", "italic")
  pdf.text("Note: Contractors are marked with an asterisk (*)", margin, 35)

  let currentY = 40

  // Dispatcher notes
  if (dispatcherNotes && dispatcherNotes.trim()) {
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("DISPATCHER NOTES:", margin, currentY)
    currentY += 6

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    const splitNotes = pdf.splitTextToSize(dispatcherNotes, pageWidth - 30)
    pdf.text(splitNotes, margin, currentY)
    currentY += splitNotes.length * 5 + 8
  }

  // OPTIMIZED column widths to fit everything on page
  const columnWidths = [40, 14, 14, 50, 20, 32, 18, 10, 10, 32]
  const headers = [
    "Job Name",
    "Start Time",
    "Load Time",
    "Location",
    "Driver",
    "Materials",
    "Pit",
    "Qty",
    "# Trucks",
    "Notes",
  ]

  // Sort truck types
  const truckTypeOrder = ["ASPHALT", "Dump Truck", "Slinger", "Trailer", "Triaxle", "6 Wheeler", "Mixer", "Conveyor"]
  const sortedTruckTypes = Object.keys(data.byTruckType || {}).sort((a, b) => {
    const aIndex = truckTypeOrder.indexOf(a)
    const bIndex = truckTypeOrder.indexOf(b)
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return a.localeCompare(b)
  })

  // Process each truck type
  for (const truckType of sortedTruckTypes) {
    const entries = data.byTruckType?.[truckType] || []
    if (entries.length === 0) continue

    // Sort entries by load time
    const sortedEntries = entries.sort((a, b) => {
      const timeA = a.time || ""
      const timeB = b.time || ""
      return timeA.localeCompare(timeB)
    })

    // Check if we need a new page for this section
    const estimatedHeight = 20 + sortedEntries.length * 8 + 20 // section header + rows + buffer
    if (currentY + estimatedHeight > pdf.internal.pageSize.height - 20) {
      pdf.addPage()
      currentY = 20
    }

    // Prepare table data
    const tableData = sortedEntries.map((entry) => {
      let showUpTime = entry.showUpTime || ""
      const displayTime = entry.time || ""

      if (!showUpTime && displayTime) {
        const isSpallinaFleetTruck = isSpallinaTruck(entry.truckDriver)
        if (isSpallinaFleetTruck) {
          const offset = entry.showUpOffset ? Number.parseInt(entry.showUpOffset, 10) : 15
          const formattedTime = convertTo24HourFormat(displayTime)
          if (formattedTime) {
            showUpTime = addMinutesToTimeString(formattedTime, -offset)
          }
        } else {
          showUpTime = convertTo24HourFormat(displayTime) || displayTime
        }
      }

      let jobNameDisplay = entry.jobName || ""
      if (entry.shift && entry.shift.trim()) {
        jobNameDisplay += ` (${entry.shift})`
      }

      let driverDisplay = entry.truckDriver || ""
      if (isContractorTruck(entry.truckDriver)) {
        driverDisplay = `*${entry.truckDriver}`
      }

      return [
        jobNameDisplay,
        convertTo24HourFormat(showUpTime) || "",
        convertTo24HourFormat(displayTime) || "",
        entry.location || "",
        driverDisplay,
        entry.materials || "",
        entry.pit || "",
        entry.qty || "",
        entry.numTrucks || "1",
        entry.notes || "",
      ]
    })

    // Draw the table with section title in header
    currentY = drawTable(pdf, currentY, `${truckType} Schedule`, headers, tableData, columnWidths)
    currentY += 5 // Small gap between sections
  }

  // Generate driver summary data from all entries
  const uniqueTrucks = new Map<string, { name: string; truckNumber: string; time: string }>()

  // Process all entries to build driver summary
  data.allEntries?.forEach((entry) => {
    if (entry.truckDriver && entry.truckDriver !== "TBD" && entry.truckDriver.trim() !== "") {
      // Calculate start time
      let startTime = entry.showUpTime || ""
      const displayTime = entry.time || ""

      if (!startTime && displayTime) {
        const isSpallinaFleetTruck = isSpallinaTruck(entry.truckDriver)
        if (isSpallinaFleetTruck) {
          const offset = entry.showUpOffset ? Number.parseInt(entry.showUpOffset, 10) : 15
          const formattedTime = convertTo24HourFormat(displayTime)
          if (formattedTime) {
            startTime = addMinutesToTimeString(formattedTime, -offset)
          }
        } else {
          startTime = convertTo24HourFormat(displayTime) || displayTime
        }
      }

      const formattedStartTime = convertTo24HourFormat(startTime) || ""

      // Only add if we don't have this truck yet, or if this entry has an earlier time
      const existingEntry = uniqueTrucks.get(entry.truckDriver)
      if (!existingEntry || (formattedStartTime && formattedStartTime < existingEntry.time)) {
        uniqueTrucks.set(entry.truckDriver, {
          name: entry.jobName || "",
          truckNumber: entry.truckDriver,
          time: formattedStartTime,
        })
      }
    }
  })

  // Convert to array and sort by time
  const uniqueDriverEntries = Array.from(uniqueTrucks.values()).sort((a, b) => {
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time.localeCompare(b.time)
  })

  // Driver summary on new page
  if (uniqueDriverEntries.length > 0) {
    pdf.addPage()

    // Add logo and timestamp to driver summary page
    if (logoImg) {
      const logoWidth = 60
      const logoHeight = 20
      const logoX = pageWidth - logoWidth - margin
      const logoY = 5
      pdf.addImage(logoImg, "JPEG", logoX, logoY, logoWidth, logoHeight)
    }

    pdf.setFontSize(8)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Generated: ${generatedTimestamp}`, margin, 10)

    pdf.setFontSize(18)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    pdf.text("Spallina Materials Trucking Schedule", margin, 20)

    pdf.setFontSize(14)
    pdf.text(format(reportDate, "EEEE, MMMM d, yyyy"), margin, 27)

    currentY = 35

    // Driver summary table
    const driverHeaders = ["Driver/Truck", "First Task", "Start Time"]
    const driverColumnWidths = [40, 80, 30]

    const driverTableData = uniqueDriverEntries.map((entry) => {
      let driverDisplay = entry.truckNumber
      if (isContractorTruck(entry.truckNumber)) {
        driverDisplay = `*${entry.truckNumber}`
      }

      return [driverDisplay, entry.name, entry.time]
    })

    drawTable(pdf, currentY, "Spallina Drivers Summary", driverHeaders, driverTableData, driverColumnWidths)
  }

  // Add page numbers to all pages
  const totalPages = pdf.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" })
  }

  return pdf
}

export async function exportToPDF(
  data: ScheduleData,
  filename: string,
  reportDate: Date,
  summaryData: SummaryData,
  dispatcherNotes: string,
  driverSummaryEntries: DriverSummaryItem[],
) {
  const pdf = await generatePDF(data, reportDate, summaryData, dispatcherNotes, driverSummaryEntries)
  pdf.save(`${filename}.pdf`)
}

export async function exportToPDFForPrint(
  data: ScheduleData,
  filename: string,
  reportDate: Date,
  summaryData: SummaryData,
  dispatcherNotes: string,
  driverSummaryEntries: DriverSummaryItem[],
) {
  const pdf = await generatePDF(data, reportDate, summaryData, dispatcherNotes, driverSummaryEntries)
  const pdfBlob = pdf.output("blob")
  await openPDFInNewWindow(pdfBlob, filename)
}
