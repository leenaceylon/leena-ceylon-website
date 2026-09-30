"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import {
  MessageSquare,
  Building,
  Copy,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Star,
  Plus,
  Minus,
  Clock,
} from "lucide-react";
import { compileBankTransferWhatsAppMessage, getWhatsAppUrl } from "@/lib/whatsapp";
import { calculatePricing } from "@/lib/pricing";
import { SiteSettingsMap } from "@/types";

export default function ProductDetailsClient({
  product,
  bankSettings,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    shortDescription: string;
    fullDescription: string;
    teaType: string;
    teaGrade: string;
    origin: string;
    regularPrice: number;
    salePrice?: number | null;
    stock: number;
    mainImage: string;
    brewingGuide?: string | null;
    isComingSoon?: boolean | null;
    images: Array<{ id: string; url: string; altText?: string | null }>;
    sizes: Array<{
      id: string;
      sizeName: string;
      regularPrice: number;
      salePrice?: number | null;
      stock: number;
      sku?: string | null;
    }>;
    category?: { name: string; slug: string } | null;
  };
  bankSettings?: SiteSettingsMap;
}) {
  const { openWhatsAppModal } = useCart();

  const bankName = bankSettings?.bankName || "Commercial Bank of Ceylon PLC";
  const bankAccountName = bankSettings?.bankAccountName || "LEENA CEYLON (PVT) LTD";
  const bankAccountNumber = bankSettings?.bankAccountNumber || "1000 2489 7120";
  const bankBranch = bankSettings?.bankBranch || "Kekirawa Branch";
  const bankSwiftCode = bankSettings?.bankSwiftCode || "CCEYLKLX";
  const whatsappNumber = bankSettings?.whatsappNumber || "071 777 4717";
  const brandName = bankSettings?.brandName || "LEENA CEYLON";

  const fallbackImg = "/uploads/leena-tea-powder-200g.jpeg";
  const initialImg = product.images?.[0]?.url || product.mainImage || fallbackImg;

  const [selectedImage, setSelectedImage] = useState(initialImg);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const activeSize = sizes.length > 0 ? sizes[selectedSizeIndex] || sizes[0] : null;

  const pricing = calculatePricing(
    activeSize ? activeSize.regularPrice : product.regularPrice,
    activeSize ? activeSize.salePrice : product.salePrice,
    quantity
  );

  const isComingSoon = Boolean(product.isComingSoon);
  const currentStock = Number(activeSize ? activeSize.stock : product.stock) || 0;
  const isOutOfStock = !isComingSoon && currentStock <= 0;

  const rawGallery = [
    product.mainImage,
    ...(product.images || []).map((img) => img.url),
  ].filter((url): url is string => Boolean(url) && typeof url === "string");
  const galleryImages = rawGallery.filter((url, index, self) => self.indexOf(url) === index);
  if (galleryImages.length === 0) {
    galleryImages.push(fallbackImg);
  }

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bankAccountNumber.replace(/\s+/g, ""));
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const handleOrderWhatsApp = () => {
    openWhatsAppModal({
      productName: product.name,
      size: activeSize?.sizeName || "Standard",
      quantity: quantity,
      price: pricing.unitPrice,
      regularPrice: pricing.regularPrice,
      total: pricing.totalPrice,
      regularTotal: pricing.totalRegularPrice,
      savings: pricing.totalSavings,
      isComingSoon: isComingSoon,
      availableSizes: sizes.map((s) => {
        const szP = calculatePricing(s.regularPrice, s.salePrice, 1);
        return {
          id: s.id,
          sizeName: s.sizeName,
          price: szP.unitPrice,
          regularPrice: szP.regularPrice,
          salePrice: szP.hasDiscount ? szP.unitPrice : null,
          stock: Number(s.stock) || 0,
        };
      }),
    });
  };

  const handleBankTransferWhatsApp = () => {
    const waMsg = compileBankTransferWhatsAppMessage({
      orderNumber: "Direct Inquiry",
      customerName: "",
      phone: "",
      address: "",
      total: pricing.totalPrice,
      items: [
        {
          name: product.name,
          size: activeSize?.sizeName || "Standard",
          quantity: quantity,
          price: pricing.unitPrice,
        },
      ],
      bankInfo: {
        bankName,
        bankAccountName,
        bankAccountNumber,
        bankBranch,
        bankSwiftCode,
        bank2Name: bankSettings?.bank2Name,
        bank2AccountName: bankSettings?.bank2AccountName,
        bank2AccountNumber: bankSettings?.bank2AccountNumber,
        bank2Branch: bankSettings?.bank2Branch,
      },
      bankDetails: bankSettings?.bankDetails,
      brandName,
    });
    const url = getWhatsAppUrl(whatsappNumber, waMsg);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
      {/* Left Column: Image Gallery */}
      <div className="lg:col-span-6 space-y-4">
        {/* Main Display */}
        <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-gradient-to-b from-tea-surface/50 via-white to-tea-bg/40 border border-tea-border shadow-subtle p-6 flex items-center justify-center">
          <div className="relative w-full h-full">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain object-center drop-shadow-md"
            />
          </div>
          {product.teaGrade && (
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-tea-dark/85 backdrop-blur-xs text-white text-xs font-semibold">
              {product.teaGrade}
            </span>
          )}
          {isComingSoon && (
            <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Coming Soon
            </span>
          )}
        </div>

        {/* Thumbnail Carousel */}
        {galleryImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {galleryImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(imgUrl)}
                className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition bg-white p-1 ${
                  selectedImage === imgUrl
                    ? "border-tea-forest ring-2 ring-tea-forest/20"
                    : "border-tea-border hover:border-tea-leaf opacity-80"
                }`}
              >
                <Image
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Information, Pricing & Purchasing Actions */}
      <div className="lg:col-span-6 space-y-6">
        <div className="space-y-2">
          {product.category && (
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              {product.category.name}
            </span>
          )}
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-tea-dark">
            {product.name}
          </h1>
          <p className="text-xs text-tea-muted">SKU: {activeSize?.sku || product.sku}</p>
        </div>

        {/* Price Row */}
        <div className="flex flex-wrap items-baseline gap-3 pb-4 border-b border-tea-border/60">
          <span className="text-3xl sm:text-4xl font-bold text-tea-forest font-serif">
            Rs. {pricing.unitPrice.toLocaleString("en-US")}
          </span>
          {pricing.hasDiscount && (
            <span className="text-lg text-tea-muted line-through">
              Rs. {pricing.regularPrice.toLocaleString("en-US")}
            </span>
          )}
          {pricing.hasDiscount && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Save Rs. {pricing.savingsPerUnit.toLocaleString("en-US")} ({pricing.discountPercent}% OFF)
            </span>
          )}
          {activeSize && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-tea-bg text-tea-dark font-medium border border-tea-border">
              {activeSize.sizeName}
            </span>
          )}
        </div>

        {/* Short Description */}
        <p className="text-sm text-tea-muted leading-relaxed">
          {product.shortDescription}
        </p>

        {/* Size Selection (Admin-controlled Gram-wise Options) */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-tea-dark uppercase tracking-wider">
                Select Size / Pack:
              </span>
              <span className="text-tea-forest font-semibold">
                {activeSize?.sizeName} — Rs. {pricing.unitPrice.toLocaleString("en-US")}
                {pricing.hasDiscount && (
                  <span className="text-tea-muted line-through ml-1 text-[11px]">
                    (Rs. {pricing.regularPrice.toLocaleString("en-US")})
                  </span>
                )}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((sz, idx) => {
                const szPricing = calculatePricing(sz.regularPrice, sz.salePrice, 1);
                const isSelected = selectedSizeIndex === idx;
                return (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setSelectedSizeIndex(idx)}
                    className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
                      isSelected
                        ? "border-tea-forest bg-tea-forest text-white shadow-sm"
                        : "border-tea-border bg-white text-tea-dark hover:border-tea-leaf"
                    }`}
                  >
                    <span>{sz.sizeName}</span>
                    <span className={`text-[11px] font-normal ${isSelected ? "text-emerald-200" : "text-tea-muted"}`}>
                      Rs. {szPricing.unitPrice.toLocaleString("en-US")}
                    </span>
                    {szPricing.hasDiscount && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          isSelected ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        Offer
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity & Stock Status */}
        <div className="flex items-center gap-6 pt-2">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-tea-dark uppercase tracking-wider">
              Quantity (Packs):
            </span>
            <div className="flex items-center border border-tea-border rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 text-tea-muted hover:text-tea-dark hover:bg-tea-bg transition"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-1 text-sm font-bold text-tea-dark min-w-[2.5rem] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2.5 text-tea-muted hover:text-tea-dark hover:bg-tea-bg transition"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="block text-xs font-bold text-tea-dark uppercase tracking-wider">
              Stock Status:
            </span>
            {isComingSoon ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 text-xs font-bold border border-amber-300 shadow-xs">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                Coming Soon (Pre-Order Available)
              </span>
            ) : isOutOfStock ? (
              <span className="inline-block px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                Out of Stock
              </span>
            ) : currentStock <= 15 ? (
              <span className="inline-block px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                Low Stock ({currentStock} left)
              </span>
            ) : (
              <span className="inline-block px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                Available in Stock
              </span>
            )}
          </div>
        </div>

        {/* Live Qty-wise & Gram-wise Order Summary Card */}
        <div className="p-4 bg-tea-surface/80 rounded-2xl border border-tea-border space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-tea-muted font-medium">Order Selection:</span>
            <span className="font-bold text-tea-dark">
              {quantity} × {activeSize?.sizeName || "Standard Pack"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-tea-muted font-medium">Unit Price:</span>
            <span className="font-semibold text-tea-dark">
              Rs. {pricing.unitPrice.toLocaleString("en-US")} each{" "}
              {pricing.hasDiscount && (
                <span className="line-through text-tea-muted text-[10px] ml-1">
                  (Reg: Rs. {pricing.regularPrice.toLocaleString("en-US")})
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-tea-border/60 text-sm font-bold">
            <span className="text-tea-dark">Total Order Amount:</span>
            <span className="text-tea-forest font-serif text-lg">
              Rs. {pricing.totalPrice.toLocaleString("en-US")}
            </span>
          </div>
          {pricing.hasDiscount && (
            <div className="pt-1 flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Special Promotion Discount</span>
              </span>
              <span>
                You Save Rs. {pricing.totalSavings.toLocaleString("en-US")} ({pricing.discountPercent}% OFF)!
              </span>
            </div>
          )}
        </div>

        {/* Pre-Launch / Coming Soon Notice */}
        {isComingSoon && (
          <div className="p-3.5 bg-gradient-to-r from-amber-50 via-amber-50/80 to-tea-surface border border-amber-300 rounded-2xl text-xs text-amber-950 flex items-start gap-3 shadow-xs">
            <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block font-serif text-sm font-bold text-amber-950">
                Pre-Launch Edition / Coming Soon
              </strong>
              <p className="text-amber-900/90 leading-relaxed text-[11px]">
                This tea is currently in preparation. You can place a WhatsApp pre-order inquiry to reserve your freshly packed caddy before the public launch.
              </p>
            </div>
          </div>
        )}

        {/* Direct WhatsApp & Bank Transfer Action Buttons */}
        <div className="space-y-3 pt-4 border-t border-tea-border/60">
          {/* Primary ORDER / PRE-ORDER Button */}
          <button
            type="button"
            onClick={handleOrderWhatsApp}
            disabled={!isComingSoon && isOutOfStock}
            className={`w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition active:scale-[0.99] ${
              isComingSoon
                ? "bg-amber-600 hover:bg-amber-700 shadow-card hover:shadow-hover"
                : isOutOfStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-card hover:shadow-hover"
            }`}
          >
            {isComingSoon ? (
              <>
                <Clock className="w-5 h-5" />
                <span>PRE-ORDER INQUIRY VIA WHATSAPP</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5 fill-current" />
                <span>ORDER VIA WHATSAPP</span>
              </>
            )}
          </button>

          {/* Secondary Direct Bank Transfer Order Button */}
          <button
            type="button"
            onClick={handleBankTransferWhatsApp}
            disabled={!isComingSoon && isOutOfStock}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl border-2 border-tea-forest text-tea-forest hover:bg-tea-forest hover:text-white text-xs font-bold uppercase tracking-wider transition active:scale-[0.99] bg-white shadow-sm"
          >
            <Building className="w-4 h-4" />
            <span>ORDER WITH BANK TRANSFER & SEND SLIP</span>
          </button>

          {/* Quick Bank Account Card */}
          <div className="bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/40 p-4 rounded-xl border border-tea-gold/40 text-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-tea-border/60">
              <span className="font-bold text-tea-forest flex items-center gap-1.5 text-[11px]">
                <Building className="w-3.5 h-3.5 text-tea-leaf" />
                {bankName} Details
              </span>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="flex items-center gap-1 text-[10px] font-semibold text-tea-leaf hover:text-tea-dark px-2 py-0.5 rounded bg-white border border-tea-border shadow-xs"
              >
                {copiedAccount ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy No</span>
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-tea-dark">
              <div>
                <span className="text-tea-muted block">Account Name:</span>
                <span className="font-semibold">{bankAccountName}</span>
              </div>
              <div>
                <span className="text-tea-muted block">Account Number:</span>
                <span className="font-mono font-bold text-tea-forest select-all">{bankAccountNumber}</span>
              </div>
              <div>
                <span className="text-tea-muted block">Branch:</span>
                <span className="font-semibold">{bankBranch}{bankSwiftCode ? ` (${bankSwiftCode})` : ""}</span>
              </div>
              {bankSettings?.bank2Name && bankSettings?.bank2AccountNumber ? (
                <div>
                  <span className="text-tea-muted block">Alt Account:</span>
                  <span className="font-semibold">{bankSettings.bank2Name} ({bankSettings.bank2AccountNumber})</span>
                </div>
              ) : (
                <div>
                  <span className="text-tea-muted block">Status:</span>
                  <span className="text-emerald-700 font-semibold">Active Corporate Bank</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-tea-muted italic pt-1">
              Select your pack size and quantity above, then click either button to connect directly with our dispatch team on WhatsApp.
            </p>
          </div>
        </div>

        {/* Key Product Specifications */}
        <div className="bg-tea-surface p-5 rounded-2xl border border-tea-border space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-tea-muted block">Tea Grade:</span>
              <span className="font-semibold text-tea-dark">{product.teaGrade || "BOPF"}</span>
            </div>
            <div>
              <span className="text-tea-muted block">Tea Type:</span>
              <span className="font-semibold text-tea-dark">{product.teaType || "Pure Ceylon Black Tea"}</span>
            </div>
            <div>
              <span className="text-tea-muted block">Origin:</span>
              <span className="font-semibold text-tea-dark">{product.origin || "Sri Lanka"}</span>
            </div>
            <div>
              <span className="text-tea-muted block">Dispatched From:</span>
              <span className="font-semibold text-tea-dark">Kekirawa Head Office</span>
            </div>
          </div>
        </div>

        {/* Shipping & Delivery Guarantee */}
        <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs text-tea-dark border-t border-tea-border/60">
          <div className="p-3 bg-tea-bg rounded-xl">
            <Truck className="w-5 h-5 text-tea-leaf mx-auto mb-1" />
            <span className="font-medium text-[11px] block">Island-wide</span>
            <span className="text-tea-muted text-[10px]">2-4 business days</span>
          </div>
          <div className="p-3 bg-tea-bg rounded-xl">
            <ShieldCheck className="w-5 h-5 text-tea-leaf mx-auto mb-1" />
            <span className="font-medium text-[11px] block">Authentic</span>
            <span className="text-tea-muted text-[10px]">100% Pure Ceylon</span>
          </div>
          <div className="p-3 bg-tea-bg rounded-xl">
            <RotateCcw className="w-5 h-5 text-tea-leaf mx-auto mb-1" />
            <span className="font-medium text-[11px] block">Fresh Pack</span>
            <span className="text-tea-muted text-[10px]">Airtight Sealed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
