import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Heart, Leaf, Mountain, ArrowRight } from "lucide-react";

export const metadata = {
  title: "About Us | LEENA CEYLON - Pure Ceylon Tea",
  description:
    "Learn about LEENA CEYLON, our heritage in Sri Lankan tea production, sustainable estate sourcing, and commitment to purity.",
};

export default function AboutPage() {
  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
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
              From Nuwara Eliya & Kekirawa with Pride
            </h2>
            <p className="text-xs sm:text-sm text-tea-muted leading-relaxed">
              LEENA CEYLON (PVT) LTD is rooted in Sri Lanka’s lush highlands and historic tea-trading junctions. By partnering directly with esteemed smallholders and heritage plantations, we guarantee that only the freshest, tender two leaves and a bud make their way into our processing facilities.
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
