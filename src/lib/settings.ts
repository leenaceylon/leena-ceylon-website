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
  bankName: "Commercial Bank of Ceylon PLC",
  bankAccountName: "LEENA CEYLON (PVT) LTD",
  bankAccountNumber: "1000 2489 7120",
  bankBranch: "Kekirawa Branch",
  bankSwiftCode: "CCEYLKLX",
  bankInstructions: "Please transfer the total amount and share your payment receipt / bank slip screenshot on WhatsApp.",
  bank2Name: "",
  bank2AccountName: "",
  bank2AccountNumber: "",
  bank2Branch: "",
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

export function parseBankDetails(text: string): Partial<SiteSettingsMap> {
  if (!text) return {};
  const res: Partial<SiteSettingsMap> = {};

  const bankMatch = text.match(/(?:Bank(?:\s*Name)?)\s*:\s*([^\r\n]+)/i);
  if (bankMatch) res.bankName = bankMatch[1].trim();

  const accNameMatch = text.match(/(?:Account\s*Name|Beneficiary(?:\s*Name)?|Acc\s*Name|Holder)\s*:\s*([^\r\n]+)/i);
  if (accNameMatch) res.bankAccountName = accNameMatch[1].trim();

  const accNoMatch = text.match(/(?:Account\s*No(?:\.|mber)?|Acc\s*No(?:\.|mber)?|Acc\s*#|Account)\s*:\s*([0-9\s]+)/i);
  if (accNoMatch) res.bankAccountNumber = accNoMatch[1].trim();

  const branchMatch = text.match(/(?:Branch(?:\s*Name)?)\s*:\s*([^\r\n(]+)/i);
  if (branchMatch) res.bankBranch = branchMatch[1].trim();

  const swiftMatch = text.match(/(?:Swift(?:\s*Code)?)\s*:\s*([^\r\n)]+)/i);
  if (swiftMatch) res.bankSwiftCode = swiftMatch[1].trim();

  return res;
}

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

    const hasDbBankDetails = settings.some((s) => s.key === "bankDetails" && Boolean(s.value?.trim()));
    const hasDbBankName = settings.some((s) => s.key === "bankName" && Boolean(s.value?.trim()));
    const hasDbBankAccNo = settings.some((s) => s.key === "bankAccountNumber" && Boolean(s.value?.trim()));
    const hasDbBankAccountName = settings.some((s) => s.key === "bankAccountName" && Boolean(s.value?.trim()));
    const hasDbBankBranch = settings.some((s) => s.key === "bankBranch" && Boolean(s.value?.trim()));
    const hasDbBankSwift = settings.some((s) => s.key === "bankSwiftCode" && Boolean(s.value?.trim()));

    // 1. If database has bankDetails string, extract any fields not explicitly set as rows in DB
    if (hasDbBankDetails && map.bankDetails) {
      const parsed = parseBankDetails(map.bankDetails);
      if (parsed.bankName && !hasDbBankName) map.bankName = parsed.bankName;
      if (parsed.bankAccountName && !hasDbBankAccountName) map.bankAccountName = parsed.bankAccountName;
      if (parsed.bankAccountNumber && !hasDbBankAccNo) map.bankAccountNumber = parsed.bankAccountNumber;
      if (parsed.bankBranch && !hasDbBankBranch) map.bankBranch = parsed.bankBranch;
      if (parsed.bankSwiftCode && !hasDbBankSwift) map.bankSwiftCode = parsed.bankSwiftCode;
    }

    // 2. If structured fields were explicitly updated in DB, format bankDetails to match them
    if (hasDbBankName || hasDbBankAccNo || hasDbBankAccountName) {
      let bDetails = `Bank: ${map.bankName}\nAccount Name: ${map.bankAccountName || "LEENA CEYLON (PVT) LTD"}\nAccount No: ${map.bankAccountNumber}\nBranch: ${map.bankBranch || "Kekirawa Branch"}${map.bankSwiftCode ? ` (Swift: ${map.bankSwiftCode})` : ""}`;
      if (map.bank2Name && map.bank2AccountNumber) {
        bDetails += `\n\nSecondary Account:\nBank: ${map.bank2Name}\nAccount Name: ${map.bank2AccountName || map.bankAccountName || "LEENA CEYLON (PVT) LTD"}\nAccount No: ${map.bank2AccountNumber}\nBranch: ${map.bank2Branch || ""}`;
      }
      map.bankDetails = bDetails;
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
