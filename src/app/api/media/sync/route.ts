import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import fs from "fs";
import path from "path";

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const brandDir = path.join(process.cwd(), "public", "brand");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(brandDir)) {
      fs.mkdirSync(brandDir, { recursive: true });
    }

    let addedCount = 0;
    let updatedCount = 0;

    // Scan public/uploads
    const uploadFiles = fs.readdirSync(uploadsDir);
    for (const filename of uploadFiles) {
      const ext = path.extname(filename).toLowerCase();
      const mimeType = MIME_MAP[ext];
      if (!mimeType) continue; // Skip non-images

      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) continue;

      const url = `/uploads/${filename}`;
      const existing = await prisma.media.findFirst({
        where: {
          OR: [{ url }, { filename }],
        },
      });

      if (!existing) {
        const cleanTitle = filename
          .replace(/^\d+_/, "")
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        await prisma.media.create({
          data: {
            filename,
            originalName: cleanTitle,
            mimeType,
            size: stats.size,
            url,
            altText: cleanTitle,
          },
        });
        addedCount++;
      } else {
        // Update size if it changed on disk
        if (existing.size !== stats.size) {
          await prisma.media.update({
            where: { id: existing.id },
            data: { size: stats.size },
          });
          updatedCount++;
        }
      }
    }

    // Scan public/brand for logo
    if (fs.existsSync(brandDir)) {
      const brandFiles = fs.readdirSync(brandDir);
      for (const filename of brandFiles) {
        const ext = path.extname(filename).toLowerCase();
        const mimeType = MIME_MAP[ext];
        if (!mimeType) continue;

        const filePath = path.join(brandDir, filename);
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) continue;

        const url = `/brand/${filename}`;
        const existing = await prisma.media.findFirst({
          where: { url },
        });

        if (!existing) {
          await prisma.media.create({
            data: {
              filename,
              originalName: "Official LEENA CEYLON Logo",
              mimeType,
              size: stats.size,
              url,
              altText: "Official LEENA CEYLON Logo",
            },
          });
          addedCount++;
        }
      }
    }

    const totalMedia = await prisma.media.count();

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "SYNC_MEDIA",
        details: `Synchronized local image files on disk (${addedCount} newly added, ${updatedCount} refreshed, total ${totalMedia} files)`,
        entityType: "Media",
      },
    });

    return NextResponse.json({
      success: true,
      addedCount,
      updatedCount,
      totalCount: totalMedia,
      message:
        addedCount > 0
          ? `Successfully synchronized ${addedCount} local image file(s) into Media Library!`
          : `All local image files in public/uploads/ are already synchronized (${totalMedia} total files).`,
    });
  } catch (err: any) {
    console.error("Local media sync error:", err);
    return NextResponse.json({ error: "Failed to sync local media files" }, { status: 500 });
  }
}
