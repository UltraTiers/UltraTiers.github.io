import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://ultratiers.onrender.com/players", {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Player request failed with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch players:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}