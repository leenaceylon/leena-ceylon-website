import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch available products with active sizes
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        sizes: {
          where: { isActive: true },
          orderBy: { weightGram: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // 2. Fetch recent shop orders (orders where orderNumber starts with SHOP- or paymentMethod is CREDIT_SHOP or marked as shop)
    const recentShopOrders = await prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { startsWith: "SHOP-" } },
          { paymentMethod: "CREDIT_SHOP" },
          { deliveryNotes: { contains: "SHOP:" } },
        ],
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // 3. Extract distinct previously registered shops
    const uniqueShopsMap = new Map<string, any>();
    recentShopOrders.forEach((o) => {
      if (o.customerName && !uniqueShopsMap.has(o.customerName.toLowerCase().trim())) {
        uniqueShopsMap.set(o.customerName.toLowerCase().trim(), {
          shopName: o.customerName,
          phone: o.customerPhone,
          routeTown: o.city,
          address: o.shippingAddress,
          district: o.district,
        });
      }
    });

    const knownShops = Array.from(uniqueShopsMap.values());

    return NextResponse.json({
      success: true,
      products,
      recentShopOrders,
      knownShops,
    });
  } catch (err: any) {
    console.error("Shop billing GET error:", err);
    return NextResponse.json(
      { error: "Failed to load shop billing inventory" },
      { status: 500 }
    );
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
      shopName,
      ownerName,
      shopPhone,
      routeTown,
      address,
      items,
      subtotal,
      discount = 0,
      deliveryCharge = 0,
      grandTotal,
      paymentMethod = "CASH_ON_DELIVERY",
      paymentStatus = "PAID",
      notes,
    } = body;

    if (!shopName || !shopName.trim()) {
      return NextResponse.json(
        { error: "Shop / Store Name is required." },
        { status: 400 }
      );
    }

    if (!shopPhone || !shopPhone.trim()) {
      return NextResponse.json(
        { error: "Shop Phone / WhatsApp number is required." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Please add at least one tea item to this bill." },
        { status: 400 }
      );
    }

    // Auto-generate Shop Order Reference: e.g. SHOP-2026-1042
    const year = new Date().getFullYear();
    const count = await prisma.order.count();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SHOP-${year}-${String(count + 1).padStart(4, "0")}-${randomSuffix}`;

    // Calculate line subtotals and prepare items
    const orderItemsData = items.map((it: any) => ({
      productId: it.productId || null,
      productName: it.productName,
      size: it.size || "Standard",
      unitPrice: Number(it.unitPrice) || 0,
      quantity: Number(it.quantity) || 1,
      subtotal: Number(it.subtotal) || Number(it.unitPrice) * Number(it.quantity),
      image: it.image || "/uploads/leena-tea-powder-200g.jpeg",
    }));

    const computedSubtotal = orderItemsData.reduce(
      (sum: number, it: any) => sum + it.subtotal,
      0
    );
    const finalGrandTotal = Math.max(
      0,
      computedSubtotal - Number(discount || 0) + Number(deliveryCharge || 0)
    );

    // Save in Order model with shop metadata
    const shopMetadata = `SHOP: ${shopName.trim()} | OWNER: ${ownerName || "Shop Manager"} | ROUTE: ${routeTown || "Kekirawa / Central"}${notes ? ` | NOTE: ${notes}` : ""}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: shopName.trim(),
        customerEmail: `shop-${Date.now()}@leenaceylon.com`,
        customerPhone: shopPhone.trim(),
        shippingAddress: address?.trim() || `${shopName}, ${routeTown || "Sri Lanka"}`,
        city: routeTown?.trim() || "Kekirawa",
        district: "Anuradhapura",
        postalCode: "50100",
        deliveryNotes: shopMetadata,
        subtotal: computedSubtotal,
        deliveryCharge: Number(deliveryCharge) || 0,
        discount: Number(discount) || 0,
        grandTotal: finalGrandTotal,
        paymentMethod,
        paymentStatus,
        orderStatus: "CONFIRMED", // Ground shop orders are immediately confirmed
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // Optionally update inventory stock for sold items
    for (const it of items) {
      if (it.productId) {
        try {
          await prisma.product.update({
            where: { id: it.productId },
            data: {
              stock: {
                decrement: Number(it.quantity) || 1,
              },
            },
          });
        } catch (stockErr) {
          console.warn("Could not decrement stock for product:", it.productId, stockErr);
        }
      }
    }

    // Log admin activity
    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "SHOP_BILLING_ORDER",
        details: `Took Shop Order #${order.orderNumber} for "${shopName}" (${routeTown || "Direct Route"}) - Total: Rs. ${order.grandTotal.toLocaleString()} (${paymentMethod})`,
        entityType: "Order",
        entityId: order.id,
      },
    });

    return NextResponse.json({
      success: true,
      order,
      message: `Shop bill #${order.orderNumber} recorded successfully!`,
    });
  } catch (err: any) {
    console.error("Shop billing POST error:", err);
    return NextResponse.json(
      { error: "Failed to record shop order and billing. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, orderId, paymentStatus, paymentMethod, paymentNote, cancelReason } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Shop bill not found." },
        { status: 404 }
      );
    }

    // 1. UPDATE PAYMENT STATUS & METHOD
    if (action === "UPDATE_PAYMENT") {
      if (!paymentStatus && !paymentMethod) {
        return NextResponse.json(
          { error: "Please specify payment status or method to update." },
          { status: 400 }
        );
      }

      const timestamp = new Date().toLocaleString("en-GB");
      let updatedNotes = order.deliveryNotes || "";
      if (paymentNote && paymentNote.trim()) {
        updatedNotes += ` | [Payment Update ${timestamp} by ${admin.name} (${admin.role})]: Status=${paymentStatus || order.paymentStatus}, Method=${paymentMethod || order.paymentMethod} - Note: ${paymentNote.trim()}`;
      } else {
        updatedNotes += ` | [Payment Update ${timestamp} by ${admin.name}]: Status=${paymentStatus || order.paymentStatus}, Method=${paymentMethod || order.paymentMethod}`;
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: paymentStatus || order.paymentStatus,
          paymentMethod: paymentMethod || order.paymentMethod,
          deliveryNotes: updatedNotes,
        },
        include: { items: true },
      });

      // Log activity
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "UPDATE_SHOP_BILL_PAYMENT",
          details: `Updated Payment for Bill #${order.orderNumber} (${order.customerName}): Status=${updatedOrder.paymentStatus}, Method=${updatedOrder.paymentMethod}${paymentNote ? ` - Note: ${paymentNote.trim()}` : ""}`,
          entityType: "Order",
          entityId: order.id,
        },
      });

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: `Payment for Bill #${order.orderNumber} updated to ${updatedOrder.paymentStatus} (${updatedOrder.paymentMethod}).`,
      });
    }

    // 2. CANCEL BILL WITH AUTOMATIC INVENTORY RESTOCKING
    if (action === "CANCEL_BILL") {
      if (order.orderStatus === "CANCELLED") {
        return NextResponse.json(
          { error: "This shop bill has already been cancelled." },
          { status: 400 }
        );
      }

      const timestamp = new Date().toLocaleString("en-GB");
      const reasonText = cancelReason?.trim() || "Cancelled by Sales Representative";
      const updatedNotes = `${order.deliveryNotes || ""} | [CANCELLED ${timestamp} by ${admin.name} (${admin.role})]: ${reasonText}`;

      // Update Order to CANCELLED
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: "CANCELLED",
          deliveryNotes: updatedNotes,
        },
        include: { items: true },
      });

      // Automatically Restock Product Inventory
      let restockedCount = 0;
      for (const item of order.items) {
        if (item.productId) {
          try {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
            restockedCount += item.quantity;
          } catch (restockErr) {
            console.warn("Could not restock product ID:", item.productId, restockErr);
          }
        }
      }

      // Log activity
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "CANCEL_SHOP_BILL",
          details: `Cancelled Shop Bill #${order.orderNumber} for "${order.customerName}" - Reason: ${reasonText}. Restocked ${restockedCount} units across ${order.items.length} item lines to warehouse inventory.`,
          entityType: "Order",
          entityId: order.id,
        },
      });

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: `Shop Bill #${order.orderNumber} cancelled successfully. ${restockedCount} items restocked back to warehouse inventory.`,
      });
    }

    return NextResponse.json(
      { error: `Invalid action "${action}". Must be UPDATE_PAYMENT or CANCEL_BILL.` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Shop billing PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update shop bill. Please try again." },
      { status: 500 }
    );
  }
}

