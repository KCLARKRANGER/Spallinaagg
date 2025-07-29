"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ExternalLink, Settings } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function SetupCredentials() {
  const [copied, setCopied] = useState<string | null>(null)
  const { toast } = useToast()

  const envVars = [
    {
      name: "CLICKUP_CLIENT_ID",
      description: "Your ClickUp app's Client ID",
      example: "ABC123DEF456",
      required: true,
    },
    {
      name: "CLICKUP_CLIENT_SECRET",
      description: "Your ClickUp app's Client Secret",
      example: "XYZ789UVW012",
      required: true,
    },
    {
      name: "CLICKUP_API_TOKEN",
      description: "Your personal ClickUp API token",
      example: "pk_12345678_ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      required: true,
    },
    {
      name: "NEXT_PUBLIC_APP_URL",
      description: "Your app's public URL (for OAuth redirects)",
      example: "https://your-app.vercel.app",
      required: false,
    },
  ]

  const copyToClipboard = async (text: string, name: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(name)
      setTimeout(() => setCopied(null), 2000)
      toast({
        title: "Copied to clipboard",
        description: `${name} has been copied`,
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const envFileContent = envVars.map((envVar) => `${envVar.name}=${envVar.example}`).join("\n")

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Setup ClickUp Credentials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Getting Started</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Create a ClickUp app in your workspace settings</li>
              <li>Generate a personal API token from your ClickUp profile</li>
              <li>Add the environment variables below to your project</li>
              <li>Restart your development server</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Required Environment Variables</h3>
            {envVars.map((envVar) => (
              <div key={envVar.name} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Label className="font-mono text-sm">{envVar.name}</Label>
                  {envVar.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{envVar.description}</p>
                <div className="flex items-center gap-2">
                  <Input value={envVar.example} readOnly className="font-mono text-xs bg-gray-50" />
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(envVar.example, envVar.name)}>
                    {copied === envVar.name ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Complete .env.local file</Label>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(envFileContent, ".env.local content")}>
                {copied === ".env.local content" ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy All
              </Button>
            </div>
            <Textarea value={envFileContent} readOnly className="font-mono text-xs bg-gray-50 min-h-[120px]" />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open("https://app.clickup.com/settings/apps", "_blank")}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              ClickUp Apps Settings
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open("https://app.clickup.com/settings/profile", "_blank")}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Generate API Token
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
