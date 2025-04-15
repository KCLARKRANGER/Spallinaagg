import { processScheduleData } from "./excel-processor"

// Generate sample schedule data for testing
export function getSampleData() {
  const sampleData = [
    {
      "Task Name": "Sample Job 1",
      "Truck Type (drop down)": "End Dump",
      "Pit Location (drop down)": "Pit A",
      "1st/2nd (labels)": "1st",
      "Drivers Assigned (labels)": "94 (Robert Clark)",
      "Time (short text)": "8:00 AM",
      "LOCATION (location)": "123 Main St",
      "QTY REQ'D (short text)": "10",
      "Material Type (drop down)": "Gravel",
      "Additional Delivery Notes (text)": "Enter through back gate",
    },
    {
      "Task Name": "Sample Job 2",
      "Truck Type (drop down)": "Super Dump",
      "Pit Location (drop down)": "Pit B",
      "1st/2nd (labels)": "1st",
      "Drivers Assigned (labels)": "95 (John Smith)",
      "Time (short text)": "9:30 AM",
      "LOCATION (location)": "456 Oak Ave",
      "QTY REQ'D (short text)": "5",
      "Material Type (drop down)": "Sand",
      "Additional Delivery Notes (text)": "Call on arrival",
    },
    {
      "Task Name": "Sample Job 3",
      "Truck Type (drop down)": "Transfer",
      "Pit Location (drop down)": "Pit C",
      "1st/2nd (labels)": "2nd",
      "Drivers Assigned (labels)": "",
      "Time (short text)": "1:00 PM",
      "LOCATION (location)": "789 Pine Rd",
      "QTY REQ'D (short text)": "8",
      "Material Type (drop down)": "Dirt",
      "Additional Delivery Notes (text)": "",
    },
  ]

  return processScheduleData(sampleData)
}
