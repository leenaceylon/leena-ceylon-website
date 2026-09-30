import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return new NextResponse("Image Not Found", { status: 404 });
    }

    // 1. Try serving from local disk if file exists in public/uploads/
    if (media.url && media.url.startsWith("/uploads/")) {
      try {
        const diskPath = path.join(process.cwd(), "public", media.url);
        if (fs.existsSync(diskPath)) {
          const fileBuffer = fs.readFileSync(diskPath);
          return new NextResponse(fileBuffer, {
            headers: {
              "Content-Type": media.mimeType || "image/jpeg",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      } catch (e) {
        // Disk not available, fall through to database backup
      }
    }

    // 2. Try serving from database base64 backup stored in altText
    if (media.altText && media.altText.startsWith("data:")) {
      const parts = media.altText.split(";base64,");
      if (parts.length === 2) {
        const mime = parts[0].replace("data:", "") || media.mimeType || "image/jpeg";
        const buf = Buffer.from(parts[1], "base64");
        return new NextResponse(buf, {
          headers: {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    // 3. Fallback: if media.url points to a static or external path
    if (media.url && !media.url.includes(`/api/media/file/${id}`)) {
      return NextResponse.redirect(new URL(media.url, req.url));
    }

    return new NextResponse("Image data unavailable", { status: 404 });
  } catch (err: any) {
    console.error("Error serving media file:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
