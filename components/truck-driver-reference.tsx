"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, RefreshCw, CheckCircle, Truck, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export interface TruckDriverData {
  trucks: TruckInfo[]
  drivers: DriverInfo[]
}

export interface TruckInfo {
  id: string
  type: string
  status: "active" | "maintenance" | "inactive"
  capacity?: string
  notes?: string
}

export interface DriverInfo {
  id: string
  name: string
  status: "active" | "off" | "unavailable"
  preferredTruckTypes?: string[]
  certifications?: string[]
  notes?: string
}

interface TruckDriverReferenceProps {
  onDataLoaded: (data: TruckDriverData) => void
}

export function TruckDriverReference({ onDataLoaded }: TruckDriverReferenceProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [referenceData, setReferenceData] = useState<TruckDriverData | null>(null)
  const [activeTab, setActiveTab] = useState("trucks")

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setFileName(file.name)
    setIsLoading(true)
    setError(null)

    try {
      // Read the file
      const content = await readFileAsText(file)

      // Parse the file based on its extension
      let data: TruckDriverData

      if (file.name.toLowerCase().endsWith(".json")) {
        data = JSON.parse(content)
      } else if (file.name.toLowerCase().endsWith(".csv")) {
        data = parseCSVToTruckDriverData(content)
      } else if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
        // For Excel files, we'd need to use a library like xlsx
        // This is a placeholder for now
        throw new Error("Excel files are not supported yet. Please use CSV or JSON format.")
      } else {
        throw new Error("Unsupported file format. Please use CSV or JSON format.")
      }

      // Validate the data structure
      if (!validateTruckDriverData(data)) {
        throw new Error("Invalid data format. Please check the file structure.")
      }

      // Set the data and notify parent component
      setReferenceData(data)
      onDataLoaded(data)
    } catch (err) {
      console.error("Error processing truck/driver file:", err)
      setError(err instanceof Error ? err.message : "Failed to process the file")
    } finally {
      setIsLoading(false)
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const parseCSVToTruckDriverData = (csvContent: string): TruckDriverData => {
    const lines = csvContent.split("\n").filter((line) => line.trim().length > 0)

    // Determine if this is a truck or driver file based on headers
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())

    const isTruckFile = headers.includes("truck id") || headers.includes("truck type")
    const isDriverFile = headers.includes("driver id") || headers.includes("driver name")

    const trucks: TruckInfo[] = []
    const drivers: DriverInfo[] = []

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])

      if (isTruckFile && values.length >= 3) {
        trucks.push({
          id: values[0],
          type: values[1],
          status: (values[2].toLowerCase() === "active"
            ? "active"
            : values[2].toLowerCase() === "maintenance"
              ? "maintenance"
              : "inactive") as "active" | "maintenance" | "inactive",
          capacity: values[3] || undefined,
          notes: values[4] || undefined,
        })
      }

      if (isDriverFile && values.length >= 3) {
        drivers.push({
          id: values[0],
          name: values[1],
          status: (values[2].toLowerCase() === "active"
            ? "active"
            : values[2].toLowerCase() === "off"
              ? "off"
              : "unavailable") as "active" | "off" | "unavailable",
          preferredTruckTypes: values[3] ? values[3].split(";").map((t) => t.trim()) : undefined,
          certifications: values[4] ? values[4].split(";").map((c) => c.trim()) : undefined,
          notes: values[5] || undefined,
        })
      }
    }

    return { trucks, drivers }
  }

  // Helper function to parse CSV line, handling quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let currentField = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = i < line.length - 1 ? line[i + 1] : ""

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Double quotes inside quotes - add a single quote
          currentField += '"'
          i++ // Skip the next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        // End of field
        result.push(currentField.trim())
        currentField = ""
      } else {
        // Regular character
        currentField += char
      }
    }

    // Add the last field
    result.push(currentField.trim())

    return result
  }

  const validateTruckDriverData = (data: any): data is TruckDriverData => {
    // Basic validation to ensure the data has the expected structure
    return (
      data &&
      (Array.isArray(data.trucks) || Array.isArray(data.drivers)) &&
      (!data.trucks ||
        data.trucks.every(
          (truck: any) =>
            typeof truck.id === "string" && typeof truck.type === "string" && typeof truck.status === "string",
        )) &&
      (!data.drivers ||
        data.drivers.every(
          (driver: any) =>
            typeof driver.id === "string" && typeof driver.name === "string" && typeof driver.status === "string",
        ))
    )
  }

  const handleClear = () => {
    setFileName(null)
    setReferenceData(null)
    setError(null)

    // Reset the file input
    const fileInput = document.getElementById("truck-driver-file") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success"
      case "maintenance":
      case "off":
        return "warning"
      case "inactive":
      case "unavailable":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Truck & Driver Reference</CardTitle>
        <CardDescription>Upload a reference file of available trucks and drivers</CardDescription>
      </CardHeader>
      <CardContent>
        {!fileName ? (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mb-4">CSV or JSON files</p>
            <Button onClick={() => document.getElementById("truck-driver-file")?.click()} disabled={isLoading}>
              {isLoading ? "Processing..." : "Select File"}
            </Button>
            <input
              type="file"
              id="truck-driver-file"
              className="hidden"
              accept=".csv,.json,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">{fileName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {referenceData && (
              <div className="mt-4">
                <Alert variant="default" className="bg-green-50 border-green-200 mb-4">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Reference Data Loaded</AlertTitle>
                  <AlertDescription className="text-green-700">
                    {referenceData.trucks?.length || 0} trucks and {referenceData.drivers?.length || 0} drivers loaded
                    successfully.
                  </AlertDescription>
                </Alert>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="trucks" className="flex items-center">
                      <Truck className="h-4 w-4 mr-2" />
                      Trucks ({referenceData.trucks?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="drivers" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Drivers ({referenceData.drivers?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="trucks" className="mt-4">
                    {referenceData.trucks && referenceData.trucks.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Capacity</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {referenceData.trucks.map((truck) => (
                              <TableRow key={truck.id}>
                                <TableCell className="font-medium">{truck.id}</TableCell>
                                <TableCell>{truck.type}</TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(truck.status) as any}>{truck.status}</Badge>
                                </TableCell>
                                <TableCell>{truck.capacity || "-"}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{truck.notes || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">No truck data available</div>
                    )}
                  </TabsContent>

                  <TabsContent value="drivers" className="mt-4">
                    {referenceData.drivers && referenceData.drivers.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Preferred Trucks</TableHead>
                              <TableHead>Certifications</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {referenceData.drivers.map((driver) => (
                              <TableRow key={driver.id}>
                                <TableCell className="font-medium">{driver.id}</TableCell>
                                <TableCell>{driver.name}</TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(driver.status) as any}>{driver.status}</Badge>
                                </TableCell>
                                <TableCell>
                                  {driver.preferredTruckTypes?.map((type, i) => (
                                    <Badge key={i} variant="outline" className="mr-1">
                                      {type}
                                    </Badge>
                                  )) || "-"}
                                </TableCell>
                                <TableCell>
                                  {driver.certifications?.map((cert, i) => (
                                    <Badge key={i} variant="secondary" className="mr-1">
                                      {cert}
                                    </Badge>
                                  )) || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">No driver data available</div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
