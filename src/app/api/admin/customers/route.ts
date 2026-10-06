import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function normalizeName(name: string): string {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function normalizePhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 9) {
    return digits.slice(-9); // matches 771234567 for +94771234567, 0771234567, etc.
  }
  return digits;
}

function normalizeEmail(email: string): string {
  if (!email) return "";
  const clean = email.toLowerCase().trim();
  if (clean.includes("@leenaceylon.com") && clean.startsWith("shop-")) return "";
  return clean;
}

function extractSalesRepName(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/(?:SALES_REP|SALES REP|REP):\s*([^|]+)/i);
  if (match) return match[1].trim();
  const byMatch = notes.match(/by\s+([A-Za-z0-9._ -]+)\s*\((?:SALES_REP|ADMIN|MANAGER)\)/i);
  if (byMatch) return byMatch[1].trim();
  return null;
}

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
        include: {
          items: {
            select: {
              id: true,
              productName: true,
              size: true,
              unitPrice: true,
              quantity: true,
              subtotal: true,
            },
          },
        },
      }),
    ]);

    // Map to hold unique aggregated customer profiles
    const customerMap = new Map<string, any>();
    const phoneToKey = new Map<string, string>();
    const nameToKey = new Map<string, string>();
    const emailToKey = new Map<string, string>();
    const userIdToKey = new Map<string, string>();

    // Step A: Seed customer directory with registered user accounts
    for (const u of users) {
      const cleanPhone = normalizePhone(u.phone || "");
      const cleanName = normalizeName(u.name || "");
      const cleanEmail = normalizeEmail(u.email || "");
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
        salesRepName: null,
        allOrderIds: u.orders.map((o) => o.id),
        allOrderNumbers: u.orders.map((o) => o.orderNumber),
        ordersList: u.orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          createdAt: o.createdAt.toISOString(),
          grandTotal: o.grandTotal,
          paymentMethod: o.paymentMethod,
          paymentStatus: "PAID",
          orderStatus: o.orderStatus,
          salesRepName: extractSalesRepName(o.deliveryNotes),
          itemsCount: 1,
          itemsSummary: "Registered online tea order",
        })),
      });

      userIdToKey.set(u.id, userKey);
      if (cleanPhone) phoneToKey.set(cleanPhone, userKey);
      if (cleanName && cleanName.length >= 3) nameToKey.set(cleanName, userKey);
      if (cleanEmail) emailToKey.set(cleanEmail, userKey);
    }

    // Step B: Process all orders to aggregate Shop Orders (SHOP-...) and Online/WhatsApp Orders (LC-...)
    // Group repeat orders by Customer Name, Phone, Email, or User ID into ONE single customer row
    for (const o of allOrders) {
      const isShopOrder =
        o.orderNumber.startsWith("SHOP-") ||
        o.paymentMethod === "CREDIT_SHOP" ||
        Boolean(o.deliveryNotes && (o.deliveryNotes.includes("SHOP:") || o.deliveryNotes.includes("SALES_REP:")));

      const cleanPhone = normalizePhone(o.customerPhone || "");
      const cleanName = normalizeName(o.customerName || "");
      const cleanEmail = normalizeEmail(o.customerEmail || "");
      const repName = extractSalesRepName(o.deliveryNotes);

      let targetKey: string | null = null;

      if (o.customerId && userIdToKey.has(o.customerId)) {
        targetKey = userIdToKey.get(o.customerId)!;
      } else if (cleanPhone && phoneToKey.has(cleanPhone)) {
        targetKey = phoneToKey.get(cleanPhone)!;
      } else if (cleanName && cleanName.length >= 3 && nameToKey.has(cleanName)) {
        targetKey = nameToKey.get(cleanName)!;
      } else if (cleanEmail && emailToKey.has(cleanEmail)) {
        targetKey = emailToKey.get(cleanEmail)!;
      }

      const orderItemSummary = {
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt.toISOString(),
        grandTotal: o.grandTotal,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        orderStatus: isShopOrder && o.orderStatus === "CONFIRMED" ? "DELIVERED" : o.orderStatus,
        salesRepName: repName,
        itemsCount: o.items?.length || 0,
        itemsSummary: o.items?.map((it: any) => `${it.productName} (${it.size}) × ${it.quantity}`).join(", ") || "Ceylon Tea items",
      };

      if (targetKey && customerMap.has(targetKey)) {
        const entry = customerMap.get(targetKey)!;

        // Add order if not already tracked
        if (!entry.allOrderIds.includes(o.id)) {
          entry.allOrderIds.push(o.id);
          entry.allOrderNumbers.push(o.orderNumber);
          entry.orderCount += 1;
          entry.totalSpent += o.grandTotal || 0;
          if (!entry.ordersList) entry.ordersList = [];
          entry.ordersList.push(orderItemSummary);

          // Update timeline dates
          if (new Date(o.createdAt).getTime() > new Date(entry.lastOrderDate).getTime()) {
            entry.lastOrderDate = o.createdAt.toISOString();
          }
          if (new Date(o.createdAt).getTime() < new Date(entry.firstOrderDate).getTime()) {
            entry.firstOrderDate = o.createdAt.toISOString();
          }
        }

        // Fill missing address/contact details from latest order
        if (!entry.address && o.shippingAddress) entry.address = o.shippingAddress;
        if (!entry.city && o.city) entry.city = o.city;
        if (!entry.district && o.district) entry.district = o.district;
        if (!entry.postalCode && o.postalCode) entry.postalCode = o.postalCode;
        if (!entry.phone && o.customerPhone) entry.phone = o.customerPhone;
        if (!entry.email && cleanEmail) entry.email = cleanEmail;
        if (!entry.notes && o.deliveryNotes) entry.notes = o.deliveryNotes;
        if (repName && !entry.salesRepName) entry.salesRepName = repName;

        // Upgrade channel tag if shop order
        if (isShopOrder && entry.channel !== "REGISTERED") {
          entry.channel = "SHOP";
        }

        // Register any newly discovered identifiers for this customer
        if (cleanPhone && !phoneToKey.has(cleanPhone)) phoneToKey.set(cleanPhone, targetKey);
        if (cleanName && cleanName.length >= 3 && !nameToKey.has(cleanName)) nameToKey.set(cleanName, targetKey);
        if (cleanEmail && !emailToKey.has(cleanEmail)) emailToKey.set(cleanEmail, targetKey);
      } else {
        // Create new single Customer Profile for guest / shop / WhatsApp customer
        const newKey = cleanPhone
          ? `phone_${cleanPhone}`
          : cleanName
          ? `name_${cleanName}`
          : `order_${o.id}`;

        const newProfile = {
          id: newKey,
          userId: o.customerId || null,
          name: o.customerName || "Customer",
          email: cleanEmail,
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
          salesRepName: repName,
          allOrderIds: [o.id],
          allOrderNumbers: [o.orderNumber],
          ordersList: [orderItemSummary],
        };

        customerMap.set(newKey, newProfile);

        if (o.customerId) userIdToKey.set(o.customerId, newKey);
        if (cleanPhone) phoneToKey.set(cleanPhone, newKey);
        if (cleanName && cleanName.length >= 3) nameToKey.set(cleanName, newKey);
        if (cleanEmail) emailToKey.set(cleanEmail, newKey);
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
