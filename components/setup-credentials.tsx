"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check, ExternalLink } from "lucide-react"

export function SetupCredentials() {
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const [showInstructions, setShowInstructions] = useState(false)

  const credentials = {
    CLICKUP_CLIENT_ID: "JSB26TARGIDNQAWU2Q2P3FGVFM2XA6MH",
    CLICKUP_CLIENT_SECRET: "TQTC0LRZ378OC3TG52V5Q9353PRSIOREIAMYCEBOE2MOQLOVEYJALHR18ATQOA9G",
    NEXT_PUBLIC_APP_URL: "https://v0-new-project-ol9hppaackj.vercel.app",
  }

  const copyToClipboard = (key: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopied({ ...copied, [key]: true })
    setTimeout(() => {
      setCopied({ ...copied, [key]: false })
    }, 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ClickUp OAuth Credentials</CardTitle>
        <CardDescription>Set up these credentials in your Vercel project</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTitle className="text-amber-800">Important</AlertTitle>
          <AlertDescription className="text-amber-700">
            You need to set these environment variables in your Vercel project for the OAuth flow to work.
          </AlertDescription>
        </Alert>

        {Object.entries(credentials).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{key}</Label>
            <div className="flex">
              <Input id={key} value={value} readOnly className="font-mono text-sm flex-1" />
              <Button variant="outline" size="icon" className="ml-2" onClick={() => copyToClipboard(key, value)}>
                {copied[key] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full mt-4" onClick={() => setShowInstructions(!showInstructions)}>
          {showInstructions ? "Hide Instructions" : "Show Setup Instructions"}
        </Button>

        {showInstructions && (
          <div className="mt-4 space-y-4 border rounded-md p-4">
            <h3 className="font-medium">How to Set Up Environment Variables in Vercel</h3>

            <ol className="space-y-2 list-decimal list-inside">
              <li>Go to your Vercel dashboard</li>
              <li>Select your project</li>
              <li>Click on "Settings" tab</li>
              <li>Select "Environment Variables" from the left sidebar</li>
              <li>Add each of the above variables with their values</li>
              <li>Click "Save" to apply the changes</li>
              <li>Redeploy your application for the changes to take effect</li>
            </ol>

            <div className="mt-4">
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center"
              >
                Go to Vercel Dashboard
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          After setting up these variables, you'll need to redeploy your application.
        </p>
      </CardFooter>
    </Card>
  )
}
