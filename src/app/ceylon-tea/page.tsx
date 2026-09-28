import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Mountain,
  Sun,
  ShieldCheck,
  CheckCircle2,
  Droplet,
  Compass,
  ArrowRight,
} from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Ceylon Tea Guide | 7 Regions, Grades & Terroir | LEENA",
  description:
    "An expert guide to authentic Ceylon Tea from Sri Lanka by LEENA CEYLON. Learn about the 7 tea-growing regions (Nuwara Eliya, Dimbula, Uva), high & low elevations, and tea grades (BOPF, Pekoe, OP).",
  keywords: [
    "Ceylon Tea guide",
    "Ceylon tea regions",
    "Nuwara Eliya tea",
    "Dimbula tea",
    "Uva tea",
    "Ceylon tea grades",
    "BOPF tea",
    "Leena Ceylon Tea guide",
    "Sri Lanka orthodox tea",
  ],
  alternates: {
    canonical: "https://leenaceylon.com/ceylon-tea",
  },
  openGraph: {
    title: "Ceylon Tea Guide: 7 Regions & Official Grades | LEENA CEYLON",
    description:
      "Official educational guide to Sri Lankan Ceylon Tea terroir, grades, and tasting profiles by LEENA CEYLON.",
    url: "https://leenaceylon.com/ceylon-tea",
    siteName: "LEENA CEYLON",
    images: [
      {
        url: "/images/ceylon-hero-plantation.jpg",
        width: 1200,
        height: 630,
        alt: "Ceylon Tea Plantation Nuwara Eliya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Complete Ceylon Tea Guide | LEENA CEYLON",
    description: "Learn about Ceylon tea regions, elevations, and official grades.",
    images: ["/images/ceylon-hero-plantation.jpg"],
  },
};

const REGIONS = [
  {
    name: "Nuwara Eliya",
    elevation: "High Grown (6,000+ ft)",
    flavor: "Delicate, floral, with a light golden liquor reminiscent of fine champagne.",
    climate: "Cool mountain mists, crisp mountain air, and abundant sunshine.",
  },
  {
    name: "Dimbula",
    elevation: "High Grown (3,500 – 5,000 ft)",
    flavor: "Crisp, aromatic, with a golden-orange liquor and clean jasmine notes.",
    climate: "Southwest monsoon season yields exquisite seasonal quality.",
  },
  {
    name: "Uva",
    elevation: "High Grown (3,000 – 5,000 ft)",
    flavor: "Distinctive menthol character, exotic pungency, and bright amber color.",
    climate: "Dry winds of the Northeast monsoon create intense natural aroma.",
  },
  {
    name: "Uda Pussellawa",
    elevation: "High Grown (5,000 – 6,000 ft)",
    flavor: "Darker pinkish hue, delicate strength, and subtle tang.",
    climate: "Situated close to Nuwara Eliya with two seasonal quality periods.",
  },
  {
    name: "Kandy",
    elevation: "Medium Grown (2,000 – 4,000 ft)",
    flavor: "Full-bodied, brisk, bright, and intensely flavorful.",
    climate: "Mid-country valleys providing balanced warmth and steady precipitation.",
  },
  {
    name: "Ruhuna",
    elevation: "Low Grown (Sea Level – 2,000 ft)",
    flavor: "Deep black leaf, strong, malty, full-bodied with sweet notes.",
    climate: "Southern coastal and forest conditions with warm, humid sunshine.",
  },
  {
    name: "Sabaragamuwa",
    elevation: "Low Grown (Sea Level – 2,500 ft)",
    flavor: "Lustrous leaves yielding a reddish-golden liquor with hint of caramel.",
    climate: "Lush vegetation near the Sinharaja rainforest ecosystem.",
  },
];

const GRADES = [
  {
    code: "BOPF",
    name: "Broken Orange Pekoe Fannings",
    description:
      "A smaller, neat broken leaf standard that infuses rapidly to deliver a rich, brisk, and deep reddish-amber cup. Extremely popular in Sri Lanka and the UK for morning tea.",
  },
  {
    code: "FBOP",
    name: "Flowery Broken Orange Pekoe",
    description:
      "Coarser broken leaf containing attractive silver and golden tips. Delivers a soft, sweet fragrance with a balanced medium body.",
  },
  {
    code: "OP",
    name: "Orange Pekoe",
    description:
      "Long, wiry, whole tea leaves without tips. Takes longer to infuse, producing a delicate, light liquor with subtle floral undertones.",
  },
  {
    code: "Pekoe",
    name: "Pekoe",
    description:
      "Curly, shotty leaves that unfurl during brewing to produce a mellow, round cup with pleasing vegetal sweetness.",
  },
  {
    code: "DUST",
    name: "Tea Powder / Dust",
    description:
      "Fine tea particles resulting from orthodox sifting. Unlocks maximum color and instantaneous brisk strength, perfect for traditional Sri Lankan milk tea.",
  },
  {
    code: "Silver Tips",
    name: "Silver Tips (White Tea)",
    description:
      "Unopened velvet buds carefully plucked before sunrise and sun-dried without oxidation. The rarest and most delicate Ceylon tea in existence.",
  },
];

export default function CeylonTeaPage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "The Master Guide to Ceylon Tea: 7 Regions, Grades & Terroir",
    description:
      "A comprehensive guide exploring Sri Lanka's 7 tea growing regions, three elevation tiers, and orthodox leaf grading standards.",
    image: "https://leenaceylon.com/images/ceylon-hero-plantation.jpg",
    author: {
      "@type": "Organization",
      name: "LEENA CEYLON",
      url: "https://leenaceylon.com",
    },
    publisher: {
      "@type": "Organization",
      name: "LEENA CEYLON",
      logo: {
        "@type": "ImageObject",
        url: "https://leenaceylon.com/brand/logo.png",
      },
    },
    mainEntityOfPage: "https://leenaceylon.com/ceylon-tea",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://leenaceylon.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Ceylon Tea Guide",
        item: "https://leenaceylon.com/ceylon-tea",
      },
    ],
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Header */}
      <section className="bg-gradient-to-b from-tea-bg via-white to-tea-surface py-16 sm:py-24 border-b border-tea-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            The World-Renowned Ceylon Heritage
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-tea-dark tracking-tight">
            The Master Guide to Ceylon Tea
          </h1>
          <div className="w-16 h-0.5 bg-tea-gold mx-auto" />
          <p className="text-xs sm:text-sm text-tea-muted max-w-2xl mx-auto leading-relaxed">
            Since 1867, Sri Lanka has produced the world’s most celebrated orthodox teas. Explore the agro-climatic elevations, regional signatures, and grading terminology that make Ceylon Tea truly irreplaceable.
          </p>
        </div>
      </section>

      {/* Elevations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            Elevation & Terroir
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-tea-dark">
            Three Distinct Elevation Tiers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-tea-border shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
              <Mountain className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-tea-dark">High Grown</h3>
            <p className="text-xs text-tea-forest font-semibold">Above 4,000 feet (1,200m+)</p>
            <p className="text-xs text-tea-muted leading-relaxed">
              Cultivated in the misty, cool highlands of Nuwara Eliya and Dimbula. High-altitude slow growth concentrates essential aromatic oils, yielding light, exquisite, floral liquors.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-tea-border shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-tea-dark">Medium Grown</h3>
            <p className="text-xs text-tea-forest font-semibold">2,000 to 4,000 feet (600m - 1,200m)</p>
            <p className="text-xs text-tea-muted leading-relaxed">
              Harvested along the rolling mid-country hills surrounding Kandy. Known for a rich copper hue, bold flavor, and a satisfying, thirst-quenching briskness.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-tea-border shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
              <Sun className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-tea-dark">Low Grown</h3>
            <p className="text-xs text-tea-forest font-semibold">Sea Level to 2,000 feet (0 - 600m)</p>
            <p className="text-xs text-tea-muted leading-relaxed">
              Sun-drenched coastal and rainforest regions like Ruhuna and Sabaragamuwa. Produces intense, deep black leaves with strong maltiness and thick golden crema.
            </p>
          </div>
        </div>
      </section>

      {/* 7 Recognized Regions */}
      <section className="bg-tea-bg py-16 border-y border-tea-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              The Geographical Terroirs
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-tea-dark">
              7 Agro-Climatic Growing Regions
            </h2>
            <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
              Each registered tea region in Sri Lanka possesses unique rainfall patterns, winds, and mineral-rich soils.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REGIONS.map((reg) => (
              <div
                key={reg.name}
                className="bg-white p-6 rounded-2xl border border-tea-border shadow-subtle space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg text-tea-dark">{reg.name}</h3>
                  <span className="text-[11px] font-semibold text-tea-forest bg-tea-bg px-2.5 py-1 rounded-md">
                    {reg.elevation}
                  </span>
                </div>
                <p className="text-xs text-tea-muted leading-relaxed">
                  <strong>Cup Character:</strong> {reg.flavor}
                </p>
                <p className="text-[11px] text-tea-muted/80">
                  <strong>Climate:</strong> {reg.climate}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tea Grades */}
      <section id="grades" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            Quality & Sifting Standards
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-tea-dark">
            Understanding Ceylon Tea Grades
          </h2>
          <p className="text-xs sm:text-sm text-tea-muted max-w-xl mx-auto">
            In orthodox Ceylon tea manufacturing, grades classify leaf size and appearance rather than quality alone.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GRADES.map((gr) => (
            <div
              key={gr.code}
              className="p-6 bg-tea-surface rounded-2xl border border-tea-border space-y-3"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-tea-dark text-white font-mono font-bold text-xs">
                  {gr.code}
                </span>
                <h4 className="font-serif font-bold text-sm text-tea-dark">{gr.name}</h4>
              </div>
              <p className="text-xs text-tea-muted leading-relaxed">{gr.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
          Experience the Pure Ceylon Taste Today
        </h3>
        <p className="text-xs sm:text-sm text-tea-muted">
          Order authentic LEENA CEYLON teas delivered fresh from our Nuwara Eliya and Kekirawa estate facilities.
        </p>
        <div className="pt-2">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition"
          >
            SHOP OUR TEAS
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
