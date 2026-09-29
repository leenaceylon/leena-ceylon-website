import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        sizes: true,
        images: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      include: { sizes: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if price changed
    const priceChanged =
      body.regularPrice !== undefined &&
      Number(body.regularPrice) !== existing.regularPrice;

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: body.name !== undefined ? body.name.trim() : existing.name,
        slug: body.slug !== undefined ? body.slug.trim() : existing.slug,
        sku: body.sku !== undefined ? body.sku.trim() : existing.sku,
        categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
        shortDescription: body.shortDescription !== undefined ? body.shortDescription : existing.shortDescription,
        fullDescription: body.fullDescription !== undefined ? body.fullDescription : existing.fullDescription,
        teaType: body.teaType !== undefined ? body.teaType : existing.teaType,
        teaGrade: body.teaGrade !== undefined ? body.teaGrade : existing.teaGrade,
        origin: body.origin !== undefined ? body.origin : existing.origin,
        regularPrice: body.regularPrice !== undefined ? Number(body.regularPrice) : existing.regularPrice,
        salePrice: body.salePrice !== undefined ? (body.salePrice ? Number(body.salePrice) : null) : existing.salePrice,
        stock: body.stock !== undefined ? Number(body.stock) : existing.stock,
        lowStockThreshold: body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : existing.lowStockThreshold,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : existing.isFeatured,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        mainImage: body.mainImage !== undefined ? body.mainImage : existing.mainImage,
        brewingGuide: body.brewingGuide !== undefined ? body.brewingGuide : existing.brewingGuide,
      },
    });

    // Update sizes if provided
    if (body.sizes && Array.isArray(body.sizes)) {
      for (const sz of body.sizes) {
        if (sz.id) {
          await prisma.productVariant.update({
            where: { id: sz.id },
            data: {
              sizeName: sz.sizeName,
              weightGram: Number(sz.weightGram) || 0,
              regularPrice: Number(sz.regularPrice),
              salePrice: sz.salePrice ? Number(sz.salePrice) : null,
              stock: Number(sz.stock),
              isActive: sz.isActive !== false,
            },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              productId: params.id,
              sizeName: sz.sizeName,
              weightGram: Number(sz.weightGram) || 0,
              regularPrice: Number(sz.regularPrice),
              salePrice: sz.salePrice ? Number(sz.salePrice) : null,
              stock: Number(sz.stock) || 50,
            },
          });
        }
      }
    }

    // Log Activity
    let actionLog = "EDIT_PRODUCT";
    let detailMsg = `Updated product "${updated.name}"`;
    if (priceChanged) {
      actionLog = "UPDATE_PRICE";
      detailMsg = `Changed price of "${updated.name}" from Rs. ${existing.regularPrice} to Rs. ${updated.regularPrice}`;
    }

    try {
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: actionLog,
          details: detailMsg,
          entityType: "Product",
          entityId: updated.id,
        },
      });
    } catch {}

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    console.error("Update product error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  return PUT(req, context);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id: params.id } });

    try {
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "DELETE_PRODUCT",
          details: `Deleted product "${existing.name}" (SKU: ${existing.sku})`,
          entityType: "Product",
          entityId: params.id,
        },
      });
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete product error:", err);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
