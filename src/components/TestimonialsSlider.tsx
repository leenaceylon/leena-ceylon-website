"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote, CheckCircle2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";

export interface Testimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  product: string;
  comment: string;
  date: string;
  productSlug?: string;
  isLiveReview?: boolean;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: "def-1",
    name: "Dr. K. Senanayake",
    city: "Colombo 07, Sri Lanka",
    rating: 5,
    product: "LEENA Ceylon BOPF Premium Tin (250g)",
    comment:
      "The aroma when opening the tin is extraordinary. Truly 100% unblended pure Ceylon tea. Brews a deep golden liquor with crisp briskness. Our family enjoys it every morning!",
    date: "Verified Buyer",
  },
  {
    id: "def-2",
    name: "Niluka Fernando",
    city: "Kandy, Sri Lanka",
    rating: 5,
    product: "LEENA CEYLON Lemon Tea (500g)",
    comment:
      "Ordered directly through WhatsApp. The customer service was prompt, and the tea arrived in Kandy within 24 hours. The natural lemon infusion is so refreshing, hot or iced.",
    date: "Verified Buyer",
  },
  {
    id: "def-3",
    name: "Chaminda Kulasekara",
    city: "Kurunegala, Sri Lanka",
    rating: 5,
    product: "LEENA Pure Tea Powder (500g)",
    comment:
      "Ordered directly online with a discount promo code and got free islandwide delivery. The tea powder makes the strongest, most authentic Sri Lankan milk tea I have tasted in years. Excellent value.",
    date: "Verified Buyer",
  },
  {
    id: "def-4",
    name: "Sarah Jenkins",
    city: "Melbourne, Australia",
    rating: 5,
    product: "Pure Ceylon Organic Cinnamon & BOPF",
    comment:
      "Authentic Ceylon tea straight from the source. The quality is far superior to supermarket brands. Will definitely be reordering for my friends and family.",
    date: "International Customer",
  },
  {
    id: "def-5",
    name: "Priyantha Ranasinghe",
    city: "Galle, Sri Lanka",
    rating: 5,
    product: "LEENA CEYLON BOPF (500g)",
    comment:
      "Cash on Delivery made ordering so convenient. The package arrived in sturdy, airtight packaging. High mountain aroma with natural sweetness. Highly recommended!",
    date: "Verified Buyer",
  },
];

interface TestimonialsSliderProps {
  customerReviews?: Array<{
    id: string;
    customerName: string;
    rating: number;
    comment: string;
    createdAt?: Date | string;
    product?: {
      name: string;
      slug?: string;
    };
  }>;
}

export default function TestimonialsSlider({ customerReviews }: TestimonialsSliderProps) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Convert live approved customer reviews into Testimonial items
  const dynamicReviews: Testimonial[] = (customerReviews || []).map((r, i) => ({
    id: r.id || `live-${i}`,
    name: r.customerName || "Customer",
    city: "Verified Ceylon Tea Lover",
    rating: Math.min(5, Math.max(1, r.rating || 5)),
    product: r.product?.name || "Pure Ceylon Tea",
    productSlug: r.product?.slug,
    comment: r.comment,
    date: "Verified Buyer",
    isLiveReview: true,
  }));

  // Combine live reviews first, then fallback testimonials
  const allTestimonials: Testimonial[] =
    dynamicReviews.length > 0
      ? [...dynamicReviews, ...DEFAULT_TESTIMONIALS.slice(0, Math.max(2, 5 - dynamicReviews.length))]
      : DEFAULT_TESTIMONIALS;

  const total = allTestimonials.length;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, handleNext, total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) handleNext();
    if (diff < -40) handlePrev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const current = allTestimonials[currentIndex] || DEFAULT_TESTIMONIALS[0];

  return (
    <div
      className="relative max-w-4xl mx-auto px-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative bg-gradient-to-br from-white via-tea-surface/40 to-white rounded-3xl p-6 sm:p-10 border border-tea-border shadow-card overflow-hidden">
        {/* Decorative Quote Icon Background */}
        <Quote className="absolute top-4 right-6 w-20 h-20 text-tea-leaf/10 rotate-180 pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Star Rating & Verified Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < current.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-200"
                  }`}
                />
              ))}
              <span className="ml-2 text-xs font-bold text-tea-dark">
                {current.rating.toFixed(1)} / 5.0
              </span>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t("testimonials.verified", current.date)}</span>
            </span>
          </div>

          {/* Testimonial Quote */}
          <p className="font-serif text-base sm:text-xl text-tea-dark leading-relaxed italic">
            &ldquo;
            {current.isLiveReview
              ? current.comment
              : t(`testimonial.${current.id}.comment`, current.comment)}
            &rdquo;
          </p>

          {/* Author Details & Ordered Product */}
          <div className="pt-4 border-t border-tea-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm sm:text-base text-tea-dark">{current.name}</h4>
              <p className="text-xs text-tea-muted">
                {current.isLiveReview
                  ? current.city
                  : t(`testimonial.${current.id}.city`, current.city)}
              </p>
            </div>
            <div className="self-start sm:self-auto text-left sm:text-right">
              <span className="text-[11px] text-tea-muted block">
                {t("testimonials.purchased", "Purchased:")}
              </span>
              {current.productSlug ? (
                <Link
                  href={`/products/${current.productSlug}`}
                  className="text-xs font-semibold text-tea-forest hover:text-tea-dark hover:underline inline-flex items-center gap-1 group transition"
                >
                  <span>{current.product}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition shrink-0" />
                </Link>
              ) : (
                <span className="text-xs font-semibold text-tea-forest">{current.product}</span>
              )}
            </div>
          </div>
        </div>

        {/* Carousel Bottom Controls */}
        <div className="flex items-center justify-between pt-6 mt-4 border-t border-tea-border/40">
          {/* Indicators */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {allTestimonials.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? "w-8 bg-tea-forest" : "w-2 bg-tea-border hover:bg-tea-leaf/40"
                }`}
              />
            ))}
          </div>

          {/* Next / Prev Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous testimonial"
              className="w-9 h-9 rounded-full border border-tea-border bg-white hover:bg-tea-bg text-tea-dark flex items-center justify-center transition shadow-xs hover:border-tea-leaf"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next testimonial"
              className="w-9 h-9 rounded-full border border-tea-border bg-white hover:bg-tea-bg text-tea-dark flex items-center justify-center transition shadow-xs hover:border-tea-leaf"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
