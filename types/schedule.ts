export type TruckType = string

export interface ScheduleEntry {
  jobName: string
  truckType: TruckType
  pit: string
  shift: string
  truckDriver: string
  date: string
  time: string
  showUpTime?: string // New field for show-up time
  location: string
  qty: string
  materials: string
  notes: string
  numTrucks?: string
  interval?: string // New field for interval between trucks
  showUpOffset?: string // New field for show-up time offset
}

export interface ScheduleData {
  allEntries: ScheduleEntry[]
  byTruckType: Record<TruckType, ScheduleEntry[]>
}
