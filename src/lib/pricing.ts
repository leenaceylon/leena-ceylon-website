/**
 * Pricing utility to resolve offer prices, regular prices, discounts,
 * and quantity-wise / gram-wise totals uniformly across Leena Ceylon.
 */

export interface PriceResolution {
  unitPrice: number;         // Active price customer pays per item (e.g. 480)
  regularPrice: number;      // Original / MRP price (e.g. 500)
  hasDiscount: boolean;      // true if regularPrice > unitPrice
  savingsPerUnit: number;    // Savings per item (e.g. 20)
  discountPercent: number;   // Discount percentage (e.g. 4)
  totalPrice: number;        // unitPrice * quantity (e.g. 960)
  totalRegularPrice: number; // regularPrice * quantity (e.g. 1000)
  totalSavings: number;      // totalRegularPrice - totalPrice (e.g. 40)
}

export function calculatePricing(
  rawRegularPrice: number | string | null | undefined,
  rawSalePrice: number | string | null | undefined,
  quantity: number = 1
): PriceResolution {
  const reg = Number(rawRegularPrice) || 0;
  const numSale =
    rawSalePrice !== null &&
    rawSalePrice !== undefined &&
    rawSalePrice !== ""
      ? Number(rawSalePrice)
      : null;
  const qty = Math.max(1, Number(quantity) || 1);

  if (numSale !== null && !isNaN(numSale) && numSale > 0) {
    if (numSale < reg) {
      // Standard: regular 500, offer 480
      const savings = reg - numSale;
      const pct = reg > 0 ? Math.round((savings / reg) * 100) : 0;
      return {
        unitPrice: numSale,
        regularPrice: reg,
        hasDiscount: true,
        savingsPerUnit: savings,
        discountPercent: pct,
        totalPrice: numSale * qty,
        totalRegularPrice: reg * qty,
        totalSavings: savings * qty,
      };
    } else if (numSale > reg && reg > 0) {
      // Inverted input in admin: user typed 480 as regular and 500 as sale/offer
      // Customer still gets the lower price 480 as offer price!
      const savings = numSale - reg;
      const pct = Math.round((savings / numSale) * 100);
      return {
        unitPrice: reg,
        regularPrice: numSale,
        hasDiscount: true,
        savingsPerUnit: savings,
        discountPercent: pct,
        totalPrice: reg * qty,
        totalRegularPrice: numSale * qty,
        totalSavings: savings * qty,
      };
    }
  }

  return {
    unitPrice: reg,
    regularPrice: reg,
    hasDiscount: false,
    savingsPerUnit: 0,
    discountPercent: 0,
    totalPrice: reg * qty,
    totalRegularPrice: reg * qty,
    totalSavings: 0,
  };
}
