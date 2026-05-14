import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ path: string[] }> };

export async function POST(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { path: pathParts } = await params;
  const filePath = pathParts.join("/");

  const body = await request.json().catch(() => ({}));
  const composer = typeof body.composer === "string" ? body.composer : "";
  const tags = Array.isArray(body.tags) ? body.tags : [];
  const notes = typeof body.notes === "string" ? body.notes : "";

  await prisma.metadata.upsert({
    where: { path: filePath },
    update: { composer, tags: JSON.stringify(tags), notes },
    create: { path: filePath, composer, tags: JSON.stringify(tags), notes },
  });

  return NextResponse.json({ ok: true });
}
