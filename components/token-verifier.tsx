"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, ExternalLink, Check, Copy } from "lucide-react"

export function TokenVerifier() {
  const [pythonToken, setPythonToken] = useState("")
  const [envToken, setEnvToken] = useState("")
  const [newToken, setNewToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("compare")
  const [copied, setCopied] = useState(false)

  // Function to check if tokens match
  const tokensMatch = () => {
    if (!pythonToken || !envToken) return null
    return pythonToken.trim() === envToken.trim()
  }

  // Function to test a token
  const testToken = async (token: string) => {
    if (!token) {
      setError("Please enter a token to test")
      return
    }

    setIsLoading(true)
    setError(null)
    setTestResult(null)

    try {
      const response = await fetch("/api/clickup/test-custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: "user",
          apiToken: token,
        }),
      })

      const data = await response.json()
      setTestResult(data)

      if (!data.success) {
        setError(`API Error: ${data.status} ${data.statusText}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  // Function to copy token to clipboard
  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ClickUp Token Verifier</CardTitle>
        <CardDescription>Compare and verify your ClickUp API tokens</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="compare">Compare Tokens</TabsTrigger>
            <TabsTrigger value="new">Get New Token</TabsTrigger>
          </TabsList>

          <TabsContent value="compare" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="python-token">Token from Python Script</Label>
              <Input
                id="python-token"
                value={pythonToken}
                onChange={(e) => setPythonToken(e.target.value)}
                placeholder="Paste the token from your Python script"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Look for the API token in your Python script (usually in a variable like api_token)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="env-token">Token from Environment Variable</Label>
              <Input
                id="env-token"
                value={envToken}
                onChange={(e) => setEnvToken(e.target.value)}
                placeholder="Paste the token from your environment variable"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This is the token set in your CLICKUP_API_TOKEN environment variable
              </p>
            </div>

            {pythonToken && envToken && (
              <Alert variant={tokensMatch() ? "default" : "destructive"}>
                <AlertTitle>{tokensMatch() ? "Tokens Match" : "Tokens Don't Match"}</AlertTitle>
                <AlertDescription>
                  {tokensMatch()
                    ? "The tokens from your Python script and environment variable are identical."
                    : "The tokens from your Python script and environment variable are different. This could be causing your authentication issues."}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => testToken(pythonToken || envToken)}
              disabled={isLoading || (!pythonToken && !envToken)}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Token"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-token">New API Token</Label>
              <div className="flex">
                <Input
                  id="new-token"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  placeholder="Paste your new ClickUp API token here"
                  className="font-mono text-sm flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-2"
                  onClick={() => copyToClipboard(newToken)}
                  disabled={!newToken}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Generate a new API token from ClickUp and paste it here</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">How to Generate a New API Token:</h3>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Log in to your ClickUp account</li>
                <li>Click on your profile picture in the bottom left</li>
                <li>Go to "Settings"</li>
                <li>Click on "Apps" in the left sidebar</li>
                <li>Scroll down to "API Token" section</li>
                <li>Click "Generate" to create a new token</li>
                <li>Copy the token and paste it above</li>
              </ol>

              <div className="mt-4">
                <a
                  href="https://app.clickup.com/settings/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center"
                >
                  Go to ClickUp Apps Settings
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>

            <Button onClick={() => testToken(newToken)} disabled={isLoading || !newToken} className="w-full">
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test New Token"
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {testResult && testResult.success && (
          <Alert variant="default" className="mt-4">
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              The token was successfully authenticated with ClickUp.
              {testResult.data?.user && (
                <div className="mt-2">
                  <p>User: {testResult.data.user.username}</p>
                  <p>Email: {testResult.data.user.email}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          API tokens can expire or be revoked. If you're having issues, try generating a new token.
        </p>
      </CardFooter>
    </Card>
  )
}
