import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentCustomer, getCurrentAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { productId, customerName, email, rating, comment } = await req.json();

    if (!productId || !customerName || !rating || !comment) {
      return NextResponse.json(
        { error: "Please provide product, your name, rating, and review comment." },
        { status: 400 }
      );
    }

    const currentCustomer = await getCurrentCustomer();

    const review = await prisma.review.create({
      data: {
        productId,
        customerId: currentCustomer?.id || null,
        customerName: customerName.trim(),
        email: email?.trim() || null,
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        comment: comment.trim(),
        isApproved: false, // Default unapproved until admin review
      },
    });

    return NextResponse.json({
      success: true,
      review,
      message: "Review submitted for administrative approval.",
    });
  } catch (err: any) {
    console.error("Review submit error:", err);
    return NextResponse.json(
      { error: "Failed to submit review." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, isApproved } = await req.json();
    const updated = await prisma.review.update({
      where: { id },
      data: { isApproved: Boolean(isApproved) },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Review ID required" }, { status: 400 });
    }

    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
