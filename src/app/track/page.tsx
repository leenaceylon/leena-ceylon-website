"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  CheckCircle,
  XCircle,
  Phone,
  Hash,
  MapPin,
  CreditCard,
  MessageSquare,
  Trash2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  Store,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getWhatsAppUrl } from "@/lib/whatsapp";

interface OrderItem {
  id: string;
  productName: string;
  size: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  image: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  rawPhone?: string;
  shippingAddress: string;
  city: string;
  district: string;
  postalCode?: string;
  deliveryNotes?: string;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  items: OrderItem[];
}

const ORDER_STEPS = [
  { key: "PENDING", label: "Pending", description: "Order received, awaiting confirmation", icon: Clock },
  { key: "CONFIRMED", label: "Confirmed", description: "Verified & confirmed by LEENA CEYLON", icon: CheckCircle2 },
  { key: "PROCESSING", label: "Processing", description: "Leaf quality check & weighing", icon: Package },
  { key: "PACKED", label: "Packed", description: "Aroma-sealed in fresh foil packaging", icon: Package },
  { key: "SHIPPED", label: "Shipped", description: "Dispatched with courier partner (24-48h)", icon: Truck },
  { key: "DELIVERED", label: "Delivered", description: "Successfully delivered to customer", icon: CheckCircle },
];

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-tea-muted">Loading tracking system...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();

  const [searchMode, setSearchMode] = useState<"phone" | "orderNumber">("phone");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Cancellation / Deletion Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePhoneInput, setDeletePhoneInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Read URL query params on mount
  useEffect(() => {
    const qParam = searchParams.get("q");
    const orderParam = searchParams.get("orderNumber");
    const phoneParam = searchParams.get("phone");

    if (orderParam) {
      setSearchMode("orderNumber");
      setSearchValue(orderParam);
      performSearch("orderNumber", orderParam);
    } else if (phoneParam) {
      setSearchMode("phone");
      setSearchValue(phoneParam);
      performSearch("phone", phoneParam);
    } else if (qParam) {
      const isDigits = /^\+?[0-9\s-]{7,15}$/.test(qParam.trim());
      const mode = isDigits ? "phone" : "orderNumber";
      setSearchMode(mode);
      setSearchValue(qParam);
      performSearch(mode, qParam);
    }
  }, [searchParams]);

  const performSearch = async (mode: "phone" | "orderNumber", val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setErrorMsg("Please enter an Order Reference or Phone Number.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setDeleteNotice(null);
      setHasSearched(true);

      const endpoint = `/api/orders/track?type=${mode}&value=${encodeURIComponent(trimmed)}`;
      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "No matching order found. Please check your number and try again.");
        setOrders([]);
        setSelectedOrder(null);
        return;
      }

      if (!data.orders || data.orders.length === 0) {
        setErrorMsg(
          mode === "phone"
            ? `No orders found for phone number "${trimmed}". Please verify the number you provided during checkout or WhatsApp order.`
            : `Order #${trimmed} not found. Please verify your order reference number.`
        );
        setOrders([]);
        setSelectedOrder(null);
      } else {
        setOrders(data.orders);
        setSelectedOrder(data.orders[0]); // Select first/latest order
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchMode, searchValue);
  };

  // Customer Order Cancellation / Deletion
  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;

    try {
      setDeleting(true);
      setDeleteNotice(null);

      // Use either customer input or searched phone if available
      const phoneToVerify = deletePhoneInput.trim() || searchValue.trim() || selectedOrder.rawPhone || "";

      const res = await fetch(
        `/api/orders/${selectedOrder.id}?phone=${encodeURIComponent(phoneToVerify)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneToVerify }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setDeleteNotice({
          type: "error",
          message: data.error || "Could not delete order. Please verify your phone number.",
        });
        return;
      }

      // Success
      setDeleteNotice({
        type: "success",
        message: data.message || `Order #${selectedOrder.orderNumber} has been successfully deleted.`,
      });

      // Remove order from list
      const remaining = orders.filter((o) => o.id !== selectedOrder.id);
      setOrders(remaining);
      setSelectedOrder(remaining.length > 0 ? remaining[0] : null);

      setTimeout(() => {
        setDeleteModalOpen(false);
        setDeletePhoneInput("");
      }, 2500);
    } catch (err: any) {
      setDeleteNotice({
        type: "error",
        message: "Network error occurred while cancelling order. Please contact WhatsApp support.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStepIndex = (status: string) => {
    return ORDER_STEPS.findIndex((s) => s.key === status);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold inline-flex items-center gap-1.5 bg-tea-leaf/10 px-3 py-1 rounded-full">
          <Truck className="w-3.5 h-3.5 text-tea-forest" />
          <span>Real-Time Shipment Tracking</span>
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-tea-dark">
          Track Your Ceylon Tea Order
        </h1>
        <p className="text-xs sm:text-sm text-tea-muted">
          Search by your <strong>Phone Number</strong> or <strong>Order Reference</strong> to view real-time packaging, fulfillment, and courier delivery progress.
        </p>
      </div>

      {/* Interactive Search Card with Two Tabs */}
      <div className="bg-white rounded-3xl border border-tea-border shadow-card p-6 sm:p-8 space-y-6">
        {/* Toggle Mode Tabs */}
        <div className="flex border-b border-tea-border/60 pb-3 gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              setSearchMode("phone");
              setSearchValue("");
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              searchMode === "phone"
                ? "bg-tea-dark text-white shadow-sm"
                : "bg-tea-surface hover:bg-tea-bg text-tea-muted hover:text-tea-dark"
            }`}
          >
            <Phone className="w-4 h-4 text-tea-gold" />
            <span>Track by Phone Number</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchMode("orderNumber");
              setSearchValue("");
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              searchMode === "orderNumber"
                ? "bg-tea-dark text-white shadow-sm"
                : "bg-tea-surface hover:bg-tea-bg text-tea-muted hover:text-tea-dark"
            }`}
          >
            <Hash className="w-4 h-4 text-tea-gold" />
            <span>Track by Order Reference</span>
          </button>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-tea-dark">
            {searchMode === "phone"
              ? "Customer Contact / WhatsApp Number"
              : "Order Reference Number"}
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type={searchMode === "phone" ? "tel" : "text"}
                required
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={
                  searchMode === "phone"
                    ? "e.g. 071 777 4717 or 077 123 4567"
                    : "e.g. LC-2026-0001"
                }
                className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf focus:bg-white transition"
              />
              <div className="absolute left-3.5 top-3.5 text-tea-muted">
                {searchMode === "phone" ? (
                  <Phone className="w-4 h-4 text-tea-leaf" />
                ) : (
                  <Search className="w-4 h-4 text-tea-leaf" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-3 px-8 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-tea-gold" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-tea-gold" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-tea-muted pt-1">
            <span>
              {searchMode === "phone"
                ? "💡 Enter the mobile number you provided during checkout or WhatsApp chat."
                : "💡 Enter the order number from your WhatsApp confirmation message (e.g. LC-2026-0001)."}
            </span>
          </div>
        </form>

        {/* Error / Alert Message */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">{errorMsg}</p>
              <p className="text-[11px] text-rose-700">
                Need immediate help? Contact our direct customer line on{" "}
                <a href="tel:0717774717" className="underline font-bold">
                  071 777 4717
                </a>{" "}
                or chat on WhatsApp.
              </p>
            </div>
          </div>
        )}

        {/* Delete Success Global Alert */}
        {deleteNotice && deleteNotice.type === "success" && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-bold">{deleteNotice.message}</p>
          </div>
        )}
      </div>

      {/* Multiple Orders Selector (if searched by phone number and user has multiple orders) */}
      {orders.length > 1 && (
        <div className="bg-white rounded-3xl border border-tea-border p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-tea-border/60 pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-tea-dark">
                Found {orders.length} Orders for this Contact
              </h3>
              <p className="text-xs text-tea-muted">
                Select an order below to view its live progress and delivery details:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {orders.map((o) => {
              const isSelected = selectedOrder?.id === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedOrder(o)}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? "border-tea-forest bg-tea-surface/70 ring-2 ring-tea-leaf/30 shadow-sm"
                      : "border-tea-border bg-white hover:border-tea-leaf/40 hover:bg-tea-surface/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-serif font-bold text-xs text-tea-dark">
                      #{o.orderNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                  <p className="text-[11px] text-tea-muted">
                    {new Date(o.createdAt).toLocaleDateString()} • {o.items.length} item(s)
                  </p>
                  <p className="text-xs font-bold text-tea-forest mt-2">
                    Rs. {o.grandTotal.toLocaleString()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Order Full Tracking View */}
      {selectedOrder && (
        <div className="space-y-8 animate-fade-in">
          {/* Order Header Summary Banner */}
          <div className="bg-white rounded-3xl border border-tea-border shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-2xl font-bold text-tea-dark">
                  Order #{selectedOrder.orderNumber}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedOrder.orderStatus === "DELIVERED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : selectedOrder.orderStatus === "CANCELLED"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {selectedOrder.orderStatus}
                </span>
              </div>
              <p className="text-xs text-tea-muted">
                Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()} at{" "}
                {new Date(selectedOrder.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* WhatsApp Inquiry Button */}
              <a
                href={getWhatsAppUrl(
                  "0717774717",
                  `Hello LEENA CEYLON,\n\nI am inquiring about my Order #${selectedOrder.orderNumber}.\nName: ${selectedOrder.customerName}\nStatus: ${selectedOrder.orderStatus}\nTotal: Rs. ${selectedOrder.grandTotal.toLocaleString()}\n\nCould you please provide an update? Thank you!`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>WhatsApp Support</span>
              </a>

              {/* Customer Order Delete / Cancel Option */}
              {selectedOrder.orderStatus === "PENDING" && (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(true);
                    setDeleteNotice(null);
                    setDeletePhoneInput(searchValue.trim());
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold uppercase tracking-wider transition shadow-xs"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Cancel / Delete Order</span>
                </button>
              )}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-white rounded-3xl border border-tea-border p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-tea-border/60 pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-tea-dark">
                  Fulfillment & Delivery Progress
                </h3>
                <p className="text-xs text-tea-muted">
                  From central Ceylon mountain harvest to your doorstep
                </p>
              </div>
            </div>

            {selectedOrder.orderStatus === "CANCELLED" ? (
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-4 text-xs text-rose-900">
                <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">This Order Has Been Cancelled</h4>
                  <p className="text-rose-700 mt-1">
                    If you cancelled by mistake or wish to place a fresh order of Ceylon tea, feel free to order online or via WhatsApp.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                {/* Horizontal Stepper (Desktop) */}
                <div className="hidden sm:block relative">
                  {/* Connecting Line */}
                  <div className="absolute top-5 left-8 right-8 h-1 bg-tea-border/70 -translate-y-1/2 z-0" />
                  <div
                    className="absolute top-5 left-8 h-1 bg-tea-forest -translate-y-1/2 z-0 transition-all duration-700"
                    style={{
                      width: `${(Math.max(0, getStepIndex(selectedOrder.orderStatus)) / (ORDER_STEPS.length - 1)) * 88}%`,
                    }}
                  />

                  <div className="grid grid-cols-6 gap-2 relative z-10">
                    {ORDER_STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const currentIndex = getStepIndex(selectedOrder.orderStatus);
                      const isCompleted = currentIndex > idx;
                      const isCurrent = currentIndex === idx;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isCurrent
                                ? "bg-tea-dark text-white ring-4 ring-tea-gold/50 shadow-lg scale-110"
                                : isCompleted
                                ? "bg-tea-forest text-white shadow-sm"
                                : "bg-tea-surface border border-tea-border text-tea-muted"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span
                              className={`text-xs block font-bold uppercase tracking-wider ${
                                isCurrent
                                  ? "text-tea-dark font-extrabold"
                                  : isCompleted
                                  ? "text-tea-forest"
                                  : "text-tea-muted"
                              }`}
                            >
                              {step.label}
                            </span>
                            <span className="text-[10px] text-tea-muted/80 block mt-0.5 leading-tight px-1">
                              {step.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vertical Stepper (Mobile) */}
                <div className="sm:hidden space-y-4">
                  {ORDER_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const currentIndex = getStepIndex(selectedOrder.orderStatus);
                    const isCompleted = currentIndex > idx;
                    const isCurrent = currentIndex === idx;

                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? "bg-tea-dark text-white ring-2 ring-tea-gold shadow"
                              : isCompleted
                              ? "bg-tea-forest text-white"
                              : "bg-tea-surface border border-tea-border text-tea-muted"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="pt-0.5">
                          <h5
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isCurrent
                                ? "text-tea-dark font-extrabold"
                                : isCompleted
                                ? "text-tea-forest"
                                : "text-tea-muted"
                            }`}
                          >
                            {step.label}
                          </h5>
                          <p className="text-[11px] text-tea-muted">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Two-Column Layout: Ordered Items & Shipping/Payment Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Ordered Items List */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-tea-border shadow-card space-y-6">
              <h3 className="font-serif text-base font-bold text-tea-dark pb-3 border-b border-tea-border flex items-center justify-between">
                <span>Ordered Items ({selectedOrder.items.length})</span>
                <span className="text-xs text-tea-muted font-normal">Authentic Ceylon Tea</span>
              </h3>

              <div className="space-y-4">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 text-xs pb-4 border-b border-tea-border/40 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-tea-surface border border-tea-border shrink-0">
                        <Image
                          src={item.image || "/uploads/leena-tea-powder-200g.jpeg"}
                          alt={item.productName || "Ceylon Tea"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-tea-dark text-sm">{item.productName}</h4>
                        <p className="text-[11px] text-tea-muted">
                          Weight: {item.size} • Qty: {item.quantity} pack(s)
                        </p>
                        <p className="text-[11px] text-tea-muted">
                          Unit Price: Rs. {item.unitPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-tea-forest text-sm">
                        Rs. {item.subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculations Breakdown */}
              <div className="pt-4 border-t border-tea-border space-y-2 text-xs">
                <div className="flex justify-between text-tea-muted">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-tea-dark">
                    Rs. {selectedOrder.subtotal.toLocaleString()}
                  </span>
                </div>

                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Promotion / Coupon Discount</span>
                    <span className="font-semibold">-Rs. {selectedOrder.discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-tea-muted">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-tea-dark">
                    {selectedOrder.deliveryCharge === 0
                      ? "FREE (Office Pick-up / Free Delivery)"
                      : `Rs. ${selectedOrder.deliveryCharge.toLocaleString()}`}
                  </span>
                </div>

                <div className="border-t border-tea-border/80 pt-3 flex justify-between items-baseline font-serif text-base font-bold text-tea-dark">
                  <span>Total Payable</span>
                  <span className="text-xl text-tea-forest font-bold">
                    Rs. {selectedOrder.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery & Payment Info */}
            <div className="lg:col-span-5 space-y-6">
              {/* Delivery Details */}
              <div className="bg-tea-surface p-6 rounded-3xl border border-tea-border space-y-4">
                <h3 className="font-serif text-sm font-bold text-tea-dark uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-tea-leaf" />
                  <span>Delivery Destination</span>
                </h3>

                <div className="text-xs space-y-1.5 text-tea-dark">
                  <p className="font-bold text-sm">{selectedOrder.customerName}</p>
                  <p className="leading-relaxed">{selectedOrder.shippingAddress}</p>
                  <p className="text-tea-muted">
                    {selectedOrder.city}, {selectedOrder.district} {selectedOrder.postalCode || ""}
                  </p>
                  <p className="text-tea-muted pt-1">
                    <strong>Contact Phone:</strong> {selectedOrder.customerPhone}
                  </p>
                  {selectedOrder.deliveryNotes && (
                    <div className="mt-2 p-2.5 rounded-xl bg-white border border-tea-border text-[11px] text-tea-muted italic">
                      Special Note: "{selectedOrder.deliveryNotes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-tea-surface p-6 rounded-3xl border border-tea-border space-y-4">
                <h3 className="font-serif text-sm font-bold text-tea-dark uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-tea-leaf" />
                  <span>Payment Method & Status</span>
                </h3>

                <div className="text-xs space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-tea-muted">Method:</span>
                    <span className="font-bold text-tea-dark">
                      {selectedOrder.paymentMethod === "PAY_ON_PICKUP"
                        ? "Office Pick-up (Pay at Collection)"
                        : selectedOrder.paymentMethod === "CASH_ON_DELIVERY"
                        ? "Cash on Delivery (COD)"
                        : "Direct Bank Transfer"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-tea-muted">Payment Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        selectedOrder.paymentStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pick-Up / Office Collection Help */}
              <div className="bg-white p-5 rounded-2xl border border-tea-border text-xs space-y-2">
                <div className="flex items-center gap-2 text-tea-forest font-bold">
                  <Store className="w-4 h-4 text-tea-leaf" />
                  <span>Need to Modify or Add Tea to Your Order?</span>
                </div>
                <p className="text-tea-muted text-[11px] leading-relaxed">
                  You can contact our tea specialists on WhatsApp before dispatch to adjust tea pack sizes, add grades, or verify delivery timeframes.
                </p>
                <div className="pt-1">
                  <a
                    href={getWhatsAppUrl("0717774717", `Hello LEENA CEYLON, I need help with my Order #${selectedOrder.orderNumber}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-700 font-bold hover:underline text-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-current" />
                    <span>Chat on WhatsApp (+94 71 777 4717)</span>
                    <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Delete / Cancel Confirmation Modal */}
      {deleteModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tea-dark/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-tea-border shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-tea-dark">
                    Cancel & Delete Order
                  </h3>
                  <p className="text-xs text-tea-muted">
                    Order Reference #{selectedOrder.orderNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="p-1 rounded-lg text-tea-muted hover:text-tea-dark hover:bg-tea-surface transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 text-xs space-y-2 text-rose-900">
              <p className="font-semibold">
                Are you sure you want to cancel and delete this order?
              </p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                This order is currently <strong>PENDING</strong>. Deleting it will permanently remove it from our store records. If you placed this order by mistake or want to replace it, you can safely remove it.
              </p>
            </div>

            {/* Verification Phone Input */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-tea-dark">
                Confirm your phone number to verify deletion:
              </label>
              <input
                type="tel"
                value={deletePhoneInput}
                onChange={(e) => setDeletePhoneInput(e.target.value)}
                placeholder="Enter the phone number used for this order"
                className="w-full px-3.5 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-xs"
              />
            </div>

            {deleteNotice && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  deleteNotice.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {deleteNotice.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{deleteNotice.message}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={deleting}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting Order...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete This Order</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="py-3 px-4 rounded-xl border border-tea-border hover:bg-tea-surface text-tea-dark font-bold text-xs uppercase tracking-wider transition"
              >
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
