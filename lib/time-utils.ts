/**
 * Time Utility functions
 */

// Helper function to calculate start time based on load time and offset in minutes
export function calculateStartTime(loadTime: string, offsetMinutes = 0): string {
  if (!loadTime) return "" // Return empty string instead of "N/A"

  try {
    // Handle different time formats
    let hours = 0
    let minutes = 0

    // Military time format (e.g., "0900")
    if (/^\d{3,4}$/.test(loadTime)) {
      const timeStr = loadTime.padStart(4, "0")
      hours = Number.parseInt(timeStr.substring(0, 2), 10)
      minutes = Number.parseInt(timeStr.substring(2, 4), 10)
    }
    // Standard time format (e.g., "9:00 AM")
    else if (/^\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?$/i.test(loadTime)) {
      const timeParts = loadTime.split(":")
      hours = Number.parseInt(timeParts[0], 10)
      minutes = Number.parseInt(timeParts[1].replace(/[^\d]/g, ""), 10)

      // Handle AM/PM
      if (/PM/i.test(loadTime) && hours < 12) {
        hours += 12
      } else if (/AM/i.test(loadTime) && hours === 12) {
        hours = 0
      }
    } else {
      return "" // Return empty string for invalid formats
    }

    // Subtract the specified offset minutes
    minutes -= offsetMinutes
    while (minutes < 0) {
      minutes += 60
      hours -= 1
    }
    if (hours < 0) {
      hours += 24
    }

    // Format the start time in 24-hour format
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  } catch (e) {
    console.error("Error calculating start time:", e)
    return "" // Return empty string on error
  }
}

// Add minutes to a time string
export function addMinutesToTimeString(timeStr: string, minutesToAdd: number): string {
  if (!timeStr) return ""

  try {
    // Handle direct HH:MM format for better performance
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [hoursStr, minutesStr] = timeStr.split(":")
      let hours = Number.parseInt(hoursStr, 10)
      let minutes = Number.parseInt(minutesStr, 10)

      // Add the minutes
      minutes += minutesToAdd

      // Handle minute overflow/underflow
      while (minutes >= 60) {
        minutes -= 60
        hours += 1
      }

      while (minutes < 0) {
        minutes += 60
        hours -= 1
      }

      // Handle hour overflow/underflow (24-hour cycle)
      hours = ((hours % 24) + 24) % 24

      // Format back to time string
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }

    // For other formats, use the date object approach
    const date = parseTimeString(timeStr)
    if (!date) return timeStr

    // Add minutes
    date.setMinutes(date.getMinutes() + minutesToAdd)

    // Format back to time string
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  } catch (e) {
    console.error("Error adding minutes to time:", e)
    return timeStr
  }
}

// Add minutes to a Date object and return a new Date object
export function addMinutesToTime(date: Date, minutesToAdd: number): Date {
  const newDate = new Date(date)
  newDate.setMinutes(date.getMinutes() + minutesToAdd)
  return newDate
}

// Add a function to convert time to 24-hour format
export function convertTo24HourFormat(timeStr: string): string {
  if (!timeStr || timeStr === "") return timeStr // Return empty string as is

  try {
    // Already in 24-hour format like "14:30"
    if (/^\d{1,2}:\d{2}$/.test(timeStr) && !timeStr.includes("AM") && !timeStr.includes("PM")) {
      const [hours, minutes] = timeStr.split(":").map((part) => Number.parseInt(part, 10))
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }

    // Military time format (e.g., "0900")
    if (/^\d{3,4}$/.test(timeStr)) {
      const paddedTime = timeStr.padStart(4, "0")
      const hours = Number.parseInt(paddedTime.substring(0, 2), 10)
      const minutes = Number.parseInt(paddedTime.substring(2, 4), 10)
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }

    // Standard time format with AM/PM (e.g., "9:00 AM")
    if (/^\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?$/i.test(timeStr)) {
      const timeParts = timeStr.split(":")
      let hours = Number.parseInt(timeParts[0], 10)
      const minutesPart = timeParts[1].replace(/[^\d]/g, "")
      const minutes = Number.parseInt(minutesPart, 10)

      // Handle AM/PM
      if (/PM/i.test(timeStr) && hours < 12) {
        hours += 12
      } else if (/AM/i.test(timeStr) && hours === 12) {
        hours = 0
      }

      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }

    return timeStr
  } catch (e) {
    console.error("Error converting time format:", e)
    return timeStr
  }
}

// Add a function to format time
export function formatTime(timeStr: string): string {
  return convertTo24HourFormat(timeStr)
}

// Parse a time string into a Date object
export function parseTimeString(timeStr: string): Date | null {
  if (!timeStr) return null

  try {
    const today = new Date()
    today.setSeconds(0)
    today.setMilliseconds(0)

    // Handle 24-hour format (HH:MM)
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(":").map(Number)
      today.setHours(hours)
      today.setMinutes(minutes)
      return today
    }

    // Handle military time format (e.g., "0900")
    if (/^\d{3,4}$/.test(timeStr)) {
      const paddedTime = timeStr.padStart(4, "0")
      const hours = Number.parseInt(paddedTime.substring(0, 2), 10)
      const minutes = Number.parseInt(paddedTime.substring(2, 4), 10)
      today.setHours(hours)
      today.setMinutes(minutes)
      return today
    }

    // Handle AM/PM format
    if (/^\d{1,2}:\d{2}\s*[AP]M$/i.test(timeStr)) {
      const isPM = /PM/i.test(timeStr)
      const [hours, minutesPart] = timeStr.split(":")
      const minutes = Number.parseInt(minutesPart.replace(/[^\d]/g, ""), 10)
      let hoursNum = Number.parseInt(hours, 10)

      if (isPM && hoursNum < 12) hoursNum += 12
      if (!isPM && hoursNum === 12) hoursNum = 0

      today.setHours(hoursNum)
      today.setMinutes(minutes)
      return today
    }

    return null
  } catch (e) {
    console.error("Error parsing time string:", e)
    return null
  }
}

// Update print colors function to handle dynamic truck types
export function getPrintTruckTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    Trailer: "#d1fae5", // green-100
    "Dump Truck": "#ffedd5", // orange-100
    Slinger: "#fef9c3", // yellow-100
    Asphalt: "#dbeafe", // blue-100
    "Standard Mixer": "#dbeafe", // blue-100
    Conveyor: "#f3e8ff", // purple-100
  }

  // Additional print colors for dynamic truck types
  const additionalPrintColors = [
    "#fee2e2", // red-100
    "#fce7f3", // pink-100
    "#e0e7ff", // indigo-100
    "#ccfbf1", // teal-100
    "#cffafe", // cyan-100
    "#ecfccb", // lime-100
    "#fef3c7", // amber-100
    "#d1fae5", // emerald-100
    "#f5d0fe", // fuchsia-100
    "#ffe4e6", // rose-100
  ]

  if (colorMap[type]) {
    return colorMap[type]
  }

  const knownTypes = Object.keys(colorMap).length
  const colorIndex = knownTypes % additionalPrintColors.length
  return additionalPrintColors[colorIndex]
}
