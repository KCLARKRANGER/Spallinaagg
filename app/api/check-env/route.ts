import { NextResponse } from "next/server"

export async function GET() {
  try {
    // List of environment variables to check
    const envVars = ["CLICKUP_API_TOKEN", "CLICKUP_CLIENT_ID", "CLICKUP_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"]

    // Check each environment variable
    const variables: Record<string, any> = {}

    envVars.forEach((name) => {
      const value = process.env[name]

      variables[name] = {
        exists: !!value,
        masked: !!value,
        preview: value ? value.substring(0, 5) : null,
      }
    })

    return NextResponse.json({
      success: true,
      variables,
    })
  } catch (error) {
    console.error("Error checking environment variables:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check environment variables",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
