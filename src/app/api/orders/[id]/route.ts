import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    const { searchParams } = new URL(req.url);
    const phoneParam = searchParams.get("phone");

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: params.id }, { orderNumber: params.id }],
      },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If admin, full access
    if (admin) {
      return NextResponse.json({ success: true, order });
    }

    // If customer, verify phone if provided or allow basic tracking info
    if (phoneParam) {
      const cleanOrderPhone = order.customerPhone.replace(/\D/g, "");
      const cleanInputPhone = phoneParam.replace(/\D/g, "");
      const isMatch =
        cleanInputPhone.length >= 7 &&
        (cleanOrderPhone.includes(cleanInputPhone) || cleanInputPhone.includes(cleanOrderPhone));

      if (!isMatch) {
        return NextResponse.json(
          { error: "Phone number does not match this order." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    const { searchParams } = new URL(req.url);
    const phoneParam = searchParams.get("phone");

    let bodyPhone: string | undefined;
    try {
      const body = await req.json();
      bodyPhone = body?.phone;
    } catch {
      // Body may be empty
    }

    const verificationPhone = phoneParam || bodyPhone;

    // Find the order
    const existing = await prisma.order.findFirst({
      where: {
        OR: [{ id: params.id }, { orderNumber: params.id }],
      },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 1. Admin Master Delete
    if (admin) {
      await prisma.order.delete({
        where: { id: existing.id },
      });

      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "DELETE_ORDER",
          details: `Deleted order #${existing.orderNumber} for customer ${existing.customerName} (Total: Rs. ${existing.grandTotal.toLocaleString()})`,
          entityType: "Order",
          entityId: existing.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Order #${existing.orderNumber} has been permanently deleted.`,
        deletedOrderId: existing.id,
      });
    }

    // 2. Customer Delete / Cancellation
    const cleanOrderPhone = existing.customerPhone.replace(/\D/g, "");
    const cleanInputPhone = verificationPhone ? verificationPhone.replace(/\D/g, "") : "";

    const isPhoneMatch =
      cleanInputPhone.length >= 7 &&
      (cleanOrderPhone.includes(cleanInputPhone) || cleanInputPhone.includes(cleanOrderPhone));

    if (!isPhoneMatch) {
      return NextResponse.json(
        {
          error:
            "Phone number verification required. Please verify with the phone number used for this order.",
        },
        { status: 403 }
      );
    }

    // Customer can only cancel/delete if order is PENDING or CANCELLED
    if (existing.orderStatus !== "PENDING" && existing.orderStatus !== "CANCELLED") {
      return NextResponse.json(
        {
          error: `This order is currently "${existing.orderStatus}". Orders that have already been confirmed, packed, or dispatched cannot be deleted online. Please contact our support team on WhatsApp at 071 777 4717.`,
        },
        { status: 400 }
      );
    }

    // Delete the order and all its items (cascade)
    await prisma.order.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({
      success: true,
      message: `Your order #${existing.orderNumber} has been cancelled and deleted successfully.`,
      deletedOrderId: existing.id,
    });
  } catch (err: any) {
    console.error("Order deletion error:", err);
    return NextResponse.json(
      { error: "Failed to delete order. Please try again or contact support." },
      { status: 500 }
    );
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
      include: { items: true },
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
