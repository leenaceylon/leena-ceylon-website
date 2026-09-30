"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MessageSquare, Eye, Sparkles, Pause, Play } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { calculatePricing } from "@/lib/pricing";

export interface SliderProduct {
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
  category?: { name: string; slug: string } | null;
  sizes: Array<{
    id: string;
    sizeName: string;
    regularPrice: number;
    salePrice?: number | null;
    stock: number;
  }>;
}

interface ProductSliderProps {
  products: SliderProduct[];
}

export default function ProductSlider({ products }: ProductSliderProps) {
  const { openWhatsAppModal } = useCart();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, number>>({});
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Responsive items calculation
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth >= 1024) {
        setItemsPerPage(3); // 3 on desktop
      } else if (window.innerWidth >= 640) {
        setItemsPerPage(2); // 2 on tablet
      } else {
        setItemsPerPage(1); // 1 on mobile
      }
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const totalProducts = products.length;
  const maxIndex = Math.max(0, totalProducts - itemsPerPage);

  // Auto sliding logic
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (isPaused || maxIndex <= 0) return;
    const timer = setInterval(() => {
      handleNext();
    }, 3800);
    return () => clearInterval(timer);
  }, [isPaused, maxIndex, handleNext]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      handleNext();
    } else if (distance < -50) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slider Controls Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tea-leaf/10 border border-tea-leaf/20 text-tea-forest text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-tea-leaf" />
            <span>Featured Ceylon Teas ({totalProducts})</span>
          </span>
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] text-tea-muted hover:text-tea-dark transition px-2 py-0.5 rounded-md hover:bg-tea-bg"
            title={isPaused ? "Resume Auto-Slide" : "Pause Auto-Slide"}
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-600" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? "Auto-slide paused" : "Auto-sliding"}</span>
          </button>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="w-10 h-10 rounded-full border border-tea-border bg-white hover:bg-tea-bg text-tea-dark flex items-center justify-center transition shadow-xs hover:border-tea-leaf focus:outline-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            className="w-10 h-10 rounded-full border border-tea-border bg-white hover:bg-tea-bg text-tea-dark flex items-center justify-center transition shadow-xs hover:border-tea-leaf focus:outline-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Slider Viewport */}
      <div className="overflow-hidden py-1">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
          }}
        >
          {products.map((product) => {
            if (!product) return null;
            const selectedSizeIndex = selectedSizes[product.id] || 0;
            const sizes = Array.isArray(product.sizes) ? product.sizes : [];
            const activeSize =
              sizes.length > 0
                ? sizes[selectedSizeIndex] || sizes[0]
                : null;
            const pricing = calculatePricing(
              activeSize ? activeSize.regularPrice : product.regularPrice,
              activeSize ? activeSize.salePrice : product.salePrice,
              1
            );
            const currentPrice = pricing.unitPrice;
            const regularPrice = pricing.regularPrice;
            const hasDiscount = pricing.hasDiscount;
            const discountPercent = pricing.discountPercent;
            const currentStock = Number(activeSize ? activeSize.stock : product.stock) || 0;
            const isOutOfStock = currentStock <= 0;

            const handleOrder = (e: React.MouseEvent) => {
              e.preventDefault();
              openWhatsAppModal({
                productName: product.name || "Ceylon Tea",
                size: activeSize?.sizeName || "Standard",
                quantity: 1,
                price: pricing.unitPrice,
                total: pricing.totalPrice,
                regularPrice: pricing.hasDiscount ? pricing.regularPrice : undefined,
                regularTotal: pricing.hasDiscount ? pricing.totalRegularPrice : undefined,
                savings: pricing.hasDiscount ? pricing.totalSavings : undefined,
                availableSizes: (product.sizes || []).map((s: any) => {
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
                key={product.id}
                style={{ width: `${100 / itemsPerPage}%` }}
                className="shrink-0 px-2 sm:px-3"
              >
                <div className="group h-full bg-white rounded-2xl border border-tea-border shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between overflow-hidden">
                  {/* Top Image Showcase - Perfectly fitted with object-contain */}
                  <div className="relative aspect-square w-full bg-gradient-to-b from-tea-surface/60 via-white to-tea-bg/30 p-4 sm:p-5 flex items-center justify-center overflow-hidden border-b border-tea-border/40">
                    <Link
                      href={`/products/${product.slug}`}
                      className="relative w-full h-full block"
                    >
                      <Image
                        src={product.mainImage || "/uploads/leena-tea-powder-200g.jpeg"}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain object-center group-hover:scale-105 transition-transform duration-500 drop-shadow-md"
                      />
                    </Link>

                    {/* Grade & Discount Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {hasDiscount && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs">
                          {discountPercent}% OFF
                        </span>
                      )}
                      {product.teaGrade && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-tea-dark/85 backdrop-blur-xs text-white">
                          {product.teaGrade}
                        </span>
                      )}
                    </div>

                    {/* Stock Status Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-700 text-white flex items-center gap-1 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-tea-leaf font-semibold uppercase tracking-wider">
                        <span>{product.teaType || "Pure Ceylon Tea"}</span>
                        {product.origin && (
                          <span className="text-tea-muted font-normal normal-case">
                            {product.origin.split(",")[0]}
                          </span>
                        )}
                      </div>

                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-serif font-bold text-tea-dark text-base sm:text-lg group-hover:text-tea-forest transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-xs text-tea-muted line-clamp-2 leading-relaxed">
                        {product.shortDescription}
                      </p>

                      {/* Size Selector */}
                      {product.sizes && product.sizes.length > 0 && (
                        <div className="pt-2">
                          <div className="text-[11px] text-tea-muted mb-1.5 font-medium">
                            Choose Pack Size:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {product.sizes.map((sz, idx) => {
                              const szPricing = calculatePricing(sz.regularPrice, sz.salePrice, 1);
                              return (
                                <button
                                  key={sz.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedSizes((prev) => ({
                                      ...prev,
                                      [product.id]: idx,
                                    }))
                                  }
                                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition flex items-center gap-1 ${
                                    selectedSizeIndex === idx
                                      ? "border-tea-forest bg-tea-forest text-white shadow-xs font-bold"
                                      : "border-tea-border bg-white text-tea-dark hover:border-tea-leaf"
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
                        </div>
                      )}
                    </div>

                    {/* Price and CTA Buttons */}
                    <div className="pt-3 border-t border-tea-border/60 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-xs text-tea-muted">Price:</span>
                          <div className="flex items-baseline gap-2">
                            <span className="font-serif text-xl sm:text-2xl font-bold text-tea-dark">
                              Rs. {currentPrice.toLocaleString("en-US")}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-tea-muted line-through">
                                Rs. {regularPrice.toLocaleString("en-US")}
                              </span>
                            )}
                          </div>
                        </div>
                        {activeSize && (
                          <span className="text-xs font-medium text-tea-forest bg-tea-surface px-2 py-0.5 rounded">
                            {activeSize.sizeName}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleOrder}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wide transition shadow-xs hover:shadow-subtle"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Order</span>
                        </button>

                        <Link
                          href={`/products/${product.slug}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-tea-border bg-white hover:bg-tea-bg text-tea-dark font-medium text-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-tea-leaf" />
                          <span>View Details</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots */}
      {maxIndex > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === idx
                  ? "w-8 bg-tea-forest"
                  : "w-2 bg-tea-border hover:bg-tea-leaf/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
