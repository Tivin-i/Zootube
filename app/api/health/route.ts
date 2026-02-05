import { NextResponse } from "next/server";

/**
 * Health check endpoint for Docker and monitoring
 * Returns 200 OK if the server is running
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
