"use client";

import React from "react";
import { Sparkles, Truck, Tag, Phone, ShieldCheck, Leaf } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface PromoMarqueeProps {
  activePromotion?: {
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
}

export default function PromoMarquee({ activePromotion }: PromoMarqueeProps) {
  const { t } = useLanguage();

  const discountText = activePromotion
    ? activePromotion.discountType === "PERCENTAGE"
      ? `${activePromotion.discountValue}% OFF`
      : activePromotion.discountType === "FREE_SHIPPING"
      ? "FREE DELIVERY"
      : `Rs. ${activePromotion.discountValue} OFF`
    : "";

  const promoItem = activePromotion
    ? {
        icon: Tag,
        text: `Use Promo Code '${activePromotion.code}' for ${discountText}`,
      }
    : {
        icon: ShieldCheck,
        text: t("marquee.estateFresh", "Single-Origin Highland Harvest Packed at Source"),
      };

  const items = [
    { icon: Leaf, text: t("marquee.pure", "100% Pure Ceylon Single-Origin Tea") },
    { icon: Truck, text: t("marquee.freeDelivery", "Free Islandwide Delivery on Orders Over Rs. 3,500") },
    promoItem,
    { icon: ShieldCheck, text: t("marquee.teaGardenQuality", "Authentic Sri Lankan Tea Garden Quality") },
    { icon: Phone, text: t("marquee.instantWhatsapp", "Instant WhatsApp Ordering: 071 777 4717") },
    { icon: Sparkles, text: t("marquee.freshHighland", "Fresh Highland Harvest Packed at Origin") },
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
    </div>
  );
}
