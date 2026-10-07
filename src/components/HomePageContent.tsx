"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import ProductSlider from "@/components/ProductSlider";
import HeroProductSlider from "@/components/HeroProductSlider";
import TeaGradesSlider from "@/components/TeaGradesSlider";
import TestimonialsSlider from "@/components/TestimonialsSlider";
import PromoMarquee from "@/components/PromoMarquee";
import CeylonRegionsMap from "@/components/CeylonRegionsMap";
import { useLanguage } from "@/context/LanguageContext";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Mountain,
  Leaf,
  CheckCircle2,
  MessageSquare,
  Award,
  HeartHandshake,
  Clock,
  Truck,
  Tag,
} from "lucide-react";

interface HomePageContentProps {
  products: any[];
  categories: any[];
  settings: {
    whatsappNumber?: string;
    [key: string]: any;
  };
  activePromotion?: {
    id?: string;
    code: string;
    discountType: string;
    discountValue: number;
    minOrder?: number | null;
    maxDiscount?: number | null;
  } | null;
  customerReviews?: any[];
}

export default function HomePageContent({
  products,
  categories,
  settings,
  activePromotion,
  customerReviews,
}: HomePageContentProps) {
  const { t, isRTL } = useLanguage();
  const whatsappNumber = settings.whatsappNumber || "071 777 4717";
  const cleanWhatsappNumber = whatsappNumber.replace(/\D/g, "").replace(/^0/, "94");

  const getCategoryTitle = (cat: any) => {
    if (cat.slug === "tea-powder") return t("cat.teaPowder.title", cat.name);
    if (cat.slug === "ceylon-black-tea") return t("cat.blackTea.title", cat.name);
    if (cat.slug === "premium-tin-collection") return t("cat.tinCollection.title", cat.name);
    if (cat.slug === "flavored-ceylon-tea") return t("cat.flavoredTea.title", cat.name);
    if (cat.slug === "ceylon-spices") return t("cat.spices.title", cat.name);
    return cat.name;
  };

  const getCategoryDesc = (cat: any) => {
    if (cat.slug === "tea-powder") return t("cat.teaPowder.desc", cat.description);
    if (cat.slug === "ceylon-black-tea") return t("cat.blackTea.desc", cat.description);
    if (cat.slug === "premium-tin-collection") return t("cat.tinCollection.desc", cat.description);
    if (cat.slug === "flavored-ceylon-tea") return t("cat.flavoredTea.desc", cat.description);
    if (cat.slug === "ceylon-spices") return t("cat.spices.desc", cat.description);
    return cat.description;
  };

  return (
    <div className={`pb-10 overflow-x-hidden space-y-6 sm:space-y-10 ${isRTL ? "rtl" : "ltr"}`}>
      {/* ================================================== */}
      {/* 0. PROMOTIONAL ANNOUNCEMENT TICKER MARQUEE */}
      {/* ================================================== */}
      <PromoMarquee activePromotion={activePromotion} />

      {/* ================================================== */}
      {/* 1. HERO SECTION WITH CINEMATIC CEYLON PLANTATION */}
      {/* ================================================== */}
      <section className="relative overflow-hidden min-h-[500px] lg:min-h-[580px] flex items-center pt-4 pb-10 sm:pt-6 sm:pb-14">
        {/* Full-width Photographic Tea Plantation Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/images/ceylon-hero-plantation.jpg"
            alt="Misty Ceylon Tea Plantation Highlands Nuwara Eliya Sri Lanka - LEENA CEYLON"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center transform scale-100 lg:animate-subtle-zoom"
          />

          {/* Layer 1: Left-to-right soft white/cream wash for high text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/35 lg:from-white/95 lg:via-white/70 lg:to-transparent" />

          {/* Layer 2: Subtle atmospheric vignette along bottom and edges */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/10" />

          {/* Layer 3: Subtle golden sunrise glow in the upper corner */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-amber-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Subtle Decorative Tea Leaves in Hero Corners */}
          <div className="absolute top-6 left-6 text-tea-leaf/20 pointer-events-none hidden sm:block">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </svg>
          </div>
          <div className="absolute bottom-20 right-10 text-tea-forest/15 pointer-events-none hidden lg:block transform rotate-45">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </svg>
          </div>
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Brand Story & Taglines */}
            <div className={`lg:col-span-6 space-y-4 sm:space-y-5 text-center ${isRTL ? "lg:text-right" : "lg:text-left"}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tea-leaf/10 border border-tea-leaf/25 text-tea-forest text-xs font-bold uppercase tracking-widest backdrop-blur-xs">
                <Leaf className="w-3.5 h-3.5 text-tea-leaf" />
                <span>{t("hero.badge", "100% AUTHENTIC SRI LANKAN TEA")}</span>
              </div>

              {/* Main Headings */}
              <div className="space-y-2">
                <div className={`relative h-10 sm:h-14 w-44 sm:w-56 mx-auto ${isRTL ? "lg:mr-0 lg:ml-auto" : "lg:mx-0"}`}>
                  <Image
                    src="/brand/logo.png"
                    alt="LEENA CEYLON"
                    fill
                    priority
                    className="object-contain object-center lg:object-left"
                  />
                </div>
                <h1 className="font-serif text-3xl sm:text-5xl lg:text-5xl font-bold text-tea-dark tracking-tight leading-tight">
                  <span className="block font-sans text-xs sm:text-sm font-extrabold text-tea-forest tracking-[0.25em] uppercase mb-1">
                    {t("hero.brand", "LEENA CEYLON")}
                  </span>
                  {t("hero.title", "PURE CEYLON TEA")}
                </h1>
                <p className="font-serif text-base sm:text-xl text-tea-gold font-medium tracking-[0.2em] uppercase">
                  {t("hero.tagline", "THE TASTE OF CEYLON")}
                </p>
              </div>

              {/* Descriptions */}
              <div className={`space-y-1.5 text-tea-muted max-w-xl mx-auto ${isRTL ? "lg:mr-0 lg:ml-auto" : "lg:mx-0"}`}>
                <p className="text-sm sm:text-base leading-relaxed text-tea-dark font-medium">
                  {t("hero.desc1", "Discover the authentic taste, aroma and character of Ceylon Tea from Sri Lanka.")}
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  {t("hero.desc2", "Handpicked from Sri Lanka's finest tea-growing regions and carefully selected for a rich and memorable cup.")}
                </p>
              </div>

              {/* Trust Guarantee Badges */}
              <div className={`flex flex-wrap items-center justify-center ${isRTL ? "lg:justify-end" : "lg:justify-start"} gap-2 pt-1 text-xs`}>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 border border-tea-border shadow-xs text-tea-dark font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t("hero.singleOrigin", "Single-Origin Harvest")}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 border border-tea-border shadow-xs text-tea-dark font-semibold">
                  <Truck className="w-3.5 h-3.5 text-tea-leaf" />
                  <span>{t("hero.cod", "Cash on Delivery")}</span>
                </span>
                {activePromotion ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50/90 border border-amber-300 shadow-xs text-amber-900 font-semibold">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      Coupon: {activePromotion.code} (
                      {activePromotion.discountType === "PERCENTAGE"
                        ? `${activePromotion.discountValue}% OFF`
                        : activePromotion.discountType === "FREE_SHIPPING"
                        ? "FREE DELIVERY"
                        : `Rs. ${activePromotion.discountValue} OFF`}
                      )
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 border border-tea-border shadow-xs text-tea-dark font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-tea-gold" />
                    <span>{t("hero.gardenFresh", "Highland Fresh Harvest")}</span>
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className={`flex flex-col sm:flex-row items-center justify-center ${isRTL ? "lg:justify-end" : "lg:justify-start"} gap-3 pt-1`}>
                <Link
                  href="/products"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-card hover:shadow-hover active:scale-[0.98]"
                >
                  <span>{t("hero.shopTea", "SHOP TEA")}</span>
                  <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                </Link>
                <Link
                  href="/ceylon-tea"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-tea-border/80 bg-white/90 backdrop-blur-xs text-tea-dark hover:bg-white font-semibold text-xs sm:text-sm tracking-wider uppercase transition shadow-xs"
                >
                  <span>{t("hero.exploreTea", "EXPLORE CEYLON TEA")}</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Hero Auto-Sliding Product Showcase */}
            <div className="lg:col-span-6 w-full flex items-center justify-center">
              <HeroProductSlider products={products} />
            </div>
          </div>
        </div>

        {/* Subtle Curved Transition */}
        <div className="absolute bottom-0 inset-x-0 h-8 sm:h-10 overflow-hidden pointer-events-none z-10">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full text-white fill-current">
            <path d="M0,0 C300,50 900,50 1200,0 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* ================================================== */}
      {/* 2. TRUST FEATURES */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-tea-border shadow-subtle p-4 sm:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-tea-surface flex items-center justify-center text-tea-leaf border border-tea-border/60 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-xs text-tea-dark uppercase tracking-wider">
                {t("trust.pureTea", "100% PURE CEYLON TEA")}
              </h4>
              <p className="text-[11px] text-tea-muted">
                {t("trust.pureTeaSub", "Authentic Sri Lankan Tea")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-tea-surface flex items-center justify-center text-tea-leaf border border-tea-border/60 shadow-xs">
                <Mountain className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-xs text-tea-dark uppercase tracking-wider">
                {t("trust.highGrown", "HIGH GROWN")}
              </h4>
              <p className="text-[11px] text-tea-muted">
                {t("trust.highGrownSub", "Selected from premium tea regions")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-tea-surface flex items-center justify-center text-tea-leaf border border-tea-border/60 shadow-xs">
                <Leaf className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-xs text-tea-dark uppercase tracking-wider">
                {t("trust.freshPure", "FRESH & PURE")}
              </h4>
              <p className="text-[11px] text-tea-muted">
                {t("trust.freshPureSub", "Carefully packed for freshness")}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-tea-surface flex items-center justify-center text-tea-leaf border border-tea-border/60 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-xs text-tea-dark uppercase tracking-wider">
                {t("trust.richAroma", "RICH AROMA")}
              </h4>
              <p className="text-[11px] text-tea-muted">
                {t("trust.richAromaSub", "Natural taste and character")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 3. FEATURED PRODUCTS SLIDER */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-[#F7F9F6] to-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-tea-border/80 shadow-subtle">
          <div className="text-center space-y-1 mb-4 sm:mb-5">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              {t("featured.subheading", "Curated Master Selection")}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              {t("featured.heading", "FEATURED CEYLON TEA SLIDER")}
            </h2>
            <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
            <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
              {t("featured.description", "Select your pack size, apply promo codes, and order instantly through WhatsApp.")}
            </p>
          </div>

          <ProductSlider products={products} />
        </div>
      </section>

      {/* ================================================== */}
      {/* 4. OUR TEA COLLECTION (Grid View) */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-2 text-center sm:text-left">
          <div className={`space-y-0.5 ${isRTL ? "sm:text-right" : "sm:text-left"}`}>
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              {t("collection.subheading", "Pure Ceylon Perfection")}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              {t("collection.heading", "OUR COMPLETE COLLECTION")}
            </h2>
            <p className="text-xs sm:text-sm text-tea-muted">
              {t("collection.description", "Discover the full spectrum of authentic Ceylon tea.")}
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-tea-forest hover:text-tea-dark transition group shrink-0"
          >
            <span>{t("collection.viewAll", "View All Teas")}</span>
            <ArrowRight className={`w-4 h-4 transform group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center bg-tea-bg rounded-2xl border border-tea-border">
            <p className="text-tea-muted">{t("collection.noProducts", "No products available at the moment.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ================================================== */}
      {/* 5. CEYLON TEA GRADES & AROMAS SLIDER */}
      {/* ================================================== */}
      <section className="bg-gradient-to-b from-[#FAFBF9] via-[#F3F7F4] to-[#FAFBF9] py-8 sm:py-12 border-y border-tea-border/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-1 mb-5 sm:mb-7">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              {t("grades.academy", "Tea Connoisseur Academy")}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              {t("grades.heading", "CEYLON LEAF GRADES & AROMAS")}
            </h2>
            <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
            <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
              {t("grades.description", "Learn the characteristics, liquor shades, and optimal brewing notes of authentic Ceylon grades.")}
            </p>
          </div>

          <TeaGradesSlider />
        </div>
      </section>

      {/* ================================================== */}
      {/* 6. PRODUCT CATEGORIES */}
      {/* ================================================== */}
      <section className="bg-tea-surface/90 py-8 sm:py-12 border-b border-tea-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-1 mb-5 sm:mb-7">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              {t("categories.subheading", "Curated Selections")}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              {t("categories.heading", "PRODUCT CATEGORIES")}
            </h2>
            <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
            <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
              {t("categories.description", "From orthodox black teas to refreshing infusions and luxury tin collections.")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="group p-3.5 sm:p-4 bg-white rounded-2xl border border-tea-border hover:border-tea-leaf shadow-subtle hover:shadow-card transition flex flex-col justify-between text-center"
              >
                <div>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden mb-2.5 bg-tea-surface border border-tea-border/60">
                    <Image
                      src={cat.image || "/uploads/leena-tea-powder-200g.jpeg"}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 80px, 100px"
                      className="object-cover group-hover:scale-110 transition duration-300"
                    />
                  </div>
                  <h3 className="font-serif font-bold text-xs sm:text-sm text-tea-dark uppercase group-hover:text-tea-forest transition">
                    {getCategoryTitle(cat)}
                  </h3>
                  {cat.description && (
                    <p className="text-[11px] text-tea-muted line-clamp-2 mt-1 leading-snug">
                      {getCategoryDesc(cat)}
                    </p>
                  )}
                </div>

                <div className="pt-2.5 mt-2 border-t border-tea-border/40">
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-tea-forest hover:text-tea-dark uppercase tracking-wider transition"
                  >
                    <span>{t("categories.explore", "Explore")}</span>
                    <ArrowRight className={`w-3 h-3 ${isRTL ? "rotate-180" : ""}`} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 7. CEYLON TEA STORY */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAFBF9] rounded-2xl sm:rounded-3xl border border-tea-border/80 shadow-subtle p-5 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            {/* Image Column */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-card border-2 border-white">
                <Image
                  src="/uploads/1790331419153_tea-splash.jpg"
                  alt="Sri Lankan Tea Highlands - LEENA CEYLON"
                  fill
                  sizes="(max-width: 1024px) 100vw, 500px"
                  className="object-cover object-center"
                />
              </div>
            </div>

            {/* Narrative Column */}
            <div className={`lg:col-span-6 space-y-3 sm:space-y-4 text-center ${isRTL ? "lg:text-right" : "lg:text-left"}`}>
              <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
                {t("story.heritage", "The Heritage of Ceylon")}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark leading-tight">
                {t("story.heading", "FROM THE HIGHLANDS OF SRI LANKA")}
              </h2>
              <p className="text-xs sm:text-sm text-tea-dark leading-relaxed font-medium">
                {t("story.p1", "From misty highlands to lush green tea gardens, Sri Lanka is known around the world for its distinctive Ceylon Tea. LEENA CEYLON brings together quality tea and the authentic taste of Sri Lanka.")}
              </p>
              <p className="text-xs text-tea-muted leading-relaxed">
                {t("story.p2", "Blessed with pristine mountain air, abundant monsoon rains, and nutrient-rich soil, our tea estates cultivate leaves packed with natural polyphenols, crisp liquor, and enchanting natural aroma.")}
              </p>

              <div className="pt-1">
                <Link
                  href="/ceylon-tea"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
                >
                  <span>{t("story.exploreBtn", "EXPLORE CEYLON TEA")}</span>
                  <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 8. TEA-GROWING REGIONS & INTERACTIVE SRI LANKA MAP */}
      {/* ================================================== */}
      <section className="bg-[#F2F6F3] py-8 sm:py-12 border-y border-tea-border/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-1 mb-5 sm:mb-7">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              {t("regions.subheading", "The Terroir of Ceylon")}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              {t("regions.heading", "EXPLORE CEYLON TEA REGIONS")}
            </h2>
            <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
            <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
              {t("regions.description", "Discover the 7 distinct agro-climatic regions of Sri Lanka, each crafting a unique cup character.")}
            </p>
          </div>

          {/* Interactive Sri Lanka Geographic Map Component with 7 Terroirs */}
          <CeylonRegionsMap whatsappNumber={whatsappNumber} />
        </div>
      </section>

      {/* ================================================== */}
      {/* 9. WHY LEENA CEYLON (Our Four Pillars) */}
      {/* ================================================== */}
      <section className="bg-white py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-1 mb-6 sm:mb-8">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              {t("why.subheading", "Our Promise")}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              {t("why.heading", "WHY LEENA CEYLON?")}
            </h2>
            <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
            <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
              {t("why.description", "Built on uncompromising standards of authenticity, purity, and Sri Lankan craftsmanship.")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Point 1 */}
            <div className="bg-white p-5 rounded-2xl border border-tea-border shadow-subtle hover:shadow-card transition text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-xs sm:text-sm text-tea-dark">
                {t("why.p1Title", "AUTHENTIC CEYLON TEA")}
              </h3>
              <p className="text-[11px] text-tea-muted leading-relaxed">
                {t("why.p1Desc", "100% pure unblended single-origin Sri Lankan harvest.")}
              </p>
            </div>

            {/* Point 2 */}
            <div className="bg-white p-5 rounded-2xl border border-tea-border shadow-subtle hover:shadow-card transition text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-xs sm:text-sm text-tea-dark">
                {t("why.p2Title", "ESTATE QUALITY")}
              </h3>
              <p className="text-[11px] text-tea-muted leading-relaxed">
                {t("why.p2Desc", "Hand-selected batches for consistent flavor and briskness.")}
              </p>
            </div>

            {/* Point 3 */}
            <div className="bg-white p-5 rounded-2xl border border-tea-border shadow-subtle hover:shadow-card transition text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-xs sm:text-sm text-tea-dark">
                {t("why.p3Title", "ORIGIN FRESHNESS")}
              </h3>
              <p className="text-[11px] text-tea-muted leading-relaxed">
                {t("why.p3Desc", "Airtight packaging preserves mountain aroma from garden to cup.")}
              </p>
            </div>

            {/* Point 4 */}
            <div className="bg-white p-5 rounded-2xl border border-tea-border shadow-subtle hover:shadow-card transition text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-xs sm:text-sm text-tea-dark">
                {t("why.p4Title", "TRUST & CONVENIENCE")}
              </h3>
              <p className="text-[11px] text-tea-muted leading-relaxed">
                {t("why.p4Desc", "Direct WhatsApp ordering with islandwide delivery & COD.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 10. CUSTOMER TESTIMONIALS SLIDER */}
      {/* ================================================== */}
      <section className="bg-gradient-to-b from-[#F7F9F6] via-white to-[#F7F9F6] py-8 sm:py-12 border-y border-tea-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-1 mb-5 sm:mb-7">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              {t("testimonials.subheading", "Voices of Ceylon Tea Lovers")}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              {t("testimonials.heading", "WHAT OUR CUSTOMERS SAY")}
            </h2>
            <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
            <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
              {t("testimonials.description", "5-Star reviews from delighted customers across Sri Lanka and worldwide.")}
            </p>
          </div>

          <TestimonialsSlider customerReviews={customerReviews} />
        </div>
      </section>

      {/* ================================================== */}
      {/* 11. PROMOTIONAL BANNER WITH PROMO CODE */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-tea-dark via-tea-forest to-tea-dark text-white p-6 sm:p-10 shadow-hover">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,169,81,0.22),transparent_55%)]" />
          <div className={`relative z-10 max-w-2xl space-y-3 text-center ${isRTL ? "sm:text-right" : "sm:text-left"}`}>
            {activePromotion ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-tea-gold/20 text-tea-gold text-xs font-bold uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5" />
                <span>Special Online Offer: Use Code '{activePromotion.code}'</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>100% Pure Ceylon Single-Origin Harvest</span>
              </div>
            )}
            <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
              {t("promo.heading", "BRING THE TASTE OF CEYLON HOME")}
            </h2>
            <p className="text-xs sm:text-sm text-tea-pale/85 leading-relaxed">
              {activePromotion
                ? `Explore our full collection of authentic Sri Lankan tea. Enjoy ${
                    activePromotion.discountType === "PERCENTAGE"
                      ? `${activePromotion.discountValue}% OFF`
                      : activePromotion.discountType === "FREE_SHIPPING"
                      ? "Free Islandwide Delivery"
                      : `Rs. ${activePromotion.discountValue} OFF`
                  } and free islandwide delivery on orders over Rs. 3,500.`
                : "Explore our full collection of authentic Sri Lankan tea. Fresh highland harvest packed at source with free islandwide delivery on orders over Rs. 3,500."}
            </p>
            <div className={`pt-1 flex flex-col sm:flex-row items-center gap-2.5 ${isRTL ? "sm:justify-end" : ""}`}>
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-white text-tea-dark hover:bg-tea-bg font-bold text-xs uppercase tracking-wider transition shadow-sm"
              >
                <span>{t("promo.shopBtn", "SHOP TEA NOW")}</span>
                <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
              </Link>
              <a
                href={`https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(
                  activePromotion
                    ? `Hello LEENA CEYLON,\n\nI would like to order Ceylon tea using promo code ${activePromotion.code}.`
                    : "Hello LEENA CEYLON,\n\nI would like to order Ceylon tea."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>{t("promo.whatsappBtn", "WhatsApp Instant Order")}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 12. ABOUT LEENA CEYLON */}
      {/* ================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2.5">
        <div className="relative h-10 sm:h-12 w-40 sm:w-48 mx-auto">
          <Image
            src="/brand/logo.png"
            alt="LEENA CEYLON"
            fill
            className="object-contain"
          />
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-tea-dark uppercase tracking-wide">
          {t("about.heading", "ABOUT LEENA CEYLON")}
        </h2>
        <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
        <p className="text-xs sm:text-sm text-tea-muted max-w-2xl mx-auto leading-relaxed">
          {t("about.description", "LEENA CEYLON is an authentic Sri Lankan tea brand dedicated to bringing single-origin pure Ceylon Tea from lush island estates directly to customers across Sri Lanka and worldwide.")}
        </p>
        <div className="pt-1">
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl border border-tea-border text-tea-dark hover:text-tea-forest hover:bg-tea-bg font-semibold text-xs uppercase tracking-wider transition"
          >
            <span>{t("about.storyBtn", "LEARN OUR STORY")}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
          </Link>
        </div>
      </section>

      {/* ================================================== */}
      {/* 13. WHATSAPP ORDER CTA */}
      {/* ================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-subtle">
          <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-tea-dark">
            {t("cta.heading", "ORDER DIRECTLY VIA WHATSAPP")}
          </h2>
          <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto leading-relaxed">
            {t("cta.description", "Quick, personalized service directly from Sri Lanka. Select any tea, order your custom quantity, or ask for direct bank transfer details.")}
          </p>
          <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <a
              href={`https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(
                "Hello LEENA CEYLON,\n\nI am visiting your website and would like to inquire about ordering your authentic Ceylon teas."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-card hover:shadow-hover"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>{t("cta.chatBtn", "Chat & Order on WhatsApp")} ({whatsappNumber})</span>
            </a>
            <Link
              href="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-emerald-300 text-emerald-900 hover:bg-emerald-100/60 font-semibold text-xs uppercase tracking-wider transition"
            >
              <span>{t("cta.browseBtn", "Browse Catalog")}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
