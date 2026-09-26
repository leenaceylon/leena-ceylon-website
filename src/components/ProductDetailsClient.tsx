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
} from "lucide-react";
import { compileBankTransferWhatsAppMessage, getWhatsAppUrl } from "@/lib/whatsapp";

export default function ProductDetailsClient({
  product,
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
}) {
  const { openWhatsAppModal } = useCart();

  const [selectedImage, setSelectedImage] = useState(
    product.images?.[0]?.url || product.mainImage
  );
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const activeSize =
    product.sizes && product.sizes.length > 0
      ? product.sizes[selectedSizeIndex]
      : null;

  const currentPrice = activeSize
    ? activeSize.salePrice || activeSize.regularPrice
    : product.salePrice || product.regularPrice;

  const regularPrice = activeSize
    ? activeSize.regularPrice
    : product.regularPrice;

  const hasDiscount = regularPrice > currentPrice;
  const currentStock = activeSize ? activeSize.stock : product.stock;
  const isOutOfStock = currentStock <= 0;

  const galleryImages = [
    product.mainImage,
    ...(product.images || []).map((img) => img.url),
  ].filter((url, index, self) => self.indexOf(url) === index);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText("100024897120");
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const handleOrderWhatsApp = () => {
    openWhatsAppModal({
      productName: product.name,
      size: activeSize?.sizeName || "Standard",
      quantity: quantity,
      price: currentPrice,
      total: currentPrice * quantity,
    });
  };

  const handleBankTransferWhatsApp = () => {
    const waMsg = compileBankTransferWhatsAppMessage({
      orderNumber: "Direct Inquiry",
      customerName: "",
      phone: "",
      address: "",
      total: currentPrice * quantity,
      items: [
        {
          name: product.name,
          size: activeSize?.sizeName || "Standard",
          quantity: quantity,
          price: currentPrice,
        },
      ],
      bankDetails:
        "Bank: Commercial Bank of Ceylon PLC\nAccount Name: LEENA CEYLON (PVT) LTD\nAccount No: 1000 2489 7120\nBranch: Kekirawa Branch\nSwift: CCEYLKLX",
      brandName: "LEENA CEYLON",
    });
    const url = getWhatsAppUrl("071 777 4717", waMsg);
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
        <div className="flex items-baseline gap-3 pb-4 border-b border-tea-border/60">
          <span className="text-3xl font-bold text-tea-forest font-serif">
            Rs. {currentPrice.toLocaleString("en-US")}
          </span>
          {hasDiscount && (
            <span className="text-base text-tea-muted line-through">
              Rs. {regularPrice.toLocaleString("en-US")}
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

        {/* Size Selection (Admin-controlled) */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-tea-dark uppercase tracking-wider">
                Select Size:
              </span>
              <span className="text-tea-muted">
                {activeSize?.sizeName} (Rs. {currentPrice})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((sz, idx) => (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => setSelectedSizeIndex(idx)}
                  className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
                    selectedSizeIndex === idx
                      ? "border-tea-forest bg-tea-forest text-white shadow-sm"
                      : "border-tea-border bg-white text-tea-dark hover:border-tea-leaf"
                  }`}
                >
                  <span>{sz.sizeName}</span>
                  {sz.regularPrice && (
                    <span className="text-[10px] opacity-80">
                      — Rs. {sz.salePrice || sz.regularPrice}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity & Stock Status */}
        <div className="flex items-center gap-6 pt-2">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-tea-dark uppercase tracking-wider">
              Quantity:
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
              Status:
            </span>
            {isOutOfStock ? (
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

        {/* Direct WhatsApp & Bank Transfer Action Buttons */}
        <div className="space-y-3 pt-4 border-t border-tea-border/60">
          {/* Primary ORDER VIA WHATSAPP Button */}
          <button
            type="button"
            onClick={handleOrderWhatsApp}
            disabled={isOutOfStock}
            className={`w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition active:scale-[0.99] ${
              isOutOfStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-card hover:shadow-hover"
            }`}
          >
            <MessageSquare className="w-5 h-5 fill-current" />
            <span>ORDER VIA WHATSAPP</span>
          </button>

          {/* Secondary Direct Bank Transfer Order Button */}
          <button
            type="button"
            onClick={handleBankTransferWhatsApp}
            disabled={isOutOfStock}
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
                Commercial Bank Account Details
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
                <span className="font-semibold">LEENA CEYLON (PVT) LTD</span>
              </div>
              <div>
                <span className="text-tea-muted block">Account Number:</span>
                <span className="font-mono font-bold text-tea-forest select-all">1000 2489 7120</span>
              </div>
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
              <span className="font-semibold text-tea-dark">Kekirawa / Nuwara Eliya</span>
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
