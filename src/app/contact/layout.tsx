import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Contact LEENA CEYLON | Official Phone, WhatsApp & Address Sri Lanka",
  description:
    "Get in touch with LEENA CEYLON. Contact our tea specialists via WhatsApp, phone (071 777 4717), email, or visit our headquarters in Sri Lanka for orders, wholesale, and export inquiries.",
  keywords: [
    "Contact Leena Ceylon",
    "Leena Ceylon phone number",
    "Leena Ceylon WhatsApp",
    "Leena tea address",
    "Leena Ceylon Sri Lanka",
  ],
  alternates: {
    canonical: "https://leenaceylon.com/contact",
  },
  openGraph: {
    title: "Contact LEENA CEYLON | Official Phone, WhatsApp & Address",
    description:
      "Direct inquiries, WhatsApp ordering support, and customer care for LEENA CEYLON pure Sri Lankan tea.",
    url: "https://leenaceylon.com/contact",
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
    description: "Connect with LEENA CEYLON for tea orders and inquiries.",
    images: ["/images/ceylon-hero-plantation.jpg"],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact LEENA CEYLON",
    url: "https://leenaceylon.com/contact",
    mainEntity: {
      "@type": "Organization",
      name: "LEENA CEYLON",
      alternateName: "LEENA",
      telephone: "+94 71 777 4717",
      email: "info@leenaceylon.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "A/Bandarapothana, Pubbogama",
        addressLocality: "Kekirawa",
        addressRegion: "North Central Province",
        addressCountry: "LK",
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
        item: "https://leenaceylon.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Contact Us",
        item: "https://leenaceylon.com/contact",
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
