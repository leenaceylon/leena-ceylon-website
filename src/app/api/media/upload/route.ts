import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import fs from "fs";
import path from "path";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function ensureDirectories() {
  const brandDir = path.join(process.cwd(), "public", "brand");
  if (!fs.existsSync(brandDir)) {
    fs.mkdirSync(brandDir, { recursive: true });
  }
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return { brandDir, uploadsDir };
}

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

    const { brandDir, uploadsDir } = ensureDirectories();

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
    let localFilePath = "";

    if (isLogo) {
      // Replace official brand logo
      const ext = path.extname(file.name) || ".png";
      savedFilename = `logo${ext}`;
      localFilePath = path.join(brandDir, savedFilename);
      fs.writeFileSync(localFilePath, buffer);

      // Also update root public/brand/logo.png if png
      if (ext.toLowerCase() === ".png") {
        fs.writeFileSync(path.join(brandDir, "logo.png"), buffer);
      }
      relativeUrl = `/brand/${savedFilename}`;
    } else {
      // General upload: save directly to public/uploads
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const timestamp = Date.now();
      savedFilename = `${timestamp}_${cleanName}`;
      localFilePath = path.join(uploadsDir, savedFilename);
      fs.writeFileSync(localFilePath, buffer);
      relativeUrl = `/uploads/${savedFilename}`;
    }

    const cleanTitle = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const media = await prisma.media.create({
      data: {
        filename: savedFilename,
        originalName: isLogo ? "Official LEENA CEYLON Logo" : cleanTitle,
        mimeType: file.type,
        size: file.size,
        url: relativeUrl,
        altText: isLogo ? "Official LEENA CEYLON Logo" : cleanTitle,
      },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: isLogo ? "UPDATE_LOGO" : "UPLOAD_MEDIA",
        details: isLogo
          ? "Updated official LEENA CEYLON logo asset"
          : `Uploaded media asset "${file.name}" to ${relativeUrl}`,
        entityType: "Media",
        entityId: media.id,
      },
    });

    return NextResponse.json({
      success: true,
      media,
      localFilePath: isLogo ? `public/brand/${savedFilename}` : `public/uploads/${savedFilename}`,
    });
  } catch (err: any) {
    console.error("Media upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload file. Please verify file integrity." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandDir, uploadsDir } = ensureDirectories();

    const formData = await req.formData();
    const id = formData.get("id") as string | null;
    const file = formData.get("file") as File | null;
    const originalName = formData.get("originalName") as string | null;
    const altText = formData.get("altText") as string | null;

    if (!id) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 });
    }

    const existing = await prisma.media.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Media record not found" }, { status: 404 });
    }

    let updatedData: any = {};
    if (originalName) updatedData.originalName = originalName.trim();
    if (altText !== null && altText !== undefined) updatedData.altText = altText.trim();

    let savedFilename = existing.filename;
    let relativeUrl = existing.url;

    if (file) {
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

      if (existing.url.startsWith("/brand/")) {
        // Logo replacement
        const ext = path.extname(file.name) || ".png";
        savedFilename = `logo${ext}`;
        const logoPath = path.join(brandDir, savedFilename);
        fs.writeFileSync(logoPath, buffer);
        if (ext.toLowerCase() === ".png") {
          fs.writeFileSync(path.join(brandDir, "logo.png"), buffer);
        }
        relativeUrl = `/brand/${savedFilename}`;
      } else {
        // Overwrite existing file or save with fresh name in public/uploads/
        savedFilename = existing.filename;
        const uploadPath = path.join(uploadsDir, savedFilename);
        fs.writeFileSync(uploadPath, buffer);
        relativeUrl = existing.url;
      }

      updatedData.size = file.size;
      updatedData.mimeType = file.type;
      updatedData.filename = savedFilename;
      updatedData.url = relativeUrl;
      if (!originalName) {
        const cleanTitle = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        updatedData.originalName = cleanTitle;
      }
    }

    const media = await prisma.media.update({
      where: { id },
      data: updatedData,
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "UPDATE_MEDIA",
        details: `Updated media asset "${media.filename}" (${file ? "replaced physical file on disk" : "updated metadata"})`,
        entityType: "Media",
        entityId: media.id,
      },
    });

    return NextResponse.json({
      success: true,
      media,
      localFilePath: `public${media.url}`,
    });
  } catch (err: any) {
    console.error("Media update error:", err);
    return NextResponse.json({ error: "Failed to update media file" }, { status: 500 });
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

    // Attempt to remove physical file from public/uploads if it's not the logo
    if (media.url.startsWith("/uploads/")) {
      const localFilePath = path.join(process.cwd(), "public", media.url);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (e) {
          console.warn("Could not remove physical file from disk:", e);
        }
      }
    }

    await prisma.media.delete({ where: { id } });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "DELETE_MEDIA",
        details: `Deleted media file "${media.filename}" from disk and database`,
        entityType: "Media",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}
