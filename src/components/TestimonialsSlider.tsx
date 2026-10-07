"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote, CheckCircle2, ArrowRight, MessageSquare } from "lucide-react";
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
}

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
  const { t, isRTL, lang } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // ONLY real customer reviews from the database. Zero mock/fake data.
  const realReviews: Testimonial[] = (customerReviews || []).map((r, i) => ({
    id: r.id || `review-${i}`,
    name: r.customerName || "Customer",
    city: t("testimonials.verifiedBuyer", "Verified Ceylon Tea Buyer"),
    rating: Math.min(5, Math.max(1, r.rating || 5)),
    product: r.product?.name || "Pure Ceylon Tea",
    productSlug: r.product?.slug,
    comment: r.comment,
    date: r.createdAt
      ? new Date(r.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : t("testimonials.verified", "Verified Buyer"),
  }));

  const total = realReviews.length;

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, handleNext, total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || total <= 1) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) handleNext();
    if (diff < -40) handlePrev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // If there are no real customer reviews approved yet, show authentic invitation
  if (total === 0) {
    return (
      <div className="max-w-md mx-auto text-center p-8 bg-white/90 rounded-3xl border border-tea-border shadow-subtle space-y-3.5">
        <div className="w-12 h-12 rounded-2xl bg-tea-surface border border-tea-border flex items-center justify-center mx-auto text-tea-forest">
          <Quote className="w-5 h-5 rotate-180" />
        </div>
        <h3 className="font-serif font-bold text-base text-tea-dark">
          {t("testimonials.noReviewsTitle", "No Customer Reviews Yet")}
        </h3>
        <p className="text-xs text-tea-muted leading-relaxed">
          {t(
            "testimonials.noReviewsDesc",
            "Authentic customer opinions will appear here as soon as product reviews are submitted and approved. Be the first to share your experience!"
          )}
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm mt-1"
        >
          <span>{t("testimonials.browseAndReview", "Browse Teas & Review")}</span>
          <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
        </Link>
      </div>
    );
  }

  const current = realReviews[currentIndex] || realReviews[0];

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
              <span className="ms-2 text-xs font-bold text-tea-dark">
                {current.rating.toFixed(1)} / 5.0
              </span>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{current.date ? `${current.date} · ` : ""}{t("testimonials.verified", "Verified Buyer")}</span>
            </span>
          </div>

          {/* Real Customer Review Quote */}
          <p className="font-serif text-base sm:text-xl text-tea-dark leading-relaxed italic">
            &ldquo;{current.comment}&rdquo;
          </p>

          {/* Author Details & Ordered Product */}
          <div className="pt-4 border-t border-tea-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm sm:text-base text-tea-dark">{current.name}</h4>
              <p className="text-xs text-tea-muted">{current.city}</p>
            </div>
            <div className={`self-start sm:self-auto ${isRTL ? "text-right sm:text-left" : "text-left sm:text-right"}`}>
              <span className="text-[11px] text-tea-muted block">
                {t("testimonials.purchased", "Purchased:")}
              </span>
              {current.productSlug ? (
                <Link
                  href={`/products/${current.productSlug}`}
                  className="text-xs font-semibold text-tea-forest hover:text-tea-dark hover:underline inline-flex items-center gap-1 group transition"
                >
                  <span>{current.product}</span>
                  <ArrowRight className={`w-3 h-3 group-hover:translate-x-0.5 transition shrink-0 ${isRTL ? "rotate-180" : ""}`} />
                </Link>
              ) : (
                <span className="text-xs font-semibold text-tea-forest">{current.product}</span>
              )}
            </div>
          </div>
        </div>

        {/* Carousel Bottom Controls (only if more than 1 review) */}
        {total > 1 && (
          <div className="flex items-center justify-between pt-6 mt-4 border-t border-tea-border/40">
            {/* Indicators */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {realReviews.map((_, idx) => (
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
                onClick={isRTL ? handleNext : handlePrev}
                aria-label="Previous review"
                className="w-9 h-9 rounded-full border border-tea-border bg-white hover:bg-tea-bg text-tea-dark flex items-center justify-center transition shadow-xs hover:border-tea-leaf"
              >
                <ChevronLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
              </button>
              <button
                type="button"
                onClick={isRTL ? handlePrev : handleNext}
                aria-label="Next review"
                className="w-9 h-9 rounded-full border border-tea-border bg-white hover:bg-tea-bg text-tea-dark flex items-center justify-center transition shadow-xs hover:border-tea-leaf"
              >
                <ChevronRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
