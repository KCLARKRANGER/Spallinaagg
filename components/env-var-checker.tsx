"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"

export function EnvVarChecker() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkEnvVars = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/check-env")
      const data = await response.json()

      setResults(data)

      if (!response.ok) {
        setError(data.error || `Error: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Variables Checker</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={checkEnvVars} disabled={isLoading} className="w-full mb-4">
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Environment Variables"
          )}
        </Button>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <div className="space-y-2">
            {Object.entries(results.variables).map(([name, value]: [string, any]) => (
              <div key={name} className="flex items-center justify-between p-2 border rounded">
                <span className="font-mono text-sm">{name}</span>
                {value.exists ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">{value.masked ? `${value.preview}...` : "Set"}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <XCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">Not Set</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
