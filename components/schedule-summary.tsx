import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle } from "lucide-react"
import type { ScheduleData, TruckType } from "@/types/schedule"

interface ScheduleSummaryProps {
  data: ScheduleData
}

export function ScheduleSummary({ data }: ScheduleSummaryProps) {
  // Calculate unassigned drivers for each truck type
  const unassignedSummary: Record<TruckType, number> = {}
  let totalUnassigned = 0
  let totalOrders = 0

  // Process each truck type
  Object.entries(data.byTruckType).forEach(([type, entries]) => {
    const unassignedCount = entries.filter(
      (entry) => !entry.truckDriver || entry.truckDriver === "TBD" || entry.truckDriver === "",
    ).length

    if (unassignedCount > 0) {
      unassignedSummary[type as TruckType] = unassignedCount
      totalUnassigned += unassignedCount
    }

    totalOrders += entries.length
  })

  // If there are no unassigned drivers, show a success message
  if (totalUnassigned === 0) {
    return (
      <Card className="mb-6 print:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Driver Assignment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">All drivers assigned</AlertTitle>
            <AlertDescription className="text-green-700">
              All {totalOrders} orders have drivers assigned.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 print:hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
          Driver Assignment Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unassigned Drivers</AlertTitle>
          <AlertDescription>
            {totalUnassigned} out of {totalOrders} orders ({Math.round((totalUnassigned / totalOrders) * 100)}%) need
            drivers assigned.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(unassignedSummary).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-3 border rounded-md">
              <span className="font-medium">{type}</span>
              <Badge variant="outline" className="bg-amber-50">
                {count} unassigned
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
