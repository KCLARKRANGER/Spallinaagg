"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScheduleReport } from "@/components/schedule-report"
import { DebugPanel } from "@/components/debug-panel"
import { processExcelFile, mergeScheduleData } from "@/lib/excel-processor"
import type { ScheduleData } from "@/types/schedule"
import { Upload, Eye, EyeOff, Bug, RefreshCw, FileText } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScheduleSummary } from "@/components/schedule-summary"
import { DriverAssignmentHelper } from "@/components/driver-assignment-helper"

export function ScheduleUploader() {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [rawData, setRawData] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fileNames, setFileNames] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)
    setError(null)

    // Store file names
    const names = Array.from(files).map((file) => file.name)
    setFileNames(names)
    setShowPreview(true)

    try {
      // Process each file and merge the data
      let mergedData: ScheduleData | null = null
      const rawDataArray: any[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const data = await processExcelFile(file)

        if (!mergedData) {
          mergedData = data
        } else {
          mergedData = mergeScheduleData(mergedData, data)
        }

        // Store raw data for debugging
        if (file.name.toLowerCase().endsWith(".csv")) {
          const reader = new FileReader()
          const csvContent = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsText(file)
          })

          rawDataArray.push({ fileName: file.name, rawContent: csvContent })
        }
      }

      if (rawDataArray.length > 0) {
        setRawData(rawDataArray)
      }

      if (mergedData) {
        setScheduleData(mergedData)
      }
    } catch (error) {
      console.error("Error processing files:", error)
      setError("Error processing files. Please make sure they are valid Excel or CSV files.")
    } finally {
      setIsLoading(false)
    }
  }

  const togglePreview = () => {
    setShowPreview(!showPreview)
  }

  const toggleDebug = () => {
    setShowDebug(!showDebug)
  }

  const handleClear = () => {
    setScheduleData(null)
    setRawData(null)
    setFileNames([])
    setError(null)
    setShowPreview(true)
    setShowDebug(false)

    // Reset the file input
    const fileInput = document.getElementById("file-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const handleDriverAssignment = (updatedSchedule: ScheduleData) => {
    setScheduleData(updatedSchedule)
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          {fileNames.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mb-4">Excel or CSV files</p>
              <Button onClick={() => document.getElementById("file-upload")?.click()} disabled={isLoading}>
                {isLoading ? "Processing..." : "Select Files"}
              </Button>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                multiple
              />
            </div>
          ) : (
            <div className="flex flex-col p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm mb-2">
                    Selected files: <span className="font-medium">{fileNames.length}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {fileNames.map((name, index) => (
                      <Badge key={index} variant="outline" className="flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline" onClick={handleClear}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                multiple
              />
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {scheduleData && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Schedule Report</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={togglePreview}>
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Preview
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={toggleDebug}>
                <Bug className="h-4 w-4 mr-2" />
                {showDebug ? "Hide Debug" : "Show Debug"}
              </Button>
            </div>
          </div>

          {showPreview && scheduleData && (
            <>
              <ScheduleSummary data={scheduleData} />

              <DriverAssignmentHelper scheduleData={scheduleData} onAssignDrivers={handleDriverAssignment} />
            </>
          )}

          {showPreview ? (
            <>
              <ScheduleReport data={scheduleData} />
              {showDebug && rawData && <DebugPanel data={rawData} />}
              {showDebug && <DebugPanel data={scheduleData} />}
            </>
          ) : (
            <Alert>
              <AlertTitle>Preview Hidden</AlertTitle>
              <AlertDescription>Click "Show Preview" to view the report before exporting.</AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  )
}
