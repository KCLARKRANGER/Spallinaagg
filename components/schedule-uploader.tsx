"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { processExcelFile } from "@/lib/excel-processor"
import type { ScheduleData } from "@/types/schedule"

interface ScheduleUploaderProps {
  onDataProcessed: (data: ScheduleData) => void
}

export function ScheduleUploader({ onDataProcessed }: ScheduleUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [processedData, setProcessedData] = useState<ScheduleData | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setIsProcessing(true)
      setStatus("processing")
      setProgress(0)
      setErrorMessage("")

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 200)

        // Process the file
        const data = await processExcelFile(file)

        clearInterval(progressInterval)
        setProgress(100)

        setProcessedData(data)
        setStatus("success")

        // Ensure onDataProcessed is a function before calling it
        if (typeof onDataProcessed === "function") {
          onDataProcessed(data)
        } else {
          console.error("onDataProcessed is not a function:", typeof onDataProcessed)
        }
      } catch (error) {
        console.error("Error processing file:", error)
        setStatus("error")
        setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred")
      } finally {
        setIsProcessing(false)
      }
    },
    [onDataProcessed],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: false,
    disabled: isProcessing,
  })

  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Upload className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case "processing":
        return "Processing schedule file..."
      case "success":
        return `Successfully processed ${processedData?.allEntries?.length || 0} schedule entries`
      case "error":
        return `Error: ${errorMessage}`
      default:
        return "Upload Excel or CSV file to get started"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Schedule File Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
            ${isProcessing ? "cursor-not-allowed opacity-50" : ""}
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="flex justify-center">{getStatusIcon()}</div>
            <div>
              <p className="text-lg font-medium">
                {isDragActive ? "Drop the file here" : "Drag & drop your schedule file"}
              </p>
              <p className="text-sm text-gray-500 mt-1">{getStatusMessage()}</p>
            </div>
            {!isProcessing && (
              <Button variant="outline" className="mt-4 bg-transparent">
                Choose File
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Status Alert */}
        {status !== "idle" && (
          <Alert
            className={
              status === "success"
                ? "border-green-200 bg-green-50"
                : status === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-blue-200 bg-blue-50"
            }
          >
            <AlertDescription className="flex items-center gap-2">
              {getStatusIcon()}
              {getStatusMessage()}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Summary */}
        {status === "success" && processedData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{processedData.allEntries?.length || 0}</div>
              <div className="text-sm text-green-600">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(processedData.byTruckType || {}).length}
              </div>
              <div className="text-sm text-green-600">Truck Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {processedData.allEntries?.filter((e) => e.truckDriver && e.truckDriver !== "TBD").length || 0}
              </div>
              <div className="text-sm text-green-600">Assigned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {processedData.allEntries?.filter((e) => !e.truckDriver || e.truckDriver === "TBD").length || 0}
              </div>
              <div className="text-sm text-orange-600">Unassigned</div>
            </div>
          </div>
        )}

        {/* Truck Type Breakdown */}
        {status === "success" && processedData && (
          <div className="space-y-2">
            <h4 className="font-medium">Truck Types Found:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(processedData.byTruckType || {}).map(([type, entries]) => (
                <Badge key={type} variant="secondary">
                  {type}: {entries.length}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Supported Formats */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>Supported formats:</strong> Excel (.xlsx, .xls), CSV (.csv)
          </p>
          <p>
            <strong>Expected columns:</strong> Task Name, Truck Type, Drivers Assigned, Due Date, Location, etc.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
