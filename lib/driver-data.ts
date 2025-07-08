// Hardcoded driver data
export interface DriverEntry {
  id: string
  name: string
  status: "active" | "unavailable" | "off"
  truckType?: string
  priority?: number // 0: Everyday, 1: Primary, 2: Substitute, 3: Contractor
}

// Add Tim Hampshire as the driver for MMH06
export const DRIVER_DATA: DriverEntry[] = [
  { id: "MMH02", name: "MMH02", status: "active", truckType: "Trailer", priority: 0 },
  { id: "MMH06", name: "MMH06", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "33", name: "SMI33", status: "active", truckType: "6 wheeler", priority: 0 },
  { id: "36", name: "SMI36", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "38", name: "SMI38", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "40", name: "SMI40", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "41", name: "SMI41", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "42", name: "SMI42", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "43", name: "SMI43", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "SMI43P", name: "SMI43P", status: "active", truckType: "Trailer", priority: 0 },
  { id: "46", name: "SMI46", status: "active", truckType: "6 Wheeler", priority: 0 },
  { id: "48", name: "SMI48", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "SMI48P", name: "SMI48P", status: "active", truckType: "Trailer", priority: 0 },
  { id: "49", name: "SMI49P", status: "active", truckType: "Triaxle", priority: 1 },
  { id: "50", name: "SMI50", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "SMI50P", name: "SMI50P", status: "active", truckType: "Trailer", priority: 0 },
   { id: "51", name: "SMI51", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "67", name: "Mixer Driver", status: "active", truckType: "Conveyor", priority: 0 },
  { id: "68", name: "Mixer Driver", status: "active", truckType: "Conveyor", priority: 0 },
  { id: "69", name: "Mixer Driver", status: "active", truckType: "Mixer", priority: 0 },
  { id: "70", name: "Mixer Driver", status: "active", truckType: "Mixer", priority: 0 },
  { id: "71", name: "Mixer Driver", status: "active", truckType: "Mixer", priority: 0 },
  { id: "72", name: "Mixer Driver", status: "active", truckType: "Mixer", priority: 0 },
  { id: "73", name: "Mixer Driver", status: "active", truckType: "Mixer", priority: 0 },
  { id: "78", name: "Mixer Driver", status: "active", truckType: "Mixer", priority: 0 },
  { id: "85", name: "Mixer Driver", status: "active", truckType: "Mixer", priority: 0 },
  { id: "88", name: "Mixer Driver", status: "active", truckType: "Mixer", priority: 0 },
  { id: "92s", name: "SMI92", status: "active", truckType: "Slinger", priority: 0 },
  { id: "94", name: "SMI94", status: "active", truckType: "Dump Truck", priority: 0 },
  { id: "94s", name: "SMI94S", status: "active", truckType: "Slinger", priority: 0 },
  { id: "95", name: "SMI95", status: "active", truckType: "Dump Truck", priority: 0 },
  { id: "95s", name: "SMI95S", status: "active", truckType: "Slinger", priority: 0 },
  { id: "96", name: "SMI96", status: "active", truckType: "Dump Truck", priority: 0 },
  { id: "96s", name: "SMI96S", status: "active", truckType: "Slinger", priority: 0 },
  { id: "97S", name: "SMI97S", status: "active", truckType: "Trailer", priority: 0 },
   { id: "97", name: "SMI97", status: "active", truckType: "Trailer", priority: 0 },
  { id: "106", name: "SMI106", status: "active", truckType: "Trailer", priority: 0 },
  { id: "107", name: "SMI107", status: "active", truckType: "Trailer", priority: 0 },
  { id: "108", name: "SMI108", status: "active", truckType: "Trailer", priority: 0 },
  { id: "110", name: "SMI110", status: "active", truckType: "Trailer", priority: 0 },
  { id: "111", name: "SMI111", status: "active", truckType: "Trailer", priority: 0 },
  { id: "112", name: "SMI112", status: "active", truckType: "Trailer", priority: 0 },
  { id: "114", name: "SMI114", status: "active", truckType: "Trailer", priority: 0 },
   { id: "FIRST-RETURNING", name: "SMI-FIRST RETURNING TRUCK", status: "active", priority: 2 },
]

// Add function to get all available truck types
export function getAvailableTruckTypes(): string[] {
  const types = new Set<string>()
  DRIVER_DATA.forEach((driver) => {
    if (driver.truckType) {
      types.add(driver.truckType)
    }
  })
  return Array.from(types).sort()
}

// Get available drivers (excluding "No Driver" and "Not Assigned")
export function getAvailableDrivers(): DriverEntry[] {
  return DRIVER_DATA.filter(
    (driver) =>
      driver.status === "active" &&
      driver.name !== "No Driver" &&
      driver.name !== "Not Assigned" &&
      driver.name.trim() !== "",
  )
}

// Get drivers by truck type
export function getDriversByTruckType(truckType: string): DriverEntry[] {
  // First get regular drivers for this truck type
  const regularDrivers = DRIVER_DATA.filter(
    (driver) =>
      driver.truckType === truckType &&
      driver.status === "active" &&
      driver.name.trim() !== "" &&
      driver.name !== "No Driver" &&
      driver.name !== "Not Assigned",
  )

  // Add the special "FIRST RETURNING TRUCK" option if it exists
  const firstReturningDriver = DRIVER_DATA.find((driver) => driver.id === "FIRST-RETURNING")

  // Return the combined list
  return firstReturningDriver ? [...regularDrivers, firstReturningDriver] : regularDrivers
}

// Get all driver names for dropdown selection
export function getDriverNames(): string[] {
  return DRIVER_DATA.filter((driver) => driver.name.trim() !== "").map((driver) => driver.name)
}

// Parse truck number to extract the base number and determine if it's a slinger
export function parseTruckNumber(truckNumber: string): { baseNumber: string | null; isSlinger: boolean } {
  if (!truckNumber) return { baseNumber: null, isSlinger: false }

  // Convert to string and trim whitespace
  const truck = truckNumber.toString().trim()

  // Check if it's a slinger (has 's' suffix)
  const isSlinger = /s$/i.test(truck)

  // Handle SMI prefix (e.g., "SMI43" -> "43")
  if (truck.toUpperCase().startsWith("SMI")) {
    // Remove SMI prefix and any P or s suffix
    return {
      baseNumber: truck.substring(3).replace(/[Ps]$/i, ""),
      isSlinger,
    }
  }

  // Handle numbers with P or s suffix (e.g., "143P" -> "43" or "94s" -> "94")
  const match = truck.match(/^1?(\d+)[Ps]?$/i)
  if (match) {
    return {
      baseNumber: match[1], // Return the base number
      isSlinger,
    }
  }

  // If it's just a number, return it as is
  if (/^\d+$/.test(truck)) {
    return {
      baseNumber: truck,
      isSlinger: false,
    }
  }

  return { baseNumber: null, isSlinger: false }
}

// Get driver for a truck number
export function getDriverForTruck(truckNumber: string): DriverEntry | null {
  // Handle MMH prefix (e.g., "MMH02" -> "MMH02")
  if (truckNumber.toUpperCase().startsWith("MMH")) {
    return DRIVER_DATA.find((driver) => driver.id.toUpperCase() === truckNumber.toUpperCase()) || null
  }

  const { baseNumber, isSlinger } = parseTruckNumber(truckNumber)
  if (!baseNumber) return null

  // Special case for slinger trucks (92, 94, 95, 96)
  const isSlingerTruck = ["92", "94", "95", "96"].includes(baseNumber)

  // If it's a slinger truck, we need to check if it has an 's' suffix
  if (isSlingerTruck) {
    // Look for the truck with the appropriate suffix
    const lookupId = isSlinger ? `${baseNumber}s` : baseNumber
    return DRIVER_DATA.find((driver) => driver.id === lookupId) || null
  }

  // For all other trucks, just look up by base number
  return DRIVER_DATA.find((driver) => driver.id === baseNumber) || null
}

// Function to normalize truck types (for display consistency)
export function normalizeTruckType(truckType: string | undefined): string | undefined {
  if (!truckType) return undefined

  // Normalize equivalent truck types
  if (truckType === "Trailer") return "Tractor Trailer"
  if (truckType === "Mixer") return "Standard Mixer"
  if (truckType === "Triaxle") return "Dump Truck"

  return truckType
}

// Format truck display with driver
export function formatTruckWithDriver(truckNumber: string): { truck: string; driver: string; truckType?: string } {
  const driver = getDriverForTruck(truckNumber)

  return {
    truck: truckNumber,
    driver: driver?.name || "",
    truckType: driver?.truckType,
  }
}

// Get priority label
export function getPriorityLabel(priority: number | undefined): string {
  switch (priority) {
    case 0:
      return "Everyday Driver"
    case 1:
      return "Primary Driver"
    case 2:
      return "Substitute Driver"
    case 3:
      return "Contractor"
    default:
      return "Unspecified"
  }
}

// Load driver data from localStorage if available
export function loadSavedDriverData(): DriverEntry[] {
  if (typeof window !== "undefined") {
    try {
      const savedData = window.localStorage.getItem("permanent-driver-data")
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        // Validate that we have an array of driver entries
        if (
          Array.isArray(parsedData) &&
          parsedData.length > 0 &&
          parsedData[0] &&
          typeof parsedData[0].id === "string"
        ) {
          return parsedData
        }
      }
    } catch (error) {
      console.error("Error loading saved driver data:", error)
    }
  }
  return DRIVER_DATA
}
