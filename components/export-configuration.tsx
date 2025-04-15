"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, FileDown, FileUp, Check, RefreshCw } from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { DRIVER_DATA, type DriverEntry } from "@/lib/driver-data"

export function ExportConfiguration() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [storedDrivers, setStoredDrivers] = useLocalStorage<DriverEntry[]>("driver-data", DRIVER_DATA)
  const [permanentDrivers, setPermanentDrivers] = useLocalStorage<DriverEntry[]>("permanent-driver-data", [])

  // Add a ref to track initialization
  const initialized = useRef(false)

  // Improved effect to prevent infinite loops
  useEffect(() => {
    // Only run this logic once on component mount
    if (!initialized.current) {
      initialized.current = true

      const hasLoadedFlag = window.localStorage.getItem("loaded-permanent-data")

      if (permanentDrivers.length === 0 && storedDrivers.length > 0) {
        // Initialize permanent data with current data if empty
        setPermanentDrivers(storedDrivers)
      } else if (permanentDrivers.length > 0 && !hasLoadedFlag) {
        // Load permanent data on first load
        setStoredDrivers(permanentDrivers)
        window.localStorage.setItem("loaded-permanent-data", "true")
      }
    }
  }, []) // Empty dependency array means this only runs once on mount

  // Save configuration permanently
  const saveConfiguration = () => {
    // Sort drivers by ID for better organization
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

    // Save to permanent storage
    setPermanentDrivers(sortedDrivers)
    setSaveSuccess(true)

    // Reset success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false)
    }, 3000)
  }

  // Export configuration as JSON file
  const exportAsJson = () => {
    const data = JSON.stringify(storedDrivers, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "driver-configuration.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import configuration from JSON file
  const importFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content) as DriverEntry[]

        // Validate the data structure
        if (
          Array.isArray(data) &&
          data.every((item) => typeof item === "object" && "id" in item && "name" in item && "status" in item)
        ) {
          setStoredDrivers(data)
          setPermanentDrivers(data)
          setSaveSuccess(true)
          setTimeout(() => setSaveSuccess(false), 3000)
        } else {
          alert("Invalid configuration file format")
        }
      } catch (error) {
        console.error("Error parsing JSON:", error)
        alert("Error parsing configuration file")
      }
    }
    reader.readAsText(file)

    // Reset the input
    event.target.value = ""
  }

  // Reset to default configuration
  const resetToDefault = () => {
    if (confirm("Are you sure you want to reset to the default configuration? This will remove all your changes.")) {
      setStoredDrivers(DRIVER_DATA)
      setPermanentDrivers(DRIVER_DATA)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={saveConfiguration} className="flex-1" variant={saveSuccess ? "outline" : "default"}>
          {saveSuccess ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved Successfully
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>

        <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="flex-1">
          <FileDown className="h-4 w-4 mr-2" />
          Backup/Restore
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Backup & Restore Configuration</DialogTitle>
            <DialogDescription>
              Export your current configuration as a file or import a previously saved configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription className="flex flex-col space-y-2">
                <p>Your configuration is automatically saved in your browser's storage.</p>
                <p>Use these options to backup your configuration or restore from a previous backup.</p>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button onClick={exportAsJson} className="w-full">
                <FileDown className="h-4 w-4 mr-2" />
                Export Configuration
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Import Configuration
                </Button>
                <input id="file-upload" type="file" accept=".json" className="hidden" onChange={importFromJson} />
              </div>

              <Button variant="destructive" className="w-full" onClick={resetToDefault}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
