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
  Trash2,
  Edit3,
  Save,
  X,
  Store,
  Printer,
} from "lucide-react";
import {
  getWhatsAppUrl,
  compileOrderConfirmationWhatsAppMessage,
  compileOrderShippedWhatsAppMessage,
} from "@/lib/whatsapp";

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Customer details editing state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    shippingAddress: "",
    city: "",
    district: "",
    postalCode: "",
    deliveryNotes: "",
    syncAllCustomerOrders: true,
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

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
      const data = await res.json();
      if (res.ok) {
        setNotice("Order updated successfully.");
        setTimeout(() => setNotice(null), 3000);
        if (data.order) {
          setOrder(data.order);
        } else {
          loadOrder();
        }

        // If status changed to CONFIRMED, automatically open the WhatsApp confirmation modal
        if (fields.orderStatus === "CONFIRMED") {
          setShowConfirmModal(true);
        }
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

  const handleSendConfirmation = () => {
    const msg = compileOrderConfirmationWhatsAppMessage(order);
    const url = getWhatsAppUrl(order.customerPhone, msg);
    window.open(url, "_blank", "noopener,noreferrer");
    setShowConfirmModal(false);
  };

  const handleSendDispatch = () => {
    const msg = compileOrderShippedWhatsAppMessage(order);
    const url = getWhatsAppUrl(order.customerPhone, msg);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDeleteOrder = async () => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/orders/${params.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || `Order #${order.orderNumber} deleted.`);
        router.push("/admin/orders");
      } else {
        alert(data.error || "Failed to delete order.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error occurred while deleting order.");
    } finally {
      setDeleting(false);
    }
  };

  const openCustomerModal = () => {
    setCustomerForm({
      customerName: order.customerName || "",
      customerPhone: order.customerPhone || "",
      customerEmail: order.customerEmail || "",
      shippingAddress: order.shippingAddress || "",
      city: order.city || "",
      district: order.district || "",
      postalCode: order.postalCode || "",
      deliveryNotes: order.deliveryNotes || "",
      syncAllCustomerOrders: true,
    });
    setShowCustomerModal(true);
  };

  const handleSaveCustomerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.customerName.trim()) {
      alert("Customer / Store name is required.");
      return;
    }
    try {
      setSavingCustomer(true);
      const res = await fetch(`/api/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice(data.message || "Customer details updated successfully.");
        setTimeout(() => setNotice(null), 4000);
        setShowCustomerModal(false);
        if (data.order) {
          setOrder(data.order);
        } else {
          loadOrder();
        }
      } else {
        alert(data.error || "Failed to update customer details.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving customer details.");
    } finally {
      setSavingCustomer(false);
    }
  };

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

        <div className="flex flex-wrap items-center gap-2.5">
          {order.isShopOrder ? (
            <>
              <Link
                href="/admin/shop-billing"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Shop POS / Print Bill</span>
              </Link>

              <button
                type="button"
                onClick={handleSendConfirmation}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>WhatsApp Receipt</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSendConfirmation}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Send WhatsApp Confirmation</span>
              </button>

              <button
                type="button"
                onClick={handleSendDispatch}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-tea-surface hover:bg-tea-bg text-tea-forest border border-tea-border text-xs font-semibold uppercase tracking-wider transition shadow-sm"
              >
                <Truck className="w-4 h-4 text-tea-leaf" />
                <span>Dispatch Update</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold uppercase tracking-wider transition shadow-sm"
            title="Permanently delete this order"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Delete Order</span>
          </button>
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
        {order.isShopOrder ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                Sales Rep Ground Bill
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                DELIVERED (Direct Store Delivery)
              </span>
            </div>
            <p className="text-xs text-tea-muted mt-1">
              Sales Representative: <strong className="text-tea-dark font-semibold">{order.salesRepName || "Assigned Sales Rep"}</strong> • Direct ground physical store delivery (no online confirmation or courier packing required).
            </p>
          </div>
        ) : (
          <div>
            <span className="text-xs font-bold text-tea-dark block">Fulfillment Stage:</span>
            <span className="text-xs text-tea-muted">
              Update stage to keep the customer tracking progress indicator current.
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {!order.isShopOrder ? (
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
          ) : (
            <select
              value={order.orderStatus}
              onChange={(e) => handleUpdate({ orderStatus: e.target.value })}
              className="px-3.5 py-2 rounded-xl font-bold text-xs border border-emerald-300 bg-emerald-50 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="DELIVERED">Status: DELIVERED (Shop Received)</option>
              <option value="CANCELLED">Status: CANCELLED (Void Bill)</option>
            </select>
          )}

          <select
            value={order.paymentStatus}
            onChange={(e) => handleUpdate({ paymentStatus: e.target.value })}
            className={`px-3 py-2 rounded-xl font-bold text-xs border ${
              order.paymentStatus === "PAID"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : order.paymentStatus === "PARTIAL"
                ? "bg-amber-50 text-amber-900 border-amber-300"
                : "bg-rose-50 text-rose-800 border-rose-300"
            }`}
          >
            <option value="PENDING">Payment: PENDING (Credit)</option>
            <option value="PARTIAL">Payment: PARTIAL (Advance/Half)</option>
            <option value="PAID">Payment: PAID IN FULL</option>
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
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold text-tea-dark uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-tea-leaf" />
                Delivery Destination
              </h3>
              <button
                type="button"
                onClick={openCustomerModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-tea-border bg-white hover:bg-tea-bg text-tea-dark text-[11px] font-semibold transition shadow-xs"
                title="Edit Customer Details & Sync Orders"
              >
                <Edit3 className="w-3 h-3 text-tea-leaf" />
                <span>Edit Details</span>
              </button>
            </div>
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
              {order.isShopOrder && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
                  <span className="font-semibold text-amber-900">Assigned Sales Rep:</span>
                  <strong className="font-bold text-amber-950">{order.salesRepName || "Sales Rep"}</strong>
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

      {/* Automated WhatsApp Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tea-dark/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-tea-border shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-tea-dark">
                    Order #{order.orderNumber} Confirmed!
                  </h3>
                  <p className="text-xs text-tea-muted">
                    Automated Customer WhatsApp Notification Ready
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg text-tea-muted hover:text-tea-dark hover:bg-tea-surface transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs space-y-2 text-tea-dark">
              <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/50">
                <span className="text-tea-muted font-medium">Customer:</span>
                <strong className="text-tea-dark">{order.customerName}</strong>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/50">
                <span className="text-tea-muted font-medium">WhatsApp Number:</span>
                <span className="font-mono font-bold text-emerald-800">{order.customerPhone}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/50">
                <span className="text-tea-muted font-medium">Total Amount:</span>
                <strong className="text-emerald-700 font-bold">Rs. {order.grandTotal.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/50">
                <span className="text-tea-muted font-medium">Delivery:</span>
                <span className="truncate max-w-[200px]">{order.shippingAddress || "Sri Lanka Delivery"}</span>
              </div>
              <div className="pt-0.5">
                <span className="text-tea-muted font-medium block text-[11px] mb-1">Items:</span>
                <p className="text-tea-dark text-[11px] bg-white p-2 rounded-xl border border-emerald-200">
                  {order.items && order.items.length > 0
                    ? order.items.map((it: any) => `${it.productName} (${it.size}) × ${it.quantity}`).join(", ")
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
                onClick={handleSendConfirmation}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>SEND ORDER CONFIRMATION VIA WHATSAPP</span>
              </button>

              <button
                type="button"
                onClick={handleSendDispatch}
                className="w-full py-2.5 px-4 rounded-xl bg-tea-surface hover:bg-tea-bg text-tea-forest font-bold text-xs uppercase tracking-wider transition border border-tea-border flex items-center justify-center gap-2"
              >
                <Truck className="w-3.5 h-3.5 text-tea-leaf" />
                <span>SEND DISPATCH / COURIER UPDATE</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-2 text-center text-xs text-tea-muted hover:text-tea-dark transition"
              >
                Close / Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delete Order Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tea-dark/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-tea-border shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-tea-dark">
                    Delete Order #{order.orderNumber}
                  </h3>
                  <p className="text-xs text-tea-muted">
                    Permanent Administrative Removal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg text-tea-muted hover:text-tea-dark hover:bg-tea-surface transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 text-xs space-y-2 text-rose-900">
              <div className="flex justify-between items-center pb-1 border-b border-rose-200/60">
                <span className="text-rose-800">Customer:</span>
                <strong>{order.customerName}</strong>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-rose-200/60">
                <span className="text-rose-800">Phone:</span>
                <span className="font-mono">{order.customerPhone}</span>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-rose-200/60">
                <span className="text-rose-800">Total:</span>
                <strong className="text-rose-900">Rs. {order.grandTotal.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-rose-800">Status:</span>
                <span className="font-bold">{order.orderStatus}</span>
              </div>
            </div>

            <p className="text-xs text-tea-muted leading-relaxed">
              Are you sure you want to permanently delete this order? All items, customer logs, and delivery records associated with this order will be permanently erased.
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
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="py-3 px-4 rounded-xl border border-tea-border hover:bg-tea-surface text-tea-dark font-bold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Details Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tea-dark/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-tea-border shadow-2xl space-y-4 animate-scale-up my-8">
            <div className="flex items-start justify-between border-b border-tea-border/60 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-tea-dark">
                  Edit Customer Details
                </h3>
                <p className="text-xs text-tea-muted mt-0.5">
                  Order #{order.orderNumber} • Synchronize with customer records
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="p-1.5 rounded-xl border border-tea-border text-tea-muted hover:bg-tea-surface transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerDetails} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                  Customer / Store Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerForm.customerName}
                  onChange={(e) => setCustomerForm({ ...customerForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 font-semibold text-tea-dark"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                    Telephone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={customerForm.customerPhone}
                    onChange={(e) => setCustomerForm({ ...customerForm, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 font-mono text-tea-dark"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={customerForm.customerEmail}
                    onChange={(e) => setCustomerForm({ ...customerForm, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 text-tea-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                  Shipping Address / Landmark
                </label>
                <input
                  type="text"
                  value={customerForm.shippingAddress}
                  onChange={(e) => setCustomerForm({ ...customerForm, shippingAddress: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 text-tea-dark"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    value={customerForm.city}
                    onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 text-tea-dark font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={customerForm.district}
                    onChange={(e) => setCustomerForm({ ...customerForm, district: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 text-tea-dark"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={customerForm.postalCode}
                    onChange={(e) => setCustomerForm({ ...customerForm, postalCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 font-mono text-tea-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                  Delivery Notes / Rep Instructions
                </label>
                <textarea
                  rows={2}
                  value={customerForm.deliveryNotes}
                  onChange={(e) => setCustomerForm({ ...customerForm, deliveryNotes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 text-tea-dark"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={customerForm.syncAllCustomerOrders}
                    onChange={(e) => setCustomerForm({ ...customerForm, syncAllCustomerOrders: e.target.checked })}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="text-[11px]">
                    <span className="font-bold text-amber-900 block">
                      Synchronize with all other orders for this customer
                    </span>
                    <span className="text-amber-800 block mt-0.5">
                      Updates all other past shop orders (<code>SHOP-...</code>) and online/WhatsApp orders for this customer to maintain consistent contact and billing records.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-tea-border/60">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 rounded-xl border border-tea-border hover:bg-tea-surface text-xs font-semibold text-tea-dark transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-tea-dark hover:bg-tea-dark/90 text-white text-xs font-semibold uppercase tracking-wider shadow-sm transition disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${savingCustomer ? "animate-spin" : ""}`} />
                  {savingCustomer ? "Saving..." : "Save Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
