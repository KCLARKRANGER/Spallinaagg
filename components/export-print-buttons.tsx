"use client"

import { Button } from "@/components/ui/button"
import { Printer, Download } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import type { ScheduleData } from "@/types/schedule"
import { format } from "date-fns"

interface ExportPrintButtonsProps {
  data: ScheduleData
  reportDate: Date
  dispatcherNotes: string
}

export function ExportPrintButtons({ data, reportDate, dispatcherNotes }: ExportPrintButtonsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  // Handle export to PDF
  const handleExportToPDF = async () => {
    try {
      setIsExporting(true)

      // Format the date string for filename (no spaces or special chars)
      const filenameDateString = format(reportDate, "yyyy-MM-dd")
      const filename = `Spallina-Trucking-Schedule-${filenameDateString}`

      // Import the export function
      const { exportToPDF } = await import("@/lib/export-utils")

      // Prepare summary data
      const summaryData = {
        unassignedSummary: {} as Record<string, number>,
        totalUnassigned: 0,
        totalOrders: data.allEntries?.length || 0,
      }

      // Calculate unassigned entries by truck type
      const unassignedEntries = data.allEntries?.filter((entry) => entry.truckDriver === "TBD") || []
      unassignedEntries.forEach((entry) => {
        const type = entry.truckType || "Undefined"
        summaryData.unassignedSummary[type] = (summaryData.unassignedSummary[type] || 0) + 1
        summaryData.totalUnassigned++
      })

      // Prepare driver summary data (empty array since we handle it in the export function)
      const driverSummary: any[] = []

      // Call the export function
      await exportToPDF(data, filename, reportDate, summaryData, dispatcherNotes, driverSummary)

      toast({
        title: "PDF exported successfully",
        description: `Schedule exported as ${filename}.pdf`,
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting the PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Handle print with completely fixed styles
  const handlePrint = () => {
    // Create a new window for printing with only the schedule content
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    // Get the schedule content
    const scheduleContent = document.querySelector(".schedule-print-content")
    if (!scheduleContent) {
      toast({
        title: "Print failed",
        description: "Could not find schedule content to print.",
        variant: "destructive",
      })
      return
    }

    // Create the print document
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spallina Materials Trucking Schedule - ${format(reportDate, "MMMM d, yyyy")}</title>
          <style>
            @page {
              size: landscape;
              margin: 0.5in;
            }
            
            * {
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif !important;
              font-size: 12pt !important;
              line-height: 1.3 !important;
              color: black !important;
              margin: 0;
              padding: 0;
              background: white;
            }
            
            .print-header {
              text-align: center;
              margin-bottom: 20pt;
              page-break-after: avoid;
            }
            
            .print-header h1 {
              font-size: 20pt !important;
              font-weight: bold !important;
              margin: 0 0 8pt 0;
              text-transform: uppercase;
            }
            
            .print-header h2 {
              font-size: 16pt !important;
              font-weight: bold !important;
              margin: 0 0 12pt 0;
              text-transform: uppercase;
            }
            
            .dispatcher-notes {
              margin-bottom: 16pt;
              padding: 8pt;
              border: 2pt solid black;
              background-color: #f5f5f5;
            }
            
            .dispatcher-notes h3 {
              font-size: 14pt !important;
              font-weight: bold !important;
              margin: 0 0 6pt 0;
            }
            
            .dispatcher-notes p {
              font-size: 12pt !important;
              margin: 0;
            }
            
            .truck-section {
              page-break-inside: avoid;
              margin-bottom: 16pt;
            }
            
            .truck-header {
              font-size: 16pt !important;
              font-weight: bold !important;
              background-color: #d0d0d0 !important;
              padding: 8pt !important;
              margin: 0 0 4pt 0 !important;
              border: 2pt solid black !important;
              text-transform: uppercase !important;
              text-align: center;
            }
            
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin-bottom: 12pt !important;
              font-size: 11pt !important;
              page-break-inside: avoid !important;
            }
            
            th {
              background-color: #c0c0c0 !important;
              font-weight: bold !important;
              font-size: 12pt !important;
              padding: 6pt !important;
              border: 2pt solid black !important;
              text-align: center !important;
              text-transform: uppercase !important;
            }
            
            td {
              border: 1pt solid black !important;
              padding: 4pt !important;
              vertical-align: top !important;
              font-size: 11pt !important;
            }
            
            .time-column {
              font-weight: bold !important;
              font-size: 12pt !important;
              text-align: center !important;
              background-color: #f8f8f8 !important;
            }
            
            .driver-column {
              font-weight: bold !important;
              text-align: center !important;
            }
            
            .contractor-indicator {
              color: red !important;
              font-weight: bold !important;
            }
            
            .driver-summary {
              page-break-before: always !important;
            }
            
            .driver-summary .truck-header {
              background-color: #b0b0b0 !important;
              font-size: 18pt !important;
            }
            
            .driver-summary table {
              font-size: 12pt !important;
            }
            
            .driver-summary th {
              font-size: 14pt !important;
            }
            
            .driver-summary td {
              font-size: 12pt !important;
              padding: 6pt !important;
            }
            
            tr {
              page-break-inside: avoid !important;
            }
            
            thead {
              display: table-header-group !important;
            }
            
            .page-break {
              page-break-before: always !important;
            }
          </style>
        </head>
        <body>
          ${scheduleContent.innerHTML}
        </body>
      </html>
    `

    printWindow.document.write(printDocument)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleExportToPDF} disabled={isExporting}>
        <Download className="h-4 w-4 mr-2" />
        {isExporting ? "Exporting..." : "Export PDF"}
      </Button>
      <Button variant="outline" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>
    </div>
  )
}
