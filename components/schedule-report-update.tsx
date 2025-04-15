"use client"

import type { ScheduleData } from "./ScheduleData" // Import or declare ScheduleData
import type { TruckDriverData } from "./TruckDriverData" // Import or declare TruckDriverData
import { EditableRow } from "./EditableRow" // Import or declare EditableRow
import { useState } from "react"

// Add this to the ScheduleReportProps interface
interface ScheduleReportProps {
  data: ScheduleData
  referenceData?: TruckDriverData
}

// Then update the component to use the referenceData
export function ScheduleReport({ data: initialData, referenceData }: ScheduleReportProps) {
  const [isEditing, setIsEditing] = useState(false) // Declare isEditing
  const [editingIndex, setEditingIndex] = useState(null)
  const [data, setData] = useState(initialData)

  const onCancelEditing = () => {
    setIsEditing(false)
    setEditingIndex(null)
  }

  const onUpdateEntry = (index: number, updatedEntry: any) => {
    const newData = {
      ...data,
      truckTypes: data.truckTypes.map((truckType) => ({
        ...truckType,
        schedule: truckType.schedule.map((entry, i) => (i === index ? updatedEntry : entry)),
      })),
    }
    setData(newData)
    setIsEditing(false)
    setEditingIndex(null)
  }

  // ... existing code ...

  // Get available drivers from reference data
  const availableDrivers = referenceData?.drivers?.filter((driver) => driver.status === "active") || []

  // ... existing code ...

  const TruckTypeSection = ({ type }: { type: string }) => {
    const truckType = data.truckTypes.find((t) => t.type === type)
    if (!truckType) {
      return <div>No data found for truck type: {type}</div>
    }

    return (
      <div>
        <h3>{type}</h3>
        <table>
          <thead>
            <tr>
              <th>Job Name</th>
              <th>Time</th>
              <th>Truck Driver</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {truckType.schedule.map((entry, index) => {
              const displayTime = entry.time

              const onEdit = () => {
                setIsEditing(true)
                setEditingIndex(index)
              }

              if (isEditing && editingIndex === index) {
                return (
                  <EditableRow
                    key={`${entry.jobName}-${entry.truckDriver}-${index}-edit`}
                    entry={{ ...entry, time: displayTime || entry.time }}
                    index={index}
                    type={type}
                    onCancel={onCancelEditing}
                    onSave={onUpdateEntry}
                    availableDrivers={availableDrivers}
                  />
                )
              }

              return (
                <tr key={`${entry.jobName}-${entry.truckDriver}-${index}`}>
                  <td>{entry.jobName}</td>
                  <td>{displayTime}</td>
                  <td>{entry.truckDriver}</td>
                  <td>
                    <button onClick={onEdit}>Edit</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      <h2>Schedule Report</h2>
      <TruckTypeSection type="Reefer" />
      <TruckTypeSection type="DryVan" />
    </div>
  )
}
