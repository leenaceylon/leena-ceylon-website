"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  LanguageCode,
  LanguageInfo,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from "@/lib/translations";

interface LanguageContextType {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  isRTL: boolean;
  currentLangInfo: LanguageInfo;
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "leena_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && ["en", "si", "ta", "ar"].includes(saved)) {
        setLangState(saved);
        applyHtmlAttributes(saved);
      } else {
        // Fallback: Check browser language
        const navLang = navigator.language?.toLowerCase() || "";
        if (navLang.startsWith("si")) {
          setLangState("si");
          applyHtmlAttributes("si");
        } else if (navLang.startsWith("ta")) {
          setLangState("ta");
          applyHtmlAttributes("ta");
        } else if (navLang.startsWith("ar")) {
          setLangState("ar");
          applyHtmlAttributes("ar");
        } else {
          applyHtmlAttributes("en");
        }
      }
    } catch (e) {
      // Local storage not accessible
      applyHtmlAttributes("en");
    }
    setMounted(true);
  }, []);

  const applyHtmlAttributes = (selectedLang: LanguageCode) => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = selectedLang;
      document.documentElement.dir = selectedLang === "ar" ? "rtl" : "ltr";
    }
  };

  const setLang = (newLang: LanguageCode) => {
    setLangState(newLang);
    applyHtmlAttributes(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      console.warn("Could not save language to localStorage:", e);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const localized = TRANSLATIONS[lang]?.[key];
    if (localized) return localized;
    const enFallback = TRANSLATIONS["en"]?.[key];
    if (enFallback) return enFallback;
    return fallback !== undefined ? fallback : key;
  };

  const currentLangInfo =
    SUPPORTED_LANGUAGES.find((item) => item.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t,
        isRTL: lang === "ar",
        currentLangInfo,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      lang: "en" as LanguageCode,
      setLang: () => {},
      t: (key: string, fallback?: string) => fallback || key,
      isRTL: false,
      currentLangInfo: SUPPORTED_LANGUAGES[0],
      languages: SUPPORTED_LANGUAGES,
    };
  }
  return context;
}
