import React from "react";
import { SiteSettingsMap } from "@/types";

interface StructuredDataProps {
  settings: SiteSettingsMap;
}

export default function StructuredData({ settings }: StructuredDataProps) {
  const baseUrl = "https://leenaceylon.com";
  const brandName = settings.brandName || "LEENA CEYLON";

  // Organization Schema for Google Knowledge Graph & Brand recognition
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "LEENA",
    legalName: "LEENA CEYLON (PVT) LTD",
    alternateName: [
      "Leena",
      "LEENA CEYLON",
      "Leena Ceylon Tea",
      "Leena Tea",
      "Leena Sri Lanka",
      "LEENA Pure Ceylon Tea",
    ],
    url: baseUrl,
    logo: `${baseUrl}/brand/logo.png`,
    image: `${baseUrl}/images/ceylon-hero-plantation.jpg`,
    description:
      "LEENA (LEENA CEYLON) is an authentic Sri Lankan tea brand producing 100% Pure Ceylon Tea sourced directly from single-origin high and low grown tea estates of Sri Lanka.",
    telephone: settings.phone || "+94 71 777 4717",
    email: settings.email || "info@leenaceylon.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "A/Bandarapothana, Pubbogama",
      addressLocality: "Kekirawa",
      addressRegion: "North Central Province",
      addressCountry: "LK",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+94 71 777 4717",
      contactType: "customer service",
      areaServed: ["LK", "Worldwide"],
      availableLanguage: ["English", "Sinhala"],
    },
    sameAs: [
      settings.facebookUrl || "https://facebook.com/leenaceylon",
      settings.instagramUrl || "https://instagram.com/leenaceylon",
      settings.tiktokUrl || "https://tiktok.com/@leenaceylon",
      settings.youtubeUrl || "https://youtube.com/@leenaceylon",
    ].filter(Boolean),
  };

  // WebSite Schema with SearchAction for Google Sitelinks Search Box
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: "LEENA",
    alternateName: ["LEENA CEYLON", "Leena Ceylon Tea", "Leena Tea"],
    url: baseUrl,
    description: "Official LEENA CEYLON website. 100% Pure Ceylon Tea from Sri Lanka.",
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // LocalBusiness / Store Schema
  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${baseUrl}/#store`,
    name: "LEENA CEYLON",
    alternateName: ["LEENA", "Leena Tea Store"],
    image: `${baseUrl}/brand/logo.png`,
    url: baseUrl,
    telephone: settings.phone || "+94 71 777 4717",
    priceRange: "$$",
    currenciesAccepted: "LKR, USD",
    paymentAccepted: "Cash, Bank Transfer, WhatsApp Direct Order",
    address: {
      "@type": "PostalAddress",
      streetAddress: "A/Bandarapothana, Pubbogama",
      addressLocality: "Kekirawa",
      addressRegion: "North Central Province",
      addressCountry: "LK",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
    </>
  );
}
