import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  ArrowLeft,
  MapPin,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { getSiteSettings } from "@/lib/settings";
import BankTransferNotice from "@/components/BankTransferNotice";

export const revalidate = 0; // Always fresh to show updated order status

const ORDER_STEPS = [
  { key: "PENDING", label: "Pending", icon: Clock },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
  { key: "PROCESSING", label: "Processing", icon: Package },
  { key: "PACKED", label: "Packed", icon: Package },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle },
];

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: params.id }, { orderNumber: params.id }],
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  const settings = await getSiteSettings();
  const isCancelled = order.orderStatus === "CANCELLED";
  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === order.orderStatus);

  const whatsappInquiryUrl = getWhatsAppUrl(
    settings.whatsappNumber || "071 777 4717",
    `Hello LEENA CEYLON,\n\nI am inquiring about my Order #${order.orderNumber}.\nName: ${order.customerName}\nPhone: ${order.customerPhone}\n\nCould you please provide an update on delivery? Thank you.`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-tea-border">
        <div>
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-tea-forest hover:text-tea-dark transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Account
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
            Order #{order.orderNumber}
          </h1>
          <p className="text-xs text-tea-muted mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString()} at{" "}
            {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={whatsappInquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Order Support on WhatsApp
          </a>
        </div>
      </div>

      {/* If Bank Transfer, show dedicated WhatsApp Bank Slip & Details Card */}
      {order.paymentMethod === "BANK_TRANSFER" && (
        <BankTransferNotice
          orderNumber={order.orderNumber}
          customerName={order.customerName}
          customerPhone={order.customerPhone}
          shippingAddress={`${order.shippingAddress}, ${order.city}`}
          grandTotal={order.grandTotal}
          paymentStatus={order.paymentStatus}
          bankDetails={settings.bankDetails}
          bankName={settings.bankName}
          bankAccountName={settings.bankAccountName}
          bankAccountNumber={settings.bankAccountNumber}
          bankBranch={settings.bankBranch}
          bankSwiftCode={settings.bankSwiftCode}
          bankInstructions={settings.bankInstructions}
          bank2Name={settings.bank2Name}
          bank2AccountName={settings.bank2AccountName}
          bank2AccountNumber={settings.bank2AccountNumber}
          bank2Branch={settings.bank2Branch}
          whatsappNumber={settings.whatsappNumber}
          brandName={settings.brandName}
        />
      )}

      {/* Visual Order Progress Indicator (Stepper) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-tea-border shadow-subtle space-y-6">
        <h3 className="font-serif text-base font-bold text-tea-dark">
          Order Status Tracker
        </h3>

        {isCancelled ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-3 text-xs">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">This order has been cancelled.</p>
              <p className="mt-0.5">Please contact customer support on 071 777 4717 if you need assistance.</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Step Line */}
            <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-tea-border/60 -translate-y-1/2 z-0" />
            <div
              className="hidden sm:block absolute top-1/2 left-0 h-1 bg-tea-leaf -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                width: `${(Math.max(0, currentStepIndex) / (ORDER_STEPS.length - 1)) * 100}%`,
              }}
            />

            {/* Steps Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
              {ORDER_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center text-center space-y-2 p-2 rounded-xl"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? "bg-tea-dark text-white ring-4 ring-tea-leaf/30 shadow-md"
                          : isPassed
                          ? "bg-tea-leaf text-white"
                          : "bg-tea-surface border border-tea-border text-tea-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        isCurrent
                          ? "text-tea-forest font-bold"
                          : isPassed
                          ? "text-tea-dark"
                          : "text-tea-muted"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Two Column Details: Items & Shipping/Payment */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Items List */}
        <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-tea-border shadow-subtle space-y-4">
          <h3 className="font-serif text-base font-bold text-tea-dark pb-3 border-b border-tea-border">
            Ordered Items ({order.items.length})
          </h3>

          <div className="space-y-4">
            {order.items.map((item) => (
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
                <span className="font-bold text-tea-forest whitespace-nowrap">
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
              <span>Delivery Fee</span>
              <span className="font-semibold text-tea-dark">
                {order.deliveryCharge === 0 ? "FREE" : `Rs. ${order.deliveryCharge.toLocaleString()}`}
              </span>
            </div>
            <div className="border-t border-tea-border/80 pt-2 flex justify-between items-baseline font-serif text-base font-bold text-tea-dark">
              <span>Total Paid / Payable</span>
              <span className="text-xl text-tea-forest">
                Rs. {order.grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Info */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-tea-surface p-6 rounded-2xl border border-tea-border space-y-4">
            <h3 className="font-serif text-sm font-bold text-tea-dark uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-tea-leaf" />
              Delivery Address
            </h3>
            <div className="text-xs space-y-1 text-tea-dark">
              <p className="font-bold">{order.customerName}</p>
              <p>{order.shippingAddress}</p>
              <p>
                {order.city}, {order.district} {order.postalCode || ""}
              </p>
              <p className="text-tea-muted pt-1">Phone: {order.customerPhone}</p>
              <p className="text-tea-muted">Email: {order.customerEmail}</p>
              {order.deliveryNotes && (
                <div className="mt-2 p-2.5 rounded-lg bg-white border border-tea-border/60 text-[11px] text-tea-muted italic">
                  Note: "{order.deliveryNotes}"
                </div>
              )}
            </div>
          </div>

          <div className="bg-tea-surface p-6 rounded-2xl border border-tea-border space-y-4">
            <h3 className="font-serif text-sm font-bold text-tea-dark uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-tea-leaf" />
              Payment Information
            </h3>
            <div className="text-xs space-y-2 text-tea-dark">
              <div className="flex justify-between">
                <span className="text-tea-muted">Method:</span>
                <span className="font-semibold">
                  {order.paymentMethod === "CASH_ON_DELIVERY"
                    ? "Cash on Delivery"
                    : "Bank Transfer"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tea-muted">Payment Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                    order.paymentStatus === "PAID"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
