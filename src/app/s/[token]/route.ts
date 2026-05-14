import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { safePath } from "@/lib/pdf";
import fs from "fs";
import path from "path";
import { createReadStream } from "fs";
import { ReadableStream } from "stream/web";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { token } = await params;

  const share = await prisma.share.findUnique({ where: { token } });
  if (!share) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px">
        <h2>Link nicht gefunden</h2>
        <p>Dieser Link ist ungültig oder wurde widerrufen.</p>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  const target = safePath(share.path);
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
