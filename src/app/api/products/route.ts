import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        sizes: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      sku,
      categoryId,
      shortDescription,
      fullDescription,
      teaType,
      teaGrade,
      origin,
      regularPrice,
      salePrice,
      stock,
      lowStockThreshold,
      isFeatured,
      isActive,
      mainImage,
      brewingGuide,
      sizes,
    } = body;

    if (!name || !sku || !categoryId) {
      return NextResponse.json(
        { error: "Name, SKU, and Category are required" },
        { status: 400 }
      );
    }

    const cleanSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        sku: sku.trim(),
        categoryId,
        shortDescription: shortDescription || "",
        fullDescription: fullDescription || "",
        teaType: teaType || "Pure Ceylon Black Tea",
        teaGrade: teaGrade || "BOPF",
        origin: origin || "Sri Lanka",
        regularPrice: Number(regularPrice) || 0,
        salePrice: salePrice ? Number(salePrice) : null,
        stock: Number(stock) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 10,
        isFeatured: Boolean(isFeatured),
        isActive: isActive !== false,
        mainImage: mainImage || "/brand/logo.png",
        brewingGuide: brewingGuide || null,
        sizes: sizes && Array.isArray(sizes)
          ? {
              create: sizes.map((s: any) => ({
                sizeName: s.sizeName,
                weightGram: Number(s.weightGram) || 0,
                regularPrice: Number(s.regularPrice) || Number(regularPrice),
                salePrice: s.salePrice ? Number(s.salePrice) : null,
                stock: Number(s.stock) || 50,
                sku: s.sku || null,
              })),
            }
          : undefined,
      },
    });

    // Log admin activity
    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "ADD_PRODUCT",
        details: `Created product "${product.name}" with regular price Rs. ${product.regularPrice}`,
        entityType: "Product",
        entityId: product.id,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    console.error("Create product error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
