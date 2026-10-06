import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "orderNumber" | "phone" | "all"
    const value = searchParams.get("value") || searchParams.get("q") || "";
    const orderNumberParam = searchParams.get("orderNumber");
    const phoneParam = searchParams.get("phone");

    const queryTerm = (orderNumberParam || phoneParam || value).trim();

    if (!queryTerm) {
      return NextResponse.json(
        { error: "Please provide an Order Number or Phone Number to track." },
        { status: 400 }
      );
    }

    let orders: any[] = [];

    // Cleaned representations
    const cleanDigits = queryTerm.replace(/\D/g, "");
    const cleanOrderNumber = queryTerm.replace(/^#/, "").trim();

    // Check search type or auto-detect
    const isExplicitPhone = type === "phone" || Boolean(phoneParam);
    const isExplicitOrder = type === "orderNumber" || Boolean(orderNumberParam);

    if (isExplicitPhone) {
      // Searching explicitly by phone number
      orders = await searchByPhone(cleanDigits, queryTerm);
    } else if (isExplicitOrder) {
      // Searching explicitly by order number
      orders = await searchByOrderNumber(cleanOrderNumber);
    } else {
      // Auto-detect based on query structure:
      // If query is mostly digits (7-12 digits) or starts with +94 / 07, try phone first then order
      if (cleanDigits.length >= 7 && (queryTerm.startsWith("+") || queryTerm.startsWith("0") || cleanDigits.length === queryTerm.length)) {
        orders = await searchByPhone(cleanDigits, queryTerm);
        // Fallback to order number if no phone matched
        if (orders.length === 0) {
          orders = await searchByOrderNumber(cleanOrderNumber);
        }
      } else {
        // Try order number first
        orders = await searchByOrderNumber(cleanOrderNumber);
        // Fallback to phone if no order matched
        if (orders.length === 0 && cleanDigits.length >= 6) {
          orders = await searchByPhone(cleanDigits, queryTerm);
        }
      }
    }

    // Format safe response for customer
    const sanitizedOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      customerName: o.customerName,
      customerPhone: maskPhoneNumber(o.customerPhone),
      rawPhone: o.customerPhone,
      shippingAddress: o.shippingAddress,
      city: o.city,
      district: o.district,
      postalCode: o.postalCode,
      deliveryNotes: o.deliveryNotes,
      subtotal: o.subtotal,
      deliveryCharge: o.deliveryCharge,
      discount: o.discount,
      grandTotal: o.grandTotal,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      items: o.items.map((it: any) => ({
        id: it.id,
        productName: it.productName,
        size: it.size,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        subtotal: it.subtotal,
        image: it.image || "/uploads/leena-tea-powder-200g.jpeg",
      })),
    }));

    return NextResponse.json({
      success: true,
      count: sanitizedOrders.length,
      orders: sanitizedOrders,
      searchQuery: queryTerm,
    });
  } catch (err: any) {
    console.error("Order tracking API error:", err);
    return NextResponse.json(
      { error: "Failed to look up order. Please verify your input and try again." },
      { status: 500 }
    );
  }
}

async function searchByOrderNumber(orderNum: string) {
  if (!orderNum) return [];

  // Match exact or startsWith/contains
  return await prisma.order.findMany({
    where: {
      OR: [
        { orderNumber: { equals: orderNum, mode: "insensitive" } },
        { orderNumber: { contains: orderNum, mode: "insensitive" } },
        { id: orderNum },
      ],
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

async function searchByPhone(cleanDigits: string, rawInput: string) {
  if (!cleanDigits && !rawInput) return [];

  // Sri Lanka phone variations: e.g. 0717774717, 94717774717, 717774717, 071 777 4717
  const phoneVariations: string[] = [];

  if (rawInput) phoneVariations.push(rawInput);
  if (cleanDigits) phoneVariations.push(cleanDigits);

  // If starts with 94 and is 11 digits: e.g. 94717774717 -> 0717774717, 717774717
  if (cleanDigits.startsWith("94") && cleanDigits.length >= 11) {
    const local = "0" + cleanDigits.slice(2);
    const bare = cleanDigits.slice(2);
    phoneVariations.push(local, bare);
  } else if (cleanDigits.startsWith("0") && cleanDigits.length >= 10) {
    // e.g. 0717774717 -> 94717774717, 717774717
    const intl = "94" + cleanDigits.slice(1);
    const bare = cleanDigits.slice(1);
    phoneVariations.push(intl, bare);
  } else if (cleanDigits.length >= 7) {
    // Bare 9 digits e.g. 717774717
    phoneVariations.push("0" + cleanDigits, "94" + cleanDigits);
  }

  // Remove duplicates
  const uniquePatterns = Array.from(new Set(phoneVariations.filter(Boolean)));

  const orConditions = uniquePatterns.map((pat) => ({
    customerPhone: { contains: pat },
  }));

  return await prisma.order.findMany({
    where: {
      OR: orConditions,
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

function maskPhoneNumber(phone: string) {
  if (!phone || phone.length < 5) return phone;
  // keep first 3 and last 2 characters e.g. 071***17
  const trimmed = phone.trim();
  if (trimmed.length <= 6) return trimmed;
  const start = trimmed.slice(0, 3);
  const end = trimmed.slice(-2);
  return `${start}****${end}`;
}
