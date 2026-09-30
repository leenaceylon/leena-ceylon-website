"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Clock,
  Sparkles,
  Coffee,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Leaf,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

export interface TeaGradeItem {
  id: string;
  grade: string;
  fullName: string;
  category: string;
  tagline: string;
  elevation: string;
  strength: number; // 1 to 5
  liquorColorName: string;
  liquorColorHex: string;
  steepTime: string;
  bestServed: string;
  description: string;
  flavorNotes: string[];
  productSearchTerm: string;
}

const TEA_GRADES: TeaGradeItem[] = [
  {
    id: "bopf",
    grade: "BOPF",
    fullName: "Broken Orange Pekoe Fannings",
    category: "High Grown Orthodox",
    tagline: "The King of Ceylon Milk Tea & Breakfast Brews",
    elevation: "High Grown (4,500 - 6,200 ft)",
    strength: 5,
    liquorColorName: "Deep Ruby Crimson",
    liquorColorHex: "#8B1E0F",
    steepTime: "2.5 - 3 mins",
    bestServed: "Rich Milk Tea or Strong Black",
    description:
      "A fine, uniform broken leaf grade world-renowned for its swift brewing, deep coppery red liquor, and bracing briskness. The quintessential choice for authentic Sri Lankan morning tea.",
    flavorNotes: ["Brisk & Robust", "Malty Undertone", "Golden Crema", "High Mountain Clean Finish"],
    productSearchTerm: "BOPF",
  },
  {
    id: "fbop",
    grade: "FBOP",
    fullName: "Flowery Broken Orange Pekoe",
    category: "Low & Mid Grown Specialist",
    tagline: "Golden Tips with Exquisite Floral Sweetness",
    elevation: "Mid / Low Grown (1,500 - 3,500 ft)",
    strength: 4,
    liquorColorName: "Golden Amber",
    liquorColorHex: "#B85D19",
    steepTime: "3 - 4 mins",
    bestServed: "Straight Black or with Lemon",
    description:
      "Handcrafted semi-broken leaf generously adorned with tender silvery tips. Delivers a softer, honeyed liquor with an aromatic bouquet reminiscent of orchids and mountain dew.",
    flavorNotes: ["Honeyed Sweetness", "Soft Orchid Aroma", "Silky Amber Liquor", "Zero Bitterness"],
    productSearchTerm: "FBOP",
  },
  {
    id: "pekoe",
    grade: "PEKOE",
    fullName: "Pekoe Shotty Leaf",
    category: "Connoisseur Selection",
    tagline: "Curly Twisted Leaves with Gentle Floral Notes",
    elevation: "High Grown Uva & Dimbula",
    strength: 3,
    liquorColorName: "Bright Sunstone Gold",
    liquorColorHex: "#D9822B",
    steepTime: "4 - 5 mins",
    bestServed: "Pure Black in Fine Porcelain",
    description:
      "Curled and shotty whole leaf grade that gently unfurls during infusion. Produces a light golden-orange liquor with refreshing citrus undertones and an exceptionally mellow finish.",
    flavorNotes: ["Citrus Blossom", "Gentle Tannins", "Bright Golden Hue", "Relaxing Floral Finish"],
    productSearchTerm: "Pekoe",
  },
  {
    id: "lemon-tea",
    grade: "LEMON INFUSION",
    fullName: "Pure Ceylon Lemon Black Tea",
    category: "Natural Flavoured Black Tea",
    tagline: "Highland BOPF Infused with Zesty Sun-Dried Citrus",
    elevation: "High Grown Ceylon Estates",
    strength: 4,
    liquorColorName: "Zesty Amber Glow",
    liquorColorHex: "#C25E1A",
    steepTime: "3 mins",
    bestServed: "Hot or Chilled Iced Tea with Mint",
    description:
      "The crisp briskness of highland Ceylon black tea meets sun-ripened natural lemon peel. Uplifting, digestive, and deeply refreshing whether served steaming or over crushed ice.",
    flavorNotes: ["Natural Lemon Peel", "Zesty Briskness", "Crisp Clean Palate", "Refreshing Aftertaste"],
    productSearchTerm: "Lemon",
  },
  {
    id: "cinnamon-tea",
    grade: "ALBA CINNAMON",
    fullName: "Pure Ceylon Spiced Cinnamon Tea",
    category: "Organic Spice Infusion",
    tagline: "True Cinnamomum Verum with Highland Black Tea",
    elevation: "Southern Coast & Hill Country",
    strength: 4,
    liquorColorName: "Warm Spiced Mahogany",
    liquorColorHex: "#7A2616",
    steepTime: "3 - 4 mins",
    bestServed: "Warm Cup with Honey or Milk",
    description:
      "Made with genuine Ceylon Alba Cinnamon—the world's highest grade of true sweet cinnamon. Free from coumarin, delivering warm woody aroma and ancient Ayurvedic wellness in every sip.",
    flavorNotes: ["True Sweet Cinnamon", "Warm Woody Spice", "Smooth Velvety Body", "Natural Immunity"],
    productSearchTerm: "Cinnamon",
  },
];

export default function TeaGradesSlider() {
  const { openWhatsAppModal } = useCart();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Responsive items calculation
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth >= 1024) {
        setItemsPerPage(3);
      } else if (window.innerWidth >= 640) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const total = TEA_GRADES.length;
  const maxIndex = Math.max(0, total - itemsPerPage);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Auto sliding
  useEffect(() => {
    if (isPaused || maxIndex <= 0) return;
    const timer = setInterval(() => {
      handleNext();
    }, 4200);
    return () => clearInterval(timer);
  }, [isPaused, maxIndex, handleNext]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) handleNext();
    if (diff < -45) handlePrev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleInquireGrade = (item: TeaGradeItem) => {
    openWhatsAppModal({
      productName: `LEENA Ceylon ${item.grade} (${item.fullName})`,
      size: "250g / 500g Inquiry",
      quantity: 1,
      price: 650,
      total: 650,
    });
  };

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slider Top Bar with Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tea-leaf/10 border border-tea-leaf/25 text-tea-forest text-xs font-bold uppercase tracking-wider">
            <Leaf className="w-3.5 h-3.5 text-tea-leaf" />
            <span>Master Tea Sommelier Guide</span>
          </span>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-tea-dark mt-1">
            Explore Ceylon Leaf Grades & Aromas
          </h3>
          <p className="text-xs sm:text-sm text-tea-muted">
            Swipe or use arrows to discover the perfect Ceylon cup for your palate.
          </p>
        </div>

        {/* Prev / Next controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous grade"
            className="w-10 h-10 rounded-full border border-tea-border bg-white hover:bg-tea-bg text-tea-dark flex items-center justify-center transition shadow-xs hover:border-tea-leaf focus:outline-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next grade"
            className="w-10 h-10 rounded-full border border-tea-border bg-white hover:bg-tea-bg text-tea-dark flex items-center justify-center transition shadow-xs hover:border-tea-leaf focus:outline-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Slider Track Viewport */}
      <div className="overflow-hidden py-1">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
          }}
        >
          {TEA_GRADES.map((item) => (
            <div
              key={item.id}
              style={{ width: `${100 / itemsPerPage}%` }}
              className="shrink-0 px-2 sm:px-3"
            >
              <div className="group h-full bg-white rounded-3xl border border-tea-border shadow-card hover:shadow-hover transition-all duration-300 flex flex-col justify-between overflow-hidden">
                {/* Header Strip with Liquor Swatch & Grade Acronym */}
                <div className="p-5 sm:p-6 bg-gradient-to-br from-tea-surface/80 via-white to-tea-surface/40 border-b border-tea-border/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-tea-forest">
                        {item.category}
                      </span>
                      <h4 className="font-serif text-2xl sm:text-3xl font-extrabold text-tea-dark mt-0.5">
                        {item.grade}
                      </h4>
                      <p className="text-xs font-semibold text-tea-dark/80 line-clamp-1">
                        {item.fullName}
                      </p>
                    </div>

                    {/* Liquor Color Visual Indicator */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-2 ring-tea-border flex items-center justify-center"
                        style={{ backgroundColor: item.liquorColorHex }}
                        title={`Liquor: ${item.liquorColorName}`}
                      >
                        <Coffee className="w-4 h-4 text-white/90 drop-shadow-xs" />
                      </div>
                      <span className="text-[9px] font-bold text-tea-dark uppercase tracking-tight text-center max-w-[64px] leading-tight">
                        {item.liquorColorName}
                      </span>
                    </div>
                  </div>

                  {/* Tagline */}
                  <p className="text-xs font-serif italic text-tea-gold mt-2 line-clamp-1">
                    &ldquo;{item.tagline}&rdquo;
                  </p>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    {/* Elevation & Strength Meter */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-tea-surface/50 rounded-2xl border border-tea-border/50 text-xs">
                      <div>
                        <span className="text-[10px] text-tea-muted block uppercase font-bold tracking-wider">
                          Elevation
                        </span>
                        <span className="font-semibold text-tea-dark line-clamp-1">
                          {item.elevation}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-tea-muted block uppercase font-bold tracking-wider">
                          Briskness / Strength
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Flame
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < item.strength
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-tea-border"
                              }`}
                            />
                          ))}
                          <span className="text-[11px] font-bold text-tea-dark ml-1">
                            {item.strength}/5
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-tea-muted leading-relaxed line-clamp-3">
                      {item.description}
                    </p>

                    {/* Flavor & Aroma Profile Pills */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1.5">
                        Aroma & Character:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.flavorNotes.map((note, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-tea-border/80 text-[11px] font-medium text-tea-forest shadow-xs"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-tea-gold" />
                            <span>{note}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Brewing Recommendation */}
                    <div className="pt-2 border-t border-tea-border/50 flex items-center justify-between text-xs text-tea-dark">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-tea-leaf" />
                        <span>Steep: <strong>{item.steepTime}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="line-clamp-1">{item.bestServed}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Order via WhatsApp or Shop Grade */}
                  <div className="pt-3 border-t border-tea-border/60 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleInquireGrade(item)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wide transition shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Order on WhatsApp</span>
                    </button>

                    <Link
                      href={`/products?q=${encodeURIComponent(item.productSearchTerm)}`}
                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-tea-border bg-white hover:bg-tea-bg text-tea-dark font-medium text-xs transition"
                    >
                      <span>View Products</span>
                      <ArrowRight className="w-3 h-3 text-tea-leaf" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Dots */}
      {maxIndex > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to grade slide ${idx + 1}`}
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
