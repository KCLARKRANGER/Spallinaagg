// Hardcoded driver data
export interface DriverEntry {
  id: string
  name: string
  status: "active" | "unavailable" | "off"
  truckType?: string
  priority?: number // 0: Everyday, 1: Primary, 2: Substitute, 3: Contractor
}

export const DRIVER_DATA: DriverEntry[] = [
  { id: "33", name: "", status: "active", truckType: "6 wheeler", priority: 1 },
  { id: "36", name: "Dennis Hagner", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "38", name: "James McGreggor", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "40", name: "Tom West", status: "active", truckType: "Triaxle", priority: 1 },
  { id: "41", name: "Dave Tanascoli", status: "active", truckType: "Triaxle", priority: 1 },
  { id: "42", name: "Not Assigned", status: "active", truckType: "Triaxle", priority: 2 },
  { id: "43", name: "Dale LoveJoy", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "46", name: "No Driver", status: "active", truckType: "6 Wheeler", priority: 2 },
  { id: "48", name: "Bob Frost", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "49", name: "John Miller", status: "active", truckType: "Triaxle", priority: 1 },
  { id: "50", name: "Ron Smith", status: "active", truckType: "Triaxle", priority: 0 },
  { id: "67", name: "Brittney W", status: "active", truckType: "Conveyor", priority: 0 },
  { id: "68", name: "Karl Hubbard", status: "active", truckType: "Conveyor", priority: 1 },
  { id: "69", name: "", status: "active", truckType: "Mixer", priority: 2 },
  { id: "70", name: "DAN MAMARELLO", status: "active", truckType: "Mixer", priority: 0 },
  { id: "71", name: "Matt Gascan", status: "active", truckType: "Mixer", priority: 1 },
  { id: "72", name: "", status: "active", truckType: "Mixer", priority: 2 },
  { id: "73", name: "", status: "active", truckType: "Mixer", priority: 2 },
  { id: "78", name: "Ken Parnell", status: "active", truckType: "Mixer", priority: 0 },
  { id: "85", name: "Mixer Driver", status: "active", truckType: "Mixer", priority: 1 },
  { id: "88", name: "Mixer Driver", status: "active", truckType: "Mixer", priority: 1 },
  { id: "94", name: "Robert Clark", status: "active", truckType: "Dump Truck", priority: 0 },
  { id: "95", name: "Kelly Shoup", status: "active", truckType: "Dump Truck", priority: 0 },
  { id: "96", name: "Eric Morrell", status: "active", truckType: "Dump Truck", priority: 0 },
  { id: "92s", name: "", status: "active", truckType: "Slinger", priority: 1 },
  { id: "94s", name: "Robert Clark", status: "active", truckType: "Slinger", priority: 0 },
  { id: "95s", name: "Kelly Shoup", status: "active", truckType: "Slinger", priority: 0 },
  { id: "96s", name: "Eric Morrell", status: "active", truckType: "Slinger", priority: 0 },
  { id: "106", name: "Dan Rice", status: "active", truckType: "Trailer", priority: 0 },
  { id: "107", name: "Mark Slauson", status: "active", truckType: "Trailer", priority: 1 },
  { id: "108", name: "Ken Rose", status: "active", truckType: "Trailer", priority: 0 },
  { id: "110", name: "Tom Marks", status: "active", truckType: "Trailer", priority: 1 },
  { id: "111", name: "Tom Stoffer", status: "active", truckType: "Trailer", priority: 0 },
  { id: "112", name: "Bob Semmell", status: "active", truckType: "Trailer", priority: 1 },
  { id: "MMH2", name: "Conner Weaver", status: "active", truckType: "Triaxle", priority: 3 },
  { id: "SMI43P", name: "Dale Lovejoy", status: "active", truckType: "Trailer", priority: 0 },
  { id: "SMI48P", name: "Bob Frost", status: "active", truckType: "Trailer", priority: 0 },
  { id: "SMI50P", name: "Ron Smith", status: "active", truckType: "Trailer", priority: 0 },
  { id: "MMH6", name: "Tim Hampshire", status: "active", truckType: "Triaxle", priority: 0 },
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
  return DRIVER_DATA.filter(
    (driver) =>
      driver.truckType === truckType &&
      driver.status === "active" &&
      driver.name.trim() !== "" &&
      driver.name !== "No Driver" &&
      driver.name !== "Not Assigned",
  )
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
