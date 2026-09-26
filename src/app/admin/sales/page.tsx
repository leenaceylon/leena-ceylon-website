import React from "react";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import Link from "next/link";
import {
  Download,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  BarChart2,
  Calendar,
} from "lucide-react";

export const revalidate = 0;

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams?: { period?: string };
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const period = searchParams?.period || "month";
  const now = new Date();
  let startDate = new Date();

  if (period === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "yesterday") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  } else if (period === "7days") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "30days") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === "prevmonth") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  } else {
    // "month"
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Fetch orders in period
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate },
      orderStatus: { not: "CANCELLED" },
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const totalSales = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const orderCount = orders.length;
  const aov = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

  // Aggregate product sales
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  for (const o of orders) {
    for (const item of o.items) {
      if (!productSalesMap[item.productName]) {
        productSalesMap[item.productName] = {
          name: item.productName,
          qty: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.productName].qty += item.quantity;
      productSalesMap[item.productName].revenue += item.subtotal;
    }
  }

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-tea-border">
        <div>
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            Financial Analytics
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
            Sales Reports & Export
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Analyze tea revenue performance, average order values, and export records
          </p>
        </div>

        <a
          href="/api/sales/export?type=orders"
          download
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          EXPORT TO CSV
        </a>
      </div>

      {/* Date Range Preset Pills */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-tea-muted mr-1 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Filter:
        </span>
        {[
          { label: "Today", val: "today" },
          { label: "Yesterday", val: "yesterday" },
          { label: "Last 7 Days", val: "7days" },
          { label: "Last 30 Days", val: "30days" },
          { label: "This Month", val: "month" },
          { label: "Previous Month", val: "prevmonth" },
        ].map((btn) => (
          <Link
            key={btn.val}
            href={`/admin/sales?period=${btn.val}`}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              period === btn.val
                ? "bg-tea-dark text-white shadow-sm"
                : "bg-white border border-tea-border text-tea-dark hover:bg-tea-bg"
            }`}
          >
            {btn.label}
          </Link>
        ))}
      </div>

      {/* 3 Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium">Selected Period Sales</span>
            <span className="font-serif text-3xl font-bold text-tea-forest mt-1 block">
              Rs. {totalSales.toLocaleString()}
            </span>
            <span className="text-[11px] text-tea-muted mt-0.5 block">Net confirmed revenue</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium">Completed Orders</span>
            <span className="font-serif text-3xl font-bold text-tea-dark mt-1 block">
              {orderCount}
            </span>
            <span className="text-[11px] text-tea-muted mt-0.5 block">Non-cancelled orders</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium">Average Order Value (AOV)</span>
            <span className="font-serif text-3xl font-bold text-tea-dark mt-1 block">
              Rs. {aov.toLocaleString()}
            </span>
            <span className="text-[11px] text-tea-muted mt-0.5 block">Average revenue per order</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white p-6 rounded-2xl border border-tea-border shadow-subtle space-y-4">
        <h3 className="font-serif text-base font-bold text-tea-dark pb-3 border-b border-tea-border">
          Top Performing Teas
        </h3>

        {topProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-tea-muted">
            No sales data recorded for this selected time window.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-tea-surface border-b border-tea-border text-tea-muted font-semibold">
                <tr>
                  <th className="py-3 px-4">Tea Product</th>
                  <th className="py-3 px-4">Quantity Dispatched</th>
                  <th className="py-3 px-4 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tea-border/60">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-tea-surface/40 transition">
                    <td className="py-3 px-4 font-bold text-tea-dark">{p.name}</td>
                    <td className="py-3 px-4 text-tea-muted">{p.qty} units</td>
                    <td className="py-3 px-4 text-right font-serif font-bold text-tea-forest">
                      Rs. {p.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
