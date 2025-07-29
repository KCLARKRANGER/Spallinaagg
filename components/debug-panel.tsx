"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight } from "lucide-react"

interface DebugPanelProps {
  data: any
  title?: string
}

export function DebugPanel({ data, title = "Debug Data" }: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const renderValue = (value: any, key: string, depth = 0): React.ReactNode => {
    if (value === null) return <span className="text-gray-500">null</span>
    if (value === undefined) return <span className="text-gray-500">undefined</span>

    if (typeof value === "string") {
      return <span className="text-green-600">"{value}"</span>
    }

    if (typeof value === "number") {
      return <span className="text-blue-600">{value}</span>
    }

    if (typeof value === "boolean") {
      return <span className="text-purple-600">{value.toString()}</span>
    }

    if (Array.isArray(value)) {
      const sectionKey = `${key}-${depth}`
      const isExpanded = expandedSections.has(sectionKey)

      return (
        <div className="ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection(sectionKey)}
            className="p-0 h-auto font-mono text-sm"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Array[{value.length}]
          </Button>
          {isExpanded && (
            <div className="ml-4 mt-1 border-l border-gray-200 pl-2">
              {value.slice(0, 10).map((item, index) => (
                <div key={index} className="py-1">
                  <span className="text-gray-500">[{index}]:</span> {renderValue(item, `${key}[${index}]`, depth + 1)}
                </div>
              ))}
              {value.length > 10 && <div className="text-gray-500 text-sm">... and {value.length - 10} more items</div>}
            </div>
          )}
        </div>
      )
    }

    if (typeof value === "object") {
      const sectionKey = `${key}-${depth}`
      const isExpanded = expandedSections.has(sectionKey)
      const entries = Object.entries(value)

      return (
        <div className="ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection(sectionKey)}
            className="p-0 h-auto font-mono text-sm"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Object{"{"}
            {entries.length}
            {"}"}
          </Button>
          {isExpanded && (
            <div className="ml-4 mt-1 border-l border-gray-200 pl-2">
              {entries.slice(0, 10).map(([objKey, objValue]) => (
                <div key={objKey} className="py-1">
                  <span className="text-orange-600">"{objKey}"</span>:{" "}
                  {renderValue(objValue, `${key}.${objKey}`, depth + 1)}
                </div>
              ))}
              {entries.length > 10 && (
                <div className="text-gray-500 text-sm">... and {entries.length - 10} more properties</div>
              )}
            </div>
          )}
        </div>
      )
    }

    return <span>{String(value)}</span>
  }

  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {typeof data === "object" && data !== null
                ? Array.isArray(data)
                  ? `Array[${data.length}]`
                  : `Object{${Object.keys(data).length}}`
                : typeof data}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="font-mono text-xs bg-gray-50 p-3 rounded max-h-96 overflow-auto">
            {renderValue(data, "root")}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
