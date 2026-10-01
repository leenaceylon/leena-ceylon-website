"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Compass,
  Mountain,
  Sparkles,
  ArrowRight,
  MessageSquare,
  MapPin,
  Layers,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface TeaRegionData {
  id: string;
  keyPrefix: string;
  nameKey: string;
  defaultName: string;
  nativeSinhala: string;
  nativeTamil: string;
  nativeArabic: string;
  elevationKey: string;
  defaultElevation: string;
  elevationCategory: "high" | "mid" | "low";
  profileKey: string;
  defaultProfile: string;
  taglineKey: string;
  defaultTagline: string;
  liquorColorHex: string;
  liquorColorKey: string;
  defaultLiquorColor: string;
  mapCoords: { x: number; y: number }; // Percentage on map (0-100)
  defaultNotes: string[];
  productSearchTerm: string;
}

export const CEYLON_TEA_REGIONS: TeaRegionData[] = [
  {
    id: "nuwara-eliya",
    keyPrefix: "nuwaraEliya",
    nameKey: "region.nuwaraEliya.name",
    defaultName: "NUWARA ELIYA",
    nativeSinhala: "නුවරඑළිය",
    nativeTamil: "நுவரெலியா",
    nativeArabic: "نوارا إيليا",
    elevationKey: "region.nuwaraEliya.elevation",
    defaultElevation: "High Grown (6,000+ ft / 1,800m+)",
    elevationCategory: "high",
    profileKey: "region.nuwaraEliya.profile",
    defaultProfile:
      "Delicate, floral, and light golden liquor celebrated worldwide as the Champagne of Ceylon Teas. Grown in misty highland peaks blessed with crisp mountain air.",
    taglineKey: "region.nuwaraEliya.tagline",
    defaultTagline: "The Champagne of Ceylon Teas",
    liquorColorHex: "#D4AF37",
    liquorColorKey: "region.nuwaraEliya.liquor",
    defaultLiquorColor: "Sunstone Gold",
    mapCoords: { x: 50, y: 66 },
    defaultNotes: ["Floral & Crisp", "Golden Liquor", "Spring Meadow Aroma", "Zero Bitterness"],
    productSearchTerm: "Nuwara Eliya",
  },
  {
    id: "dimbula",
    keyPrefix: "dimbula",
    nameKey: "region.dimbula.name",
    defaultName: "DIMBULA",
    nativeSinhala: "දිඹුල",
    nativeTamil: "திம்புலா",
    nativeArabic: "ديمبولا",
    elevationKey: "region.dimbula.elevation",
    defaultElevation: "High Grown (3,500–5,000 ft)",
    elevationCategory: "high",
    profileKey: "region.dimbula.profile",
    defaultProfile:
      "Crisp and intensely aromatic with a rich golden-orange liquor. Famous for its jasmine and citrus bouquet and a clean, refreshing palate.",
    taglineKey: "region.dimbula.tagline",
    defaultTagline: "Crisp, Golden & Brisk",
    liquorColorHex: "#E67E22",
    liquorColorKey: "region.dimbula.liquor",
    defaultLiquorColor: "Golden Orange",
    mapCoords: { x: 42, y: 68 },
    defaultNotes: ["Golden-Orange", "Crisp & Clean", "Refreshing Finish", "Misty Highlands"],
    productSearchTerm: "Dimbula",
  },
  {
    id: "uva",
    keyPrefix: "uva",
    nameKey: "region.uva.name",
    defaultName: "UVA",
    nativeSinhala: "ඌව",
    nativeTamil: "ஊவா",
    nativeArabic: "أوفا",
    elevationKey: "region.uva.elevation",
    defaultElevation: "High / Mid Grown (3,000–5,000 ft)",
    elevationCategory: "high",
    profileKey: "region.uva.profile",
    defaultProfile:
      "World-renowned for its exotic menthol aroma, distinctive sweetness, and brisk pungency shaped by the dry Cachan monsoon winds.",
    taglineKey: "region.uva.tagline",
    defaultTagline: "World-Renowned Menthol Character",
    liquorColorHex: "#C0392B",
    liquorColorKey: "region.uva.liquor",
    defaultLiquorColor: "Deep Amber",
    mapCoords: { x: 62, y: 65 },
    defaultNotes: ["Menthol Aroma", "Sweet Pungency", "Distinctive Exotic Taste", "Brisk Amber"],
    productSearchTerm: "Uva",
  },
  {
    id: "kandy",
    keyPrefix: "kandy",
    nameKey: "region.kandy.name",
    defaultName: "KANDY",
    nativeSinhala: "මහනුවර",
    nativeTamil: "கண்டி",
    nativeArabic: "كاندي",
    elevationKey: "region.kandy.elevation",
    defaultElevation: "Mid Grown (2,000–4,000 ft)",
    elevationCategory: "mid",
    profileKey: "region.kandy.profile",
    defaultProfile:
      "The birthplace of Ceylon tea in 1867. Produces a full-bodied, brisk, and robust cup with deep copper tones—ideal for rich milk tea.",
    taglineKey: "region.kandy.tagline",
    defaultTagline: "Rich, Robust & Full-Bodied",
    liquorColorHex: "#962D24",
    liquorColorKey: "region.kandy.liquor",
    defaultLiquorColor: "Deep Coppery Red",
    mapCoords: { x: 51, y: 57 },
    defaultNotes: ["Rich Copper Tone", "Perfect with Milk", "Strong & Brisk", "Historic Origin"],
    productSearchTerm: "Kandy",
  },
  {
    id: "uda-pussellawa",
    keyPrefix: "udaPussellawa",
    nameKey: "region.udaPussellawa.name",
    defaultName: "UDA PUSSELLAWA",
    nativeSinhala: "උඩපුස්සැල්ලාව",
    nativeTamil: "உடபுஸல்லாவை",
    nativeArabic: "أودا بوسيلاوا",
    elevationKey: "region.udaPussellawa.elevation",
    defaultElevation: "High Grown (5,000–6,000 ft)",
    elevationCategory: "high",
    profileKey: "region.udaPussellawa.profile",
    defaultProfile:
      "Exquisite pinkish liquor with tangy citrus notes, refreshing rose blossom nuances, and an invigorating mountain briskness.",
    taglineKey: "region.udaPussellawa.tagline",
    defaultTagline: "Pinkish Liquor & Tangy Briskness",
    liquorColorHex: "#C25975",
    liquorColorKey: "region.udaPussellawa.liquor",
    defaultLiquorColor: "Rosy Pink Amber",
    mapCoords: { x: 57, y: 61 },
    defaultNotes: ["Rosy Liquor", "Tangy Citrus", "Subtle Briskness", "Mountain Ridge"],
    productSearchTerm: "Uda Pussellawa",
  },
  {
    id: "ruhuna",
    keyPrefix: "ruhuna",
    nameKey: "region.ruhuna.name",
    defaultName: "RUHUNA",
    nativeSinhala: "රුහුණ",
    nativeTamil: "ருஹுணு",
    nativeArabic: "روهونا",
    elevationKey: "region.ruhuna.elevation",
    defaultElevation: "Low Grown (0–2,000 ft)",
    elevationCategory: "low",
    profileKey: "region.ruhuna.profile",
    defaultProfile:
      "Rich, thick, and intensely malty with deep black leaf appearance and sweet caramel undertones. Highly prized in Middle Eastern markets.",
    taglineKey: "region.ruhuna.tagline",
    defaultTagline: "Deep, Malty & Caramel Sweet",
    liquorColorHex: "#5C2C16",
    liquorColorKey: "region.ruhuna.liquor",
    defaultLiquorColor: "Dark Mahogany",
    mapCoords: { x: 52, y: 83 },
    defaultNotes: ["Deep Black Leaf", "Thick & Malty", "Sweet Caramel Note", "Rich Golden Tip"],
    productSearchTerm: "Ruhuna",
  },
  {
    id: "sabaragamuwa",
    keyPrefix: "sabaragamuwa",
    nameKey: "region.sabaragamuwa.name",
    defaultName: "SABARAGAMUWA",
    nativeSinhala: "සබරගමුව",
    nativeTamil: "சபரகமுவ",
    nativeArabic: "ساباراغاموا",
    elevationKey: "region.sabaragamuwa.elevation",
    defaultElevation: "Low Grown (0–2,500 ft)",
    elevationCategory: "low",
    profileKey: "region.sabaragamuwa.profile",
    defaultProfile:
      "Grown in lush rainforest valleys near Adams Peak. Delivers a deep yellow-brown liquor with caramel sweetness, smooth body, and hint of honey.",
    taglineKey: "region.sabaragamuwa.tagline",
    defaultTagline: "Lush Rainforest Terroir",
    liquorColorHex: "#8B4513",
    liquorColorKey: "region.sabaragamuwa.liquor",
    defaultLiquorColor: "Yellow-Brown Liquor",
    mapCoords: { x: 40, y: 75 },
    defaultNotes: ["Rainforest Fed", "Sweet Malt Nuances", "Smooth Mouthfeel", "Fast-Steeping"],
    productSearchTerm: "Sabaragamuwa",
  },
];

export default function CeylonRegionsMap({
  whatsappNumber = "071 777 4717",
}: {
  whatsappNumber?: string;
}) {
  const { t, lang, isRTL } = useLanguage();
  const [selectedRegionId, setSelectedRegionId] = useState<string>("nuwara-eliya");
  const [filterElevation, setFilterElevation] = useState<"all" | "high" | "mid" | "low">("all");

  const selectedRegion =
    CEYLON_TEA_REGIONS.find((r) => r.id === selectedRegionId) || CEYLON_TEA_REGIONS[0];

  const filteredRegions =
    filterElevation === "all"
      ? CEYLON_TEA_REGIONS
      : CEYLON_TEA_REGIONS.filter((r) => r.elevationCategory === filterElevation);

  const getRegionName = (r: TeaRegionData) => {
    if (lang === "si") return r.nativeSinhala;
    if (lang === "ta") return r.nativeTamil;
    if (lang === "ar") return r.nativeArabic;
    return t(r.nameKey, r.defaultName);
  };

  const getElevationLabel = (category: "high" | "mid" | "low") => {
    if (category === "high") return t("regions.highGrownBadge", "High Grown (4,000+ ft)");
    if (category === "mid") return t("regions.midGrownBadge", "Mid Grown (2,000–4,000 ft)");
    return t("regions.lowGrownBadge", "Low Grown (0–2,000 ft)");
  };

  // Localized tasting notes for selected region
  const activeTastingNotes = [
    t(`region.${selectedRegion.keyPrefix}.note1`, selectedRegion.defaultNotes[0]),
    t(`region.${selectedRegion.keyPrefix}.note2`, selectedRegion.defaultNotes[1]),
    t(`region.${selectedRegion.keyPrefix}.note3`, selectedRegion.defaultNotes[2]),
    t(`region.${selectedRegion.keyPrefix}.note4`, selectedRegion.defaultNotes[3]),
  ];

  const whatsappInquiryLink = `https://wa.me/${whatsappNumber.replace(/\D/g, "").replace(/^0/, "94")}?text=${encodeURIComponent(
    `Hello LEENA CEYLON,\n\nI am visiting your website and would like to inquire about authentic Ceylon tea from the ${selectedRegion.defaultName} region.`
  )}`;

  return (
    <div className={`space-y-6 sm:space-y-8 ${isRTL ? "rtl" : "ltr"}`}>
      {/* Elevation Filter Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setFilterElevation("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shadow-xs flex items-center gap-1.5 ${
            filterElevation === "all"
              ? "bg-tea-dark text-white"
              : "bg-white text-tea-dark border border-tea-border hover:border-tea-leaf"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-tea-gold" />
          <span>{t("regions.filterAll", "All 7 Regions")}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterElevation("high")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shadow-xs flex items-center gap-1.5 ${
            filterElevation === "high"
              ? "bg-emerald-800 text-white"
              : "bg-white text-emerald-900 border border-emerald-200 hover:border-emerald-400"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{t("regions.filterHigh", "High Grown (Nuwara Eliya, Dimbula, Uva, Uda Pussellawa)")}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterElevation("mid")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shadow-xs flex items-center gap-1.5 ${
            filterElevation === "mid"
              ? "bg-amber-800 text-white"
              : "bg-white text-amber-900 border border-amber-200 hover:border-amber-400"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>{t("regions.filterMid", "Mid Grown (Kandy)")}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterElevation("low")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shadow-xs flex items-center gap-1.5 ${
            filterElevation === "low"
              ? "bg-amber-950 text-white"
              : "bg-white text-amber-950 border border-amber-300 hover:border-amber-500"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-700" />
          <span>{t("regions.filterLow", "Low Grown (Ruhuna, Sabaragamuwa)")}</span>
        </button>
      </div>

      {/* Main Interactive Map & Destination Spotlight Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center bg-white rounded-3xl border border-tea-border shadow-card p-4 sm:p-7 overflow-hidden">
        {/* Left Column: Authentic Interactive Vintage Map Artwork of Sri Lanka */}
        <div className="lg:col-span-6 relative flex flex-col items-center justify-center p-3 sm:p-5 bg-gradient-to-b from-[#F2F7F4] via-[#EAF2ED] to-[#F2F7F4] rounded-2xl border border-emerald-900/15 overflow-hidden">
          {/* Cartographic Compass Badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs border border-tea-border shadow-xs text-[11px] font-bold text-tea-forest">
            <Compass className="w-4 h-4 text-tea-leaf" />
            <span>SRI LANKA (CEYLON)</span>
          </div>

          {/* Elevation Color Legend */}
          <div className="absolute top-4 right-4 z-20 hidden sm:flex flex-col gap-1 p-2.5 rounded-xl bg-white/95 backdrop-blur-xs border border-tea-border shadow-xs text-[10px]">
            <span className="font-bold text-tea-dark uppercase tracking-wider mb-0.5">Terroirs</span>
            <div className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>High Grown</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Mid Grown</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-950">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-800" />
              <span>Low Grown</span>
            </div>
          </div>

          {/* Guaranteed Non-Collapsing Luxury Map Frame */}
          <div className="relative w-full max-w-[420px] h-[520px] sm:h-[580px] rounded-2xl overflow-hidden border border-emerald-900/20 shadow-inner my-2">
            {/* High-Resolution Luxury Cartographic Artwork */}
            <Image
              src="/images/sri-lanka-tea-regions-map.jpg"
              alt="Authentic Cartographic Map of Ceylon Tea Regions Sri Lanka"
              fill
              priority
              sizes="(max-width: 640px) 380px, 420px"
              className="object-cover object-center select-none"
            />

            {/* Subtle Vignette Overlay for Pin Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/15 pointer-events-none" />

            {/* Interactive Glowing Pins for the 7 Ceylon Tea Regions */}
            {CEYLON_TEA_REGIONS.map((region) => {
              const isSelected = selectedRegionId === region.id;
              const isFilteredOut =
                filterElevation !== "all" && region.elevationCategory !== filterElevation;

              const pinBgColor =
                region.elevationCategory === "high"
                  ? "bg-emerald-700 text-white border-white"
                  : region.elevationCategory === "mid"
                  ? "bg-amber-600 text-white border-white"
                  : "bg-amber-900 text-white border-white";

              return (
                <div
                  key={region.id}
                  style={{
                    left: `${region.mapCoords.x}%`,
                    top: `${region.mapCoords.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className={`absolute z-30 transition-all duration-300 ${
                    isFilteredOut ? "opacity-20 pointer-events-none scale-75" : "opacity-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedRegionId(region.id)}
                    aria-label={`Select ${region.defaultName} tea region`}
                    className={`group relative flex items-center justify-center transition-all duration-300 ${
                      isSelected ? "scale-125 z-40" : "hover:scale-115"
                    }`}
                  >
                    {/* Animated Pulsing Gold Halo Ring */}
                    {isSelected && (
                      <span className="absolute -inset-3 rounded-full bg-amber-400 opacity-75 animate-ping pointer-events-none" />
                    )}

                    {/* Glowing Outer Aura on Active */}
                    {isSelected && (
                      <span className="absolute -inset-1.5 rounded-full bg-white/60 animate-pulse pointer-events-none" />
                    )}

                    {/* Pin Head */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 shadow-lg flex items-center justify-center transition-all ${pinBgColor} ${
                        isSelected
                          ? "ring-4 ring-tea-gold ring-offset-2 scale-110 shadow-2xl"
                          : "hover:ring-2 hover:ring-white shadow-md"
                      }`}
                      style={{
                        boxShadow: isSelected
                          ? `0 0 16px ${region.liquorColorHex}`
                          : undefined,
                      }}
                    >
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current drop-shadow-xs" />
                    </div>

                    {/* Floating Region Label Tag */}
                    <div
                      className={`absolute top-full mt-1.5 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all shadow-md pointer-events-none ${
                        isSelected
                          ? "bg-tea-dark text-white opacity-100 scale-100 border border-tea-gold/80 shadow-lg"
                          : "bg-white/95 text-tea-dark opacity-90 group-hover:opacity-100 border border-tea-border"
                      }`}
                    >
                      <span>{getRegionName(region)}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Micro Helper Note */}
          <div className="mt-2 text-center text-[11px] text-tea-muted font-medium z-10">
            <span>{t("regions.mapHelper", "👆 Tap any region pin on the map to explore its unique elevation & tasting notes")}</span>
          </div>
        </div>

        {/* Right Column: Active Destination Profile Showcase */}
        <div className={`lg:col-span-6 space-y-4 ${isRTL ? "text-right" : "text-left"}`}>
          {/* Header Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tea-leaf/10 border border-tea-leaf/25 text-tea-forest text-xs font-bold uppercase tracking-wider">
              <Mountain className="w-3.5 h-3.5 text-tea-leaf" />
              <span>{getElevationLabel(selectedRegion.elevationCategory)}</span>
            </div>

            {/* Liquor Color Swatch */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-tea-surface border border-tea-border shadow-xs">
              <div
                className="w-4 h-4 rounded-full border border-white shadow-xs"
                style={{ backgroundColor: selectedRegion.liquorColorHex }}
              />
              <span className="text-[11px] font-bold text-tea-dark">
                {t(selectedRegion.liquorColorKey, selectedRegion.defaultLiquorColor)}
              </span>
            </div>
          </div>

          {/* Region Title */}
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-tea-leaf block">
              CEYLON SINGLE-ORIGIN TERROIR
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-tea-dark mt-0.5">
              {getRegionName(selectedRegion)}
            </h3>
            <p className="font-serif text-sm italic text-tea-gold font-medium mt-1">
              &ldquo;{t(selectedRegion.taglineKey, selectedRegion.defaultTagline)}&rdquo;
            </p>
          </div>

          {/* Region Elevation & Climatic Profile Card */}
          <div className="p-3.5 bg-tea-surface/60 rounded-2xl border border-tea-border/60 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-tea-dark font-medium">
              <span className="text-tea-muted font-bold uppercase text-[10px] tracking-wider">
                {t("regions.elevation", "Altitude / Elevation:")}
              </span>
              <span className="font-semibold text-tea-forest">
                {t(selectedRegion.elevationKey, selectedRegion.defaultElevation)}
              </span>
            </div>
            <div className="flex items-center justify-between text-tea-dark font-medium">
              <span className="text-tea-muted font-bold uppercase text-[10px] tracking-wider">
                {t("regions.cupLiquor", "Liquor Shade:")}
              </span>
              <span className="font-semibold">
                {t(selectedRegion.liquorColorKey, selectedRegion.defaultLiquorColor)}
              </span>
            </div>
          </div>

          {/* Narrative Profile */}
          <p className="text-xs sm:text-sm text-tea-muted leading-relaxed">
            {t(selectedRegion.profileKey, selectedRegion.defaultProfile)}
          </p>

          {/* Tasting Notes Pills (Fully Localized!) */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-tea-dark block mb-2">
              {t("regions.tastingNotes", "Aroma & Flavor Characteristics:")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeTastingNotes.map((note, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-tea-border shadow-xs text-xs font-semibold text-tea-forest"
                >
                  <Sparkles className="w-3 h-3 text-tea-gold" />
                  <span>{note}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Actions: WhatsApp Inquiry & Shop Region Teas */}
          <div className="pt-2 border-t border-tea-border/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={whatsappInquiryLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-card hover:shadow-hover active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>{t("regions.inquireWhatsapp", "Order on WhatsApp")}</span>
            </a>

            <Link
              href={`/products?q=${encodeURIComponent(selectedRegion.productSearchTerm)}`}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-tea-border bg-tea-surface hover:bg-white text-tea-dark hover:text-tea-forest font-semibold text-xs uppercase tracking-wider transition"
            >
              <span>{t("regions.viewProducts", "View Region Teas")}</span>
              <ArrowRight className={`w-3.5 h-3.5 text-tea-leaf ${isRTL ? "rotate-180" : ""}`} />
            </Link>
          </div>
        </div>
      </div>

      {/* Region Selector Pills Row for Fast Tap Switching */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {filteredRegions.map((region) => {
          const isSelected = selectedRegionId === region.id;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => setSelectedRegionId(region.id)}
              className={`p-2.5 rounded-xl border transition-all text-center flex flex-col items-center justify-between gap-1 ${
                isSelected
                  ? "bg-tea-dark text-white border-tea-dark shadow-md ring-2 ring-tea-leaf/40 scale-[1.02]"
                  : "bg-white text-tea-dark border-tea-border hover:border-tea-leaf hover:bg-tea-surface/40"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: region.liquorColorHex }}
                />
                <span className="font-serif font-bold text-xs line-clamp-1">
                  {getRegionName(region)}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  isSelected ? "text-tea-gold" : "text-tea-muted"
                }`}
              >
                {region.elevationCategory === "high"
                  ? t("regions.filterHighShort", "High Grown")
                  : region.elevationCategory === "mid"
                  ? t("regions.filterMidShort", "Mid Grown")
                  : t("regions.filterLowShort", "Low Grown")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
