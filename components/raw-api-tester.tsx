"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, Copy, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function RawApiTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const testClickUpAPI = async () => {
    setIsLoading(true)
    setResponse(null)

    try {
      // Test the ClickUp API connection
      const response = await fetch("/api/clickup/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data,
      })

      if (response.ok) {
        toast({
          title: "API Test Successful",
          description: "ClickUp API connection is working",
        })
      } else {
        toast({
          title: "API Test Failed",
          description: `Status: ${response.status} - ${data.error || "Unknown error"}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("API test error:", error)
      setResponse({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      })
      toast({
        title: "API Test Error",
        description: "Failed to connect to API",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyResponse = async () => {
    if (response) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(response, null, 2))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast({
          title: "Copied to clipboard",
          description: "API response has been copied",
        })
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Raw API Tester
          <Badge variant="outline">ClickUp Integration</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testClickUpAPI} disabled={isLoading} className="flex items-center gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Test ClickUp API
          </Button>

          {response && (
            <Button variant="outline" onClick={copyResponse} className="flex items-center gap-2 bg-transparent">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Response"}
            </Button>
          )}
        </div>

        {response && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={response.status >= 200 && response.status < 300 ? "default" : "destructive"}>
                Status: {response.status || "Error"}
              </Badge>
              {response.statusText && <Badge variant="outline">{response.statusText}</Badge>}
            </div>

            <Textarea
              value={JSON.stringify(response, null, 2)}
              readOnly
              className="font-mono text-xs min-h-[300px] bg-gray-50"
              placeholder="API response will appear here..."
            />
          </div>
        )}

        {!response && !isLoading && (
          <div className="text-center py-8 text-gray-500">Click "Test ClickUp API" to see the raw API response</div>
        )}
      </CardContent>
    </Card>
  )
}
