import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import {
  Package,
  Clock,
  ChevronRight,
  ShieldCheck,
  Search,
  User,
  ShoppingBag,
} from "lucide-react";

export const revalidate = 0;

export default async function AccountPage() {
  const customer = await getCurrentCustomer();

  // If customer is logged in, show their orders
  let orders: any[] = [];
  if (customer) {
    try {
      orders = await prisma.order.findMany({
        where: { customerId: customer.id },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    } catch (error) {
      console.warn("Could not load orders from database:", error);
      orders = [];
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-tea-dark to-tea-forest rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-tea-gold font-bold">
            Customer Portal
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1">
            {customer ? `Welcome back, ${customer.name}` : "Order Tracking & Account"}
          </h1>
          <p className="text-xs text-tea-pale/80 mt-1">
            Track your Ceylon tea shipments and review previous orders.
          </p>
        </div>

        {!customer && (
          <div className="flex gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-white text-tea-dark text-xs font-bold uppercase tracking-wider hover:bg-tea-bg transition"
            >
              Customer Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl border border-white/40 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition"
            >
              Register
            </Link>
          </div>
        )}
      </div>

      {/* Quick Order Lookup by Order Number */}
      <div className="bg-tea-surface p-6 rounded-2xl border border-tea-border space-y-3">
        <h3 className="font-serif text-base font-bold text-tea-dark flex items-center gap-2">
          <Search className="w-4 h-4 text-tea-leaf" />
          Track Any Order Instantly
        </h3>
        <p className="text-xs text-tea-muted">
          Enter your Order Number (e.g. <strong>LC-2026-0001</strong>) to view live fulfillment and courier tracking.
        </p>

        <form
          action="/account/orders/track"
          method="GET"
          className="flex flex-col sm:flex-row gap-2 pt-1"
        >
          <input
            type="text"
            name="orderNumber"
            required
            placeholder="Enter Order Number (e.g. LC-2026-0001)"
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-tea-border bg-white focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf uppercase"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition"
          >
            Track Order
          </button>
        </form>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl font-bold text-tea-dark">
          Recent Orders
        </h3>

        {orders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-tea-border space-y-3">
            <Package className="w-10 h-10 text-tea-leaf mx-auto opacity-70" />
            <p className="text-sm font-medium text-tea-muted">No orders yet.</p>
            <p className="text-xs text-tea-muted max-w-sm mx-auto">
              Place your first order of authentic pure Ceylon tea directly from our catalog or via WhatsApp.
            </p>
            <Link
              href="/products"
              className="inline-block px-5 py-2.5 rounded-xl bg-tea-dark text-white text-xs font-bold uppercase tracking-wider"
            >
              Shop Ceylon Tea
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/account/orders/${o.id}`}
                className="p-5 bg-white rounded-2xl border border-tea-border hover:border-tea-leaf transition shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 block"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-tea-dark">
                      #{o.orderNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        o.orderStatus === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : o.orderStatus === "CANCELLED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {o.orderStatus}
                    </span>
                  </div>
                  <p className="text-xs text-tea-muted mt-1">
                    {new Date(o.createdAt).toLocaleDateString()} • {o.items.length}{" "}
                    {o.items.length === 1 ? "item" : "items"}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-tea-border/60">
                  <span className="font-serif font-bold text-base text-tea-forest">
                    Rs. {o.grandTotal.toLocaleString()}
                  </span>
                  <div className="flex items-center text-xs font-semibold text-tea-forest gap-1">
                    <span>View & Track</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
