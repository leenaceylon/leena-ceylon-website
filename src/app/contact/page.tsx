import React from "react";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import ContactPageClient from "@/components/ContactPageClient";
import { getBaseUrl, SEO_KEYWORDS } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/contact`;

  return {
    title: `Contact Us | ${settings.brandName || "LEENA CEYLON"} - Pure Ceylon Tea Sri Lanka`,
    description:
      "Get in touch with LEENA CEYLON. Visit our central office in Kekirawa, order directly via WhatsApp, or reach out for wholesale export inquiries.",
    keywords: [
      ...SEO_KEYWORDS,
      "Contact LEENA CEYLON",
      "LEENA Ceylon Tea Address",
      "Ceylon Tea Kekirawa Office",
      "LEENA Tea WhatsApp Number",
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `Contact Us | ${settings.brandName || "LEENA CEYLON"}`,
      description:
        "Visit our head office in Kekirawa or order directly via WhatsApp and online with islandwide delivery.",
      url: pageUrl,
      siteName: settings.brandName || "LEENA CEYLON",
      type: "website",
    },
  };
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return <ContactPageClient settings={settings} />;
}
