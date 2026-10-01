import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = body.code ? String(body.code).trim().toUpperCase() : "";
    const subtotal = Math.max(0, Number(body.subtotal) || 0);

    if (!rawCode) {
      return NextResponse.json(
        { valid: false, message: "Please enter a coupon code." },
        { status: 400 }
      );
    }

    let coupon: any = null;

    try {
      coupon = await prisma.coupon.findUnique({
        where: { code: rawCode },
      });
    } catch (dbErr) {
      console.warn("Coupon DB lookup failed:", dbErr);
    }

    if (!coupon || !coupon.isActive) {
      return NextResponse.json(
        {
          valid: false,
          message: `Coupon code "${rawCode}" is invalid or has expired.`,
        },
        { status: 404 }
      );
    }

    // Date validations
    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return NextResponse.json(
        { valid: false, message: "This coupon is not active yet." },
        { status: 400 }
      );
    }
    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return NextResponse.json(
        { valid: false, message: "This coupon has expired." },
        { status: 400 }
      );
    }

    // Usage limit validations
    if (coupon.usageLimit && (coupon.timesUsed || 0) >= coupon.usageLimit) {
      return NextResponse.json(
        { valid: false, message: "This coupon has reached its maximum usage limit." },
        { status: 400 }
      );
    }

    // Minimum order amount validation
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      return NextResponse.json(
        {
          valid: false,
          message: `Minimum order of Rs. ${coupon.minOrder.toLocaleString("en-US")} required for code ${coupon.code}. Add more items to qualify.`,
        },
        { status: 400 }
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    let isFreeShipping = false;

    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && coupon.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else if (coupon.discountType === "FIXED") {
      discountAmount = Math.min(Number(coupon.discountValue), subtotal);
    } else if (coupon.discountType === "FREE_SHIPPING") {
      isFreeShipping = true;
      discountAmount = 350; // standard delivery fee waiver
    }

    const message = isFreeShipping
      ? `Coupon ${coupon.code} applied! Free Islandwide Delivery activated.`
      : `Coupon ${coupon.code} applied! You save Rs. ${discountAmount.toLocaleString("en-US")}.`;

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discountAmount,
        isFreeShipping: isFreeShipping,
      },
      message,
    });
  } catch (err: any) {
    console.error("Coupon validation error:", err);
    return NextResponse.json(
      { valid: false, message: "An error occurred while validating the coupon." },
      { status: 500 }
    );
  }
}
