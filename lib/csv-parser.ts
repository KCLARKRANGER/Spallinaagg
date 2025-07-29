export async function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        console.log("Raw CSV content:", text.substring(0, 500) + "...")

        const lines = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)

        if (lines.length === 0) {
          resolve([])
          return
        }

        // Find the header line (first line that looks like headers)
        let headerIndex = -1
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          if (lines[i].includes("Task ID") || lines[i].includes("Task Name")) {
            headerIndex = i
            break
          }
        }

        if (headerIndex === -1) {
          console.error("Could not find header line")
          reject(new Error("Could not find header line in CSV"))
          return
        }

        console.log("Header line found at index:", headerIndex)
        console.log("Header:", lines[headerIndex])

        // Parse the header
        const headers = parseCSVLine(lines[headerIndex])
        console.log("Parsed headers:", headers)

        const data: any[] = []

        // Parse data rows
        for (let i = headerIndex + 1; i < lines.length; i++) {
          const line = lines[i]
          if (line.trim() === "") continue

          const fields = parseCSVLine(line)
          console.log(`Row ${i - headerIndex} fields:`, fields)

          if (fields.length > 0) {
            const row: any = {}
            headers.forEach((header, index) => {
              row[header] = fields[index] || ""
            })
            data.push(row)
          }
        }

        console.log("Parsed CSV data:", data)
        resolve(data)
      } catch (error) {
        console.error("Error parsing CSV:", error)
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      result.push(current.trim())
      current = ""
      i++
    } else {
      current += char
      i++
    }
  }

  // Add the last field
  result.push(current.trim())

  return result
}
