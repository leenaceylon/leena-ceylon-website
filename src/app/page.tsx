import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { FALLBACK_PRODUCTS, FALLBACK_CATEGORIES } from "@/lib/fallback-data";
import ProductCard from "@/components/ProductCard";
import ProductSlider from "@/components/ProductSlider";
import HeroProductSlider from "@/components/HeroProductSlider";
import TeaGradesSlider from "@/components/TeaGradesSlider";
import TestimonialsSlider from "@/components/TestimonialsSlider";
import PromoMarquee from "@/components/PromoMarquee";
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
  Compass,
  Truck,
  Tag,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Dynamic server rendering to always reflect live database updates

import { SEO_KEYWORDS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "LEENA CEYLON | Pure Ceylon Tea Sri Lanka - The Taste of Ceylon",
  description:
    "Official LEENA CEYLON website. Discover 100% Pure Ceylon Tea from Sri Lanka. Handpicked single-origin black tea, BOPF, and flavoured teas. Order online or via WhatsApp.",
  keywords: SEO_KEYWORDS,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LEENA CEYLON | Pure Ceylon Tea Sri Lanka - The Taste of Ceylon",
    description:
      "Official LEENA CEYLON website. Authentic Sri Lankan single-origin Ceylon tea directly from misty mountain estates.",
    url: "/",
    siteName: "LEENA CEYLON",
    images: [
      {
        url: "/images/ceylon-hero-plantation.jpg",
        width: 1200,
        height: 630,
        alt: "LEENA CEYLON - Pure Ceylon Tea Plantation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LEENA CEYLON | Pure Ceylon Tea Sri Lanka",
    description: "Official LEENA CEYLON store. 100% authentic Ceylon tea.",
    images: ["/images/ceylon-hero-plantation.jpg"],
  },
};

export default async function HomePage() {
  const settings = await getSiteSettings();

  // Fetch products & categories safely with fallback
  let allAvailableProducts: any[] = [];
  let categories: any[] = [];

  try {
    allAvailableProducts = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        sizes: {
          where: { isActive: true },
          orderBy: { regularPrice: "asc" },
        },
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
    });

    categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.warn("Could not load products from database, using resilient fallback data:", error);
    allAvailableProducts = FALLBACK_PRODUCTS as any;
    categories = FALLBACK_CATEGORIES as any;
  }

  if (!allAvailableProducts || allAvailableProducts.length === 0) {
    allAvailableProducts = FALLBACK_PRODUCTS as any;
  }
  if (!categories || categories.length === 0) {
    categories = FALLBACK_CATEGORIES as any;
  }

  // Include ALL available products in the slider so all 4 products are displayed
  const carouselProducts = allAvailableProducts;

  // 7 Iconic Ceylon Tea Regions
  const ceylonRegions = [
    {
      name: "NUWARA ELIYA",
      elevation: "High Grown (6,000+ ft)",
      profile: "Delicate & floral with golden liquor, celebrated as the Champagne of Ceylon Teas.",
    },
    {
      name: "UDA PUSSELLAWA",
      elevation: "High Grown (5,000–6,000 ft)",
      profile: "Exquisite pinkish hue in the cup with refreshing tangy notes and subtle briskness.",
    },
    {
      name: "DIMBULA",
      elevation: "High Grown (3,500–5,000 ft)",
      profile: "Crisp, aromatic with rich golden-orange liquor and a clean, refreshing finish.",
    },
    {
      name: "UVA",
      elevation: "High / Mid Grown (3,000–5,000 ft)",
      profile: "World-famous for its exotic menthol aroma, distinctive pungency, and sweet character.",
    },
    {
      name: "KANDY",
      elevation: "Mid Grown (2,000–4,000 ft)",
      profile: "Full-bodied, brisk, and robust, delivering deep copper tones ideal with milk.",
    },
    {
      name: "RUHUNA",
      elevation: "Low Grown (0–2,000 ft)",
      profile: "Rich, malty, thick liquor with deep black leaf appearance and sweet caramel tone.",
    },
    {
      name: "SABARAGAMUWA",
      elevation: "Low Grown (0–2,500 ft)",
      profile: "Fast-growing lush bushes producing a deep yellow-brown liquor with sweet malt nuances.",
    },
  ];

  // FAQ Schema for Google Rich Results
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What makes LEENA Ceylon Tea authentic and pure?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "LEENA CEYLON sources unblended 100% Pure Ceylon Tea directly from recognized high, medium, and low grown tea estates of Sri Lanka. Every batch is harvested from single-origin plantations and packed fresh under strict Ceylon tea quality standards.",
        },
      },
      {
        "@type": "Question",
        name: "How can I order LEENA Ceylon Tea via WhatsApp?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can click the 'Order via WhatsApp' button on any product or contact our official hotline at 071 777 4717 (+94 71 777 4717) for fast assistance, customized pack sizes, and direct bank transfer details.",
        },
      },
      {
        "@type": "Question",
        name: "What types of Ceylon Tea does LEENA provide?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "LEENA offers traditional high-grown black teas (such as BOPF, Pekoe, and OP), fragrant green teas, premium flavoured teas, and curated gift collections.",
        },
      },
      {
        "@type": "Question",
        name: "Do you deliver islandwide across Sri Lanka?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, LEENA CEYLON delivers islandwide across Sri Lanka with Cash on Delivery (COD) and direct bank transfer options. Free delivery is available on qualifying orders over Rs. 3,500.",
        },
      },
    ],
  };

  return (
    <div className="pb-10 overflow-x-hidden space-y-6 sm:space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ================================================== */}
      {/* 0. PROMOTIONAL ANNOUNCEMENT TICKER MARQUEE */}
      {/* ================================================== */}
      <PromoMarquee />

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

          {/* Layer 1: Left-to-right soft white/cream wash for high text contrast without obscuring the plantation */}
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
            <div className="lg:col-span-6 space-y-4 sm:space-y-5 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tea-leaf/10 border border-tea-leaf/25 text-tea-forest text-xs font-bold uppercase tracking-widest backdrop-blur-xs">
                <Leaf className="w-3.5 h-3.5 text-tea-leaf" />
                <span>100% AUTHENTIC SRI LANKAN TEA</span>
              </div>

              {/* Main Headings */}
              <div className="space-y-2">
                <div className="relative h-10 sm:h-14 w-44 sm:w-56 mx-auto lg:mx-0">
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
                    LEENA CEYLON
                  </span>
                  PURE CEYLON TEA
                </h1>
                <p className="font-serif text-base sm:text-xl text-tea-gold font-medium tracking-[0.2em] uppercase">
                  THE TASTE OF CEYLON
                </p>
              </div>

              {/* Descriptions */}
              <div className="space-y-1.5 text-tea-muted max-w-xl mx-auto lg:mx-0">
                <p className="text-sm sm:text-base leading-relaxed text-tea-dark font-medium">
                  Discover the authentic taste, aroma and character of Ceylon Tea from Sri Lanka.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Handpicked from Sri Lanka&apos;s finest tea-growing regions and carefully selected for a rich and memorable cup.
                </p>
              </div>

              {/* Trust Guarantee Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 border border-tea-border shadow-xs text-tea-dark font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Single-Origin Harvest</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 border border-tea-border shadow-xs text-tea-dark font-semibold">
                  <Truck className="w-3.5 h-3.5 text-tea-leaf" />
                  <span>Cash on Delivery</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 border border-tea-border shadow-xs text-tea-dark font-semibold">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Coupon: LEENA10</span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
                <Link
                  href="/products"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-card hover:shadow-hover active:scale-[0.98]"
                >
                  <span>SHOP TEA</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/ceylon-tea"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-tea-border/80 bg-white/90 backdrop-blur-xs text-tea-dark hover:bg-white font-semibold text-xs sm:text-sm tracking-wider uppercase transition shadow-xs"
                >
                  <span>EXPLORE CEYLON TEA</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Hero Auto-Sliding Product Showcase */}
            <div className="lg:col-span-6 w-full flex items-center justify-center">
              <HeroProductSlider products={allAvailableProducts as any} />
            </div>
          </div>
        </div>

        {/* Elegant Subtle Curved Scroll Transition to Section Below */}
        <div className="absolute bottom-0 inset-x-0 h-8 sm:h-10 overflow-hidden pointer-events-none z-10">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full text-white fill-current">
            <path d="M0,0 C300,50 900,50 1200,0 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* ================================================== */}
      {/* 2. TRUST FEATURES (Clean Overlap) */}
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
                100% PURE CEYLON TEA
              </h4>
              <p className="text-[11px] text-tea-muted">
                Authentic Sri Lankan Tea
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-tea-surface flex items-center justify-center text-tea-leaf border border-tea-border/60 shadow-xs">
                <Mountain className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-xs text-tea-dark uppercase tracking-wider">
                HIGH GROWN
              </h4>
              <p className="text-[11px] text-tea-muted">
                Selected from premium tea regions
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-tea-surface flex items-center justify-center text-tea-leaf border border-tea-border/60 shadow-xs">
                <Leaf className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-xs text-tea-dark uppercase tracking-wider">
                FRESH & PURE
              </h4>
              <p className="text-[11px] text-tea-muted">
                Carefully packed for freshness
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-tea-surface flex items-center justify-center text-tea-leaf border border-tea-border/60 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-xs text-tea-dark uppercase tracking-wider">
                RICH AROMA
              </h4>
              <p className="text-[11px] text-tea-muted">
                Natural taste and character
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 3. FEATURED PRODUCTS SLIDER (All 4 Products in Slider) */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-[#F7F9F6] to-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-tea-border/80 shadow-subtle">
          <div className="text-center space-y-1 mb-4 sm:mb-5">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              Curated Master Selection
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              FEATURED CEYLON TEA SLIDER
            </h2>
            <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
            <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
              Select your pack size, apply promo codes, and order instantly through WhatsApp.
            </p>
          </div>

          <ProductSlider products={carouselProducts as any} />
        </div>
      </section>

      {/* ================================================== */}
      {/* 4. OUR TEA COLLECTION (Grid View with all products) */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-2 text-center sm:text-left">
          <div className="space-y-0.5">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              Pure Ceylon Perfection
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              OUR COMPLETE COLLECTION
            </h2>
            <p className="text-xs sm:text-sm text-tea-muted">
              Discover the full spectrum of authentic Ceylon tea.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-tea-forest hover:text-tea-dark transition group shrink-0"
          >
            <span>View All Teas</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {allAvailableProducts.length === 0 ? (
          <div className="p-8 text-center bg-tea-bg rounded-2xl border border-tea-border">
            <p className="text-tea-muted">No products available at the moment.</p>
          </div>
        ) : (
          /* Desktop: 4 products/row, Tablet: 2-3 products/row, Mobile: 2 products/row */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {allAvailableProducts.map((p) => (
              <ProductCard key={p.id} product={p as any} />
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
              Tea Connoisseur Academy
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              CEYLON LEAF GRADES & AROMAS
            </h2>
            <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
            <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
              Learn the characteristics, liquor shades, and optimal brewing notes of authentic Ceylon grades.
            </p>
          </div>

          <TeaGradesSlider />
        </div>
      </section>

      {/* ================================================== */}
      {/* 6. PRODUCT CATEGORIES (Light Cream Surface) */}
      {/* ================================================== */}
      <section className="bg-tea-surface/90 py-8 sm:py-12 border-b border-tea-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-1 mb-5 sm:mb-7">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              Curated Selections
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              PRODUCT CATEGORIES
            </h2>
            <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
            <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
              From orthodox black teas to refreshing infusions and luxury tin collections.
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
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-[11px] text-tea-muted line-clamp-2 mt-1 leading-snug">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="pt-2.5 mt-2 border-t border-tea-border/40">
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-tea-forest hover:text-tea-dark uppercase tracking-wider transition"
                  >
                    <span>Explore</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 7. CEYLON TEA STORY (Warm White/Cream Atmosphere) */}
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
            <div className="lg:col-span-6 space-y-3 sm:space-y-4 text-center lg:text-left">
              <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
                The Heritage of Ceylon
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark leading-tight">
                FROM THE HIGHLANDS OF SRI LANKA
              </h2>
              <p className="text-xs sm:text-sm text-tea-dark leading-relaxed font-medium">
                From misty highlands to lush green tea gardens, Sri Lanka is known around the world for its distinctive Ceylon Tea. LEENA CEYLON brings together quality tea and the authentic taste of Sri Lanka.
              </p>
              <p className="text-xs text-tea-muted leading-relaxed">
                Blessed with pristine mountain air, abundant monsoon rains, and nutrient-rich soil, our tea estates cultivate leaves packed with natural polyphenols, crisp liquor, and enchanting natural aroma.
              </p>

              <div className="pt-1">
                <Link
                  href="/ceylon-tea"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
                >
                  <span>EXPLORE CEYLON TEA</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 8. TEA-GROWING REGIONS (The 7 Terroirs) */}
      {/* ================================================== */}
      <section className="bg-[#F2F6F3] py-8 sm:py-12 border-y border-tea-border/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-1 mb-5 sm:mb-7">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              The Terroir of Ceylon
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              EXPLORE CEYLON TEA REGIONS
            </h2>
            <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
            <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
              Discover the 7 distinct agro-climatic regions of Sri Lanka, each crafting a unique cup character.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {ceylonRegions.map((reg) => (
              <div
                key={reg.name}
                className="p-4 bg-white rounded-2xl border border-tea-border hover:border-tea-leaf shadow-subtle hover:shadow-card transition flex flex-col justify-between space-y-1.5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-sm text-tea-dark">
                      {reg.name}
                    </h3>
                    <Compass className="w-4 h-4 text-tea-leaf" />
                  </div>
                  <span className="inline-block text-[10px] font-semibold text-tea-leaf bg-tea-surface px-2 py-0.5 rounded mt-0.5">
                    {reg.elevation}
                  </span>
                  <p className="text-xs text-tea-muted mt-2 leading-relaxed">
                    {reg.profile}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 9. WHY LEENA CEYLON (Our Four Pillars) */}
      {/* ================================================== */}
      <section className="bg-white py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-1 mb-6 sm:mb-8">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              Our Promise
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              WHY LEENA CEYLON?
            </h2>
            <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
            <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
              Built on uncompromising standards of authenticity, purity, and Sri Lankan craftsmanship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Point 1 */}
            <div className="bg-white p-5 rounded-2xl border border-tea-border shadow-subtle hover:shadow-card transition text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-xs sm:text-sm text-tea-dark">
                AUTHENTIC CEYLON TEA
              </h3>
              <p className="text-[11px] text-tea-muted leading-relaxed">
                100% pure unblended single-origin Sri Lankan harvest.
              </p>
            </div>

            {/* Point 2 */}
            <div className="bg-white p-5 rounded-2xl border border-tea-border shadow-subtle hover:shadow-card transition text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-xs sm:text-sm text-tea-dark">
                ESTATE QUALITY
              </h3>
              <p className="text-[11px] text-tea-muted leading-relaxed">
                Hand-selected batches for consistent flavor and briskness.
              </p>
            </div>

            {/* Point 3 */}
            <div className="bg-white p-5 rounded-2xl border border-tea-border shadow-subtle hover:shadow-card transition text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-xs sm:text-sm text-tea-dark">
                ORIGIN FRESHNESS
              </h3>
              <p className="text-[11px] text-tea-muted leading-relaxed">
                Airtight packaging preserves mountain aroma from garden to cup.
              </p>
            </div>

            {/* Point 4 */}
            <div className="bg-white p-5 rounded-2xl border border-tea-border shadow-subtle hover:shadow-card transition text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-xs sm:text-sm text-tea-dark">
                TRUST & CONVENIENCE
              </h3>
              <p className="text-[11px] text-tea-muted leading-relaxed">
                Direct WhatsApp ordering with islandwide delivery & COD.
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
              Voices of Ceylon Tea Lovers
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              WHAT OUR CUSTOMERS SAY
            </h2>
            <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
            <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
              5-Star reviews from delighted customers across Sri Lanka and worldwide.
            </p>
          </div>

          <TestimonialsSlider />
        </div>
      </section>

      {/* ================================================== */}
      {/* 11. PROMOTIONAL BANNER WITH PROMO CODE */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-tea-dark via-tea-forest to-tea-dark text-white p-6 sm:p-10 shadow-hover">
          {/* Subtle background decorative shapes */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,169,81,0.22),transparent_55%)]" />
          <div className="relative z-10 max-w-2xl space-y-3 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-tea-gold/20 text-tea-gold text-xs font-bold uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5" />
              <span>Special Online Offer: Use Code &apos;LEENA10&apos;</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
              BRING THE TASTE OF CEYLON HOME
            </h2>
            <p className="text-xs sm:text-sm text-tea-pale/85 leading-relaxed">
              Explore our full collection of authentic Sri Lankan tea. Enjoy 10% OFF and free islandwide delivery on orders over Rs. 3,500.
            </p>
            <div className="pt-1 flex flex-col sm:flex-row items-center gap-2.5">
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-white text-tea-dark hover:bg-tea-bg font-bold text-xs uppercase tracking-wider transition shadow-sm"
              >
                <span>SHOP TEA NOW</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={`https://wa.me/${(settings.whatsappNumber || "071 777 4717").replace(/\D/g, "").replace(/^0/, "94")}?text=${encodeURIComponent(
                  "Hello LEENA CEYLON,\n\nI would like to order Ceylon tea using promo code LEENA10."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>WhatsApp Instant Order</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 12. ABOUT LEENA CEYLON (Clean White Background) */}
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
          ABOUT LEENA CEYLON
        </h2>
        <div className="w-12 h-0.5 bg-tea-gold mx-auto" />
        <p className="text-xs sm:text-sm text-tea-muted max-w-2xl mx-auto leading-relaxed">
          LEENA CEYLON is an authentic Sri Lankan tea brand dedicated to bringing single-origin pure Ceylon Tea from lush island estates directly to customers across Sri Lanka and worldwide.
        </p>
        <div className="pt-1">
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl border border-tea-border text-tea-dark hover:text-tea-forest hover:bg-tea-bg font-semibold text-xs uppercase tracking-wider transition"
          >
            <span>LEARN OUR STORY</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
            ORDER DIRECTLY VIA WHATSAPP
          </h2>
          <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto leading-relaxed">
            Quick, personalized service directly from Sri Lanka. Select any tea, order your custom quantity, or ask for direct bank transfer details.
          </p>
          <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <a
              href={`https://wa.me/${(settings.whatsappNumber || "071 777 4717").replace(/\D/g, "").replace(/^0/, "94")}?text=${encodeURIComponent(
                "Hello LEENA CEYLON,\n\nI am visiting your website and would like to inquire about ordering your authentic Ceylon teas."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-card hover:shadow-hover"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>Chat & Order on WhatsApp ({settings.whatsappNumber || "071 777 4717"})</span>
            </a>
            <Link
              href="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-emerald-300 text-emerald-900 hover:bg-emerald-100/60 font-semibold text-xs uppercase tracking-wider transition"
            >
              <span>Browse Catalog</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
