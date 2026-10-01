import React from "react";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { FALLBACK_PRODUCTS, FALLBACK_CATEGORIES } from "@/lib/fallback-data";
import HomePageContent from "@/components/HomePageContent";
import { SEO_KEYWORDS } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Dynamic server rendering to always reflect live database updates

export const metadata: Metadata = {
  title: "LEENA CEYLON | Pure Ceylon Tea Sri Lanka - The Taste of Ceylon",
  description:
    "Official LEENA CEYLON website. Discover 100% Pure Ceylon Tea from Sri Lanka. Handpicked single-origin black tea, BOPF, and flavoured teas. Order online or via WhatsApp.",
  keywords: SEO_KEYWORDS,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LEENA CEYLON | Pure Ceylon Tea Sri Lanka - The Taste of Ceylon",
    description:
      "Official LEENA CEYLON website. Authentic Sri Lankan single-origin Ceylon tea directly from misty mountain estates.",
    url: "/",
    siteName: "LEENA CEYLON",
    images: [
      {
        url: "/images/ceylon-hero-plantation.jpg",
        width: 1200,
        height: 630,
        alt: "LEENA CEYLON - Pure Ceylon Tea Plantation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LEENA CEYLON | Pure Ceylon Tea Sri Lanka",
    description: "Official LEENA CEYLON store. 100% authentic Ceylon tea.",
    images: ["/images/ceylon-hero-plantation.jpg"],
  },
};

export default async function HomePage() {
  const settings = await getSiteSettings();

  // Fetch products & categories safely with fallback
  let allAvailableProducts: any[] = [];
  let categories: any[] = [];

  try {
    allAvailableProducts = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        sizes: {
          where: { isActive: true },
          orderBy: { regularPrice: "asc" },
        },
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
    });

    categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.warn("Could not load products from database, using resilient fallback data:", error);
    allAvailableProducts = FALLBACK_PRODUCTS as any;
    categories = FALLBACK_CATEGORIES as any;
  }

  if (!allAvailableProducts || allAvailableProducts.length === 0) {
    allAvailableProducts = FALLBACK_PRODUCTS as any;
  }
  if (!categories || categories.length === 0) {
    categories = FALLBACK_CATEGORIES as any;
  }

  // Fetch active promotion dynamically from database
  let activePromotion: any = null;
  try {
    const now = new Date();
    const activeCoupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const valid = activeCoupons.filter((c) => {
      if (c.startDate && new Date(c.startDate) > now) return false;
      if (c.endDate && new Date(c.endDate) < now) return false;
      if (c.usageLimit && c.timesUsed >= c.usageLimit) return false;
      return true;
    });
    if (valid.length > 0) {
      activePromotion = {
        id: valid[0].id,
        code: valid[0].code,
        discountType: valid[0].discountType,
        discountValue: valid[0].discountValue,
        minOrder: valid[0].minOrder,
        maxDiscount: valid[0].maxDiscount,
      };
    }
  } catch (promoErr) {
    console.warn("Could not load promotions:", promoErr);
  }

  // FAQ Schema for Google Rich Results
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What makes LEENA Ceylon Tea authentic and pure?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "LEENA CEYLON sources unblended 100% Pure Ceylon Tea directly from recognized high, medium, and low grown tea estates of Sri Lanka. Every batch is harvested from single-origin plantations and packed fresh under strict Ceylon tea quality standards.",
        },
      },
      {
        "@type": "Question",
        name: "How can I order LEENA Ceylon Tea via WhatsApp?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can click the 'Order via WhatsApp' button on any product or contact our official hotline at 071 777 4717 (+94 71 777 4717) for fast assistance, customized pack sizes, and direct bank transfer details.",
        },
      },
      {
        "@type": "Question",
        name: "What types of Ceylon Tea does LEENA provide?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "LEENA offers traditional high-grown black teas (such as BOPF, Pekoe, and OP), fragrant green teas, premium flavoured teas, and curated gift collections.",
        },
      },
      {
        "@type": "Question",
        name: "Do you deliver islandwide across Sri Lanka?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, LEENA CEYLON delivers islandwide across Sri Lanka with Cash on Delivery (COD) and direct bank transfer options. Free delivery is available on qualifying orders over Rs. 3,500.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomePageContent
        products={allAvailableProducts}
        categories={categories}
        settings={settings}
        activePromotion={activePromotion}
      />
    </>
  );
}
