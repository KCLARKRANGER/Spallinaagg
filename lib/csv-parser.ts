export async function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string
        console.log("Raw CSV content:", csvContent.substring(0, 500) + "...") // Log the first 500 chars

        // Split by lines and filter out empty lines
        const lines = csvContent.split("\n").filter((line) => line.trim().length > 0)

        // Find the header line (look for Task ID or Task Name)
        let headerLine = 0
        for (let i = 0; i < Math.min(20, lines.length); i++) {
          if (lines[i].includes("Task ID") || lines[i].includes("Task Name")) {
            headerLine = i
            break
          }
        }

        console.log("Header line found at index:", headerLine)
        console.log("Header:", lines[headerLine])

        // Parse headers - handle quoted fields properly
        const headers = parseCSVLine(lines[headerLine])
        console.log("Parsed headers:", headers)

        const data = []

        // Process each data row
        for (let i = headerLine + 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue

          // Parse the line into fields
          const fields = parseCSVLine(lines[i])
          console.log(`Row ${i} fields:`, fields)

          // Create an object mapping headers to values
          const row: Record<string, string> = {}
          for (let j = 0; j < headers.length; j++) {
            if (j < fields.length) {
              row[headers[j]] = fields[j]
            } else {
              row[headers[j]] = ""
            }
          }

          data.push(row)
        }

        console.log("Parsed CSV data:", data)
        resolve(data)
      } catch (error) {
        console.error("CSV parsing error:", error)
        reject(error)
      }
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsText(file)
  })
}

// Helper function to parse a CSV line, handling quoted fields properly
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let currentField = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = i < line.length - 1 ? line[i + 1] : ""

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Double quotes inside quotes - add a single quote
        currentField += '"'
        i++ // Skip the next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(currentField.trim())
      currentField = ""
    } else {
      // Regular character
      currentField += char
    }
  }

  // Add the last field
  result.push(currentField.trim())

  return result
}
