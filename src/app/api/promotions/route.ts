import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const whereClause: any = activeOnly ? { isActive: true } : {};

    const allCoupons = await prisma.coupon.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const coupons = activeOnly
      ? allCoupons.filter((c) => {
          if (c.startDate && new Date(c.startDate) > now) return false;
          if (c.endDate && new Date(c.endDate) < now) return false;
          if (c.usageLimit && c.timesUsed >= c.usageLimit) return false;
          return true;
        })
      : allCoupons;

    return NextResponse.json({ success: true, coupons });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { code, discountType, discountValue, minOrder, maxDiscount, usageLimit } = body;

    if (!code || !discountValue) {
      return NextResponse.json(
        { error: "Coupon code and discount value are required" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discountType: discountType || "PERCENTAGE",
        discountValue: Number(discountValue),
        minOrder: minOrder ? Number(minOrder) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
      },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "CREATE_COUPON",
        details: `Created coupon code ${coupon.code}`,
        entityType: "Coupon",
        entityId: coupon.id,
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create coupon" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, isActive, discountType, discountValue, minOrder, maxDiscount, usageLimit } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(discountType ? { discountType } : {}),
        ...(discountValue !== undefined ? { discountValue: Number(discountValue) } : {}),
        ...(minOrder !== undefined ? { minOrder: minOrder ? Number(minOrder) : null } : {}),
        ...(maxDiscount !== undefined ? { maxDiscount: maxDiscount ? Number(maxDiscount) : null } : {}),
        ...(usageLimit !== undefined ? { usageLimit: usageLimit ? Number(usageLimit) : null } : {}),
      },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "UPDATE_COUPON",
        details: `Updated coupon code ${updated.code} (Active: ${updated.isActive})`,
        entityType: "Coupon",
        entityId: updated.id,
      },
    });

    return NextResponse.json({ success: true, coupon: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const deleted = await prisma.coupon.delete({ where: { id } });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "DELETE_COUPON",
        details: `Deleted coupon code ${deleted.code}`,
        entityType: "Coupon",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
