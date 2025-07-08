"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DRIVER_DATA, type DriverEntry, getPriorityLabel } from "@/lib/driver-data"
import type { ScheduleEntry } from "@/types/schedule"
import { Search, Truck, User, Filter, X } from "lucide-react"

interface UnusedTrucksTableProps {
  usedTrucks: string[]
  scheduleEntries?: ScheduleEntry[]
}

interface FilterState {
  truckType: string
  priority: string
  status: string
  searchTerm: string
}

export function UnusedTrucksTable({ usedTrucks, scheduleEntries = [] }: UnusedTrucksTableProps) {
  const [filters, setFilters] = useState<FilterState>({
    truckType: "all",
    priority: "all",
    status: "all",
    searchTerm: "",
  })
  const [selectedTrucks, setSelectedTrucks] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Get all available truck types and priorities for filter options
  const availableFilters = useMemo(() => {
    const truckTypes = new Set<string>()
    const priorities = new Set<number>()
    const statuses = new Set<string>()

    DRIVER_DATA.forEach((driver) => {
      if (driver.truckType) truckTypes.add(driver.truckType)
      if (driver.priority !== undefined) priorities.add(driver.priority)
      statuses.add(driver.status)
    })

    return {
      truckTypes: Array.from(truckTypes).sort(),
      priorities: Array.from(priorities).sort(),
      statuses: Array.from(statuses).sort(),
    }
  }, [])

  // Filter and process unused trucks
  const unusedTrucks = useMemo(() => {
    // Get trucks that are not currently used in the schedule
    const unused = DRIVER_DATA.filter((driver) => {
      // Check if this truck/driver is used in the schedule
      const isUsed = usedTrucks.some((usedTruck) => {
        const cleanUsedTruck = usedTruck.replace(/^\*/, "").trim()
        return cleanUsedTruck === driver.id || cleanUsedTruck === driver.name
      })
      return !isUsed
    })

    // Apply filters
    return unused.filter((driver) => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const matchesSearch =
          driver.name.toLowerCase().includes(searchLower) ||
          driver.id.toLowerCase().includes(searchLower) ||
          (driver.truckType && driver.truckType.toLowerCase().includes(searchLower))

        if (!matchesSearch) return false
      }

      // Truck type filter
      if (filters.truckType !== "all" && driver.truckType !== filters.truckType) {
        return false
      }

      // Priority filter
      if (filters.priority !== "all" && driver.priority?.toString() !== filters.priority) {
        return false
      }

      // Status filter
      if (filters.status !== "all" && driver.status !== filters.status) {
        return false
      }

      return true
    })
  }, [usedTrucks, filters])

  // Group unused trucks by type for better organization
  const groupedUnusedTrucks = useMemo(() => {
    const groups: Record<string, DriverEntry[]> = {}

    unusedTrucks.forEach((driver) => {
      const type = driver.truckType || "Undefined"
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(driver)
    })

    // Sort groups by truck type name
    const sortedGroups: Record<string, DriverEntry[]> = {}
    Object.keys(groups)
      .sort()
      .forEach((key) => {
        sortedGroups[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name))
      })

    return sortedGroups
  }, [unusedTrucks])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      truckType: "all",
      priority: "all",
      status: "all",
      searchTerm: "",
    })
  }

  const toggleTruckSelection = (truckId: string) => {
    setSelectedTrucks((prev) => (prev.includes(truckId) ? prev.filter((id) => id !== truckId) : [...prev, truckId]))
  }

  const selectAllVisible = () => {
    const visibleTruckIds = unusedTrucks.map((truck) => truck.id)
    setSelectedTrucks(visibleTruckIds)
  }

  const clearSelection = () => {
    setSelectedTrucks([])
  }

  const getTruckTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      Trailer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Tractor Trailer": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Dump Truck": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Triaxle: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Slinger: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "6 Wheeler": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Mixer: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Conveyor: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      Undefined: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    }
    return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }

  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 2:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case 1:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    }
  }

  const activeFiltersCount = Object.values(filters).filter((value, index) =>
    index === 3 ? value !== "" : value !== "all",
  ).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Available Trucks</h3>
          <Badge variant="outline" className="text-sm">
            {unusedTrucks.length} available
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {selectedTrucks.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedTrucks.length} selected</span>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filter Options</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search trucks..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Truck Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Truck Type</label>
                <Select value={filters.truckType} onValueChange={(value) => handleFilterChange("truckType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {availableFilters.truckTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={filters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {availableFilters.priorities.map((priority) => (
                      <SelectItem key={priority} value={priority.toString()}>
                        {getPriorityLabel(priority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {availableFilters.statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {unusedTrucks.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Button variant="outline" size="sm" onClick={selectAllVisible}>
            Select All Visible ({unusedTrucks.length})
          </Button>
          {selectedTrucks.length > 0 && (
            <span className="text-muted-foreground">
              {selectedTrucks.length} truck{selectedTrucks.length !== 1 ? "s" : ""} selected
            </span>
          )}
        </div>
      )}

      {/* Trucks by Type */}
      <div className="space-y-6">
        {Object.keys(groupedUnusedTrucks).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Available Trucks</h3>
              <p className="text-muted-foreground text-center">
                {usedTrucks.length > 0
                  ? "All trucks are currently assigned to jobs or don't match your filter criteria."
                  : "No truck data available."}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedUnusedTrucks).map(([truckType, trucks]) => (
            <Card key={truckType}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge className={getTruckTypeColor(truckType)}>{truckType}</Badge>
                    <span className="text-muted-foreground">({trucks.length})</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {trucks.map((truck) => (
                    <div
                      key={truck.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                        selectedTrucks.includes(truck.id)
                          ? "bg-primary/5 border-primary"
                          : "bg-muted/30 hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedTrucks.includes(truck.id)}
                        onCheckedChange={() => toggleTruckSelection(truck.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">{truck.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Truck className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-muted-foreground truncate">{truck.id}</span>
                          {truck.priority !== undefined && truck.priority > 0 && (
                            <Badge size="sm" className={getPriorityColor(truck.priority)}>
                              {getPriorityLabel(truck.priority)}
                            </Badge>
                          )}
                        </div>
                        {truck.status !== "active" && (
                          <Badge variant="outline" size="sm" className="mt-1">
                            {truck.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{unusedTrucks.length}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{usedTrucks.length}</div>
              <div className="text-sm text-muted-foreground">In Use</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{DRIVER_DATA.length}</div>
              <div className="text-sm text-muted-foreground">Total Fleet</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((usedTrucks.length / DRIVER_DATA.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Utilization</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
