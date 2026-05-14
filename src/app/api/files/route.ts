import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPdfFiles } from "@/lib/pdf";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  return NextResponse.json(getPdfFiles());
}
