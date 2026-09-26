import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      mobileNumber,
      email,
      address,
      city,
      district,
      postalCode,
      deliveryNotes,
      paymentMethod,
      cartItems,
      subtotal,
      deliveryCharge,
      grandTotal,
    } = body;

    if (!fullName || !mobileNumber || !email || !address || !city || !district) {
      return NextResponse.json(
        { error: "Please fill in all required customer and delivery fields." },
        { status: 400 }
      );
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Your shopping cart is empty." },
        { status: 400 }
      );
    }

    const currentCustomer = await getCurrentCustomer();

    // Generate Order Number: LC-YYYY-XXXX
    const count = await prisma.order.count();
    const year = new Date().getFullYear();
    const orderNumber = `LC-${year}-${String(count + 1).padStart(4, "0")}`;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: currentCustomer?.id || null,
          customerName: fullName.trim(),
          customerEmail: email.toLowerCase().trim(),
          customerPhone: mobileNumber.trim(),
          shippingAddress: address.trim(),
          city: city.trim(),
          district: district.trim(),
          postalCode: postalCode?.trim() || null,
          deliveryNotes: deliveryNotes?.trim() || null,
          subtotal: Number(subtotal) || 0,
          deliveryCharge: Number(deliveryCharge) || 0,
          discount: 0,
          grandTotal: Number(grandTotal) || 0,
          paymentMethod: paymentMethod || "CASH_ON_DELIVERY",
          paymentStatus: "PENDING",
          orderStatus: "PENDING",
          items: {
            create: cartItems.map((item: any) => ({
              productId: item.productId,
              productName: item.name,
              size: item.size || "Standard",
              unitPrice: Number(item.price),
              quantity: Number(item.quantity),
              subtotal: Number(item.price) * Number(item.quantity),
              image: item.image,
            })),
          },
        },
      });

      // 2. Adjust stock for variants/products
      for (const item of cartItems) {
        if (item.variantId) {
          await tx.productVariant.updateMany({
            where: { id: item.variantId },
            data: { stock: { decrement: Number(item.quantity) } },
          });
        } else if (item.productId) {
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stock: { decrement: Number(item.quantity) } },
          });
        }
      }

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (err: any) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      { error: "Failed to place order. Please try again." },
      { status: 500 }
    );
  }
}
