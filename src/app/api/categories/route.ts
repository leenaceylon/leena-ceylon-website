import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { FALLBACK_CATEGORIES } from "@/lib/fallback-data";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
    if (categories && categories.length > 0) {
      return NextResponse.json({ success: true, categories });
    }
    return NextResponse.json({ success: true, categories: FALLBACK_CATEGORIES });
  } catch (err: any) {
    console.warn("api/categories fallback activated:", err?.message);
    return NextResponse.json({ success: true, categories: FALLBACK_CATEGORIES });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug, description, image } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const cleanSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        description: description?.trim() || null,
        image: image || "/uploads/leena-tea-powder-200g.jpeg",
      },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "ADD_CATEGORY",
        details: `Created category "${category.name}"`,
        entityType: "Category",
        entityId: category.id,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    console.error("Create category error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create category" },
      { status: 500 }
    );
  }
}
