import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { safePath } from "@/lib/pdf";
import fs from "fs";
import path from "path";
import { ReadableStream } from "stream/web";
import { createReadStream } from "fs";

type Params = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { path: pathParts } = await params;
  const rel = pathParts.join("/");
  const target = safePath(rel);

  if (!target) {
    return NextResponse.json({ error: "PDF nicht gefunden" }, { status: 404 });
  }

  const filename = path.basename(target);
  const stat = fs.statSync(target);
  const nodeStream = createReadStream(target);

  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
  });

  return new NextResponse(webStream as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(stat.size),
    },
  });
}
