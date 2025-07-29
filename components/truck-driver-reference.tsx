"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Search, Truck, User } from "lucide-react"

// Spallina truck and driver data
const spallinaFleet = [
  { truck: "SMI106", driver: "John Smith", type: "Dump Truck", status: "Active" },
  { truck: "SMI107", driver: "Mike Johnson", type: "Trailer", status: "Active" },
  { truck: "SMI108", driver: "Dave Wilson", type: "Dump Truck", status: "Active" },
  { truck: "SMI110", driver: "Tom Brown", type: "Trailer", status: "Active" },
  { truck: "SMI111", driver: "Steve Davis", type: "Trailer", status: "Active" },
  { truck: "SMI112", driver: "Bob Miller", type: "Trailer", status: "Active" },
  { truck: "SMI114", driver: "Jim Garcia", type: "Trailer", status: "Active" },
  { truck: "SMI36", driver: "Paul Martinez", type: "Dump Truck", status: "Active" },
  { truck: "SMI38", driver: "Mark Rodriguez", type: "Dump Truck", status: "Active" },
  { truck: "SMI40", driver: "Dan Rice", type: "ASPHALT", status: "Active" },
  { truck: "SMI41", driver: "Chris Lopez", type: "ASPHALT", status: "Active" },
  { truck: "SMI42", driver: "Conner Weaver", type: "ASPHALT", status: "Active" },
  { truck: "SMI43", driver: "Tony Gonzalez", type: "Dump Truck", status: "Active" },
  { truck: "SMI43P", driver: "Tony Gonzalez", type: "Dump Truck", status: "Active" },
  { truck: "SMI46", driver: "Rick Wilson", type: "Dump Truck", status: "Active" },
  { truck: "SMI48", driver: "Joe Anderson", type: "Dump Truck", status: "Active" },
  { truck: "SMI48P", driver: "Joe Anderson", type: "Dump Truck", status: "Active" },
  { truck: "SMI49", driver: "Sam Thomas", type: "Dump Truck", status: "Active" },
  { truck: "SMI49P", driver: "Sam Thomas", type: "Dump Truck", status: "Active" },
  { truck: "SMI50", driver: "Bill Jackson", type: "Dump Truck", status: "Active" },
  { truck: "SMI50P", driver: "Bill Jackson", type: "Trailer", status: "Active" },
  { truck: "SMI51", driver: "Carl White", type: "Dump Truck", status: "Active" },
  { truck: "SMI67", driver: "Frank Harris", type: "Dump Truck", status: "Active" },
  { truck: "SMI68", driver: "Gary Martin", type: "Dump Truck", status: "Active" },
  { truck: "SMI69", driver: "Henry Thompson", type: "Dump Truck", status: "Active" },
  { truck: "SMI70", driver: "Ivan Garcia", type: "Dump Truck", status: "Active" },
  { truck: "SMI71", driver: "Jack Martinez", type: "Dump Truck", status: "Active" },
  { truck: "SMI72", driver: "Kevin Robinson", type: "Dump Truck", status: "Active" },
  { truck: "SMI78", driver: "Larry Clark", type: "Dump Truck", status: "Active" },
  { truck: "SMI85", driver: "Matt Rodriguez", type: "Dump Truck", status: "Active" },
  { truck: "SMI88", driver: "Nick Lewis", type: "Dump Truck", status: "Active" },
  { truck: "SMI92", driver: "Oscar Lee", type: "Dump Truck", status: "Active" },
  { truck: "SMI92S", driver: "Oscar Lee", type: "Slinger", status: "Active" },
  { truck: "SMI94", driver: "Pete Walker", type: "Dump Truck", status: "Active" },
  { truck: "SMI94S", driver: "Pete Walker", type: "Slinger", status: "Active" },
  { truck: "SMI95", driver: "Quinn Hall", type: "Dump Truck", status: "Active" },
  { truck: "SMI95S", driver: "Quinn Hall", type: "Slinger", status: "Active" },
  { truck: "SMI96", driver: "Ray Allen", type: "Dump Truck", status: "Active" },
  { truck: "SMI96S", driver: "Ray Allen", type: "Slinger", status: "Active" },
  { truck: "SMI97", driver: "Sam Young", type: "Dump Truck", status: "Active" },
  { truck: "SMI97S", driver: "Sam Young", type: "Slinger", status: "Active" },
  { truck: "MMH06", driver: "Tony Hernandez", type: "ASPHALT", status: "Active" },
  { truck: "MMH08", driver: "Victor King", type: "ASPHALT", status: "Active" },
  { truck: "SPA33", driver: "Will Wright", type: "Dump Truck", status: "Active" },
]

const contractorTrucks = [
  { truck: "WAT44", driver: "External Driver", type: "Dump Truck", status: "Contractor" },
  { truck: "WAT48", driver: "External Driver", type: "Dump Truck", status: "Contractor" },
  { truck: "MAT51", driver: "External Driver", type: "Dump Truck", status: "Contractor" },
  { truck: "NCHFB", driver: "External Driver", type: "Dump Truck", status: "Contractor" },
  { truck: "SNOWFLAKE", driver: "External Driver", type: "Dump Truck", status: "Contractor" },
  { truck: "SNOW2", driver: "External Driver", type: "Dump Truck", status: "Contractor" },
  { truck: "SNOW3", driver: "External Driver", type: "Dump Truck", status: "Contractor" },
  { truck: "SNOW4", driver: "External Driver", type: "Dump Truck", status: "Contractor" },
  { truck: "SNOW5", driver: "External Driver", type: "Dump Truck", status: "Contractor" },
  { truck: "SNOW6", driver: "External Driver", type: "Dump Truck", status: "Contractor" },
  { truck: "SNOW7", driver: "External Driver", type: "Dump Truck", status: "Contractor" },
  { truck: "SICK", driver: "External Driver", type: "Dump Truck", status: "Contractor" },
  { truck: "YORK", driver: "External Driver", type: "Dump Truck", status: "Contractor" },
]

export function TruckDriverReference() {
  const [searchTerm, setSearchTerm] = useState("")

  const allTrucks = [...spallinaFleet, ...contractorTrucks]

  const filteredTrucks = allTrucks.filter(
    (truck) =>
      truck.truck.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Contractor":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTruckTypeColor = (type: string) => {
    switch (type) {
      case "ASPHALT":
        return "bg-pink-100 text-pink-800"
      case "Dump Truck":
        return "bg-orange-100 text-orange-800"
      case "Trailer":
        return "bg-green-100 text-green-800"
      case "Slinger":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Truck & Driver Reference
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search trucks, drivers, or types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{spallinaFleet.length}</div>
              <div className="text-sm text-green-600">Spallina Trucks</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{contractorTrucks.length}</div>
              <div className="text-sm text-blue-600">Contractor Trucks</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {allTrucks.filter((t) => t.type === "Dump Truck").length}
              </div>
              <div className="text-sm text-orange-600">Dump Trucks</div>
            </div>
            <div className="text-center p-3 bg-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-pink-600">
                {allTrucks.filter((t) => t.type === "ASPHALT").length}
              </div>
              <div className="text-sm text-pink-600">Asphalt Trucks</div>
            </div>
          </div>

          {/* Truck List */}
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {filteredTrucks.map((truck, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <span className="font-mono font-medium">{truck.truck}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{truck.driver}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getTruckTypeColor(truck.type)}>{truck.type}</Badge>
                  <Badge className={getStatusColor(truck.status)}>{truck.status}</Badge>
                </div>
              </div>
            ))}
          </div>

          {filteredTrucks.length === 0 && (
            <div className="text-center py-8 text-gray-500">No trucks found matching your search criteria</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
