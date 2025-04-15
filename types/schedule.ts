export type TruckType = string

export interface ScheduleEntry {
  jobName: string
  truckType: TruckType
  pit: string
  shift: string
  truckDriver: string
  date: string
  time: string
  location: string
  qty: string
  materials: string
  notes: string
  numTrucks?: string // Add this field
}

export interface ScheduleData {
  allEntries: ScheduleEntry[]
  byTruckType: Record<TruckType, ScheduleEntry[]>
}
