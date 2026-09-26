import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
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
    const existing = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const statusChanged =
      body.orderStatus && body.orderStatus !== existing.orderStatus;
    const paymentChanged =
      body.paymentStatus && body.paymentStatus !== existing.paymentStatus;

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        orderStatus: body.orderStatus || existing.orderStatus,
        paymentStatus: body.paymentStatus || existing.paymentStatus,
      },
    });

    if (statusChanged) {
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "UPDATE_ORDER_STATUS",
          details: `Changed order #${updated.orderNumber} status from "${existing.orderStatus}" to "${updated.orderStatus}"`,
          entityType: "Order",
          entityId: updated.id,
        },
      });
    }

    if (paymentChanged) {
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "UPDATE_PAYMENT_STATUS",
          details: `Changed order #${updated.orderNumber} payment from "${existing.paymentStatus}" to "${updated.paymentStatus}"`,
          entityType: "Order",
          entityId: updated.id,
        },
      });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error("Order status update error:", err);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
