"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"

export function RawApiTester() {
  const [apiToken, setApiToken] = useState("")
  const [listId, setListId] = useState("9014279215") // Default from the Python script
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("user")

  const testEndpoint = async (endpoint: string) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Use our server-side API route to test the ClickUp API
      const response = await fetch("/api/clickup/test-custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
          apiToken,
          listId,
        }),
      })

      const data = await response.json()

      setResult(data)

      if (!data.success) {
        setError(`API Error: ${data.status} ${data.statusText}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const runTest = () => {
    testEndpoint(activeTab)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw ClickUp API Tester</CardTitle>
        <CardDescription>Test ClickUp API endpoints directly to diagnose issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-token">API Token</Label>
            <Input
              id="api-token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter your ClickUp API token"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter your ClickUp API token exactly as it appears in your credentials
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="list-id">List ID</Label>
            <Input
              id="list-id"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              placeholder="Enter your ClickUp list ID"
              className="font-mono text-sm"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="user">User Info</TabsTrigger>
              <TabsTrigger value="list">List Info</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="user">
              <p className="text-sm mb-4">
                Tests the <code className="bg-muted px-1 py-0.5 rounded">/api/v2/user</code> endpoint to verify your API
                token.
              </p>
            </TabsContent>

            <TabsContent value="list">
              <p className="text-sm mb-4">
                Tests the <code className="bg-muted px-1 py-0.5 rounded">/api/v2/list/{"{listId}"}</code> endpoint to
                verify list access.
              </p>
            </TabsContent>

            <TabsContent value="tasks">
              <p className="text-sm mb-4">
                Tests the <code className="bg-muted px-1 py-0.5 rounded">/api/v2/list/{"{listId}"}/task</code> endpoint
                to fetch tasks.
              </p>
            </TabsContent>
          </Tabs>

          <Button onClick={runTest} disabled={isLoading || !apiToken} className="w-full">
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Run Test"
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Response Status</h3>
                <span
                  className={`text-sm px-2 py-1 rounded ${result.status >= 200 && result.status < 300 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {result.status} {result.statusText}
                </span>
              </div>

              <div>
                <h3 className="font-medium mb-1">Response Headers</h3>
                <div className="bg-muted p-2 rounded-md overflow-auto max-h-40">
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result.headers, null, 2)}</pre>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-1">Response Data</h3>
                <div className="bg-muted p-2 rounded-md overflow-auto max-h-96">
                  <pre className="text-xs whitespace-pre-wrap">
                    {typeof result.data === "object" ? JSON.stringify(result.data, null, 2) : result.data}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
