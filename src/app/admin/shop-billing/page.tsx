"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Store,
  Plus,
  Trash2,
  Printer,
  Receipt,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  CreditCard,
  Building2,
  MapPin,
  Phone,
  FileText,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ChevronDown,
  X,
  History,
  Layers,
  Boxes,
  Package,
  Tag,
  Filter,
  AlertTriangle,
  Ban,
  Check,
  DollarSign,
  XCircle,
  UserCheck,
  User,
  Camera,
  QrCode,
  PlusCircle,
  ScanLine,
  UserPlus,
} from "lucide-react";
import { getWhatsAppUrl, compileShopInvoiceWhatsAppMessage, ShopInvoiceData } from "@/lib/whatsapp";
import ShopQrScannerModal from "@/components/admin/ShopQrScannerModal";
import ShopQrStickerModal from "@/components/admin/ShopQrStickerModal";
import RegisterShopModal from "@/components/admin/RegisterShopModal";

interface ProductVariant {
  id: string;
  sizeName: string;
  weightGram: number;
  regularPrice: number;
  salePrice: number | null;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  teaGrade: string;
  teaType: string;
  mainImage: string;
  category?: { name: string };
  regularPrice: number;
  stock: number;
  sizes: ProductVariant[];
}

interface BillItem {
  id: string;
  productId: string;
  productName: string;
  size: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  image: string;
}

interface KnownShop {
  shopCode?: string;
  shopName: string;
  ownerName?: string;
  phone: string;
  routeTown: string;
  address: string;
  district?: string;
  assignedRep?: string;
  isRegistered?: boolean;
  totalBillsCount?: number;
  totalSalesAmount?: number;
  pendingBalance?: number;
  pendingBillsCount?: number;
  pendingBills?: Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
    grandTotal: number;
    paidAmount?: number;
    dueAmount?: number;
    paymentMethod: string;
    paymentStatus: string;
    deliveryNotes?: string;
  }>;
  allBills?: Array<any>;
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

export default function ShopBillingPage() {
  const [activeTab, setActiveTab] = useState<"billing" | "products" | "history" | "shops">("billing");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // QR Code Scanner, Sticker & Shop Registration Modals
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrStickerModalOpen, setQrStickerModalOpen] = useState(false);
  const [registerShopModalOpen, setRegisterShopModalOpen] = useState(false);
  const [stickerShop, setStickerShop] = useState<KnownShop | null>(null);
  const [shopFilterTown, setShopFilterTown] = useState("ALL");
  const [shopSearchQuery, setShopSearchQuery] = useState("");

  // Sales Representative State (Who is taking this ground shop bill)
  const [salesRepName, setSalesRepName] = useState<string>("");
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  const handleSalesRepNameChange = (name: string) => {
    setSalesRepName(name);
    if (typeof window !== "undefined") {
      localStorage.setItem("leena_saved_sales_rep_name", name);
    }
  };

  // Inventory & Known Shops
  const [products, setProducts] = useState<Product[]>([]);
  const [knownShops, setKnownShops] = useState<KnownShop[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Shop Details Form
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [routeTown, setRouteTown] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [customerConfirmed, setCustomerConfirmed] = useState<boolean>(false);

  // Item Selector State
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [productSearch, setProductSearch] = useState("");

  // Bill Cart Line Items
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  // Financial Calculations & Settlement (Single Enter Box Settlement)
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH_ON_DELIVERY");
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [isManualPaid, setIsManualPaid] = useState<boolean>(false);

  // Invoicing & Print Modal State
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printFormat, setPrintFormat] = useState<"terminal" | "standard">("terminal");

  // Shop Bills Ledger Search & Filters
  const [searchLedger, setSearchLedger] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("ALL");
  const [filterOrderStatus, setFilterOrderStatus] = useState("ALL");

  // Payment Update Modal State
  const [paymentModalOrder, setPaymentModalOrder] = useState<any | null>(null);
  const [paymentModalStatus, setPaymentModalStatus] = useState("PAID");
  const [paymentModalMethod, setPaymentModalMethod] = useState("CASH_ON_DELIVERY");
  const [paymentModalPaidAmount, setPaymentModalPaidAmount] = useState<number>(0);
  const [paymentModalNote, setPaymentModalNote] = useState("");
  const [paymentModalSubmitting, setPaymentModalSubmitting] = useState(false);

  // Cancel Bill Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState<any | null>(null);
  const [cancelModalReason, setCancelModalReason] = useState("");
  const [cancelModalSubmitting, setCancelModalSubmitting] = useState(false);

  // Load Inventory & Orders
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/shop-billing");
      const data = await res.json();
      if (data.products) setProducts(data.products);
      if (data.knownShops) setKnownShops(data.knownShops);
      if (data.recentShopOrders) setRecentOrders(data.recentShopOrders);
      if (data.currentAdmin) setCurrentAdmin(data.currentAdmin);

      // Initialize persistent sales rep name from localStorage or logged-in account
      if (typeof window !== "undefined") {
        const savedRep = localStorage.getItem("leena_saved_sales_rep_name");
        if (savedRep && savedRep.trim()) {
          setSalesRepName(savedRep.trim());
        } else if (data.currentAdmin?.name) {
          setSalesRepName(data.currentAdmin.name);
          localStorage.setItem("leena_saved_sales_rep_name", data.currentAdmin.name);
        }
      }

      if (data.products && data.products.length > 0 && !selectedProductId) {
        initProductSelection(data.products[0]);
      }

      // Check if URL has ?shop= to preselect shop
      if (typeof window !== "undefined") {
        const pShop = new URLSearchParams(window.location.search).get("shop");
        if (pShop && data.knownShops) {
          const match = data.knownShops.find(
            (sh: KnownShop) => sh.shopName.toLowerCase().trim() === pShop.toLowerCase().trim()
          );
          if (match) {
            handleSelectKnownShop(match);
          } else {
            setShopName(pShop);
            setCustomerConfirmed(true);
          }
        }

        // Check if URL has ?scan=true to automatically launch camera scanner
        const pScan = new URLSearchParams(window.location.search).get("scan");
        if (pScan === "true" || pScan === "1") {
          setQrScannerOpen(true);
        }
      }
    } catch (e) {
      console.error("Failed to load inventory:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (p === "products") setActiveTab("products");
      else if (p === "history") setActiveTab("history");
      else if (p === "shops") setActiveTab("shops");

      const s = new URLSearchParams(window.location.search).get("search");
      if (s) setSearchLedger(s);
    }
  }, []);

  // Handlers for Shop QR Scanning & Registration
  const handleShopDetectedFromQr = (shop: any, rawCode?: string) => {
    handleSelectKnownShop(shop);
    setActiveTab("billing");
    setQrScannerOpen(false);

    const hasDue = (shop.pendingBalance || 0) > 0;
    setNotice(
      `✅ Scanned Shop: "${shop.shopName}" (${shop.routeTown || "Route"})${
        hasDue ? ` • [OLD DUE: Rs. ${shop.pendingBalance.toLocaleString()}]` : " • [ACCOUNT CLEAN]"
      }. History loaded & new bill ready!`
    );
    setTimeout(() => setNotice(null), 6000);
  };

  const handleShopNotFoundFromQr = (rawQuery: string) => {
    setQrScannerOpen(false);
    if (
      confirm(
        `Shop "${rawQuery}" is not found in registered shops. Would you like to register this new shop now?`
      )
    ) {
      setRegisterShopModalOpen(true);
    }
  };

  const handleShopRegistered = (newShop: any) => {
    setKnownShops((prev) => [
      newShop,
      ...prev.filter((s) => s.shopName.toLowerCase() !== newShop.shopName.toLowerCase()),
    ]);
    handleSelectKnownShop(newShop);
    setActiveTab("billing");

    // Open QR Sticker modal immediately for the new shop so rep can print/download it
    setStickerShop(newShop);
    setQrStickerModalOpen(true);

    setNotice(`🎉 Shop "${newShop.shopName}" registered successfully! QR Sticker generated.`);
    setTimeout(() => setNotice(null), 5000);
  };

  // Quick Action Handlers for Sales Reps
  const handleOpenPaymentModal = (order: any, defaultStatus?: string) => {
    setPaymentModalOrder(order);
    const initialStatus = defaultStatus || order.paymentStatus || "PAID";
    setPaymentModalStatus(initialStatus);
    setPaymentModalMethod(order.paymentMethod || "CASH_ON_DELIVERY");
    setPaymentModalNote("");

    const grandTotal = Number(order.grandTotal) || 0;
    if (order.paidAmount !== undefined && order.paidAmount > 0 && initialStatus === "PARTIAL") {
      setPaymentModalPaidAmount(order.paidAmount);
    } else if (initialStatus === "PARTIAL") {
      setPaymentModalPaidAmount(Math.round(grandTotal / 2));
    } else if (initialStatus === "PAID") {
      setPaymentModalPaidAmount(grandTotal);
    } else {
      setPaymentModalPaidAmount(0);
    }
  };

  // Instant settlement of old bills during new bill creation
  const handleQuickSettleBill = async (order: any, type: "FULL" | "HALF") => {
    try {
      const isFull = type === "FULL";
      const grandTotal = Number(order.grandTotal) || 0;
      const targetPaid = isFull ? grandTotal : Math.round(grandTotal / 2);
      const targetStatus = isFull ? "PAID" : "PARTIAL";

      setNotice(`Updating payment for Old Bill #${order.orderNumber}...`);
      const res = await fetch("/api/admin/shop-billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PAYMENT",
          orderId: order.id,
          paymentStatus: targetStatus,
          paymentMethod: "CASH_ON_DELIVERY",
          paidAmount: targetPaid,
          paymentNote: isFull
            ? "Settled in full during new bill collection"
            : `Half payment of Rs. ${targetPaid.toLocaleString()} collected during new bill collection`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to update old bill payment.");
        return;
      }

      setNotice(
        isFull
          ? `✓ Old Bill #${order.orderNumber} settled in full! Balance cleared.`
          : `✓ Half payment of Rs. ${targetPaid.toLocaleString()} recorded for Old Bill #${order.orderNumber}!`
      );
      setTimeout(() => setNotice(null), 4000);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Network error updating old bill payment.");
    }
  };

  const handleSavePaymentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalOrder) return;
    try {
      setPaymentModalSubmitting(true);
      const res = await fetch("/api/admin/shop-billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PAYMENT",
          orderId: paymentModalOrder.id,
          paymentStatus: paymentModalStatus,
          paymentMethod: paymentModalMethod,
          paidAmount:
            paymentModalStatus === "PARTIAL"
              ? paymentModalPaidAmount
              : paymentModalStatus === "PAID"
              ? paymentModalOrder.grandTotal
              : 0,
          paymentNote: paymentModalNote,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to update payment status.");
        return;
      }

      setNotice(
        paymentModalStatus === "PARTIAL"
          ? `✓ Payment for Bill #${paymentModalOrder.orderNumber} updated to PARTIAL (Paid: Rs. ${paymentModalPaidAmount.toLocaleString()} | Due: Rs. ${(paymentModalOrder.grandTotal - paymentModalPaidAmount).toLocaleString()})!`
          : `✓ Payment for Bill #${paymentModalOrder.orderNumber} updated to ${paymentModalStatus} (${paymentModalMethod})!`
      );
      setTimeout(() => setNotice(null), 4000);
      setPaymentModalOrder(null);
      loadData();
    } catch (err) {
      console.error("Payment update error:", err);
      alert("Network error updating payment.");
    } finally {
      setPaymentModalSubmitting(false);
    }
  };

  const handleOpenCancelModal = (order: any) => {
    setCancelModalOrder(order);
    setCancelModalReason("");
  };

  const handleConfirmCancelBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder) return;
    try {
      setCancelModalSubmitting(true);
      const res = await fetch("/api/admin/shop-billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL_BILL",
          orderId: cancelModalOrder.id,
          cancelReason: cancelModalReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to cancel bill.");
        return;
      }

      setNotice(
        `Bill #${cancelModalOrder.orderNumber} cancelled successfully. Items restocked to inventory!`
      );
      setTimeout(() => setNotice(null), 4000);
      setCancelModalOrder(null);
      loadData();
    } catch (err) {
      console.error("Cancel bill error:", err);
      alert("Network error cancelling bill.");
    } finally {
      setCancelModalSubmitting(false);
    }
  };

  // Filtered Ledger Orders with Real-Time Search
  const filteredLedgerOrders = useMemo(() => {
    return recentOrders.filter((o) => {
      const q = searchLedger.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
        (o.city && o.city.toLowerCase().includes(q)) ||
        (o.shippingAddress && o.shippingAddress.toLowerCase().includes(q)) ||
        (o.deliveryNotes && o.deliveryNotes.toLowerCase().includes(q));

      const matchesPayment =
        filterPaymentStatus === "ALL" || o.paymentStatus === filterPaymentStatus;

      const matchesOrder =
        filterOrderStatus === "ALL" ||
        (filterOrderStatus === "CONFIRMED" && o.orderStatus !== "CANCELLED") ||
        (filterOrderStatus === "CANCELLED" && o.orderStatus === "CANCELLED");

      return matchesSearch && matchesPayment && matchesOrder;
    });
  }, [recentOrders, searchLedger, filterPaymentStatus, filterOrderStatus]);

  // Ledger High-Level Metrics
  const ledgerStats = useMemo(() => {
    const nonCancelled = recentOrders.filter((o) => o.orderStatus !== "CANCELLED");
    const totalRevenue = nonCancelled.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const totalPaid = nonCancelled.reduce(
      (sum, o) =>
        sum +
        (o.paidAmount !== undefined
          ? o.paidAmount
          : o.paymentStatus === "PAID"
          ? o.grandTotal
          : 0),
      0
    );
    const totalCredit = nonCancelled.reduce(
      (sum, o) =>
        sum +
        (o.dueAmount !== undefined
          ? o.dueAmount
          : o.paymentStatus === "PAID"
          ? 0
          : o.grandTotal),
      0
    );
    const paidCount = nonCancelled.filter((o) => o.paymentStatus === "PAID").length;
    const partialCount = nonCancelled.filter((o) => o.paymentStatus === "PARTIAL").length;
    const creditCount = nonCancelled.filter(
      (o) => o.paymentStatus === "PENDING" || o.paymentMethod === "CREDIT_SHOP"
    ).length;
    const cancelledCount = recentOrders.filter((o) => o.orderStatus === "CANCELLED").length;

    return {
      totalBills: recentOrders.length,
      totalRevenue,
      totalPaid,
      totalCredit,
      paidCount,
      partialCount,
      creditCount,
      cancelledCount,
    };
  }, [recentOrders]);

  // Automatically detect selected known shop and calculate its pending credit balance
  const selectedKnownShop = useMemo(() => {
    if (!shopName.trim()) return null;
    const clean = shopName.trim().toLowerCase();
    return knownShops.find((s) => s.shopName.trim().toLowerCase() === clean) || null;
  }, [shopName, knownShops]);

  const handleSelectProductForBill = (prod: Product, preferredSize?: string) => {
    setSelectedProductId(prod.id);
    if (prod.sizes && prod.sizes.length > 0) {
      const match = preferredSize ? prod.sizes.find((s) => s.sizeName === preferredSize) : prod.sizes[0];
      const targetSize = match || prod.sizes[0];
      setSelectedSize(targetSize.sizeName);
      setItemUnitPrice(targetSize.salePrice || targetSize.regularPrice);
    } else {
      setSelectedSize("Standard");
      setItemUnitPrice(prod.regularPrice);
    }
    setItemQuantity(1);
    setActiveTab("billing");
    setNotice(`Selected "${prod.name}" (${preferredSize || "Standard"}). Specify quantity and tap Add Line to Bill.`);
    setTimeout(() => setNotice(null), 3500);
  };

  const initProductSelection = (prod: Product) => {
    setSelectedProductId(prod.id);
    if (prod.sizes && prod.sizes.length > 0) {
      const v = prod.sizes[0];
      setSelectedSize(v.sizeName);
      setItemUnitPrice(v.salePrice || v.regularPrice);
    } else {
      setSelectedSize("Standard");
      setItemUnitPrice(prod.regularPrice);
    }
    setItemQuantity(1);
  };

  // Filtered Products for quick picker
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const term = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.teaGrade.toLowerCase().includes(term) ||
        p.category?.name.toLowerCase().includes(term)
    );
  }, [products, productSearch]);

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return Array.from(set);
  }, [products]);

  const filteredCatalogProducts = useMemo(() => {
    return products.filter((p) => {
      const q = catalogSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.teaGrade && p.teaGrade.toLowerCase().includes(q)) ||
        (p.teaType && p.teaType.toLowerCase().includes(q)) ||
        (p.category?.name && p.category.name.toLowerCase().includes(q));

      const matchesCat =
        catalogCategory === "ALL" || p.category?.name === catalogCategory;

      return matchesSearch && matchesCat;
    });
  }, [products, catalogSearch, catalogCategory]);

  const currentSelectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const handleProductChange = (prodId: string) => {
    const p = products.find((x) => x.id === prodId);
    if (p) {
      initProductSelection(p);
    }
  };

  const handleVariantChange = (sizeName: string) => {
    setSelectedSize(sizeName);
    if (currentSelectedProduct?.sizes) {
      const v = currentSelectedProduct.sizes.find((x) => x.sizeName === sizeName);
      if (v) {
        setItemUnitPrice(v.salePrice || v.regularPrice);
      }
    }
  };

  // Add Item Line to Bill
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedProduct) return;

    if (itemQuantity <= 0) {
      alert("Please enter a valid quantity (at least 1 pack).");
      return;
    }

    const subtotal = Number(itemUnitPrice) * Number(itemQuantity);

    // Check if identical item already exists in bill -> increment quantity
    const existingIndex = billItems.findIndex(
      (it) => it.productId === currentSelectedProduct.id && it.size === selectedSize
    );

    if (existingIndex > -1) {
      const updated = [...billItems];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + itemQuantity;
      updated[existingIndex] = {
        ...existing,
        unitPrice: Number(itemUnitPrice),
        quantity: newQty,
        subtotal: Number(itemUnitPrice) * newQty,
      };
      setBillItems(updated);
    } else {
      const newItem: BillItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: currentSelectedProduct.id,
        productName: currentSelectedProduct.name,
        size: selectedSize,
        unitPrice: Number(itemUnitPrice),
        quantity: Number(itemQuantity),
        subtotal,
        image: currentSelectedProduct.mainImage || "/uploads/leena-tea-powder-200g.jpeg",
      };
      setBillItems([...billItems, newItem]);
    }

    // Reset item quantity for next quick addition
    setItemQuantity(1);
    setNotice(`Added "${currentSelectedProduct.name} (${selectedSize})" to bill.`);
    setTimeout(() => setNotice(null), 2500);
  };

  const handleUpdateItemQty = (id: string, delta: number) => {
    const updated = billItems
      .map((it) => {
        if (it.id === id) {
          const newQty = it.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...it,
            quantity: newQty,
            subtotal: it.unitPrice * newQty,
          };
        }
        return it;
      })
      .filter(Boolean) as BillItem[];

    setBillItems(updated);
  };

  const handleRemoveItem = (id: string) => {
    setBillItems(billItems.filter((it) => it.id !== id));
  };

  // Financial Subtotals
  const billSubtotal = useMemo(() => {
    return billItems.reduce(
      (acc, it) =>
        acc +
        (Number(it.subtotal) ||
          Number(it.unitPrice || 0) * Number(it.quantity || 1)),
      0
    );
  }, [billItems]);

  const billGrandTotal = useMemo(() => {
    return Math.max(
      0,
      billSubtotal - Number(discountAmount || 0) + Number(deliveryCharge || 0)
    );
  }, [billSubtotal, discountAmount, deliveryCharge]);

  // 2-Bill Combined Arithmetic & Waterfall Logic
  const oldShopDebt = useMemo(() => {
    return selectedKnownShop?.pendingBalance || 0;
  }, [selectedKnownShop]);

  const hasOldDebt = Boolean(selectedKnownShop && oldShopDebt > 0);
  const totalCombinedBalance = billGrandTotal + (hasOldDebt ? oldShopDebt : 0);
  const totalAmountDue = totalCombinedBalance;

  // Auto-sync default payment to total due unless the sales rep manually enters a custom amount
  useEffect(() => {
    if (!isManualPaid && totalAmountDue > 0) {
      setPaidAmount(totalAmountDue);
    }
  }, [totalAmountDue, isManualPaid]);

  const numericPaid = paidAmount === "" ? 0 : Number(paidAmount) || 0;
  const afterBalance = Math.max(0, totalAmountDue - numericPaid);

  const computedPaymentStatus = useMemo(() => {
    if (totalAmountDue === 0) return "PAID";
    if (afterBalance === 0) return "PAID";
    if (numericPaid > 0) return "PARTIAL";
    return "PENDING";
  }, [totalAmountDue, afterBalance, numericPaid]);

  const combinedAllocation = useMemo(() => {
    const toOld = Math.min(oldShopDebt, numericPaid);
    const remainingForNew = Math.max(0, numericPaid - oldShopDebt);
    const toNew = Math.min(billGrandTotal, remainingForNew);
    return {
      allocatedToOld: toOld,
      allocatedToNew: toNew,
      oldSettled: toOld >= oldShopDebt,
      newSettled: toNew >= billGrandTotal,
      newPartial: toNew > 0 && toNew < billGrandTotal,
    };
  }, [oldShopDebt, billGrandTotal, numericPaid]);

  // Autocomplete shop from known shops list
  const handleSelectKnownShop = (shop: KnownShop) => {
    setShopName(shop.shopName);
    setShopPhone(shop.phone);
    setRouteTown(shop.routeTown);
    setAddress(shop.address);
    if (shop.ownerName) setOwnerName(shop.ownerName);
    setCustomerConfirmed(true);
  };

  // Finalize & Save Shop Bill
  const handleSaveOrder = async () => {
    if (!salesRepName.trim()) {
      alert("Please enter the Sales Representative Name who is taking this shop order.");
      return;
    }
    if (!shopName.trim()) {
      alert("Please enter the Shop / Store Name.");
      return;
    }
    if (!shopPhone.trim()) {
      alert("Please enter the Shop Phone / WhatsApp number.");
      return;
    }
    if (billItems.length === 0) {
      alert("Please add at least one tea item to this bill.");
      return;
    }

    try {
      setSubmitting(true);
      const isCombined = hasOldDebt;
      const res = await fetch("/api/admin/shop-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesRepName: salesRepName.trim(),
          shopName,
          ownerName,
          shopPhone,
          routeTown,
          address,
          items: billItems,
          subtotal: billSubtotal,
          discount: Number(discountAmount || 0),
          deliveryCharge: Number(deliveryCharge || 0),
          grandTotal: billGrandTotal,
          paymentMethod,
          paymentStatus: computedPaymentStatus,
          paidAmount: isCombined ? combinedAllocation.allocatedToNew : numericPaid,
          notes,
          combinedPayment: isCombined
            ? {
                isCombined: true,
                oldBalance: oldShopDebt,
                totalReceived: numericPaid,
                afterBalance,
              }
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to record shop order.");
        return;
      }

      setCompletedOrder(data.order);
      setNotice(
        isCombined
          ? `Shop Order #${data.order.orderNumber} saved! Settlement recorded (Paid: Rs. ${numericPaid.toLocaleString()} • After Bal: Rs. ${afterBalance.toLocaleString()})!`
          : `Shop Order #${data.order.orderNumber} successfully finalized!`
      );
      setTimeout(() => setNotice(null), 4000);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Network error while recording shop order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNewBill = () => {
    setShopName("");
    setOwnerName("");
    setShopPhone("");
    setRouteTown("");
    setAddress("");
    setNotes("");
    setBillItems([]);
    setDiscountAmount(0);
    setDeliveryCharge(0);
    setPaymentMethod("CASH_ON_DELIVERY");
    setPaidAmount("");
    setIsManualPaid(false);
    setCompletedOrder(null);
    setCustomerConfirmed(false);
  };

  // Synchronize dedicated body-level portal for direct print spooling (Mobile & Desktop)
  useEffect(() => {
    if (!printModalOpen) {
      document.body.classList.remove("is-printing-bill", "printing-terminal", "printing-standard");
      const pageStyle = document.getElementById("leena-print-page-style");
      if (pageStyle && pageStyle.parentNode) {
        pageStyle.parentNode.removeChild(pageStyle);
      }
      const printPortal = document.getElementById("print-receipt-portal");
      if (printPortal) {
        printPortal.innerHTML = "";
      }
      return;
    }

    const isTerminal = printFormat === "terminal";
    document.body.classList.add("is-printing-bill");
    document.body.classList.remove(isTerminal ? "printing-standard" : "printing-terminal");
    document.body.classList.add(isTerminal ? "printing-terminal" : "printing-standard");

    // Dynamic @page styling for 80mm continuous roll vs A4
    let pageStyle = document.getElementById("leena-print-page-style");
    if (!pageStyle) {
      pageStyle = document.createElement("style");
      pageStyle.id = "leena-print-page-style";
      document.head.appendChild(pageStyle);
    }
    pageStyle.innerHTML = isTerminal
      ? `@page { size: 80mm auto !important; margin: 0 !important; }`
      : `@page { size: A4 portrait !important; margin: 8mm !important; }`;

    const syncPortal = () => {
      const elementId = isTerminal ? "printable-receipt" : "printable-invoice";
      const sourceEl = document.getElementById(elementId);
      let printPortal = document.getElementById("print-receipt-portal");
      if (!printPortal) {
        printPortal = document.createElement("div");
        printPortal.id = "print-receipt-portal";
        document.body.appendChild(printPortal);
      }
      if (sourceEl) {
        printPortal.innerHTML = sourceEl.outerHTML;
      }
    };

    // Sync on next frame and after brief delay to ensure render
    requestAnimationFrame(syncPortal);
    const timer = setTimeout(syncPortal, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [printModalOpen, printFormat, completedOrder]);

  const handlePrint = () => {
    const isTerminal = printFormat === "terminal";
    const elementId = isTerminal ? "printable-receipt" : "printable-invoice";
    const sourceEl = document.getElementById(elementId);

    // Make sure portal is created directly on document.body with freshest HTML
    let printPortal = document.getElementById("print-receipt-portal");
    if (!printPortal) {
      printPortal = document.createElement("div");
      printPortal.id = "print-receipt-portal";
      document.body.appendChild(printPortal);
    }
    if (sourceEl) {
      printPortal.innerHTML = sourceEl.outerHTML;
    }

    // Set body classes for @media print
    document.body.classList.add("is-printing-bill");
    document.body.classList.remove(isTerminal ? "printing-standard" : "printing-terminal");
    document.body.classList.add(isTerminal ? "printing-terminal" : "printing-standard");

    // Ensure dynamic @page styling
    let pageStyle = document.getElementById("leena-print-page-style");
    if (!pageStyle) {
      pageStyle = document.createElement("style");
      pageStyle.id = "leena-print-page-style";
      document.head.appendChild(pageStyle);
    }
    pageStyle.innerHTML = isTerminal
      ? `@page { size: 80mm auto !important; margin: 0 !important; }`
      : `@page { size: A4 portrait !important; margin: 8mm !important; }`;

    // Direct native browser print (natively supported on Mobile Chrome/Safari & Desktop)
    setTimeout(() => {
      window.print();
    }, 80);
  };


  // Compile WhatsApp URL for completed bill or current bill
  const getWhatsAppBillUrl = () => {
    if (!completedOrder && billItems.length === 0) return "#";

    const targetOrder = completedOrder || {
      orderNumber: `PREVIEW-${Date.now().toString().slice(-4)}`,
      customerName: shopName,
      customerPhone: shopPhone,
      city: routeTown,
      shippingAddress: address,
      subtotal: billSubtotal,
      discount: discountAmount,
      deliveryCharge,
      grandTotal: billGrandTotal,
      paymentMethod,
      paymentStatus: computedPaymentStatus,
      paidAmount: hasOldDebt ? combinedAllocation.allocatedToNew : numericPaid,
      dueAmount: hasOldDebt
        ? Math.max(0, billGrandTotal - combinedAllocation.allocatedToNew)
        : afterBalance,
      items: billItems,
    };

    const isCombinedActive = hasOldDebt;
    const combinedPaymentData = completedOrder?.combinedDetails
      ? completedOrder.combinedDetails
      : isCombinedActive
      ? {
          isCombined: true,
          oldBalance: oldShopDebt,
          newBillTotal: billGrandTotal,
          totalCombined: totalCombinedBalance,
          totalReceived: numericPaid,
          afterBalance,
        }
      : undefined;

    const invoiceData: ShopInvoiceData = {
      orderNumber: targetOrder.orderNumber,
      shopName: targetOrder.customerName || shopName,
      ownerName,
      salesRepName: targetOrder.salesRepName || extractSalesRepName(targetOrder.deliveryNotes) || salesRepName || "Sales Rep",
      shopPhone: targetOrder.customerPhone || shopPhone,
      routeTown: targetOrder.city || routeTown,
      address: targetOrder.shippingAddress || address,
      items: (targetOrder.items || billItems).map((it: any) => ({
        productName: it.productName,
        size: it.size,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
      })),
      subtotal: targetOrder.subtotal,
      discount: targetOrder.discount,
      deliveryCharge: targetOrder.deliveryCharge,
      grandTotal: targetOrder.grandTotal,
      paymentMethod: targetOrder.paymentMethod,
      paymentStatus: targetOrder.paymentStatus,
      paidAmount: targetOrder.paidAmount,
      dueAmount: targetOrder.dueAmount,
      notes,
      combinedPayment: combinedPaymentData,
    };

    const message = compileShopInvoiceWhatsAppMessage(invoiceData);
    return getWhatsAppUrl(targetOrder.customerPhone || shopPhone, message);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-tea-border">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Store className="w-3.5 h-3.5 text-emerald-700" />
              <span>Shop-by-Shop POS & Van Sale</span>
            </span>
            <span className="text-xs text-tea-muted font-medium">• QR Scanner & Automatic History</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark mt-1">
            Shop Order Taking & Invoicing
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Scan shop counter QR codes, automatically load debt history, take items, create instant bills, and print 80mm receipts.
          </p>

          {/* Quick QR & Shop Action Buttons on Mobile & Desktop */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setQrScannerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-tea-dark to-tea-forest hover:from-tea-forest hover:to-tea-dark text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition"
            >
              <Camera className="w-4 h-4 text-tea-gold" />
              <span>Scan Shop QR</span>
            </button>

            <button
              type="button"
              onClick={() => setRegisterShopModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-tea-surface text-tea-dark font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-tea-border shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4 text-tea-leaf" />
              <span>+ Register New Shop</span>
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("billing")}
            className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "billing"
                ? "bg-tea-dark text-white shadow-sm"
                : "bg-white text-tea-muted hover:text-tea-dark border border-tea-border"
            }`}
          >
            <Plus className="w-4 h-4 text-tea-gold" />
            <span>Billing Counter</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("shops")}
            className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "shops"
                ? "bg-tea-dark text-white shadow-sm"
                : "bg-white text-tea-muted hover:text-tea-dark border border-tea-border"
            }`}
          >
            <QrCode className="w-4 h-4 text-tea-gold" />
            <span>Shops & QR ({knownShops.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "history"
                ? "bg-tea-dark text-white shadow-sm"
                : "bg-white text-tea-muted hover:text-tea-dark border border-tea-border"
            }`}
          >
            <History className="w-4 h-4 text-tea-gold" />
            <span>Ledger ({recentOrders.length})</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {/* Success Notification Bar when Order Completed */}
      {completedOrder && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-scale-up">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider">
                Bill Finalized
              </span>
              <span className="font-serif font-bold text-lg text-emerald-950">
                Invoice #{completedOrder.orderNumber}
              </span>
            </div>
            <p className="text-xs text-emerald-900">
              Recorded for <strong>{completedOrder.customerName}</strong> • Grand Total:{" "}
              <strong>Rs. {completedOrder.grandTotal.toLocaleString()}</strong> ({completedOrder.paymentStatus})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={getWhatsAppBillUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>Send WhatsApp Bill</span>
            </a>

            <button
              type="button"
              onClick={() => setPrintModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-tea-surface text-tea-dark font-bold text-xs uppercase tracking-wider transition border border-tea-border shadow-sm"
            >
              <Printer className="w-4 h-4 text-tea-forest" />
              <span>View & Print Bill</span>
            </button>

            <button
              type="button"
              onClick={handleStartNewBill}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Next Shop Bill</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Customer / Retail Store Selection (Visible BEFORE customer is confirmed) */}
      {activeTab === "billing" && (!customerConfirmed || !shopName.trim()) && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          {/* Step 1 Header Card */}
          <div className="bg-white rounded-3xl border border-tea-border p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-tea-leaf/10 text-tea-forest text-xs font-bold uppercase tracking-wider">
                Step 1: Select Customer / Retail Shop
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-tea-dark">
                Choose Shop Before Adding Bill Items
              </h2>
              <p className="text-xs text-tea-muted">
                Scan counter QR code, pick known shop, or enter details below to load products & wholesale prices.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setQrScannerOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
                title="Scan Shop Counter QR with Mobile Camera"
              >
                <Camera className="w-4 h-4 text-tea-gold" />
                <span>Scan Shop QR</span>
              </button>

              <button
                type="button"
                onClick={() => setRegisterShopModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-tea-surface text-tea-dark text-xs font-bold border border-tea-border flex items-center gap-1.5 shadow-xs transition"
                title="Register a new retail store"
              >
                <PlusCircle className="w-4 h-4 text-tea-leaf" />
                <span>+ New Shop</span>
              </button>
            </div>
          </div>

          {/* 0. Sales Representative Identification */}
            <div className="bg-gradient-to-r from-amber-50 to-emerald-50/60 rounded-3xl border border-amber-300/80 p-5 shadow-card space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-200/60 flex items-center justify-center text-amber-900 shrink-0">
                    <UserCheck className="w-4 h-4 text-emerald-800" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-tea-dark uppercase tracking-wider flex items-center gap-1.5">
                      <span>Sales Representative In-Charge *</span>
                    </h3>
                    <p className="text-[11px] text-tea-muted">
                      Who is taking & fulfilling this ground retail shop order
                    </p>
                  </div>
                </div>

                {salesRepName.trim() ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Attributed Rep: {salesRepName}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-bold self-start sm:self-auto">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Rep Name Required</span>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter Sales Rep Full Name (e.g., Ruwan Perera, Kamal, etc.)..."
                  value={salesRepName}
                  onChange={(e) => handleSalesRepNameChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-bold text-xs text-tea-dark shadow-xs"
                />
                <UserCheck className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
              </div>

              <div className="text-[11px] text-tea-muted flex items-start gap-1.5 pt-0.5">
                <span className="text-amber-700 font-bold">ℹ️ Note:</span>
                <span>
                  This Sales Representative's name will be prominently printed on the <strong>Thermal POS Receipt</strong>, <strong>Standard A4 Invoice</strong>, and tracked in all <strong>Admin Sales Reports</strong>.
                </span>
              </div>
            </div>

            {/* 1. Shop Profile & Route Section */}
            <div className="bg-white rounded-3xl border border-tea-border p-6 shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-tea-border/60 pb-3 gap-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-base font-bold text-tea-dark flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-tea-leaf" />
                    <span>1. Target Shop / Store Details</span>
                  </h3>
                  {selectedKnownShop?.shopCode && (
                    <span className="px-2 py-0.5 rounded-md bg-tea-surface text-tea-forest font-mono text-[10px] font-bold border border-tea-border">
                      #{selectedKnownShop.shopCode}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQrScannerOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition"
                    title="Scan Shop Counter QR with Mobile Camera"
                  >
                    <Camera className="w-3.5 h-3.5 text-tea-gold" />
                    <span>Scan QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterShopModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-tea-surface text-tea-dark text-[11px] font-bold border border-tea-border flex items-center gap-1 shadow-xs transition"
                    title="Register a new retail store"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-tea-leaf" />
                    <span>+ New Shop</span>
                  </button>

                  {selectedKnownShop && (
                    <button
                      type="button"
                      onClick={() => {
                        setStickerShop(selectedKnownShop);
                        setQrStickerModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-tea-gold/20 hover:bg-tea-gold/30 text-amber-950 border border-tea-gold/50 text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
                      title="View & Print 80mm Counter QR Sticker"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-800" />
                      <span>QR Sticker</span>
                    </button>
                  )}

                  {knownShops.length > 0 && (
                    <div className="relative">
                      <select
                        id="known-shop-quick-picker"
                        onChange={(e) => {
                          const sh = knownShops.find((x) => x.shopName === e.target.value);
                          if (sh) handleSelectKnownShop(sh);
                        }}
                        className="text-[11px] font-semibold text-tea-forest bg-tea-surface border border-tea-border rounded-xl px-2.5 py-1.5 focus:outline-none"
                      >
                        <option value="">Quick Pick Known Shop ({knownShops.length})...</option>
                        {knownShops.map((sh, idx) => {
                          const hasDue = sh.pendingBalance && sh.pendingBalance > 0;
                          return (
                            <option key={idx} value={sh.shopName}>
                              {sh.shopName} ({sh.routeTown || "Route"}) {hasDue ? `• [DUE: Rs. ${sh.pendingBalance?.toLocaleString()}]` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-tea-dark mb-1">Shop / Store Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Perera Stores / Kandy Grocery"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-tea-dark mb-1">
                    Shop WhatsApp / Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 071 777 4717"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-tea-dark mb-1">
                    Owner / Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. Sunil Perera"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-tea-dark mb-1">Route / Town Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Kekirawa Main St / Dambulla Rd"
                    value={routeTown}
                    onChange={(e) => setRouteTown(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-tea-dark mb-1">
                    Physical Address / Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. No. 45, Main Bazaar, Opposite Clock Tower, Kekirawa"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 text-xs"
                  />
                </div>
              </div>

              {/* AUTOMATIC OLD PENDING PAYMENT DISPLAY */}
              {selectedKnownShop && (
                <div
                  className={`mt-4 p-4 rounded-2xl border transition-all animate-fade-in ${
                    (selectedKnownShop.pendingBalance || 0) > 0
                      ? "bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs"
                      : "bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          (selectedKnownShop.pendingBalance || 0) > 0
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {(selectedKnownShop.pendingBalance || 0) > 0 ? (
                          <AlertTriangle className="w-5 h-5 text-amber-700" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs">
                            {(selectedKnownShop.pendingBalance || 0) > 0
                              ? `Outstanding Credit Due for "${selectedKnownShop.shopName}"`
                              : `Customer Account Clean for "${selectedKnownShop.shopName}"`}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              (selectedKnownShop.pendingBalance || 0) > 0
                                ? "bg-amber-200 text-amber-900"
                                : "bg-emerald-200 text-emerald-900"
                            }`}
                          >
                            {(selectedKnownShop.pendingBalance || 0) > 0
                              ? `${selectedKnownShop.pendingBillsCount || 1} Unpaid Old Bill(s)`
                              : "Rs. 0 Due"}
                          </span>
                        </div>
                        <p className="text-[11px] text-tea-muted">
                          {(selectedKnownShop.pendingBalance || 0) > 0 ? (
                            <>
                              This shop still owes a previous credit balance of{" "}
                              <strong className="text-rose-700 font-mono text-xs">
                                Rs. {selectedKnownShop.pendingBalance?.toLocaleString()}
                              </strong>
                              . Please collect or clarify payment terms with the owner.
                            </>
                          ) : (
                            <>
                              All previous orders for this shop ({selectedKnownShop.totalBillsCount || 0} bills, Rs.{" "}
                              {selectedKnownShop.totalSalesAmount?.toLocaleString() || 0}) have been fully settled.
                            </>
                          )}
                        </p>
                        {(selectedKnownShop.pendingBalance || 0) > 0 && (
                          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-amber-900">
                            <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-bold text-[10px]">
                              💡 2-Bill Combined Payment
                            </span>
                            <span>
                              Step 3 will automatically sum this old bill (+Rs. {selectedKnownShop.pendingBalance?.toLocaleString()}) with today's new bill and calculate after-payment balance!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {(selectedKnownShop.pendingBalance || 0) > 0 && (
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-amber-800 uppercase font-bold block">
                          Old Credit Due
                        </span>
                        <span className="font-mono font-extrabold text-base text-rose-700 block">
                          Rs. {selectedKnownShop.pendingBalance?.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* List of Old Unpaid Bills for this Shop */}
                  {selectedKnownShop.pendingBills && selectedKnownShop.pendingBills.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                          Unpaid Old Invoices Requiring Collection:
                        </span>
                        <Link
                          href={`/admin/shop-billing?tab=history&search=${encodeURIComponent(selectedKnownShop.shopName)}`}
                          className="text-[10px] font-bold text-tea-forest hover:underline"
                        >
                          View In Ledger →
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedKnownShop.pendingBills.map((pb) => {
                          const isPartial = pb.paymentStatus === "PARTIAL";
                          const due = pb.dueAmount !== undefined ? pb.dueAmount : pb.grandTotal;
                          const paid = pb.paidAmount || 0;

                          return (
                            <div
                              key={pb.id}
                              className="p-3 rounded-2xl bg-white border border-amber-200/90 text-xs shadow-xs space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-tea-dark">
                                      #{pb.orderNumber}
                                    </span>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                        isPartial
                                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                                          : "bg-rose-50 text-rose-800 border border-rose-200"
                                      }`}
                                    >
                                      {isPartial ? "PARTIAL" : "UNPAID"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-tea-muted block mt-0.5">
                                    Date: {new Date(pb.createdAt).toLocaleDateString("en-GB")}
                                  </span>
                                </div>

                                <div className="text-right">
                                  <span className="text-[10px] text-tea-muted uppercase font-bold block">
                                    {isPartial ? "Remaining Due" : "Total Due"}
                                  </span>
                                  <span className="font-mono font-bold text-sm text-rose-700 block">
                                    Rs. {due.toLocaleString()}
                                  </span>
                                  {isPartial && (
                                    <span className="text-[10px] text-emerald-700 font-mono block">
                                      Paid: Rs. {paid.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Auto-included in Step 3 settlement note */}
                              <div className="flex items-center justify-between pt-2 border-t border-amber-100 text-[11px]">
                                <span className="text-amber-900 font-medium">
                                  ↳ Auto-included in Step 3 settlement
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaymentModal(pb, "PARTIAL")}
                                  className="py-1 px-2.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-[10px] transition"
                                  title="Enter custom partial amount or edit notes in ledger"
                                >
                                  <span>Update in Ledger...</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button: Proceed to Add Products & Bill */}
              <div className="pt-3 border-t border-tea-border/60">
                <button
                  type="button"
                  onClick={() => {
                    if (!salesRepName.trim()) {
                      alert("Please enter Sales Representative Name.");
                      return;
                    }
                    if (!shopName.trim()) {
                      alert("Please enter or select a Shop / Store Name.");
                      return;
                    }
                    if (!shopPhone.trim()) {
                      alert("Please enter Shop WhatsApp / Mobile number.");
                      return;
                    }
                    setCustomerConfirmed(true);
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                >
                  <span>Proceed to Add Products & Bill →</span>
                </button>
              </div>
            </div>
        </div>
      )}

      {/* Step 2: Two-Column Billing Counter (Unlocked AFTER Customer is Selected) */}
      {activeTab === "billing" && customerConfirmed && Boolean(shopName.trim()) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          {/* Left Column: Selected Shop Summary + Item-by-Item Entry */}
          <div className="lg:col-span-7 space-y-6">
            {/* Selected Customer Confirmation & Switch Card */}
            <div className="bg-white rounded-3xl border border-tea-border p-5 shadow-card space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-tea-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-base font-bold text-tea-dark">
                        {shopName}
                      </h3>
                      {selectedKnownShop?.shopCode && (
                        <span className="px-2 py-0.5 rounded-md bg-tea-surface text-tea-forest font-mono text-[10px] font-bold border border-tea-border">
                          #{selectedKnownShop.shopCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-tea-muted flex items-center gap-2">
                      <span>{shopPhone}</span>
                      {routeTown && <span>• {routeTown}</span>}
                      {ownerName && <span>• Owner: {ownerName}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomerConfirmed(false)}
                    className="px-3 py-1.5 rounded-xl border border-tea-border hover:bg-tea-surface text-tea-dark font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                    title="Change or edit current shop"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Shop</span>
                  </button>

                  {selectedKnownShop && (
                    <button
                      type="button"
                      onClick={() => {
                        setStickerShop(selectedKnownShop);
                        setQrStickerModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-tea-gold/20 hover:bg-tea-gold/30 text-amber-950 border border-tea-gold/50 text-xs font-bold flex items-center gap-1 transition shadow-xs"
                      title="Print Counter QR Sticker"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-800" />
                      <span>QR Sticker</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Rep attribution & debt banner if any */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-tea-muted">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sales Rep: <strong className="text-tea-dark">{salesRepName || "Unassigned"}</strong></span>
                </div>
                {selectedKnownShop && (selectedKnownShop.pendingBalance || 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px]">
                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                    Old Credit: Rs. {selectedKnownShop.pendingBalance?.toLocaleString()} (Auto-combined)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Account Clean (Rs. 0 Due)
                  </span>
                )}
              </div>
            </div>

            {/* 2. Fast Item-by-Item Entry Counter (Simple Old Setup) */}
            <div className="bg-white rounded-3xl border border-tea-border p-6 shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-tea-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-base font-bold text-tea-dark flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-tea-leaf" />
                    <span>Select Products & Add to Bill</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Wholesale Pricing Active
                  </span>
                </div>
                <span className="text-[11px] text-tea-muted">
                  Standard & Wholesale Shop Billing
                </span>
              </div>

              <div className="space-y-4">
                {/* Product Search & Dropdown Picker */}
                <div className="space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Search tea grade or product name..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface/30 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                        />
                        <Search className="w-3.5 h-3.5 text-tea-muted absolute left-2.5 top-2.5" />
                      </div>

                      <select
                        value={selectedProductId}
                        onChange={(e) => handleProductChange(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                      >
                        {filteredProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} [{p.teaGrade || "Pure Ceylon"}]
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Active Product Details Strip */}
                    {currentSelectedProduct && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-tea-surface/60 border border-tea-border/60">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border border-tea-border shrink-0">
                          <Image
                            src={currentSelectedProduct.mainImage || "/uploads/leena-tea-powder-200g.jpeg"}
                            alt={currentSelectedProduct.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-tea-dark truncate">
                            {currentSelectedProduct.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-tea-muted">
                            <span>Grade: {currentSelectedProduct.teaGrade}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">
                              Total Stock: {currentSelectedProduct.stock} packs
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Size, Rate, Quantity & Add Button Row */}
                    <form onSubmit={handleAddItem} className="pt-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                        {/* Size Selector */}
                        <div>
                          <label className="block text-[11px] font-bold text-tea-dark mb-1">
                            Pack Size / Weight
                          </label>
                          {currentSelectedProduct?.sizes &&
                          currentSelectedProduct.sizes.length > 0 ? (
                            <select
                              value={selectedSize}
                              onChange={(e) => handleVariantChange(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-tea-border bg-white focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                            >
                              {currentSelectedProduct.sizes.map((v) => (
                                <option key={v.id} value={v.sizeName}>
                                  {v.sizeName} ({v.stock} in stock)
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={selectedSize}
                              onChange={(e) => setSelectedSize(e.target.value)}
                              placeholder="Size (e.g. 200g)"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-white"
                            />
                          )}
                        </div>

                        {/* Unit Price (Rate) */}
                        <div>
                          <label className="block text-[11px] font-bold text-tea-dark mb-1">
                            Rate (Rs. / pack)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={itemUnitPrice === 0 ? "" : itemUnitPrice}
                            onChange={(e) =>
                              setItemUnitPrice(
                                e.target.value === "" ? 0 : Math.max(0, Number(e.target.value))
                              )
                            }
                            className="w-full px-3 py-2 text-xs font-bold text-tea-forest rounded-xl border border-tea-border bg-white focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 font-mono"
                          />
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-[11px] font-bold text-tea-dark mb-1">
                            Qty (Packs)
                          </label>
                          <div className="flex items-center h-11">
                            <button
                              type="button"
                              onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                              className="w-10 h-11 rounded-l-xl border border-r-0 border-tea-border bg-tea-surface hover:bg-tea-bg active:bg-tea-border text-tea-dark font-bold text-sm flex items-center justify-center shrink-0"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={itemQuantity}
                              onChange={(e) =>
                                setItemQuantity(
                                  e.target.value === "" ? 1 : Math.max(1, Number(e.target.value))
                                )
                              }
                              className="w-full h-11 py-2 text-center text-sm font-bold text-tea-dark border-y border-tea-border bg-white focus:outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setItemQuantity(itemQuantity + 1)}
                              className="w-10 h-11 rounded-r-xl border border-l-0 border-tea-border bg-tea-surface hover:bg-tea-bg active:bg-tea-border text-tea-dark font-bold text-sm flex items-center justify-center shrink-0"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Add Item Button */}
                        <div>
                          <button
                            type="submit"
                            className="w-full h-11 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Item</span>
                          </button>
                        </div>

                        {/* Real-time Line Total Calculation Preview */}
                        <div className="col-span-2 sm:col-span-4 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs">
                          <span className="text-emerald-950 font-semibold flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-emerald-700" />
                            <span>
                              Line Total ({itemQuantity} pkts × Rs.{" "}
                              {Number(itemUnitPrice || 0).toLocaleString()}):
                            </span>
                          </span>
                          <span className="font-mono font-extrabold text-emerald-900 text-sm">
                            Rs.{" "}
                            {(
                              Number(itemUnitPrice || 0) * Number(itemQuantity || 1)
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
            </div>
          </div>

          {/* Right Column: Live Bill / Invoice Calculation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-tea-border p-6 sm:p-7 shadow-card space-y-6">
              <div className="flex items-center justify-between border-b border-tea-border pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-tea-dark">
                    Current Shop Invoice
                  </h3>
                  <p className="text-xs text-tea-muted">
                    {shopName ? `Billing for "${shopName}"` : "Add shop details & line items"}
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-tea-leaf/10 text-tea-forest text-xs font-bold font-mono">
                  {billItems.length} {billItems.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              {/* Line Items Table */}
              {billItems.length === 0 ? (
                <div className="p-8 text-center bg-tea-surface/40 rounded-2xl border border-dashed border-tea-border text-xs text-tea-muted space-y-2">
                  <ShoppingBag className="w-8 h-8 text-tea-leaf/60 mx-auto" />
                  <p className="font-semibold text-tea-dark">No items added to this bill yet</p>
                  <p className="text-[11px]">
                    Select a Ceylon tea product on the left and click <strong>Add Item</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {billItems.map((it, idx) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-tea-surface/40 border border-tea-border/60 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-tea-dark truncate">
                          {idx + 1}. {it.productName}
                        </h5>
                        <p className="text-[11px] text-tea-muted">
                          {it.size} • Rs. {it.unitPrice.toLocaleString()} each
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(it.id, -1)}
                          className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-white border border-tea-border flex items-center justify-center font-bold text-sm text-tea-dark hover:bg-tea-surface active:bg-tea-bg"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs font-mono w-6 text-center">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(it.id, 1)}
                          className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-white border border-tea-border flex items-center justify-center font-bold text-sm text-tea-dark hover:bg-tea-surface active:bg-tea-bg"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="text-right shrink-0 min-w-[70px]">
                        <span className="font-bold text-tea-forest block">
                          Rs. {it.subtotal.toLocaleString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.id)}
                        className="p-1 rounded text-tea-muted hover:text-rose-600 transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Financial Calculations Form */}
              <div className="pt-4 border-t border-tea-border space-y-3 text-xs">
                <div className="flex justify-between items-center text-tea-muted">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-tea-dark text-sm">
                    Rs. {billSubtotal.toLocaleString()}
                  </span>
                </div>

                {/* Discount */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-tea-muted">Shop Special Discount (Rs.)</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-28 px-2.5 py-1 text-right text-xs rounded-lg border border-tea-border bg-tea-surface font-mono font-bold text-emerald-800"
                  />
                </div>

                {/* Delivery / Transport */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-tea-muted">Transport / Delivery Charge (Rs.)</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                    className="w-28 px-2.5 py-1 text-right text-xs rounded-lg border border-tea-border bg-tea-surface font-mono"
                  />
                </div>

                {/* Grand Total */}
                <div className="border-t border-tea-border/80 pt-3 flex justify-between items-baseline font-serif">
                  <span className="text-base font-bold text-tea-dark">Net Payable</span>
                  <span className="text-2xl font-extrabold text-tea-forest font-mono">
                    Rs. {billGrandTotal.toLocaleString()}
                  </span>
                </div>

                {/* 2-BILL COMBINED STATEMENT BREAKDOWN (When shop has old pending debt) */}
                {hasOldDebt && (
                  <div className="p-4 rounded-3xl bg-amber-50/95 border-2 border-amber-300 shadow-sm space-y-3.5 text-xs animate-fade-in mt-2">
                    <div className="pb-2 border-b border-amber-200">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                        <Receipt className="w-4 h-4 text-amber-700" />
                        <span>2-Bill Combined Statement</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold uppercase">
                          Old + New Bills
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Shop has an unpaid old balance. Today's bill is combined with previous debt. Enter amount received in the box below to calculate after-payment balance.
                      </p>
                    </div>

                    {/* 2-Bill Formula Breakdown Box (Example: New 2000 + Old 3000 = Total 5000) */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-white p-3 rounded-2xl border border-amber-200 shadow-2xs font-mono">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-tea-muted uppercase font-sans font-semibold block">
                          Today's New Bill
                        </span>
                        <span className="font-bold text-sm text-tea-dark block">
                          Rs. {billGrandTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-0.5 border-x border-amber-100">
                        <span className="text-[10px] text-rose-700 uppercase font-sans font-semibold block">
                          Old Pending Debt
                        </span>
                        <span className="font-bold text-sm text-rose-700 block">
                          +Rs. {oldShopDebt.toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-0.5 bg-amber-50/80 rounded-xl py-1">
                        <span className="text-[10px] text-amber-900 uppercase font-sans font-bold block">
                          Total Due (2 Bills)
                        </span>
                        <span className="font-extrabold text-base text-amber-950 block">
                          Rs. {totalCombinedBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SINGLE AMOUNT ENTER BOX FOR SETTLEMENT */}
                <div className="p-4 rounded-3xl bg-tea-surface/70 border-2 border-tea-border space-y-3 mt-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="font-bold text-tea-dark flex items-center gap-1.5 text-xs">
                      <DollarSign className="w-4 h-4 text-emerald-700" />
                      <span>Amount Received / Paid Today (Rs.):</span>
                    </label>
                    <span className="text-[10px] text-tea-muted">
                      Type cash / bank transfer amount received
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-mono font-bold text-tea-forest">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={paidAmount}
                      onChange={(e) => {
                        setIsManualPaid(true);
                        setPaidAmount(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)));
                      }}
                      placeholder={`Enter amount (e.g. ${totalAmountDue})`}
                      className="w-full pl-11 pr-3 py-2.5 rounded-xl border-2 border-tea-forest/60 bg-white font-mono font-extrabold text-base text-tea-dark focus:outline-none focus:ring-2 focus:ring-tea-forest shadow-xs"
                    />
                  </div>

                  {/* AFTER-PAYMENT BALANCE DUE (AFTER BAL) CARD */}
                  <div
                    className={`p-3.5 rounded-2xl border-2 transition-all font-mono ${
                      afterBalance === 0
                        ? "bg-emerald-50 border-emerald-400 text-emerald-950"
                        : "bg-rose-50 border-rose-300 text-rose-950"
                    }`}
                  >
                    <div className="flex justify-between items-baseline">
                      <div className="space-y-0.5">
                        <span className="font-sans font-bold text-xs uppercase tracking-wide block">
                          After-Payment Balance Due (After Bal):
                        </span>
                        <span className="font-sans text-[11px] text-tea-muted block">
                          {hasOldDebt
                            ? `Total Due Rs. ${totalCombinedBalance.toLocaleString()} − Paid Rs. ${numericPaid.toLocaleString()}`
                            : `Net Payable Rs. ${billGrandTotal.toLocaleString()} − Paid Rs. ${numericPaid.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-black block">
                          Rs. {afterBalance.toLocaleString()}
                        </span>
                        <span
                          className={`text-[10px] font-sans font-bold uppercase ${
                            afterBalance === 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {afterBalance === 0
                            ? hasOldDebt
                              ? "ALL 2 BILLS SETTLED (CLEAR) ✅"
                              : "PAID IN FULL (CLEAR) ✅"
                            : "REMAINING STORE BALANCE DUE ⏳"}
                        </span>
                      </div>
                    </div>

                    {/* Waterfall breakdown when 2 bills are combined */}
                    {hasOldDebt && (
                      <div className="mt-2.5 pt-2 border-t border-dashed border-current/30 text-[11px] font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-tea-dark font-medium">
                        <span className="flex items-center gap-1">
                          <span>↳ Old Bill (Rs. {oldShopDebt.toLocaleString()}):</span>
                          <strong className={combinedAllocation.oldSettled ? "text-emerald-700 font-bold" : "text-amber-800 font-bold"}>
                            {combinedAllocation.oldSettled
                              ? "Settled Full (PAID) ✅"
                              : `Partial (Rs. ${combinedAllocation.allocatedToOld.toLocaleString()} paid) ⏳`}
                          </strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>↳ New Bill (Rs. {billGrandTotal.toLocaleString()}):</span>
                          <strong
                            className={
                              combinedAllocation.newSettled
                                ? "text-emerald-700 font-bold"
                                : combinedAllocation.newPartial
                                ? "text-amber-800 font-bold"
                                : "text-rose-700 font-bold"
                            }
                          >
                            {combinedAllocation.newSettled
                              ? "Paid in Full ✅"
                              : combinedAllocation.newPartial
                              ? `Partial (Rs. ${combinedAllocation.allocatedToNew.toLocaleString()} paid, Rs. ${(billGrandTotal - combinedAllocation.allocatedToNew).toLocaleString()} due) ⏳`
                              : `Rs. ${billGrandTotal.toLocaleString()} Credit Due ⏳`}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="pt-2 text-xs">
                  <label className="block font-bold text-tea-dark mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-tea-border bg-tea-surface font-semibold text-xs focus:outline-none"
                  >
                    <option value="CASH_ON_DELIVERY">Cash on Spot</option>
                    <option value="CREDIT_SHOP">Credit (Pay Later)</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                    <option value="CHEQUE">Cheque Payment</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-tea-dark mb-1">
                    Shop Delivery Notes / Credit Terms
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Credit payable in 14 days, Delivered by Van 01"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface"
                  />
                </div>

                {/* Complete & Bill Actions */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveOrder}
                    disabled={submitting || billItems.length === 0}
                    className="w-full py-3.5 px-4 rounded-xl bg-tea-dark hover:bg-tea-forest active:bg-tea-dark text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-tea-gold" />
                        <span>Recording Bill...</span>
                      </>
                    ) : hasOldDebt ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-tea-gold" />
                        <span>
                          Finalize Combined Settlement • Paid Rs. {numericPaid.toLocaleString()} • After Bal: Rs. {afterBalance.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-tea-gold" />
                        <span>
                          Finalize Bill • Paid Rs. {numericPaid.toLocaleString()} • After Bal: Rs. {afterBalance.toLocaleString()}
                        </span>
                      </>
                    )}
                  </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={getWhatsAppBillUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp Bill</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      if (billItems.length === 0) {
                        alert("Add items to bill before printing preview.");
                        return;
                      }
                      setPrintModalOpen(true);
                    }}
                    className="py-2.5 px-3 rounded-xl border border-tea-border hover:bg-tea-surface text-tea-dark font-bold text-[11px] uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-tea-forest" />
                    <span>Print Invoice</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Available Products & Stock Catalog (Shop Order Rep & Executive View) */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Top Banner & Filters */}
          <div className="bg-white rounded-3xl border border-tea-border p-6 shadow-card space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-tea-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    Live Warehouse Stock
                  </span>
                  <span className="text-xs text-tea-muted">• Wholesale Pack Sizes & Rates</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-tea-dark mt-1">
                  Available Products Catalog
                </h3>
                <p className="text-xs text-tea-muted mt-0.5">
                  Browse products, real-time stock levels, and grades. Click "+ Add to Bill" to instantly load any tea into your active shop bill.
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search tea name, grade (BOPF)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf font-medium"
                />
                <Search className="w-4 h-4 text-tea-muted absolute left-3 top-3" />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch("")}
                    className="p-1 text-tea-muted hover:text-tea-dark absolute right-2.5 top-2.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills & Metrics */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCatalogCategory("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    catalogCategory === "ALL"
                      ? "bg-tea-dark text-white shadow-xs"
                      : "bg-tea-surface text-tea-muted hover:text-tea-dark border border-tea-border/60"
                  }`}
                >
                  All Varieties ({products.length})
                </button>
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      catalogCategory === cat
                        ? "bg-tea-dark text-white shadow-xs"
                        : "bg-tea-surface text-tea-muted hover:text-tea-dark border border-tea-border/60"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-tea-muted">
                <span className="bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px]">
                  {products.filter((p) => p.stock > 0).length} In Stock
                </span>
                {products.filter((p) => p.stock <= 15).length > 0 && (
                  <span className="bg-rose-50 text-rose-800 font-semibold px-2.5 py-1 rounded-lg border border-rose-200 text-[11px]">
                    {products.filter((p) => p.stock <= 15).length} Low Stock
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Products Catalog Grid */}
          {filteredCatalogProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-tea-border p-12 text-center text-xs text-tea-muted shadow-card space-y-2">
              <Boxes className="w-8 h-8 text-tea-muted mx-auto opacity-50" />
              <p className="font-semibold text-tea-dark">No products found matching your search.</p>
              <button
                type="button"
                onClick={() => {
                  setCatalogSearch("");
                  setCatalogCategory("ALL");
                }}
                className="text-tea-forest hover:underline font-bold text-xs"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCatalogProducts.map((p) => {
                const isOutOfStock = p.stock === 0;
                const isLowStock = p.stock > 0 && p.stock <= 15;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl border border-tea-border shadow-card hover:shadow-hover transition duration-200 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Image & Badges */}
                      <div className="relative h-48 w-full bg-tea-surface p-4 flex items-center justify-center border-b border-tea-border">
                        <div className="relative w-36 h-36">
                          <Image
                            src={p.mainImage || "/uploads/leena-tea-powder-200g.jpeg"}
                            alt={p.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                          <span className="px-2.5 py-1 rounded-full bg-tea-dark text-tea-gold font-mono text-[10px] font-bold shadow-xs">
                            {p.teaGrade || "Ceylon Tea"}
                          </span>
                          {p.category?.name && (
                            <span className="px-2 py-0.5 rounded bg-white/90 text-tea-dark font-sans text-[10px] font-semibold border border-tea-border shadow-xs">
                              {p.category.name}
                            </span>
                          )}
                        </div>

                        <div className="absolute top-3 right-3">
                          {isOutOfStock ? (
                            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-bold text-[10px] shadow-xs">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white font-bold text-[10px] shadow-xs">
                              Only {p.stock} pkts
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] shadow-xs">
                              {p.stock} in stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Content */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h4 className="font-serif font-bold text-base text-tea-dark leading-snug">
                            {p.name}
                          </h4>
                          <div className="text-[11px] text-tea-muted mt-0.5 flex items-center gap-2">
                            <span>Type: {p.teaType || "Black Tea"}</span>
                            <span>•</span>
                            <span>Starting from Rs. {p.regularPrice.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Available Pack Sizes & Pricing Table */}
                        <div className="space-y-1.5 pt-2 border-t border-tea-border/60">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-tea-muted block">
                            Available Pack Sizes & Wholesale Rates
                          </span>

                          {p.sizes && p.sizes.length > 0 ? (
                            <div className="space-y-1">
                              {p.sizes.map((v) => (
                                <div
                                  key={v.id}
                                  className="flex items-center justify-between p-2 rounded-xl bg-tea-surface hover:bg-tea-bg border border-tea-border/50 text-xs transition"
                                >
                                  <div>
                                    <span className="font-bold text-tea-dark block">
                                      {v.sizeName}
                                    </span>
                                    <span className="text-[10px] text-tea-muted">
                                      Stock: {v.stock} pkts
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold font-mono text-tea-forest">
                                      Rs. {(v.salePrice || v.regularPrice).toLocaleString()}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectProductForBill(p, v.sizeName)}
                                      className="px-2 py-1 rounded-lg bg-tea-dark hover:bg-tea-forest text-white text-[10px] font-bold transition flex items-center gap-1"
                                      title="Load this specific pack size into billing counter"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Select</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-tea-surface border border-tea-border/50 text-xs">
                              <span className="font-bold text-tea-dark">Standard Pack</span>
                              <span className="font-bold font-mono text-tea-forest">
                                Rs. {p.regularPrice.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Add to Active Shop Bill Button */}
                    <div className="p-5 pt-0">
                      <button
                        type="button"
                        onClick={() => handleSelectProductForBill(p)}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4 text-emerald-200" />
                        <span>Add to Shop Bill</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* History & Ledger View */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Top Ledger Header & Quick Create */}
          <div className="bg-white rounded-3xl border border-tea-border p-6 shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-tea-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    Sales Rep Ground Ledger
                  </span>
                  <span className="text-xs text-tea-muted">• Real-Time Tracking & Payment Collection</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-tea-dark mt-1">
                  Shop Bills & Field Ledger
                </h3>
                <p className="text-xs text-tea-muted mt-0.5">
                  Search bills by shop or route, collect payments on the road, mark credit as paid, or cancel bills with automatic stock restock.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("billing")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold text-xs uppercase tracking-wider transition shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-tea-gold" />
                <span>+ Create New Bill</span>
              </button>
            </div>

            {/* Financial & Operational Summary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-tea-surface/60 border border-tea-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-tea-muted block">
                  Total Bills Recorded
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-tea-dark font-mono block mt-1">
                  {ledgerStats.totalBills}
                </span>
                <span className="text-[10px] text-tea-muted mt-0.5 block">
                  Across all field sales routes
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-tea-surface/60 border border-tea-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-tea-muted block">
                  Gross Bill Value
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-tea-forest font-mono block mt-1">
                  Rs. {ledgerStats.totalRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-tea-muted mt-0.5 block">
                  Active confirmed orders
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Collected Payments (PAID)
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-900 font-mono block mt-1">
                  Rs. {ledgerStats.totalPaid.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-700 mt-0.5 block">
                  {ledgerStats.paidCount} bills settled in full
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Due / Credit (PENDING)
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-amber-900 font-mono block mt-1">
                  Rs. {ledgerStats.totalCredit.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-700 mt-0.5 block">
                  {ledgerStats.creditCount} bills awaiting payment
                </span>
              </div>
            </div>

            {/* Search Bar & Filter Controls */}
            <div className="pt-2 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by Bill # (e.g. SHOP-...), Shop Name, Phone, Route/Town..."
                  value={searchLedger}
                  onChange={(e) => setSearchLedger(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf font-medium"
                />
                <Search className="w-4 h-4 text-tea-muted absolute left-3 top-3" />
                {searchLedger && (
                  <button
                    type="button"
                    onClick={() => setSearchLedger("")}
                    className="p-1 text-tea-muted hover:text-tea-dark absolute right-2.5 top-2.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Payment Filter */}
                <div className="flex items-center gap-1 bg-tea-surface p-1 rounded-xl border border-tea-border text-xs">
                  <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-tea-muted">
                    Pay:
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilterPaymentStatus("ALL")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      filterPaymentStatus === "ALL"
                        ? "bg-tea-dark text-white shadow-xs"
                        : "text-tea-muted hover:text-tea-dark"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPaymentStatus("PAID")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      filterPaymentStatus === "PAID"
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "text-tea-muted hover:text-tea-dark"
                    }`}
                  >
                    Paid ({ledgerStats.paidCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPaymentStatus("PARTIAL")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      filterPaymentStatus === "PARTIAL"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-tea-muted hover:text-tea-dark"
                    }`}
                  >
                    Partial ({ledgerStats.partialCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPaymentStatus("PENDING")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      filterPaymentStatus === "PENDING"
                        ? "bg-rose-700 text-white shadow-xs"
                        : "text-tea-muted hover:text-tea-dark"
                    }`}
                  >
                    Credit ({ledgerStats.creditCount})
                  </button>
                </div>

                {/* Order Status Filter */}
                <div className="flex items-center gap-1 bg-tea-surface p-1 rounded-xl border border-tea-border text-xs">
                  <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-tea-muted">
                    Status:
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilterOrderStatus("ALL")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      filterOrderStatus === "ALL"
                        ? "bg-tea-dark text-white shadow-xs"
                        : "text-tea-muted hover:text-tea-dark"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterOrderStatus("CONFIRMED")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      filterOrderStatus === "CONFIRMED"
                        ? "bg-tea-forest text-white shadow-xs"
                        : "text-tea-muted hover:text-tea-dark"
                    }`}
                  >
                    Active
                  </button>
                  {ledgerStats.cancelledCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterOrderStatus("CANCELLED")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        filterOrderStatus === "CANCELLED"
                          ? "bg-rose-700 text-white shadow-xs"
                          : "text-tea-muted hover:text-tea-dark"
                      }`}
                    >
                      Cancelled ({ledgerStats.cancelledCount})
                    </button>
                  )}
                </div>

                {(searchLedger || filterPaymentStatus !== "ALL" || filterOrderStatus !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchLedger("");
                      setFilterPaymentStatus("ALL");
                      setFilterOrderStatus("ALL");
                    }}
                    className="px-3 py-2 text-xs font-semibold text-tea-muted hover:text-rose-600 transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-3xl border border-tea-border shadow-card overflow-hidden">
            {filteredLedgerOrders.length === 0 ? (
              <div className="p-12 text-center text-tea-muted text-xs space-y-3">
                <Search className="w-8 h-8 text-tea-muted mx-auto opacity-50" />
                <p className="font-semibold text-tea-dark text-sm">
                  {recentOrders.length === 0
                    ? "No shop bills recorded yet."
                    : "No shop bills matching your search or filters."}
                </p>
                <div className="flex justify-center gap-2 pt-1">
                  {recentOrders.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchLedger("");
                        setFilterPaymentStatus("ALL");
                        setFilterOrderStatus("ALL");
                      }}
                      className="px-4 py-2 rounded-xl bg-tea-surface hover:bg-tea-bg text-tea-dark font-bold text-xs"
                    >
                      Clear Search Filters
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setActiveTab("billing")}
                    className="px-4 py-2 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold text-xs uppercase tracking-wider"
                  >
                    Take New Shop Bill
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile Card View (Optimized for field phones) */}
                <div className="block sm:hidden divide-y divide-tea-border/60">
                  {filteredLedgerOrders.map((o) => {
                    const isCancelled = o.orderStatus === "CANCELLED";
                    const isPaid = o.paymentStatus === "PAID";
                    const isPartial = o.paymentStatus === "PARTIAL";
                    const paid = o.paidAmount !== undefined ? o.paidAmount : isPaid ? o.grandTotal : 0;
                    const due = o.dueAmount !== undefined ? o.dueAmount : isPaid ? 0 : o.grandTotal;

                    return (
                      <div
                        key={o.id}
                        className={`p-4 space-y-3 transition ${
                          isCancelled ? "bg-rose-50/20 text-tea-muted opacity-85" : "bg-white hover:bg-tea-surface/30"
                        }`}
                      >
                        {/* Top Line: Invoice # + Date + Status */}
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-sm text-tea-dark block">
                              #{o.orderNumber}
                            </span>
                            <span className="text-[10px] text-tea-muted">
                              {new Date(o.createdAt).toLocaleDateString("en-GB")} •{" "}
                              {new Date(o.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {isCancelled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <Ban className="w-3 h-3" />
                              <span>Cancelled</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span>Active Bill</span>
                            </span>
                          )}
                        </div>

                        {/* Sales Rep Attribution & Payment Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 font-bold text-[11px]">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>Rep: {o.salesRepName || extractSalesRepName(o.deliveryNotes) || "Direct Sales Rep"}</span>
                          </span>

                          <div>
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>PAID IN FULL</span>
                              </span>
                            ) : isPartial ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                                <DollarSign className="w-3 h-3 text-amber-700" />
                                <span>PARTIAL</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                <Clock className="w-3 h-3 text-rose-700" />
                                <span>DUE / CREDIT</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Shop Name & Details */}
                        <div className="bg-tea-surface/50 rounded-xl p-3 border border-tea-border/50 space-y-1 text-xs">
                          <div className="font-bold text-tea-dark text-sm">{o.customerName}</div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-tea-muted">
                            {o.city && (
                              <span className="inline-flex items-center gap-1 text-tea-dark font-medium">
                                <MapPin className="w-3 h-3 text-tea-muted shrink-0" />
                                <span>{o.city}</span>
                              </span>
                            )}
                            {o.customerPhone && (
                              <a
                                href={`tel:${o.customerPhone}`}
                                className="inline-flex items-center gap-1 font-mono text-tea-forest font-semibold hover:underline"
                              >
                                <Phone className="w-3 h-3 text-tea-muted" />
                                <span>{o.customerPhone}</span>
                              </a>
                            )}
                          </div>
                          {o.shippingAddress && (
                            <div className="text-[10px] text-tea-muted truncate pt-0.5">
                              {o.shippingAddress}
                            </div>
                          )}
                        </div>

                        {/* Financial Summary Line */}
                        <div className="flex items-baseline justify-between pt-1">
                          <div>
                            <span className="text-[11px] text-tea-muted font-medium block">
                              Net Total ({o.items?.length || 0} line{o.items?.length === 1 ? "" : "s"}):
                            </span>
                            {isPartial && (
                              <span className="text-[10px] text-amber-900 font-mono block">
                                Paid: Rs. {paid.toLocaleString()} • Due: Rs. {due.toLocaleString()}
                              </span>
                            )}
                            {o.combinedDetails && (
                              <span className="text-[10px] text-amber-900 font-mono block">
                                2-Bill: Paid Rs. {o.combinedDetails.totalReceived.toLocaleString()} • Bal Rs. {o.combinedDetails.afterBalance.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-base font-extrabold font-mono text-tea-forest ${
                                isCancelled ? "line-through text-tea-muted" : ""
                              }`}
                            >
                              Rs. {o.grandTotal.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-tea-muted block capitalize">
                              {o.paymentMethod === "CREDIT_SHOP"
                                ? "Credit"
                                : o.paymentMethod === "BANK_TRANSFER"
                                ? "Bank Transfer"
                                : o.paymentMethod === "CHEQUE"
                                ? "Cheque"
                                : "Cash"}
                            </span>
                          </div>
                        </div>

                        {/* Mobile Action Buttons Bar */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-tea-border/60">
                          {/* Update Pay */}
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(o)}
                            disabled={isCancelled}
                            className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                              isCancelled
                                ? "opacity-30 cursor-not-allowed bg-tea-surface text-tea-muted"
                                : isPaid
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                            }`}
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>{isPaid ? "Payment" : "Update Pay"}</span>
                          </button>

                          {/* Print Bill */}
                          <button
                            type="button"
                            onClick={() => {
                              setCompletedOrder(o);
                              setPrintModalOpen(true);
                            }}
                            className="h-11 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                          >
                            <Printer className="w-4 h-4 text-tea-gold" />
                            <span>Print Bill</span>
                          </button>

                          {/* WhatsApp */}
                          <a
                            href={getWhatsAppUrl(
                              o.customerPhone,
                              compileShopInvoiceWhatsAppMessage({
                                orderNumber: o.orderNumber,
                                shopName: o.customerName,
                                shopPhone: o.customerPhone,
                                routeTown: o.city,
                                address: o.shippingAddress,
                                items: o.items || [],
                                subtotal: o.subtotal,
                                discount: o.discount,
                                deliveryCharge: o.deliveryCharge,
                                grandTotal: o.grandTotal,
                                paymentMethod: o.paymentMethod,
                                paymentStatus: o.paymentStatus,
                                salesRepName: o.salesRepName || extractSalesRepName(o.deliveryNotes),
                              })
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                          >
                            <MessageSquare className="w-4 h-4 fill-current" />
                            <span>WhatsApp</span>
                          </a>

                          {/* Details & Cancel */}
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/admin/orders/${o.id}`}
                              className="flex-1 h-11 rounded-xl border border-tea-border hover:bg-tea-surface text-tea-forest text-xs font-bold flex items-center justify-center gap-1 transition"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Details</span>
                            </Link>

                            {!isCancelled ? (
                              <button
                                type="button"
                                onClick={() => handleOpenCancelModal(o)}
                                className="w-11 h-11 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center justify-center shrink-0 transition"
                                title="Cancel / Void Bill"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View (Hidden on mobile) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-tea-surface border-b border-tea-border text-tea-muted font-semibold">
                      <tr>
                        <th className="py-3.5 px-4 whitespace-nowrap">Invoice # & Date</th>
                        <th className="py-3.5 px-4">Sales Rep</th>
                        <th className="py-3.5 px-4">Shop / Store Name</th>
                        <th className="py-3.5 px-4">Route / Town</th>
                        <th className="py-3.5 px-4">Phone / WhatsApp</th>
                        <th className="py-3.5 px-4">Items</th>
                        <th className="py-3.5 px-4">Net Total</th>
                        <th className="py-3.5 px-4">Payment</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-tea-border/60">
                      {filteredLedgerOrders.map((o) => {
                        const isCancelled = o.orderStatus === "CANCELLED";
                        const isPaid = o.paymentStatus === "PAID";
                        const isPartial = o.paymentStatus === "PARTIAL";
                        const paid = o.paidAmount !== undefined ? o.paidAmount : isPaid ? o.grandTotal : 0;
                        const due = o.dueAmount !== undefined ? o.dueAmount : isPaid ? 0 : o.grandTotal;

                        return (
                          <tr
                            key={o.id}
                            className={`transition ${
                              isCancelled
                                ? "bg-rose-50/20 hover:bg-rose-50/40 text-tea-muted opacity-80"
                                : "hover:bg-tea-surface/40"
                            }`}
                          >
                            {/* Invoice # & Date */}
                            <td className="py-3 px-4 font-mono font-bold text-tea-dark whitespace-nowrap">
                              <span className="block text-tea-dark">#{o.orderNumber}</span>
                              <span className="text-[10px] text-tea-muted font-sans font-normal block">
                                {new Date(o.createdAt).toLocaleDateString("en-GB")} •{" "}
                                {new Date(o.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </td>

                            {/* Sales Rep */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 font-bold text-[11px]">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span>{o.salesRepName || extractSalesRepName(o.deliveryNotes) || "Direct Sales Rep"}</span>
                              </span>
                            </td>

                            {/* Shop Name */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-tea-dark">{o.customerName}</div>
                              {o.shippingAddress && (
                                <div className="text-[10px] text-tea-muted truncate max-w-[180px]">
                                  {o.shippingAddress}
                                </div>
                              )}
                            </td>

                            {/* Route / Town */}
                            <td className="py-3 px-4 text-tea-dark font-medium">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-tea-muted shrink-0" />
                                <span>{o.city || "Direct Route"}</span>
                              </span>
                            </td>

                            {/* Phone */}
                            <td className="py-3 px-4 font-mono text-[11px] text-tea-dark whitespace-nowrap">
                              {o.customerPhone}
                            </td>

                            {/* Items */}
                            <td className="py-3 px-4 text-tea-muted whitespace-nowrap">
                              <span className="font-semibold text-tea-dark">
                                {o.items?.length || 0} line(s)
                              </span>
                            </td>

                            {/* Net Total */}
                            <td className="py-3 px-4 font-mono font-bold text-tea-forest whitespace-nowrap">
                              <span className={isCancelled ? "line-through text-tea-muted" : ""}>
                                Rs. {o.grandTotal.toLocaleString()}
                              </span>
                              {isCancelled && (
                                <span className="text-[10px] text-rose-600 block font-sans">
                                  Restocked
                                </span>
                              )}
                            </td>

                            {/* Payment Status & Method */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="space-y-1">
                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                    <span>PAID IN FULL</span>
                                  </span>
                                ) : isPartial ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                                    <DollarSign className="w-3 h-3 text-amber-700" />
                                    <span>PARTIAL (Paid: Rs. {paid.toLocaleString()} | Due: Rs. {due.toLocaleString()})</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                    <Clock className="w-3 h-3 text-rose-700" />
                                    <span>DUE / CREDIT</span>
                                  </span>
                                )}
                                {o.combinedDetails && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-amber-100/90 text-amber-950 font-mono text-[9px] font-bold border border-amber-300">
                                    2-Bill: Paid Rs. {o.combinedDetails.totalReceived.toLocaleString()} • Bal Rs. {o.combinedDetails.afterBalance.toLocaleString()}
                                  </span>
                                )}
                                <div className="text-[10px] text-tea-muted capitalize">
                                  {o.paymentMethod === "CREDIT_SHOP"
                                    ? "Credit"
                                    : o.paymentMethod === "BANK_TRANSFER"
                                    ? "Bank Transfer"
                                    : o.paymentMethod === "CHEQUE"
                                    ? "Cheque"
                                    : "Cash"}
                                </div>
                              </div>
                            </td>

                            {/* Order Status */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isCancelled ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  <Ban className="w-3 h-3" />
                                  <span>Cancelled</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span>Active</span>
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* 1. Update Payment Button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaymentModal(o)}
                                  disabled={isCancelled}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                                    isCancelled
                                      ? "opacity-30 cursor-not-allowed bg-tea-surface text-tea-muted"
                                      : isPaid
                                      ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                                  }`}
                                  title="Update Payment Status / Mode"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>{isPaid ? "Payment" : "Update Pay"}</span>
                                </button>

                                {/* 2. Cancel Bill Button */}
                                {!isCancelled ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCancelModal(o)}
                                    className="p-1.5 rounded-lg border border-tea-border hover:bg-rose-50 hover:text-rose-700 text-tea-muted transition"
                                    title="Cancel Bill & Restock Inventory"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span
                                    className="p-1.5 text-tea-muted opacity-40 cursor-not-allowed"
                                    title="Bill is already cancelled"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </span>
                                )}

                                {/* 3. WhatsApp Invoice */}
                                <a
                                  href={getWhatsAppUrl(
                                    o.customerPhone,
                                    compileShopInvoiceWhatsAppMessage({
                                      orderNumber: o.orderNumber,
                                      shopName: o.customerName,
                                      shopPhone: o.customerPhone,
                                      routeTown: o.city,
                                      address: o.shippingAddress,
                                      items: o.items || [],
                                      subtotal: o.subtotal,
                                      discount: o.discount,
                                      deliveryCharge: o.deliveryCharge,
                                      grandTotal: o.grandTotal,
                                      paymentMethod: o.paymentMethod,
                                      paymentStatus: o.paymentStatus,
                                    })
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  title="Send WhatsApp Bill"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 fill-current text-emerald-600" />
                                </a>

                                {/* 4. Print Invoice */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCompletedOrder(o);
                                    setPrintModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-tea-border hover:bg-tea-surface text-tea-dark"
                                  title="Print Invoice"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>

                                {/* 5. View Details */}
                                <Link
                                  href={`/admin/orders/${o.id}`}
                                  className="p-1.5 rounded-lg border border-tea-border hover:bg-tea-surface text-tea-forest"
                                  title="Order Details"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. Registered Shops & QR Codes Directory */}
      {activeTab === "shops" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Bar */}
          <div className="bg-white rounded-3xl border border-tea-border p-6 shadow-card space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-tea-dark flex items-center gap-2">
                  <Store className="w-6 h-6 text-tea-forest" />
                  <span>Retail Shops & QR Code Directory</span>
                </h2>
                <p className="text-xs text-tea-muted mt-1">
                  Manage retail shops, view past orders and debt ledgers, scan counter QR codes, and print 80mm thermal stickers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQrScannerOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition"
                >
                  <Camera className="w-4 h-4 text-tea-gold" />
                  <span>Scan Shop QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegisterShopModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Register New Shop</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-tea-border/60">
              <div className="p-3.5 rounded-2xl bg-tea-surface/60 border border-tea-border">
                <span className="text-[10px] font-bold uppercase text-tea-muted block">
                  Total Shops
                </span>
                <span className="text-lg font-serif font-bold text-tea-dark">
                  {knownShops.length}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">
                  Shops With Credit Due
                </span>
                <span className="text-lg font-serif font-bold text-amber-950">
                  {knownShops.filter((s) => (s.pendingBalance || 0) > 0).length}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] font-bold uppercase text-rose-800 block">
                  Total Outstanding Debt
                </span>
                <span className="text-lg font-mono font-bold text-rose-700">
                  Rs. {knownShops.reduce((sum, s) => sum + (s.pendingBalance || 0), 0).toLocaleString()}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                  Total Retail Sales
                </span>
                <span className="text-lg font-mono font-bold text-emerald-800">
                  Rs. {knownShops.reduce((sum, s) => sum + (s.totalSalesAmount || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2 relative">
                <input
                  type="text"
                  value={shopSearchQuery}
                  onChange={(e) => setShopSearchQuery(e.target.value)}
                  placeholder="Search by shop name, owner, phone, or shop code..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 text-xs focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                />
                <Search className="w-4 h-4 text-tea-muted absolute left-3 top-3" />
              </div>

              <div>
                <select
                  value={shopFilterTown}
                  onChange={(e) => setShopFilterTown(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 text-xs focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                >
                  <option value="ALL">All Routes & Towns</option>
                  {Array.from(new Set(knownShops.map((s) => s.routeTown).filter(Boolean))).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Shops Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {knownShops
              .filter((s) => {
                if (shopFilterTown !== "ALL" && s.routeTown !== shopFilterTown) return false;
                if (!shopSearchQuery.trim()) return true;
                const q = shopSearchQuery.toLowerCase().trim();
                return (
                  s.shopName.toLowerCase().includes(q) ||
                  (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
                  (s.phone && s.phone.includes(q)) ||
                  (s.shopCode && s.shopCode.toLowerCase().includes(q)) ||
                  (s.routeTown && s.routeTown.toLowerCase().includes(q))
                );
              })
              .map((sh, idx) => {
                const hasDue = (sh.pendingBalance || 0) > 0;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl border border-tea-border p-5 shadow-card hover:shadow-md transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {sh.shopCode && (
                              <span className="px-2 py-0.5 rounded-md bg-tea-surface font-mono text-[10px] font-bold text-tea-dark border border-tea-border">
                                #{sh.shopCode}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                hasDue
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {hasDue
                                ? `DUE: Rs. ${sh.pendingBalance?.toLocaleString()}`
                                : "ACCOUNT CLEAN"}
                            </span>
                          </div>
                          <h3 className="font-serif text-base font-bold text-tea-dark mt-1 leading-snug">
                            {sh.shopName}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setStickerShop(sh);
                            setQrStickerModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-tea-surface hover:bg-tea-border/50 text-tea-dark border border-tea-border shrink-0 transition"
                          title="View & Print Shop QR Sticker"
                        >
                          <QrCode className="w-5 h-5 text-tea-forest" />
                        </button>
                      </div>

                      {/* Details */}
                      <div className="space-y-1 text-xs text-tea-muted">
                        {sh.ownerName && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-tea-forest shrink-0" />
                            <span className="truncate">Owner: <strong>{sh.ownerName}</strong></span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-tea-forest shrink-0" />
                          <span className="font-mono text-tea-dark">{sh.phone || "No phone"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-tea-forest shrink-0" />
                          <span className="truncate">{sh.routeTown || "No town specified"}</span>
                        </div>
                      </div>

                      {/* Financial Metrics */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-tea-border/60 text-xs">
                        <div className="p-2 rounded-xl bg-tea-surface/40">
                          <span className="text-[10px] text-tea-muted block">Total Bills:</span>
                          <span className="font-bold text-tea-dark">
                            {sh.totalBillsCount || 0} order(s)
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-tea-surface/40">
                          <span className="text-[10px] text-tea-muted block">Total Sales:</span>
                          <span className="font-bold font-mono text-tea-forest">
                            Rs. {(sh.totalSalesAmount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Pending Bills Alert if any */}
                      {hasDue && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>Outstanding Old Debt:</span>
                            <span className="font-mono text-rose-700">
                              Rs. {sh.pendingBalance?.toLocaleString()}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-80 block">
                            {sh.pendingBillsCount || 1} unpaid bill(s) pending collection.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-tea-border/60 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectKnownShop(sh);
                          setActiveTab("billing");
                        }}
                        className="py-2 px-3 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold flex items-center justify-center gap-1 shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5 text-tea-gold" />
                        <span>Create Bill</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStickerShop(sh);
                          setQrStickerModalOpen(true);
                        }}
                        className="py-2 px-3 rounded-xl bg-white hover:bg-tea-surface text-tea-dark font-bold border border-tea-border flex items-center justify-center gap-1 shadow-xs transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-tea-forest" />
                        <span>QR Sticker</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}


      {/* Printable Official Invoice / POS Thermal Terminal Modal */}
      {printModalOpen && (() => {
        const targetOrder = completedOrder || {
          orderNumber: `SHOP-DRAFT-${Date.now().toString().slice(-4)}`,
          customerName: shopName || "Valued Retail Shop",
          customerPhone: shopPhone || "071 777 4717",
          city: routeTown || "Kekirawa / Central",
          shippingAddress: address || "Direct Store Delivery",
          subtotal: billSubtotal,
          discount: discountAmount,
          deliveryCharge,
          grandTotal: billGrandTotal,
          paymentMethod,
          paymentStatus: computedPaymentStatus,
          paidAmount: hasOldDebt ? combinedAllocation.allocatedToNew : numericPaid,
          dueAmount: hasOldDebt
            ? Math.max(0, billGrandTotal - combinedAllocation.allocatedToNew)
            : afterBalance,
          deliveryNotes: notes,
          createdAt: new Date().toISOString(),
          items: billItems,
        };

        const isPartial = targetOrder.paymentStatus === "PARTIAL";
        let targetPaid =
          targetOrder.paidAmount !== undefined
            ? targetOrder.paidAmount
            : targetOrder.paymentStatus === "PAID"
            ? targetOrder.grandTotal
            : isPartial
            ? numericPaid
            : 0;

        let targetDue =
          targetOrder.dueAmount !== undefined
            ? targetOrder.dueAmount
            : isPartial
            ? Math.max(0, targetOrder.grandTotal - targetPaid)
            : targetOrder.paymentStatus === "PAID"
            ? 0
            : targetOrder.grandTotal;

        if (targetOrder.deliveryNotes && isPartial && targetPaid === 0) {
          const pMatch = targetOrder.deliveryNotes.match(/paid=([0-9.]+)/i);
          const dMatch = targetOrder.deliveryNotes.match(/due=([0-9.]+)/i);
          if (pMatch) targetPaid = parseFloat(pMatch[1]) || 0;
          if (dMatch) targetDue = parseFloat(dMatch[1]) || Math.max(0, targetOrder.grandTotal - targetPaid);
        }

        const prevPendingBalance = selectedKnownShop?.pendingBalance || 0;
        const totalStoreBalance = prevPendingBalance + targetDue;

        const targetCombined =
          targetOrder.combinedDetails ||
          parseCombinedPaymentDetails(targetOrder.deliveryNotes) ||
          (hasOldDebt
            ? {
                isCombined: true,
                oldBalance: oldShopDebt,
                newBillTotal: billGrandTotal,
                totalCombined: totalCombinedBalance,
                totalReceived: numericPaid,
                afterBalance,
              }
            : null);

        return (
          <div
            id="print-modal-container"
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-tea-dark/75 backdrop-blur-xs overflow-y-auto print:fixed print:inset-0 print:p-0 print:m-0 print:bg-white print:overflow-visible print:z-[99999]"
          >
            <div
              className={`bg-white rounded-3xl w-full p-4 sm:p-8 border border-tea-border shadow-2xl space-y-6 my-auto max-h-[94vh] overflow-y-auto animate-scale-up print:m-0 print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible print:w-auto print:max-w-none ${
                printFormat === "terminal" ? "max-w-md" : "max-w-3xl"
              }`}
            >
              {/* Modal Top Control Bar (Hidden when printing) */}
              <div className="pb-4 border-b border-tea-border space-y-3 print:hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Printer className="w-5 h-5 text-tea-forest" />
                    <div>
                      <h3 className="font-serif text-base sm:text-lg font-bold text-tea-dark">
                        Print Bill / Invoice
                      </h3>
                      <p className="text-[11px] font-mono text-tea-muted">
                        #{targetOrder.orderNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-4 py-2 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 text-tea-gold" />
                      <span>Print Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintModalOpen(false)}
                      className="p-2 text-tea-muted hover:text-tea-dark hover:bg-tea-surface rounded-lg transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Print Format Selector Switcher */}
                <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-tea-surface/80 border border-tea-border/60">
                  <span className="text-[11px] font-bold text-tea-muted pl-2">
                    Paper Print Size:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPrintFormat("terminal")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        printFormat === "terminal"
                          ? "bg-tea-dark text-tea-gold shadow-xs"
                          : "text-tea-muted hover:text-tea-dark"
                      }`}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>POS Thermal (80mm)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrintFormat("standard")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        printFormat === "standard"
                          ? "bg-tea-dark text-white shadow-xs"
                          : "text-tea-muted hover:text-tea-dark"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Standard A4</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. POS THERMAL TERMINAL (80mm) RECEIPT LAYOUT */}
              {printFormat === "terminal" ? (
                <div
                  id="printable-receipt"
                  className="mx-auto w-full max-w-[340px] bg-white p-3 sm:p-4 font-mono text-[11px] sm:text-[12px] leading-tight text-black border border-dashed border-gray-300 rounded-xl space-y-2 select-text shadow-xs print:border-none print:shadow-none print:p-0 print:max-w-none print:w-[76mm]"
                >
                  {/* Brand Header */}
                  <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-black">
                    <h2 className="font-bold text-sm tracking-wider uppercase">
                      LEENA CEYLON (PVT) LTD
                    </h2>
                    <p className="text-[10px] tracking-wide uppercase">
                      PURE CEYLON TEA • THE TASTE OF CEYLON
                    </p>
                    <p className="text-[10px]">
                      Pubbogama, Kekirawa, Sri Lanka
                    </p>
                    <p className="text-[10px] font-bold">
                      HOTLINE / WHATSAPP: +94 71 777 4717
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-0.5 py-1 text-[11px] border-b border-dashed border-black">
                    <div className="flex justify-between">
                      <span className="font-bold">BILL NO:</span>
                      <span className="font-bold">#{targetOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DATE/TIME:</span>
                      <span>
                        {new Date(targetOrder.createdAt || Date.now()).toLocaleDateString("en-GB")}{" "}
                        {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-y border-dashed border-black/40 my-0.5 font-bold">
                      <span className="font-bold">SALES REP:</span>
                      <span className="font-bold uppercase truncate max-w-[190px]">
                        {targetOrder.salesRepName || extractSalesRepName(targetOrder.deliveryNotes) || salesRepName || "Rep In-Charge"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>CUSTOMER:</span>
                      <span className="font-bold uppercase truncate max-w-[190px]">
                        {targetOrder.customerName}
                      </span>
                    </div>
                    {targetOrder.customerPhone && (
                      <div className="flex justify-between">
                        <span>PHONE:</span>
                        <span>{targetOrder.customerPhone}</span>
                      </div>
                    )}
                    {targetOrder.city && (
                      <div className="flex justify-between">
                        <span>ROUTE/TOWN:</span>
                        <span className="truncate max-w-[190px]">{targetOrder.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Items Table */}
                  <div className="py-1">
                    <div className="grid grid-cols-12 gap-1 font-bold border-b border-dashed border-black pb-1 mb-1 text-[11px]">
                      <span className="col-span-5 text-left">ITEM</span>
                      <span className="col-span-2 text-center">QTY</span>
                      <span className="col-span-2 text-right">RATE</span>
                      <span className="col-span-3 text-right">TOTAL</span>
                    </div>
                    <div className="space-y-1">
                      {(targetOrder.items || []).map((it: any, idx: number) => {
                        const uPrice = Number(it.unitPrice || 0);
                        const uQty = Number(it.quantity || 1);
                        const lineTotal =
                          Number(
                            it.subtotal !== undefined && it.subtotal !== null
                              ? it.subtotal
                              : uPrice * uQty
                          ) || 0;
                        return (
                          <div
                            key={idx}
                            className="grid grid-cols-12 gap-1 items-start text-[11px] leading-tight"
                          >
                            <div className="col-span-5 pr-1 leading-snug">
                              <span className="font-semibold block truncate">
                                {it.productName}
                              </span>
                              <span className="text-[10px] opacity-75 block">
                                {it.size}
                              </span>
                            </div>
                            <span className="col-span-2 text-center font-bold">
                              x{uQty}
                            </span>
                            <span className="col-span-2 text-right font-mono">
                              {uPrice.toLocaleString()}
                            </span>
                            <span className="col-span-3 text-right font-bold font-mono">
                              {lineTotal.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Totals & Payments */}
                  <div className="border-t border-dashed border-black pt-1.5 space-y-0.5 text-[11px]">
                    <div className="flex justify-between">
                      <span>SUBTOTAL:</span>
                      <span className="font-mono font-bold">
                        Rs. {(
                          Number(targetOrder.subtotal) ||
                          (targetOrder.items || []).reduce(
                            (s: number, it: any) =>
                              s +
                              (Number(it.subtotal) ||
                                Number(it.unitPrice || 0) *
                                  Number(it.quantity || 1)),
                            0
                          )
                        ).toLocaleString()}
                      </span>
                    </div>
                    {Number(targetOrder.discount || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>DISCOUNT:</span>
                        <span>-Rs. {Number(targetOrder.discount).toLocaleString()}</span>
                      </div>
                    )}
                    {Number(targetOrder.deliveryCharge || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>TRANSPORT:</span>
                        <span>Rs. {Number(targetOrder.deliveryCharge).toLocaleString()}</span>
                      </div>
                    )}

                    {/* Grand Total */}
                    <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
                      <span>TOTAL PAYABLE:</span>
                      <span>Rs. {Number(targetOrder.grandTotal || 0).toLocaleString()}</span>
                    </div>

                    {/* Payment Status Breakdown */}
                    <div className="pt-1.5 border-t border-dashed border-black space-y-0.5">
                      <div className="flex justify-between">
                        <span>PAYMENT STATUS:</span>
                        <span className="font-bold uppercase">
                          {targetOrder.paymentStatus === "PAID"
                            ? "PAID IN FULL"
                            : targetOrder.paymentStatus === "PARTIAL"
                            ? "PARTIAL PAYMENT"
                            : "CREDIT / UNPAID"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>PAYMENT MODE:</span>
                        <span className="capitalize">{targetOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>AMOUNT RECEIVED:</span>
                        <span>Rs. {targetPaid.toLocaleString()}</span>
                      </div>
                      {targetDue > 0 && (
                        <div className="flex justify-between font-bold text-rose-700">
                          <span>BALANCE DUE (CREDIT):</span>
                          <span>Rs. {targetDue.toLocaleString()}</span>
                        </div>
                      )}

                      {/* 2-BILL COMBINED STATEMENT & PAYMENT */}
                      {targetCombined && targetCombined.isCombined && targetCombined.oldBalance > 0 ? (
                        <div className="pt-1.5 border-t border-dashed border-black space-y-0.5">
                          <div className="text-center font-bold text-[10px] pb-0.5 tracking-wider uppercase">
                            --- 2-BILL COMBINED STATEMENT ---
                          </div>
                          <div className="flex justify-between">
                            <span>TODAY NEW INVOICE:</span>
                            <span>Rs. {targetCombined.newBillTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>OLD PENDING BILLS:</span>
                            <span>Rs. {targetCombined.oldBalance.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t border-dotted border-black pt-0.5">
                            <span>TOTAL (2 BILLS):</span>
                            <span>Rs. {targetCombined.totalCombined.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>TOTAL PAID TODAY:</span>
                            <span>Rs. {targetCombined.totalReceived.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-extrabold text-[12px] pt-0.5 border-t border-black">
                            <span>AFTER-PAYMENT BAL:</span>
                            <span>
                              Rs. {targetCombined.afterBalance.toLocaleString()} {targetCombined.afterBalance > 0 ? "DUE" : "SETTLED"}
                            </span>
                          </div>
                        </div>
                      ) : prevPendingBalance > 0 ? (
                        <>
                          <div className="flex justify-between opacity-80 pt-0.5">
                            <span>PREVIOUS OLD DUE:</span>
                            <span>Rs. {prevPendingBalance.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t border-dotted border-black pt-0.5">
                            <span>TOTAL STORE BALANCE:</span>
                            <span>Rs. {totalStoreBalance.toLocaleString()}</span>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Thermal Receipt Footer */}
                  <div className="pt-2 text-center text-[10px] space-y-0.5 border-t border-dashed border-black">
                    <p className="font-bold">*** THANK YOU FOR YOUR BUSINESS! ***</p>
                    <p>Good taste of Pure Ceylon Tea</p>
                    <p>Leena Ceylon POS Terminal • Kekirawa</p>
                  </div>
                </div>
              ) : (
                /* 2. STANDARD A4 INVOICE LAYOUT */
                <div id="printable-invoice" className="space-y-6 text-tea-dark text-xs p-2">
                  {/* Header with Logo & Brand Details */}
                  <div className="flex justify-between items-start pb-6 border-b-2 border-tea-dark">
                    <div>
                      <h2 className="font-serif text-2xl font-bold tracking-wider text-tea-dark">
                        LEENA CEYLON (PVT) LTD
                      </h2>
                      <p className="text-[11px] text-tea-muted font-medium uppercase tracking-widest mt-0.5">
                        PURE CEYLON TEA • THE TASTE OF CEYLON
                      </p>
                      <p className="text-[11px] text-tea-muted mt-1">
                        A/Bandarapothana, Pubbogama, Kekirawa, Sri Lanka<br />
                        Direct Hotline / WhatsApp: +94 71 777 4717<br />
                        Email: info@leenaceylon.com
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="inline-block px-3 py-1 bg-tea-dark text-white font-mono text-xs font-bold uppercase rounded">
                        SALES INVOICE
                      </span>
                      <p className="font-mono font-bold text-sm text-tea-dark pt-1">
                        #{targetOrder.orderNumber}
                      </p>
                      <p className="text-tea-muted text-[11px]">
                        Date: {new Date(targetOrder.createdAt || Date.now()).toLocaleDateString("en-GB")}
                      </p>
                      <p className="text-tea-dark font-medium text-[11px] pt-0.5">
                        Sales Rep: <strong className="text-tea-forest font-bold uppercase">{targetOrder.salesRepName || extractSalesRepName(targetOrder.deliveryNotes) || salesRepName || "Direct Sales Rep"}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Billed To (Shop Details) */}
                  <div className="grid grid-cols-2 gap-4 bg-tea-surface/40 p-4 rounded-xl border border-tea-border">
                    <div>
                      <span className="text-[10px] font-bold text-tea-muted uppercase tracking-wider block">
                        Billed To (Customer / Shop):
                      </span>
                      <h4 className="font-bold text-sm text-tea-dark mt-0.5">
                        {targetOrder.customerName}
                      </h4>
                      <p className="text-tea-muted mt-0.5">
                        {targetOrder.shippingAddress || "Direct Store Delivery"}
                      </p>
                      <p className="text-tea-muted">
                        Route / Area: <strong>{targetOrder.city || "Local Route"}</strong>
                      </p>
                      <p className="text-tea-muted font-mono">
                        Tel: {targetOrder.customerPhone}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-[10px] font-bold text-tea-muted uppercase tracking-wider block">
                        Payment Terms & Settlement:
                      </span>
                      <p className="font-bold text-tea-dark">
                        {targetOrder.paymentMethod === "CREDIT_SHOP" ? "Credit / On Account" : "Cash on Delivery"}
                      </p>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          targetOrder.paymentStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : targetOrder.paymentStatus === "PARTIAL"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        STATUS: {targetOrder.paymentStatus}
                      </span>
                      {targetOrder.paymentStatus === "PARTIAL" && (
                        <p className="text-[11px] text-tea-muted font-mono">
                          Paid: Rs. {targetPaid.toLocaleString()} | Due: Rs. {targetDue.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-tea-dark text-tea-dark font-bold text-[11px] uppercase">
                        <th className="py-2">#</th>
                        <th className="py-2">Item Description</th>
                        <th className="py-2">Pack Size</th>
                        <th className="py-2 text-right">Unit Price</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-tea-border">
                      {(targetOrder.items || []).map((it: any, idx: number) => {
                        const uPrice = Number(it.unitPrice || 0);
                        const uQty = Number(it.quantity || 1);
                        const sub =
                          Number(
                            it.subtotal !== undefined && it.subtotal !== null
                              ? it.subtotal
                              : uPrice * uQty
                          ) || 0;
                        return (
                          <tr key={idx}>
                            <td className="py-2 text-tea-muted">{idx + 1}</td>
                            <td className="py-2 font-bold text-tea-dark">{it.productName}</td>
                            <td className="py-2 text-tea-muted">{it.size}</td>
                            <td className="py-2 text-right font-mono">
                              Rs. {uPrice.toLocaleString()}
                            </td>
                            <td className="py-2 text-center font-bold font-mono">{uQty}</td>
                            <td className="py-2 text-right font-bold font-mono text-tea-dark">
                              Rs. {sub.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Financial Totals */}
                  <div className="flex justify-end pt-2">
                    <div className="w-64 space-y-1.5 text-xs">
                      <div className="flex justify-between text-tea-muted">
                        <span>Subtotal:</span>
                        <span className="font-bold text-tea-dark font-mono">
                          Rs. {(
                            Number(targetOrder.subtotal) ||
                            (targetOrder.items || []).reduce(
                              (s: number, it: any) =>
                                s +
                                (Number(it.subtotal) ||
                                  Number(it.unitPrice || 0) *
                                    Number(it.quantity || 1)),
                              0
                            )
                          ).toLocaleString()}
                        </span>
                      </div>
                      {Number(targetOrder.discount || 0) > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Discount:</span>
                          <span className="font-bold font-mono">
                            -Rs. {Number(targetOrder.discount).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-tea-muted">
                        <span>Transport / Delivery:</span>
                        <span className="font-bold text-tea-dark font-mono">
                          {Number(targetOrder.deliveryCharge || 0) === 0
                            ? "FREE"
                            : `Rs. ${Number(targetOrder.deliveryCharge).toLocaleString()}`}
                        </span>
                      </div>
                      <div className="border-t-2 border-tea-dark pt-1.5 flex justify-between items-baseline font-bold text-sm">
                        <span>Grand Total:</span>
                        <span className="text-base text-tea-forest font-mono">
                          Rs. {Number(targetOrder.grandTotal || 0).toLocaleString()}
                        </span>
                      </div>
                      {targetOrder.paymentStatus === "PARTIAL" && (
                        <>
                          <div className="flex justify-between text-emerald-700 font-mono text-xs pt-1 border-t border-tea-border">
                            <span>Amount Paid:</span>
                            <span>Rs. {targetPaid.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-rose-700 font-mono font-bold text-xs">
                            <span>Balance Due:</span>
                            <span>Rs. {targetDue.toLocaleString()}</span>
                          </div>
                        </>
                      )}

                      {/* 2-BILL COMBINED STATEMENT */}
                      {targetCombined && targetCombined.isCombined && targetCombined.oldBalance > 0 && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-1.5 font-mono">
                          <div className="font-sans font-bold text-[11px] text-amber-950 uppercase tracking-wide border-b border-amber-200 pb-1 flex justify-between items-center">
                            <span>2-Bill Combined Statement</span>
                            <span className="text-[10px] font-mono font-bold text-amber-800">
                              Old + New
                            </span>
                          </div>
                          <div className="flex justify-between text-amber-900">
                            <span>Today's New Invoice:</span>
                            <span>Rs. {targetCombined.newBillTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-amber-900">
                            <span>Old Pending Bill(s):</span>
                            <span>Rs. {targetCombined.oldBalance.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold text-amber-950 pt-1 border-t border-amber-200">
                            <span>Total Combined (2 Bills):</span>
                            <span>Rs. {targetCombined.totalCombined.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold text-emerald-800">
                            <span>Amount Paid Today:</span>
                            <span>Rs. {targetCombined.totalReceived.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-extrabold text-sm text-rose-700 pt-1 border-t-2 border-amber-300">
                            <span>After-Payment Bal (After Bal):</span>
                            <span>
                              Rs. {targetCombined.afterBalance.toLocaleString()} {targetCombined.afterBalance > 0 ? "DUE" : "(CLEAR)"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Signatures & Declarations */}
                  <div className="pt-12 grid grid-cols-2 gap-10 text-[11px] text-tea-muted border-t border-tea-border">
                    <div className="text-center space-y-1">
                      <div className="border-b border-tea-dark/60 pb-8" />
                      <p className="font-bold text-tea-dark pt-1">Authorized Sales Representative</p>
                      <p>LEENA CEYLON (PVT) LTD</p>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="border-b border-tea-dark/60 pb-8" />
                      <p className="font-bold text-tea-dark pt-1">Received in Good Order (Shop Seal/Sign)</p>
                      <p>Customer Acceptance</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 1. Payment Update Modal */}
      {paymentModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tea-dark/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-tea-border shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-tea-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-tea-dark">
                    Update Bill Payment
                  </h3>
                  <p className="text-[11px] font-mono text-tea-muted">
                    #{paymentModalOrder.orderNumber}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPaymentModalOrder(null)}
                className="p-1.5 rounded-lg text-tea-muted hover:text-tea-dark hover:bg-tea-surface transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill Summary Information */}
            <div className="p-3.5 rounded-2xl bg-tea-surface/60 border border-tea-border/60 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-tea-muted">Customer / Store:</span>
                <span className="font-bold text-tea-dark">{paymentModalOrder.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tea-muted">Route / Town:</span>
                <span className="text-tea-dark">{paymentModalOrder.city || "Direct Route"}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-tea-border/40 font-mono">
                <span className="text-tea-muted font-sans">Net Total Payable:</span>
                <span className="font-bold text-sm text-tea-forest">
                  Rs. {paymentModalOrder.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleSavePaymentUpdate} className="space-y-4 text-xs">
              {/* Payment Status Selector */}
              <div>
                <label className="block font-bold text-tea-dark mb-1.5">
                  Payment Collection Status *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentModalStatus("PAID");
                      setPaymentModalPaidAmount(paymentModalOrder.grandTotal);
                    }}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition ${
                      paymentModalStatus === "PAID"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-tea-surface text-tea-muted border-tea-border hover:bg-tea-bg"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PAID FULL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentModalStatus("PARTIAL");
                      if (paymentModalPaidAmount === 0 || paymentModalPaidAmount === paymentModalOrder.grandTotal) {
                        setPaymentModalPaidAmount(Math.round(paymentModalOrder.grandTotal / 2));
                      }
                    }}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition ${
                      paymentModalStatus === "PARTIAL"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-tea-surface text-tea-muted border-tea-border hover:bg-tea-bg"
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>HALF / PARTIAL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentModalStatus("PENDING");
                      setPaymentModalPaidAmount(0);
                    }}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition ${
                      paymentModalStatus === "PENDING"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-tea-surface text-tea-muted border-tea-border hover:bg-tea-bg"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>CREDIT DUE</span>
                  </button>
                </div>
              </div>

              {/* Partial Payment Amount Fields (Visible when PARTIAL is selected) */}
              {paymentModalStatus === "PARTIAL" && (
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-2.5 text-xs animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-950">Amount Paid Today (Rs.) *</span>
                    <span className="text-[10px] text-amber-800">Collected Advance / Half</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-tea-muted">Rs.</span>
                      <input
                        type="number"
                        min="1"
                        max={paymentModalOrder.grandTotal}
                        step="50"
                        required
                        value={paymentModalPaidAmount}
                        onChange={(e) =>
                          setPaymentModalPaidAmount(
                            Math.min(
                              paymentModalOrder.grandTotal,
                              Math.max(0, Number(e.target.value))
                            )
                          )
                        }
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-300 bg-white font-mono font-bold text-sm text-tea-dark focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentModalPaidAmount(Math.round(paymentModalOrder.grandTotal * 0.25))
                        }
                        className="px-2 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-mono text-[10px] font-bold"
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentModalPaidAmount(Math.round(paymentModalOrder.grandTotal * 0.5))
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-mono text-[10px] font-bold shadow-xs"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentModalPaidAmount(Math.round(paymentModalOrder.grandTotal * 0.75))
                        }
                        className="px-2 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-mono text-[10px] font-bold"
                      >
                        75%
                      </button>
                    </div>
                  </div>

                  {/* Calculated Balance Due */}
                  <div className="pt-2 border-t border-amber-200/80 flex justify-between items-center">
                    <span className="text-amber-900 font-medium">Remaining Credit to Keep Due:</span>
                    <span className="font-mono font-extrabold text-sm text-rose-700">
                      Rs. {Math.max(0, paymentModalOrder.grandTotal - paymentModalPaidAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="block font-bold text-tea-dark mb-1.5">
                  Payment Mode / Channel *
                </label>
                <select
                  value={paymentModalMethod}
                  onChange={(e) => setPaymentModalMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-tea-border bg-tea-surface font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                >
                  <option value="CASH_ON_DELIVERY">Cash on Spot</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  <option value="CHEQUE">Cheque Payment</option>
                  <option value="CREDIT_SHOP">Credit / On Account (Pay Later)</option>
                </select>
              </div>

              {/* Payment Reference Note */}
              <div>
                <label className="block font-semibold text-tea-dark mb-1">
                  Payment Reference / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Collected cash on visit, Cheque #40292, or slip confirmed"
                  value={paymentModalNote}
                  onChange={(e) => setPaymentModalNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-tea-border bg-tea-surface text-xs focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOrder(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-tea-border text-tea-muted hover:bg-tea-surface font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentModalSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {paymentModalSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-tea-gold" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-tea-gold" />
                      <span>Update Payment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Cancel Bill Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tea-dark/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-tea-border shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-tea-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-rose-950">
                    Cancel Shop Bill
                  </h3>
                  <p className="text-[11px] font-mono text-tea-muted">
                    #{cancelModalOrder.orderNumber}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="p-1.5 rounded-lg text-tea-muted hover:text-tea-dark hover:bg-tea-surface transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Restock Warning Box */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <Boxes className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Automatic Stock Restocking</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Cancelling this bill will immediately restore all items (
                <strong>{cancelModalOrder.items?.length || 0} line items</strong>) back into the warehouse
                inventory stock.
              </p>
            </div>

            {/* Bill Details Box */}
            <div className="p-3 rounded-xl bg-tea-surface/60 border border-tea-border/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-tea-muted">Shop:</span>
                <span className="font-bold text-tea-dark">{cancelModalOrder.customerName}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-tea-muted font-sans">Bill Total:</span>
                <span className="font-bold text-tea-forest">
                  Rs. {cancelModalOrder.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmCancelBill} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-tea-dark mb-1">
                  Reason for Cancellation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop closed, customer refused delivery, entry mistake"
                  value={cancelModalReason}
                  onChange={(e) => setCancelModalReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-tea-border bg-tea-surface text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-tea-border text-tea-muted hover:bg-tea-surface font-bold text-xs"
                >
                  Keep Bill Active
                </button>
                <button
                  type="submit"
                  disabled={cancelModalSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {cancelModalSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Confirm & Cancel</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Shop QR Code Scanner Modal */}
      <ShopQrScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        knownShops={knownShops}
        onShopDetected={handleShopDetectedFromQr}
        onShopNotFound={handleShopNotFoundFromQr}
      />

      {/* 4. Shop QR Counter Sticker & Print Modal */}
      <ShopQrStickerModal
        isOpen={qrStickerModalOpen}
        onClose={() => {
          setQrStickerModalOpen(false);
          setStickerShop(null);
        }}
        shop={stickerShop}
        onStartBilling={(sh) => {
          handleSelectKnownShop(sh);
          setActiveTab("billing");
        }}
      />

      {/* 5. Register New Shop Modal */}
      <RegisterShopModal
        isOpen={registerShopModalOpen}
        onClose={() => setRegisterShopModalOpen(false)}
        defaultSalesRepName={salesRepName}
        onShopRegistered={handleShopRegistered}
      />
    </div>
  );
}

