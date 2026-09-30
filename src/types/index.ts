export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  size: string;
  price: number;
  regularPrice: number;
  quantity: number;
  image: string;
  sku?: string;
}

export interface WhatsAppOrderSizeOption {
  id?: string;
  sizeName: string;
  price: number;
  regularPrice?: number;
  salePrice?: number | null;
  stock?: number;
}

export interface WhatsAppOrderDetails {
  productName: string;
  size: string;
  quantity: number;
  price: number;
  regularPrice?: number;
  total: number;
  regularTotal?: number;
  savings?: number;
  availableSizes?: WhatsAppOrderSizeOption[];
}

export interface SiteSettingsMap {
  brandName: string;
  brandTagline: string;
  secondaryTagline: string;
  logoUrl: string;
  faviconUrl: string;
  currencySymbol: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  standardDeliveryFee: number;
  freeDeliveryThreshold: number;
  minOrderAmount: number;
  cashOnDeliveryEnabled: boolean;
  bankTransferEnabled: boolean;
  bankDetails: string;
  whatsappButtonText: string;
  whatsappTemplate: string;
  whatsappEnabled: boolean;
  seoTitle: string;
  seoDescription: string;
}

export type AdminRole = "SUPER_ADMIN" | "MANAGER" | "PRODUCT_MANAGER" | "ORDER_MANAGER";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}
