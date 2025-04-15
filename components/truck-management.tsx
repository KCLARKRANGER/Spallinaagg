"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { DRIVER_DATA, type DriverEntry, getPriorityLabel } from "@/lib/driver-data"
import { Truck, Plus, Edit, Save, Trash2, AlertCircle, CheckCircle, Filter } from "lucide-react"
import { ExportConfiguration } from "@/components/export-configuration"

export function TruckManagement() {
  // Use localStorage to persist driver data
  const [drivers, setDrivers] = useLocalStorage<DriverEntry[]>("driver-data", DRIVER_DATA)
  const [filteredDrivers, setFilteredDrivers] = useState<DriverEntry[]>(drivers)

  // State for editing and adding drivers
  const [editingDriver, setEditingDriver] = useState<DriverEntry | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [driverToDelete, setDriverToDelete] = useState<DriverEntry | null>(null)
  const [newDriver, setNewDriver] = useState<DriverEntry>({
    id: "",
    name: "",
    status: "active",
    truckType: "",
    priority: 1,
  })

  // State for filtering
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [truckTypeFilter, setTruckTypeFilter] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  // Get all available truck types from the current data
  const truckTypes = Array.from(new Set(drivers.map((d) => d.truckType).filter(Boolean) as string[])).sort()

  // Common truck types for dropdown
  const commonTruckTypes = [
    "Dump Truck",
    "Slinger",
    "Tractor Trailer",
    "Trailer",
    "6 Wheeler",
    "Standard Mixer",
    "Mixer",
    "Conveyor",
    "Triaxle",
  ]

  // All truck types for dropdown (common + any others in the system)
  const allTruckTypes = Array.from(new Set([...commonTruckTypes, ...truckTypes])).sort()

  // Count drivers by status
  const activeCount = drivers.filter((d) => d.status === "active").length
  const unavailableCount = drivers.filter((d) => d.status === "unavailable").length
  const offCount = drivers.filter((d) => d.status === "off").length

  // Update filtered drivers when drivers, search, or filters change
  useEffect(() => {
    let filtered = [...drivers]

    // Apply search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (driver) =>
          driver.id.toLowerCase().includes(query) ||
          (driver.name && driver.name.toLowerCase().includes(query)) ||
          (driver.truckType && driver.truckType.toLowerCase().includes(query)),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((driver) => driver.status === statusFilter)
    }

    // Apply truck type filter
    if (truckTypeFilter !== "all") {
      filtered = filtered.filter((driver) => driver.truckType === truckTypeFilter)
    }

    setFilteredDrivers(filtered)
  }, [drivers, searchTerm, statusFilter, truckTypeFilter])

  // Handle status change
  const handleStatusChange = (driverId: string, newStatus: "active" | "unavailable" | "off") => {
    const updatedDrivers = drivers.map((driver) => (driver.id === driverId ? { ...driver, status: newStatus } : driver))
    setDrivers(updatedDrivers)
  }

  // Handle edit driver
  const handleEditDriver = (driver: DriverEntry) => {
    setEditingDriver({ ...driver })
    setIsEditDialogOpen(true)
    setError(null)
  }

  // Handle save edited driver
  const handleSaveDriver = () => {
    if (!editingDriver) return

    // Validate truck ID
    if (!editingDriver.id.trim()) {
      setError("Truck number is required")
      return
    }

    // Check for duplicate truck ID (only if ID changed)
    const originalDriver = drivers.find((d) => d.id === editingDriver.id)
    if (!originalDriver || originalDriver.id !== editingDriver.id) {
      if (drivers.some((d) => d.id === editingDriver.id && d !== originalDriver)) {
        setError("A truck with this ID already exists")
        return
      }
    }

    // Update the driver
    const updatedDrivers = drivers.map((driver) => (driver === originalDriver ? editingDriver : driver))

    setDrivers(updatedDrivers)
    setIsEditDialogOpen(false)
    setEditingDriver(null)
    setError(null)
  }

  // Handle add new driver
  const handleAddDriver = () => {
    // Validate truck ID
    if (!newDriver.id.trim()) {
      setError("Truck number is required")
      return
    }

    // Check for duplicate truck ID
    if (drivers.some((driver) => driver.id === newDriver.id)) {
      setError("A truck with this ID already exists")
      return
    }

    // Add the new driver
    setDrivers([...drivers, newDriver])

    // Reset form and close dialog
    setNewDriver({
      id: "",
      name: "",
      status: "active",
      truckType: "",
      priority: 1,
    })
    setIsAddDialogOpen(false)
    setError(null)
  }

  // Handle delete driver
  const handleDeleteDriver = (driver: DriverEntry) => {
    setDriverToDelete(driver)
    setIsDeleteDialogOpen(true)
  }

  // Confirm delete driver
  const confirmDeleteDriver = () => {
    if (!driverToDelete) return

    const updatedDrivers = drivers.filter((driver) => driver.id !== driverToDelete.id)
    setDrivers(updatedDrivers)
    setIsDeleteDialogOpen(false)
    setDriverToDelete(null)
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setTruckTypeFilter("all")
  }

  // Get badge color class for truck type
  const getBadgeColorClass = (type: string | undefined) => {
    if (!type) return "bg-gray-100 text-gray-800"

    const typeMap: Record<string, string> = {
      "Dump Truck": "bg-orange-100 text-orange-800",
      Triaxle: "bg-orange-100 text-orange-800", // Same as Dump Truck
      Slinger: "bg-yellow-100 text-yellow-800",
      "Tractor Trailer": "bg-green-100 text-green-800",
      Trailer: "bg-green-100 text-green-800", // Same as Tractor Trailer
      "6 Wheeler": "bg-blue-100 text-blue-800",
      "Standard Mixer": "bg-purple-100 text-purple-800",
      Mixer: "bg-purple-100 text-purple-800", // Same as Standard Mixer
      Conveyor: "bg-teal-100 text-teal-800",
    }

    return typeMap[type] || "bg-gray-100 text-gray-800"
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "unavailable":
        return "secondary"
      case "off":
        return "outline"
      default:
        return "default"
    }
  }

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: number | undefined) => {
    switch (priority) {
      case 0:
        return "default"
      case 1:
        return "secondary"
      case 2:
        return "outline"
      case 3:
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Available Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Truck className="h-5 w-5 mr-2 text-amber-500" />
              Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unavailableCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              Off Duty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{offCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Export Configuration Button */}
      <Card>
        <CardContent className="pt-6">
          <ExportConfiguration />
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-auto space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by truck #, driver, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-[250px]"
              />
            </div>

            <div className="w-full md:w-auto space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                  <SelectItem value="off">Off Duty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-auto space-y-2">
              <Label htmlFor="type-filter">Truck Type</Label>
              <Select value={truckTypeFilter} onValueChange={setTruckTypeFilter}>
                <SelectTrigger id="type-filter" className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by truck type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Truck Types</SelectItem>
                  {allTruckTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || statusFilter !== "all" || truckTypeFilter !== "all") && (
              <Button variant="outline" onClick={resetFilters} className="h-10">
                <Filter className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            )}

            <div className="ml-auto">
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Truck
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Truck Table */}
      <Card>
        <CardHeader>
          <CardTitle>Truck & Driver Management</CardTitle>
          <CardDescription>
            {filteredDrivers.length} {filteredDrivers.length === 1 ? "truck" : "trucks"} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Truck #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No trucks found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.id}</TableCell>
                      <TableCell>
                        {driver.truckType ? (
                          <Badge className={getBadgeColorClass(driver.truckType)}>{driver.truckType}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {driver.name ? driver.name : <span className="text-muted-foreground">No Driver</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(driver.priority)}>
                          {getPriorityLabel(driver.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(driver.status)}>
                          {driver.status === "active"
                            ? "Available"
                            : driver.status === "unavailable"
                              ? "Unavailable"
                              : "Off Duty"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`active-${driver.id}`}
                              checked={driver.status === "active"}
                              onCheckedChange={(checked) =>
                                handleStatusChange(driver.id, checked ? "active" : "unavailable")
                              }
                            />
                            <Label htmlFor={`active-${driver.id}`} className="text-xs">
                              Available
                            </Label>
                          </div>

                          <Button variant="ghost" size="sm" onClick={() => handleEditDriver(driver)}>
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDriver(driver)}
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Driver Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Truck/Driver</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-truck-id" className="text-right">
                Truck # <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-truck-id"
                value={editingDriver?.id || ""}
                onChange={(e) => setEditingDriver((prev) => (prev ? { ...prev, id: e.target.value } : null))}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-truck-type" className="text-right">
                Truck Type
              </Label>
              <div className="col-span-3">
                <Select
                  value={editingDriver?.truckType || ""}
                  onValueChange={(value) => setEditingDriver((prev) => (prev ? { ...prev, truckType: value } : null))}
                >
                  <SelectTrigger id="edit-truck-type">
                    <SelectValue placeholder="Select truck type" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTruckTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-driver-name" className="text-right">
                Driver Name
              </Label>
              <Input
                id="edit-driver-name"
                value={editingDriver?.name || ""}
                onChange={(e) => setEditingDriver((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                className="col-span-3"
                placeholder="Enter driver name (optional)"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-priority" className="text-right">
                Driver Priority
              </Label>
              <div className="col-span-3">
                <Select
                  value={editingDriver?.priority?.toString() || "1"}
                  onValueChange={(value) =>
                    setEditingDriver((prev) => (prev ? { ...prev, priority: Number.parseInt(value) } : null))
                  }
                >
                  <SelectTrigger id="edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Everyday Driver</SelectItem>
                    <SelectItem value="1">1 - Primary Driver</SelectItem>
                    <SelectItem value="2">2 - Substitute Driver</SelectItem>
                    <SelectItem value="3">3 - Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <Select
                  value={editingDriver?.status || "active"}
                  onValueChange={(value) =>
                    setEditingDriver((prev) =>
                      prev ? { ...prev, status: value as "active" | "unavailable" | "off" } : null,
                    )
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                    <SelectItem value="off">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDriver}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Truck Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Truck/Driver</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-truck-id" className="text-right">
                Truck # <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-truck-id"
                value={newDriver.id}
                onChange={(e) => setNewDriver({ ...newDriver, id: e.target.value })}
                className="col-span-3"
                placeholder="Enter truck number"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-truck-type" className="text-right">
                Truck Type
              </Label>
              <div className="col-span-3">
                <Select
                  value={newDriver.truckType}
                  onValueChange={(value) => setNewDriver({ ...newDriver, truckType: value })}
                >
                  <SelectTrigger id="new-truck-type">
                    <SelectValue placeholder="Select truck type" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTruckTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-driver-name" className="text-right">
                Driver Name
              </Label>
              <Input
                id="new-driver-name"
                value={newDriver.name}
                onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                className="col-span-3"
                placeholder="Enter driver name (optional)"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-priority" className="text-right">
                Driver Priority
              </Label>
              <div className="col-span-3">
                <Select
                  value={newDriver.priority?.toString() || "1"}
                  onValueChange={(value) =>
                    setNewDriver({
                      ...newDriver,
                      priority: Number.parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="new-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Everyday Driver</SelectItem>
                    <SelectItem value="1">1 - Primary Driver</SelectItem>
                    <SelectItem value="2">2 - Substitute Driver</SelectItem>
                    <SelectItem value="3">3 - Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-status" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <Select
                  value={newDriver.status}
                  onValueChange={(value) =>
                    setNewDriver({
                      ...newDriver,
                      status: value as "active" | "unavailable" | "off",
                    })
                  }
                >
                  <SelectTrigger id="new-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                    <SelectItem value="off">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDriver}>
              <Plus className="h-4 w-4 mr-2" />
              Add Truck
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Truck</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this truck? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {driverToDelete && (
            <div className="py-4">
              <div className="flex items-center p-4 border rounded-md mb-4">
                <div className="space-y-1">
                  <p className="font-medium">Truck #{driverToDelete.id}</p>
                  {driverToDelete.truckType && (
                    <Badge className={getBadgeColorClass(driverToDelete.truckType)}>{driverToDelete.truckType}</Badge>
                  )}
                  {driverToDelete.name && (
                    <p className="text-sm text-muted-foreground">Driver: {driverToDelete.name}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteDriver}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Truck
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
