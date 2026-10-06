import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function extractSalesRepName(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/(?:SALES_REP|SALES REP|REP):\s*([^|]+)/i);
  if (match) return match[1].trim();
  const byMatch = notes.match(/by\s+([A-Za-z0-9._ -]+)\s*\((?:SALES_REP|ADMIN|MANAGER)\)/i);
  if (byMatch) return byMatch[1].trim();
  return null;
}

function parsePaymentDetails(o: any) {
  const grandTotal = Number(o.grandTotal) || 0;
  if (o.paymentStatus === "PAID") {
    return { paidAmount: grandTotal, dueAmount: 0, isPartial: false };
  }
  if (o.paymentStatus === "PARTIAL") {
    let paid = 0;
    let due = grandTotal;
    if (o.deliveryNotes) {
      const paidMatch = o.deliveryNotes.match(/paid=([0-9.]+)/i);
      const dueMatch = o.deliveryNotes.match(/due=([0-9.]+)/i);
      if (paidMatch) paid = parseFloat(paidMatch[1]) || 0;
      if (dueMatch) due = parseFloat(dueMatch[1]) || Math.max(0, grandTotal - paid);
      else due = Math.max(0, grandTotal - paid);
    }
    return { paidAmount: Math.min(grandTotal, paid), dueAmount: Math.max(0, due), isPartial: true };
  }
  return { paidAmount: 0, dueAmount: grandTotal, isPartial: false };
}

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawOrders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const orders = rawOrders.map((o) => {
      const isShopOrder =
        o.orderNumber.startsWith("SHOP-") ||
        o.paymentMethod === "CREDIT_SHOP" ||
        Boolean(o.deliveryNotes && (o.deliveryNotes.includes("SHOP:") || o.deliveryNotes.includes("SALES_REP:")));

      const salesRepName = extractSalesRepName(o.deliveryNotes);
      const { paidAmount, dueAmount, isPartial } = parsePaymentDetails(o);

      return {
        ...o,
        isShopOrder,
        salesRepName,
        paidAmount,
        dueAmount,
        isPartial,
        // For shop orders, normalize legacy "CONFIRMED" to "DELIVERED"
        orderStatus: isShopOrder && o.orderStatus === "CONFIRMED" ? "DELIVERED" : o.orderStatus,
      };
    });

    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    console.error("Admin orders GET error:", err);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
