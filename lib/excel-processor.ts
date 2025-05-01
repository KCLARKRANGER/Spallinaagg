import * as XLSX from "xlsx"
import type { ScheduleData, ScheduleEntry, TruckType } from "@/types/schedule"
import { parseCSV } from "./csv-parser"
import { assignMissingPitLocations } from "./pit-location-mapper"
import { addMinutesToTimeString, convertTo24HourFormat } from "./time-utils"

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

    // Check for both "Pit Location (labels)" and "Pit Location (drop down)"
    const pit = (row["Pit Location (labels)"] || row["Pit Location (drop down)"] || "")
      .toString()
      .replace(/^\[|\]$/g, "")
      .trim() // Remove brackets if present

    const shift = (row["1st/2nd (labels)"] || "").toString()
    const driversAssigned = (row["Drivers Assigned (labels)"] || "").toString()

    console.log(`Row ${index} - Job: ${jobName}, Truck: ${truckType}, Drivers: ${driversAssigned}`)

    // With this code that assigns "Dump Truck" as the default truck type:
    const finalTruckType = truckType || "Dump Truck"
    if (!truckType) {
      console.warn(`Warning: Row ${index} (${jobName}) has undefined truck type - assigning default "Dump Truck"`)
    }
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

    // Find the line where location is extracted and update it to use column I
    const location = (
      row["LOCATION (short text)"] ||
      row["I"] ||
      row["LOCATION (location)"] ||
      row["Location"] ||
      ""
    ).toString()
    const qty = (row["QTY REQ'D (short text)"] || "").toString()

    // Check for all possible material column names
    const materials = (
      row["Material Type (short text)"] ||
      row["Material Type (drop down)"] ||
      row["AGG. Materials (drop down)"] ||
      ""
    ).toString()

    // Log the materials value for debugging
    console.log(`Row ${index} - Materials: ${materials}`)

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

    // Get the number of trucks required (from column L)
    const numTrucksStr = (
      row["Number of Trucks (number)"] ||
      row["L"] ||
      row["Number of Trucks"] ||
      row["# of Trucks"] ||
      "1"
    ).toString()
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

    console.log(`Row ${index} - Number of trucks required: ${numTrucks} (from column L: ${numTrucksStr})`)

    // Get the interval between trucks (from column M)
    const intervalStr = (
      row["Interval Between Trucks (minutes)"] ||
      row["Interval Between Trucks (number)"] ||
      row["M"] ||
      "0"
    ).toString()
    let interval = 0

    try {
      interval = Number.parseInt(intervalStr)
      if (isNaN(interval)) interval = 0
    } catch (e) {
      console.warn("Could not parse interval between trucks:", intervalStr)
      interval = 0
    }

    console.log(`Row ${index} - Interval between trucks: ${interval} minutes (from column M: ${intervalStr})`)

    // Get the show-up time offset (from column N)
    // If no value is provided, use the standard 15-minute offset
    const showUpOffsetStr = (
      row["Show-up Time Offset (minutes)"] ||
      row["Minutes Before Shift (SHOWUPTIME) (number)"] ||
      row["N"] ||
      ""
    ).toString()

    let showUpOffset = 15 // Default to 15 minutes if not specified

    if (showUpOffsetStr.trim() !== "") {
      try {
        showUpOffset = Number.parseInt(showUpOffsetStr)
        if (isNaN(showUpOffset)) showUpOffset = 15
      } catch (e) {
        console.warn("Could not parse show-up time offset:", showUpOffsetStr)
        showUpOffset = 15
      }
    }

    console.log(`Row ${index} - Show-up time offset: ${showUpOffset} minutes`)

    // Convert time to 24-hour format for consistency
    const formattedTime = convertTo24HourFormat(time)

    // Calculate show-up time based on load time and offset
    let showUpTime = ""
    if (formattedTime) {
      showUpTime = addMinutesToTimeString(formattedTime, -showUpOffset)
      console.log(
        `Row ${index} - Calculated show-up time: ${showUpTime} (${showUpOffset} minutes before ${formattedTime})`,
      )
    }

    // UPDATED LOGIC: Handle both cases for duplicating entries
    // Apply staggering for ALL truck types, including Asphalt

    // Case 1: If we have specific drivers assigned, create an entry for each driver
    if (driversList.length > 0 && driversList[0] !== "TBD") {
      console.log(`Creating ${driversList.length} entries based on assigned drivers`)

      // Create an entry for each driver with staggered start times
      driversList.forEach((driver, driverIndex) => {
        // Calculate staggered time based on interval
        let staggeredTime = formattedTime
        if (interval > 0 && driverIndex > 0) {
          staggeredTime = addMinutesToTimeString(formattedTime, interval * driverIndex)
          console.log(
            `Driver ${driver} (index ${driverIndex}): Staggered load time = ${staggeredTime} (${interval * driverIndex} minutes after first driver)`,
          )
        }

        // Calculate show-up time based on offset and the staggered load time
        let driverShowUpTime = ""
        if (staggeredTime) {
          driverShowUpTime = addMinutesToTimeString(staggeredTime, -showUpOffset)
          console.log(
            `Driver ${driver}: Show-up time = ${driverShowUpTime} (${showUpOffset} minutes before ${staggeredTime})`,
          )
        }

        const entry: ScheduleEntry = {
          jobName,
          truckType: finalTruckType,
          pit,
          shift: normalizedShift,
          truckDriver: driver,
          date,
          time: staggeredTime,
          showUpTime: driverShowUpTime, // Add the show-up time
          location,
          qty,
          materials,
          notes,
          numTrucks: numTrucksStr,
          interval: interval.toString(), // Store the interval
          showUpOffset: showUpOffset.toString(), // Store the show-up offset
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
      console.log(`Creating ${numTrucks} entries based on Number of Trucks column (${numTrucksStr})`)
      console.log(`Using interval of ${interval} minutes between trucks`)

      // Create entries based on numTrucks with staggered start times
      for (let i = 0; i < numTrucks; i++) {
        // Calculate staggered time based on interval
        let staggeredTime = formattedTime
        if (interval > 0 && i > 0) {
          staggeredTime = addMinutesToTimeString(formattedTime, interval * i)
          console.log(
            `Truck ${i + 1}: Staggered load time = ${staggeredTime} (${interval * i} minutes after first truck)`,
          )
        }

        // Calculate show-up time based on offset and the staggered load time
        let truckShowUpTime = ""
        if (staggeredTime) {
          truckShowUpTime = addMinutesToTimeString(staggeredTime, -showUpOffset)
          console.log(
            `Truck ${i + 1}: Show-up time = ${truckShowUpTime} (${showUpOffset} minutes before ${staggeredTime})`,
          )
        }

        const entry: ScheduleEntry = {
          jobName,
          truckType: finalTruckType,
          pit,
          shift: normalizedShift,
          truckDriver: "TBD",
          date,
          time: staggeredTime,
          showUpTime: truckShowUpTime, // Add the show-up time
          location,
          qty,
          materials,
          notes,
          numTrucks: numTrucksStr,
          interval: interval.toString(), // Store the interval
          showUpOffset: showUpOffset.toString(), // Store the show-up offset
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

      // Calculate show-up time based on offset
      let singleShowUpTime = ""
      if (formattedTime) {
        singleShowUpTime = addMinutesToTimeString(formattedTime, -showUpOffset)
        console.log(
          `Single entry: Show-up time = ${singleShowUpTime} (${showUpOffset} minutes before ${formattedTime})`,
        )
      }

      const entry: ScheduleEntry = {
        jobName,
        truckType: finalTruckType,
        pit,
        shift: normalizedShift,
        truckDriver: "TBD",
        date,
        time: formattedTime,
        showUpTime: singleShowUpTime, // Add the show-up time
        location,
        qty,
        materials,
        notes,
        numTrucks: numTrucksStr,
        interval: interval.toString(), // Store the interval
        showUpOffset: showUpOffset.toString(), // Store the show-up offset
      }

      allEntries.push(entry)

      // Add to truck type grouping
      if (!byTruckType[finalTruckType]) {
        byTruckType[finalTruckType] = []
      }

      byTruckType[finalTruckType].push(entry)
    }
  })

  // Assign missing pit locations based on material types
  const entriesWithPits = assignMissingPitLocations(allEntries)

  // Update the byTruckType entries with pit locations as well
  Object.keys(byTruckType).forEach((type) => {
    byTruckType[type] = assignMissingPitLocations(byTruckType[type])
  })

  console.log("Processed data:", {
    allEntries: entriesWithPits.length,
    truckTypes: Object.keys(byTruckType),
    entriesByType: Object.entries(byTruckType).map(([type, entries]) => `${type}: ${entries.length}`),
  })

  return {
    allEntries: entriesWithPits,
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
