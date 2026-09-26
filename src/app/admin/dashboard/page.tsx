import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import {
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Plus,
} from "lucide-react";

export const revalidate = 0; // Always real-time database driven

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  // Calculate real metrics from database
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    allOrders,
    todayOrders,
    monthOrders,
    pendingOrdersCount,
    deliveredOrdersCount,
    totalCustomers,
    totalProducts,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    prisma.order.findMany({ select: { grandTotal: true } }),
    prisma.order.findMany({
      where: { createdAt: { gte: startOfToday } },
      select: { grandTotal: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { grandTotal: true },
    }),
    prisma.order.count({ where: { orderStatus: "PENDING" } }),
    prisma.order.count({ where: { orderStatus: "DELIVERED" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { stock: { lte: 15 }, isActive: true },
      select: { id: true, name: true, stock: true, sku: true },
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalSales = allOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const todaySales = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const monthSales = monthOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalOrdersCount = allOrders.length;

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            LEENA CEYLON Operations
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
            Executive Dashboard
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Real-time sales, order fulfillment, and tea inventory metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-tea-border bg-white hover:bg-tea-bg text-tea-dark text-xs font-semibold uppercase tracking-wider transition"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* 9 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
        {/* Today's Sales */}
        <div className="p-5 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium block">Today’s Sales</span>
            <span className="font-serif text-2xl font-bold text-tea-forest mt-1 block">
              Rs. {todaySales.toLocaleString()}
            </span>
            <span className="text-[11px] text-tea-muted mt-0.5 block">
              {todayOrders.length} {todayOrders.length === 1 ? "order" : "orders"} today
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* This Month's Sales */}
        <div className="p-5 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium block">This Month’s Sales</span>
            <span className="font-serif text-2xl font-bold text-tea-forest mt-1 block">
              Rs. {monthSales.toLocaleString()}
            </span>
            <span className="text-[11px] text-tea-muted mt-0.5 block">
              {monthOrders.length} monthly orders
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Sales */}
        <div className="p-5 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium block">Total Revenue</span>
            <span className="font-serif text-2xl font-bold text-tea-dark mt-1 block">
              Rs. {totalSales.toLocaleString()}
            </span>
            <span className="text-[11px] text-tea-muted mt-0.5 block">
              Lifetime sales volume
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium block">Total Orders</span>
            <span className="font-serif text-2xl font-bold text-tea-dark mt-1 block">
              {totalOrdersCount}
            </span>
            <span className="text-[11px] text-tea-muted mt-0.5 block">Processed orders</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Orders */}
        <div className="p-5 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium block">Pending Orders</span>
            <span className="font-serif text-2xl font-bold text-amber-600 mt-1 block">
              {pendingOrdersCount}
            </span>
            <span className="text-[11px] text-amber-700 mt-0.5 block">Awaiting confirmation</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Orders */}
        <div className="p-5 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium block">Delivered Orders</span>
            <span className="font-serif text-2xl font-bold text-emerald-600 mt-1 block">
              {deliveredOrdersCount}
            </span>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">Delivered safely</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Customers */}
        <div className="p-5 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium block">Registered Customers</span>
            <span className="font-serif text-2xl font-bold text-tea-dark mt-1 block">
              {totalCustomers}
            </span>
            <span className="text-[11px] text-tea-muted mt-0.5 block">Customer accounts</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Products */}
        <div className="p-5 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium block">Active Teas & Spices</span>
            <span className="font-serif text-2xl font-bold text-tea-dark mt-1 block">
              {totalProducts}
            </span>
            <span className="text-[11px] text-tea-muted mt-0.5 block">Catalog items</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-tea-forest flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium block">Low Stock Alerts</span>
            <span className="font-serif text-2xl font-bold text-rose-600 mt-1 block">
              {lowStockProducts.length}
            </span>
            <span className="text-[11px] text-rose-600 mt-0.5 block">
              {lowStockProducts.length === 0 ? "Inventory healthy" : "Requires restocking"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Orders & Quick Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-tea-border shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-tea-border">
            <h3 className="font-serif text-base font-bold text-tea-dark">Recent Orders</h3>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-tea-forest hover:text-tea-dark transition flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-tea-muted text-xs">
              No orders yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-tea-border/60 text-tea-muted">
                    <th className="pb-3 font-semibold">Order</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">District</th>
                    <th className="pb-3 font-semibold">Total</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tea-border/40">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-tea-surface/60 transition">
                      <td className="py-3 font-bold text-tea-dark">#{o.orderNumber}</td>
                      <td className="py-3">
                        <div className="font-medium text-tea-dark">{o.customerName}</div>
                        <div className="text-[10px] text-tea-muted">{o.customerPhone}</div>
                      </td>
                      <td className="py-3 text-tea-dark">{o.district}</td>
                      <td className="py-3 font-bold text-tea-forest">
                        Rs. {o.grandTotal.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.orderStatus === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : o.orderStatus === "CANCELLED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="px-2.5 py-1 rounded-lg border border-tea-border hover:bg-tea-bg text-[11px] font-semibold text-tea-forest"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Operations & Low Stock Watchlist */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Operations */}
          <div className="bg-white p-6 rounded-2xl border border-tea-border shadow-subtle space-y-3">
            <h3 className="font-serif text-sm font-bold text-tea-dark uppercase tracking-wider">
              Quick Shortcuts
            </h3>
            <div className="space-y-2">
              <Link
                href="/admin/products"
                className="flex items-center justify-between p-3 rounded-xl bg-tea-surface hover:bg-tea-bg border border-tea-border text-xs font-semibold text-tea-dark transition"
              >
                <span>Edit Product Prices & Stock</span>
                <ArrowRight className="w-4 h-4 text-tea-leaf" />
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center justify-between p-3 rounded-xl bg-tea-surface hover:bg-tea-bg border border-tea-border text-xs font-semibold text-tea-dark transition"
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  WhatsApp Ordering Settings
                </span>
                <ArrowRight className="w-4 h-4 text-tea-leaf" />
              </Link>

              <Link
                href="/admin/sales"
                className="flex items-center justify-between p-3 rounded-xl bg-tea-surface hover:bg-tea-bg border border-tea-border text-xs font-semibold text-tea-dark transition"
              >
                <span>Sales Reports & CSV Export</span>
                <ArrowRight className="w-4 h-4 text-tea-leaf" />
              </Link>
            </div>
          </div>

          {/* Low Stock Items Card */}
          <div className="bg-white p-6 rounded-2xl border border-tea-border shadow-subtle space-y-3">
            <h3 className="font-serif text-sm font-bold text-tea-dark uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Stock Alert Watchlist
            </h3>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-tea-muted">No products currently low on stock.</p>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/60 text-xs"
                  >
                    <div>
                      <h4 className="font-semibold text-tea-dark">{p.name}</h4>
                      <p className="text-[10px] text-tea-muted">SKU: {p.sku}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px]">
                      {p.stock} units
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
