import * as XLSX from "xlsx"
import type { ScheduleData, ScheduleEntry, TruckType } from "@/types/schedule"
import { parseCSV } from "./csv-parser"

export async function processExcelFile(file: File): Promise<ScheduleData> {
  try {
    // Check if it's a CSV file
    const isCSV = file.name.toLowerCase().endsWith(".csv")

    let jsonData
    if (isCSV) {
      // For CSV files, use our custom parser
      jsonData = await parseCSV(file)
    } else {
      // For Excel files, use XLSX
      const reader = new FileReader()
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })

      const data = new Uint8Array(arrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })

      // Assume first sheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]

      // Convert to JSON
      jsonData = XLSX.utils.sheet_to_json(worksheet)
    }

    console.log("Raw data from file:", jsonData)

    // Process the data
    const processedData = processScheduleData(jsonData)
    return processedData
  } catch (error) {
    console.error("Error processing file:", error)
    throw error
  }
}

export function processScheduleData(data: any[]): ScheduleData {
  const allEntries: ScheduleEntry[] = []
  const byTruckType: Record<TruckType, ScheduleEntry[]> = {}

  // Process each row
  data.forEach((row, index) => {
    console.log(`Processing row ${index}:`, row)

    // Map column names to our expected format based on the provided schema
    const jobName = row["Task Name"] || ""
    const truckType = (row["Truck Type (drop down)"] || "").toString().trim()
    const pit = (row["Pit Location (drop down)"] || "").toString()
    const shift = (row["1st/2nd (labels)"] || "").toString()
    const driversAssigned = (row["Drivers Assigned (labels)"] || "").toString()

    console.log(`Row ${index} - Job: ${jobName}, Truck: ${truckType}, Drivers: ${driversAssigned}`)

    // Replace this block:
    // Skip rows with no truck type or "Unspecified" truck type
    // if (!truckType) {
    //   console.log(`Skipping row ${index} - No truck type specified`)
    //   return // Skip this row
    // }

    // With this code that assigns "Undefined" as the truck type:
    const finalTruckType = truckType || "Undefined"
    console.log(`Row ${index} - Using truck type: ${finalTruckType}`)

    // Parse the due date
    let date = ""
    let time = ""

    if (row["Due Date"]) {
      try {
        // Handle the specific Monday.com date format
        // Example: "Monday, March 10th 2025, 7:00:00 am -04:00"
        const dateString = row["Due Date"]
        const parsedDate = new Date(dateString)

        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })

          // Extract time from the date string if no specific time is provided
          if (!row["Time (short text)"]) {
            const timeMatch = dateString.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)/i)
            if (timeMatch) {
              const [_, hours, minutes, seconds, ampm] = timeMatch
              let hoursNum = Number.parseInt(hours)
              if (ampm.toLowerCase() === "pm" && hoursNum < 12) hoursNum += 12
              if (ampm.toLowerCase() === "am" && hoursNum === 12) hoursNum = 0
              time = `${hoursNum.toString().padStart(2, "0")}:${minutes}`
            }
          }
        } else {
          date = dateString
        }
      } catch (e) {
        console.error("Error parsing date:", e)
        date = row["Due Date"]
      }
    }

    // Use the time field if available, otherwise keep the extracted time from date
    if (row["Time (short text)"]) {
      time = row["Time (short text)"].toString()
    }

    const location = (row["LOCATION (location)"] || "").toString()
    const qty = (row["QTY REQ'D (short text)"] || "").toString()

    // Check for both possible material column names
    const materials = (row["Material Type (drop down)"] || row["AGG. Materials (drop down)"] || "").toString()

    const notes = (row["Additional Delivery Notes (text)"] || "").toString()

    // Parse drivers assigned
    let driversList: string[] = []

    if (driversAssigned) {
      // First, clean up the string - remove brackets
      const cleanDrivers = driversAssigned.replace(/^\[|\]$/g, "").trim()

      if (cleanDrivers) {
        // Split by commas and trim each entry
        driversList = cleanDrivers
          .split(/\s*,\s*/)
          .map((d) => d.trim())
          .filter((d) => d)
        console.log(`Row ${index} - Parsed drivers:`, driversList)
      }
    }

    // Normalize shift value
    let normalizedShift = shift
    if (shift) {
      // Convert to lowercase for case-insensitive comparison
      const lowerShift = shift.toLowerCase()

      // Check for common patterns and normalize
      if (lowerShift.includes("1st") || lowerShift === "1" || lowerShift === "first") {
        normalizedShift = "1st"
      } else if (lowerShift.includes("2nd") || lowerShift === "2" || lowerShift === "second") {
        normalizedShift = "2nd"
      } else if (lowerShift.includes("sched")) {
        normalizedShift = "Scheduled"
      } else if (lowerShift.includes("any")) {
        normalizedShift = "Any"
      }
    }

    // Get the number of trucks required (from column M)
    const numTrucksStr = (row["Number of Trucks"] || row["# of Trucks"] || "1").toString()
    let numTrucks = 1

    try {
      // Parse the number of trucks, default to 1 if not a valid number
      numTrucks = Number.parseInt(numTrucksStr)
      if (isNaN(numTrucks) || numTrucks < 1) {
        numTrucks = 1
      }
    } catch (e) {
      console.warn("Could not parse number of trucks:", numTrucksStr)
      numTrucks = 1
    }

    console.log(`Row ${index} - Number of trucks required: ${numTrucks}`)

    // UPDATED LOGIC: Handle both cases for duplicating entries

    // Case 1: If we have specific drivers assigned, create an entry for each driver
    if (driversList.length > 0 && driversList[0] !== "TBD") {
      console.log(`Creating ${driversList.length} entries based on assigned drivers`)

      // Create an entry for each driver
      driversList.forEach((driver) => {
        const entry: ScheduleEntry = {
          jobName,
          truckType: finalTruckType,
          pit,
          shift: normalizedShift,
          truckDriver: driver,
          date,
          time,
          location,
          qty,
          materials,
          notes,
        }

        allEntries.push(entry)

        // Add to truck type grouping
        if (!byTruckType[finalTruckType]) {
          byTruckType[finalTruckType] = []
        }

        byTruckType[finalTruckType].push(entry)
      })
    }
    // Case 2: If we have a specific number of trucks required, create that many entries
    else if (numTrucks > 1) {
      console.log(`Creating ${numTrucks} entries based on Number of Trucks column`)

      // Create entries based on numTrucks
      for (let i = 0; i < numTrucks; i++) {
        const entry: ScheduleEntry = {
          jobName,
          truckType: finalTruckType,
          pit,
          shift: normalizedShift,
          truckDriver: "TBD",
          date,
          time,
          location,
          qty,
          materials,
          notes,
        }

        allEntries.push(entry)

        // Add to truck type grouping
        if (!byTruckType[finalTruckType]) {
          byTruckType[finalTruckType] = []
        }

        byTruckType[finalTruckType].push(entry)
      }
    }
    // Case 3: Default case - create a single entry
    else {
      console.log(`Creating a single entry (default case)`)

      const entry: ScheduleEntry = {
        jobName,
        truckType: finalTruckType,
        pit,
        shift: normalizedShift,
        truckDriver: "TBD",
        date,
        time,
        location,
        qty,
        materials,
        notes,
      }

      allEntries.push(entry)

      // Add to truck type grouping
      if (!byTruckType[finalTruckType]) {
        byTruckType[finalTruckType] = []
      }

      byTruckType[finalTruckType].push(entry)
    }
  })

  console.log("Processed data:", {
    allEntries: allEntries.length,
    truckTypes: Object.keys(byTruckType),
    entriesByType: Object.entries(byTruckType).map(([type, entries]) => `${type}: ${entries.length}`),
  })

  return {
    allEntries,
    byTruckType,
  }
}

// New function to merge multiple schedule data objects
export function mergeScheduleData(data1: ScheduleData, data2: ScheduleData): ScheduleData {
  const mergedData: ScheduleData = {
    allEntries: [...data1.allEntries, ...data2.allEntries],
    byTruckType: { ...data1.byTruckType },
  }

  // Merge the truck type entries
  Object.keys(data2.byTruckType).forEach((truckType) => {
    if (mergedData.byTruckType[truckType]) {
      // Truck type exists in both data sets, merge the entries
      mergedData.byTruckType[truckType] = [...mergedData.byTruckType[truckType], ...data2.byTruckType[truckType]]
    } else {
      // Truck type only exists in data2, add it to merged data
      mergedData.byTruckType[truckType] = [...data2.byTruckType[truckType]]
    }
  })

  return mergedData
}
