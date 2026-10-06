import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch registered users with role CUSTOMER
    // 2. Fetch all orders (both shop orders SHOP-... and online/WhatsApp orders LC-...)
    const [users, allOrders] = await Promise.all([
      prisma.user.findMany({
        where: { role: "CUSTOMER" },
        include: {
          addresses: true,
          orders: {
            select: {
              id: true,
              orderNumber: true,
              grandTotal: true,
              createdAt: true,
              shippingAddress: true,
              city: true,
              district: true,
              deliveryNotes: true,
              paymentMethod: true,
              orderStatus: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          customerId: true,
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          shippingAddress: true,
          city: true,
          district: true,
          postalCode: true,
          deliveryNotes: true,
          grandTotal: true,
          paymentMethod: true,
          paymentStatus: true,
          orderStatus: true,
          createdAt: true,
        },
      }),
    ]);

    // Map to hold aggregated customer profiles
    const customerMap = new Map<string, any>();
    const phoneToUserKey = new Map<string, string>();

    // Step A: Seed customer directory with registered user accounts
    for (const u of users) {
      const cleanPhone = u.phone ? u.phone.replace(/\D/g, "") : "";
      const userKey = `user_${u.id}`;
      const defaultAddr = u.addresses.find((a) => a.isDefault) || u.addresses[0];

      customerMap.set(userKey, {
        id: userKey,
        userId: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || (defaultAddr ? defaultAddr.phone : ""),
        address: defaultAddr ? defaultAddr.addressLine : "",
        city: defaultAddr ? defaultAddr.city : "",
        district: defaultAddr ? defaultAddr.district : "",
        postalCode: defaultAddr ? defaultAddr.postalCode : "",
        channel: "REGISTERED",
        orderCount: u.orders.length,
        totalSpent: u.orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0),
        firstOrderDate: u.createdAt.toISOString(),
        lastOrderDate:
          u.orders.length > 0
            ? u.orders[0].createdAt.toISOString()
            : u.createdAt.toISOString(),
        isActive: u.isActive,
        notes: "",
        allOrderIds: u.orders.map((o) => o.id),
        allOrderNumbers: u.orders.map((o) => o.orderNumber),
      });

      if (cleanPhone && cleanPhone.length >= 7) {
        phoneToUserKey.set(cleanPhone, userKey);
      }
    }

    // Step B: Process all orders to aggregate Shop Orders (SHOP-...) and Online/WhatsApp Orders (LC-...)
    for (const o of allOrders) {
      const isShopOrder =
        o.orderNumber.startsWith("SHOP-") ||
        o.paymentMethod === "CREDIT_SHOP" ||
        Boolean(o.deliveryNotes && o.deliveryNotes.includes("SHOP:"));

      const cleanPhone = o.customerPhone ? o.customerPhone.replace(/\D/g, "") : "";
      const cleanName = o.customerName ? o.customerName.toLowerCase().trim() : "";

      let targetKey: string | null = null;

      if (o.customerId && customerMap.has(`user_${o.customerId}`)) {
        targetKey = `user_${o.customerId}`;
      } else if (cleanPhone && cleanPhone.length >= 7 && phoneToUserKey.has(cleanPhone)) {
        targetKey = phoneToUserKey.get(cleanPhone)!;
      } else if (cleanPhone && cleanPhone.length >= 7 && customerMap.has(`phone_${cleanPhone}`)) {
        targetKey = `phone_${cleanPhone}`;
      } else if (cleanName && customerMap.has(`name_${cleanName}`)) {
        targetKey = `name_${cleanName}`;
      }

      if (targetKey && customerMap.has(targetKey)) {
        const entry = customerMap.get(targetKey)!;

        // Add order if not already tracked
        if (!entry.allOrderIds.includes(o.id)) {
          entry.allOrderIds.push(o.id);
          entry.allOrderNumbers.push(o.orderNumber);
          entry.orderCount += 1;
          entry.totalSpent += o.grandTotal || 0;
        }

        // Fill missing address/contact details from latest order
        if (!entry.address && o.shippingAddress) entry.address = o.shippingAddress;
        if (!entry.city && o.city) entry.city = o.city;
        if (!entry.district && o.district) entry.district = o.district;
        if (!entry.postalCode && o.postalCode) entry.postalCode = o.postalCode;
        if (!entry.phone && o.customerPhone) entry.phone = o.customerPhone;
        if (!entry.email && o.customerEmail) entry.email = o.customerEmail;
        if (!entry.notes && o.deliveryNotes) entry.notes = o.deliveryNotes;

        // Upgrade channel tag if shop order
        if (isShopOrder && entry.channel !== "REGISTERED") {
          entry.channel = "SHOP";
        }
      } else {
        // Create new Customer Profile for guest / shop / WhatsApp customer
        const newKey =
          cleanPhone && cleanPhone.length >= 7
            ? `phone_${cleanPhone}`
            : `name_${cleanName || "guest"}_${o.id}`;

        customerMap.set(newKey, {
          id: newKey,
          userId: o.customerId || null,
          name: o.customerName || "Customer",
          email: o.customerEmail || "",
          phone: o.customerPhone || "",
          address: o.shippingAddress || "",
          city: o.city || "",
          district: o.district || "",
          postalCode: o.postalCode || "",
          channel: isShopOrder ? "SHOP" : "ONLINE",
          orderCount: 1,
          totalSpent: o.grandTotal || 0,
          firstOrderDate: o.createdAt.toISOString(),
          lastOrderDate: o.createdAt.toISOString(),
          isActive: true,
          notes: o.deliveryNotes || "",
          allOrderIds: [o.id],
          allOrderNumbers: [o.orderNumber],
        });

        if (cleanPhone && cleanPhone.length >= 7) {
          phoneToUserKey.set(cleanPhone, newKey);
        }
      }
    }

    const customers = Array.from(customerMap.values()).sort(
      (a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
    );

    const stats = {
      totalCustomers: customers.length,
      totalShops: customers.filter((c) => c.channel === "SHOP").length,
      totalOnline: customers.filter((c) => c.channel === "ONLINE").length,
      totalRegistered: customers.filter((c) => c.channel === "REGISTERED").length,
      totalSpentAll: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
    };

    return NextResponse.json({
      success: true,
      customers,
      stats,
    });
  } catch (err: any) {
    console.error("Load customers error:", err);
    return NextResponse.json({ error: "Failed to load customer directory." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 1. Account status toggle for registered users
    if (body.action === "TOGGLE_STATUS" || (body.id && body.isActive !== undefined && !body.name)) {
      const { id, isActive } = body;
      const targetUserId = id.startsWith("user_") ? id.replace("user_", "") : id;
      const updated = await prisma.user.update({
        where: { id: targetUserId },
        data: { isActive: Boolean(isActive) },
      });

      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "UPDATE_CUSTOMER_STATUS",
          details: `${isActive ? "Activated" : "Suspended"} customer account ${updated.email}`,
          entityType: "User",
          entityId: targetUserId,
        },
      });

      return NextResponse.json({ success: true, customer: updated });
    }

    // 2. Full Customer Details Update (with Old Orders Synchronization)
    const {
      customerId,
      userId,
      oldName,
      oldPhone,
      name,
      phone,
      email,
      shippingAddress,
      city,
      district,
      postalCode,
      notes,
      updateOldOrders = true,
      allOrderIds = [],
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Customer / Store Name is required." },
        { status: 400 }
      );
    }

    let resolvedUserId = userId;
    if (!resolvedUserId && customerId && customerId.startsWith("user_")) {
      resolvedUserId = customerId.replace("user_", "");
    }

    // A. Update registered User table if linked
    if (resolvedUserId) {
      try {
        await prisma.user.update({
          where: { id: resolvedUserId },
          data: {
            name: name.trim(),
            ...(phone ? { phone: phone.trim() } : {}),
            ...(email ? { email: email.trim() } : {}),
          },
        });

        // Update default address if exists or create one
        const existingAddr = await prisma.address.findFirst({
          where: { userId: resolvedUserId },
        });
        if (existingAddr) {
          await prisma.address.update({
            where: { id: existingAddr.id },
            data: {
              fullName: name.trim(),
              ...(phone ? { phone: phone.trim() } : {}),
              ...(shippingAddress ? { addressLine: shippingAddress.trim() } : {}),
              ...(city ? { city: city.trim() } : {}),
              ...(district ? { district: district.trim() } : {}),
              ...(postalCode ? { postalCode: postalCode.trim() } : {}),
            },
          });
        } else if (shippingAddress && city && district) {
          await prisma.address.create({
            data: {
              userId: resolvedUserId,
              fullName: name.trim(),
              phone: phone ? phone.trim() : "",
              addressLine: shippingAddress.trim(),
              city: city.trim(),
              district: district.trim(),
              postalCode: postalCode ? postalCode.trim() : null,
              isDefault: true,
            },
          });
        }
      } catch (userErr) {
        console.error("Could not update user table record:", userErr);
      }
    }

    // B. Synchronize Old Orders (Shop Orders, Online & WhatsApp Orders)
    let updatedOrdersCount = 0;
    if (updateOldOrders) {
      const matchConditions: any[] = [];

      if (resolvedUserId) {
        matchConditions.push({ customerId: resolvedUserId });
      }
      if (oldPhone && oldPhone.trim()) {
        matchConditions.push({ customerPhone: oldPhone.trim() });
      }
      if (oldName && oldName.trim()) {
        matchConditions.push({ customerName: oldName.trim() });
      }
      if (phone && phone.trim()) {
        matchConditions.push({ customerPhone: phone.trim() });
      }
      if (Array.isArray(allOrderIds) && allOrderIds.length > 0) {
        matchConditions.push({ id: { in: allOrderIds } });
      }

      if (matchConditions.length > 0) {
        const updateResult = await prisma.order.updateMany({
          where: {
            OR: matchConditions,
          },
          data: {
            customerName: name.trim(),
            ...(phone ? { customerPhone: phone.trim() } : {}),
            ...(email ? { customerEmail: email.trim() } : {}),
            ...(shippingAddress ? { shippingAddress: shippingAddress.trim() } : {}),
            ...(city ? { city: city.trim() } : {}),
            ...(district ? { district: district.trim() } : {}),
            ...(postalCode ? { postalCode: postalCode.trim() } : {}),
            ...(notes ? { deliveryNotes: notes.trim() } : {}),
          },
        });
        updatedOrdersCount = updateResult.count;
      }
    }

    // C. Activity Log
    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "UPDATE_CUSTOMER_DETAILS",
        details: `Updated customer "${oldName || name}" -> "${name}" (Phone: ${phone}). Synchronized ${updatedOrdersCount} past order(s) (Shop & Online/WhatsApp).`,
        entityType: "Customer",
        entityId: resolvedUserId || customerId || name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Customer "${name}" details updated successfully! ${
        updatedOrdersCount > 0
          ? `Synchronized ${updatedOrdersCount} past order(s) across shop billing and online records.`
          : ""
      }`,
      updatedOrdersCount,
    });
  } catch (err: any) {
    console.error("Update customer details error:", err);
    return NextResponse.json(
      { error: "Failed to update customer details." },
      { status: 500 }
    );
  }
}
