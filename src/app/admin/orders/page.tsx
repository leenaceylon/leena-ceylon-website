"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Eye,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  MessageSquare,
  Truck,
  Package,
  X,
  Send,
  Trash2,
  AlertTriangle,
  Store,
  Smartphone,
  Printer,
} from "lucide-react";
import {
  getWhatsAppUrl,
  compileOrderConfirmationWhatsAppMessage,
  compileOrderShippedWhatsAppMessage,
} from "@/lib/whatsapp";

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notification, setNotification] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      // Since our public POST is at /api/orders, let's create GET in /api/orders or fetch all
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminOrdersView />
  );
}

// Full interactive component
function AdminOrdersView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<"ALL" | "ONLINE" | "SHOP">("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmationModalOrder, setConfirmationModalOrder] = useState<any | null>(null);
  const [deleteModalOrder, setDeleteModalOrder] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteOrder = async () => {
    if (!deleteModalOrder) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/orders/${deleteModalOrder.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice(data.message || `Order #${deleteModalOrder.orderNumber} deleted successfully.`);
        setTimeout(() => setNotice(null), 3500);
        setDeleteModalOrder(null);
        loadData();
      } else {
        alert(data.error || "Failed to delete order.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error while deleting order.");
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice(`Order status updated to ${newStatus}.`);
        setTimeout(() => setNotice(null), 3500);
        loadData();

        // Automatically prompt to send WhatsApp confirmation when status is set to CONFIRMED
        if (newStatus === "CONFIRMED") {
          const target = data?.order || orders.find((o) => o.id === orderId);
          if (target && !target.isShopOrder && !target.orderNumber.startsWith("SHOP-")) {
            setConfirmationModalOrder({ ...target, orderStatus: "CONFIRMED" });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const shopOrdersCount = orders.filter(
    (o) =>
      o.isShopOrder ||
      o.orderNumber.startsWith("SHOP-") ||
      o.paymentMethod === "CREDIT_SHOP" ||
      Boolean(o.deliveryNotes && (o.deliveryNotes.includes("SHOP:") || o.deliveryNotes.includes("SALES_REP:")))
  ).length;

  const onlineOrdersCount = orders.length - shopOrdersCount;

  const filteredOrders = orders.filter((o) => {
    const isShop = Boolean(
      o.isShopOrder ||
      o.orderNumber.startsWith("SHOP-") ||
      o.paymentMethod === "CREDIT_SHOP" ||
      (o.deliveryNotes && (o.deliveryNotes.includes("SHOP:") || o.deliveryNotes.includes("SALES_REP:")))
    );

    if (channelFilter === "ONLINE" && isShop) return false;
    if (channelFilter === "SHOP" && !isShop) return false;

    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      o.orderNumber.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term) ||
      o.customerPhone.includes(term) ||
      (o.salesRepName && o.salesRepName.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "ALL" ? true : o.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            Fulfillment & Delivery
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
            Customer Orders & Shop Bills
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Process online tea parcels through fulfillment stages; monitor sales rep shop bills delivered in the field.
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-tea-border shadow-subtle space-y-3.5">
        {/* Channel Selection Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-tea-border/60 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setChannelFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                channelFilter === "ALL"
                  ? "bg-tea-dark text-white shadow-sm"
                  : "bg-tea-surface text-tea-dark hover:bg-tea-border/40"
              }`}
            >
              All Orders ({orders.length})
            </button>

            <button
              type="button"
              onClick={() => setChannelFilter("ONLINE")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                channelFilter === "ONLINE"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Online & WhatsApp ({onlineOrdersCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setChannelFilter("SHOP")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                channelFilter === "SHOP"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Sales Rep Shop Bills ({shopOrdersCount})</span>
            </button>
          </div>

          <div className="text-xs text-tea-muted font-medium">
            Showing <strong className="text-tea-dark">{filteredOrders.length}</strong> order{filteredOrders.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by Order #, Customer / Shop Name, Phone, or Sales Rep..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
            <Search className="w-4 h-4 text-tea-muted absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-tea-muted font-medium whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            >
              <option value="ALL">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-tea-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-tea-muted text-xs">
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-tea-muted text-xs">
            No orders match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-tea-surface border-b border-tea-border text-tea-muted font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer / Channel</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tea-border/60">
                {filteredOrders.map((o) => {
                  const isShop = Boolean(
                    o.isShopOrder ||
                    o.orderNumber.startsWith("SHOP-") ||
                    o.paymentMethod === "CREDIT_SHOP" ||
                    (o.deliveryNotes && (o.deliveryNotes.includes("SHOP:") || o.deliveryNotes.includes("SALES_REP:")))
                  );

                  return (
                    <tr key={o.id} className="hover:bg-tea-surface/40 transition">
                      <td className="py-3 px-4 font-bold text-tea-dark whitespace-nowrap">
                        #{o.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-tea-muted whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-tea-dark">{o.customerName}</div>
                        {isShop ? (
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              🏬 Shop Bill
                            </span>
                            <span className="text-[10px] text-tea-dark font-medium">
                              Rep: <strong className="text-amber-900">{o.salesRepName || "Sales Rep"}</strong>
                            </span>
                          </div>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-block mt-0.5">
                            📱 Online / WhatsApp
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-tea-dark font-mono text-[11px]">
                        {o.customerPhone}
                      </td>
                      <td className="py-3 px-4 text-tea-muted">
                        {o.items?.length || 0} {o.items?.length === 1 ? "item" : "items"}
                      </td>
                      <td className="py-3 px-4 font-bold text-tea-forest whitespace-nowrap">
                        Rs. {o.grandTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : o.paymentStatus === "PARTIAL"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {o.paymentStatus} (
                            {o.paymentMethod === "PAY_ON_PICKUP"
                              ? "Pick-up"
                              : o.paymentMethod === "CASH_ON_DELIVERY"
                              ? "COD"
                              : o.paymentMethod === "CREDIT_SHOP"
                              ? "Credit"
                              : "Bank"}
                          )
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isShop ? (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            DELIVERED (Store)
                          </span>
                        ) : (
                          <select
                            value={o.orderStatus}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                              o.orderStatus === "DELIVERED"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : o.orderStatus === "CANCELLED"
                                ? "bg-rose-50 text-rose-800 border-rose-300"
                                : "bg-amber-50 text-amber-800 border-amber-300"
                            }`}
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isShop ? (
                            <button
                              type="button"
                              onClick={() => setConfirmationModalOrder(o)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] transition shadow-xs"
                              title="Send WhatsApp Confirmation / Updates to Customer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 fill-current text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>
                          ) : (
                            <Link
                              href="/admin/shop-billing"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] transition shadow-xs"
                              title="Open in Sales Rep Shop Billing & Print POS Receipt"
                            >
                              <Store className="w-3.5 h-3.5 text-amber-700" />
                              <span>Shop POS</span>
                            </Link>
                          )}
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-tea-border hover:bg-tea-bg text-tea-forest font-semibold text-[11px] transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteModalOrder(o)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-rose-200 hover:border-rose-300 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] transition"
                            title="Delete this order"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Automatic WhatsApp Confirmation & Customer Notification Modal */}
      {confirmationModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tea-dark/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl border border-emerald-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block mb-1">
                    Order #{confirmationModalOrder.orderNumber}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-tea-dark">
                    Send WhatsApp Confirmation to Customer
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmationModalOrder(null)}
                className="p-1 rounded-lg text-tea-muted hover:text-tea-dark hover:bg-tea-surface transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs space-y-2 text-tea-dark">
              <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/50">
                <span className="text-tea-muted font-medium">Customer:</span>
                <strong className="text-tea-dark">{confirmationModalOrder.customerName}</strong>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/50">
                <span className="text-tea-muted font-medium">WhatsApp Number:</span>
                <span className="font-mono font-bold text-emerald-800">{confirmationModalOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/50">
                <span className="text-tea-muted font-medium">Total Amount:</span>
                <strong className="text-emerald-700 font-bold">Rs. {confirmationModalOrder.grandTotal.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/50">
                <span className="text-tea-muted font-medium">Delivery:</span>
                <span className="truncate max-w-[200px]">{confirmationModalOrder.shippingAddress || "Sri Lanka Delivery"}</span>
              </div>
              <div className="pt-0.5">
                <span className="text-tea-muted font-medium block text-[11px] mb-1">Items:</span>
                <p className="text-tea-dark text-[11px] bg-white p-2 rounded-xl border border-emerald-200">
                  {confirmationModalOrder.items && confirmationModalOrder.items.length > 0
                    ? confirmationModalOrder.items.map((it: any) => `${it.productName} (${it.size}) × ${it.quantity}`).join(", ")
                    : "Pure Ceylon Tea Pack"}
                </p>
              </div>
            </div>

            <p className="text-xs text-tea-muted leading-relaxed">
              Click below to automatically launch WhatsApp with a complete order confirmation message including items, price, delivery details, and reference number:
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const msg = compileOrderConfirmationWhatsAppMessage(confirmationModalOrder);
                  const url = getWhatsAppUrl(confirmationModalOrder.customerPhone, msg);
                  window.open(url, "_blank", "noopener,noreferrer");
                  setConfirmationModalOrder(null);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>SEND ORDER CONFIRMATION VIA WHATSAPP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const msg = compileOrderShippedWhatsAppMessage(confirmationModalOrder);
                  const url = getWhatsAppUrl(confirmationModalOrder.customerPhone, msg);
                  window.open(url, "_blank", "noopener,noreferrer");
                  setConfirmationModalOrder(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-tea-surface hover:bg-tea-bg text-tea-forest font-bold text-xs uppercase tracking-wider transition border border-tea-border flex items-center justify-center gap-2"
              >
                <Truck className="w-3.5 h-3.5 text-tea-leaf" />
                <span>SEND DISPATCH / COURIER UPDATE</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmationModalOrder(null)}
                className="w-full py-2 text-center text-xs text-tea-muted hover:text-tea-dark transition"
              >
                Close / Do Not Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Order Delete Confirmation Modal */}
      {deleteModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tea-dark/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-tea-border shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-tea-dark">
                    Delete Order #{deleteModalOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-tea-muted">
                    Permanent Administrative Removal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOrder(null)}
                className="p-1 rounded-lg text-tea-muted hover:text-tea-dark hover:bg-tea-surface transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 text-xs space-y-2 text-rose-900">
              <div className="flex justify-between items-center pb-1 border-b border-rose-200/60">
                <span className="text-rose-800">Customer:</span>
                <strong>{deleteModalOrder.customerName}</strong>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-rose-200/60">
                <span className="text-rose-800">Phone:</span>
                <span className="font-mono">{deleteModalOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-rose-200/60">
                <span className="text-rose-800">Total:</span>
                <strong className="text-rose-900">Rs. {deleteModalOrder.grandTotal.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-rose-800">Status:</span>
                <span className="font-bold">{deleteModalOrder.orderStatus}</span>
              </div>
            </div>

            <p className="text-xs text-tea-muted leading-relaxed">
              Are you sure you want to permanently delete this order? All items and record entries associated with this order will be permanently erased.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={deleting}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? "Deleting..." : "Permanently Delete Order"}</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteModalOrder(null)}
                disabled={deleting}
                className="py-3 px-4 rounded-xl border border-tea-border hover:bg-tea-surface text-tea-dark font-bold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
