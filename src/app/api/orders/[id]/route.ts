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
    const customerDetailsChanged =
      Boolean(
        (body.customerName && body.customerName !== existing.customerName) ||
        (body.customerPhone && body.customerPhone !== existing.customerPhone) ||
        (body.customerEmail !== undefined && body.customerEmail !== existing.customerEmail) ||
        (body.shippingAddress && body.shippingAddress !== existing.shippingAddress) ||
        (body.city && body.city !== existing.city) ||
        (body.district && body.district !== existing.district) ||
        (body.deliveryNotes !== undefined && body.deliveryNotes !== existing.deliveryNotes)
      );

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        orderStatus: body.orderStatus || existing.orderStatus,
        paymentStatus: body.paymentStatus || existing.paymentStatus,
        ...(body.customerName ? { customerName: body.customerName.trim() } : {}),
        ...(body.customerPhone ? { customerPhone: body.customerPhone.trim() } : {}),
        ...(body.customerEmail !== undefined ? { customerEmail: body.customerEmail.trim() } : {}),
        ...(body.shippingAddress ? { shippingAddress: body.shippingAddress.trim() } : {}),
        ...(body.city ? { city: body.city.trim() } : {}),
        ...(body.district ? { district: body.district.trim() } : {}),
        ...(body.postalCode !== undefined ? { postalCode: body.postalCode ? body.postalCode.trim() : null } : {}),
        ...(body.deliveryNotes !== undefined ? { deliveryNotes: body.deliveryNotes ? body.deliveryNotes.trim() : null } : {}),
      },
      include: { items: true },
    });

    let syncCount = 0;
    if (body.syncAllCustomerOrders && customerDetailsChanged) {
      const syncConditions: any[] = [];
      if (existing.customerId) {
        syncConditions.push({ customerId: existing.customerId });
      }
      if (existing.customerPhone && existing.customerPhone.trim()) {
        syncConditions.push({ customerPhone: existing.customerPhone.trim() });
      }
      if (existing.customerName && existing.customerName.trim()) {
        syncConditions.push({ customerName: existing.customerName.trim() });
      }

      if (syncConditions.length > 0) {
        const syncResult = await prisma.order.updateMany({
          where: {
            id: { not: existing.id },
            OR: syncConditions,
          },
          data: {
            ...(body.customerName ? { customerName: body.customerName.trim() } : {}),
            ...(body.customerPhone ? { customerPhone: body.customerPhone.trim() } : {}),
            ...(body.customerEmail !== undefined ? { customerEmail: body.customerEmail.trim() } : {}),
            ...(body.shippingAddress ? { shippingAddress: body.shippingAddress.trim() } : {}),
            ...(body.city ? { city: body.city.trim() } : {}),
            ...(body.district ? { district: body.district.trim() } : {}),
            ...(body.postalCode !== undefined ? { postalCode: body.postalCode ? body.postalCode.trim() : null } : {}),
          },
        });
        syncCount = syncResult.count;
      }

      if (existing.customerId) {
        try {
          await prisma.user.update({
            where: { id: existing.customerId },
            data: {
              ...(body.customerName ? { name: body.customerName.trim() } : {}),
              ...(body.customerPhone ? { phone: body.customerPhone.trim() } : {}),
              ...(body.customerEmail ? { email: body.customerEmail.trim() } : {}),
            },
          });
        } catch (uErr) {
          console.error("Could not update linked user record:", uErr);
        }
      }
    }

    if (customerDetailsChanged) {
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "UPDATE_CUSTOMER_DETAILS",
          details: `Updated customer details on order #${updated.orderNumber} (Name: ${updated.customerName}, Phone: ${updated.customerPhone})${syncCount > 0 ? ` and synchronized ${syncCount} other past order(s)` : ""}.`,
          entityType: "Order",
          entityId: updated.id,
        },
      });
    }

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

    return NextResponse.json({
      success: true,
      order: updated,
      synchronizedOrdersCount: syncCount,
      message: `Order #${updated.orderNumber} updated successfully.${syncCount > 0 ? ` Synchronized ${syncCount} other customer order(s).` : ""}`,
    });
  } catch (err: any) {
    console.error("Order status update error:", err);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
