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

export interface WhatsAppOrderCompilationParams {
  details: WhatsAppOrderDetails;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  paymentMethod?: "COD" | "BANK";
  brandName?: string;
}

export function compileSingleProductWhatsAppOrder(params: WhatsAppOrderCompilationParams): string {
  const {
    details,
    customerName,
    customerAddress,
    customerPhone,
    paymentMethod = "COD",
    brandName = "LEENA CEYLON",
  } = params;
  const isBank = paymentMethod === "BANK";

  const hasDiscount = Boolean(details.regularPrice && details.regularPrice > details.price);
  const totalSavings = hasDiscount
    ? (details.regularPrice! - details.price) * details.quantity
    : 0;

  const lines: string[] = [
    `🌿 *NEW TEA ORDER — ${brandName}* 🌿`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🛍️ *Order Item:*`,
    `• *Product:* ${details.productName}`,
    `• *Weight / Size:* ${details.size}`,
    `• *Quantity:* ${details.quantity} pack(s)`,
    hasDiscount
      ? `• *Unit Price:* Rs. ${details.price.toLocaleString("en-US")} (Special Offer • Regular Rs. ${details.regularPrice!.toLocaleString("en-US")})`
      : `• *Unit Price:* Rs. ${details.price.toLocaleString("en-US")}`,
    hasDiscount
      ? `• *Order Total:* *Rs. ${details.total.toLocaleString("en-US")}* (🎉 You Save Rs. ${totalSavings.toLocaleString("en-US")}!)`
      : `• *Order Total:* *Rs. ${details.total.toLocaleString("en-US")}*`,
    ``,
  ];

  if (customerName || customerAddress || customerPhone) {
    lines.push(`📍 *Customer & Delivery Details:*`);
    if (customerName) lines.push(`• *Name:* ${customerName}`);
    if (customerPhone) lines.push(`• *Contact Phone:* ${customerPhone}`);
    if (customerAddress) lines.push(`• *Delivery Address / City:* ${customerAddress}`);
    lines.push(``);
  }

  if (isBank) {
    lines.push(`💳 *Payment Preference:* *Direct Bank Transfer*`);
    lines.push(``);
    lines.push(`--- *LEENA CEYLON BANK DETAILS* ---`);
    lines.push(`Bank: Commercial Bank of Ceylon PLC`);
    lines.push(`Account Name: LEENA CEYLON (PVT) LTD`);
    lines.push(`Account No: 1000 2489 7120`);
    lines.push(`Branch: Kekirawa Branch (Swift: CCEYLKLX)`);
    lines.push(`Amount to Transfer: Rs. ${details.total.toLocaleString("en-US")}`);
    lines.push(``);
    lines.push(`I will transfer Rs. ${details.total.toLocaleString("en-US")} to this account and send my deposit slip / transfer screenshot here.`);
  } else {
    lines.push(`💳 *Payment Preference:* *Cash on Delivery (COD)* (Islandwide Delivery)`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Please confirm my order and share dispatch details. Thank you!`);

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
  brandName?: string;
}): string {
  const brand = options.brandName || "LEENA CEYLON";
  const defaultBank =
    "Bank: Commercial Bank of Ceylon PLC\nAccount Name: LEENA CEYLON (PVT) LTD\nAccount No: 1000 2489 7120\nBranch: Kekirawa Branch\nSwift: CCEYLKLX";
  const bank = options.bankDetails || defaultBank;

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

