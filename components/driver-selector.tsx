"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Truck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getAvailableDrivers, getAvailableTruckTypes, normalizeTruckType } from "@/lib/driver-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface DriverSelectorProps {
  onSelectDriver: (driver: string) => void
  initialTruckType?: string
}

export function DriverSelector({ onSelectDriver, initialTruckType }: DriverSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"drivers" | "trucks">("drivers")
  const [selectedTruckType, setSelectedTruckType] = useState<string>(initialTruckType || "all")

  const drivers = getAvailableDrivers()
  const truckTypes = getAvailableTruckTypes()

  // Filter drivers based on search term and selected truck type
  const filteredDrivers = drivers.filter((driver) => {
    // First apply truck type filter
    if (selectedTruckType !== "all") {
      // Handle equivalent truck types
      const normalizedSelectedType = normalizeTruckType(selectedTruckType)
      const normalizedDriverType = normalizeTruckType(driver.truckType)

      if (normalizedDriverType !== normalizedSelectedType) {
        return false
      }
    }

    // Then apply search term filter
    return (
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.id.includes(searchTerm) ||
      (driver.truckType && driver.truckType.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  // Create a list of trucks with their assigned drivers
  const trucks = drivers
    .filter((driver) => driver.name.trim() !== "")
    .map((driver) => ({
      id: driver.id,
      truckNumber: `SMI${driver.id}`,
      driverName: driver.name,
      truckType: driver.truckType || "Unknown",
    }))

  // Filter trucks based on search term and selected truck type
  const filteredTrucks = trucks.filter((truck) => {
    // First apply truck type filter
    if (selectedTruckType !== "all") {
      // Handle equivalent truck types
      const normalizedSelectedType = normalizeTruckType(selectedTruckType)
      const normalizedTruckType = normalizeTruckType(truck.truckType)

      if (normalizedTruckType !== normalizedSelectedType) {
        return false
      }
    }

    // Then apply search term filter
    return (
      truck.truckNumber.includes(searchTerm) ||
      truck.id.includes(searchTerm) ||
      truck.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.truckType.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Define color mapping for truck types
  const typeColorMap: Record<string, string> = {
    "Tractor Trailer": "bg-green-50 text-green-800 border-green-200",
    Trailer: "bg-green-50 text-green-800 border-green-200", // Same as Tractor Trailer
    "Dump Truck": "bg-orange-50 text-orange-800 border-orange-200",
    Triaxle: "bg-orange-50 text-orange-800 border-orange-200", // Same as Dump Truck
    Slinger: "bg-yellow-50 text-yellow-800 border-yellow-200",
    "6 Wheeler": "bg-blue-50 text-blue-800 border-blue-200",
    "Standard Mixer": "bg-purple-50 text-purple-800 border-purple-200",
    Mixer: "bg-purple-50 text-purple-800 border-purple-200", // Same as Standard Mixer
    Conveyor: "bg-teal-50 text-teal-800 border-teal-200",
  }

  // Function to get badge color class for a truck type
  const getBadgeColorClass = (type: string): string => {
    return typeColorMap[type] || "bg-blue-50 text-blue-800 border-blue-200"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Driver or Truck</CardTitle>
        <CardDescription>{drivers.length} drivers available for assignment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drivers or trucks..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <Select value={selectedTruckType} onValueChange={setSelectedTruckType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by truck type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Truck Types</SelectItem>
                {truckTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "drivers" | "trucks")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="trucks">Trucks</TabsTrigger>
          </TabsList>

          <TabsContent value="drivers">
            <div className="rounded-md border max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Driver Name</TableHead>
                    <TableHead>Truck Type</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.length > 0 ? (
                    filteredDrivers.map((driver) => (
                      <TableRow key={driver.id} className={driver.id === "FIRST-RETURNING" ? "bg-amber-50" : undefined}>
                        <TableCell className="font-medium">{driver.id}</TableCell>
                        <TableCell>
                          {driver.id === "FIRST-RETURNING" ? (
                            <span className="font-semibold text-amber-600">{driver.name}</span>
                          ) : (
                            driver.name
                          )}
                        </TableCell>
                        <TableCell>
                          {driver.truckType && (
                            <Badge variant="outline" className={getBadgeColorClass(driver.truckType)}>
                              {driver.truckType}
                            </Badge>
                          )}
                          {driver.id === "FIRST-RETURNING" && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                              Any Truck Type
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectDriver(driver.id === "FIRST-RETURNING" ? driver.name : driver.name)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No drivers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="trucks">
            <div className="rounded-md border max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Truck #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrucks.length > 0 ? (
                    filteredTrucks.map((truck) => (
                      <TableRow key={truck.id}>
                        <TableCell className="font-medium">{truck.truckNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getBadgeColorClass(truck.truckType)}>
                            {truck.truckType}
                          </Badge>
                        </TableCell>
                        <TableCell>{truck.driverName}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => onSelectDriver(truck.truckNumber)}>
                            <Truck className="h-4 w-4 mr-1" />
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No trucks found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
