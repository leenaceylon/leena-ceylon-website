"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { MessageSquare, ArrowRight, Sparkles, Clock } from "lucide-react";
import { calculatePricing } from "@/lib/pricing";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    shortDescription: string;
    regularPrice: number;
    salePrice?: number | null;
    stock: number;
    mainImage: string;
    teaGrade?: string;
    teaType?: string;
    isComingSoon?: boolean;
    sizes: Array<{
      id: string;
      sizeName: string;
      regularPrice: number;
      salePrice?: number | null;
      stock: number;
    }>;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { openWhatsAppModal } = useCart();
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [cardQuantity, setCardQuantity] = useState(1);

  if (!product) return null;

  const isComingSoon = Boolean(product.isComingSoon);
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const activeSize = sizes.length > 0 ? sizes[selectedSizeIndex] || sizes[0] : null;

  const pricing = calculatePricing(
    activeSize ? activeSize.regularPrice : product.regularPrice,
    activeSize ? activeSize.salePrice : product.salePrice,
    cardQuantity
  );

  const currentStock = Number(activeSize ? activeSize.stock : product.stock) || 0;
  const isOutOfStock = currentStock <= 0;

  const handleOrderWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    openWhatsAppModal({
      productName: product.name || "Ceylon Tea",
      size: activeSize?.sizeName || "Standard",
      quantity: cardQuantity,
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

  return (
    <div className="group bg-white rounded-2xl border border-tea-border shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full bg-gradient-to-b from-tea-surface/40 via-white to-tea-bg/30 p-3 sm:p-4 overflow-hidden flex items-center justify-center border-b border-tea-border/40">
        <Link href={`/products/${product.slug}`} className="relative w-full h-full block">
          <Image
            src={product.mainImage || "/uploads/leena-tea-powder-200g.jpeg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain object-center group-hover:scale-105 transition-transform duration-500 drop-shadow-sm"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {pricing.hasDiscount && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {pricing.discountPercent}% OFF
            </span>
          )}
          {product.teaGrade && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-tea-dark/85 backdrop-blur-xs text-white">
              {product.teaGrade}
            </span>
          )}
        </div>

        {/* Availability Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {isComingSoon ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-xs">
              <Clock className="w-2.5 h-2.5" />
              Coming Soon
            </span>
          ) : isOutOfStock ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
              Out of Stock
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-700 text-white flex items-center gap-1 shadow-xs">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
              In Stock
            </span>
          )}
        </div>
      </div>

      {/* Product Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Category / Type */}
          {product.teaType && (
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-tea-leaf uppercase block truncate">
              {product.teaType}
            </span>
          )}

          {/* Product Name */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-serif font-bold text-tea-dark text-sm sm:text-base group-hover:text-tea-forest transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Short Description */}
          <p className="text-[11px] sm:text-xs text-tea-muted line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Size / Weight Selector Pills */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="pt-1">
              <div className="flex flex-wrap gap-1">
                {product.sizes.map((sz, idx) => {
                  const szP = calculatePricing(sz.regularPrice, sz.salePrice, 1);
                  const isSelected = selectedSizeIndex === idx;
                  return (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setSelectedSizeIndex(idx)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium transition flex items-center gap-1 ${
                        isSelected
                          ? "border-tea-forest bg-tea-forest text-white font-bold shadow-xs"
                          : "border-tea-border bg-tea-surface/40 text-tea-dark hover:border-tea-leaf"
                      }`}
                    >
                      <span>{sz.sizeName}</span>
                      {szP.hasDiscount && (
                        <span className={`text-[9px] ${isSelected ? "text-emerald-200" : "text-emerald-700 font-bold"}`}>
                          Rs. {szP.unitPrice}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Price and CTA Button */}
        <div className="pt-2 border-t border-tea-border/60 space-y-2">
          <div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif font-bold text-tea-dark text-base sm:text-lg">
                  Rs. {pricing.unitPrice.toLocaleString("en-US")}
                </span>
                {pricing.hasDiscount && (
                  <span className="text-[11px] text-tea-muted line-through">
                    Rs. {pricing.regularPrice.toLocaleString("en-US")}
                  </span>
                )}
              </div>
              {pricing.hasDiscount ? (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Save Rs. {pricing.savingsPerUnit.toLocaleString("en-US")}
                </span>
              ) : activeSize ? (
                <span className="text-[10px] font-medium text-tea-muted">
                  {activeSize.sizeName}
                </span>
              ) : null}
            </div>

            {/* Qty-wise Live Total when cardQuantity > 1 */}
            {cardQuantity > 1 && (
              <div className="flex items-center justify-between text-[11px] text-tea-muted pt-1 border-t border-dashed border-tea-border/60 mt-1">
                <span>
                  Total ({cardQuantity} packs):{" "}
                  <strong className="text-tea-forest font-bold">
                    Rs. {pricing.totalPrice.toLocaleString("en-US")}
                  </strong>
                </span>
                {pricing.hasDiscount && (
                  <span className="text-emerald-700 font-bold text-[10px]">
                    (Saved Rs. {pricing.totalSavings.toLocaleString("en-US")}!)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Clean Quantity Counter & SHOP NOW Button */}
          <div className="flex items-center gap-1.5">
            {/* Quantity Selector on Card */}
            <div className="inline-flex items-center border border-tea-border rounded-xl bg-tea-surface/40 overflow-hidden h-9">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setCardQuantity((q) => Math.max(1, q - 1));
                }}
                disabled={cardQuantity <= 1 || isOutOfStock}
                className="w-7 h-full flex items-center justify-center text-tea-muted hover:text-tea-dark hover:bg-white transition text-xs font-bold disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="w-6 text-center font-bold text-xs text-tea-dark select-none">
                {cardQuantity}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setCardQuantity((q) => q + 1);
                }}
                disabled={isOutOfStock}
                className="w-7 h-full flex items-center justify-center text-tea-muted hover:text-tea-dark hover:bg-white transition text-xs font-bold disabled:opacity-40"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleOrderWhatsApp}
              disabled={!isComingSoon && isOutOfStock}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl font-bold text-[11px] sm:text-xs uppercase tracking-wider transition ${
                isComingSoon
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs active:scale-[0.98]"
                  : isOutOfStock
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-[0.98]"
              }`}
            >
              {isComingSoon ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pre-Order</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5 fill-current" />
                  <span>Shop Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
