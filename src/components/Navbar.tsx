"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Menu,
  X,
  Phone,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Truck,
  Award,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function Navbar({
  logoUrl = "/brand/logo.png",
  phone = "071 777 4717",
  whatsappNumber = "071 777 4717",
}: {
  logoUrl?: string;
  phone?: string;
  whatsappNumber?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { name: t("nav.home", "Home"), href: "/" },
    { name: t("nav.products", "Products"), href: "/products" },
    { name: t("nav.ceylonTea", "Ceylon Tea"), href: "/ceylon-tea" },
    { name: t("nav.trackOrder", "Track Order"), href: "/track" },
    { name: t("nav.about", "About"), href: "/about" },
    { name: t("nav.contact", "Contact"), href: "/contact" },
  ];

  return (
    <>
      {/* Top Banner */}
      <div className="bg-tea-dark text-white text-xs py-2 px-4 border-b border-tea-forest/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-light tracking-wide text-tea-pale/90">
              {t("banner.pureCeylon", "100% Pure Ceylon Single-Origin Tea • Direct from Sri Lanka")}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-4 text-tea-pale/80 text-[11px]">
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-1.5 hover:text-white transition"
              >
                <Phone className="w-3 h-3 text-tea-gold" />
                <span>{phone}</span>
              </a>
              <span className="text-white/20">|</span>
              <Link
                href="/track"
                className="flex items-center gap-1 text-tea-pale/90 hover:text-white transition"
              >
                <Truck className="w-3.5 h-3.5 text-tea-gold" />
                <span>{t("nav.trackOrder", "Track Order")}</span>
              </Link>
              <span className="text-white/20">|</span>
              <span className="hidden md:inline-flex items-center gap-1 text-tea-gold font-medium">
                <Award className="w-3.5 h-3.5" />
                <span>{t("badge.registeredExporter", "Registered Ceylon Tea Exporter")}</span>
              </span>
              <span className="text-white/20 hidden md:inline">|</span>
              <span className="flex items-center gap-1 text-tea-gold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t("banner.guarantee", "100% Pure Ceylon Guarantee")}</span>
              </span>
            </div>

            {/* Language Switcher in Top Bar */}
            <LanguageSelector variant="nav" />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-all duration-200 border-b ${
          scrolled ? "shadow-subtle border-tea-border py-2" : "border-tea-border/60 py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Mobile Hamburger Button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 -ml-2 rounded-lg text-tea-dark hover:text-tea-forest hover:bg-tea-bg transition"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Official Brand Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center group">
                <div className="relative h-12 sm:h-14 w-40 sm:w-48 transition-transform group-hover:scale-[1.02]">
                  <Image
                    src={logoUrl || "/brand/logo.png"}
                    alt="LEENA CEYLON - Pure Ceylon Tea"
                    fill
                    sizes="(max-width: 640px) 160px, 192px"
                    className="object-contain object-left"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8 rtl:space-x-reverse">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm tracking-wider uppercase font-medium transition-colors relative py-1 ${
                      isActive
                        ? "text-tea-forest font-semibold"
                        : "text-tea-dark hover:text-tea-forest"
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-tea-forest rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Icons: Language Switcher, Search & Direct WhatsApp Order */}
            <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
              {/* Language Switcher in Sticky Header */}
              <LanguageSelector variant="header" />

              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-tea-dark hover:text-tea-forest hover:bg-tea-bg rounded-full transition"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Direct WhatsApp Order CTA Button */}
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "") || "94717774717"}?text=Hello%20LEENA%20CEYLON,%20I%20would%20like%20to%20order%20pure%20Ceylon%20tea.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm hover:shadow active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span className="hidden sm:inline">{t("nav.whatsappOrder", "WhatsApp Order")}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Collapsible Search Bar */}
        {searchOpen && (
          <div className="border-t border-tea-border bg-tea-bg/90 px-4 py-3 sm:px-6">
            <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={t(
                    "nav.searchPlaceholder",
                    "Search pure Ceylon tea, tea powder, BOPF, grades (e.g. BOPF, Lemon)..."
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 text-sm rounded-xl border border-tea-border bg-white focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf transition"
                  autoFocus
                />
                <Search className={`w-4 h-4 text-tea-muted absolute ${isRTL ? "right-3.5" : "left-3.5"} top-3`} />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-tea-dark hover:bg-tea-forest text-white text-sm font-medium rounded-xl transition"
              >
                {t("nav.searchButton", "Search")}
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-2 text-tea-muted hover:text-tea-dark"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-tea-dark/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div
            className={`fixed inset-y-0 ${
              isRTL ? "right-0" : "left-0"
            } max-w-xs w-full bg-white shadow-xl z-50 flex flex-col justify-between overflow-y-auto`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between pb-6 border-b border-tea-border">
                <div className="relative h-12 w-36">
                  <Image
                    src={logoUrl || "/brand/logo.png"}
                    alt="LEENA CEYLON"
                    fill
                    className="object-contain object-left"
                  />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-tea-muted hover:text-tea-dark rounded-lg"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Taglines */}
              <div className="py-3 text-xs tracking-wider text-tea-forest font-semibold uppercase border-b border-tea-border/60">
                PURE CEYLON TEA • THE TASTE OF CEYLON
              </div>

              {/* Links */}
              <nav className="mt-4 space-y-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? "bg-tea-leaf/10 text-tea-forest font-bold"
                          : "text-tea-dark hover:bg-tea-bg"
                      }`}
                    >
                      <span>{link.name}</span>
                      <ChevronRight className="w-4 h-4 text-tea-muted rtl:rotate-180" />
                    </Link>
                  );
                })}

                <div className="pt-4 border-t border-tea-border/60 mt-4 space-y-1">
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/\D/g, "") || "94717774717"}?text=Hello%20LEENA%20CEYLON,%20I%20would%20like%20to%20order%20pure%20Ceylon%20tea.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600 fill-current" />
                      {t("nav.whatsappOrder", "Direct WhatsApp Order")}
                    </span>
                    <ChevronRight className="w-4 h-4 text-emerald-700 rtl:rotate-180" />
                  </a>
                </div>
              </nav>

              {/* Mobile Drawer Language Selector */}
              <div className="mt-6 pt-5 border-t border-tea-border">
                <LanguageSelector variant="grid" />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 bg-tea-bg border-t border-tea-border space-y-3">
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "") || "94717774717"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold tracking-wide uppercase transition"
              >
                <MessageSquare className="w-4 h-4" />
                {t("modal.title", "Order via WhatsApp")}
              </a>

              <div className="text-center text-[11px] text-tea-muted">
                Sri Lanka Headquarters: {phone}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
