import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import fs from "fs";
import path from "path";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function GET() {
  try {
    const media = await prisma.media.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, media });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const isLogo = formData.get("isLogo") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and SVG are permitted." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum permitted size of 5 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let relativeUrl = "";
    let savedFilename = "";

    if (isLogo) {
      // Replace official brand logo
      const ext = path.extname(file.name) || ".png";
      savedFilename = `logo${ext}`;
      const logoPath = path.join(process.cwd(), "public", "brand", savedFilename);
      fs.writeFileSync(logoPath, buffer);
      // Also update root public/brand/logo.png if png
      if (ext.toLowerCase() === ".png") {
        fs.writeFileSync(path.join(process.cwd(), "public", "brand", "logo.png"), buffer);
      }
      relativeUrl = `/brand/${savedFilename}`;
    } else {
      // General upload
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const timestamp = Date.now();
      savedFilename = `${timestamp}_${cleanName}`;
      const uploadPath = path.join(process.cwd(), "public", "uploads", savedFilename);
      fs.writeFileSync(uploadPath, buffer);
      relativeUrl = `/uploads/${savedFilename}`;
    }

    const media = await prisma.media.create({
      data: {
        filename: savedFilename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: relativeUrl,
        altText: isLogo ? "Official LEENA CEYLON Logo" : file.name,
      },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: isLogo ? "UPDATE_LOGO" : "UPLOAD_MEDIA",
        details: isLogo
          ? "Updated official LEENA CEYLON logo asset"
          : `Uploaded media asset "${file.name}"`,
        entityType: "Media",
        entityId: media.id,
      },
    });

    return NextResponse.json({ success: true, media });
  } catch (err: any) {
    console.error("Media upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload file. Please verify file integrity." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 });
    }

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    await prisma.media.delete({ where: { id } });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "DELETE_MEDIA",
        details: `Deleted media file "${media.filename}"`,
        entityType: "Media",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}
