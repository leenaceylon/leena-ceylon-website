"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  MessageSquare,
  MapPin,
  CreditCard,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp";

const ORDER_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      if (data.order) setOrder(data.order);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const handleUpdate = async (fields: { orderStatus?: string; paymentStatus?: string }) => {
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        setNotice("Order updated successfully.");
        setTimeout(() => setNotice(null), 3000);
        loadOrder();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-8 text-xs text-tea-muted">Loading order details...</div>;
  }

  if (!order) {
    return <div className="p-8 text-xs text-rose-600">Order not found.</div>;
  }

  const customerWhatsAppUrl = getWhatsAppUrl(
    order.customerPhone,
    `Hello ${order.customerName},\n\nRegarding your LEENA CEYLON Order #${order.orderNumber}:\nStatus: ${order.orderStatus}\nTotal: Rs. ${order.grandTotal.toLocaleString()}\n\nThank you for choosing LEENA CEYLON tea.`
  );

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-tea-border">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl border border-tea-border hover:bg-tea-surface transition"
          >
            <ArrowLeft className="w-4 h-4 text-tea-muted" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-tea-dark">
              Order #{order.orderNumber}
            </h1>
            <p className="text-xs text-tea-muted">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={customerWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Message Customer on WhatsApp
          </a>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Status Management Bar */}
      <div className="bg-white p-6 rounded-2xl border border-tea-border shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-tea-dark block">Fulfillment Stage:</span>
          <span className="text-xs text-tea-muted">
            Update stage to keep the customer tracking progress indicator current.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={order.orderStatus}
            onChange={(e) => handleUpdate({ orderStatus: e.target.value })}
            className="px-4 py-2 rounded-xl font-bold text-xs border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
          >
            {ORDER_STEPS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={order.paymentStatus}
            onChange={(e) => handleUpdate({ paymentStatus: e.target.value })}
            className={`px-3 py-2 rounded-xl font-bold text-xs border ${
              order.paymentStatus === "PAID"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-amber-50 text-amber-800 border-amber-300"
            }`}
          >
            <option value="PENDING">Payment: PENDING</option>
            <option value="PAID">Payment: PAID</option>
            <option value="FAILED">Payment: FAILED</option>
          </select>
        </div>
      </div>

      {/* Grid: Order Items & Delivery Information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Items */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-tea-border shadow-subtle space-y-4">
          <h3 className="font-serif text-base font-bold text-tea-dark pb-3 border-b border-tea-border">
            Ordered Items ({order.items.length})
          </h3>

          <div className="space-y-3">
            {order.items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 text-xs pb-3 border-b border-tea-border/40 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-tea-surface border border-tea-border shrink-0">
                    <Image
                      src={item.image || "/uploads/leena-tea-powder-200g.jpeg"}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-tea-dark">{item.productName}</h4>
                    <p className="text-[11px] text-tea-muted">
                      Size: {item.size} • Qty: {item.quantity} × Rs. {item.unitPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-tea-forest">
                  Rs. {item.subtotal.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-tea-border space-y-2 text-xs">
            <div className="flex justify-between text-tea-muted">
              <span>Subtotal</span>
              <span className="font-semibold text-tea-dark">
                Rs. {order.subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-tea-muted">
              <span>Delivery Charge</span>
              <span className="font-semibold text-tea-dark">
                {order.deliveryCharge === 0 ? "FREE" : `Rs. ${order.deliveryCharge.toLocaleString()}`}
              </span>
            </div>
            <div className="border-t border-tea-border/80 pt-2 flex justify-between items-baseline font-serif text-base font-bold text-tea-dark">
              <span>Grand Total</span>
              <span className="text-xl text-tea-forest">
                Rs. {order.grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Address Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-tea-surface p-6 rounded-2xl border border-tea-border space-y-3 text-xs">
            <h3 className="font-serif text-sm font-bold text-tea-dark uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-tea-leaf" />
              Delivery Destination
            </h3>
            <div className="space-y-1 text-tea-dark">
              <p className="font-bold text-sm">{order.customerName}</p>
              <p>{order.shippingAddress}</p>
              <p>
                {order.city}, {order.district} {order.postalCode || ""}
              </p>
              <p className="pt-1 text-tea-muted">
                <strong>Phone:</strong> {order.customerPhone}
              </p>
              <p className="text-tea-muted">
                <strong>Email:</strong> {order.customerEmail}
              </p>
              {order.deliveryNotes && (
                <div className="mt-2 p-2.5 rounded-lg bg-white border border-tea-border text-[11px] text-tea-muted italic">
                  Note: "{order.deliveryNotes}"
                </div>
              )}
            </div>
          </div>

          <div className="bg-tea-surface p-6 rounded-2xl border border-tea-border space-y-3 text-xs">
            <h3 className="font-serif text-sm font-bold text-tea-dark uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-tea-leaf" />
              Payment Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-tea-muted">Method:</span>
                <span className="font-bold">
                  {order.paymentMethod === "CASH_ON_DELIVERY"
                    ? "Cash on Delivery"
                    : "Direct Bank Transfer"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tea-muted">Status:</span>
                <span className="font-bold">{order.paymentStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
