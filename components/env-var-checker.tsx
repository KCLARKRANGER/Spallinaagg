"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Eye, EyeOff } from "lucide-react"

interface EnvVar {
  name: string
  value?: string
  isSet: boolean
  isPublic: boolean
}

export function EnvVarChecker() {
  const [envVars, setEnvVars] = useState<EnvVar[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showValues, setShowValues] = useState(false)

  const checkEnvVars = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/check-env")
      const data = await response.json()
      setEnvVars(data.envVars || [])
    } catch (error) {
      console.error("Error checking environment variables:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkEnvVars()
  }, [])

  const maskValue = (value: string) => {
    if (!value) return ""
    if (value.length <= 8) return "*".repeat(value.length)
    return value.substring(0, 4) + "*".repeat(value.length - 8) + value.substring(value.length - 4)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Environment Variables</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowValues(!showValues)}>
              {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showValues ? "Hide" : "Show"} Values
            </Button>
            <Button variant="outline" size="sm" onClick={checkEnvVars} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {envVars.map((envVar) => (
            <div key={envVar.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{envVar.name}</code>
                <div className="flex gap-2">
                  <Badge variant={envVar.isSet ? "default" : "destructive"}>{envVar.isSet ? "Set" : "Missing"}</Badge>
                  {envVar.isPublic && <Badge variant="outline">Public</Badge>}
                </div>
              </div>

              {envVar.isSet && showValues && (
                <code className="text-sm font-mono text-gray-600">
                  {envVar.isPublic ? envVar.value : maskValue(envVar.value || "")}
                </code>
              )}
            </div>
          ))}

          {envVars.length === 0 && !isLoading && (
            <div className="text-center py-4 text-gray-500">No environment variables found</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
