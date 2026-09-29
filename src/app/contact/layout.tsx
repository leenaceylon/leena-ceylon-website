import type { Metadata } from "next";
import React from "react";
import { getBaseUrl, SEO_KEYWORDS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact LEENA CEYLON | Head Office Kekirawa - Phone & WhatsApp Support",
  description:
    "Contact LEENA CEYLON (PVT) LTD head office in Kekirawa, Sri Lanka. Reach our team directly via WhatsApp, phone (071 777 4717), or email for tea orders, delivery tracking, and wholesale inquiries.",
  keywords: [
    ...SEO_KEYWORDS,
    "Contact Leena Ceylon",
    "Leena Ceylon phone number",
    "Leena Ceylon WhatsApp",
    "Leena tea Kekirawa office",
    "Leena Ceylon Sri Lanka",
    "LEENA CEYLON address",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact LEENA CEYLON | Official Phone, WhatsApp & Head Office Address",
    description:
      "Direct inquiries, WhatsApp ordering support, and customer care for LEENA CEYLON pure Sri Lankan tea.",
    url: "/contact",
    siteName: "LEENA CEYLON",
    images: [
      {
        url: "/images/ceylon-hero-plantation.jpg",
        width: 1200,
        height: 630,
        alt: "Contact LEENA CEYLON",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact LEENA CEYLON | Official Phone & WhatsApp",
    description: "Connect with LEENA CEYLON for tea orders and customer care.",
    images: ["/images/ceylon-hero-plantation.jpg"],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseUrl = getBaseUrl();

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact LEENA CEYLON",
    url: `${baseUrl}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: "LEENA CEYLON",
      alternateName: ["LEENA", "Leena Ceylon", "leenaceylon", "Leena Tea"],
      telephone: "+94 71 777 4717",
      email: "info@leenaceylon.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "A/Bandarapothana, Pubbogama",
        addressLocality: "Kekirawa",
        addressRegion: "North Central Province",
        addressCountry: "LK",
        description: "LEENA CEYLON Head Office",
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Contact Us",
        item: `${baseUrl}/contact`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
