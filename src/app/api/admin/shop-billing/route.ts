import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Helper to calculate paid, due, and partial status
function parsePaymentDetails(o: any) {
  const grandTotal = Number(o.grandTotal) || 0;
  if (o.paymentStatus === "PAID") {
    return { paidAmount: grandTotal, dueAmount: 0, isPartial: false };
  }
  if (o.paymentStatus === "PARTIAL") {
    let paid = 0;
    let due = grandTotal;
    if (o.deliveryNotes) {
      const paidMatch = o.deliveryNotes.match(/paid=([0-9.]+)/i);
      const dueMatch = o.deliveryNotes.match(/due=([0-9.]+)/i);
      if (paidMatch) paid = parseFloat(paidMatch[1]) || 0;
      if (dueMatch) due = parseFloat(dueMatch[1]) || Math.max(0, grandTotal - paid);
      else due = Math.max(0, grandTotal - paid);
    }
    return { paidAmount: Math.min(grandTotal, paid), dueAmount: Math.max(0, due), isPartial: true };
  }
  // PENDING, CREDIT_SHOP, etc.
  return { paidAmount: 0, dueAmount: grandTotal, isPartial: false };
}

// Helper to extract 2-bill combined payment metadata
function parseCombinedPaymentDetails(notes?: string | null) {
  if (!notes) return null;
  const match = notes.match(
    /\[COMBINED_PAYMENT:\s*oldDebt=([0-9.]+),\s*newBill=([0-9.]+),\s*totalCombined=([0-9.]+),\s*totalReceived=([0-9.]+),\s*afterBalance=([0-9.]+)\]/i
  );
  if (!match) return null;
  return {
    isCombined: true,
    oldBalance: parseFloat(match[1]) || 0,
    newBillTotal: parseFloat(match[2]) || 0,
    totalCombined: parseFloat(match[3]) || 0,
    totalReceived: parseFloat(match[4]) || 0,
    afterBalance: parseFloat(match[5]) || 0,
  };
}

// Helper to extract sales rep name from delivery notes
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

    // 1. Fetch available products with active sizes
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        sizes: {
          where: { isActive: true },
          orderBy: { weightGram: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // 2. Fetch all ground shop orders (orders starting with SHOP- or marked as shop billing)
    const allShopOrders = await prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { startsWith: "SHOP-" } },
          { paymentMethod: "CREDIT_SHOP" },
          { deliveryNotes: { contains: "SHOP:" } },
        ],
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Extract distinct shops with comprehensive credit ledger & pending payment balances
    const uniqueShopsMap = new Map<string, any>();
    allShopOrders.forEach((o) => {
      const key = o.customerName ? o.customerName.toLowerCase().trim() : "";
      if (!key) return;

      if (!uniqueShopsMap.has(key)) {
        uniqueShopsMap.set(key, {
          shopName: o.customerName.trim(),
          ownerName: "",
          phone: o.customerPhone,
          routeTown: o.city,
          address: o.shippingAddress,
          district: o.district,
          totalBillsCount: 0,
          totalSalesAmount: 0,
          pendingBalance: 0,
          pendingBillsCount: 0,
          pendingBills: [],
          allBills: [],
        });
      }

      const shop = uniqueShopsMap.get(key);
      shop.totalBillsCount += 1;
      const { paidAmount, dueAmount, isPartial } = parsePaymentDetails(o);
      const combinedDetails = parseCombinedPaymentDetails(o.deliveryNotes);
      const salesRepName = extractSalesRepName(o.deliveryNotes);

      shop.allBills.push({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        grandTotal: o.grandTotal,
        paidAmount,
        dueAmount,
        isPartial,
        combinedDetails,
        salesRepName,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        orderStatus: o.orderStatus,
        deliveryNotes: o.deliveryNotes,
        itemsCount: o.items?.length || 0,
      });

      if (o.orderStatus !== "CANCELLED") {
        shop.totalSalesAmount += o.grandTotal;
        if (dueAmount > 0) {
          shop.pendingBalance += dueAmount;
          shop.pendingBillsCount += 1;
          shop.pendingBills.push({
            id: o.id,
            orderNumber: o.orderNumber,
            createdAt: o.createdAt,
            grandTotal: o.grandTotal,
            paidAmount,
            dueAmount,
            isPartial,
            combinedDetails,
            salesRepName,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            deliveryNotes: o.deliveryNotes,
          });
        }
      }
    });

    // 4. Load explicitly registered shops from database
    const registeredShopsSetting = await prisma.siteSetting.findUnique({
      where: { key: "leena_registered_shops" },
    });
    let registeredShopsList: any[] = [];
    if (registeredShopsSetting?.value) {
      try {
        registeredShopsList = JSON.parse(registeredShopsSetting.value);
      } catch (e) {
        registeredShopsList = [];
      }
    }

    // Merge registered shops into uniqueShopsMap
    registeredShopsList.forEach((reg) => {
      const key = reg.shopName ? reg.shopName.toLowerCase().trim() : "";
      if (!key) return;

      if (!uniqueShopsMap.has(key)) {
        uniqueShopsMap.set(key, {
          shopCode: reg.shopCode || `LC-SH-${Math.floor(1000 + Math.random() * 9000)}`,
          shopName: reg.shopName.trim(),
          ownerName: reg.ownerName || "",
          phone: reg.phone || "",
          routeTown: reg.routeTown || "",
          address: reg.address || "",
          district: reg.district || "",
          assignedRep: reg.assignedRep || "",
          totalBillsCount: 0,
          totalSalesAmount: 0,
          pendingBalance: Number(reg.openingBalance || 0),
          pendingBillsCount: Number(reg.openingBalance || 0) > 0 ? 1 : 0,
          pendingBills: [],
          allBills: [],
          isRegistered: true,
          createdAt: reg.createdAt,
        });
      } else {
        const existing = uniqueShopsMap.get(key);
        existing.shopCode = reg.shopCode || existing.shopCode || `LC-SH-${Math.floor(1000 + Math.random() * 9000)}`;
        if (reg.ownerName && !existing.ownerName) existing.ownerName = reg.ownerName;
        if (reg.phone && !existing.phone) existing.phone = reg.phone;
        if (reg.routeTown && !existing.routeTown) existing.routeTown = reg.routeTown;
        if (reg.address && !existing.address) existing.address = reg.address;
        if (reg.district && !existing.district) existing.district = reg.district;
        if (reg.assignedRep) existing.assignedRep = reg.assignedRep;
        existing.isRegistered = true;
      }
    });

    // Ensure every known shop has a unique, readable shopCode
    uniqueShopsMap.forEach((shop, key) => {
      if (!shop.shopCode) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
          hash = (hash << 5) - hash + key.charCodeAt(i);
          hash |= 0;
        }
        const numericCode = Math.abs(hash % 9000) + 1000;
        shop.shopCode = `LC-SH-${numericCode}`;
      }
    });

    const knownShops = Array.from(uniqueShopsMap.values()).sort(
      (a, b) => (b.totalBillsCount || 0) - (a.totalBillsCount || 0)
    );

    const enrichedShopOrders = allShopOrders.map((o) => {
      const { paidAmount, dueAmount, isPartial } = parsePaymentDetails(o);
      return {
        ...o,
        paidAmount,
        dueAmount,
        isPartial,
        salesRepName: extractSalesRepName(o.deliveryNotes),
        combinedDetails: parseCombinedPaymentDetails(o.deliveryNotes),
      };
    });

    return NextResponse.json({
      success: true,
      products,
      recentShopOrders: enrichedShopOrders,
      knownShops,
      registeredShops: registeredShopsList,
      currentAdmin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err: any) {
    console.error("Shop billing GET error:", err);
    return NextResponse.json(
      { error: "Failed to load shop billing inventory" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 0. SHOP REGISTRATION HANDLER
    if (body.action === "register_shop") {
      const {
        shopName,
        ownerName = "",
        phone,
        routeTown = "",
        address = "",
        district = "Anuradhapura",
        assignedRep = "",
        openingBalance = 0,
        notes = "",
      } = body;

      if (!shopName || !shopName.trim()) {
        return NextResponse.json(
          { error: "Shop / Store Name is required for registration." },
          { status: 400 }
        );
      }

      if (!phone || !phone.trim()) {
        return NextResponse.json(
          { error: "Shop Phone / WhatsApp number is required for registration." },
          { status: 400 }
        );
      }

      // Load existing registered shops from SiteSetting
      const existingSetting = await prisma.siteSetting.findUnique({
        where: { key: "leena_registered_shops" },
      });

      let registeredShops: any[] = [];
      if (existingSetting?.value) {
        try {
          registeredShops = JSON.parse(existingSetting.value);
        } catch (e) {
          registeredShops = [];
        }
      }

      const cleanName = shopName.trim();
      const existingIdx = registeredShops.findIndex(
        (s) => s.shopName.toLowerCase().trim() === cleanName.toLowerCase()
      );

      const shopCode =
        existingIdx > -1 && registeredShops[existingIdx].shopCode
          ? registeredShops[existingIdx].shopCode
          : `LC-SH-${Math.floor(1000 + Math.random() * 9000)}`;

      const newShopEntry = {
        id: `shop-${Date.now()}`,
        shopCode,
        shopName: cleanName,
        ownerName: ownerName?.trim() || "",
        phone: phone.trim(),
        routeTown: routeTown?.trim() || "",
        address: address?.trim() || "",
        district: district?.trim() || "",
        assignedRep: assignedRep?.trim() || admin.name || "Sales Rep",
        openingBalance: Number(openingBalance) || 0,
        notes: notes?.trim() || "",
        createdAt: new Date().toISOString(),
      };

      if (existingIdx > -1) {
        registeredShops[existingIdx] = {
          ...registeredShops[existingIdx],
          ...newShopEntry,
          createdAt: registeredShops[existingIdx].createdAt || newShopEntry.createdAt,
        };
      } else {
        registeredShops.unshift(newShopEntry);
      }

      await prisma.siteSetting.upsert({
        where: { key: "leena_registered_shops" },
        update: { value: JSON.stringify(registeredShops), updatedAt: new Date() },
        create: {
          key: "leena_registered_shops",
          value: JSON.stringify(registeredShops),
          group: "SYSTEM",
        },
      });

      return NextResponse.json({
        success: true,
        shop: newShopEntry,
        message: `Shop "${cleanName}" registered successfully with QR code ${shopCode}.`,
      });
    }

    // 0B. SHOP UPDATE & NEW QR MODIFICATION HANDLER
    if (body.action === "update_shop" || body.action === "edit_shop") {
      const {
        oldShopName,
        shopCode: inputShopCode,
        shopName,
        ownerName = "",
        phone,
        routeTown = "",
        address = "",
        district = "Anuradhapura",
        assignedRep = "",
        notes = "",
        regenerateQr = false,
        updateOldOrders = true,
      } = body;

      if (!shopName || !shopName.trim()) {
        return NextResponse.json(
          { error: "Shop / Store Name is required." },
          { status: 400 }
        );
      }

      if (!phone || !phone.trim()) {
        return NextResponse.json(
          { error: "Shop Phone / WhatsApp number is required." },
          { status: 400 }
        );
      }

      // Load existing registered shops from SiteSetting
      const existingSetting = await prisma.siteSetting.findUnique({
        where: { key: "leena_registered_shops" },
      });

      let registeredShops: any[] = [];
      if (existingSetting?.value) {
        try {
          registeredShops = JSON.parse(existingSetting.value);
        } catch (e) {
          registeredShops = [];
        }
      }

      const lookupName = (oldShopName || shopName).toLowerCase().trim();
      const existingIdx = registeredShops.findIndex(
        (s) =>
          s.shopName.toLowerCase().trim() === lookupName ||
          (inputShopCode && s.shopCode === inputShopCode)
      );

      let finalShopCode = inputShopCode;
      if (regenerateQr) {
        finalShopCode = `LC-SH-${Math.floor(1000 + Math.random() * 9000)}`;
      } else if (!finalShopCode) {
        finalShopCode =
          existingIdx > -1 && registeredShops[existingIdx].shopCode
            ? registeredShops[existingIdx].shopCode
            : `LC-SH-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const updatedShopEntry = {
        id: existingIdx > -1 ? registeredShops[existingIdx].id : `shop-${Date.now()}`,
        shopCode: finalShopCode,
        shopName: shopName.trim(),
        ownerName: ownerName?.trim() || "",
        phone: phone.trim(),
        routeTown: routeTown?.trim() || "",
        address: address?.trim() || "",
        district: district?.trim() || "Anuradhapura",
        assignedRep: assignedRep?.trim() || admin.name || "Sales Rep",
        openingBalance: existingIdx > -1 ? registeredShops[existingIdx].openingBalance : 0,
        notes: notes?.trim() || "",
        createdAt: existingIdx > -1 ? registeredShops[existingIdx].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx > -1) {
        registeredShops[existingIdx] = updatedShopEntry;
      } else {
        registeredShops.unshift(updatedShopEntry);
      }

      await prisma.siteSetting.upsert({
        where: { key: "leena_registered_shops" },
        update: { value: JSON.stringify(registeredShops), updatedAt: new Date() },
        create: {
          key: "leena_registered_shops",
          value: JSON.stringify(registeredShops),
          group: "SYSTEM",
        },
      });

      // Synchronize matching past orders if requested
      let syncedOrders = 0;
      if (updateOldOrders && oldShopName) {
        const orderUpdateRes = await prisma.order.updateMany({
          where: {
            OR: [
              { customerName: oldShopName.trim() },
              { customerName: shopName.trim() },
            ],
          },
          data: {
            customerName: shopName.trim(),
            customerPhone: phone.trim(),
            shippingAddress: address.trim(),
            city: routeTown.trim(),
            district: district.trim(),
          },
        });
        syncedOrders = orderUpdateRes.count;
      }

      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "UPDATE_SHOP_DETAILS",
          details: `Modified shop "${oldShopName || shopName}" -> "${shopName}" (Code: ${finalShopCode}${regenerateQr ? " - NEW QR Generated" : ""}). Synced ${syncedOrders} past orders.`,
          entityType: "Shop",
          entityId: finalShopCode,
        },
      });

      return NextResponse.json({
        success: true,
        shop: updatedShopEntry,
        message: `Shop "${shopName}" details updated successfully! ${
          regenerateQr ? `New QR code (${finalShopCode}) issued.` : ""
        } ${syncedOrders > 0 ? `Synced ${syncedOrders} past order(s).` : ""}`,
      });
    }

    const {
      shopName,
      ownerName,
      shopPhone,
      routeTown,
      address,
      items,
      subtotal,
      discount = 0,
      deliveryCharge = 0,
      grandTotal,
      paymentMethod = "CASH_ON_DELIVERY",
      paymentStatus = "PAID",
      paidAmount = 0,
      notes,
      salesRepName: inputSalesRepName,
      combinedPayment, // { isCombined: boolean, oldBalance: number, totalReceived: number, afterBalance: number }
    } = body;

    if (!shopName || !shopName.trim()) {
      return NextResponse.json(
        { error: "Shop / Store Name is required." },
        { status: 400 }
      );
    }

    if (!shopPhone || !shopPhone.trim()) {
      return NextResponse.json(
        { error: "Shop Phone / WhatsApp number is required." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Please add at least one tea item to this bill." },
        { status: 400 }
      );
    }

    // Auto-generate Shop Order Reference: e.g. SHOP-2026-1042
    const year = new Date().getFullYear();
    const count = await prisma.order.count();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SHOP-${year}-${String(count + 1).padStart(4, "0")}-${randomSuffix}`;

    // Calculate line subtotals and prepare items
    const orderItemsData = items.map((it: any) => ({
      productId: it.productId || null,
      productName: it.productName,
      size: it.size || "Standard",
      unitPrice: Number(it.unitPrice) || 0,
      quantity: Number(it.quantity) || 1,
      subtotal: Number(it.subtotal) || Number(it.unitPrice) * Number(it.quantity),
      image: it.image || "/uploads/leena-tea-powder-200g.jpeg",
    }));

    const computedSubtotal = orderItemsData.reduce(
      (sum: number, it: any) => sum + it.subtotal,
      0
    );
    const finalGrandTotal = Math.max(
      0,
      computedSubtotal - Number(discount || 0) + Number(deliveryCharge || 0)
    );

    // COMBINED 2-BILL PAYMENT ALLOCATION vs STANDARD BILL PAYMENT
    const isCombinedActive = Boolean(combinedPayment?.isCombined && Number(combinedPayment?.oldBalance) > 0);
    let actualPaymentStatus = paymentStatus;
    let actualPaidAmount = 0;
    let actualDueAmount = finalGrandTotal;
    let paymentTag = "";
    let combinedTag = "";

    if (isCombinedActive) {
      const oldDebt = Math.max(0, Number(combinedPayment.oldBalance) || 0);
      const totalReceived = Math.max(0, Number(combinedPayment.totalReceived) || 0);
      const totalCombined = oldDebt + finalGrandTotal;
      const computedAfterBal = Math.max(0, totalCombined - totalReceived);

      // 1. Fetch old unpaid/partial bills for this shop in FIFO order
      const oldPendingOrders = await prisma.order.findMany({
        where: {
          customerName: shopName.trim(),
          orderStatus: { not: "CANCELLED" },
          paymentStatus: { in: ["PENDING", "PARTIAL"] },
        },
        orderBy: { createdAt: "asc" },
      });

      let remainingToAllocate = totalReceived;
      const timestamp = new Date().toLocaleString("en-GB");

      // 2. FIFO Waterfall: Clear oldest bills first
      for (const oldOrder of oldPendingOrders) {
        if (remainingToAllocate <= 0) break;
        const { paidAmount: currPaid, dueAmount: currDue } = parsePaymentDetails(oldOrder);
        if (currDue <= 0) continue;

        const payToThis = Math.min(currDue, remainingToAllocate);
        const newPaidTotal = currPaid + payToThis;
        const newDueTotal = Math.max(0, currDue - payToThis);
        remainingToAllocate -= payToThis;

        const newOldStatus = newDueTotal === 0 ? "PAID" : "PARTIAL";
        const oldTag = newOldStatus === "PAID"
          ? `[FULL_PAYMENT_SETTLED: paid=${oldOrder.grandTotal}, due=0]`
          : `[PARTIAL_PAYMENT: paid=${newPaidTotal}, due=${newDueTotal}]`;

        let cleanedOldNotes = (oldOrder.deliveryNotes || "")
          .replace(/\[PARTIAL_PAYMENT:.*?\]/g, "")
          .replace(/\[FULL_PAYMENT_SETTLED:.*?\]/g, "")
          .replace(/\[CREDIT_MARKED_PENDING:.*?\]/g, "")
          .trim();

        const updatedOldNotes = `${cleanedOldNotes} | ${oldTag} | [Combined 2-Bill Settle ${timestamp} by ${admin.name} (${admin.role}) during New Bill #${orderNumber}: Allocated Rs. ${payToThis.toLocaleString()}]`;

        await prisma.order.update({
          where: { id: oldOrder.id },
          data: {
            paymentStatus: newOldStatus,
            deliveryNotes: updatedOldNotes,
          },
        });

        await prisma.adminActivityLog.create({
          data: {
            adminId: admin.id,
            adminName: admin.name,
            action: "COMBINED_BILL_PAYMENT_ALLOCATION",
            details: `Combined 2-Bill Settlement: Allocated Rs. ${payToThis.toLocaleString()} to Old Bill #${oldOrder.orderNumber} for "${shopName.trim()}". Status is now ${newOldStatus} (Paid: Rs. ${newPaidTotal.toLocaleString()}, Due: Rs. ${newDueTotal.toLocaleString()}).`,
            entityType: "Order",
            entityId: oldOrder.id,
          },
        });
      }

      // 3. Apply any remaining received cash to the new bill
      const newBillPaid = Math.min(finalGrandTotal, remainingToAllocate);
      const newBillDue = Math.max(0, finalGrandTotal - newBillPaid);
      actualPaidAmount = newBillPaid;
      actualDueAmount = newBillDue;

      if (newBillDue === 0) {
        actualPaymentStatus = "PAID";
        paymentTag = `[FULL_PAYMENT_SETTLED: paid=${finalGrandTotal}, due=0]`;
      } else if (newBillPaid > 0) {
        actualPaymentStatus = "PARTIAL";
        paymentTag = `[PARTIAL_PAYMENT: paid=${newBillPaid}, due=${newBillDue}]`;
      } else {
        actualPaymentStatus = paymentMethod === "CREDIT_SHOP" ? "PENDING" : "PENDING";
        paymentTag = `[CREDIT_MARKED_PENDING: paid=0, due=${finalGrandTotal}]`;
      }

      combinedTag = `[COMBINED_PAYMENT: oldDebt=${oldDebt}, newBill=${finalGrandTotal}, totalCombined=${totalCombined}, totalReceived=${totalReceived}, afterBalance=${computedAfterBal}]`;
    } else {
      // Standard Single Bill Calculation
      if (paymentStatus === "PARTIAL") {
        const numPaid = Math.min(finalGrandTotal, Math.max(0, Number(paidAmount || 0)));
        const numDue = Math.max(0, finalGrandTotal - numPaid);
        actualPaidAmount = numPaid;
        actualDueAmount = numDue;
        actualPaymentStatus = "PARTIAL";
        paymentTag = `[PARTIAL_PAYMENT: paid=${numPaid}, due=${numDue}]`;
      } else if (paymentStatus === "PAID") {
        actualPaidAmount = finalGrandTotal;
        actualDueAmount = 0;
        actualPaymentStatus = "PAID";
        paymentTag = `[FULL_PAYMENT_SETTLED: paid=${finalGrandTotal}, due=0]`;
      } else {
        actualPaidAmount = 0;
        actualDueAmount = finalGrandTotal;
        actualPaymentStatus = "PENDING";
        paymentTag = `[CREDIT_MARKED_PENDING: paid=0, due=${finalGrandTotal}]`;
      }
    }

    const repDisplayName =
      (inputSalesRepName && inputSalesRepName.trim()) ||
      (body.salesRepName && body.salesRepName.trim()) ||
      admin.name ||
      "Sales Rep";
    // Save in Order model with shop metadata including Sales Rep attribution
    const shopMetadata = `SALES_REP: ${repDisplayName} | REP_ROLE: ${admin.role} | SHOP: ${shopName.trim()} | OWNER: ${ownerName || "Shop Manager"} | ROUTE: ${routeTown || "Kekirawa / Central"} | ${combinedTag ? `${combinedTag} | ` : ""}${paymentTag}${notes ? ` | NOTE: ${notes}` : ""}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: shopName.trim(),
        customerEmail: `shop-${Date.now()}@leenaceylon.com`,
        customerPhone: shopPhone.trim(),
        shippingAddress: address?.trim() || `${shopName}, ${routeTown || "Sri Lanka"}`,
        city: routeTown?.trim() || "Kekirawa",
        district: "Anuradhapura",
        postalCode: "50100",
        deliveryNotes: shopMetadata,
        subtotal: computedSubtotal,
        deliveryCharge: Number(deliveryCharge) || 0,
        discount: Number(discount) || 0,
        grandTotal: finalGrandTotal,
        paymentMethod: actualPaymentStatus === "PAID" && paymentMethod === "CREDIT_SHOP" ? "CASH_ON_DELIVERY" : paymentMethod,
        paymentStatus: actualPaymentStatus,
        orderStatus: "DELIVERED", // Ground shop orders are delivered directly on-site by sales reps (No online confirmation/packing/dispatch needed)
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // Optionally update inventory stock for sold items
    for (const it of items) {
      if (it.productId) {
        try {
          await prisma.product.update({
            where: { id: it.productId },
            data: {
              stock: {
                decrement: Number(it.quantity) || 1,
              },
            },
          });
        } catch (stockErr) {
          console.warn("Could not decrement stock for product:", it.productId, stockErr);
        }
      }
    }

    // Log admin activity
    const activityDetails = isCombinedActive
      ? `Took Shop Order #${order.orderNumber} for "${shopName}" with 2-Bill Combined Payment: Total Combined Rs. ${(Number(combinedPayment.oldBalance) + finalGrandTotal).toLocaleString()}, Received Today Rs. ${(Number(combinedPayment.totalReceived) || 0).toLocaleString()}, After Balance Due Rs. ${Math.max(0, (Number(combinedPayment.oldBalance) + finalGrandTotal) - (Number(combinedPayment.totalReceived) || 0)).toLocaleString()}`
      : `Took Shop Order #${order.orderNumber} for "${shopName}" (${routeTown || "Direct Route"}) - Total: Rs. ${order.grandTotal.toLocaleString()} (${order.paymentMethod})`;

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "SHOP_BILLING_ORDER",
        details: activityDetails,
        entityType: "Order",
        entityId: order.id,
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        salesRepName: repDisplayName,
        paidAmount: actualPaidAmount,
        dueAmount: actualDueAmount,
        combinedDetails: parseCombinedPaymentDetails(order.deliveryNotes),
      },
      message: isCombinedActive
        ? `Shop bill #${order.orderNumber} recorded! 2-Bill Combined Payment applied: Received Rs. ${(Number(combinedPayment.totalReceived) || 0).toLocaleString()} • After Bal: Rs. ${Math.max(0, (Number(combinedPayment.oldBalance) + finalGrandTotal) - (Number(combinedPayment.totalReceived) || 0)).toLocaleString()}`
        : `Shop bill #${order.orderNumber} recorded successfully!`,
    });
  } catch (err: any) {
    console.error("Shop billing POST error:", err);
    return NextResponse.json(
      { error: "Failed to record shop order and billing. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, orderId, paymentStatus, paymentMethod, paidAmount, paymentNote, cancelReason } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Shop bill not found." },
        { status: 404 }
      );
    }

    // 1. UPDATE PAYMENT STATUS & METHOD
    if (action === "UPDATE_PAYMENT") {
      if (!paymentStatus && !paymentMethod && paidAmount === undefined) {
        return NextResponse.json(
          { error: "Please specify payment status, method, or paid amount to update." },
          { status: 400 }
        );
      }

      const timestamp = new Date().toLocaleString("en-GB");
      const updatedStatus = paymentStatus || order.paymentStatus;
      const updatedMethod = paymentMethod || order.paymentMethod;

      let paymentTag = "";
      if (updatedStatus === "PARTIAL") {
        const numPaid = Math.min(order.grandTotal, Math.max(0, Number(paidAmount ?? 0)));
        const numDue = Math.max(0, order.grandTotal - numPaid);
        paymentTag = `[PARTIAL_PAYMENT: paid=${numPaid}, due=${numDue}]`;
      } else if (updatedStatus === "PAID") {
        paymentTag = `[FULL_PAYMENT_SETTLED: paid=${order.grandTotal}, due=0]`;
      } else if (updatedStatus === "PENDING") {
        paymentTag = `[CREDIT_MARKED_PENDING: paid=0, due=${order.grandTotal}]`;
      }

      // Clean previous payment tags to keep notes tidy
      let baseNotes = (order.deliveryNotes || "")
        .replace(/\[PARTIAL_PAYMENT:.*?\]/g, "")
        .replace(/\[FULL_PAYMENT_SETTLED:.*?\]/g, "")
        .replace(/\[CREDIT_MARKED_PENDING:.*?\]/g, "")
        .trim();

      let updatedNotes = `${baseNotes}${paymentTag ? ` | ${paymentTag}` : ""}`;
      if (paymentNote && paymentNote.trim()) {
        updatedNotes += ` | [Payment Update ${timestamp} by ${admin.name} (${admin.role})]: Status=${updatedStatus}, Method=${updatedMethod} - Note: ${paymentNote.trim()}`;
      } else {
        updatedNotes += ` | [Payment Update ${timestamp} by ${admin.name}]: Status=${updatedStatus}, Method=${updatedMethod}`;
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: updatedStatus,
          paymentMethod: updatedMethod,
          deliveryNotes: updatedNotes,
        },
        include: { items: true },
      });

      // Log activity
      const activityDetail =
        updatedStatus === "PARTIAL"
          ? `Updated Payment for Bill #${order.orderNumber} (${order.customerName}): Status=PARTIAL (${paymentTag}), Method=${updatedMethod}${paymentNote ? ` - Note: ${paymentNote.trim()}` : ""}`
          : `Updated Payment for Bill #${order.orderNumber} (${order.customerName}): Status=${updatedStatus}, Method=${updatedMethod}${paymentNote ? ` - Note: ${paymentNote.trim()}` : ""}`;

      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "UPDATE_SHOP_BILL_PAYMENT",
          details: activityDetail,
          entityType: "Order",
          entityId: order.id,
        },
      });

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: `Payment for Bill #${order.orderNumber} updated to ${updatedOrder.paymentStatus} (${updatedOrder.paymentMethod}).`,
      });
    }

    // 2. CANCEL BILL WITH AUTOMATIC INVENTORY RESTOCKING
    if (action === "CANCEL_BILL") {
      if (order.orderStatus === "CANCELLED") {
        return NextResponse.json(
          { error: "This shop bill has already been cancelled." },
          { status: 400 }
        );
      }

      const timestamp = new Date().toLocaleString("en-GB");
      const reasonText = cancelReason?.trim() || "Cancelled by Sales Representative";
      const updatedNotes = `${order.deliveryNotes || ""} | [CANCELLED ${timestamp} by ${admin.name} (${admin.role})]: ${reasonText}`;

      // Update Order to CANCELLED
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: "CANCELLED",
          deliveryNotes: updatedNotes,
        },
        include: { items: true },
      });

      // Automatically Restock Product Inventory
      let restockedCount = 0;
      for (const item of order.items) {
        if (item.productId) {
          try {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
            restockedCount += item.quantity;
          } catch (restockErr) {
            console.warn("Could not restock product ID:", item.productId, restockErr);
          }
        }
      }

      // Log activity
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "CANCEL_SHOP_BILL",
          details: `Cancelled Shop Bill #${order.orderNumber} for "${order.customerName}" - Reason: ${reasonText}. Restocked ${restockedCount} units across ${order.items.length} item lines to warehouse inventory.`,
          entityType: "Order",
          entityId: order.id,
        },
      });

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: `Shop Bill #${order.orderNumber} cancelled successfully. ${restockedCount} items restocked back to warehouse inventory.`,
      });
    }

    return NextResponse.json(
      { error: `Invalid action "${action}". Must be UPDATE_PAYMENT or CANCEL_BILL.` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Shop billing PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update shop bill. Please try again." },
      { status: 500 }
    );
  }
}

