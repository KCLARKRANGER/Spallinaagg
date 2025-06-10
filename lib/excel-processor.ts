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

// Helper function to parse time from date string
function parseTimeFromDateString(dateString: string): string {
  // Try to extract time from formats like "Friday, May 2nd 2025, 6:30:00 am -04:00"
  const timeMatch = dateString.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)/i)
  if (timeMatch) {
    const [_, hours, minutes, seconds, ampm] = timeMatch
    let hoursNum = Number.parseInt(hours, 10)
    if (ampm.toLowerCase() === "pm" && hoursNum < 12) hoursNum += 12
    if (ampm.toLowerCase() === "am" && hoursNum === 12) hoursNum = 0
    return `${hoursNum.toString().padStart(2, "0")}:${minutes}`
  }

  // Default to empty string if no time found
  return ""
}

// Helper function to parse date from Monday.com format
function parseDateFromMondayFormat(dateString: string): string {
  // Try to match format like "Friday, May 2nd 2025, 6:30:00 am -04:00"
  const dateMatch = dateString.match(/([A-Za-z]+),\s+([A-Za-z]+)\s+(\d+)(?:st|nd|rd|th)?\s+(\d{4})/)
  if (dateMatch) {
    const [_, dayOfWeek, month, day, year] = dateMatch
    // Format as MM/DD/YYYY
    const monthMap: Record<string, string> = {
      January: "01",
      February: "02",
      March: "03",
      April: "04",
      May: "05",
      June: "06",
      July: "07",
      August: "08",
      September: "09",
      October: "10",
      November: "11",
      December: "12",
    }

    const monthNum = monthMap[month] || "01"
    const paddedDay = day.padStart(2, "0")
    return `${monthNum}/${paddedDay}/${year}`
  }

  return ""
}

// Helper function to find a value in a row using multiple possible column names
function findValueInRow(row: any, possibleColumnNames: string[]): string {
  // First, try exact matches
  for (const columnName of possibleColumnNames) {
    if (row[columnName] !== undefined) {
      return row[columnName].toString()
    }
  }

  // If no exact match, try case-insensitive matching
  const rowKeys = Object.keys(row)
  for (const columnName of possibleColumnNames) {
    const lowerColumnName = columnName.toLowerCase()
    for (const key of rowKeys) {
      if (key.toLowerCase() === lowerColumnName) {
        return row[key].toString()
      }
    }
  }

  // If still no match, try partial matching (for column names that might be abbreviated or truncated)
  for (const columnName of possibleColumnNames) {
    const lowerColumnName = columnName.toLowerCase()
    for (const key of rowKeys) {
      if (key.toLowerCase().includes(lowerColumnName) || lowerColumnName.includes(key.toLowerCase())) {
        return row[key].toString()
      }
    }
  }

  return ""
}

// Update the processScheduleData function to filter out incomplete entries before returning

export function processScheduleData(data: any[]): ScheduleData {
  const allEntries: ScheduleEntry[] = []
  const byTruckType: Record<TruckType, ScheduleEntry[]> = {}

  // Group rows by job name to process related entries together
  const jobGroups: Record<string, any[]> = {}
  data.forEach((row) => {
    const jobName = row["Task Name"] || ""
    if (!jobGroups[jobName]) {
      jobGroups[jobName] = []
    }
    jobGroups[jobName].push(row)
  })

  console.log(`Found ${Object.keys(jobGroups).length} unique job names`)

  // Process each job group
  Object.entries(jobGroups).forEach(([jobName, jobRows]) => {
    console.log(`\nProcessing job: ${jobName} with ${jobRows.length} rows`)

    // Get common data from the first row
    const firstRow = jobRows[0]

    // Log all column names in the first row for debugging
    console.log("Available columns in CSV:", Object.keys(firstRow))

    // Get truck type (default to "Dump Truck" if not specified)
    const truckType = (findValueInRow(firstRow, ["Truck Type (drop down)", "Truck Type"]) || "").trim() || "Dump Truck"
    console.log(`Truck type: ${truckType}`)

    // Check if this is an ASPHALT entry
    const isAsphaltEntry = truckType.toUpperCase().includes("ASPHALT")
    console.log(`Is ASPHALT entry: ${isAsphaltEntry}`)

    // Get pit location
    const pit = (findValueInRow(firstRow, ["Pit Location (labels)", "Pit Location (drop down)", "Pit Location"]) || "")
      .replace(/^\[|\]$/g, "")
      .trim()

    // Get shift information and normalize it
    const shift = findValueInRow(firstRow, ["1st/2nd (labels)", "1st/2nd", "Shift"]) || ""
    let normalizedShift = shift
    if (shift) {
      const lowerShift = shift.toLowerCase()
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

    // Get location, quantity, materials, and notes
    const location = findValueInRow(firstRow, ["LOCATION (short text)", "I", "LOCATION (location)", "Location"]) || ""

    const qty = findValueInRow(firstRow, ["QTY REQ'D (short text)", "QTY REQ'D", "Quantity"]) || ""

    const materials =
      findValueInRow(firstRow, [
        "Material Type (short text)",
        "Material Type (drop down)",
        "Material Type",
        "AGG. Materials (drop down)",
        "AGG. Materials",
      ]) || ""

    const notes = findValueInRow(firstRow, ["Additional Delivery Notes (text)", "Notes", "Delivery Notes"]) || ""

    // Parse the due date and extract time
    let date = ""
    let baseTime = ""

    if (firstRow["Due Date"]) {
      try {
        const dateString = firstRow["Due Date"]
        console.log(`Due Date string: ${dateString}`)

        // Extract date part using our helper function
        date = parseDateFromMondayFormat(dateString)
        if (!date) {
          // Try standard date format as fallback
          const parsedDate = new Date(dateString)
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate.toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            })
          } else {
            date = dateString
          }
        }

        console.log(`Parsed date: ${date}`)

        // Extract time part
        baseTime = parseTimeFromDateString(dateString)
        console.log(`Extracted base time: ${baseTime}`)
      } catch (e) {
        console.error("Error parsing date:", e)
        date = firstRow["Due Date"]
      }
    }

    // Use the time field if available, otherwise keep the extracted time
    if (firstRow["Time (short text)"]) {
      baseTime = firstRow["Time (short text)"].toString()
      console.log(`Using Time (short text): ${baseTime}`)
    }

    // Convert base time to 24-hour format for calculations
    const formattedBaseTime = convertTo24HourFormat(baseTime)
    console.log(`Formatted base time: ${formattedBaseTime}`)

    // Get the number of trucks required
    const numTrucksStr =
      findValueInRow(firstRow, ["Number of Trucks (number)", "L", "Number of Trucks", "# of Trucks"]) || "1"

    let numTrucks = 1
    try {
      numTrucks = Number.parseInt(numTrucksStr, 10)
      if (isNaN(numTrucks) || numTrucks < 1) {
        numTrucks = 1
      }
    } catch (e) {
      console.warn("Could not parse number of trucks:", numTrucksStr)
      numTrucks = 1
    }
    console.log(`Number of trucks: ${numTrucks}`)

    // Get the interval between trucks
    const intervalStr =
      findValueInRow(firstRow, [
        "Interval Between Trucks (number)",
        "Interval Between Trucks (minutes)",
        "Interval Between Trucks",
        "M",
      ]) || "0"

    let interval = 0
    try {
      interval = Number.parseInt(intervalStr, 10)
      if (isNaN(interval)) interval = 0
    } catch (e) {
      console.warn("Could not parse interval between trucks:", intervalStr)
      interval = 0
    }
    console.log(`Interval between trucks: ${interval} minutes`)

    // Get the show-up time offset
    console.log("Looking for show-up offset in columns:", Object.keys(firstRow))

    let showUpOffset = 15 // Default value

    if (isAsphaltEntry) {
      // For ASPHALT entries, try these specific columns in order
      const asphaltOffsetColumns = [
        "Minutes Before Shift (SHOWUPTIME) (number)",
        "Minutes Before Shift (SHOWUPTIME)",
        "Minutes Before Shift",
      ]

      // Try each column name directly
      for (const colName of asphaltOffsetColumns) {
        if (firstRow[colName] !== undefined) {
          const rawValue = firstRow[colName]
          console.log(`ASPHALT: Found offset in column "${colName}": "${rawValue}" (type: ${typeof rawValue})`)

          try {
            // Parse the value, handling both number and string types
            const parsedValue = typeof rawValue === "number" ? rawValue : Number.parseFloat(String(rawValue).trim())
            if (!isNaN(parsedValue)) {
              showUpOffset = Math.round(parsedValue)
              console.log(`ASPHALT: Successfully parsed offset: ${showUpOffset} minutes from column "${colName}"`)
              break // Exit the loop once we've found a valid value
            }
          } catch (e) {
            console.warn(`ASPHALT: Error parsing offset from column "${colName}":`, e)
          }
        }
      }

      // If we still don't have a value, try column N directly
      if (showUpOffset === 15 && firstRow["N"] !== undefined) {
        const nValue = firstRow["N"]
        console.log(`ASPHALT: Trying column N directly: "${nValue}" (type: ${typeof nValue})`)

        try {
          const parsedN = typeof nValue === "number" ? nValue : Number.parseFloat(String(nValue).trim())
          if (!isNaN(parsedN)) {
            showUpOffset = Math.round(parsedN)
            console.log(`ASPHALT: Successfully parsed offset from column N: ${showUpOffset} minutes`)
          }
        } catch (e) {
          console.warn("ASPHALT: Error parsing column N:", e)
        }
      }

      console.log(`ASPHALT ENTRY: ${jobName} - Final offset value: ${showUpOffset} minutes`)
    } else {
      // For non-ASPHALT entries, use the standard approach
      const showUpOffsetStr = findValueInRow(firstRow, [
        "Minutes Before Shift (SHOWUPTIME) (number)",
        "Minutes Before Shift (SHOWUPTIME)",
        "Minutes Before Shift",
        "SHOWUPTIME",
        "Show-up Time Offset (minutes)",
        "Show-up Time Offset",
        "N",
      ])

      console.log(`Raw show-up offset value from CSV: "${showUpOffsetStr}"`)

      if (firstRow["N"] !== undefined) {
        console.log(`Direct value from column N: "${firstRow["N"]}"`)
      }

      if (showUpOffsetStr && showUpOffsetStr.trim() !== "") {
        try {
          const parsedOffset = Number.parseFloat(showUpOffsetStr.trim())
          if (!isNaN(parsedOffset)) {
            showUpOffset = Math.round(parsedOffset)
            console.log(`Found custom show-up offset: ${showUpOffset} minutes`)
          } else {
            console.warn(`Could not parse show-up time offset (NaN): "${showUpOffsetStr}"`)
          }
        } catch (e) {
          console.warn(`Could not parse show-up time offset (exception): "${showUpOffsetStr}"`, e)
        }
      } else {
        console.log(`No show-up offset found, using default: ${showUpOffset} minutes`)
      }
    }

    console.log(`Final show-up time offset: ${showUpOffset} minutes`)

    // Get assigned drivers based on truck type
    let driversAssigned = ""

    // Log all available driver-related columns for debugging
    console.log(
      "Available driver columns:",
      Object.keys(firstRow).filter((key) => key.toLowerCase().includes("driver")),
    )

    if (isAsphaltEntry) {
      // For ASPHALT, first try the text column (F) without brackets
      driversAssigned = firstRow["Drivers Assigned (short text)"] || firstRow["Drivers Assigned (text)"] || ""

      // Log the raw value for debugging
      console.log(
        `ASPHALT: Raw driver assignment from column F: "${driversAssigned}" (type: ${typeof driversAssigned})`,
      )

      // If that's empty, try other driver columns
      if (!driversAssigned) {
        driversAssigned = firstRow["Drivers Assigned"] || firstRow["Drivers Assigned (labels)"] || ""
        console.log(`ASPHALT: Fallback to other columns: "${driversAssigned}"`)
      }

      console.log(`ASPHALT: Final driver assignment: "${driversAssigned}" (type: ${typeof driversAssigned})`)
    } else {
      // For other truck types, use the labels column (G)
      driversAssigned =
        firstRow["Drivers Assigned (labels)"] ||
        firstRow["Drivers Assigned"] ||
        firstRow["Drivers Assigned (short text)"] ||
        firstRow["Drivers Assigned (text)"] ||
        ""
      console.log(`Non-ASPHALT: Using driver assignment: "${driversAssigned}" (type: ${typeof driversAssigned})`)
    }

    let driversList: string[] = []

    if (driversAssigned) {
      // Remove brackets if present
      const cleanDrivers = String(driversAssigned)
        .replace(/^\[|\]$/g, "")
        .trim()
      if (cleanDrivers) {
        // Split by commas and clean up each driver name
        driversList = cleanDrivers
          .split(/\s*,\s*/)
          .map((d) => d.trim())
          .filter((d) => d)
        console.log(`Assigned drivers: ${driversList.join(", ")}`)
      }
    }

    // Set a default time if we couldn't extract one
    if (!formattedBaseTime) {
      console.log("No time found, using default time of 08:00")
      baseTime = "08:00"
    }

    // CASE 1: If we have specific drivers assigned, create an entry for each driver
    if (driversList.length > 0 && driversList[0] !== "TBD") {
      console.log(`Creating ${driversList.length} entries based on assigned drivers`)

      // IMPORTANT: Process drivers in the exact order they appear in the CSV
      driversList.forEach((driver, driverIndex) => {
        // Calculate staggered time based on interval - FORWARD in time
        let staggeredTime = formattedBaseTime
        if (interval > 0 && driverIndex > 0) {
          // FIXED: Add interval minutes for each subsequent truck (forward in time)
          staggeredTime = addMinutesToTimeString(formattedBaseTime, interval * driverIndex)
          console.log(
            `Driver ${driver} (index ${driverIndex}): Staggered time = ${staggeredTime} (${interval * driverIndex} minutes after base time)`,
          )
        }

        // Calculate show-up time based on the staggered time
        let driverShowUpTime = ""
        if (staggeredTime) {
          // Ensure we're using the correct offset from the CSV
          driverShowUpTime = addMinutesToTimeString(staggeredTime, -showUpOffset)
          console.log(
            `Driver ${driver}: Show-up time = ${driverShowUpTime} (${showUpOffset} minutes before ${staggeredTime})`,
          )
        }

        const entry: ScheduleEntry = {
          jobName,
          truckType,
          pit,
          shift: normalizedShift,
          truckDriver: driver,
          date,
          time: staggeredTime,
          showUpTime: driverShowUpTime,
          location,
          qty,
          materials,
          notes,
          numTrucks: numTrucksStr,
          interval: interval.toString(),
          showUpOffset: showUpOffset.toString(),
        }

        allEntries.push(entry)

        if (!byTruckType[truckType]) {
          byTruckType[truckType] = []
        }
        byTruckType[truckType].push(entry)

        // Add additional logging for ASPHALT entries
        if (isAsphaltEntry) {
          console.log(
            `ASPHALT ENTRY CREATED: ${jobName} - Driver: ${driver}, ShowUpTime: ${driverShowUpTime}, Offset: ${showUpOffset} minutes`,
          )
        }
      })
    }
    // CASE 2: If we have multiple trucks required but no specific drivers
    else if (numTrucks > 1) {
      console.log(`Creating ${numTrucks} entries based on number of trucks with staggered times`)

      for (let i = 0; i < numTrucks; i++) {
        // FIXED: Calculate staggered time by ADDING (i * interval) to the base time
        let staggeredTime = formattedBaseTime
        if (interval > 0) {
          // For truck index 0, use the base time
          // For subsequent trucks, add (index * interval) minutes to base time
          staggeredTime = i === 0 ? formattedBaseTime : addMinutesToTimeString(formattedBaseTime, interval * i)
          console.log(
            `Truck ${i + 1}: Staggered time = ${staggeredTime} (${i > 0 ? interval * i : 0} minutes after base time)`,
          )
        }

        // Calculate show-up time based on the staggered time
        let truckShowUpTime = ""
        if (staggeredTime) {
          // Ensure we're using the correct offset from the CSV
          truckShowUpTime = addMinutesToTimeString(staggeredTime, -showUpOffset)
          console.log(
            `Truck ${i + 1}: Show-up time = ${truckShowUpTime} (${showUpOffset} minutes before ${staggeredTime})`,
          )
        }

        const entry: ScheduleEntry = {
          jobName,
          truckType,
          pit,
          shift: normalizedShift,
          truckDriver: "TBD",
          date,
          time: staggeredTime,
          showUpTime: truckShowUpTime,
          location,
          qty,
          materials,
          notes,
          numTrucks: numTrucksStr,
          interval: interval.toString(),
          showUpOffset: showUpOffset.toString(),
        }

        allEntries.push(entry)

        if (!byTruckType[truckType]) {
          byTruckType[truckType] = []
        }
        byTruckType[truckType].push(entry)

        // Add additional logging for ASPHALT entries
        if (isAsphaltEntry) {
          console.log(
            `ASPHALT ENTRY CREATED: ${jobName} - Truck ${i + 1}, ShowUpTime: ${truckShowUpTime}, Offset: ${showUpOffset} minutes`,
          )
        }
      }
    }
    // CASE 3: Single entry (default case)
    else {
      console.log(`Creating a single entry (default case)`)

      // Calculate show-up time based on offset
      let singleShowUpTime = ""
      if (formattedBaseTime) {
        // Ensure we're using the correct offset from the CSV
        singleShowUpTime = addMinutesToTimeString(formattedBaseTime, -showUpOffset)
        console.log(`Show-up time = ${singleShowUpTime} (${showUpOffset} minutes before ${formattedBaseTime})`)
      }

      const entry: ScheduleEntry = {
        jobName,
        truckType,
        pit,
        shift: normalizedShift,
        truckDriver: "TBD",
        date,
        time: formattedBaseTime,
        showUpTime: singleShowUpTime,
        location,
        qty,
        materials,
        notes,
        numTrucks: numTrucksStr,
        interval: interval.toString(),
        showUpOffset: showUpOffset.toString(),
      }

      allEntries.push(entry)

      if (!byTruckType[truckType]) {
        byTruckType[truckType] = []
      }
      byTruckType[truckType].push(entry)

      // Add additional logging for ASPHALT entries
      if (isAsphaltEntry) {
        console.log(
          `ASPHALT ENTRY CREATED: ${jobName} - Single entry, ShowUpTime: ${singleShowUpTime}, Offset: ${showUpOffset} minutes`,
        )
      }
    }
  })

  // Assign missing pit locations based on material types
  const entriesWithPits = assignMissingPitLocations(allEntries)

  // At the end of the function, before returning the data, filter out incomplete entries
  const isEntryComplete = (entry: ScheduleEntry): boolean => {
    // Check for all essential fields that make a valid schedule entry
    const hasJobName = !!entry.jobName?.trim()
    const hasLocation = !!entry.location?.trim()
    const hasQuantity = !!entry.qty?.trim()
    const hasMaterials = !!entry.materials?.trim()
    const hasTime = !!(entry.time?.trim() || entry.showUpTime?.trim())
    const hasTruckType = !!entry.truckType?.trim()

    // Check if driver is assigned (not TBD)
    const hasValidDriver = entry.truckDriver && entry.truckDriver !== "TBD"

    return hasJobName && hasLocation && hasQuantity && hasMaterials && hasTime && hasTruckType && hasValidDriver
  }

  // Filter out incomplete entries
  const completeEntries = entriesWithPits.filter(isEntryComplete)

  // Update byTruckType to only include complete entries
  const filteredByTruckType: Record<TruckType, ScheduleEntry[]> = {}
  Object.keys(byTruckType).forEach((type) => {
    filteredByTruckType[type] = byTruckType[type].filter(isEntryComplete)
  })

  console.log("Processed data:", {
    allEntries: completeEntries.length,
    truckTypes: Object.keys(filteredByTruckType),
    entriesByType: Object.entries(filteredByTruckType).map(([type, entries]) => `${type}: ${entries.length}`),
  })

  return {
    allEntries: completeEntries,
    byTruckType: filteredByTruckType,
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
