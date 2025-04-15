import { formatTruckWithDriver } from "@/lib/driver-data"
import { Badge } from "@/components/ui/badge"

interface TruckDisplayProps {
  truckNumber: string
  className?: string
  showType?: boolean
}

export function TruckDisplay({ truckNumber, className = "", showType = false }: TruckDisplayProps) {
  // Special case for "SMI-FIRST RETURNING TRUCK"
  if (truckNumber === "SMI-FIRST RETURNING TRUCK") {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className="font-medium text-amber-600">FIRST RETURNING TRUCK</span>
        {showType && (
          <Badge variant="outline" className="mt-1 text-xs bg-amber-50 text-amber-800 border-amber-200">
            Any Type
          </Badge>
        )}
      </div>
    )
  }

  const { truck, driver, truckType } = formatTruckWithDriver(truckNumber)

  // Define color mapping for truck types
  const typeColorMap: Record<string, string> = {
    "Tractor Trailer": "bg-green-50 text-green-800 border-green-200",
    Trailer: "bg-green-50 text-green-800 border-green-200", // Same as Tractor Trailer
    "Dump Truck": "bg-orange-50 text-orange-800 border-orange-200",
    Triaxle: "bg-orange-50 text-orange-800 border-orange-200", // Same as Dump Truck
    Slinger: "bg-yellow-50 text-yellow-800 border-yellow-200",
    "6 Wheeler": "bg-blue-50 text-blue-800 border-blue-200",
    "Standard Mixer": "bg-purple-50 text-purple-800 border-purple-200",
    Mixer: "bg-purple-50 text-purple-800 border-purple-200", // Same as Standard Mixer
    Conveyor: "bg-teal-50 text-teal-800 border-teal-200",
  }

  // Get color class or default to blue
  const typeColorClass =
    truckType && typeColorMap[truckType] ? typeColorMap[truckType] : "bg-blue-50 text-blue-800 border-blue-200"

  return (
    <div className={`flex flex-col ${className}`}>
      <span className="font-medium">{truck}</span>
      {driver && <span className="text-xs text-muted-foreground">{driver}</span>}
      {showType && truckType && (
        <Badge variant="outline" className={`mt-1 text-xs ${typeColorClass}`}>
          {truckType}
        </Badge>
      )}
    </div>
  )
}
