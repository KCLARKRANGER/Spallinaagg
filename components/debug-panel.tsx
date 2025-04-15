"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DebugPanelProps {
  data: any
}

export function DebugPanel({ data }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Check if data is an array with a rawContent property
  const hasRawContent = Array.isArray(data) && data.length > 0 && "rawContent" in data[0]

  return (
    <Card className="mt-4 print:hidden">
      <CardHeader
        className="flex flex-row items-center justify-between py-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="text-sm">Debug Information</CardTitle>
        <Button variant="ghost" size="sm">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {isOpen && (
        <CardContent>
          {hasRawContent ? (
            <Tabs defaultValue="raw">
              <TabsList className="mb-2">
                <TabsTrigger value="raw">Raw CSV</TabsTrigger>
                <TabsTrigger value="parsed">Parsed Data</TabsTrigger>
              </TabsList>
              <TabsContent value="raw">
                <div className="text-xs overflow-auto max-h-96 bg-muted p-2 rounded whitespace-pre">
                  {data[0].rawContent}
                </div>
              </TabsContent>
              <TabsContent value="parsed">
                <pre className="text-xs overflow-auto max-h-96 bg-muted p-2 rounded">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          ) : (
            <pre className="text-xs overflow-auto max-h-96 bg-muted p-2 rounded">{JSON.stringify(data, null, 2)}</pre>
          )}
        </CardContent>
      )}
    </Card>
  )
}
