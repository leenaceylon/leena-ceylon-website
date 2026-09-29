import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { getSiteSettings, updateSiteSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ success: true, settings });
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

    for (const [key, value] of Object.entries(body)) {
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

    const updated = await getSiteSettings();
    return NextResponse.json({ success: true, settings: updated });
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
