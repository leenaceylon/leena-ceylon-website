"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { compileSingleProductWhatsAppOrder, getWhatsAppUrl } from "@/lib/whatsapp";
import { calculatePricing } from "@/lib/pricing";
import {
  MessageSquare,
  X,
  CheckCircle2,
  Copy,
  Check,
  Truck,
  CreditCard,
  Plus,
  Minus,
  ShieldCheck,
  MapPin,
  User,
  Phone,
  Sparkles,
  Tag,
  Loader2,
  Building,
} from "lucide-react";
import { WhatsAppOrderDetails, WhatsAppOrderSizeOption } from "@/types";

export default function WhatsAppModal({
  whatsappNumber = "071 777 4717",
  whatsappTemplate,
}: {
  whatsappNumber?: string;
  whatsappTemplate?: string;
}) {
  const { whatsAppModal, closeWhatsAppModal } = useCart();

  // All React state hooks declared at the top unconditionally
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK">("COD");
  const [deliveryMethod, setDeliveryMethod] = useState<"COURIER" | "PICKUP">("COURIER");
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [unitPrice, setUnitPrice] = useState(0);
  const [regularUnitPrice, setRegularUnitPrice] = useState<number | undefined>(undefined);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    isFreeShipping?: boolean;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Sync state whenever modal is opened with new product details
  useEffect(() => {
    if (whatsAppModal.isOpen && whatsAppModal.details) {
      setQuantity(Math.max(1, whatsAppModal.details.quantity || 1));
      setSelectedSize(whatsAppModal.details.size || "Standard");
      setUnitPrice(whatsAppModal.details.price || 0);
      setRegularUnitPrice(whatsAppModal.details.regularPrice ?? whatsAppModal.details.price);
      setPaymentMethod("COD");
      setDeliveryMethod("COURIER");
      setCouponError(null);
      setCouponSuccess(null);
    } else {
      setCopiedAccount(false);
      setAppliedCoupon(null);
      setCouponInput("");
      setCouponError(null);
      setCouponSuccess(null);
    }
  }, [whatsAppModal.isOpen, whatsAppModal.details]);

  // Keyboard shortcut for ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeWhatsAppModal();
      }
    };
    if (whatsAppModal.isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [whatsAppModal.isOpen, closeWhatsAppModal]);

  const handleCopyAccount = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText("100024897120");
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  if (!whatsAppModal.isOpen || !whatsAppModal.details) return null;

  const { details } = whatsAppModal;
  const availableSizes: WhatsAppOrderSizeOption[] = details.availableSizes || [];

  // Calculate live pricing with offer discounts and quantity scaling
  const pricing = calculatePricing(regularUnitPrice ?? unitPrice, unitPrice, quantity);
  const itemsSubtotal = pricing.totalPrice;
  const offerSavings = pricing.totalSavings;

  // Re-calculate coupon discount according to live itemsSubtotal
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "PERCENTAGE") {
      couponDiscount = Math.round((itemsSubtotal * appliedCoupon.discountValue) / 100);
    } else if (appliedCoupon.discountType === "FIXED") {
      couponDiscount = Math.min(appliedCoupon.discountValue, itemsSubtotal);
    }
  }

  // Delivery charge calculation
  const isFreeDeliveryCoupon = Boolean(appliedCoupon?.isFreeShipping);
  const qualifiesForFreeDelivery = itemsSubtotal >= 3500 || isFreeDeliveryCoupon;
  const standardDeliveryFee = 350;
  const deliveryFee =
    deliveryMethod === "PICKUP" || qualifiesForFreeDelivery ? 0 : standardDeliveryFee;

  // Final Payable Amount
  const finalTotal = Math.max(0, itemsSubtotal - couponDiscount + deliveryFee);
  const totalSavings =
    offerSavings +
    couponDiscount +
    (qualifiesForFreeDelivery && deliveryMethod === "COURIER" ? standardDeliveryFee : 0);

  const handleSelectSize = (sz: WhatsAppOrderSizeOption) => {
    setSelectedSize(sz.sizeName);
    setUnitPrice(sz.price);
    setRegularUnitPrice(sz.regularPrice ?? sz.price);
  };

  const handleApplyCoupon = async (codeToUse?: string) => {
    const code = (codeToUse || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const res = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: itemsSubtotal }),
      });
      const data = await res.json();

      if (res.ok && data.valid && data.coupon) {
        setAppliedCoupon(data.coupon);
        setCouponInput(data.coupon.code);
        setCouponSuccess(data.message || `Code ${data.coupon.code} applied!`);
        setCouponError(null);
      } else {
        setCouponError(data.message || "Invalid coupon code");
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError("Could not validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponSuccess(null);
    setCouponError(null);
  };

  const handleContinue = () => {
    const orderDetails: WhatsAppOrderDetails = {
      productName: details.productName,
      size: selectedSize || details.size,
      quantity: quantity,
      price: pricing.unitPrice,
      total: itemsSubtotal,
      regularPrice: pricing.hasDiscount ? pricing.regularPrice : undefined,
      regularTotal: pricing.hasDiscount ? pricing.totalRegularPrice : undefined,
      savings: pricing.hasDiscount ? pricing.totalSavings : undefined,
      availableSizes: details.availableSizes,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
      deliveryMethod: deliveryMethod,
      deliveryCharge: deliveryFee,
      finalTotal: finalTotal,
      totalSavings: totalSavings,
    };

    const message = compileSingleProductWhatsAppOrder({
      details: orderDetails,
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      customerPhone: customerPhone.trim(),
      paymentMethod: paymentMethod,
    });

    const url = getWhatsAppUrl(whatsappNumber, message);
    window.open(url, "_blank", "noopener,noreferrer");
    closeWhatsAppModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-tea-dark/60 backdrop-blur-sm animate-fade-in"
      onClick={closeWhatsAppModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-modal-title"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-tea-border overflow-hidden transform transition-all animate-scale-up max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-tea-dark via-tea-forest to-tea-dark px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 id="whatsapp-modal-title" className="font-serif font-bold text-base sm:text-lg text-white leading-tight">
                Order via WhatsApp
              </h3>
              <p className="text-[11px] text-emerald-300 font-sans">Direct dispatch from Ceylon • Instant confirmation</p>
            </div>
          </div>
          <button
            onClick={closeWhatsAppModal}
            className="p-1.5 text-tea-soft hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
          {/* 1. Product Summary & Options */}
          <div className="bg-tea-bg/70 rounded-xl p-3.5 border border-tea-border/80 space-y-3">
            {/* Product Name */}
            <div className="flex justify-between items-start text-sm">
              <span className="text-tea-muted font-medium text-xs uppercase tracking-wider">Product</span>
              <span className="text-tea-dark font-serif font-bold text-sm sm:text-base text-right max-w-[70%]">
                {details.productName}
              </span>
            </div>

            {/* Size / Weight Selection */}
            {availableSizes.length > 1 ? (
              <div className="border-t border-tea-border/60 pt-2.5 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-tea-muted font-medium">Select Pack / Size:</span>
                  <span className="font-bold text-tea-forest">{selectedSize}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableSizes.map((sz) => {
                    const isSelected = selectedSize === sz.sizeName;
                    const szPricing = calculatePricing(sz.regularPrice ?? sz.price, sz.price, 1);
                    return (
                      <button
                        key={sz.sizeName}
                        type="button"
                        onClick={() => handleSelectSize(sz)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-tea-forest text-white border-tea-forest shadow-xs font-bold"
                            : "bg-white text-tea-dark border-tea-border hover:border-tea-leaf"
                        }`}
                      >
                        <span>{sz.sizeName}</span>
                        <span className={`text-[10px] ${isSelected ? "text-emerald-200" : "text-tea-forest font-bold"}`}>
                          Rs. {szPricing.unitPrice.toLocaleString("en-US")}
                        </span>
                        {szPricing.hasDiscount && (
                          <span className={`text-[9px] line-through ${isSelected ? "text-emerald-200/70" : "text-tea-muted"}`}>
                            Rs. {szPricing.regularPrice.toLocaleString("en-US")}
                          </span>
                        )}
                        {szPricing.hasDiscount && (
                          <span className={`text-[8px] uppercase tracking-wider px-1 py-0.2 rounded font-extrabold ${
                            isSelected ? "bg-amber-400 text-emerald-950" : "bg-amber-100 text-amber-800"
                          }`}>
                            Offer
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center text-sm border-t border-tea-border/60 pt-2">
                <span className="text-tea-muted font-medium text-xs">Pack / Weight</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-tea-leaf/10 text-tea-forest font-semibold text-xs">
                  {selectedSize}
                </span>
              </div>
            )}

            {/* Quantity Selector with Plus / Minus & Direct Number Input */}
            <div className="border-t border-tea-border/60 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-tea-muted font-medium text-xs block">Quantity (Packs)</span>
                <span className="text-[11px] text-tea-muted/80">Choose how many you need</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Plus / Minus Box */}
                <div className="inline-flex items-center border border-tea-border rounded-xl bg-white shadow-xs overflow-hidden h-9">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-full flex items-center justify-center text-tea-dark hover:bg-tea-bg active:bg-tea-surface disabled:opacity-40 disabled:cursor-not-allowed transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQuantity(isNaN(val) || val < 1 ? 1 : val);
                    }}
                    className="w-11 h-full text-center font-bold text-sm text-tea-dark focus:outline-none border-x border-tea-border/60 bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label="Quantity"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-full flex items-center justify-center text-tea-dark hover:bg-tea-bg active:bg-tea-surface transition"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Preset Pills */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      className={`w-7 h-9 text-xs rounded-lg border font-semibold transition flex items-center justify-center ${
                        quantity === num
                          ? "bg-tea-forest text-white border-tea-forest shadow-xs"
                          : "bg-white text-tea-muted border-tea-border hover:border-tea-leaf hover:text-tea-dark"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Delivery Method Selection */}
          <div className="space-y-1.5 bg-tea-bg/50 p-3 rounded-xl border border-tea-border/70">
            <div className="flex justify-between items-center text-xs">
              <span className="text-tea-forest font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-tea-leaf" />
                <span>Delivery Method</span>
              </span>
              <span className="text-[11px] text-tea-muted">
                {itemsSubtotal >= 3500 ? (
                  <strong className="text-emerald-700 font-bold">🎉 FREE Delivery Qualified!</strong>
                ) : (
                  <span>Free delivery over Rs. 3,500</span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
              {/* Courier Delivery */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("COURIER")}
                className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition text-left ${
                  deliveryMethod === "COURIER"
                    ? "border-tea-forest bg-white text-tea-dark font-semibold ring-2 ring-tea-leaf/20 shadow-xs"
                    : "border-tea-border bg-white/70 text-tea-muted hover:border-tea-leaf"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-tea-dark flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Courier Delivery</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700">
                    {deliveryFee === 0 ? "FREE" : "Rs. 350"}
                  </span>
                </div>
                <span className="text-[10px] text-tea-muted">Islandwide delivery in 24–48h</span>
              </button>

              {/* Office Pick-up */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("PICKUP")}
                className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition text-left ${
                  deliveryMethod === "PICKUP"
                    ? "border-tea-forest bg-white text-tea-dark font-semibold ring-2 ring-tea-leaf/20 shadow-xs"
                    : "border-tea-border bg-white/70 text-tea-muted hover:border-tea-leaf"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-tea-dark flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-tea-leaf" />
                    <span>Office Pick-up</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700">FREE</span>
                </div>
                <span className="text-[10px] text-tea-muted">Kekirawa Head Office</span>
              </button>
            </div>
          </div>

          {/* 3. Coupon Code Option */}
          <div className="bg-white p-3.5 rounded-xl border border-tea-border/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold uppercase tracking-wider text-tea-forest flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-tea-leaf" />
                <span>Coupon / Promo Code</span>
              </label>
              {appliedCoupon && (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold transition"
                >
                  ✕ Remove
                </button>
              )}
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-950 font-medium animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>
                    Coupon <strong className="font-mono text-emerald-800 font-bold">{appliedCoupon.code}</strong> Applied:
                  </span>
                  <strong className="text-emerald-700 font-bold">
                    {appliedCoupon.isFreeShipping
                      ? "Free Delivery Waiver"
                      : `- Rs. ${couponDiscount.toLocaleString("en-US")}`}
                  </strong>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Applied
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-tea-muted/70" />
                    <input
                      type="text"
                      placeholder="Enter code (e.g. LEENA10)"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-tea-border focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf transition text-xs font-mono font-semibold uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-4 py-2 bg-tea-dark hover:bg-tea-forest disabled:opacity-50 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    {couponLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Apply</span>
                    )}
                  </button>
                </div>

                {couponError && (
                  <p className="text-[11px] text-rose-600 font-medium animate-fade-in">
                    ⚠️ {couponError}
                  </p>
                )}

                {/* Quick Coupon Tap suggestions */}
                <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-tea-muted flex-wrap">
                  <span>Available Coupons:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon("LEENA10")}
                    className="px-2 py-0.5 rounded bg-tea-surface hover:bg-emerald-50 hover:text-emerald-800 border border-tea-border hover:border-emerald-300 font-mono font-semibold transition"
                  >
                    LEENA10 (10% OFF)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon("WELCOME50")}
                    className="px-2 py-0.5 rounded bg-tea-surface hover:bg-emerald-50 hover:text-emerald-800 border border-tea-border hover:border-emerald-300 font-mono font-semibold transition"
                  >
                    WELCOME50 (Rs. 50 OFF)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Complete Transparent Order Bill & Final Amount */}
          <div className="bg-white rounded-xl p-3.5 border border-tea-border/80 shadow-xs space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-tea-forest flex items-center gap-1.5 pb-1 border-b border-tea-border/60">
              <Sparkles className="w-3.5 h-3.5 text-tea-leaf" />
              <span>Order Calculation & Final Amount</span>
            </h4>

            <div className="space-y-1.5 text-xs text-tea-muted">
              {/* Unit Price */}
              <div className="flex justify-between items-center">
                <span>Unit Price</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-tea-dark">
                    Rs. {pricing.unitPrice.toLocaleString("en-US")} each
                  </span>
                  {pricing.hasDiscount && (
                    <span className="text-tea-muted line-through text-[11px]">
                      Rs. {pricing.regularPrice.toLocaleString("en-US")}
                    </span>
                  )}
                </div>
              </div>

              {/* Items Subtotal */}
              <div className="flex justify-between items-center">
                <span>
                  Items Subtotal ({quantity} {quantity === 1 ? "pack" : "packs"})
                </span>
                <span className="font-semibold text-tea-dark">
                  Rs. {itemsSubtotal.toLocaleString("en-US")}
                </span>
              </div>

              {/* Special Offer Savings (if any) */}
              {pricing.hasDiscount && (
                <div className="flex justify-between items-center text-emerald-800">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Special Offer Discount ({pricing.discountPercent}% OFF)</span>
                  </span>
                  <span className="font-bold">
                    - Rs. {offerSavings.toLocaleString("en-US")}
                  </span>
                </div>
              )}

              {/* Coupon Discount (if any) */}
              {appliedCoupon && couponDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-800">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-emerald-600" />
                    <span>Coupon ({appliedCoupon.code})</span>
                  </span>
                  <span className="font-bold">
                    - Rs. {couponDiscount.toLocaleString("en-US")}
                  </span>
                </div>
              )}

              {/* Delivery Fee */}
              <div className="flex justify-between items-center">
                <span>
                  Delivery Charge ({deliveryMethod === "PICKUP" ? "Office Pick-up" : "Islandwide Courier"})
                </span>
                <span>
                  {deliveryFee === 0 ? (
                    <strong className="text-emerald-700 font-bold uppercase text-[11px]">FREE</strong>
                  ) : (
                    <span className="font-semibold text-tea-dark">
                      + Rs. {deliveryFee.toLocaleString("en-US")}
                    </span>
                  )}
                </span>
              </div>

              {/* FINAL PAYABLE TOTAL */}
              <div className="flex justify-between items-center text-base font-bold border-t-2 border-tea-forest/20 pt-2.5 text-tea-dark">
                <div>
                  <span className="block text-sm sm:text-base font-bold text-tea-dark">
                    Final Payable Amount:
                  </span>
                  {totalSavings > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 block">
                      🎉 Total You Save: Rs. {totalSavings.toLocaleString("en-US")}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-tea-forest text-xl font-serif font-bold block">
                    Rs. {finalTotal.toLocaleString("en-US")}
                  </span>
                  {pricing.hasDiscount && (
                    <span className="text-[11px] text-tea-muted line-through font-normal block -mt-1">
                      Reg. Rs. {(pricing.totalRegularPrice + (deliveryMethod === "COURIER" ? 350 : 0)).toLocaleString("en-US")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Customer & Delivery Details */}
          <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-tea-border/70 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-tea-forest flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-tea-leaf" />
              <span>Customer & Delivery Details</span>
            </h4>

            <div className="space-y-2 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-tea-muted font-medium mb-1">
                  Your Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-tea-muted/70" />
                  <input
                    type="text"
                    placeholder="e.g. Priyantha Kumara"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-tea-border focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf transition text-xs"
                  />
                </div>
              </div>

              {/* Delivery Address / City */}
              <div>
                <label className="block text-tea-muted font-medium mb-1">
                  {deliveryMethod === "PICKUP" ? "Your City / Contact Notes" : "Delivery Address / Nearest City"}
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-tea-muted/70" />
                  <input
                    type="text"
                    placeholder={
                      deliveryMethod === "PICKUP"
                        ? "e.g. Collecting from Kekirawa Office today"
                        : "e.g. Kekirawa, Kandy, Colombo 03, etc."
                    }
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-tea-border focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf transition text-xs"
                  />
                </div>
              </div>

              {/* Contact Phone (Optional) */}
              <div>
                <label className="block text-tea-muted font-medium mb-1">
                  Contact Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-tea-muted/70" />
                  <input
                    type="tel"
                    placeholder="e.g. 077 123 4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-tea-border focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf transition text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 6. Payment Method Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-tea-forest">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Cash on Delivery */}
              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition text-center ${
                  paymentMethod === "COD"
                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-tea-border bg-white text-tea-muted hover:border-tea-leaf"
                }`}
              >
                <Truck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-xs">Cash on Delivery</span>
                <span className="text-[10px] text-tea-muted font-normal">
                  Pay Rs. {finalTotal.toLocaleString("en-US")} on arrival
                </span>
              </button>

              {/* Direct Bank Transfer */}
              <button
                type="button"
                onClick={() => setPaymentMethod("BANK")}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition text-center ${
                  paymentMethod === "BANK"
                    ? "border-amber-600 bg-amber-50/70 text-amber-950 font-bold ring-2 ring-amber-500/20 shadow-xs"
                    : "border-tea-border bg-white text-tea-muted hover:border-tea-leaf"
                }`}
              >
                <CreditCard className="w-4 h-4 text-amber-700" />
                <span className="font-semibold text-xs">Bank Transfer</span>
                <span className="text-[10px] text-tea-muted font-normal">Commercial Bank of Ceylon</span>
              </button>
            </div>

            {/* Bank Details Box (Shown when Bank Transfer is selected) */}
            {paymentMethod === "BANK" && (
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 text-xs space-y-2 text-tea-dark animate-fade-in">
                <div className="flex justify-between items-center pb-1.5 border-b border-amber-200/70">
                  <span className="font-bold text-tea-forest text-xs">Commercial Bank of Ceylon PLC</span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="flex items-center gap-1 text-[11px] text-tea-leaf hover:text-tea-dark font-medium px-2 py-0.5 rounded-md bg-white border border-amber-300 shadow-xs active:scale-95 transition"
                  >
                    {copiedAccount ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-tea-leaf" />
                        <span>Copy Account No</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <p><span className="text-tea-muted">Account Name:</span> <strong className="text-tea-dark">LEENA CEYLON (PVT) LTD</strong></p>
                  <p><span className="text-tea-muted">Account Number:</span> <strong className="font-mono text-tea-forest font-bold text-xs">1000 2489 7120</strong></p>
                  <p><span className="text-tea-muted">Branch:</span> <strong>Kekirawa Branch (Swift: CCEYLKLX)</strong></p>
                  <p><span className="text-tea-muted">Amount to Transfer:</span> <strong className="text-emerald-700 font-bold">Rs. {finalTotal.toLocaleString("en-US")}</strong></p>
                </div>
                <p className="text-[10px] text-amber-800 bg-amber-100/70 p-1.5 rounded-md">
                  💡 Transfer Rs. {finalTotal.toLocaleString("en-US")} and share your payment receipt / bank slip screenshot in the WhatsApp chat.
                </p>
              </div>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="text-[11px] text-tea-muted bg-emerald-50/60 border border-emerald-200/50 p-2.5 rounded-xl flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Islandwide delivery in 24–48 hours</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>100% Pure Ceylon Tea</span>
            </span>
          </div>
        </div>

        {/* Fixed Footer Buttons */}
        <div className="p-4 sm:p-5 bg-tea-bg/80 border-t border-tea-border space-y-2 shrink-0">
          <button
            onClick={handleContinue}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm uppercase tracking-wider transition shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            <MessageSquare className="w-5 h-5 fill-current" />
            <span>CONTINUE TO WHATSAPP • RS. {finalTotal.toLocaleString("en-US")}</span>
          </button>
          <button
            onClick={closeWhatsAppModal}
            className="w-full py-2 px-4 rounded-xl border border-tea-border text-tea-muted hover:text-tea-dark hover:bg-white text-xs font-medium transition"
          >
            CANCEL / CONTINUE BROWSING
          </button>
        </div>
      </div>
    </div>
  );
}
