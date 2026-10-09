import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const unreadCount = await prisma.inquiry.count({
      where: { status: "UNREAD" },
    });

    return NextResponse.json({
      success: true,
      inquiries,
      unreadCount,
    });
  } catch (err: any) {
    console.error("Failed to load inquiries:", err);
    return NextResponse.json({ error: "Failed to load inquiries" }, { status: 500 });
  }
}
