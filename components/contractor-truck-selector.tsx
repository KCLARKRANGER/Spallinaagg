"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Truck } from "lucide-react"
import {
  getContractorCompanies,
  getTrucksByCompany,
  getAllContractorTrucks,
  type ContractorTruck,
} from "@/lib/contractor-data"

interface ContractorTruckSelectorProps {
  onSelectTruck: (truckId: string) => void
}

export function ContractorTruckSelector({ onSelectTruck }: ContractorTruckSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<string>("all")
  const [filteredTrucks, setFilteredTrucks] = useState<ContractorTruck[]>([])

  const companies = getContractorCompanies()
  const allTrucks = getAllContractorTrucks()

  // Filter trucks based on search term and selected company
  useEffect(() => {
    let trucks = allTrucks

    // Apply company filter
    if (selectedCompany !== "all") {
      trucks = getTrucksByCompany(selectedCompany)
    }

    // Apply search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      trucks = trucks.filter(
        (truck) =>
          truck.id.toLowerCase().includes(query) ||
          truck.company.toLowerCase().includes(query) ||
          (truck.driverName && truck.driverName.toLowerCase().includes(query)) ||
          (truck.tonnage && truck.tonnage.toLowerCase().includes(query)),
      )
    }

    setFilteredTrucks(trucks)
  }, [searchTerm, selectedCompany, allTrucks])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Contractor Truck</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trucks..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Truck #</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Tonnage</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrucks.length > 0 ? (
                filteredTrucks.map((truck) => (
                  <TableRow key={truck.id}>
                    <TableCell className="font-medium">{truck.id}</TableCell>
                    <TableCell>{truck.company}</TableCell>
                    <TableCell>{truck.tonnage}</TableCell>
                    <TableCell>{truck.driverName || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => onSelectTruck(truck.id)}>
                        <Truck className="h-4 w-4 mr-1" />
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No trucks found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
