"use client";

import React from "react";
import { Sparkles, Truck, Tag, Phone, ShieldCheck, Leaf } from "lucide-react";

export default function PromoMarquee() {
  const items = [
    { icon: Leaf, text: "100% Pure Ceylon Single-Origin Tea" },
    { icon: Truck, text: "Free Islandwide Delivery on Orders Over Rs. 3,500" },
    { icon: Tag, text: "Use Promo Code 'LEENA10' for 10% OFF" },
    { icon: ShieldCheck, text: "Authentic Sri Lankan Tea Garden Quality" },
    { icon: Phone, text: "Instant WhatsApp Ordering: 071 777 4717" },
    { icon: Sparkles, text: "Fresh Highland Harvest Packed at Origin" },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-tea-dark via-tea-forest to-tea-dark text-white py-2.5 border-y border-emerald-500/20 shadow-xs">
      <div className="flex select-none">
        {/* Repeating content for seamless infinite ticker */}
        <div className="flex shrink-0 items-center gap-8 animate-marquee whitespace-nowrap">
          {items.map((it, idx) => {
            const Icon = it.icon;
            return (
              <div key={idx} className="flex items-center gap-2 text-xs font-medium tracking-wide">
                <Icon className="w-3.5 h-3.5 text-tea-gold shrink-0" />
                <span className="text-white/95">{it.text}</span>
                <span className="text-white/30 ml-4">•</span>
              </div>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-8 animate-marquee whitespace-nowrap" aria-hidden="true">
          {items.map((it, idx) => {
            const Icon = it.icon;
            return (
              <div key={`dup-${idx}`} className="flex items-center gap-2 text-xs font-medium tracking-wide">
                <Icon className="w-3.5 h-3.5 text-tea-gold shrink-0" />
                <span className="text-white/95">{it.text}</span>
                <span className="text-white/30 ml-4">•</span>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          animation: marquee 32s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
