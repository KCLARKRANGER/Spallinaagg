"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Filter, Calendar, Truck, MapPin } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import type { ScheduleData, ScheduleEntry } from "@/types/schedule"

interface ScheduleFiltersProps {
  data: ScheduleData
  onFilteredDataChange: (filteredData: ScheduleData) => void
}

interface FilterState {
  searchTerm: string
  truckType: string
  shift: string
  driver: string
  location: string
  date: Date | undefined
  pitLocation: string
}

export function ScheduleFilters({ data, onFilteredDataChange }: ScheduleFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    truckType: "",
    shift: "",
    driver: "",
    location: "",
    date: undefined,
    pitLocation: "",
  })

  const [isExpanded, setIsExpanded] = useState(false)

  // Extract unique values for filter options
  const truckTypes = Array.from(new Set(data.allEntries?.map((entry) => entry.truckType).filter(Boolean) || []))
  const shifts = Array.from(new Set(data.allEntries?.map((entry) => entry.shift).filter(Boolean) || []))
  const drivers = Array.from(new Set(data.allEntries?.map((entry) => entry.truckDriver).filter(Boolean) || []))
  const locations = Array.from(new Set(data.allEntries?.map((entry) => entry.location).filter(Boolean) || []))
  const pitLocations = Array.from(new Set(data.allEntries?.map((entry) => entry.pit).filter(Boolean) || []))

  const applyFilters = (newFilters: FilterState) => {
    if (!data.allEntries) {
      onFilteredDataChange(data)
      return
    }

    const filteredEntries = data.allEntries.filter((entry: ScheduleEntry) => {
      // Search term filter (searches across multiple fields)
      if (newFilters.searchTerm) {
        const searchLower = newFilters.searchTerm.toLowerCase()
        const searchableText = [entry.jobName, entry.location, entry.materials, entry.notes, entry.truckDriver]
          .join(" ")
          .toLowerCase()

        if (!searchableText.includes(searchLower)) {
          return false
        }
      }

      // Truck type filter
      if (newFilters.truckType && entry.truckType !== newFilters.truckType) {
        return false
      }

      // Shift filter
      if (newFilters.shift && entry.shift !== newFilters.shift) {
        return false
      }

      // Driver filter
      if (newFilters.driver && entry.truckDriver !== newFilters.driver) {
        return false
      }

      // Location filter
      if (newFilters.location && !entry.location?.toLowerCase().includes(newFilters.location.toLowerCase())) {
        return false
      }

      // Date filter
      if (newFilters.date && entry.date) {
        const entryDate = new Date(entry.date)
        const filterDate = newFilters.date
        if (entryDate.toDateString() !== filterDate.toDateString()) {
          return false
        }
      }

      // Pit location filter
      if (newFilters.pitLocation && entry.pit !== newFilters.pitLocation) {
        return false
      }

      return true
    })

    // Rebuild byTruckType with filtered entries
    const filteredByTruckType: Record<string, ScheduleEntry[]> = {}
    filteredEntries.forEach((entry) => {
      if (!filteredByTruckType[entry.truckType]) {
        filteredByTruckType[entry.truckType] = []
      }
      filteredByTruckType[entry.truckType].push(entry)
    })

    const filteredData: ScheduleData = {
      allEntries: filteredEntries,
      byTruckType: filteredByTruckType,
    }

    onFilteredDataChange(filteredData)
  }

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    applyFilters(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      searchTerm: "",
      truckType: "",
      shift: "",
      driver: "",
      location: "",
      date: undefined,
      pitLocation: "",
    }
    setFilters(clearedFilters)
    applyFilters(clearedFilters)
  }

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === "date") return value !== undefined
      return value !== ""
    }).length
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Schedule Filters
            {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount} active</Badge>}
          </CardTitle>
          <div className="flex gap-2">
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search Term */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search jobs, locations, materials, drivers..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter("searchTerm", e.target.value)}
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Truck Type */}
            <div className="space-y-2">
              <Label>Truck Type</Label>
              <Select value={filters.truckType} onValueChange={(value) => updateFilter("truckType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All truck types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All truck types</SelectItem>
                  {truckTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        {type}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shift */}
            <div className="space-y-2">
              <Label>Shift</Label>
              <Select value={filters.shift} onValueChange={(value) => updateFilter("shift", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All shifts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All shifts</SelectItem>
                  {shifts.map((shift) => (
                    <SelectItem key={shift} value={shift}>
                      {shift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Driver */}
            <div className="space-y-2">
              <Label>Driver</Label>
              <Select value={filters.driver} onValueChange={(value) => updateFilter("driver", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All drivers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All drivers</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver} value={driver}>
                      {driver}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pit Location */}
            <div className="space-y-2">
              <Label>Pit Location</Label>
              <Select value={filters.pitLocation} onValueChange={(value) => updateFilter("pitLocation", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All pit locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All pit locations</SelectItem>
                  {pitLocations.map((pit) => (
                    <SelectItem key={pit} value={pit}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {pit}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.date ? format(filters.date, "PPP") : "All dates"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.date}
                    onSelect={(date) => updateFilter("date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Location Search */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Filter by location..."
                value={filters.location}
                onChange={(e) => updateFilter("location", e.target.value)}
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="space-y-2">
              <Label>Active Filters:</Label>
              <div className="flex flex-wrap gap-2">
                {filters.searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: "{filters.searchTerm}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("searchTerm", "")} />
                  </Badge>
                )}
                {filters.truckType && filters.truckType !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Truck: {filters.truckType}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("truckType", "")} />
                  </Badge>
                )}
                {filters.shift && filters.shift !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Shift: {filters.shift}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("shift", "")} />
                  </Badge>
                )}
                {filters.driver && filters.driver !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Driver: {filters.driver}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("driver", "")} />
                  </Badge>
                )}
                {filters.pitLocation && filters.pitLocation !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Pit: {filters.pitLocation}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("pitLocation", "")} />
                  </Badge>
                )}
                {filters.location && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Location: {filters.location}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("location", "")} />
                  </Badge>
                )}
                {filters.date && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Date: {format(filters.date, "MMM d, yyyy")}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("date", undefined)} />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
