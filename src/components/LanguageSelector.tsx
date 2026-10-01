"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageCode, LanguageInfo } from "@/lib/translations";
import { Globe, ChevronDown, Check } from "lucide-react";

interface LanguageSelectorProps {
  variant?: "nav" | "header" | "grid" | "footer" | "pill";
  className?: string;
}

export default function LanguageSelector({
  variant = "nav",
  className = "",
}: LanguageSelectorProps) {
  const { lang, setLang, currentLangInfo, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Grid variant: Great for Mobile Drawer and large modals
  if (variant === "grid") {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-tea-muted">
          <Globe className="w-3.5 h-3.5 text-tea-forest" />
          <span>Language / භාෂාව / மொழி / اللغة</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {languages.map((item: LanguageInfo) => {
            const isSelected = item.code === lang;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setLang(item.code)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition ${
                  isSelected
                    ? "bg-tea-forest text-white border-tea-forest shadow-sm"
                    : "bg-white text-tea-dark border-tea-border hover:border-tea-leaf/50 hover:bg-tea-surface"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{item.flag}</span>
                  <div className="text-left">
                    <span className="block font-semibold leading-tight">{item.nativeName}</span>
                    <span className={`text-[10px] block ${isSelected ? "text-tea-pale/80" : "text-tea-muted"}`}>
                      {item.label}
                    </span>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Footer variant: Horizontal pill buttons
  if (variant === "footer") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <span className="text-xs text-tea-pale/70 flex items-center gap-1.5 mr-1">
          <Globe className="w-3.5 h-3.5 text-tea-gold" />
          <span>Language:</span>
        </span>
        {languages.map((item: LanguageInfo) => {
          const isSelected = item.code === lang;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setLang(item.code)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                isSelected
                  ? "bg-tea-forest text-white shadow-xs"
                  : "bg-white/10 text-tea-pale/80 hover:bg-white/20 hover:text-white"
              }`}
            >
              <span>{item.flag}</span>
              <span>{item.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default Nav Dropdown (Compact, perfect for Header/Top Bar)
  const isHeader = variant === "header";
  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
          isHeader
            ? "bg-tea-surface/80 hover:bg-tea-surface text-tea-dark border-tea-border shadow-xs hover:border-tea-leaf/40"
            : "bg-white/10 hover:bg-white/20 text-white border-white/10"
        }`}
        aria-expanded={isOpen}
        aria-label="Select Language"
      >
        <span className="text-sm leading-none">{currentLangInfo.flag}</span>
        <span className={`font-semibold ${isHeader ? "text-tea-dark" : "text-tea-pale"}`}>
          {currentLangInfo.nativeName}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${
            isHeader ? "text-tea-muted" : "text-tea-pale"
          } ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white shadow-xl border border-tea-border py-1.5 z-50 animate-fade-in text-tea-dark">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-tea-muted border-b border-tea-border/50">
            Select Language
          </div>
          {languages.map((item: LanguageInfo) => {
            const isSelected = item.code === lang;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLang(item.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition text-left ${
                  isSelected
                    ? "bg-tea-forest/10 text-tea-forest font-bold"
                    : "hover:bg-tea-surface text-tea-dark"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{item.flag}</span>
                  <div>
                    <span className="block leading-tight font-medium">{item.nativeName}</span>
                    <span className="text-[10px] text-tea-muted leading-tight block">
                      {item.label}
                    </span>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-tea-forest" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
