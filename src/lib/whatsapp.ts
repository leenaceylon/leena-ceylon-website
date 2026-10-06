import { CartItem, WhatsAppOrderDetails } from "@/types";

export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return "94717774717";
  // Remove non-digits
  let cleaned = phone.replace(/\D/g, "");
  // If starts with 0 e.g. 0717774717 -> 94717774717
  if (cleaned.startsWith("0")) {
    cleaned = "94" + cleaned.slice(1);
  } else if (!cleaned.startsWith("94")) {
    cleaned = "94" + cleaned;
  }
  return cleaned;
}

export interface WhatsAppOrderBankInfo {
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  bankSwiftCode?: string;
  bankInstructions?: string;
  bank2Name?: string;
  bank2AccountName?: string;
  bank2AccountNumber?: string;
  bank2Branch?: string;
}

export interface WhatsAppOrderCompilationParams {
  details: WhatsAppOrderDetails;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  paymentMethod?: "COD" | "BANK";
  brandName?: string;
  bankInfo?: WhatsAppOrderBankInfo;
  bankDetails?: string;
  orderNumber?: string;
}

export function compileSingleProductWhatsAppOrder(params: WhatsAppOrderCompilationParams): string {
  const {
    details,
    customerName,
    customerAddress,
    customerPhone,
    paymentMethod = "COD",
    brandName = "LEENA CEYLON",
    orderNumber = params.details.orderNumber,
  } = params;
  const isBank = paymentMethod === "BANK";

  const hasOfferDiscount = Boolean(details.regularPrice && details.regularPrice > details.price);
  const offerSavings = hasOfferDiscount
    ? (details.regularPrice! - details.price) * details.quantity
    : 0;

  const itemSubtotal = details.total;
  const couponDiscount = details.couponDiscount || 0;
  const isPickup = details.deliveryMethod === "PICKUP";
  const deliveryCharge = isPickup ? 0 : (details.deliveryCharge !== undefined ? details.deliveryCharge : 350);
  const finalPayable = details.finalTotal !== undefined
    ? details.finalTotal
    : Math.max(0, itemSubtotal - couponDiscount + deliveryCharge);

  const deliverySavings = isPickup ? 350 : (details.deliveryCharge === 0 ? 350 : 0);
  const grandSavings = offerSavings + couponDiscount + deliverySavings;
  const isComingSoon = Boolean(details.isComingSoon);

  const lines: string[] = [
    isComingSoon
      ? `⏳ *COMING SOON PRE-ORDER INQUIRY — ${brandName}* ⏳`
      : `🌿 *NEW TEA ORDER — ${brandName}* 🌿`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ...(orderNumber
      ? [
          `📌 *Order Reference:* #${orderNumber}`,
          `📋 *Status:* Registered in Store System (Pending Confirmation)`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ]
      : []),
    ...(isComingSoon
      ? [`✨ *Pre-Order / Advance Reservation Request* (Item Launching Soon)`]
      : []),
    `🛍️ *${isComingSoon ? "Pre-Order Item Details" : "Order Summary"}:*`,
    `• *Product:* ${details.productName}${isComingSoon ? " *(Coming Soon)*" : ""}`,
    `• *Weight / Size:* ${details.size}`,
    `• *Quantity:* ${details.quantity} pack(s)`,
    hasOfferDiscount
      ? `• *Unit Price:* Rs. ${details.price.toLocaleString("en-US")} (Special Offer • Regular Rs. ${details.regularPrice!.toLocaleString("en-US")})`
      : `• *Unit Price:* Rs. ${details.price.toLocaleString("en-US")}`,
    `• *Items Subtotal:* Rs. ${itemSubtotal.toLocaleString("en-US")}`,
  ];

  if (details.couponCode && couponDiscount > 0) {
    lines.push(`• *Coupon Code:* ${details.couponCode} (-Rs. ${couponDiscount.toLocaleString("en-US")})`);
  }

  if (isPickup) {
    lines.push(`• *Delivery Option:* 🏬 *Shop / Office Pick-up (Kekirawa Head Office)*`);
    lines.push(`• *Delivery Charge:* *Rs. 0 (REMOVED — Free Pick-up)*`);
  } else if (deliveryCharge === 0) {
    lines.push(`• *Delivery Option:* 🚚 *Islandwide Courier Delivery*`);
    lines.push(`• *Delivery Charge:* *Rs. 0 (FREE Delivery Applied)*`);
  } else {
    lines.push(`• *Delivery Option:* 🚚 *Islandwide Courier Delivery*`);
    lines.push(`• *Delivery Charge:* Rs. ${deliveryCharge.toLocaleString("en-US")} (Standard Courier)`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💰 *${isComingSoon ? "ESTIMATED TOTAL PAYABLE" : "FINAL PAYABLE AMOUNT"}:* *Rs. ${finalPayable.toLocaleString("en-US")}*`);
  if (grandSavings > 0) {
    lines.push(`🎉 *(Total Savings: Rs. ${grandSavings.toLocaleString("en-US")}!)*`);
  }
  lines.push(``);

  if (customerName || customerAddress || customerPhone || isPickup) {
    lines.push(`📍 *Customer & Pick-up / Delivery Details:*`);
    if (customerName) lines.push(`• *Customer Name:* ${customerName}`);
    if (customerPhone) lines.push(`• *Contact Phone:* ${customerPhone}`);
    if (isPickup) {
      lines.push(`• *Pick-up Location:* LEENA CEYLON Office, Kekirawa, Sri Lanka`);
      if (customerAddress) {
        lines.push(`• *Pick-up Notes / Customer City:* ${customerAddress}`);
      } else {
        lines.push(`• *Pick-up Notes:* Collecting directly from Kekirawa Office`);
      }
    } else {
      if (customerAddress) lines.push(`• *Delivery Address / City:* ${customerAddress}`);
    }
    lines.push(``);
  }

  if (isBank) {
    lines.push(`💳 *Payment Method:* *Direct Bank Transfer*`);
    lines.push(``);
    lines.push(`--- *${brandName.toUpperCase()} BANK DETAILS* ---`);
    if (params.bankInfo && params.bankInfo.bankAccountNumber) {
      if (params.bankInfo.bankName) lines.push(`Bank: ${params.bankInfo.bankName}`);
      if (params.bankInfo.bankAccountName) lines.push(`Account Name: ${params.bankInfo.bankAccountName}`);
      lines.push(`Account No: ${params.bankInfo.bankAccountNumber}`);
      if (params.bankInfo.bankBranch) {
        lines.push(`Branch: ${params.bankInfo.bankBranch}${params.bankInfo.bankSwiftCode ? ` (Swift: ${params.bankInfo.bankSwiftCode})` : ""}`);
      }
      if (params.bankInfo.bank2Name && params.bankInfo.bank2AccountNumber) {
        lines.push(``);
        lines.push(`*Alternative Bank Account:*`);
        lines.push(`Bank: ${params.bankInfo.bank2Name}`);
        if (params.bankInfo.bank2AccountName) lines.push(`Account Name: ${params.bankInfo.bank2AccountName}`);
        lines.push(`Account No: ${params.bankInfo.bank2AccountNumber}`);
        if (params.bankInfo.bank2Branch) lines.push(`Branch: ${params.bankInfo.bank2Branch}`);
      }
    } else if (params.bankDetails) {
      lines.push(params.bankDetails);
    } else {
      lines.push(`Bank: Commercial Bank of Ceylon PLC`);
      lines.push(`Account Name: LEENA CEYLON (PVT) LTD`);
      lines.push(`Account No: 1000 2489 7120`);
      lines.push(`Branch: Kekirawa Branch (Swift: CCEYLKLX)`);
    }
    lines.push(`Amount to Transfer: Rs. ${finalPayable.toLocaleString("en-US")}`);
    lines.push(``);
    lines.push(`I will transfer Rs. ${finalPayable.toLocaleString("en-US")} and share payment slip / screenshot here.`);
  } else {
    if (isPickup) {
      lines.push(`💳 *Payment Method:* *Pay on Pick-up (Cash / Card at Kekirawa Office)* (Pay Rs. ${finalPayable.toLocaleString("en-US")} at collection)`);
    } else {
      lines.push(`💳 *Payment Method:* *Cash on Delivery (COD)* (Pay Rs. ${finalPayable.toLocaleString("en-US")} on package arrival)`);
    }
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  if (isComingSoon) {
    lines.push(`Please reserve my pre-order and inform me as soon as the fresh batch is ready. Thank you!`);
  } else if (isPickup) {
    lines.push(`Please prepare my tea pack(s) for collection at the Kekirawa office. Thank you!`);
  } else {
    lines.push(`Please confirm my order and share dispatch tracking details. Thank you!`);
  }

  return lines.join("\n").trim();
}

export function compileSingleProductWhatsAppMessage(
  template: string,
  details: WhatsAppOrderDetails,
  customerName: string = ""
): string {
  if (template && (template.includes("{{product_name}}") || template.includes("{{total}}"))) {
    let msg = template;
    msg = msg.replace(/{{product_name}}/g, details.productName);
    msg = msg.replace(/{{size}}/g, details.size);
    msg = msg.replace(/{{weight}}/g, details.size);
    msg = msg.replace(/{{quantity}}/g, details.quantity.toString());
    msg = msg.replace(/{{price}}/g, details.price.toLocaleString("en-US"));
    msg = msg.replace(/{{total}}/g, details.total.toLocaleString("en-US"));
    msg = msg.replace(/{{order_total}}/g, details.total.toLocaleString("en-US"));
    if (customerName) {
      msg += `\n\nCustomer: ${customerName}`;
    }
    return msg.trim();
  }

  return compileSingleProductWhatsAppOrder({
    details,
    customerName,
  });
}

export function compileCartWhatsAppMessage(
  cartItems: CartItem[],
  brandName = "LEENA CEYLON"
): string {
  let itemsList = cartItems
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name} — ${item.size} × ${item.quantity} — Rs. ${(
          item.price * item.quantity
        ).toLocaleString("en-US")}`
    )
    .join("\n");

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return `Hello ${brandName},

I would like to order:

${itemsList}

Product Total: Rs. ${total.toLocaleString("en-US")}

Please confirm availability and delivery charges.

Thank you.`;
}

export function getWhatsAppUrl(phone: string, message: string): string {
  const formattedNumber = formatWhatsAppNumber(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${formattedNumber}?text=${encoded}`;
}

export function compileBankTransferWhatsAppMessage(options: {
  orderNumber?: string;
  customerName?: string;
  phone?: string;
  address?: string;
  total: number;
  items?: Array<{ name: string; size: string; quantity: number; price?: number }>;
  bankDetails?: string;
  bankInfo?: WhatsAppOrderBankInfo;
  brandName?: string;
}): string {
  const brand = options.brandName || "LEENA CEYLON";
  let bank = options.bankDetails;
  if (options.bankInfo && options.bankInfo.bankAccountNumber) {
    const bLines: string[] = [];
    if (options.bankInfo.bankName) bLines.push(`Bank: ${options.bankInfo.bankName}`);
    if (options.bankInfo.bankAccountName) bLines.push(`Account Name: ${options.bankInfo.bankAccountName}`);
    bLines.push(`Account No: ${options.bankInfo.bankAccountNumber}`);
    if (options.bankInfo.bankBranch) {
      bLines.push(`Branch: ${options.bankInfo.bankBranch}${options.bankInfo.bankSwiftCode ? ` (Swift: ${options.bankInfo.bankSwiftCode})` : ""}`);
    }
    if (options.bankInfo.bank2Name && options.bankInfo.bank2AccountNumber) {
      bLines.push(``);
      bLines.push(`*Alternative Bank Account:*`);
      bLines.push(`Bank: ${options.bankInfo.bank2Name}`);
      if (options.bankInfo.bank2AccountName) bLines.push(`Account Name: ${options.bankInfo.bank2AccountName}`);
      bLines.push(`Account No: ${options.bankInfo.bank2AccountNumber}`);
      if (options.bankInfo.bank2Branch) bLines.push(`Branch: ${options.bankInfo.bank2Branch}`);
    }
    bank = bLines.join("\n");
  } else if (!bank) {
    bank =
      "Bank: Commercial Bank of Ceylon PLC\nAccount Name: LEENA CEYLON (PVT) LTD\nAccount No: 1000 2489 7120\nBranch: Kekirawa Branch\nSwift: CCEYLKLX";
  }

  const lines: string[] = [
    `Hello ${brand},`,
    "",
    "I have chosen *Direct Bank Transfer* for my tea order:",
  ];

  if (options.orderNumber) {
    lines.push(`• *Order Reference:* ${options.orderNumber}`);
  }
  if (options.customerName) {
    lines.push(`• *Customer Name:* ${options.customerName}`);
  }
  if (options.phone) {
    lines.push(`• *Phone:* ${options.phone}`);
  }
  if (options.address) {
    lines.push(`• *Delivery Address:* ${options.address}`);
  }

  lines.push(`• *Total Payable:* Rs. ${options.total.toLocaleString("en-US")}`);

  if (options.items && options.items.length > 0) {
    lines.push("");
    lines.push("*Items Ordered:*");
    options.items.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.name} (${item.size}) × ${item.quantity}`);
    });
  }

  lines.push("");
  lines.push("--- *LEENA CEYLON BANK ACCOUNT DETAILS* ---");
  lines.push(bank);
  lines.push("-------------------------------------------");
  lines.push("");
  lines.push(
    `I will transfer the total of *Rs. ${options.total.toLocaleString(
      "en-US"
    )}* and attach my payment receipt / bank transfer slip screenshot here.`
  );
  lines.push("");
  lines.push("Please verify and confirm my order. Thank you!");

  return lines.join("\n");
}

export interface WhatsAppAdminOrderData {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: string;
  city?: string;
  district?: string;
  paymentMethod: string;
  paymentStatus?: string;
  grandTotal: number;
  deliveryCharge?: number;
  discount?: number;
  subtotal?: number;
  deliveryNotes?: string;
  items?: Array<{ productName: string; size: string; quantity: number; unitPrice?: number; subtotal?: number }>;
  brandName?: string;
}

export function compileOrderConfirmationWhatsAppMessage(order: WhatsAppAdminOrderData): string {
  const brand = order.brandName || "LEENA CEYLON";
  const isPickup =
    order.paymentMethod === "PAY_ON_PICKUP" ||
    (order.shippingAddress && order.shippingAddress.toLowerCase().includes("pick-up"));

  const lines: string[] = [
    `✅ *ORDER CONFIRMED — ${brand.toUpperCase()}* ✅`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Dear ${order.customerName || "Valued Customer"},`,
    ``,
    `Great news! We have reviewed and *CONFIRMED* your pure Ceylon tea order.`,
    ``,
    `📌 *Order Reference:* *#${order.orderNumber}*`,
    `🛍️ *Confirmed Order Items:*`,
  ];

  if (order.items && order.items.length > 0) {
    order.items.forEach((item, idx) => {
      lines.push(`${idx + 1}. *${item.productName}* (${item.size}) × ${item.quantity} pack(s)`);
    });
  }

  lines.push(``);
  lines.push(`💰 *Total Payable:* *Rs. ${order.grandTotal.toLocaleString("en-US")}*`);

  if (isPickup) {
    lines.push(`🏬 *Fulfillment:* *Office Pick-up (Kekirawa Head Office)*`);
    lines.push(`📍 *Location:* LEENA CEYLON (PVT) LTD, Kekirawa, Sri Lanka`);
    lines.push(
      `💳 *Payment:* ${
        order.paymentMethod === "BANK_TRANSFER"
          ? "Bank Transfer"
          : `Pay at Collection (Rs. ${order.grandTotal.toLocaleString("en-US")})`
      }`
    );
    lines.push(`📦 *Status:* Being packed and prepared for your collection!`);
  } else {
    lines.push(`🚚 *Fulfillment:* *Islandwide Courier Delivery*`);
    lines.push(`📍 *Delivery Address:* ${order.shippingAddress}${order.city ? `, ${order.city}` : ""}`);
    lines.push(
      `💳 *Payment Method:* ${
        order.paymentMethod === "BANK_TRANSFER"
          ? "Direct Bank Transfer"
          : "Cash on Delivery (COD)"
      }`
    );
    lines.push(`📦 *Status:* Freshly packed & prepared for courier dispatch!`);
    lines.push(`⏱️ *Estimated Delivery:* 24–48 Hours`);
  }

  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Thank you for choosing authentic Single-Origin Ceylon Tea!`);
  lines.push(`If you need to adjust anything or provide special instructions, simply reply here.`);
  lines.push(``);
  lines.push(`Warm regards,`);
  lines.push(`🌿 *${brand} Team*`);

  return lines.join("\n").trim();
}

export function compileOrderShippedWhatsAppMessage(
  order: WhatsAppAdminOrderData,
  trackingNumber?: string
): string {
  const brand = order.brandName || "LEENA CEYLON";
  const lines: string[] = [
    `🚚 *ORDER DISPATCHED — ${brand.toUpperCase()}* 🚚`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Dear ${order.customerName || "Valued Customer"},`,
    ``,
    `Your order *#${order.orderNumber}* has been dispatched via courier!`,
    ``,
    ...(trackingNumber ? [`📦 *Tracking / Waybill Number:* *${trackingNumber}*`, ``] : []),
    `📍 *Delivery Destination:* ${order.shippingAddress}${order.city ? `, ${order.city}` : ""}`,
    `💰 *Payable on Arrival:* *Rs. ${order.grandTotal.toLocaleString("en-US")}*`,
    ``,
    `Your package will arrive within 24–48 hours. Please ensure someone is available at the address to receive the parcel.`,
    ``,
    `Enjoy your fresh Ceylon tea cup! 🍵`,
    `🌿 *${brand} (PVT) LTD*`,
  ];
  return lines.join("\n").trim();
}

