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
  Store,
  CreditCard,
  Building2,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";

export const revalidate = 0; // Always real-time database driven

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  // Requirement 1: SHOP_ORDER_REP accounts must NOT open the executive dashboard
  if (admin.role === "SHOP_ORDER_REP") {
    redirect("/admin/shop-billing");
  }

  // Calculate real metrics from database
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let allOrders: any[] = [];
  let todayOrders: any[] = [];
  let monthOrders: any[] = [];
  let pendingOrdersCount = 0;
  let deliveredOrdersCount = 0;
  let totalCustomers = 0;
  let totalProducts = 4;
  let lowStockProducts: any[] = [];
  let recentOrders: any[] = [];

  try {
    const res = await Promise.all([
      prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          grandTotal: true,
          paymentMethod: true,
          paymentStatus: true,
          deliveryNotes: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startOfToday } },
        select: { grandTotal: true, orderNumber: true, paymentMethod: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: { grandTotal: true, orderNumber: true, paymentMethod: true },
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
    allOrders = res[0] || [];
    todayOrders = res[1] || [];
    monthOrders = res[2] || [];
    pendingOrdersCount = res[3] || 0;
    deliveredOrdersCount = res[4] || 0;
    totalCustomers = res[5] || 0;
    totalProducts = res[6] || 4;
    lowStockProducts = res[7] || [];
    recentOrders = res[8] || [];
  } catch (err: any) {
    console.warn("Notice: could not load all dashboard metrics:", err?.message);
  }

  // Requirement 2: Calculate full sales amounts for Super Admin and Manager
  const totalSales = allOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const todaySales = todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const monthSales = monthOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalOrdersCount = allOrders.length;

  // Shop Orders (Ground sales) vs Online Customer Orders
  const shopOrders = allOrders.filter(
    (o) =>
      o.orderNumber?.startsWith("SHOP-") ||
      o.paymentMethod === "CREDIT_SHOP" ||
      o.deliveryNotes?.includes("SHOP:")
  );
  const shopSales = shopOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const shopOrdersCount = shopOrders.length;

  const onlineOrders = allOrders.filter(
    (o) =>
      !o.orderNumber?.startsWith("SHOP-") &&
      o.paymentMethod !== "CREDIT_SHOP" &&
      !o.deliveryNotes?.includes("SHOP:")
  );
  const onlineSales = onlineOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const onlineOrdersCount = onlineOrders.length;

  // Collection Status: Paid vs Credit / Due Receivables
  const paidSales = allOrders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const creditDueSales = allOrders
    .filter((o) => o.paymentStatus !== "PAID")
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const isSuperAdmin = admin.role === "SUPER_ADMIN";
  const isManager = admin.role === "MANAGER";

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-tea-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              LEENA CEYLON Operations
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isSuperAdmin
                  ? "bg-tea-dark text-white"
                  : isManager
                  ? "bg-tea-leaf text-white"
                  : "bg-tea-bg text-tea-forest"
              }`}
            >
              {admin.role}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark mt-1">
            Executive Sales & Operations Dashboard
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Real-time financial revenue, shop-by-shop van sales, online orders, and tea inventory metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/shop-billing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
          >
            <Store className="w-4 h-4" />
            <span>Shop Billing</span>
          </Link>
          <Link
            href="/admin/sales"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-tea-border bg-white hover:bg-tea-bg text-tea-dark text-xs font-semibold uppercase tracking-wider transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-tea-forest" />
            <span>Sales Reports</span>
          </Link>
        </div>
      </div>

      {/* SALES AMOUNT MASTER PANEL (Visible to Super Admin & Manager Admin) */}
      <div className="bg-gradient-to-br from-tea-dark to-[#0f2317] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-tea-leaf/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-tea-gold font-bold">
              Consolidated Revenue Metrics
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              Rs. {totalSales.toLocaleString()}
            </h2>
            <p className="text-xs text-tea-pale/80 mt-0.5">
              Lifetime Total Sales Amount across all ground retail shops and online customers ({totalOrdersCount} orders)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-right">
              <span className="text-[10px] text-tea-pale/70 block uppercase tracking-wider">Today's Sales</span>
              <span className="font-serif text-lg font-bold text-emerald-300">
                Rs. {todaySales.toLocaleString()}
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-right">
              <span className="text-[10px] text-tea-pale/70 block uppercase tracking-wider">Month Sales</span>
              <span className="font-serif text-lg font-bold text-tea-gold">
                Rs. {monthSales.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Sales Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 relative z-10">
          {/* Shop-by-Shop Orders Revenue */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-tea-pale/80">
              <span className="flex items-center gap-1.5 font-medium">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                Shop Van Sales
              </span>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded">
                {shopOrdersCount} bills
              </span>
            </div>
            <div className="font-serif text-xl font-bold text-emerald-300 pt-1">
              Rs. {shopSales.toLocaleString()}
            </div>
            <p className="text-[10px] text-tea-pale/60">
              Ground retail shop order collections
            </p>
          </div>

          {/* Online & WhatsApp Orders Revenue */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-tea-pale/80">
              <span className="flex items-center gap-1.5 font-medium">
                <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
                Online & WhatsApp
              </span>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded">
                {onlineOrdersCount} orders
              </span>
            </div>
            <div className="font-serif text-xl font-bold text-blue-300 pt-1">
              Rs. {onlineSales.toLocaleString()}
            </div>
            <p className="text-[10px] text-tea-pale/60">
              Direct website & WhatsApp customer orders
            </p>
          </div>

          {/* Paid / Collected Revenue */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-tea-pale/80">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-tea-gold" />
                Paid / Realized
              </span>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded">
                Collected
              </span>
            </div>
            <div className="font-serif text-xl font-bold text-tea-gold pt-1">
              Rs. {paidSales.toLocaleString()}
            </div>
            <p className="text-[10px] text-tea-pale/60">
              Cash on spot & confirmed bank transfers
            </p>
          </div>

          {/* Credit / Due Receivables */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-tea-pale/80">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Credit / Due
              </span>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                Receivables
              </span>
            </div>
            <div className="font-serif text-xl font-bold text-amber-300 pt-1">
              Rs. {creditDueSales.toLocaleString()}
            </div>
            <p className="text-[10px] text-tea-pale/60">
              Outstanding shop credits & pending payments
            </p>
          </div>
        </div>
      </div>

      {/* 6 Core Operations Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

        {/* Total Orders Volume */}
        <div className="p-5 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium block">Total Orders Processed</span>
            <span className="font-serif text-2xl font-bold text-tea-dark mt-1 block">
              {totalOrdersCount}
            </span>
            <span className="text-[11px] text-tea-muted mt-0.5 block">All channels combined</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Orders & Quick Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-tea-border shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-tea-border">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-base font-bold text-tea-dark">Recent Incoming Orders</h3>
              <span className="text-xs text-tea-muted">({recentOrders.length} latest)</span>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-tea-forest hover:text-tea-dark transition flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-tea-muted text-xs">
              No orders registered in the system yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-tea-border/60 text-tea-muted">
                    <th className="pb-3 font-semibold">Order #</th>
                    <th className="pb-3 font-semibold">Customer / Shop</th>
                    <th className="pb-3 font-semibold">Channel</th>
                    <th className="pb-3 font-semibold">Total Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tea-border/40">
                  {recentOrders.map((o) => {
                    const isShop = o.orderNumber?.startsWith("SHOP-") || o.paymentMethod === "CREDIT_SHOP";

                    return (
                      <tr key={o.id} className="hover:bg-tea-surface/60 transition">
                        <td className="py-3 font-bold text-tea-dark">#{o.orderNumber}</td>
                        <td className="py-3">
                          <div className="font-medium text-tea-dark">{o.customerName}</div>
                          <div className="text-[10px] text-tea-muted">{o.customerPhone}</div>
                        </td>
                        <td className="py-3">
                          {isShop ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                              <Store className="w-3 h-3" />
                              Shop Bill
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                              <ShoppingCart className="w-3 h-3" />
                              Online
                            </span>
                          )}
                        </td>
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
                    );
                  })}
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
              Management Shortcuts
            </h3>
            <div className="space-y-2">
              <Link
                href="/admin/shop-billing"
                className="flex items-center justify-between p-3 rounded-xl bg-tea-surface hover:bg-tea-bg border border-tea-border text-xs font-semibold text-tea-dark transition"
              >
                <span className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  Take Shop Order & Bill
                </span>
                <ArrowRight className="w-4 h-4 text-tea-leaf" />
              </Link>

              <Link
                href="/admin/products"
                className="flex items-center justify-between p-3 rounded-xl bg-tea-surface hover:bg-tea-bg border border-tea-border text-xs font-semibold text-tea-dark transition"
              >
                <span>Edit Product Prices & Stock</span>
                <ArrowRight className="w-4 h-4 text-tea-leaf" />
              </Link>

              <Link
                href="/admin/sales"
                className="flex items-center justify-between p-3 rounded-xl bg-tea-surface hover:bg-tea-bg border border-tea-border text-xs font-semibold text-tea-dark transition"
              >
                <span>Full Sales Reports & Analytics</span>
                <ArrowRight className="w-4 h-4 text-tea-leaf" />
              </Link>

              {isSuperAdmin && (
                <Link
                  href="/admin/users"
                  className="flex items-center justify-between p-3 rounded-xl bg-tea-surface hover:bg-tea-bg border border-tea-border text-xs font-semibold text-tea-dark transition"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-tea-leaf" />
                    Manage Admin Users (Super Admin)
                  </span>
                  <ArrowRight className="w-4 h-4 text-tea-leaf" />
                </Link>
              )}
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
