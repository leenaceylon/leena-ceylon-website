import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "orders"; // "orders" or "products" or "customers"

    if (type === "orders") {
      const orders = await prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });

      const headers = [
        "Order Number",
        "Date",
        "Order Channel",
        "Sales Rep",
        "Customer / Shop Name",
        "Phone",
        "Email",
        "District",
        "City",
        "Address",
        "Payment Method",
        "Payment Status",
        "Order Status",
        "Subtotal (Rs)",
        "Delivery (Rs)",
        "Grand Total (Rs)",
        "Items Count",
      ];

      const rows = orders.map((o) => {
        const isShop =
          o.orderNumber.startsWith("SHOP-") ||
          o.paymentMethod === "CREDIT_SHOP" ||
          Boolean(o.deliveryNotes && (o.deliveryNotes.includes("SHOP:") || o.deliveryNotes.includes("SALES_REP:")));
        const rep = isShop
          ? (extractSalesRepName(o.deliveryNotes) || "Direct Sales Rep")
          : "N/A (Online / WhatsApp Order)";
        const channel = isShop ? "Sales Rep Ground Bill" : "Online / WhatsApp";

        return [
          `"${o.orderNumber}"`,
          `"${new Date(o.createdAt).toISOString()}"`,
          `"${channel}"`,
          `"${rep.replace(/"/g, '""')}"`,
          `"${o.customerName.replace(/"/g, '""')}"`,
          `"${o.customerPhone}"`,
          `"${o.customerEmail}"`,
          `"${o.district}"`,
          `"${o.city}"`,
          `"${o.shippingAddress.replace(/"/g, '""')}"`,
          `"${o.paymentMethod}"`,
          `"${o.paymentStatus}"`,
          `"${isShop && o.orderStatus === "CONFIRMED" ? "DELIVERED" : o.orderStatus}"`,
          o.subtotal,
          o.deliveryCharge,
          o.grandTotal,
          o.items.length,
        ];
      });

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="leena-ceylon-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  } catch (err: any) {
    console.error("CSV Export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
