/**
 * Utility to map material types to appropriate pit locations
 */

// Define mapping of material types to pit locations
const materialToPitMap: Record<string, string> = {
  // Default pit location
  DEFAULT: "SM-COH",

  // Specific mappings
  "Underdrain Filter, Type 1 TN (Pea Gravel)": "SM-COH",
  "Crusher Run": "SM-COH",
  CR: "SM-COH",
  "Concrete Sand": "SM-COH",
  "Mason Sand": "SM-COH",
  "Stone #1": "SM-COH",
  "Stone #2": "SM-COH",
  "Stone #3": "SM-COH",
  "Stone #4": "SM-COH",
  Screenings: "SM-COH",
  "Rip Rap": "SM-COH",
  "Medium Stone Fill": "SM-COH",
  "Light Stone Fill": "SM-COH",
  "Heavy Stone Fill": "SM-COH",
  Asphalt: "SM-BLM",
  "Hot Mix": "SM-BLM",
  Binder: "SM-BLM",
  Top: "SM-BLM",
  Base: "SM-BLM",
  Millings: "SM-BLM",
  RAP: "SM-BLM",
  "Recycled Asphalt": "SM-BLM",
  "Recycled Concrete": "SM-COH",
  ROB: "SM-COH",
  "Run of Bank": "SM-COH",
  "Bank Run": "SM-COH",
  Fill: "SM-COH",
  Topsoil: "SM-COH",
  Dirt: "SM-COH",
  Gravel: "SM-COH",
  "Pea Gravel": "SM-COH",
  "Washed Gravel": "SM-COH",
  "Drainage Stone": "SM-COH",
  "Bedding Stone": "SM-COH",
  "Gabion Stone": "SM-COH",
  "Surge Stone": "SM-COH",
  "Ballast Stone": "SM-COH",
  "Shoulder Stone": "SM-COH",
  Subbase: "SM-COH",
  "Type 1 Subbase": "SM-COH",
  "Type 2 Subbase": "SM-COH",
  "Type 4 Subbase": "SM-COH",
  "Type 1": "SM-COH",
  "Type 2": "SM-COH",
  "Type 4": "SM-COH",
  "Item 4": "SM-COH",
  Drainage: "SM-COH",
  Backfill: "SM-COH",
  "Structural Backfill": "SM-COH",
  "Select Backfill": "SM-COH",
  "Select Fill": "SM-COH",
  "Select Granular": "SM-COH",
  Granular: "SM-COH",
  "Granular Subbase": "SM-COH",
  "Granular Fill": "SM-COH",
  "Granular Backfill": "SM-COH",
  "Granular Material": "SM-COH",
  "Granular Bedding": "SM-COH",
  "Granular Drainage": "SM-COH",
  "Granular Drainage Material": "SM-COH",
  "Granular Drainage Backfill": "SM-COH",
  "Granular Drainage Fill": "SM-COH",
  "Granular Drainage Bedding": "SM-COH",
  "Granular Drainage Subbase": "SM-COH",
  "Granular Drainage Base": "SM-COH",
  "Granular Drainage Course": "SM-COH",
  "Granular Drainage Layer": "SM-COH",
  "Granular Drainage Blanket": "SM-COH",
  "Granular Drainage Filter": "SM-COH",
  "Granular Drainage Filter Material": "SM-COH",
  "Granular Drainage Filter Backfill": "SM-COH",
  "Granular Drainage Filter Fill": "SM-COH",
  "Granular Drainage Filter Bedding": "SM-COH",
  "Granular Drainage Filter Subbase": "SM-COH",
  "Granular Drainage Filter Base": "SM-COH",
  "Granular Drainage Filter Course": "SM-COH",
  "Granular Drainage Filter Layer": "SM-COH",
  "Granular Drainage Filter Blanket": "SM-COH",
  Underdrain: "SM-COH",
  "Underdrain Filter": "SM-COH",
  "Underdrain Filter Material": "SM-COH",
  "Underdrain Filter Backfill": "SM-COH",
  "Underdrain Filter Fill": "SM-COH",
  "Underdrain Filter Bedding": "SM-COH",
  "Underdrain Filter Subbase": "SM-COH",
  "Underdrain Filter Base": "SM-COH",
  "Underdrain Filter Course": "SM-COH",
  "Underdrain Filter Layer": "SM-COH",
  "Underdrain Filter Blanket": "SM-COH",
  "Underdrain Filter Type 1": "SM-COH",
  "Underdrain Filter Type 2": "SM-COH",
  "Underdrain Filter Type 3": "SM-COH",
  "Underdrain Filter Type 4": "SM-COH",
  "Underdrain Filter Type 1 TN": "SM-COH",
  "Underdrain Filter Type 2 TN": "SM-COH",
  "Underdrain Filter Type 3 TN": "SM-COH",
  "Underdrain Filter Type 4 TN": "SM-COH",
}

/**
 * Get the appropriate pit location based on material type
 * @param materialType The material type string
 * @returns The appropriate pit location
 */
export function getPitLocationForMaterial(materialType: string): string {
  if (!materialType) return materialToPitMap["DEFAULT"]

  // Check for exact match
  if (materialToPitMap[materialType]) {
    return materialToPitMap[materialType]
  }

  // Check for partial matches
  const materialLower = materialType.toLowerCase()

  // Check for asphalt-related materials (Bloomfield)
  if (
    materialLower.includes("asphalt") ||
    materialLower.includes("hot mix") ||
    materialLower.includes("binder") ||
    materialLower.includes("top ") ||
    materialLower.includes("base ") ||
    materialLower.includes("millings") ||
    materialLower.includes("rap")
  ) {
    return "SM-BLM"
  }

  // All other materials default to Cohocton
  return "SM-COH"
}

/**
 * Automatically assign pit locations to entries that don't have them
 * @param entries Array of schedule entries
 * @returns The same array with pit locations added where missing
 */
export function assignMissingPitLocations<T extends { pit?: string; materials?: string }>(entries: T[]): T[] {
  return entries.map((entry) => {
    // Only assign if pit is missing or empty
    if (!entry.pit || entry.pit.trim() === "") {
      return {
        ...entry,
        pit: getPitLocationForMaterial(entry.materials || ""),
      }
    }
    return entry
  })
}
