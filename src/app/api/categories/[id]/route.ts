import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug, description, image, isActive } = await req.json();
    const updated = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: name?.trim(),
        slug: slug?.trim(),
        description: description?.trim(),
        image: image,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    try {
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "UPDATE_CATEGORY",
          details: `Updated category "${updated.name}"`,
          entityType: "Category",
          entityId: updated.id,
        },
      });
    } catch {}

    return NextResponse.json({ success: true, category: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
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

    const existing = await prisma.category.findUnique({
      where: { id: params.id },
      include: { products: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (existing.products.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete category containing ${existing.products.length} active products.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: params.id } });

    try {
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "DELETE_CATEGORY",
          details: `Deleted category "${existing.name}"`,
          entityType: "Category",
          entityId: params.id,
        },
      });
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
