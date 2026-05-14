import { NextResponse } from "next/server";

// Phase 3 Stub — OMR-Service ist noch nicht implementiert
export async function POST() {
  return NextResponse.json(
    { error: "OMR-Service ist noch nicht verfügbar (Phase 3)" },
    { status: 501 }
  );
}
