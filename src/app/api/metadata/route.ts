import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const rows = await prisma.metadata.findMany();
  const result: Record<string, { composer: string; tags: string[]; notes: string }> = {};
  for (const row of rows) {
    result[row.path] = {
      composer: row.composer,
      tags: JSON.parse(row.tags) as string[],
      notes: row.notes,
    };
  }
  return NextResponse.json(result);
}
