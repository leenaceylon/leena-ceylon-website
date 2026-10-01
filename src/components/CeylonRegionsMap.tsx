"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Mountain,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Coffee,
  CheckCircle2,
  MapPin,
  Layers,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface TeaRegionData {
  id: string;
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
  mapCoords: { x: number; y: number }; // Percentage on SVG map (0-100)
  tastingNotes: string[];
  productSearchTerm: string;
}

export const CEYLON_TEA_REGIONS: TeaRegionData[] = [
  {
    id: "nuwara-eliya",
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
    mapCoords: { x: 52, y: 64 },
    tastingNotes: ["Floral & Crisp", "Golden Liquor", "Spring Meadow Aroma", "Zero Bitterness"],
    productSearchTerm: "Nuwara Eliya",
  },
  {
    id: "dimbula",
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
    mapCoords: { x: 44, y: 67 },
    tastingNotes: ["Golden-Orange", "Crisp & Clean", "Refreshing Finish", "Misty Highlands"],
    productSearchTerm: "Dimbula",
  },
  {
    id: "uva",
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
    mapCoords: { x: 62, y: 63 },
    tastingNotes: ["Menthol Aroma", "Sweet Pungency", "Distinctive Exotic Taste", "Brisk Amber"],
    productSearchTerm: "Uva",
  },
  {
    id: "kandy",
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
    mapCoords: { x: 50, y: 55 },
    tastingNotes: ["Rich Copper Tone", "Perfect with Milk", "Strong & Brisk", "Historic Origin"],
    productSearchTerm: "Kandy",
  },
  {
    id: "uda-pussellawa",
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
    mapCoords: { x: 58, y: 58 },
    tastingNotes: ["Rosy Liquor", "Tangy Citrus", "Subtle Briskness", "Mountain Ridge"],
    productSearchTerm: "Uda Pussellawa",
  },
  {
    id: "ruhuna",
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
    mapCoords: { x: 50, y: 82 },
    tastingNotes: ["Deep Black Leaf", "Thick & Malty", "Sweet Caramel Note", "Rich Golden Tip"],
    productSearchTerm: "Ruhuna",
  },
  {
    id: "sabaragamuwa",
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
    mapCoords: { x: 42, y: 74 },
    tastingNotes: ["Rainforest Fed", "Sweet Malt Nuances", "Smooth Mouthfeel", "Fast-Steeping"],
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

  const whatsappInquiryLink = `https://wa.me/${whatsappNumber.replace(/\D/g, "").replace(/^0/, "94")}?text=${encodeURIComponent(
    `Hello LEENA CEYLON,\n\nI am visiting your website and would like to inquire about authentic Ceylon tea from the ${selectedRegion.defaultName} region.`
  )}`;

  return (
    <div className="space-y-6 sm:space-y-8">
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
        {/* Left Column: Authentic Interactive Map of Sri Lanka */}
        <div className="lg:col-span-6 relative flex flex-col items-center justify-center p-2 sm:p-4 bg-gradient-to-b from-[#F2F7F4] via-[#EBF3EE] to-[#F2F7F4] rounded-2xl border border-emerald-900/10 overflow-hidden min-h-[460px] sm:min-h-[520px]">
          {/* Subtle Atmospheric Watermark & Latitude Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#143424_0.75px,transparent_0.75px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

          {/* Cartographic Compass Rose */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-tea-border shadow-xs text-[11px] font-bold text-tea-forest">
            <Compass className="w-4 h-4 text-tea-leaf" />
            <span>SRI LANKA (CEYLON)</span>
          </div>

          {/* Elevation Color Legend */}
          <div className="absolute top-4 right-4 z-20 hidden sm:flex flex-col gap-1 p-2 rounded-xl bg-white/90 backdrop-blur-xs border border-tea-border shadow-xs text-[10px]">
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

          {/* SVG Map Container */}
          <div className="relative w-full max-w-[360px] sm:max-w-[420px] aspect-[3/4] flex items-center justify-center">
            {/* SVG Base Outline of Sri Lanka with Mountain Contour */}
            <svg
              viewBox="0 0 400 520"
              className="w-full h-full drop-shadow-md select-none"
              style={{ overflow: "visible" }}
            >
              <defs>
                {/* Coastal gradient */}
                <linearGradient id="slIslandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#F5FAF6" />
                  <stop offset="100%" stopColor="#E2EFE6" />
                </linearGradient>

                {/* Central Highland Massif gradient */}
                <radialGradient id="highlandContour" cx="50%" cy="65%" r="35%">
                  <stop offset="0%" stopColor="#C8E6C9" stopOpacity="0.9" />
                  <stop offset="45%" stopColor="#DCEFE0" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#E8F5E9" stopOpacity="0" />
                </radialGradient>

                {/* Peak Nuwara Eliya gradient */}
                <radialGradient id="peakGradient" cx="50%" cy="64%" r="18%">
                  <stop offset="0%" stopColor="#81C784" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#A5D6A7" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Sri Lanka Geographic Coastline Path (High Fidelity) */}
              <path
                d="M 195 25
                   C 210 35, 230 65, 235 90
                   C 240 120, 260 145, 275 180
                   C 290 220, 305 270, 290 320
                   C 275 370, 260 410, 230 450
                   C 200 485, 175 495, 155 480
                   C 130 465, 110 425, 115 370
                   C 120 320, 110 270, 125 220
                   C 135 180, 140 130, 155 90
                   C 165 60, 180 30, 195 25 Z"
                fill="url(#slIslandGradient)"
                stroke="#2D6A4F"
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />

              {/* Jaffna Peninsula in the Far North */}
              <path
                d="M 185 28
                   C 175 20, 160 12, 170 8
                   C 185 5, 205 10, 200 22 Z"
                fill="#EAF3EC"
                stroke="#2D6A4F"
                strokeWidth="1.5"
              />

              {/* Central Highland Elevation Contour (Where Ceylon Tea Thrives) */}
              <path
                d="M 160 250
                   C 200 240, 255 255, 260 295
                   C 265 340, 245 390, 210 405
                   C 170 415, 140 375, 145 320
                   C 148 285, 152 260, 160 250 Z"
                fill="url(#highlandContour)"
                stroke="#81C784"
                strokeWidth="1"
                strokeDasharray="4 3"
              />

              {/* Highest Peak Nuwara Eliya Central Elevation Zone */}
              <circle cx="208" cy="333" r="32" fill="url(#peakGradient)" />

              {/* Oceanic Directional Labels */}
              <text x="32" y="240" fill="#2D6A4F" opacity="0.35" fontSize="10" fontWeight="bold">
                INDIAN OCEAN
              </text>
              <text x="270" y="130" fill="#2D6A4F" opacity="0.35" fontSize="9" fontWeight="bold">
                BAY OF BENGAL
              </text>
              <text x="145" y="32" fill="#143424" opacity="0.5" fontSize="8" fontWeight="bold">
                Jaffna
              </text>
              <text x="95" y="340" fill="#143424" opacity="0.5" fontSize="8" fontWeight="bold">
                Colombo
              </text>
              <text x="135" y="475" fill="#143424" opacity="0.5" fontSize="8" fontWeight="bold">
                Galle
              </text>
            </svg>

            {/* Interactive Pins for the 7 Ceylon Tea Regions */}
            {CEYLON_TEA_REGIONS.map((region) => {
              const isSelected = selectedRegionId === region.id;
              const isFilteredOut =
                filterElevation !== "all" && region.elevationCategory !== filterElevation;

              const pinColor =
                region.elevationCategory === "high"
                  ? "bg-emerald-600 border-emerald-200 text-white"
                  : region.elevationCategory === "mid"
                  ? "bg-amber-600 border-amber-200 text-white"
                  : "bg-amber-800 border-amber-300 text-white";

              return (
                <div
                  key={region.id}
                  style={{
                    left: `${region.mapCoords.x}%`,
                    top: `${region.mapCoords.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className={`absolute z-30 transition-all duration-300 ${
                    isFilteredOut ? "opacity-25 pointer-events-none scale-75" : "opacity-100"
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
                    {/* Animated Pulsing Ring */}
                    {isSelected && (
                      <span className="absolute -inset-2 rounded-full bg-emerald-500 opacity-60 animate-ping pointer-events-none" />
                    )}

                    {/* Pin Head */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 shadow-lg flex items-center justify-center transition-all ${pinColor} ${
                        isSelected
                          ? "ring-4 ring-tea-gold ring-offset-2 scale-110 shadow-hover"
                          : "hover:ring-2 hover:ring-white"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current drop-shadow-xs" />
                    </div>

                    {/* Floating Label */}
                    <div
                      className={`absolute top-full mt-1.5 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all shadow-md pointer-events-none ${
                        isSelected
                          ? "bg-tea-dark text-white opacity-100 scale-100 border border-tea-gold/60"
                          : "bg-white/90 text-tea-dark opacity-85 group-hover:opacity-100 border border-tea-border"
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
          <div className="mt-3 text-center text-[11px] text-tea-muted font-medium z-10">
            <span>{t("regions.mapHelper", "👆 Tap any region marker on the map to explore its unique character")}</span>
          </div>
        </div>

        {/* Right Column: Active Destination Profile Showcase */}
        <div className="lg:col-span-6 space-y-4 text-left">
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

          {/* Tasting Notes Pills */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-tea-dark block mb-2">
              {t("regions.tastingNotes", "Aroma & Flavor Characteristics:")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedRegion.tastingNotes.map((note, idx) => (
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
              <ArrowRight className="w-3.5 h-3.5 text-tea-leaf rtl:rotate-180" />
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
                  ? "High Grown"
                  : region.elevationCategory === "mid"
                  ? "Mid Grown"
                  : "Low Grown"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
