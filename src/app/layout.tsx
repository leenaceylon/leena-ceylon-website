import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import CustomerLayoutWrapper from "@/components/CustomerLayoutWrapper";
import { getSiteSettings } from "@/lib/settings";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, SEO_KEYWORDS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteUrl = getBaseUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "LEENA CEYLON | Pure Ceylon Tea Sri Lanka - The Taste of Ceylon",
      template: `%s | ${settings.brandName || "LEENA CEYLON"}`,
    },
    description:
      settings.seoDescription ||
      "Official LEENA CEYLON store. Discover 100% Pure Ceylon Tea from Sri Lanka. Handpicked single-origin black tea, BOPF, and flavoured teas directly from Ceylon.",
    applicationName: "LEENA CEYLON",
    authors: [{ name: "LEENA CEYLON", url: siteUrl }],
    creator: "LEENA CEYLON (PVT) LTD",
    publisher: "LEENA CEYLON (PVT) LTD",
    category: "Food & Beverage",
    keywords: SEO_KEYWORDS,
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: [
        { url: settings.faviconUrl || "/brand/logo.png", sizes: "32x32", type: "image/png" },
        { url: settings.faviconUrl || "/brand/logo.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: settings.logoUrl || "/brand/logo.png", sizes: "180x180", type: "image/png" }],
      shortcut: [settings.faviconUrl || "/brand/logo.png"],
    },
    openGraph: {
      title: "LEENA CEYLON | Pure Ceylon Tea Sri Lanka - The Taste of Ceylon",
      description:
        settings.seoDescription ||
        "Official LEENA CEYLON website. Experience 100% authentic, single-origin Ceylon tea directly from Sri Lanka.",
      url: siteUrl,
      siteName: "LEENA CEYLON",
      locale: "en_LK",
      type: "website",
      images: [
        {
          url: "/images/ceylon-hero-plantation.jpg",
          width: 1200,
          height: 630,
          alt: "LEENA CEYLON - Pure Ceylon Tea Plantation in Sri Lanka",
        },
        {
          url: settings.logoUrl || "/brand/logo.png",
          width: 800,
          height: 800,
          alt: "LEENA CEYLON Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "LEENA CEYLON | Pure Ceylon Tea Sri Lanka",
      description:
        "Official LEENA CEYLON store. Handpicked 100% authentic Ceylon tea directly from Sri Lanka.",
      site: "@leenaceylon",
      creator: "@leenaceylon",
      images: ["/images/ceylon-hero-plantation.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <StructuredData settings={settings} />
      </head>
      <body className="antialiased selection:bg-tea-leaf selection:text-white">
        <CartProvider>
          <CustomerLayoutWrapper settings={settings}>
            {children}
          </CustomerLayoutWrapper>
        </CartProvider>
      </body>
    </html>
  );
}
