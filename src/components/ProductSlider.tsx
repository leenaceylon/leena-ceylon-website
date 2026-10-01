"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Eye,
  Sparkles,
  Pause,
  Play,
  Clock,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
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

interface ProductSliderProps {
  products: SliderProduct[];
}

export default function ProductSlider({ products }: ProductSliderProps) {
  const { openWhatsAppModal } = useCart();
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, number>>({});
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const getProductTitle = (p: any) => {
    if (p.slug === "leena-ceylon-tea-powder") return t("prod.teaPowder.title", p.name);
    if (p.slug === "leena-ceylon-bopf-tin-250g" || p.slug === "leena-ceylon-bopf-premium-tin") return t("prod.bopfTin.title", p.name);
    if (p.slug === "leena-ceylon-lemon-tea-500g") return t("prod.lemonTea.title", p.name);
    if (p.slug === "pure-ceylon-organic-cinnamon") return t("prod.cinnamonTea.title", p.name);
    return p.name;
  };

  const getProductDesc = (p: any) => {
    if (p.slug === "leena-ceylon-tea-powder") return t("prod.teaPowder.desc", p.shortDescription);
    if (p.slug === "leena-ceylon-bopf-tin-250g" || p.slug === "leena-ceylon-bopf-premium-tin") return t("prod.bopfTin.desc", p.shortDescription);
    if (p.slug === "leena-ceylon-lemon-tea-500g") return t("prod.lemonTea.desc", p.shortDescription);
    if (p.slug === "pure-ceylon-organic-cinnamon") return t("prod.cinnamonTea.desc", p.shortDescription);
    return p.shortDescription;
  };

  const getProductType = (p: any) => {
    if (p.slug === "leena-ceylon-tea-powder") return t("prod.teaPowder.type", p.teaType || "Pure Ceylon Tea");
    if (p.slug === "leena-ceylon-bopf-tin-250g" || p.slug === "leena-ceylon-bopf-premium-tin") return t("prod.bopfTin.type", p.teaType || "High Grown BOPF");
    if (p.slug === "leena-ceylon-lemon-tea-500g") return t("prod.lemonTea.type", p.teaType || "Citrus Infused Tea");
    if (p.slug === "pure-ceylon-organic-cinnamon") return t("prod.cinnamonTea.type", p.teaType || "Pure Ceylon Spices");
    return p.teaType;
  };

  // Extract unique categories from products
  const categoryFilters = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    const cats: { key: string; label: string; count: number }[] = [
      { key: "all", label: t("slider.allTeas", "All Teas"), count: list.length },
    ];
    const catMap = new Map<string, { label: string; count: number }>();

    list.forEach((p) => {
      if (!p) return;
      const name = p.category?.name || p.teaType || "Black Tea";
      const key = (p.category?.slug || name).toLowerCase().replace(/\s+/g, "-");
      const existing = catMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        catMap.set(key, { label: name, count: 1 });
      }
    });

    catMap.forEach((val, key) => {
      cats.push({ key, label: val.label, count: val.count });
    });

    return cats;
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    if (activeCategory === "all") return list;
    return list.filter((p) => {
      if (!p) return false;
      const name = p.category?.name || p.teaType || "Black Tea";
      const key = (p.category?.slug || name).toLowerCase().replace(/\s+/g, "-");
      return key === activeCategory;
    });
  }, [products, activeCategory]);

  // Responsive items calculation
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth >= 1024) {
        setItemsPerPage(3); // 3 on desktop so it slides smoothly through all 4
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

  const totalFiltered = filteredProducts.length;
  const maxIndex = Math.max(0, totalFiltered - itemsPerPage);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  // Ensure index remains in bounds if itemsPerPage changes
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

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
    }, 4000);
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
    if (distance > 45) {
      handleNext();
    } else if (distance < -45) {
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
      {/* Category Filter Pills & Auto-Slide Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 sm:mb-5">
        {/* Category Tabs */}
        {categoryFilters.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categoryFilters.map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-tea-dark text-white shadow-xs"
                      : "bg-white text-tea-dark border border-tea-border hover:border-tea-leaf/60 hover:bg-tea-surface/40"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-tea-bg text-tea-muted"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Status & Next/Prev Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full md:w-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tea-leaf/10 border border-tea-leaf/25 text-tea-forest text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-tea-leaf" />
            <span>{totalFiltered} {t("slider.available", "Teas Available")}</span>
          </span>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-tea-muted hover:text-tea-dark transition px-2 py-1 rounded-lg border border-tea-border/60 bg-white"
            title={isPaused ? "Resume Auto-Slide" : "Pause Auto-Slide"}
          >
            {isPaused ? (
              <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />
            ) : (
              <Pause className="w-3 h-3 text-tea-muted" />
            )}
            <span className="hidden sm:inline">{isPaused ? t("slider.paused", "Paused") : t("slider.sliding", "Sliding")}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Slide"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-tea-border bg-white hover:bg-tea-bg text-tea-dark flex items-center justify-center transition shadow-xs hover:border-tea-leaf focus:outline-none"
            >
              <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Slide"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-tea-border bg-white hover:bg-tea-bg text-tea-dark flex items-center justify-center transition shadow-xs hover:border-tea-leaf focus:outline-none"
            >
              <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
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
          {filteredProducts.map((product) => {
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
            const totalSavings = pricing.totalSavings;
            const isComingSoon = Boolean(product.isComingSoon);
            const currentStock = Number(activeSize ? activeSize.stock : product.stock) || 0;
            const isOutOfStock = currentStock <= 0;

            const handleOrder = (e: React.MouseEvent) => {
              e.preventDefault();
              openWhatsAppModal({
                productId: product.id,
                variantId: activeSize?.id,
                image: product.mainImage,
                productName: getProductTitle(product) || product.name || "Ceylon Tea",
                size: activeSize?.sizeName || "Standard",
                quantity: 1,
                price: pricing.unitPrice,
                total: pricing.totalPrice,
                regularPrice: pricing.hasDiscount ? pricing.regularPrice : undefined,
                regularTotal: pricing.hasDiscount ? pricing.totalRegularPrice : undefined,
                savings: pricing.hasDiscount ? pricing.totalSavings : undefined,
                isComingSoon: isComingSoon,
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
                className="shrink-0 px-2 sm:px-2.5"
              >
                <div className="group h-full bg-white rounded-2xl sm:rounded-3xl border border-tea-border shadow-card hover:shadow-hover transition-all duration-300 flex flex-col justify-between overflow-hidden">
                  {/* Top Image Showcase with floating badges */}
                  <div className="relative aspect-square w-full bg-gradient-to-b from-tea-surface/60 via-white to-tea-bg/30 p-3 sm:p-4 flex items-center justify-center overflow-hidden border-b border-tea-border/40">
                    <Link
                      href={`/products/${product.slug || ""}`}
                      className="relative w-full h-full block"
                    >
                      <Image
                        src={product.mainImage || "/uploads/leena-tea-powder-200g.jpeg"}
                        alt={product.name || "Ceylon Tea"}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain object-center group-hover:scale-105 transition-transform duration-500 drop-shadow-md"
                      />
                    </Link>

                    {/* Left Badges: Offer & Grade */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
                      {hasDiscount && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                          <span>{discountPercent}% OFF</span>
                        </span>
                      )}
                      {product.teaGrade && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-tea-dark/85 backdrop-blur-xs text-white">
                          {product.teaGrade}
                        </span>
                      )}
                    </div>

                    {/* Right Badges: Savings Pill & Stock / Coming Soon Status */}
                    <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1 z-10 pointer-events-none">
                      {isComingSoon ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                          <Clock className="w-2.5 h-2.5" />
                          {t("product.comingSoon", "Coming Soon")}
                        </span>
                      ) : (
                        <>
                          {hasDiscount && totalSavings > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-700 text-white shadow-xs">
                              {t("slider.save", "Save Rs.")} {totalSavings}
                            </span>
                          )}
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-600 text-white">
                              {t("product.outOfStock", "Out of Stock")}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              {t("product.inStock", "In Stock")}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-tea-leaf font-semibold uppercase tracking-wider">
                        <span>{getProductType(product)}</span>
                        {product.origin && typeof product.origin === "string" && (
                          <span className="text-tea-muted font-normal normal-case">
                            {product.origin.split(",")[0]}
                          </span>
                        )}
                      </div>

                      <Link href={`/products/${product.slug || ""}`}>
                        <h3 className="font-serif font-bold text-tea-dark text-sm sm:text-base group-hover:text-tea-forest transition-colors line-clamp-1">
                          {getProductTitle(product)}
                        </h3>
                      </Link>

                      <p className="text-[11px] text-tea-muted line-clamp-2 leading-relaxed">
                        {getProductDesc(product)}
                      </p>

                      {/* Interactive Size Selector Directly on Slider */}
                      {sizes.length > 0 && (
                        <div className="pt-1.5">
                          <div className="flex items-center justify-between text-[10px] text-tea-muted mb-1 font-medium">
                            <span>{t("slider.selectPackSize", "Select Pack Size:")}</span>
                            {activeSize && (
                              <span className="text-tea-forest font-bold">
                                {activeSize.sizeName}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {sizes.map((sz, idx) => {
                              const szPricing = calculatePricing(sz.regularPrice, sz.salePrice, 1);
                              const isSelected = selectedSizeIndex === idx;
                              return (
                                <button
                                  key={sz.id || `sz-${idx}`}
                                  type="button"
                                  onClick={() =>
                                    setSelectedSizes((prev) => ({
                                      ...prev,
                                      [product.id]: idx,
                                    }))
                                  }
                                  className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium transition flex items-center gap-1 ${
                                    isSelected
                                      ? "border-tea-forest bg-tea-forest text-white shadow-xs font-bold"
                                      : "border-tea-border bg-white text-tea-dark hover:border-tea-leaf"
                                  }`}
                                >
                                  <span>{sz.sizeName}</span>
                                  <span
                                    className={`text-[9px] ${
                                      isSelected
                                        ? "text-emerald-200"
                                        : "text-tea-forest font-bold"
                                    }`}
                                  >
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
                    <div className="pt-2.5 border-t border-tea-border/60 space-y-2.5">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[11px] text-tea-muted">{t("slider.price", "Price:")}</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-serif text-lg sm:text-xl font-bold text-tea-dark">
                              Rs. {currentPrice.toLocaleString("en-US")}
                            </span>
                            {hasDiscount && (
                              <span className="text-[11px] text-tea-muted line-through">
                                Rs. {regularPrice.toLocaleString("en-US")}
                              </span>
                            )}
                          </div>
                        </div>

                        {currentPrice >= 3500 ? (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {t("slider.freeDelivery", "Free Delivery")}
                          </span>
                        ) : activeSize ? (
                          <span className="text-[11px] font-medium text-tea-forest bg-tea-surface px-2 py-0.5 rounded">
                            {activeSize.sizeName}
                          </span>
                        ) : null}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={handleOrder}
                          className={`w-full inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-white font-semibold text-xs tracking-wide transition shadow-xs hover:shadow-subtle ${
                            isComingSoon
                              ? "bg-amber-600 hover:bg-amber-700 active:scale-[0.98]"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          {isComingSoon ? (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>{t("product.preOrder", "Pre-Order")}</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3.5 h-3.5 fill-current" />
                              <span>WhatsApp</span>
                            </>
                          )}
                        </button>

                        <Link
                          href={`/products/${product.slug}`}
                          className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl border border-tea-border bg-white hover:bg-tea-bg text-tea-dark font-medium text-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-tea-leaf" />
                          <span>{t("slider.details", "Details")}</span>
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
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === idx
                  ? "w-7 bg-tea-forest"
                  : "w-2 bg-tea-border hover:bg-tea-leaf/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
