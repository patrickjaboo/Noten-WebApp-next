import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPdfDir } from "@/lib/pdf";
import fs from "fs";
import path from "path";
import { createReadStream } from "fs";
import { ReadableStream } from "stream/web";

type Params = { params: Promise<{ token: string; file: string[] }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { token, file } = await params;

  const share = await prisma.share.findUnique({ where: { token } });
  if (!share) return new NextResponse("Not found", { status: 404 });

  const pdfDir = getPdfDir();
  const folderAbs = share.path === ""
    ? pdfDir
    : path.resolve(path.join(pdfDir, share.path));

  if (folderAbs !== pdfDir && !folderAbs.startsWith(pdfDir + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const filename = file[file.length - 1];
  const target = path.resolve(path.join(folderAbs, filename));

  // File must be a direct child of the shared folder
  if (path.dirname(target) !== folderAbs) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(target) || path.extname(target).toLowerCase() !== ".pdf") {
    return new NextResponse("Not found", { status: 404 });
  }

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
