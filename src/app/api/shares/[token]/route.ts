import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ token: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { token } = await params;
  await prisma.share.deleteMany({ where: { token } });
  return NextResponse.json({ ok: true });
}
