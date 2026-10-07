import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentCustomer, getCurrentAdmin } from "@/lib/auth";

// GET /api/reviews?productId=...
// Fetches approved reviews for a given product (by id or slug)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId parameter is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { slug: productId }],
      },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ success: true, reviews: [] });
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId: product.id,
        isApproved: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    console.error("Fetch reviews error:", err);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/reviews
// Customer creates or updates a review.
// Automatically sets isApproved: false so admin must approve before showing publicly.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, customerName, email, rating, comment } = body;

    if (!productId || !customerName?.trim() || !rating || !comment?.trim()) {
      return NextResponse.json(
        { error: "Please provide product, your name, rating, and review comment." },
        { status: 400 }
      );
    }

    // Resolve product by ID or slug
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { slug: productId }],
      },
      select: { id: true, slug: true, name: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    // Safely check customer session against database
    const currentCustomer = await getCurrentCustomer();
    let validCustomerId: string | null = null;
    if (currentCustomer?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: currentCustomer.id },
        select: { id: true },
      });
      if (dbUser) {
        validCustomerId = dbUser.id;
      }
    }

    const cleanEmail = email?.trim() || null;
    const cleanName = customerName.trim();
    const cleanComment = comment.trim();
    const cleanRating = Math.min(5, Math.max(1, Math.round(Number(rating)) || 5));

    // Check if customer already has a review for this product (to support updates)
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: product.id,
        OR: [
          ...(validCustomerId ? [{ customerId: validCustomerId }] : []),
          ...(cleanEmail ? [{ email: { equals: cleanEmail, mode: "insensitive" as const } }] : []),
        ],
      },
    });

    let review;
    if (existingReview) {
      // Customer is updating their existing review
      // Reset isApproved to false so Admin can moderate the update before it displays publicly!
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          customerName: cleanName,
          email: cleanEmail || existingReview.email,
          rating: cleanRating,
          comment: cleanComment,
          isApproved: false, // Must be re-approved by Admin after update!
          customerId: validCustomerId || existingReview.customerId,
          createdAt: new Date(),
        },
      });
    } else {
      // New review submission - default isApproved: false (requires admin approval)
      review = await prisma.review.create({
        data: {
          productId: product.id,
          customerId: validCustomerId,
          customerName: cleanName,
          email: cleanEmail,
          rating: cleanRating,
          comment: cleanComment,
          isApproved: false, // Default unapproved until admin review
        },
      });
    }

    // Revalidate storefront product page & admin reviews page
    try {
      revalidatePath(`/products/${product.slug}`);
      revalidatePath("/products");
      revalidatePath("/admin/reviews");
    } catch (e) {
      // Ignore if revalidatePath is called in edge runtime
    }

    return NextResponse.json({
      success: true,
      review,
      isUpdate: Boolean(existingReview),
      message: existingReview
        ? "Your review has been updated and submitted for administrator approval."
        : "Your review has been submitted and is pending administrator approval.",
    });
  } catch (err: any) {
    console.error("Review submit error:", err);
    return NextResponse.json(
      { error: "Failed to submit review. Please try again." },
      { status: 500 }
    );
  }
}

// PUT /api/reviews
// Admin approves or unapproves a review
export async function PUT(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, isApproved } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { isApproved: Boolean(isApproved) },
      include: { product: { select: { slug: true } } },
    });

    // Revalidate paths so the storefront immediately reflects the approval change
    try {
      if (updated.product?.slug) {
        revalidatePath(`/products/${updated.product.slug}`);
      }
      revalidatePath("/products");
      revalidatePath("/admin/reviews");
    } catch (e) {
      // Ignore
    }

    return NextResponse.json({ success: true, review: updated });
  } catch (err: any) {
    console.error("Review update error:", err);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

// DELETE /api/reviews?id=...
// Admin deletes a review
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

    const deleted = await prisma.review.delete({
      where: { id },
      include: { product: { select: { slug: true } } },
    });

    try {
      if (deleted.product?.slug) {
        revalidatePath(`/products/${deleted.product.slug}`);
      }
      revalidatePath("/products");
      revalidatePath("/admin/reviews");
    } catch (e) {
      // Ignore
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Review delete error:", err);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
