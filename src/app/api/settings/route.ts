import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { getSiteSettings, updateSiteSetting, parseBankDetails } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(
      { success: true, settings },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

async function handleUpdate(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // If bankDetails was provided or structured bank fields were provided, ensure both sides are populated
    if (body.bankDetails) {
      const parsed = parseBankDetails(body.bankDetails);
      if (parsed.bankName && !body.bankName) body.bankName = parsed.bankName;
      if (parsed.bankAccountName && !body.bankAccountName) body.bankAccountName = parsed.bankAccountName;
      if (parsed.bankAccountNumber && !body.bankAccountNumber) body.bankAccountNumber = parsed.bankAccountNumber;
      if (parsed.bankBranch && !body.bankBranch) body.bankBranch = parsed.bankBranch;
      if (parsed.bankSwiftCode && !body.bankSwiftCode) body.bankSwiftCode = parsed.bankSwiftCode;
    } else if (body.bankName && body.bankAccountNumber) {
      let bDetails = `Bank: ${body.bankName}\nAccount Name: ${body.bankAccountName || "LEENA CEYLON (PVT) LTD"}\nAccount No: ${body.bankAccountNumber}\nBranch: ${body.bankBranch || "Kekirawa Branch"}${body.bankSwiftCode ? ` (Swift: ${body.bankSwiftCode})` : ""}`;
      if (body.bank2Name && body.bank2AccountNumber) {
        bDetails += `\n\nSecondary Account:\nBank: ${body.bank2Name}\nAccount Name: ${body.bank2AccountName || body.bankAccountName || "LEENA CEYLON (PVT) LTD"}\nAccount No: ${body.bank2AccountNumber}\nBranch: ${body.bank2Branch || ""}`;
      }
      body.bankDetails = bDetails;
    }

    for (const [key, value] of Object.entries(body)) {
      if (value === undefined || value === null) continue;

      let group = "GENERAL";
      if (key.includes("phone") || key.includes("email") || key.includes("address")) {
        group = "CONTACT";
      } else if (key.includes("Url") && !key.includes("logo") && !key.includes("favicon")) {
        group = "SOCIAL";
      } else if (key.includes("Delivery") || key.includes("minOrder")) {
        group = "DELIVERY";
      } else if (key.includes("Payment") || key.includes("bank") || key.includes("cashOn")) {
        group = "PAYMENT";
      } else if (key.toLowerCase().includes("whatsapp")) {
        group = "WHATSAPP";
      } else if (key.includes("seo")) {
        group = "SEO";
      }

      await updateSiteSetting(key, String(value), group);
    }

    try {
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "UPDATE_SETTINGS",
          details: `Updated website configuration settings`,
          entityType: "SiteSetting",
        },
      });
    } catch {}

    // Invalidate caches so customer storefront immediately serves fresh settings
    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/checkout");
      revalidatePath("/products");
    } catch (e) {
      console.warn("Revalidation warning:", e);
    }

    const updated = await getSiteSettings();
    return NextResponse.json(
      { success: true, settings: updated },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: any) {
    console.error("Settings update error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}
