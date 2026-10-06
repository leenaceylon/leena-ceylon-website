"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Store,
  Plus,
  Trash2,
  Printer,
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
  ShieldCheck,
  ChevronDown,
  X,
  History,
  Layers,
} from "lucide-react";
import { getWhatsAppUrl, compileShopInvoiceWhatsAppMessage, ShopInvoiceData } from "@/lib/whatsapp";

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
  shopName: string;
  phone: string;
  routeTown: string;
  address: string;
  district?: string;
}

export default function ShopBillingPage() {
  const [activeTab, setActiveTab] = useState<"billing" | "history">("billing");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  // Item Selector State
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [productSearch, setProductSearch] = useState("");

  // Bill Cart Line Items
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  // Financial Calculations
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH_ON_DELIVERY");
  const [paymentStatus, setPaymentStatus] = useState<string>("PAID");

  // Invoicing & Print Modal State
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Load Inventory & Orders
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/shop-billing");
      const data = await res.json();
      if (data.products) setProducts(data.products);
      if (data.knownShops) setKnownShops(data.knownShops);
      if (data.recentShopOrders) setRecentOrders(data.recentShopOrders);

      if (data.products && data.products.length > 0 && !selectedProductId) {
        initProductSelection(data.products[0]);
      }
    } catch (e) {
      console.error("Failed to load inventory:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    return billItems.reduce((acc, it) => acc + it.subtotal, 0);
  }, [billItems]);

  const billGrandTotal = useMemo(() => {
    return Math.max(0, billSubtotal - Number(discountAmount || 0) + Number(deliveryCharge || 0));
  }, [billSubtotal, discountAmount, deliveryCharge]);

  // Autocomplete shop from known shops list
  const handleSelectKnownShop = (shop: KnownShop) => {
    setShopName(shop.shopName);
    setShopPhone(shop.phone);
    setRouteTown(shop.routeTown);
    setAddress(shop.address);
  };

  // Finalize & Save Shop Bill
  const handleSaveOrder = async () => {
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
      const res = await fetch("/api/admin/shop-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName,
          ownerName,
          shopPhone,
          routeTown,
          address,
          items: billItems,
          subtotal: billSubtotal,
          discount: Number(discountAmount),
          deliveryCharge: Number(deliveryCharge),
          grandTotal: billGrandTotal,
          paymentMethod,
          paymentStatus,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to record shop order.");
        return;
      }

      setCompletedOrder(data.order);
      setNotice(`Shop Order #${data.order.orderNumber} successfully finalized!`);
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
    setPaymentStatus("PAID");
    setCompletedOrder(null);
  };

  const handlePrint = () => {
    window.print();
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
      paymentStatus,
      items: billItems,
    };

    const invoiceData: ShopInvoiceData = {
      orderNumber: targetOrder.orderNumber,
      shopName: targetOrder.customerName || shopName,
      ownerName,
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
      notes,
    };

    const message = compileShopInvoiceWhatsAppMessage(invoiceData);
    return getWhatsAppUrl(targetOrder.customerPhone || shopPhone, message);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-tea-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Store className="w-3.5 h-3.5 text-emerald-700" />
              <span>Shop-by-Shop POS & Van Sale</span>
            </span>
            <span className="text-xs text-tea-muted font-medium">• Item-by-Item Quick Billing</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark mt-1">
            Shop Order Taking & Invoicing
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Take retail shop orders on the ground, add products item-by-item, generate instant bills, and send WhatsApp receipts.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("billing")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "billing"
                ? "bg-tea-dark text-white shadow-sm"
                : "bg-white text-tea-muted hover:text-tea-dark border border-tea-border"
            }`}
          >
            <Plus className="w-4 h-4 text-tea-gold" />
            <span>Active Billing Counter</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "history"
                ? "bg-tea-dark text-white shadow-sm"
                : "bg-white text-tea-muted hover:text-tea-dark border border-tea-border"
            }`}
          >
            <History className="w-4 h-4 text-tea-gold" />
            <span>Shop Bills Ledger ({recentOrders.length})</span>
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

      {activeTab === "billing" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Shop Details & Item-by-Item Entry */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Shop Profile & Route Section */}
            <div className="bg-white rounded-3xl border border-tea-border p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-tea-border/60 pb-3">
                <h3 className="font-serif text-base font-bold text-tea-dark flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-tea-leaf" />
                  <span>1. Target Shop / Store Details</span>
                </h3>

                {knownShops.length > 0 && (
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const sh = knownShops.find((x) => x.shopName === e.target.value);
                        if (sh) handleSelectKnownShop(sh);
                      }}
                      className="text-[11px] font-semibold text-tea-forest bg-tea-surface border border-tea-border rounded-lg px-2.5 py-1 focus:outline-none"
                    >
                      <option value="">Quick Pick Known Shop ({knownShops.length})...</option>
                      {knownShops.map((sh, idx) => (
                        <option key={idx} value={sh.shopName}>
                          {sh.shopName} ({sh.routeTown || "Route"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
            </div>

            {/* 2. Fast Item-by-Item Entry Counter */}
            <div className="bg-white rounded-3xl border border-tea-border p-6 shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-tea-border/60 pb-3">
                <h3 className="font-serif text-base font-bold text-tea-dark flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-tea-leaf" />
                  <span>2. Add Products Item-by-Item</span>
                </h3>
                <span className="text-[11px] text-tea-muted">
                  Standard & Wholesale Shop Billing
                </span>
              </div>

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
                        value={itemUnitPrice}
                        onChange={(e) => setItemUnitPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-bold text-tea-forest rounded-xl border border-tea-border bg-white focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 font-mono"
                      />
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-[11px] font-bold text-tea-dark mb-1">
                        Qty (Packs)
                      </label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                          className="px-2.5 py-2 rounded-l-xl border border-r-0 border-tea-border bg-tea-surface hover:bg-tea-bg text-tea-dark font-bold text-xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={itemQuantity}
                          onChange={(e) => setItemQuantity(Math.max(1, Number(e.target.value)))}
                          className="w-full py-2 text-center text-xs font-bold text-tea-dark border-y border-tea-border bg-white focus:outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setItemQuantity(itemQuantity + 1)}
                          className="px-2.5 py-2 rounded-r-xl border border-l-0 border-tea-border bg-tea-surface hover:bg-tea-bg text-tea-dark font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Add Item Button */}
                    <div>
                      <button
                        type="submit"
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Item</span>
                      </button>
                    </div>
                  </div>
                </form>
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
                          className="w-6 h-6 rounded-lg bg-white border border-tea-border flex items-center justify-center font-bold text-tea-dark hover:bg-tea-surface"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs font-mono w-6 text-center">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(it.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-tea-border flex items-center justify-center font-bold text-tea-dark hover:bg-tea-surface"
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
              </div>

              {/* Payment Mode & Status */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div>
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

                <div>
                  <label className="block font-bold text-tea-dark mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-bold text-xs focus:outline-none ${
                      paymentStatus === "PAID"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    <option value="PAID">PAID IN FULL</option>
                    <option value="PENDING">DUE / CREDIT</option>
                  </select>
                </div>
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
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-tea-gold" />
                      <span>Finalize Shop Bill (Rs. {billGrandTotal.toLocaleString()})</span>
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
      ) : (
        /* History & Ledger View */
        <div className="bg-white rounded-3xl border border-tea-border shadow-card overflow-hidden">
          <div className="p-6 border-b border-tea-border flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-tea-dark">
                Shop Billing History & Ledger
              </h3>
              <p className="text-xs text-tea-muted">
                All shop-by-shop orders taken on the ground with items, payment statuses, and routes.
              </p>
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-tea-muted text-xs">
              No shop orders recorded yet. Switch to "Active Billing Counter" to take your first shop order.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-tea-surface border-b border-tea-border text-tea-muted font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Shop / Store</th>
                    <th className="py-3.5 px-4">Route / Town</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Items</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tea-border/60">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-tea-surface/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-tea-dark whitespace-nowrap">
                        #{o.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-tea-muted whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-tea-dark">
                        {o.customerName}
                      </td>
                      <td className="py-3 px-4 text-tea-muted">
                        {o.city || "Direct Route"}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-tea-dark">
                        {o.customerPhone}
                      </td>
                      <td className="py-3 px-4 text-tea-muted">
                        {o.items?.length || 0} item(s)
                      </td>
                      <td className="py-3 px-4 font-bold text-tea-forest whitespace-nowrap">
                        Rs. {o.grandTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {o.paymentStatus} ({o.paymentMethod === "CREDIT_SHOP" ? "Credit" : "Cash"})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
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
                            title="WhatsApp Bill"
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-current text-emerald-600" />
                          </a>

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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Printable Official Invoice Modal */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tea-dark/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-10 border border-tea-border shadow-2xl space-y-6 my-8 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-tea-border print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-tea-forest" />
                <h3 className="font-serif text-lg font-bold text-tea-dark">
                  Official Shop Sales Invoice & Bill
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="p-2 text-tea-muted hover:text-tea-dark rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
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
                    #{completedOrder ? completedOrder.orderNumber : "INVOICE-DRAFT"}
                  </p>
                  <p className="text-tea-muted text-[11px]">
                    Date: {new Date().toLocaleDateString("en-GB")}
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
                    {completedOrder ? completedOrder.customerName : shopName || "Shop Partner"}
                  </h4>
                  <p className="text-tea-muted mt-0.5">
                    {completedOrder
                      ? completedOrder.shippingAddress
                      : address || "Direct Store Delivery"}
                  </p>
                  <p className="text-tea-muted">
                    Route / Area:{" "}
                    <strong>{completedOrder ? completedOrder.city : routeTown || "Local Route"}</strong>
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[10px] font-bold text-tea-muted uppercase tracking-wider block">
                    Payment Terms:
                  </span>
                  <p className="font-bold text-tea-dark">
                    {paymentMethod === "CREDIT_SHOP" ? "Credit / On Account" : "Cash on Delivery"}
                  </p>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      paymentStatus === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    STATUS: {paymentStatus}
                  </span>
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
                  {(completedOrder ? completedOrder.items : billItems).map(
                    (it: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 text-tea-muted">{idx + 1}</td>
                        <td className="py-2 font-bold text-tea-dark">{it.productName}</td>
                        <td className="py-2 text-tea-muted">{it.size}</td>
                        <td className="py-2 text-right font-mono">
                          Rs. {it.unitPrice.toLocaleString()}
                        </td>
                        <td className="py-2 text-center font-bold font-mono">{it.quantity}</td>
                        <td className="py-2 text-right font-bold font-mono text-tea-dark">
                          Rs. {it.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>

              {/* Financial Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-tea-muted">
                    <span>Subtotal:</span>
                    <span className="font-bold text-tea-dark font-mono">
                      Rs. {(completedOrder ? completedOrder.subtotal : billSubtotal).toLocaleString()}
                    </span>
                  </div>
                  {Number(completedOrder ? completedOrder.discount : discountAmount) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-bold font-mono">
                        -Rs. {Number(completedOrder ? completedOrder.discount : discountAmount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-tea-muted">
                    <span>Transport / Delivery:</span>
                    <span className="font-bold text-tea-dark font-mono">
                      {Number(completedOrder ? completedOrder.deliveryCharge : deliveryCharge) === 0
                        ? "FREE"
                        : `Rs. ${Number(completedOrder ? completedOrder.deliveryCharge : deliveryCharge).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="border-t-2 border-tea-dark pt-1.5 flex justify-between items-baseline font-bold text-sm">
                    <span>Grand Total:</span>
                    <span className="text-base text-tea-forest font-mono">
                      Rs. {(completedOrder ? completedOrder.grandTotal : billGrandTotal).toLocaleString()}
                    </span>
                  </div>
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
          </div>
        </div>
      )}
    </div>
  );
}
