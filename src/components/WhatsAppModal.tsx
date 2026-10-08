"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
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
import { WhatsAppOrderDetails, WhatsAppOrderSizeOption, SiteSettingsMap } from "@/types";

export default function WhatsAppModal({
  whatsappNumber = "071 777 4717",
  whatsappTemplate,
  settings,
}: {
  whatsappNumber?: string;
  whatsappTemplate?: string;
  settings?: SiteSettingsMap;
}) {
  const { whatsAppModal, closeWhatsAppModal } = useCart();
  const { t, isRTL } = useLanguage();

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

  // Multi-Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupons, setAppliedCoupons] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount?: number;
    isFreeShipping?: boolean;
    minOrder?: number | null;
    maxDiscount?: number | null;
    calculatedDiscount?: number;
    isAutoApplied?: boolean;
  }[]>([]);
  const [dismissedCouponCodes, setDismissedCouponCodes] = useState<string[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Dynamic Bank Settings from Admin
  const [bankInfo, setBankInfo] = useState({
    bankName: settings?.bankName || "Commercial Bank of Ceylon PLC",
    bankAccountName: settings?.bankAccountName || "LEENA CEYLON (PVT) LTD",
    bankAccountNumber: settings?.bankAccountNumber || "1000 2489 7120",
    bankBranch: settings?.bankBranch || "Kekirawa Branch",
    bankSwiftCode: settings?.bankSwiftCode || "CCEYLKLX",
    bankInstructions: settings?.bankInstructions || "Please transfer the total amount and share your payment receipt / bank slip screenshot on WhatsApp.",
    bank2Name: settings?.bank2Name || "",
    bank2AccountName: settings?.bank2AccountName || "",
    bank2AccountNumber: settings?.bank2AccountNumber || "",
    bank2Branch: settings?.bank2Branch || "",
  });

  // Re-sync from settings prop if it changes
  useEffect(() => {
    if (settings) {
      setBankInfo({
        bankName: settings.bankName || "Commercial Bank of Ceylon PLC",
        bankAccountName: settings.bankAccountName || "LEENA CEYLON (PVT) LTD",
        bankAccountNumber: settings.bankAccountNumber || "1000 2489 7120",
        bankBranch: settings.bankBranch || "Kekirawa Branch",
        bankSwiftCode: settings.bankSwiftCode || "CCEYLKLX",
        bankInstructions: settings.bankInstructions || "",
        bank2Name: settings.bank2Name || "",
        bank2AccountName: settings.bank2AccountName || "",
        bank2AccountNumber: settings.bank2AccountNumber || "",
        bank2Branch: settings.bank2Branch || "",
      });
    }
  }, [settings]);

  // Always re-fetch fresh settings without caching whenever modal opens
  useEffect(() => {
    if (whatsAppModal.isOpen) {
      fetch("/api/settings", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          const s = data?.settings || data;
          if (s) {
            setBankInfo({
              bankName: s.bankName || "Commercial Bank of Ceylon PLC",
              bankAccountName: s.bankAccountName || "LEENA CEYLON (PVT) LTD",
              bankAccountNumber: s.bankAccountNumber || "1000 2489 7120",
              bankBranch: s.bankBranch || "Kekirawa Branch",
              bankSwiftCode: s.bankSwiftCode || "CCEYLKLX",
              bankInstructions: s.bankInstructions || "",
              bank2Name: s.bank2Name || "",
              bank2AccountName: s.bank2AccountName || "",
              bank2AccountNumber: s.bank2AccountNumber || "",
              bank2Branch: s.bank2Branch || "",
            });
          }
        })
        .catch((err) => console.warn("Failed to load settings in WhatsApp modal:", err));

      // Fetch active coupons dynamically from database
      fetch("/api/promotions?activeOnly=true")
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.coupons)) {
            setAvailableCoupons(data.coupons);
          }
        })
        .catch(() => {});
    }
  }, [whatsAppModal.isOpen]);

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
      setDismissedCouponCodes([]);
    } else {
      setCopiedAccount(false);
      setAppliedCoupons([]);
      setDismissedCouponCodes([]);
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

  const handleCopyAccount = (e: React.MouseEvent, accNumber?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const targetAcc = accNumber || bankInfo.bankAccountNumber || "100024897120";
    navigator.clipboard.writeText(targetAcc.replace(/\s+/g, ""));
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const details = whatsAppModal.details || {
    productId: undefined,
    variantId: undefined,
    image: undefined,
    productName: "",
    size: "Standard",
    quantity: 1,
    price: 0,
    regularPrice: 0,
    availableSizes: [] as WhatsAppOrderSizeOption[],
  };
  const availableSizes: WhatsAppOrderSizeOption[] = details.availableSizes || [];

  // Calculate live pricing with offer discounts and quantity scaling
  const pricing = calculatePricing(regularUnitPrice ?? unitPrice, unitPrice, quantity);
  const itemsSubtotal = pricing.totalPrice;
  const offerSavings = pricing.totalSavings;

  // Delivery charge and coupon calculations:
  const isFreeDeliveryCoupon = appliedCoupons.some(
    (c) => Boolean(c.isFreeShipping) || c.discountType === "FREE_SHIPPING"
  );
  const freeDeliveryThreshold = Number(settings?.freeDeliveryThreshold) || 3500;
  const qualifiesForFreeDelivery = itemsSubtotal >= freeDeliveryThreshold || isFreeDeliveryCoupon;
  const standardDeliveryFee = Number(settings?.standardDeliveryFee) || 350;
  // If Office Pick-up is selected, delivery charge is completely removed (Rs. 0)
  const deliveryFee =
    deliveryMethod === "PICKUP" ? 0 : (qualifiesForFreeDelivery ? 0 : standardDeliveryFee);

  // Calculate breakdown of discounts for each applied coupon
  const couponDiscountBreakdown = appliedCoupons.map((c) => {
    let disc = 0;
    if (c.discountType === "PERCENTAGE") {
      disc = Math.round((itemsSubtotal * c.discountValue) / 100);
      if (c.maxDiscount && c.maxDiscount > 0) {
        disc = Math.min(disc, c.maxDiscount);
      }
    } else if (c.discountType === "FIXED") {
      disc = Math.min(Number(c.discountValue), itemsSubtotal);
    } else if (c.discountType === "FREE_SHIPPING" || c.isFreeShipping) {
      disc = 0; // Benefit given through Rs. 0 delivery fee
    }
    return {
      ...c,
      calculatedDiscount: disc,
    };
  });

  const rawCouponDiscountSum = couponDiscountBreakdown.reduce(
    (sum, c) => sum + (c.calculatedDiscount || 0),
    0
  );
  // Total coupon discount cannot exceed item subtotal
  const totalCouponDiscount = Math.min(rawCouponDiscountSum, itemsSubtotal);

  // Final Payable Amount: Items Subtotal - Total Coupon Discount + Delivery Fee
  const finalTotal = Math.max(0, itemsSubtotal - totalCouponDiscount + deliveryFee);
  
  // Total Savings: Offer discount + Coupon discount + Delivery waiver (Rs. 350 saved on pickup or free delivery)
  const deliverySavings =
    deliveryMethod === "PICKUP"
      ? standardDeliveryFee
      : (qualifiesForFreeDelivery ? standardDeliveryFee : 0);
  const totalSavings = offerSavings + totalCouponDiscount + deliverySavings;

  const handleSelectSize = (sz: WhatsAppOrderSizeOption) => {
    setSelectedSize(sz.sizeName);
    setUnitPrice(sz.price);
    setRegularUnitPrice(sz.regularPrice ?? sz.price);
  };

  // Automatic coupon application for eligible coupons (e.g. Free Delivery coupon on orders >= Rs. 1,500)
  useEffect(() => {
    if (!whatsAppModal.isOpen || !whatsAppModal.details || !availableCoupons || availableCoupons.length === 0) return;

    // Filter active coupons eligible for auto-application
    const eligibleAutoCoupons = availableCoupons.filter((c) => {
      const isAuto =
        Boolean(c.isAutoApply) ||
        (c.discountType === "FREE_SHIPPING" && Number(c.minOrder) > 0);
      if (!isAuto) return false;

      const minOrder = Number(c.minOrder) || 0;
      return itemsSubtotal >= minOrder;
    });

    setAppliedCoupons((prev) => {
      let updated = [...prev];
      let hasChanges = false;

      // 1. Remove auto-applied coupons whose minimum spend requirement is no longer met
      updated = updated.filter((ac) => {
        if (ac.isAutoApplied && ac.minOrder && itemsSubtotal < ac.minOrder) {
          hasChanges = true;
          return false;
        }
        return true;
      });

      // 2. Add eligible auto-apply coupons if not already present and not explicitly dismissed by customer
      for (const ec of eligibleAutoCoupons) {
        const isAlreadyApplied = updated.some((ac) => ac.code === ec.code);
        const isDismissed = dismissedCouponCodes.includes(ec.code);

        if (!isAlreadyApplied && !isDismissed) {
          hasChanges = true;
          updated.push({
            code: ec.code,
            discountType: ec.discountType,
            discountValue: Number(ec.discountValue),
            isFreeShipping: ec.discountType === "FREE_SHIPPING" || Boolean(ec.isFreeShipping),
            minOrder: ec.minOrder ? Number(ec.minOrder) : null,
            maxDiscount: ec.maxDiscount ? Number(ec.maxDiscount) : null,
            isAutoApplied: true,
          });
        }
      }

      return hasChanges ? updated : prev;
    });
  }, [whatsAppModal.isOpen, whatsAppModal.details, availableCoupons, itemsSubtotal, dismissedCouponCodes]);

  const handleApplyCoupon = async (codeToUse?: string) => {
    const code = (codeToUse || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError(t("modal.couponPlaceholder", "Please enter a coupon code"));
      return;
    }

    if (appliedCoupons.some((c) => c.code === code)) {
      setCouponError(
        t("modal.couponAlreadyApplied", `Coupon code "${code}" is already applied.`)
      );
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
        setAppliedCoupons((prev) => [...prev, data.coupon]);
        setDismissedCouponCodes((prev) => prev.filter((c) => c !== code));
        setCouponInput("");
        setCouponSuccess(data.message || `Code ${data.coupon.code} applied!`);
        setCouponError(null);
      } else {
        setCouponError(data.message || "Invalid coupon code");
      }
    } catch {
      setCouponError("Could not validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = (codeToRemove: string) => {
    setDismissedCouponCodes((prev) =>
      prev.includes(codeToRemove) ? prev : [...prev, codeToRemove]
    );
    setAppliedCoupons((prev) => prev.filter((c) => c.code !== codeToRemove));
    setCouponSuccess(null);
    setCouponError(null);
  };

  const handleContinue = async () => {
    if (isSubmittingOrder) return;
    setIsSubmittingOrder(true);

    let createdOrderNumber: string | undefined = undefined;

    try {
      const appliedCodes = appliedCoupons.map((c) => c.code).join(", ");
      const orderPayload = {
        fullName: customerName.trim() || "WhatsApp Customer",
        mobileNumber: customerPhone.trim() || "Not Provided",
        email: `whatsapp-${Date.now()}@order.leenaceylon.com`,
        address:
          customerAddress.trim() ||
          (deliveryMethod === "PICKUP"
            ? "LEENA CEYLON Office, Kekirawa, Sri Lanka (Office Pick-up)"
            : "Islandwide Courier Delivery"),
        city: deliveryMethod === "PICKUP" ? "Kekirawa" : (customerAddress.trim() || "Sri Lanka"),
        district: "Sri Lanka",
        postalCode: "",
        deliveryNotes: `${
          deliveryMethod === "PICKUP"
            ? "Office Pick-up (Kekirawa Head Office)"
            : "Islandwide Courier Delivery"
        }${appliedCodes ? ` | Coupon(s): ${appliedCodes} (-Rs. ${totalCouponDiscount}${isFreeDeliveryCoupon ? ", Free Delivery" : ""})` : ""}${
          customerAddress ? ` | Notes: ${customerAddress}` : ""
        }`,
        paymentMethod:
          paymentMethod === "BANK"
            ? "BANK_TRANSFER"
            : deliveryMethod === "PICKUP"
            ? "PAY_ON_PICKUP"
            : "CASH_ON_DELIVERY",
        cartItems: [
          {
            productId: details.productId || null,
            variantId: details.variantId || null,
            name: details.productName,
            size: selectedSize || details.size,
            price: pricing.unitPrice,
            quantity: quantity,
            image: details.image || null,
          },
        ],
        subtotal: itemsSubtotal,
        discount: totalCouponDiscount,
        deliveryCharge: deliveryFee,
        grandTotal: finalTotal,
        couponCode: appliedCodes || null,
        deliveryMethod: deliveryMethod,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (res.ok && data?.orderNumber) {
        createdOrderNumber = data.orderNumber;
      }
    } catch (e) {
      console.warn("Order recording failed, proceeding with WhatsApp message:", e);
    }

    const appliedCodes = appliedCoupons.map((c) => c.code).join(", ");
    const orderDetails: WhatsAppOrderDetails = {
      productId: details.productId,
      variantId: details.variantId,
      image: details.image,
      orderNumber: createdOrderNumber,
      productName: details.productName,
      size: selectedSize || details.size,
      quantity: quantity,
      price: pricing.unitPrice,
      total: itemsSubtotal,
      regularPrice: pricing.hasDiscount ? pricing.regularPrice : undefined,
      regularTotal: pricing.hasDiscount ? pricing.totalRegularPrice : undefined,
      savings: pricing.hasDiscount ? pricing.totalSavings : undefined,
      availableSizes: details.availableSizes,
      couponCode: appliedCodes || undefined,
      couponDiscount: totalCouponDiscount > 0 ? totalCouponDiscount : undefined,
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
      bankInfo: bankInfo,
      orderNumber: createdOrderNumber,
    });

    const url = getWhatsAppUrl(whatsappNumber, message);
    window.open(url, "_blank", "noopener,noreferrer");
    setIsSubmittingOrder(false);
    closeWhatsAppModal();
  };

  if (!whatsAppModal.isOpen || !whatsAppModal.details) return null;

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
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 id="whatsapp-modal-title" className="font-serif font-bold text-base sm:text-lg text-white leading-tight">
                {t("modal.title", "Order via WhatsApp")}
              </h3>
              <p className="text-[11px] text-emerald-300 font-sans">
                {t("modal.subtitle", "Direct dispatch from Ceylon • Instant confirmation")}
              </p>
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
              <span className="text-tea-muted font-medium text-xs uppercase tracking-wider">
                {t("modal.orderDetails", "Product")}
              </span>
              <span className="text-tea-dark font-serif font-bold text-sm sm:text-base text-right max-w-[70%]">
                {details.productName}
              </span>
            </div>

            {/* Size / Weight Selection */}
            {availableSizes.length > 1 ? (
              <div className="border-t border-tea-border/60 pt-2.5 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-tea-muted font-medium">
                    {t("modal.packSize", "Select Pack / Size:")}
                  </span>
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
                <span>{t("modal.deliveryMethod", "Delivery Option")}</span>
              </span>
              <span className="text-[11px] text-tea-muted">
                {qualifiesForFreeDelivery ? (
                  <strong className="text-emerald-700 font-bold">
                    🎉 FREE Courier Delivery Qualified!{isFreeDeliveryCoupon ? " (Coupon Applied)" : ""}
                  </strong>
                ) : (
                  <span>Free courier over Rs. {freeDeliveryThreshold.toLocaleString("en-US")}</span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
              {/* Courier Delivery */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("COURIER")}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition text-left cursor-pointer ${
                  deliveryMethod === "COURIER"
                    ? "border-tea-forest bg-emerald-50/50 text-tea-dark font-semibold ring-2 ring-tea-leaf/30 shadow-xs"
                    : "border-tea-border bg-white text-tea-muted hover:border-tea-leaf"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-tea-dark flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>{t("modal.courierDelivery", "Islandwide Courier")}</span>
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      qualifiesForFreeDelivery
                        ? "text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded"
                        : "text-tea-dark"
                    }`}
                  >
                    {qualifiesForFreeDelivery ? t("modal.freeDelivery", "FREE") : "Rs. 350"}
                  </span>
                </div>
                <span className="text-[10px] text-tea-muted">{t("modal.courierSub", "Delivery in 24–48h")}</span>
              </button>

              {/* Shop / Office Pick-up */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("PICKUP")}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition text-left cursor-pointer ${
                  deliveryMethod === "PICKUP"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/30 shadow-xs"
                    : "border-tea-border bg-white text-tea-muted hover:border-tea-leaf"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-tea-dark flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-700" />
                    <span>{t("modal.officePickup", "Office Pick-up")}</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    {t("modal.officePickupFree", "Rs. 0 • FREE")}
                  </span>
                </div>
                <span className="text-[10px] text-tea-muted">{t("modal.officePickupSub", "Kekirawa Head Office")}</span>
              </button>
            </div>

            {/* Active Pick-up Notice */}
            {deliveryMethod === "PICKUP" && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-center justify-between animate-fade-in shadow-xs">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    <strong>{t("modal.officePickup", "Office Pick-up")}:</strong> Delivery charge is{" "}
                    <strong className="text-emerald-800 underline font-bold">100% REMOVED (Rs. 0)</strong>!
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold bg-emerald-700 text-white px-2 py-0.5 rounded-full shrink-0">
                  Save Rs. 350
                </span>
              </div>
            )}
          </div>

          {/* 3. Multi-Coupon Code Option with Extra Coupon Support */}
          <div className="bg-white p-3.5 rounded-xl border border-tea-border/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold uppercase tracking-wider text-tea-forest flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-tea-leaf" />
                <span>
                  {appliedCoupons.length > 0
                    ? `${t("modal.appliedCoupons", "Applied Coupons")} (${appliedCoupons.length})`
                    : t("modal.applyCoupon", "Have a Coupon Code?")}
                </span>
              </label>
              {appliedCoupons.length > 0 && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  {isFreeDeliveryCoupon ? "Free Delivery Active" : ""}
                  {isFreeDeliveryCoupon && totalCouponDiscount > 0 ? " + " : ""}
                  {totalCouponDiscount > 0 ? `- Rs. ${totalCouponDiscount.toLocaleString("en-US")}` : ""}
                </span>
              )}
            </div>

            {/* List of Applied Coupons */}
            {appliedCoupons.length > 0 && (
              <div className="space-y-2">
                {couponDiscountBreakdown.map((cpn) => (
                  <div
                    key={cpn.code}
                    className="flex items-center justify-between p-2.5 bg-emerald-50/90 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-medium animate-fade-in shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
                          {cpn.code}
                        </span>
                        <span className="font-semibold text-emerald-800">
                          {cpn.isFreeShipping || cpn.discountType === "FREE_SHIPPING"
                            ? "🚚 Free Islandwide Delivery"
                            : `- Rs. ${(cpn.calculatedDiscount || 0).toLocaleString("en-US")}`}
                        </span>
                        {cpn.isAutoApplied && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-0.5 shadow-2xs">
                            <span>⚡</span>
                            <span>{t("modal.autoAppliedBadge", "Auto-Applied")}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCoupon(cpn.code)}
                      className="text-[11px] text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg font-semibold transition"
                      title={`Remove coupon ${cpn.code}`}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Helpful indicator if order is close to unlocking Auto-Free Delivery */}
            {(() => {
              const freeDeliveryCoupon = availableCoupons.find(
                (c) =>
                  (Boolean(c.isAutoApply) || c.discountType === "FREE_SHIPPING") &&
                  Number(c.minOrder) > itemsSubtotal &&
                  !appliedCoupons.some((ac) => ac.code === c.code)
              );
              if (!freeDeliveryCoupon || !freeDeliveryCoupon.minOrder) return null;
              const neededAmount = Math.max(0, Number(freeDeliveryCoupon.minOrder) - itemsSubtotal);
              return (
                <div className="p-2.5 bg-amber-50/90 border border-amber-300/80 rounded-xl text-xs text-amber-950 flex items-center justify-between gap-2 shadow-2xs animate-fade-in">
                  <div className="flex items-center gap-1.5 font-medium flex-wrap">
                    <span>⚡</span>
                    <span>
                      {t("modal.spendMoreForFreeDelivery", "Add Rs. {amount} more to unlock Free Delivery with coupon").replace(
                        "{amount}",
                        neededAmount.toLocaleString("en-US")
                      )}{" "}
                      <strong className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                        {freeDeliveryCoupon.code}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Input field to apply coupon or apply extra coupon */}
            <div className={`space-y-2 ${appliedCoupons.length > 0 ? "pt-2 border-t border-tea-border/60" : ""}`}>
              {appliedCoupons.length > 0 && (
                <div className="flex items-center justify-between text-[11px] text-tea-forest font-semibold">
                  <span className="flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-tea-leaf" />
                    <span>{t("modal.applyExtraCoupon", "Apply Extra Coupon")}</span>
                  </span>
                  <span className="text-[10px] text-tea-muted">
                    Stack multiple discounts & promotions
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className={`w-3.5 h-3.5 absolute ${isRTL ? "right-3" : "left-3"} top-2.5 text-tea-muted/70`} />
                  <input
                    type="text"
                    placeholder={
                      appliedCoupons.length > 0
                        ? t("modal.extraCouponPlaceholder", "Enter extra coupon (e.g. CC, LEENA10)")
                        : t("modal.couponPlaceholder", "Enter coupon (e.g. WELCOME10)")
                    }
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
                    className="w-full pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-2 rounded-lg border border-tea-border focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf transition text-xs font-mono font-semibold uppercase"
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
                    <span>
                      {appliedCoupons.length > 0
                        ? t("modal.applyExtra", "Apply Extra")
                        : t("modal.apply", "Apply")}
                    </span>
                  )}
                </button>
              </div>

              {couponError && (
                <p className="text-[11px] text-rose-600 font-medium animate-fade-in flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{couponError}</span>
                </p>
              )}

              {couponSuccess && (
                <p className="text-[11px] text-emerald-700 font-medium animate-fade-in flex items-center gap-1">
                  <span>🎉</span>
                  <span>{couponSuccess}</span>
                </p>
              )}

              {/* Dynamic Quick Coupon Tap suggestions for unapplied coupons */}
              {(() => {
                const unappliedCoupons = availableCoupons.filter(
                  (cpn) => !appliedCoupons.some((ac) => ac.code === cpn.code)
                );
                if (!unappliedCoupons || unappliedCoupons.length === 0) return null;
                return (
                  <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-tea-muted flex-wrap">
                    <span>
                      {appliedCoupons.length > 0
                        ? t("modal.applyExtraCoupon", "More Available Coupons:")
                        : t("modal.availableCoupons", "Available Coupons:")}
                    </span>
                    {unappliedCoupons.map((cpn) => (
                      <button
                        key={cpn.id || cpn.code}
                        type="button"
                        onClick={() => handleApplyCoupon(cpn.code)}
                        className="px-2 py-0.5 rounded bg-tea-surface hover:bg-emerald-50 hover:text-emerald-800 border border-tea-border hover:border-emerald-300 font-mono font-semibold transition"
                      >
                        + {cpn.code} (
                        {cpn.discountType === "PERCENTAGE"
                          ? `${cpn.discountValue}% OFF`
                          : cpn.discountType === "FREE_SHIPPING"
                          ? `FREE DELIVERY${cpn.minOrder ? ` (Rs. ${cpn.minOrder}+)` : ""}`
                          : `Rs. ${cpn.discountValue} OFF`}
                        )
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 4. Complete Transparent Order Bill & Final Amount */}
          <div className="bg-white rounded-xl p-3.5 border border-tea-border/80 shadow-xs space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-tea-forest flex items-center gap-1.5 pb-1 border-b border-tea-border/60">
              <Sparkles className="w-3.5 h-3.5 text-tea-leaf" />
              <span>{t("modal.orderDetails", "Order Calculation & Final Amount")}</span>
            </h4>

            <div className="space-y-1.5 text-xs text-tea-muted">
              {/* Unit Price */}
              <div className="flex justify-between items-center">
                <span>{t("product.regularPrice", "Unit Price")}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-tea-dark">
                    Rs. {pricing.unitPrice.toLocaleString("en-US")}
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
                  {t("modal.subtotal", "Items Subtotal")} ({quantity} {quantity === 1 ? "pack" : "packs"})
                </span>
                <span className="font-semibold text-tea-dark">
                  Rs. {itemsSubtotal.toLocaleString("en-US")}
                </span>
              </div>

              {/* Special Offer Savings (if any) */}
              {pricing.hasDiscount && (
                <div className="flex justify-between items-center text-emerald-800">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Special Offer ({pricing.discountPercent}% OFF)</span>
                  </span>
                  <span className="font-bold">
                    - Rs. {offerSavings.toLocaleString("en-US")}
                  </span>
                </div>
              )}

              {/* Coupon Discount (if any) */}
              {totalCouponDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-800">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {t("modal.couponDiscount", "Coupon Discount")}{" "}
                      ({couponDiscountBreakdown
                        .filter((c) => (c.calculatedDiscount || 0) > 0)
                        .map((c) => c.code)
                        .join(", ")})
                    </span>
                  </span>
                  <span className="font-bold">
                    - Rs. {totalCouponDiscount.toLocaleString("en-US")}
                  </span>
                </div>
              )}

              {/* Delivery Fee Calculation Line */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-tea-muted flex items-center gap-1.5">
                  {deliveryMethod === "PICKUP" ? (
                    <Building className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Truck className="w-3.5 h-3.5 text-tea-forest" />
                  )}
                  <span>
                    {t("modal.deliveryFee", "Delivery Charge")} ({deliveryMethod === "PICKUP" ? t("modal.officePickup", "Office Pick-up") : t("modal.courierDelivery", "Courier")}):
                  </span>
                </span>
                <div>
                  {deliveryMethod === "PICKUP" ? (
                    <div className="flex items-center gap-1.5">
                      <span className="line-through text-tea-muted text-xs">Rs. {standardDeliveryFee}</span>
                      <strong className="text-emerald-800 font-bold uppercase text-[11px] bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        {t("modal.freeDelivery", "FREE")} (Rs. 0)
                      </strong>
                    </div>
                  ) : qualifiesForFreeDelivery ? (
                    <div className="flex items-center gap-1.5">
                      <span className="line-through text-tea-muted text-xs">Rs. {standardDeliveryFee}</span>
                      <strong className="text-emerald-800 font-bold uppercase text-[11px] bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        {t("modal.freeDelivery", "FREE")} (Rs. 0)
                        {isFreeDeliveryCoupon ? " • Coupon" : ""}
                      </strong>
                    </div>
                  ) : (
                    <span className="font-semibold text-tea-dark">
                      + Rs. {deliveryFee.toLocaleString("en-US")}
                    </span>
                  )}
                </div>
              </div>

              {/* FINAL PAYABLE TOTAL */}
              <div className="flex justify-between items-center text-base font-bold border-t-2 border-tea-forest/20 pt-2.5 text-tea-dark">
                <div>
                  <span className="block text-sm sm:text-base font-bold text-tea-dark">
                    {t("modal.totalPayable", "Final Payable Amount:")}
                  </span>
                  {totalSavings > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 block">
                      🎉 {t("modal.totalSavings", "You Save")}: Rs. {totalSavings.toLocaleString("en-US")}
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
              <span>{t("modal.yourDetails", "Customer Information")}</span>
            </h4>

            <div className="space-y-2 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-tea-muted font-medium mb-1">
                  {t("modal.namePlaceholder", "Your Full Name *")}
                </label>
                <div className="relative">
                  <User className={`w-3.5 h-3.5 absolute ${isRTL ? "right-3" : "left-3"} top-2.5 text-tea-muted/70`} />
                  <input
                    type="text"
                    placeholder={t("modal.namePlaceholder", "Your Full Name *")}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-2 rounded-lg border border-tea-border focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf transition text-xs"
                  />
                </div>
              </div>

              {/* Delivery Address / Pick-up Notes */}
              <div>
                <label className="block text-tea-muted font-medium mb-1">
                  {deliveryMethod === "PICKUP"
                    ? t("modal.pickupAddressPlaceholder", "Pick-up notes or your home city (Optional)")
                    : t("modal.addressPlaceholder", "Delivery Address, Street, Town / City *")}
                </label>
                <div className="relative">
                  {deliveryMethod === "PICKUP" ? (
                    <Building className={`w-3.5 h-3.5 absolute ${isRTL ? "right-3" : "left-3"} top-2.5 text-emerald-700`} />
                  ) : (
                    <MapPin className={`w-3.5 h-3.5 absolute ${isRTL ? "right-3" : "left-3"} top-2.5 text-tea-muted/70`} />
                  )}
                  <input
                    type="text"
                    placeholder={
                      deliveryMethod === "PICKUP"
                        ? t("modal.pickupAddressPlaceholder", "Pick-up notes or your home city (Optional)")
                        : t("modal.addressPlaceholder", "Delivery Address, Street, Town / City *")
                    }
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-2 rounded-lg border border-tea-border focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf transition text-xs"
                  />
                </div>
                {deliveryMethod === "PICKUP" && (
                  <p className="text-[11px] text-emerald-800 font-medium mt-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>
                      <strong>{t("modal.officePickup", "Office Pick-up")}:</strong> LEENA CEYLON Office, Kekirawa, Sri Lanka
                    </span>
                  </p>
                )}
              </div>

              {/* Contact Phone (Optional) */}
              <div>
                <label className="block text-tea-muted font-medium mb-1">
                  {t("modal.phonePlaceholder", "WhatsApp Phone Number (e.g. 0717774717) *")}
                </label>
                <div className="relative">
                  <Phone className={`w-3.5 h-3.5 absolute ${isRTL ? "right-3" : "left-3"} top-2.5 text-tea-muted/70`} />
                  <input
                    type="tel"
                    placeholder={t("modal.phonePlaceholder", "WhatsApp Phone Number (e.g. 0717774717) *")}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-2 rounded-lg border border-tea-border focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf transition text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 6. Payment Method Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-tea-forest">
              {t("modal.paymentMethod", "Payment Option")}
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Pay on Pick-up / Cash on Delivery */}
              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition text-center cursor-pointer ${
                  paymentMethod === "COD"
                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-tea-border bg-white text-tea-muted hover:border-tea-leaf"
                }`}
              >
                {deliveryMethod === "PICKUP" ? (
                  <Building className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Truck className="w-4 h-4 text-emerald-600" />
                )}
                <span className="font-semibold text-xs">
                  {deliveryMethod === "PICKUP" ? t("modal.officePickup", "Office Pick-up") : t("modal.cod", "Cash on Delivery (COD)")}
                </span>
                <span className="text-[10px] text-tea-muted font-normal">
                  {deliveryMethod === "PICKUP"
                    ? `Pay Rs. ${finalTotal.toLocaleString("en-US")} at office`
                    : `Pay Rs. ${finalTotal.toLocaleString("en-US")} on arrival`}
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
                <span className="font-semibold text-xs">{t("modal.bankTransfer", "Bank Transfer")}</span>
                <span className="text-[10px] text-tea-muted font-normal truncate max-w-[130px]">
                  {bankInfo.bankName || "Commercial Bank of Ceylon"}
                </span>
              </button>
            </div>

            {/* Bank Details Box (Shown when Bank Transfer is selected) */}
            {paymentMethod === "BANK" && (
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 text-xs space-y-2 text-tea-dark animate-fade-in">
                <div className="flex justify-between items-center pb-1.5 border-b border-amber-200/70">
                  <span className="font-bold text-tea-forest text-xs">
                    {bankInfo.bankName || "Commercial Bank of Ceylon PLC"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyAccount(e, bankInfo.bankAccountNumber)}
                    className="flex items-center gap-1 text-[11px] text-tea-leaf hover:text-tea-dark font-medium px-2 py-0.5 rounded-md bg-white border border-amber-300 shadow-xs active:scale-95 transition"
                  >
                    {copiedAccount ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">{t("bank.copied", "Copied!")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-tea-leaf" />
                        <span>{t("bank.copyAccount", "Copy Account No")}</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <p>
                    <span className="text-tea-muted">{t("bank.accountName", "Account Name")}:</span>{" "}
                    <strong className="text-tea-dark">{bankInfo.bankAccountName || "LEENA CEYLON (PVT) LTD"}</strong>
                  </p>
                  <p>
                    <span className="text-tea-muted">{t("bank.accountNumber", "Account Number")}:</span>{" "}
                    <strong className="font-mono text-tea-forest font-bold text-xs select-all">
                      {bankInfo.bankAccountNumber || "1000 2489 7120"}
                    </strong>
                  </p>
                  <p>
                    <span className="text-tea-muted">{t("bank.branch", "Branch")}:</span>{" "}
                    <strong>
                      {bankInfo.bankBranch || "Kekirawa Branch"}
                      {bankInfo.bankSwiftCode ? ` (Swift: ${bankInfo.bankSwiftCode})` : ""}
                    </strong>
                  </p>
                  <p>
                    <span className="text-tea-muted">{t("bank.amountToTransfer", "Amount to Transfer")}:</span>{" "}
                    <strong className="text-emerald-700 font-bold">Rs. {finalTotal.toLocaleString("en-US")}</strong>
                  </p>
                </div>

                {bankInfo.bank2Name && bankInfo.bank2AccountNumber && (
                  <div className="pt-1.5 border-t border-amber-200/70 text-[10.5px] flex items-center justify-between gap-1 text-tea-dark">
                    <span>
                      {t("bank.altAccount", "Alt Bank")}: <strong>{bankInfo.bank2Name}</strong> — <span className="font-mono font-bold">{bankInfo.bank2AccountNumber}</span> {bankInfo.bank2Branch && `(${bankInfo.bank2Branch})`}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyAccount(e, bankInfo.bank2AccountNumber)}
                      className="text-tea-leaf hover:text-tea-dark font-semibold underline text-[10px]"
                    >
                      {t("bank.copyAlt", "Copy Alt")}
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-amber-800 bg-amber-100/70 p-1.5 rounded-md">
                  💡 {bankInfo.bankInstructions || t("bank.instructions", "Transfer the total amount and share your payment slip screenshot on WhatsApp.")}
                </p>
              </div>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="text-[11px] text-tea-muted bg-emerald-50/60 border border-emerald-200/50 p-2.5 rounded-xl flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{t("product.fastDelivery", "Islandwide delivery in 24–48 hours")}</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{t("product.pureCeylon", "100% Pure Ceylon Tea")}</span>
            </span>
          </div>
        </div>

        {/* Fixed Footer Buttons */}
        <div className="p-4 sm:p-5 bg-tea-bg/80 border-t border-tea-border space-y-2 shrink-0">
          <button
            onClick={handleContinue}
            disabled={isSubmittingOrder}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-80 disabled:cursor-wait text-white font-bold text-sm uppercase tracking-wider transition shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            {isSubmittingOrder ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Recording Order & Launching WhatsApp...</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5 fill-current" />
                <span>{t("modal.sendOrderButton", "CONFIRM & SEND ORDER VIA WHATSAPP")} • RS. {finalTotal.toLocaleString("en-US")}</span>
              </>
            )}
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
