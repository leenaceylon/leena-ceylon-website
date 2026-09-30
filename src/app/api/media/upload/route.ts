import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import fs from "fs";
import path from "path";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/jpg",
  "image/pjpeg",
  "image/jfif",
  "image/x-png",
  "image/avif",
  "image/gif",
];

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".svg",
  ".avif",
  ".jfif",
  ".gif",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function ensureDirectories() {
  let brandDir = path.join(process.cwd(), "public", "brand");
  let uploadsDir = path.join(process.cwd(), "public", "uploads");
  let canWrite = true;

  try {
    if (!fs.existsSync(brandDir)) {
      fs.mkdirSync(brandDir, { recursive: true });
    }
  } catch (e) {
    canWrite = false;
  }

  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (e) {
    canWrite = false;
  }

  return { brandDir, uploadsDir, canWrite };
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
      return NextResponse.json({ error: "Unauthorized. Please log in as admin." }, { status: 401 });
    }

    const { brandDir, uploadsDir, canWrite } = ensureDirectories();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const isLogo = formData.get("isLogo") === "true";

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const mimeType = (file.type || "").toLowerCase();

    // Check MIME type or extension
    const isAllowedMime = ALLOWED_MIME_TYPES.includes(mimeType);
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);

    if (!isAllowedMime && !isAllowedExt) {
      return NextResponse.json(
        { error: `Unsupported image format (${mimeType || ext}). Please upload JPG, PNG, WebP, or SVG.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `File size (${sizeMb} MB) exceeds maximum permitted limit of 10 MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const resolvedMime = mimeType || (ext === ".png" ? "image/png" : "image/jpeg");
    const base64Data = `data:${resolvedMime};base64,${buffer.toString("base64")}`;

    let relativeUrl = "";
    let savedFilename = "";
    let localFilePath = "";
    let savedLocally = false;

    if (isLogo) {
      const fileExt = ext || ".png";
      savedFilename = `logo${fileExt}`;

      if (canWrite) {
        try {
          localFilePath = path.join(brandDir, savedFilename);
          fs.writeFileSync(localFilePath, buffer);
          if (fileExt === ".png") {
            fs.writeFileSync(path.join(brandDir, "logo.png"), buffer);
          }
          savedLocally = true;
        } catch (fsErr) {
          console.warn("Local disk write not available (read-only filesystem on Vercel):", fsErr);
        }
      }
      relativeUrl = `/brand/${savedFilename}`;
    } else {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const timestamp = Date.now();
      savedFilename = `${timestamp}_${cleanName}`;

      if (canWrite) {
        try {
          localFilePath = path.join(uploadsDir, savedFilename);
          fs.writeFileSync(localFilePath, buffer);
          savedLocally = true;
        } catch (fsErr) {
          console.warn("Local disk write not available (read-only filesystem on Vercel):", fsErr);
        }
      }
      relativeUrl = `/uploads/${savedFilename}`;
    }

    const cleanTitle = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    // Create database media record
    // Store backup data URL in altText so /api/media/file/[id] can always serve it even if filesystem is read-only
    const media = await prisma.media.create({
      data: {
        filename: savedFilename,
        originalName: isLogo ? "Official LEENA CEYLON Logo" : cleanTitle,
        mimeType: resolvedMime,
        size: file.size,
        url: savedLocally ? relativeUrl : "/api/media/file/temp",
        altText: base64Data,
      },
    });

    // If local disk writing was not permitted (e.g. Vercel), route through dynamic media file server
    if (!savedLocally) {
      relativeUrl = `/api/media/file/${media.id}`;
      await prisma.media.update({
        where: { id: media.id },
        data: { url: relativeUrl },
      });
      media.url = relativeUrl;
    }

    // Safely log admin activity (does not crash upload if constraints fail)
    try {
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name || "Admin",
          action: isLogo ? "UPDATE_LOGO" : "UPLOAD_MEDIA",
          details: isLogo
            ? "Updated official LEENA CEYLON logo asset"
            : `Uploaded media asset "${file.name}" to ${relativeUrl}`,
          entityType: "Media",
          entityId: media.id,
        },
      });
    } catch (logErr) {
      console.warn("Could not log admin activity:", logErr);
    }

    return NextResponse.json({
      success: true,
      media,
      localFilePath: savedLocally
        ? (isLogo ? `public/brand/${savedFilename}` : `public/uploads/${savedFilename}`)
        : "Database & Cloud Storage (Vercel Serverless)",
    });
  } catch (err: any) {
    console.error("Media upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to upload file. Please check file format and try again." },
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

    const { brandDir, uploadsDir, canWrite } = ensureDirectories();

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
    let savedLocally = false;

    if (file) {
      const ext = path.extname(file.name).toLowerCase();
      const mimeType = (file.type || "").toLowerCase();

      const isAllowedMime = ALLOWED_MIME_TYPES.includes(mimeType);
      const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);

      if (!isAllowedMime && !isAllowedExt) {
        return NextResponse.json(
          { error: `Unsupported image format (${mimeType || ext}). Please upload JPG, PNG, WebP, or SVG.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        return NextResponse.json(
          { error: `File size (${sizeMb} MB) exceeds maximum permitted limit of 10 MB.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const resolvedMime = mimeType || (ext === ".png" ? "image/png" : "image/jpeg");
      const base64Data = `data:${resolvedMime};base64,${buffer.toString("base64")}`;

      if (existing.url.startsWith("/brand/")) {
        const fileExt = ext || ".png";
        savedFilename = `logo${fileExt}`;

        if (canWrite) {
          try {
            const logoPath = path.join(brandDir, savedFilename);
            fs.writeFileSync(logoPath, buffer);
            if (fileExt === ".png") {
              fs.writeFileSync(path.join(brandDir, "logo.png"), buffer);
            }
            savedLocally = true;
          } catch (fsErr) {
            console.warn("Could not write logo to disk:", fsErr);
          }
        }
        relativeUrl = `/brand/${savedFilename}`;
      } else {
        savedFilename = existing.filename;
        if (canWrite) {
          try {
            const uploadPath = path.join(uploadsDir, savedFilename);
            fs.writeFileSync(uploadPath, buffer);
            savedLocally = true;
          } catch (fsErr) {
            console.warn("Could not write upload to disk:", fsErr);
          }
        }
        relativeUrl = existing.url.startsWith("/api/media/file/") ? existing.url : `/uploads/${savedFilename}`;
      }

      if (!savedLocally && !existing.url.startsWith("/api/media/file/")) {
        relativeUrl = `/api/media/file/${existing.id}`;
      }

      updatedData.size = file.size;
      updatedData.mimeType = resolvedMime;
      updatedData.filename = savedFilename;
      updatedData.url = relativeUrl;
      updatedData.altText = base64Data; // update backup base64 in database

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

    try {
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name || "Admin",
          action: "UPDATE_MEDIA",
          details: `Updated media asset "${media.filename}" (${file ? "replaced file content" : "updated metadata"})`,
          entityType: "Media",
          entityId: media.id,
        },
      });
    } catch (logErr) {
      console.warn("Could not log admin activity:", logErr);
    }

    return NextResponse.json({
      success: true,
      media,
      localFilePath: savedLocally ? `public${media.url}` : "Database & Cloud Storage (Vercel Serverless)",
    });
  } catch (err: any) {
    console.error("Media update error:", err);
    return NextResponse.json({ error: err?.message || "Failed to update media file" }, { status: 500 });
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
      try {
        const localFilePath = path.join(process.cwd(), "public", media.url);
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } catch (e) {
        console.warn("Could not remove physical file from disk:", e);
      }
    }

    await prisma.media.delete({ where: { id } });

    try {
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name || "Admin",
          action: "DELETE_MEDIA",
          details: `Deleted media file "${media.filename}"`,
          entityType: "Media",
          entityId: id,
        },
      });
    } catch (logErr) {
      console.warn("Could not log admin activity:", logErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete media" }, { status: 500 });
  }
}
