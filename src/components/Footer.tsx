"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, MessageSquare, ShieldCheck, Heart } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function Footer({
  logoUrl = "/brand/logo.png",
  phone = "071 777 4717",
  whatsappNumber = "071 777 4717",
  email = "info@leenaceylon.com",
  address = "LEENA CEYLON (PVT) LTD, A/Bandarapothana, Pubbogama, Kekirawa, Sri Lanka",
}: {
  logoUrl?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
}) {
  const { t } = useLanguage();

  return (
    <footer className="bg-tea-dark text-white border-t border-tea-forest/40">
      {/* Upper Footer: Value Props */}
      <div className="border-b border-white/10 bg-black/15 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-tea-forest/60 border border-tea-leaf/30 flex items-center justify-center shrink-0 text-tea-gold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">100% Pure Ceylon</h4>
              <p className="text-xs text-tea-pale/70">Authentic single-origin tea from Sri Lanka</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-tea-forest/60 border border-tea-leaf/30 flex items-center justify-center shrink-0 text-tea-gold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Order via WhatsApp</h4>
              <p className="text-xs text-tea-pale/70">Direct ordering & instant inquiry support</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-tea-forest/60 border border-tea-leaf/30 flex items-center justify-center shrink-0 text-tea-gold">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Island-wide Delivery</h4>
              <p className="text-xs text-tea-pale/70">Fast, secure doorstep delivery across Sri Lanka</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-tea-forest/60 border border-tea-leaf/30 flex items-center justify-center shrink-0 text-tea-gold">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Export Quality Standard</h4>
              <p className="text-xs text-tea-pale/70">Master blended for aroma, taste & briskness</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <div className="relative h-16 w-52 bg-white/95 p-2 rounded-xl">
                <Image
                  src={logoUrl || "/brand/logo.png"}
                  alt="LEENA CEYLON - PURE CEYLON TEA"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>

            <div className="pt-2">
              <p className="font-serif text-tea-gold text-sm tracking-widest uppercase font-semibold">
                PURE CEYLON TEA
              </p>
              <p className="text-xs tracking-wider text-tea-pale/80 uppercase">
                {t("footer.tagline", "THE TASTE OF CEYLON")}
              </p>
            </div>

            <p className="text-xs text-tea-pale/70 leading-relaxed max-w-sm">
              Discover the authentic taste, aroma and character of Pure Ceylon Tea from Sri Lanka. Carefully handpicked from the central mountain estates and delivered fresh to your teacup.
            </p>

            <div className="pt-2 flex flex-col gap-3">
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "") || "94717774717"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm w-fit"
              >
                <MessageSquare className="w-4 h-4" />
                Chat on WhatsApp
              </a>

              {/* Language Selector in Footer */}
              <div className="pt-2">
                <LanguageSelector variant="footer" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm font-semibold tracking-wider uppercase text-white">
              {t("footer.quickLinks", "Shop Tea")}
            </h4>
            <ul className="space-y-2.5 text-xs text-tea-pale/80">
              <li>
                <Link href="/products" className="hover:text-white transition">
                  {t("nav.allTeas", "All Products")}
                </Link>
              </li>
              <li>
                <Link href="/products?category=tea-powder" className="hover:text-white transition">
                  {t("cat.teaPowder.title", "Ceylon Tea Powder")}
                </Link>
              </li>
              <li>
                <Link href="/products?category=ceylon-black-tea" className="hover:text-white transition">
                  {t("cat.blackTea.title", "Ceylon Black Tea (BOPF)")}
                </Link>
              </li>
              <li>
                <Link href="/products?category=premium-tin-collection" className="hover:text-white transition">
                  {t("cat.tinCollection.title", "Premium Tin Collection")}
                </Link>
              </li>
              <li>
                <Link href="/products?category=flavored-ceylon-tea" className="hover:text-white transition">
                  {t("cat.flavoredTea.title", "Flavored Lemon Tea")}
                </Link>
              </li>
              <li>
                <Link href="/products?category=ceylon-spices" className="hover:text-white transition">
                  {t("cat.spices.title", "Ceylon Organic Cinnamon")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Discover & Learn */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm font-semibold tracking-wider uppercase text-white">
              {t("nav.ceylonTea", "Explore Ceylon")}
            </h4>
            <ul className="space-y-2.5 text-xs text-tea-pale/80">
              <li>
                <Link href="/ceylon-tea" className="hover:text-white transition">
                  7 Tea Growing Regions
                </Link>
              </li>
              <li>
                <Link href="/ceylon-tea#grades" className="hover:text-white transition">
                  Tea Grades Explained
                </Link>
              </li>
              <li>
                <Link href="/ceylon-tea#elevations" className="hover:text-white transition">
                  High, Medium & Low Grown
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  {t("nav.about", "Our Brand Story")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  {t("nav.contact", "Contact Us")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  {t("footer.customerService", "Customer Support")}
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-white transition font-medium text-tea-gold">
                  {t("nav.trackOrder", "Track Order (Live Status)")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm font-semibold tracking-wider uppercase text-white">
              {t("footer.contactUs", "Contact & Support")}
            </h4>
            <ul className="space-y-3 text-xs text-tea-pale/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-tea-gold shrink-0 mt-0.5" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-tea-gold shrink-0" />
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-white transition">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, "") || "94717774717"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  WhatsApp: {whatsappNumber}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-tea-gold shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition">
                  {email}
                </a>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/admin/login"
                className="text-[11px] text-tea-pale/50 hover:text-tea-gold transition"
              >
                Admin Portal Login →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-tea-pale/60">
          <p>© {new Date().getFullYear()} LEENA CEYLON. {t("footer.allRights", "All rights reserved.")}</p>
          <div className="flex items-center space-x-6">
            <Link href="/privacy-policy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
