"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, Key } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function TokenVerifier() {
  const [token, setToken] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const { toast } = useToast()

  const verifyToken = async () => {
    if (!token.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter a ClickUp API token to verify",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      // Test the token by making a simple API call to ClickUp
      const response = await fetch("https://api.clickup.com/api/v2/user", {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setVerificationResult({
          valid: true,
          user: data.user,
          status: response.status,
        })
        toast({
          title: "Token Valid",
          description: `Successfully authenticated as ${data.user?.username || "Unknown User"}`,
        })
      } else {
        setVerificationResult({
          valid: false,
          error: data.err || data.error || "Invalid token",
          status: response.status,
        })
        toast({
          title: "Token Invalid",
          description: data.err || data.error || "The provided token is not valid",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Token verification error:", error)
      setVerificationResult({
        valid: false,
        error: error instanceof Error ? error.message : "Network error occurred",
        status: 0,
      })
      toast({
        title: "Verification Failed",
        description: "Could not verify token due to network error",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          ClickUp Token Verifier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token">ClickUp API Token</Label>
          <Input
            id="token"
            type="password"
            placeholder="pk_..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono"
          />
          <p className="text-sm text-gray-500">Enter your ClickUp API token to verify it's working correctly</p>
        </div>

        <Button onClick={verifyToken} disabled={isVerifying || !token.trim()} className="w-full">
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying Token...
            </>
          ) : (
            <>
              <Key className="h-4 w-4 mr-2" />
              Verify Token
            </>
          )}
        </Button>

        {verificationResult && (
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              {verificationResult.valid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <Badge variant={verificationResult.valid ? "default" : "destructive"}>
                {verificationResult.valid ? "Valid Token" : "Invalid Token"}
              </Badge>
              <Badge variant="outline">Status: {verificationResult.status}</Badge>
            </div>

            {verificationResult.valid && verificationResult.user && (
              <div className="space-y-2">
                <h4 className="font-medium">User Information:</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Username:</strong> {verificationResult.user.username}
                  </p>
                  <p>
                    <strong>Email:</strong> {verificationResult.user.email}
                  </p>
                  <p>
                    <strong>ID:</strong> {verificationResult.user.id}
                  </p>
                </div>
              </div>
            )}

            {!verificationResult.valid && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Error:</h4>
                <p className="text-sm text-red-600">{verificationResult.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
