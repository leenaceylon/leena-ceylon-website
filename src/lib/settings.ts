import prisma from "./prisma";
import { SiteSettingsMap } from "@/types";

export const DEFAULT_SETTINGS: SiteSettingsMap = {
  brandName: "LEENA CEYLON",
  brandTagline: "PURE CEYLON TEA",
  secondaryTagline: "THE TASTE OF CEYLON",
  logoUrl: "/brand/logo.png",
  faviconUrl: "/brand/logo.png",
  currencySymbol: "Rs.",
  phone: "071 777 4717",
  whatsappNumber: "071 777 4717",
  email: "info@leenaceylon.com",
  address: "LEENA CEYLON (PVT) LTD, A/Bandarapothana, Pubbogama, Kekirawa, Sri Lanka",
  facebookUrl: "https://facebook.com/leenaceylon",
  instagramUrl: "https://instagram.com/leenaceylon",
  tiktokUrl: "https://tiktok.com/@leenaceylon",
  youtubeUrl: "https://youtube.com/@leenaceylon",
  standardDeliveryFee: 350,
  freeDeliveryThreshold: 3500,
  minOrderAmount: 500,
  cashOnDeliveryEnabled: true,
  bankTransferEnabled: true,
  bankDetails:
    "Bank: Commercial Bank of Ceylon PLC\nAccount Name: LEENA CEYLON (PVT) LTD\nAccount No: 1000 2489 7120\nBranch: Kekirawa Branch\nSwift: CCEYLKLX",
  whatsappButtonText: "ORDER VIA WHATSAPP",
  whatsappTemplate:
    "Hello LEENA CEYLON,\n\nI am interested in:\n{{product_name}}\n\nWeight:\n{{size}}\n\nPrice:\nRs. {{price}}\n\nPlease provide more details.",
  whatsappEnabled: true,
  seoTitle: "LEENA | Pure Ceylon Tea Sri Lanka - The Taste of Ceylon",
  seoDescription:
    "Official LEENA CEYLON store. Discover 100% Pure Ceylon Tea from Sri Lanka. Handpicked single-origin black tea, green tea, and flavoured teas directly from Ceylon.",
};

export async function getSiteSettings(): Promise<SiteSettingsMap> {
  try {
    const settings = await prisma.siteSetting.findMany();
    const map = { ...DEFAULT_SETTINGS };

    for (const s of settings) {
      if (s.key === "standardDeliveryFee" || s.key === "freeDeliveryThreshold" || s.key === "minOrderAmount") {
        (map as any)[s.key] = Number(s.value) || 0;
      } else if (
        s.key === "cashOnDeliveryEnabled" ||
        s.key === "bankTransferEnabled" ||
        s.key === "whatsappEnabled"
      ) {
        (map as any)[s.key] = s.value === "true";
      } else {
        (map as any)[s.key] = s.value;
      }
    }

    return map;
  } catch (error) {
    console.error("Failed to load settings from DB, using defaults:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSiteSetting(key: string, value: string, group = "GENERAL") {
  return prisma.siteSetting.upsert({
    where: { key },
    update: { value, group },
    create: { key, value, group },
  });
}
