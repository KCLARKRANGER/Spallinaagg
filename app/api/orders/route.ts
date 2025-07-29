import { type NextRequest, NextResponse } from "next/server"

// Mock data for testing
const mockOrders = [
  {
    id: "1",
    taskName: "MODERN MASONRY",
    truckType: "Slinger",
    pitLocation: "SM-WB",
    shift: "Scheduled",
    driversAssigned: "SMI95S",
    dueDate: "Monday, July 28th 2025, 2:00:00 pm -04:00",
    location: "9560 BIG TREE RD, HEMLOCK, N.Y.",
    qtyRequired: "1: LD",
    materialType: "Crushed 1's per Ton",
    notes: "",
    numberOfTrucks: 1,
    intervalBetweenTrucks: 0,
    showUpTimeOffset: 15,
  },
  {
    id: "2",
    taskName: "MORRELL BLDRS",
    truckType: "Slinger",
    pitLocation: "SM-WB",
    shift: "Scheduled",
    driversAssigned: "SMI95S",
    dueDate: "Monday, July 28th 2025, 12:00:00 pm -04:00",
    location: "LOTS 22 & 23 PIERCEBROOK EST., CANANDAIGUA, N.Y.",
    qtyRequired: "2: LD",
    materialType: "Crushed 1's per Ton",
    notes: "",
    numberOfTrucks: 1,
    intervalBetweenTrucks: 0,
    showUpTimeOffset: 15,
  },
]

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      data: mockOrders,
      total: mockOrders.length,
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 300))

    const newOrder = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: newOrder,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ success: false, error: "Failed to create order" }, { status: 500 })
  }
}
