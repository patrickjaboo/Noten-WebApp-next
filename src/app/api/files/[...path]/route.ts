import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { safePath } from "@/lib/pdf";
import { prisma } from "@/lib/db";
import fs from "fs";

type Params = { params: Promise<{ path: string[] }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { path: pathParts } = await params;
  const rel = pathParts.join("/");
  const target = safePath(rel);

  if (!target) {
    return NextResponse.json({ error: "PDF nicht gefunden" }, { status: 404 });
  }

  fs.unlinkSync(target);

  // Remove metadata entry if it exists
  await prisma.metadata.deleteMany({ where: { path: rel } });
  // Remove shares for this file
  await prisma.share.deleteMany({ where: { path: rel } });

  return NextResponse.json({ ok: true });
}
