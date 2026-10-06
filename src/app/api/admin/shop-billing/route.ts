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
