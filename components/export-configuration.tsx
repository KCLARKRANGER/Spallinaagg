"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Save, Check, FileDown } from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { DRIVER_DATA, type DriverEntry } from "@/lib/driver-data"

export function ExportConfiguration() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [storedDrivers] = useLocalStorage<DriverEntry[]>("driver-data", DRIVER_DATA)

  // Generate the code for the DRIVER_DATA array
  const generateCode = () => {
    // Sort drivers by ID for better readability
    const sortedDrivers = [...storedDrivers].sort((a, b) => {
      // Try to sort numerically if possible
      const numA = Number.parseInt(a.id.replace(/\D/g, ""))
      const numB = Number.parseInt(b.id.replace(/\D/g, ""))

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }

      // Fall back to string comparison
      return a.id.localeCompare(b.id)
    })

    // Generate the code
    const driverEntries = sortedDrivers
      .map((driver) => {
        return `  { id: "${driver.id}", name: "${driver.name}", status: "${driver.status}", truckType: "${driver.truckType || ""}", priority: ${driver.priority ?? 1} }`
      })
      .join(",\n")

    return `// Hardcoded driver data
export interface DriverEntry {
  id: string
  name: string
  status: "active" | "unavailable" | "off"
  truckType?: string
  priority?: number // 0: Everyday, 1: Primary, 2: Substitute, 3: Contractor
}

export const DRIVER_DATA: DriverEntry[] = [
${driverEntries}
]`
  }

  // Handle copy to clipboard
  const copyToClipboard = () => {
    const code = generateCode()
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle download as file
  const downloadAsFile = () => {
    const code = generateCode()
    const blob = new Blob([code], { type: "text/javascript" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "driver-data.ts"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        Save Configuration to Code
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Export Truck Configuration</DialogTitle>
            <DialogDescription>
              Copy this code and replace the contents of your driver-data.ts file to permanently save your changes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription className="flex flex-col space-y-2">
                <p>To permanently save your truck configuration:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Copy the code below</li>
                  <li>
                    Open the file <code className="bg-muted px-1 py-0.5 rounded">lib/driver-data.ts</code> in your
                    project
                  </li>
                  <li>Replace the entire file contents with this code</li>
                  <li>Save the file and rebuild your application</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="relative">
              <Textarea value={generateCode()} readOnly className="font-mono text-sm h-96 resize-none" />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={copyToClipboard} className="h-8 px-2 bg-background">
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button size="sm" variant="outline" onClick={downloadAsFile} className="h-8 px-2 bg-background">
                  <FileDown className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
