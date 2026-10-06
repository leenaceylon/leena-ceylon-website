import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Boxes,
  Printer,
  ChevronRight,
  MapPin,
  CheckCircle2,
  UserCheck,
} from "lucide-react";

export const revalidate = 0; // Always real-time database driven

function extractSalesRepName(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/(?:SALES_REP|SALES REP|REP):\s*([^|]+)/i);
  if (match) return match[1].trim();
  const byMatch = notes.match(/by\s+([A-Za-z0-9._ -]+)\s*\((?:SALES_REP|ADMIN|MANAGER)\)/i);
  if (byMatch) return byMatch[1].trim();
  return null;
}

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const isShopRep = admin.role === "SHOP_ORDER_REP";

  // ==========================================
  // 1. SALES REPRESENTATIVE DEDICATED DASHBOARD
  // "that dashboard need only list of available product and billing option"
  // ==========================================
  if (isShopRep) {
    let repProducts: any[] = [];
    let recentRepOrders: any[] = [];

    try {
      const [prods, orders] = await Promise.all([
        prisma.product.findMany({
          where: { isActive: true },
          include: {
            category: true,
            sizes: {
              where: { isActive: true },
              orderBy: { weightGram: "asc" },
            },
          },
          orderBy: { name: "asc" },
        }),
        prisma.order.findMany({
          where: {
            OR: [
              { orderNumber: { startsWith: "SHOP-" } },
              { paymentMethod: "CREDIT_SHOP" },
              { deliveryNotes: { contains: "SHOP:" } },
            ],
          },
          include: { items: true },
          orderBy: { createdAt: "desc" },
        }),
      ]);
      repProducts = prods || [];
      recentRepOrders = orders || [];
    } catch (err: any) {
      console.warn("Could not load sales rep data:", err?.message);
    }

    const totalInStock = repProducts.filter((p) => p.stock > 0).length;
    const lowStockCount = repProducts.filter((p) => p.stock <= 15).length;

    // Group all old bills by Shop Name (Customer Store History)
    const repShopsMap = new Map<string, any>();
    recentRepOrders.forEach((o) => {
      const key = o.customerName ? o.customerName.toLowerCase().trim() : "";
      if (!key) return;

      if (!repShopsMap.has(key)) {
        repShopsMap.set(key, {
          shopName: o.customerName.trim(),
          phone: o.customerPhone,
          city: o.city || "Direct Route",
          address: o.shippingAddress,
          totalBills: 0,
          totalSpent: 0,
          pendingBalance: 0,
          pendingBillsCount: 0,
          orders: [],
        });
      }

      const s = repShopsMap.get(key);
      s.totalBills += 1;
      s.orders.push(o);

      if (o.orderStatus !== "CANCELLED") {
        s.totalSpent += o.grandTotal;
        const grandTotal = Number(o.grandTotal) || 0;
        let dueAmount = 0;
        if (o.paymentStatus === "PAID") {
          dueAmount = 0;
        } else if (o.paymentStatus === "PARTIAL") {
          let paid = 0;
          let due = grandTotal;
          if (o.deliveryNotes) {
            const paidMatch = o.deliveryNotes.match(/paid=([0-9.]+)/i);
            const dueMatch = o.deliveryNotes.match(/due=([0-9.]+)/i);
            if (paidMatch) paid = parseFloat(paidMatch[1]) || 0;
            if (dueMatch) due = parseFloat(dueMatch[1]) || Math.max(0, grandTotal - paid);
            else due = Math.max(0, grandTotal - paid);
          }
          dueAmount = Math.max(0, due);
        } else {
          dueAmount = grandTotal;
        }

        if (dueAmount > 0) {
          s.pendingBalance += dueAmount;
          s.pendingBillsCount += 1;
        }
      }
    });

    const repShopsList = Array.from(repShopsMap.values()).sort(
      (a, b) => b.totalSpent - a.totalSpent
    );

    const totalRepPendingCredit = repShopsList.reduce(
      (sum, s) => sum + s.pendingBalance,
      0
    );
    const totalRepSalesRevenue = repShopsList.reduce(
      (sum, s) => sum + s.totalSpent,
      0
    );

    return (
      <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Sales Rep Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-tea-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <Store className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sales Rep Ground Terminal</span>
              </span>
              <span className="text-xs text-tea-muted font-medium">• Field Operations</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark mt-1">
              Welcome, {admin.name}
            </h1>
            <p className="text-xs text-tea-muted mt-0.5">
              Your field rep workstation: Access available warehouse teas, stock counts, wholesale rates, and take retail shop orders.
            </p>
          </div>

          <Link
            href="/admin/shop-billing"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-md self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-emerald-200" />
            <span>Open Billing Counter</span>
          </Link>
        </div>

        {/* 3 Primary Action Cards: Billing, Client Shops & Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Fast Billing Option */}
          <div className="bg-gradient-to-br from-tea-dark to-tea-forest rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-tea-gold">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-tea-gold font-bold block pt-1">
                Active Billing Option
              </span>
              <h3 className="font-serif text-xl font-bold text-white leading-snug">
                Shop Order Taking & Invoicing
              </h3>
              <p className="text-xs text-tea-pale/80 leading-relaxed">
                Add tea items one-by-one, specify shop discounts, and print or WhatsApp instant invoices.
              </p>
            </div>

            <Link
              href="/admin/shop-billing"
              className="inline-flex items-center justify-between w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-tea-surface text-tea-dark font-bold text-xs uppercase tracking-wider transition shadow-sm"
            >
              <span>Create New Bill</span>
              <ArrowRight className="w-4 h-4 text-tea-leaf" />
            </Link>
          </div>

          {/* Card 2: Client Retail Stores & Pending Payments */}
          <div className="bg-white rounded-3xl p-6 border border-tea-border shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                totalRepPendingCredit > 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-50 text-emerald-700"
              }`}>
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-tea-forest font-bold block pt-1">
                Client Shops Directory
              </span>
              <h3 className="font-serif text-xl font-bold text-tea-dark leading-snug">
                {repShopsList.length} Retail Stores
              </h3>
              <p className="text-xs text-tea-muted leading-relaxed">
                Total Sales: <strong className="text-tea-dark">Rs. {totalRepSalesRevenue.toLocaleString()}</strong>.{" "}
                {totalRepPendingCredit > 0 ? (
                  <span className="text-amber-800 font-semibold block mt-0.5">
                    ⚠️ Rs. {totalRepPendingCredit.toLocaleString()} pending credit to collect on route.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold block mt-0.5">
                    ✅ All registered shops have settled payments in full.
                  </span>
                )}
              </p>
            </div>

            <a
              href="#shop-directory"
              className="inline-flex items-center justify-between w-full py-2.5 px-4 rounded-2xl bg-tea-surface hover:bg-tea-bg border border-tea-border text-tea-dark font-bold text-xs uppercase tracking-wider transition"
            >
              <span>View Shops & Old Bills</span>
              <ChevronRight className="w-4 h-4 text-tea-muted" />
            </a>
          </div>

          {/* Card 3: Warehouse Stock Summary */}
          <div className="bg-white rounded-3xl p-6 border border-tea-border shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-tea-forest font-bold block pt-1">
                Warehouse Catalog
              </span>
              <h3 className="font-serif text-xl font-bold text-tea-dark leading-snug">
                {repProducts.length} Teas Available
              </h3>
              <p className="text-xs text-tea-muted leading-relaxed">
                Live warehouse inventory status: <strong className="text-emerald-700">{totalInStock} in stock</strong>,{" "}
                <strong className="text-amber-700">{lowStockCount} low stock</strong>. Browse pack sizes and rates below.
              </p>
            </div>

            <a
              href="#available-products"
              className="inline-flex items-center justify-between w-full py-2.5 px-4 rounded-2xl bg-tea-surface hover:bg-tea-bg border border-tea-border text-tea-dark font-bold text-xs uppercase tracking-wider transition"
            >
              <span>Browse Warehouse Teas</span>
              <ChevronRight className="w-4 h-4 text-tea-muted" />
            </a>
          </div>
        </div>

        {/* LIST OF AVAILABLE PRODUCTS (Shop Order Rep Core Dashboard Requirement) */}
        <div id="available-products" className="bg-white rounded-3xl border border-tea-border p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-tea-border">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-tea-forest" />
                <h3 className="font-serif text-xl font-bold text-tea-dark">
                  Available Products & Live Warehouse Stock
                </h3>
              </div>
              <p className="text-xs text-tea-muted mt-0.5">
                Official tea grades, pack sizes, wholesale rates, and remaining warehouse inventory.
              </p>
            </div>

            <Link
              href="/admin/shop-billing"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-tea-gold" />
              <span>Create Bill</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repProducts.map((p) => {
              const isOutOfStock = p.stock === 0;
              const isLowStock = p.stock > 0 && p.stock <= 15;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-tea-border shadow-subtle hover:shadow-card transition duration-200 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Image & Grade Badge */}
                    <div className="relative h-44 w-full bg-tea-surface p-4 flex items-center justify-center border-b border-tea-border/60">
                      <div className="relative w-32 h-32">
                        <Image
                          src={p.mainImage || "/uploads/leena-tea-powder-200g.jpeg"}
                          alt={p.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-tea-dark text-tea-gold font-mono text-[10px] font-bold">
                          {p.teaGrade || "Ceylon Tea"}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px]">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                            {p.stock} units left
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                            {p.stock} in stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-serif font-bold text-sm text-tea-dark">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-tea-muted mt-0.5">
                          {p.category?.name || "Pure Ceylon Tea"} • {p.teaType || "Black Tea"}
                        </p>
                      </div>

                      {/* Sizes & Prices Breakdown */}
                      <div className="space-y-1.5 pt-2 border-t border-tea-border/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-tea-muted block">
                          Pack Sizes & Wholesale Rates
                        </span>
                        {p.sizes && p.sizes.length > 0 ? (
                          <div className="space-y-1">
                            {p.sizes.map((v: any) => (
                              <div
                                key={v.id}
                                className="flex items-center justify-between p-1.5 rounded-lg bg-tea-surface border border-tea-border/40 text-[11px]"
                              >
                                <span className="font-semibold text-tea-dark">{v.sizeName}</span>
                                <span className="font-mono font-bold text-tea-forest">
                                  Rs. {(v.salePrice || v.regularPrice).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-tea-surface border border-tea-border/40 text-[11px]">
                            <span className="font-semibold text-tea-dark">Standard Pack</span>
                            <span className="font-mono font-bold text-tea-forest">
                              Rs. {p.regularPrice.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action: Start Bill */}
                  <div className="p-4 pt-0">
                    <Link
                      href="/admin/shop-billing"
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Take Order For This Item</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SHOP-BY-SHOP SALES & OLD BILLS DIRECTORY */}
        <div id="shop-directory" className="bg-white rounded-3xl border border-tea-border p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-tea-border">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-tea-forest" />
                <h3 className="font-serif text-xl font-bold text-tea-dark">
                  Sales & Old Bills by Retail Shop ({repShopsList.length} Stores)
                </h3>
              </div>
              <p className="text-xs text-tea-muted mt-0.5">
                Client store directory: Track past sales, pending credit to collect on route, and expand to view every old invoice.
              </p>
            </div>

            <Link
              href="/admin/shop-billing"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 text-tea-gold" />
              <span>+ New Shop Bill</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-tea-surface/60 border border-tea-border/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-tea-muted block">
                Active Client Stores
              </span>
              <span className="font-mono font-bold text-lg text-tea-dark block mt-0.5">
                {repShopsList.length} Retail Outlets
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-tea-surface/60 border border-tea-border/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-tea-muted block">
                Total Lifetime Purchases
              </span>
              <span className="font-mono font-bold text-lg text-tea-forest block mt-0.5">
                Rs. {totalRepSalesRevenue.toLocaleString()}
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              totalRepPendingCredit > 0
                ? "bg-amber-50/80 border-amber-200 text-amber-900"
                : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block">
                {totalRepPendingCredit > 0 ? "Outstanding Credit to Collect" : "Credit Status"}
              </span>
              <span className="font-mono font-bold text-lg block mt-0.5">
                {totalRepPendingCredit > 0
                  ? `Rs. ${totalRepPendingCredit.toLocaleString()}`
                  : "All Accounts Clear (Rs. 0)"}
              </span>
            </div>
          </div>

          {/* Stores Directory List */}
          {repShopsList.length === 0 ? (
            <div className="py-12 text-center text-tea-muted text-xs">
              No shops registered yet. Record your first shop order in the billing counter to start tracking sales by shop.
            </div>
          ) : (
            <div className="space-y-4">
              {repShopsList.map((shop, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-tea-border bg-tea-surface/30 overflow-hidden shadow-subtle hover:border-tea-border/80 transition"
                >
                  {/* Shop Summary Header Strip */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tea-border/50 bg-white">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-serif font-bold text-base text-tea-dark">
                          {shop.shopName}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[11px] text-tea-muted font-medium px-2 py-0.5 rounded-md bg-tea-surface border border-tea-border/60">
                          <MapPin className="w-3 h-3 text-tea-leaf" />
                          <span>{shop.city}</span>
                        </span>
                        <span className="text-[11px] font-mono text-tea-muted">
                          {shop.phone}
                        </span>
                      </div>
                      {shop.address && (
                        <p className="text-[11px] text-tea-muted">
                          {shop.address}
                        </p>
                      )}
                    </div>

                    {/* Financial Metrics & Actions for this Shop */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-right px-3 py-1.5 rounded-xl bg-tea-surface border border-tea-border/60">
                        <span className="text-[10px] text-tea-muted uppercase font-bold block">
                          Lifetime Sales ({shop.totalBills} bills)
                        </span>
                        <span className="font-mono font-bold text-xs text-tea-dark">
                          Rs. {shop.totalSpent.toLocaleString()}
                        </span>
                      </div>

                      <div className={`text-right px-3 py-1.5 rounded-xl border ${
                        shop.pendingBalance > 0
                          ? "bg-amber-50 border-amber-300 text-amber-900"
                          : "bg-emerald-50 border-emerald-300 text-emerald-900"
                      }`}>
                        <span className="text-[10px] uppercase font-bold block">
                          {shop.pendingBalance > 0 ? "Pending Credit Due" : "Payment Status"}
                        </span>
                        <span className="font-mono font-bold text-xs block">
                          {shop.pendingBalance > 0
                            ? `Rs. ${shop.pendingBalance.toLocaleString()} (${shop.pendingBillsCount} unpaid)`
                            : "Fully Paid (Rs. 0)"}
                        </span>
                      </div>

                      <Link
                        href={`/admin/shop-billing?shop=${encodeURIComponent(shop.shopName)}`}
                        className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-xs flex items-center gap-1"
                        title="Start a new bill pre-filled with this shop"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-200" />
                        <span>+ New Bill</span>
                      </Link>

                      <Link
                        href={`/admin/shop-billing?tab=history&search=${encodeURIComponent(shop.shopName)}`}
                        className="px-3 py-2 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold text-xs uppercase tracking-wider transition shadow-xs flex items-center gap-1"
                        title="View all bills for this shop in ledger"
                      >
                        <span>Ledger</span>
                        <ArrowRight className="w-3.5 h-3.5 text-tea-gold" />
                      </Link>
                    </div>
                  </div>

                  {/* Expandable Old Bills List for This Shop */}
                  <details className="group">
                    <summary className="px-4 py-2.5 text-xs font-semibold text-tea-forest hover:text-tea-dark cursor-pointer flex items-center justify-between select-none bg-tea-surface/60 transition">
                      <span className="flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>View Past Bills & Invoice History for {shop.shopName} ({shop.orders.length} bills)</span>
                      </span>
                      <span className="text-[11px] text-tea-muted group-open:rotate-180 transition transform">
                        ▼
                      </span>
                    </summary>

                    <div className="p-4 bg-white border-t border-tea-border/40 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-tea-border/60 text-tea-muted font-semibold text-[11px]">
                            <th className="pb-2">Invoice #</th>
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Items</th>
                            <th className="pb-2">Total Amount</th>
                            <th className="pb-2">Payment Status</th>
                            <th className="pb-2">Bill Status</th>
                            <th className="pb-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-tea-border/30">
                          {shop.orders.map((b: any) => {
                            const isCancelled = b.orderStatus === "CANCELLED";
                            const isPaid = b.paymentStatus === "PAID";
                            const isPartial = b.paymentStatus === "PARTIAL";
                            let partialPaid = 0;
                            let partialDue = b.grandTotal;
                            if (isPartial && b.deliveryNotes) {
                              const pMatch = b.deliveryNotes.match(/paid=([0-9.]+)/i);
                              const dMatch = b.deliveryNotes.match(/due=([0-9.]+)/i);
                              if (pMatch) partialPaid = parseFloat(pMatch[1]) || 0;
                              if (dMatch) partialDue = parseFloat(dMatch[1]) || Math.max(0, b.grandTotal - partialPaid);
                            }

                            return (
                              <tr key={b.id} className="hover:bg-tea-surface/40 transition">
                                <td className="py-2.5 font-mono font-bold text-tea-dark whitespace-nowrap">
                                  #{b.orderNumber}
                                </td>
                                <td className="py-2.5 text-tea-muted whitespace-nowrap">
                                  {new Date(b.createdAt).toLocaleDateString("en-GB")}
                                </td>
                                <td className="py-2.5 text-tea-muted whitespace-nowrap">
                                  {b.items?.length || 0} line(s)
                                </td>
                                <td className="py-2.5 font-mono font-bold text-tea-forest whitespace-nowrap">
                                  <span className={isCancelled ? "line-through text-tea-muted" : ""}>
                                    Rs. {b.grandTotal.toLocaleString()}
                                  </span>
                                </td>
                                <td className="py-2.5 whitespace-nowrap">
                                  {isPaid ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      PAID ({b.paymentMethod === "CREDIT_SHOP" ? "Credit" : "Cash"})
                                    </span>
                                  ) : isPartial ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                                      PARTIAL (Paid: Rs. {partialPaid.toLocaleString()} | Due: Rs. {partialDue.toLocaleString()})
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                      CREDIT DUE (Rs. {b.grandTotal.toLocaleString()})
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 whitespace-nowrap">
                                  {isCancelled ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                      Cancelled
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Active
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 text-right whitespace-nowrap">
                                  <Link
                                    href={`/admin/shop-billing?tab=history&search=${b.orderNumber}`}
                                    className="px-2 py-1 rounded-lg bg-tea-surface hover:bg-tea-bg border border-tea-border text-[11px] font-semibold text-tea-forest"
                                  >
                                    Manage / Collect
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Shop Bills Taken by Field Reps */}
        <div className="bg-white rounded-3xl border border-tea-border p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-tea-border">
            <h3 className="font-serif text-base font-bold text-tea-dark">
              Recent Ground Shop Bills Taken ({recentRepOrders.length})
            </h3>
            <Link
              href="/admin/shop-billing?tab=history"
              className="text-xs font-semibold text-tea-forest hover:text-tea-dark transition flex items-center gap-1"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentRepOrders.length === 0 ? (
            <div className="py-8 text-center text-tea-muted text-xs">
              No shop orders recorded yet. Tap "Open Billing Counter" to take your first shop order.
            </div>
          ) : (
            <>
              {/* Mobile Card View (Optimized for field reps on phones) */}
              <div className="block sm:hidden divide-y divide-tea-border/60">
                {recentRepOrders.map((o) => {
                  const isCancelled = o.orderStatus === "CANCELLED";
                  const isPaid = o.paymentStatus === "PAID";

                  return (
                    <div
                      key={o.id}
                      className={`p-3.5 space-y-2.5 transition ${
                        isCancelled ? "bg-rose-50/20 text-tea-muted opacity-80" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-sm text-tea-dark">
                          #{o.orderNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {o.paymentStatus}
                          </span>
                          {isCancelled && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-tea-surface/40 rounded-xl p-2.5 border border-tea-border/50 text-xs">
                        <div className="font-bold text-tea-dark">{o.customerName}</div>
                        <div className="flex items-center justify-between text-[11px] text-tea-muted mt-0.5">
                          <span>{o.city || "Direct Route"}</span>
                          {o.customerPhone && <span className="font-mono">{o.customerPhone}</span>}
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between text-xs pt-0.5">
                        <span className="text-tea-muted font-medium">Net Amount:</span>
                        <span className={`font-mono font-extrabold text-sm text-tea-forest ${isCancelled ? "line-through text-tea-muted" : ""}`}>
                          Rs. {o.grandTotal.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-tea-border/60">
                        <Link
                          href={`/admin/shop-billing?tab=history&search=${o.orderNumber}`}
                          className="flex-1 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-900 flex items-center justify-center transition shadow-xs"
                        >
                          Manage Bill
                        </Link>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="flex-1 h-10 rounded-xl border border-tea-border hover:bg-tea-surface text-tea-forest text-xs font-bold flex items-center justify-center transition"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-tea-border/60 text-tea-muted font-semibold">
                      <th className="pb-3">Bill #</th>
                      <th className="pb-3">Retail Shop</th>
                      <th className="pb-3">Town / Route</th>
                      <th className="pb-3">Net Total</th>
                      <th className="pb-3">Payment</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tea-border/40">
                    {recentRepOrders.map((o) => {
                      const isCancelled = o.orderStatus === "CANCELLED";
                      const isPaid = o.paymentStatus === "PAID";

                      return (
                        <tr key={o.id} className={`transition ${isCancelled ? "bg-rose-50/30 opacity-75" : "hover:bg-tea-surface/60"}`}>
                          <td className="py-3 font-mono font-bold text-tea-dark whitespace-nowrap">
                            #{o.orderNumber}
                          </td>
                          <td className="py-3">
                            <div className="font-medium text-tea-dark">{o.customerName}</div>
                            <div className="text-[10px] text-tea-muted">{o.customerPhone}</div>
                          </td>
                          <td className="py-3 text-tea-dark">{o.city || "Direct Route"}</td>
                          <td className="py-3 font-bold text-tea-forest whitespace-nowrap">
                            <span className={isCancelled ? "line-through text-tea-muted" : ""}>
                              Rs. {o.grandTotal.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPaid
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 whitespace-nowrap">
                            {isCancelled ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                Cancelled
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/admin/shop-billing?tab=history&search=${o.orderNumber}`}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[11px] font-bold text-emerald-800 transition"
                                title="Update Payment or Cancel in Ledger"
                              >
                                Manage Bill
                              </Link>
                              <Link
                                href={`/admin/orders/${o.id}`}
                                className="px-2 py-1 rounded-lg border border-tea-border hover:bg-tea-bg text-[11px] font-semibold text-tea-forest"
                                title="Full Order Details"
                              >
                                Details
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. EXECUTIVE DASHBOARD (SUPER_ADMIN & MANAGER)
  // "all accont need super admin and menager admin need all show sales amount"
  // ==========================================
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

  // Calculate full sales amounts for Super Admin and Manager
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

          {/* Paid / Realized Revenue */}
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
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 font-semibold text-[10px]">
                                <Store className="w-3 h-3 text-amber-700" />
                                Ground Shop Bill
                              </span>
                              <div className="text-[10px] text-tea-dark font-medium mt-0.5 flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span>Rep:</span>
                                <strong className="text-emerald-950 font-bold">{extractSalesRepName(o.deliveryNotes) || "Sales Rep"}</strong>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                                <ShoppingCart className="w-3 h-3" />
                                Direct Online
                              </span>
                              <div className="text-[10px] text-tea-muted font-normal mt-0.5">
                                (No Rep • Online Customer)
                              </div>
                            </div>
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
