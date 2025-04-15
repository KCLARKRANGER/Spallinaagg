"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { CalendarIcon, Search, X, Filter } from "lucide-react"
import type { TruckType } from "@/types/schedule"

interface ScheduleFiltersProps {
  selectedDate: Date | undefined
  onDateChange: (date: Date | undefined) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  onClearFilters: () => void
  truckTypes: TruckType[]
  selectedTruckType: string
  onTruckTypeChange: (type: string) => void
}

export function ScheduleFilters({
  selectedDate,
  onDateChange,
  searchTerm,
  onSearchChange,
  onClearFilters,
  truckTypes,
  selectedTruckType,
  onTruckTypeChange,
}: ScheduleFiltersProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 print:hidden">
      <div className="flex-1">
        <Label htmlFor="search" className="mb-2 block">
          Search
        </Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by driver, location, job name..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={() => onSearchChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Truck Type</Label>
        <Select value={selectedTruckType} onValueChange={onTruckTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select truck type" />
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

      <div>
        <Label className="mb-2 block">Date Filter</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Filter by date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                onDateChange(date)
                setCalendarOpen(false)
              }}
              initialFocus
            />
            <div className="p-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDateChange(undefined)
                  setCalendarOpen(false)
                }}
              >
                Clear date filter
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {(selectedDate || searchTerm || selectedTruckType !== "all") && (
        <div className="flex items-end">
          <Button variant="outline" onClick={onClearFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}
