"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MessageSquare, ArrowRight, Sparkles, Clock } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { calculatePricing } from "@/lib/pricing";

export interface HeroSlideItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  regularPrice: number;
  salePrice?: number | null;
  stock: number;
  mainImage: string;
  teaGrade?: string | null;
  teaType?: string | null;
  origin?: string | null;
  isComingSoon?: boolean | null;
  category?: { name: string; slug: string } | null;
  sizes: Array<{
    id: string;
    sizeName: string;
    regularPrice: number;
    salePrice?: number | null;
    stock: number;
  }>;
}

interface HeroProductSliderProps {
  products: HeroSlideItem[];
}

export default function HeroProductSlider({ products }: HeroProductSliderProps) {
  const { openWhatsAppModal } = useCart();
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const total = products.length;

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
    setSelectedSizeIndex(0);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setSelectedSizeIndex(0);
  }, [total]);

  // Auto-slide every 3.5 seconds
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused, total, handleNext]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (total === 0) return null;

  const currentProduct = products[currentIndex] || products[0];
  if (!currentProduct) return null;

  const sizes = Array.isArray(currentProduct.sizes) ? currentProduct.sizes : [];
  const activeSize = sizes.length > 0 ? sizes[selectedSizeIndex] || sizes[0] : null;

  // Live calculation of offer and regular pricing
  const pricing = calculatePricing(
    activeSize ? activeSize.regularPrice : currentProduct.regularPrice,
    activeSize ? activeSize.salePrice : currentProduct.salePrice,
    1
  );

  const currentPrice = pricing.unitPrice;
  const regularPrice = pricing.regularPrice;
  const hasDiscount = pricing.hasDiscount;

  const isComingSoon = Boolean(currentProduct.isComingSoon);

  const getProductTitle = (p: any) => {
    if (p.slug === "leena-ceylon-tea-powder") return t("prod.teaPowder.title", p.name);
    if (p.slug === "leena-ceylon-bopf-tin-250g" || p.slug === "leena-ceylon-bopf-premium-tin") return t("prod.bopfTin.title", p.name);
    if (p.slug === "leena-ceylon-lemon-tea-500g") return t("prod.lemonTea.title", p.name);
    if (p.slug === "pure-ceylon-organic-cinnamon") return t("prod.cinnamonTea.title", p.name);
    return p.name;
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    openWhatsAppModal({
      productName: getProductTitle(currentProduct) || currentProduct.name || "Ceylon Tea",
      size: activeSize?.sizeName || "Standard",
      quantity: 1,
      price: pricing.unitPrice,
      total: pricing.totalPrice,
      regularPrice: pricing.hasDiscount ? pricing.regularPrice : undefined,
      regularTotal: pricing.hasDiscount ? pricing.totalRegularPrice : undefined,
      savings: pricing.hasDiscount ? pricing.totalSavings : undefined,
      isComingSoon: isComingSoon,
      availableSizes: sizes.map((s: any) => {
        const sp = calculatePricing(s.regularPrice, s.salePrice, 1);
        return {
          id: s.id,
          sizeName: s.sizeName,
          price: sp.unitPrice,
          regularPrice: sp.regularPrice,
          salePrice: sp.hasDiscount ? sp.unitPrice : undefined,
          stock: Number(s.stock) || 0,
        };
      }),
    });
  };

  return (
    <div
      className="relative w-full max-w-lg mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Organic Tea-Leaf Inspired Background Shape */}
      <div className="absolute inset-0 -m-3 sm:-m-6 bg-gradient-to-br from-emerald-100/40 via-tea-surface/80 to-tea-leaf/10 rounded-[38px] sm:rounded-[48px] transform -rotate-2 sm:-rotate-3 transition-transform duration-700 pointer-events-none border border-emerald-900/5 shadow-subtle" />

      {/* 2. Main Hero Showcase Container */}
      <div className="relative bg-white/95 backdrop-blur-md rounded-[32px] sm:rounded-[40px] border border-tea-border p-5 sm:p-7 shadow-card hover:shadow-hover transition-all duration-300 flex flex-col justify-between overflow-hidden">
        {/* Top Badges */}
        <div className="flex items-center justify-between z-10 mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-tea-leaf/10 text-tea-forest text-[11px] font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-tea-leaf" />
              <span>{currentProduct.teaGrade || currentProduct.category?.name || "Pure Ceylon"}</span>
            </span>
            {hasDiscount && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold tracking-wider uppercase">
                {pricing.discountPercent}% OFF
              </span>
            )}
          </div>

          {isComingSoon ? (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>{t("product.comingSoon", "Coming Soon")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>{t("product.inStock", "In Stock")}</span>
            </div>
          )}
        </div>

        {/* Large Product Image with Authentic Aspect Ratio */}
        <div className="relative w-full h-56 sm:h-72 md:h-80 flex items-center justify-center my-2 group">
          <Link
            href={`/products/${currentProduct.slug || ""}`}
            className="relative w-full h-full block cursor-pointer"
          >
            <Image
              key={currentProduct.id}
              src={currentProduct.mainImage || "/uploads/leena-bopf-tin-250g.jpeg"}
              alt={currentProduct.name || "Ceylon Tea"}
              fill
              priority
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 450px"
              className="object-contain object-center drop-shadow-xl transition-all duration-500 transform group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Product Information */}
        <div className="space-y-3 z-10 pt-2 border-t border-tea-border/60">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <Link href={`/products/${currentProduct.slug || ""}`}>
              <h3 className="font-serif font-bold text-tea-dark text-lg sm:text-xl hover:text-tea-forest transition-colors line-clamp-1">
                {getProductTitle(currentProduct)}
              </h3>
            </Link>

            {/* Price Display */}
            <div className="flex items-baseline gap-2 shrink-0">
              <span className="font-serif text-xl sm:text-2xl font-bold text-tea-forest">
                Rs. {currentPrice.toLocaleString("en-US")}
              </span>
              {hasDiscount && (
                <span className="text-xs text-tea-muted line-through">
                  Rs. {regularPrice.toLocaleString("en-US")}
                </span>
              )}
            </div>
          </div>

          {/* Size / Weight Selector Pills */}
          {sizes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-tea-muted mr-1">{t("hero.weight", "Weight:")}</span>
              {sizes.map((sz, idx) => {
                const szPricing = calculatePricing(sz.regularPrice, sz.salePrice, 1);
                return (
                  <button
                    key={sz.id || `sz-${idx}`}
                    type="button"
                    onClick={() => setSelectedSizeIndex(idx)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition flex items-center gap-1 ${
                      selectedSizeIndex === idx
                        ? "border-tea-forest bg-tea-forest text-white shadow-xs"
                        : "border-tea-border bg-tea-surface/60 text-tea-dark hover:border-tea-leaf"
                    }`}
                  >
                    <span>{sz.sizeName}</span>
                    <span className={`text-[10px] ${selectedSizeIndex === idx ? "text-emerald-200" : "text-tea-forest font-bold"}`}>
                      Rs. {szPricing.unitPrice.toLocaleString("en-US")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Action Buttons: SHOP NOW / PRE-ORDER & WhatsApp */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleWhatsApp}
              className={`w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition shadow-card hover:shadow-hover active:scale-[0.98] ${
                isComingSoon
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isComingSoon ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t("hero.preOrder", "Pre-Order")}</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5 fill-current" />
                  <span>{t("hero.shopNow", "Shop Now")}</span>
                </>
              )}
            </button>

            <Link
              href={`/products/${currentProduct.slug}`}
              className="w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-tea-border bg-tea-surface hover:bg-white text-tea-dark hover:text-tea-forest font-semibold text-xs uppercase tracking-wider transition"
            >
              <span>{t("hero.explore", "Explore")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Carousel Navigation Buttons */}
        {total > 1 && (
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-tea-border/40">
            <div className="flex items-center gap-1.5">
              {products.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setSelectedSizeIndex(0);
                  }}
                  aria-label={`Go to product ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentIndex === idx
                      ? "w-7 bg-tea-forest"
                      : "w-2 bg-tea-border hover:bg-tea-leaf/40"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-tea-muted mr-1">
                {currentIndex + 1} / {total}
              </span>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Product"
                className="w-8 h-8 rounded-full border border-tea-border bg-white hover:bg-tea-bg text-tea-dark flex items-center justify-center transition hover:border-tea-leaf"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Product"
                className="w-8 h-8 rounded-full border border-tea-border bg-white hover:bg-tea-bg text-tea-dark flex items-center justify-center transition hover:border-tea-leaf"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
