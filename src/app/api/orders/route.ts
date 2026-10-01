import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
      discount,
      deliveryCharge,
      grandTotal,
      couponCode,
      deliveryMethod,
    } = body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Order items cannot be empty." },
        { status: 400 }
      );
    }

    const currentCustomer = await getCurrentCustomer();

    // Smart fallback defaults for WhatsApp / quick checkout orders
    const isPickup = deliveryMethod === "PICKUP";
    const customerName = (fullName && fullName.trim()) ? fullName.trim() : "WhatsApp Customer";
    const customerPhone = (mobileNumber && mobileNumber.trim()) ? mobileNumber.trim() : "Not Provided";
    const customerEmail = (email && email.trim())
      ? email.toLowerCase().trim()
      : `order-${Date.now()}@leenaceylon.com`;
    const shippingAddress = (address && address.trim())
      ? address.trim()
      : (isPickup ? "LEENA CEYLON Office, Kekirawa, Sri Lanka (Office Pick-up)" : "Islandwide Courier Delivery");
    const orderCity = (city && city.trim())
      ? city.trim()
      : (isPickup ? "Kekirawa" : "Sri Lanka");
    const orderDistrict = (district && district.trim()) ? district.trim() : "Sri Lanka";

    // Generate Order Number: LC-YYYY-XXXX
    const count = await prisma.order.count();
    const year = new Date().getFullYear();
    const orderNumber = `LC-${year}-${String(count + 1).padStart(4, "0")}`;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Verify product IDs to ensure referential integrity
      const formattedItems: any[] = [];
      for (const item of cartItems) {
        let validProductId: string | null = null;
        if (item.productId) {
          try {
            const found = await tx.product.findUnique({
              where: { id: String(item.productId) },
              select: { id: true },
            });
            if (found) validProductId = found.id;
          } catch {
            validProductId = null;
          }
        }

        const unitPrice = Number(item.price) || 0;
        const qty = Math.max(1, Number(item.quantity) || 1);

        formattedItems.push({
          productId: validProductId,
          productName: item.name || item.productName || "Ceylon Tea",
          size: item.size || "Standard",
          unitPrice: unitPrice,
          quantity: qty,
          subtotal: unitPrice * qty,
          image: item.image || null,
        });

        // 2. Adjust stock if applicable
        if (item.variantId) {
          try {
            await tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { stock: { decrement: qty } },
            });
          } catch (e) {
            console.warn("Stock update on variant failed:", e);
          }
        } else if (validProductId) {
          try {
            await tx.product.updateMany({
              where: { id: validProductId },
              data: { stock: { decrement: qty } },
            });
          } catch (e) {
            console.warn("Stock update on product failed:", e);
          }
        }
      }

      // 3. Increment coupon usage if applied
      if (couponCode) {
        try {
          await tx.coupon.updateMany({
            where: { code: String(couponCode).trim().toUpperCase() },
            data: { timesUsed: { increment: 1 } },
          });
        } catch (couponErr) {
          console.warn("Could not increment coupon timesUsed:", couponErr);
        }
      }

      // 4. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: currentCustomer?.id || null,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          city: orderCity,
          district: orderDistrict,
          postalCode: postalCode?.trim() || null,
          deliveryNotes: deliveryNotes?.trim() || (isPickup ? "Office Pick-up (Kekirawa Head Office)" : null),
          subtotal: Number(subtotal) || 0,
          deliveryCharge: Number(deliveryCharge) || 0,
          discount: Number(discount) || 0,
          grandTotal: Number(grandTotal) || 0,
          paymentMethod: paymentMethod || (isPickup ? "PAY_ON_PICKUP" : "CASH_ON_DELIVERY"),
          paymentStatus: "PENDING",
          orderStatus: "PENDING",
          items: {
            create: formattedItems,
          },
        },
      });

      // 5. Create activity log
      try {
        await tx.adminActivityLog.create({
          data: {
            adminName: "Storefront (WhatsApp)",
            action: "NEW_ORDER",
            details: `New order #${orderNumber} placed by ${customerName} (${customerPhone}) for Rs. ${Number(grandTotal) || 0}`,
            entityType: "Order",
            entityId: newOrder.id,
          },
        });
      } catch (logErr) {
        // non-blocking
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
