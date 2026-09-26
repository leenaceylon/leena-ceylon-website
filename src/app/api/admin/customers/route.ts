import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      include: {
        orders: { select: { id: true, grandTotal: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      isActive: c.isActive,
      createdAt: c.createdAt,
      orderCount: c.orders.length,
      totalSpent: c.orders.reduce((sum, o) => sum + o.grandTotal, 0),
    }));

    return NextResponse.json({ success: true, customers: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load customers" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, isActive } = await req.json();
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "UPDATE_CUSTOMER_STATUS",
        details: `${isActive ? "Activated" : "Suspended"} customer account ${updated.email}`,
        entityType: "User",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
