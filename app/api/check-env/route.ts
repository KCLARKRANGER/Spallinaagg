import { NextResponse } from "next/server"

export async function GET() {
  try {
    const envVars = [
      {
        name: "CLICKUP_CLIENT_ID",
        value: process.env.CLICKUP_CLIENT_ID,
        isSet: !!process.env.CLICKUP_CLIENT_ID,
        isPublic: false,
      },
      {
        name: "CLICKUP_API_TOKEN",
        value: process.env.CLICKUP_API_TOKEN,
        isSet: !!process.env.CLICKUP_API_TOKEN,
        isPublic: false,
      },
      {
        name: "NEXT_PUBLIC_APP_URL",
        value: process.env.NEXT_PUBLIC_APP_URL,
        isSet: !!process.env.NEXT_PUBLIC_APP_URL,
        isPublic: true,
      },
      {
        name: "CLICKUP_CLIENT_SECRET",
        value: process.env.CLICKUP_CLIENT_SECRET,
        isSet: !!process.env.CLICKUP_CLIENT_SECRET,
        isPublic: false,
      },
    ]

    return NextResponse.json({
      success: true,
      envVars,
    })
  } catch (error) {
    console.error("Error checking environment variables:", error)
    return NextResponse.json({ success: false, error: "Failed to check environment variables" }, { status: 500 })
  }
}
