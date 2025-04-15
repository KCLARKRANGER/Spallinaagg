/**
 * Time Utility functions
 */

// Helper function to calculate start time (15 minutes before load time)
export function calculateStartTime(loadTime: string): string {
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

    // Subtract 15 minutes
    minutes -= 15
    if (minutes < 0) {
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
