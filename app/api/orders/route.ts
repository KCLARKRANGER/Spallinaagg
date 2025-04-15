import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Log the incoming data
    console.log("Received order data:", body)

    // Validate required fields
    if (!body.client_id || !body.task_id || !body.name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Here you would typically process the data, store it, etc.
    // For now, we'll just acknowledge receipt

    return NextResponse.json({
      success: true,
      message: `Successfully received task "${body.name}"`,
      taskId: body.task_id,
    })
  } catch (error) {
    console.error("Error processing order:", error)
    return NextResponse.json(
      {
        error: "Failed to process order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
