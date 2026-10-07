import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Heart, Leaf, Mountain, ArrowRight } from "lucide-react";

import type { Metadata } from "next";

import { getBaseUrl, SEO_KEYWORDS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About LEENA CEYLON | Pure Sri Lankan Ceylon Tea Heritage",
  description:
    "Learn about LEENA CEYLON (PVT) LTD, our heritage in Sri Lankan tea production, sustainable highland estate sourcing, and dedication to 100% pure Ceylon tea.",
  keywords: [
    ...SEO_KEYWORDS,
    "About Leena Ceylon",
    "Leena Ceylon history",
    "Leena tea Sri Lanka",
    "Ceylon Tea brand history",
    "LEENA CEYLON PVT LTD",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About LEENA CEYLON | Pure Ceylon Tea Heritage",
    description:
      "Discover how LEENA CEYLON preserves traditional artisanal Ceylon tea craftsmanship directly from Sri Lanka.",
    url: "/about",
    siteName: "LEENA CEYLON",
    images: [
      {
        url: "/images/ceylon-hero-plantation.jpg",
        width: 1200,
        height: 630,
        alt: "LEENA CEYLON Tea Heritage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About LEENA CEYLON | Pure Ceylon Tea Heritage",
    description: "Discover LEENA CEYLON's sustainable sourcing and master craftsmanship.",
    images: ["/images/ceylon-hero-plantation.jpg"],
  },
};

export default function AboutPage() {
  const baseUrl = getBaseUrl();

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About LEENA CEYLON",
    url: `${baseUrl}/about`,
    description:
      "The official story, origin, and artisanal heritage of LEENA CEYLON, producer of authentic pure Ceylon tea in Sri Lanka.",
    mainEntity: {
      "@type": "Organization",
      name: "LEENA CEYLON",
      alternateName: ["LEENA", "Leena Ceylon", "leenaceylon", "Leena Tea"],
      url: baseUrl,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "About Us",
        item: `${baseUrl}/about`,
      },
    ],
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Hero */}
      <section className="bg-gradient-to-b from-tea-bg via-white to-tea-surface py-16 sm:py-24 border-b border-tea-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            Our Roots & Passion
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-tea-dark tracking-tight">
            The Story of LEENA CEYLON
          </h1>
          <p className="font-serif text-base text-tea-gold font-semibold uppercase tracking-widest">
            PURE CEYLON TEA • THE TASTE OF CEYLON
          </p>
          <div className="w-16 h-0.5 bg-tea-gold mx-auto" />
          <p className="text-xs sm:text-sm text-tea-muted max-w-2xl mx-auto leading-relaxed">
            Born from an unwavering dedication to authentic Sri Lankan tea culture, LEENA CEYLON brings uncompromised single-origin purity directly from misty hill country plantations to connoisseurs worldwide.
          </p>
        </div>
      </section>

      {/* Origin & Craftsmanship */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              Heritage & Origin
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-tea-dark">
              From Sri Lanka&apos;s Finest Highlands to Kekirawa with Pride
            </h2>
            <p className="text-xs sm:text-sm text-tea-muted leading-relaxed">
              LEENA CEYLON (PVT) LTD brings you the purest single-origin Ceylon tea directly through our head office in Kekirawa. By partnering directly with esteemed smallholders and heritage tea gardens across Sri Lanka&apos;s central highlands, we ensure that only the finest two leaves and a bud are selected for our products.
            </p>
            <p className="text-xs sm:text-sm text-tea-muted leading-relaxed">
              Unlike mass commercial brands that blend teas from across disparate continents to mask inconsistencies, LEENA CEYLON remains fiercely committed to 100% single-origin Ceylon tea.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-tea-surface border border-tea-border">
                <span className="font-serif text-2xl font-bold text-tea-forest block">100%</span>
                <span className="text-[11px] text-tea-muted font-medium">Authentic Ceylon Tea</span>
              </div>
              <div className="p-4 rounded-xl bg-tea-surface border border-tea-border">
                <span className="font-serif text-2xl font-bold text-tea-forest block">Single Origin</span>
                <span className="text-[11px] text-tea-muted font-medium">Direct Estate Sourcing</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-card border-4 border-white">
              <Image
                src="/uploads/leena-tea-powder-200g.jpeg"
                alt="LEENA CEYLON Packaging and Estate Background"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-tea-bg py-16 border-y border-tea-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              Our Principles
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-tea-dark">
              What Sets LEENA CEYLON Apart
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-tea-border shadow-subtle space-y-3">
              <div className="w-12 h-12 rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-tea-dark">Uncompromised Purity</h3>
              <p className="text-xs text-tea-muted leading-relaxed">
                Zero synthetic flavorings or artificial color enhancers. Pure, unadulterated nature in every sip.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-tea-border shadow-subtle space-y-3">
              <div className="w-12 h-12 rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-tea-dark">Respect for Farmers</h3>
              <p className="text-xs text-tea-muted leading-relaxed">
                Fair farmer remuneration and direct support for rural estate communities that nurture our tea crops.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-tea-border shadow-subtle space-y-3">
              <div className="w-12 h-12 rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-tea-dark">Freshness Protection</h3>
              <p className="text-xs text-tea-muted leading-relaxed">
                Packaged at origin in multi-layer barrier foil and airtight tins to preserve delicate volatiles and aroma.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
          Discover The Taste of Ceylon
        </h3>
        <p className="text-xs sm:text-sm text-tea-muted">
          Sample our flagship BOPF tin canister or authentic pure tea powder today.
        </p>
        <div className="pt-2">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition"
          >
            EXPLORE PRODUCTS
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
