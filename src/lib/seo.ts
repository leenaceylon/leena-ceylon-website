/**
 * Central SEO Configuration & Dynamic URL Resolution for LEENA CEYLON
 */

export function getBaseUrl(): string {
  // 1. Explicit custom domain if set by user in Vercel environment variables
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // 2. Production Vercel Deployment URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  // 3. Fallback to active production Vercel app
  return "https://leenaceylon.vercel.app";
}

export const BRAND_NAME = "LEENA CEYLON";
export const BRAND_TAGLINE = "Pure Ceylon Tea - The Taste of Ceylon";
export const DEFAULT_OFFICE_ADDRESS = "LEENA CEYLON (PVT) LTD, A/Bandarapothana, Pubbogama, Kekirawa, Sri Lanka";

export const SEO_KEYWORDS = [
  "LEENA",
  "Leena",
  "leena",
  "LEENA CEYLON",
  "Leena Ceylon",
  "leena ceylon",
  "leenaceylon",
  "leenaceylon vercel",
  "leenaceylon.vercel.app",
  "Leena Ceylon Website",
  "Leena Tea",
  "LEENA Tea",
  "leena tea",
  "Leena Ceylon Tea",
  "Leena Tea Sri Lanka",
  "Leena Pure Ceylon Tea",
  "Leena Tea Powder",
  "Ceylon Tea Sri Lanka",
  "Pure Ceylon Tea",
  "Buy Ceylon Tea Online",
  "Ceylon Black Tea",
  "Ceylon Tea BOPF",
  "Single Origin Ceylon Tea",
  "LEENA CEYLON PVT LTD",
  "Kekirawa Office",
  "Sri Lanka Tea Brand",
];
