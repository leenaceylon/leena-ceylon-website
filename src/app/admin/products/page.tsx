"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  DollarSign,
  Package,
  Clock,
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "coming_soon" | "out_of_stock">("all");
  const [notification, setNotification] = useState<string | null>(null);
  const [quickPriceModal, setQuickPriceModal] = useState<{
    isOpen: boolean;
    product: any | null;
    newPrice: number;
    newOfferPrice: number | string;
    newStock: number;
  }>({
    isOpen: false,
    product: null,
    newPrice: 0,
    newOfferPrice: "",
    newStock: 0,
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error("Failed to load products", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleActive = async (p: any) => {
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (res.ok) {
        showNotice(`Product ${!p.isActive ? "enabled" : "disabled"} successfully.`);
        loadProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleComingSoon = async (p: any) => {
    try {
      const nextStatus = !p.isComingSoon;
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isComingSoon: nextStatus }),
      });
      if (res.ok) {
        showNotice(
          `Product "${p.name}" ${nextStatus ? "marked as Coming Soon (Pre-Launch)" : "restored to Standard Available"}.`
        );
        loadProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotice("Product deleted successfully.");
        loadProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveQuickPrice = async () => {
    if (!quickPriceModal.product) return;
    try {
      const offerNum =
        quickPriceModal.newOfferPrice !== "" &&
        quickPriceModal.newOfferPrice !== null &&
        quickPriceModal.newOfferPrice !== undefined &&
        Number(quickPriceModal.newOfferPrice) > 0
          ? Number(quickPriceModal.newOfferPrice)
          : null;

      const res = await fetch(`/api/products/${quickPriceModal.product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regularPrice: Number(quickPriceModal.newPrice),
          salePrice: offerNum,
          stock: Number(quickPriceModal.newStock),
        }),
      });
      if (res.ok) {
        showNotice("Product price, offer, and stock updated successfully.");
        setQuickPriceModal({
          isOpen: false,
          product: null,
          newPrice: 0,
          newOfferPrice: "",
          newStock: 0,
        });
        loadProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const countActive = products.filter((p) => p.isActive && !p.isComingSoon).length;
  const countComingSoon = products.filter((p) => Boolean(p.isComingSoon)).length;
  const countOutOfStock = products.filter((p) => p.stock <= 0).length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.teaGrade?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === "active") return p.isActive && !p.isComingSoon;
    if (statusFilter === "coming_soon") return Boolean(p.isComingSoon);
    if (statusFilter === "out_of_stock") return p.stock <= 0;
    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            Catalog Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
            Products & Pricing
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Manage teas, package sizes, pricing, and live inventory levels
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          ADD PRODUCT
        </Link>
      </div>

      {/* Success Notification */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-tea-border shadow-subtle">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 order-2 md:order-1">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === "all"
                ? "bg-tea-dark text-white shadow-xs"
                : "bg-tea-surface text-tea-dark border border-tea-border hover:bg-tea-bg"
            }`}
          >
            <span>All</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-inherit font-semibold">
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === "active"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-tea-surface text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            <span>Active</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              {countActive}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("coming_soon")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === "coming_soon"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-tea-surface text-amber-900 border border-amber-300 hover:bg-amber-50"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Coming Soon</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
              {countComingSoon}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("out_of_stock")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === "out_of_stock"
                ? "bg-rose-700 text-white shadow-xs"
                : "bg-tea-surface text-rose-800 border border-rose-200 hover:bg-rose-50"
            }`}
          >
            <span>Out of Stock</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
              {countOutOfStock}
            </span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative flex-1 max-w-md order-1 md:order-2">
          <input
            type="text"
            placeholder="Search products by name, SKU, or grade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
          />
          <Search className="w-4 h-4 text-tea-muted absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-tea-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-tea-muted text-xs">
            Loading catalog data...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-tea-muted text-xs">
            No products available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-tea-surface border-b border-tea-border text-tea-muted font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Grade</th>
                  <th className="py-3.5 px-4">Base Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tea-border/60">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-tea-surface/40 transition">
                    {/* Product Cell */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-tea-surface border border-tea-border shrink-0">
                          <Image
                            src={p.mainImage || "/uploads/leena-tea-powder-200g.jpeg"}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-tea-dark hover:text-tea-forest">
                              {p.name}
                            </h4>
                            {p.isComingSoon && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                                <Clock className="w-2.5 h-2.5" /> Soon
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-tea-muted block">
                            SKU: {p.sku}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-tea-dark">
                      {p.category?.name || "General"}
                    </td>

                    {/* Grade */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-tea-bg text-tea-forest font-semibold text-[10px]">
                        {p.teaGrade || "Standard"}
                      </span>
                    </td>

                    {/* Price & Offer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          {p.salePrice && p.salePrice < p.regularPrice ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-emerald-700 text-sm">
                                  Rs. {p.salePrice.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-tea-muted line-through">
                                  Rs. {p.regularPrice.toLocaleString()}
                                </span>
                              </div>
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                                Offer: Save Rs. {(p.regularPrice - p.salePrice).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-tea-forest text-sm">
                              Rs. {p.regularPrice.toLocaleString()}
                            </span>
                          )}
                          {p.sizes && p.sizes.length > 0 && (
                            <span className="text-[10px] text-tea-muted block mt-0.5">
                              {p.sizes.length} pack size(s)
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setQuickPriceModal({
                              isOpen: true,
                              product: p,
                              newPrice: p.regularPrice,
                              newOfferPrice: p.salePrice || "",
                              newStock: p.stock,
                            })
                          }
                          title="Quick Edit Price & Stock"
                          className="p-1 text-tea-muted hover:text-tea-forest hover:bg-tea-bg rounded"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          p.stock <= 0
                            ? "bg-rose-100 text-rose-800"
                            : p.stock <= p.lowStockThreshold
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.stock} units
                      </span>
                    </td>

                    {/* Status & Coming Soon Toggles */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                            p.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {p.isActive ? "Active" : "Disabled"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleComingSoon(p)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition border flex items-center gap-1 shadow-xs ${
                            p.isComingSoon
                              ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                              : "bg-tea-surface text-tea-muted border-tea-border hover:text-tea-dark hover:border-amber-300"
                          }`}
                          title="Click to toggle Coming Soon pre-order status"
                        >
                          <Clock className="w-2.5 h-2.5" />
                          {p.isComingSoon ? "Coming Soon" : "Set Coming Soon"}
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          title="View on Live Store"
                          className="p-1.5 text-tea-muted hover:text-tea-dark hover:bg-tea-bg rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/products/${p.id}`}
                          title="Edit Product"
                          className="p-1.5 text-tea-forest hover:bg-tea-forest/10 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.name)}
                          title="Delete Product"
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Edit Price & Stock Modal */}
      {quickPriceModal.isOpen && quickPriceModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-tea-border">
            <h3 className="font-serif font-bold text-base text-tea-dark">
              Quick Price & Offer Update
            </h3>
            <p className="text-xs text-tea-muted">
              Updating <strong>{quickPriceModal.product.name}</strong>. Changes immediately appear on the live website.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Regular Price (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={quickPriceModal.newPrice}
                  onChange={(e) =>
                    setQuickPriceModal({
                      ...quickPriceModal,
                      newPrice: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">
                  Offer Price (Rs.) <span className="font-normal text-tea-muted">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 480"
                  value={quickPriceModal.newOfferPrice}
                  onChange={(e) =>
                    setQuickPriceModal({
                      ...quickPriceModal,
                      newOfferPrice: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold text-emerald-900"
                />
              </div>

              {/* Live Preview in modal */}
              {Number(quickPriceModal.newOfferPrice) > 0 &&
                Number(quickPriceModal.newOfferPrice) < Number(quickPriceModal.newPrice) && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 space-y-0.5">
                    <p className="font-semibold">🟢 Active Special Offer:</p>
                    <p>
                      Customer pays <strong>Rs. {Number(quickPriceModal.newOfferPrice).toLocaleString()}</strong> (was{" "}
                      <span className="line-through text-tea-muted">
                        Rs. {Number(quickPriceModal.newPrice).toLocaleString()}
                      </span>
                      )
                    </p>
                    <p className="text-emerald-700 font-bold">
                      Discount: Save Rs. {(Number(quickPriceModal.newPrice) - Number(quickPriceModal.newOfferPrice)).toLocaleString()}
                    </p>
                  </div>
                )}

              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Available Stock (Units)
                </label>
                <input
                  type="number"
                  min="0"
                  value={quickPriceModal.newStock}
                  onChange={(e) =>
                    setQuickPriceModal({
                      ...quickPriceModal,
                      newStock: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveQuickPrice}
                className="flex-1 py-2 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase transition"
              >
                SAVE CHANGES
              </button>
              <button
                type="button"
                onClick={() =>
                  setQuickPriceModal({
                    isOpen: false,
                    product: null,
                    newPrice: 0,
                    newOfferPrice: "",
                    newStock: 0,
                  })
                }
                className="py-2 px-4 rounded-xl border border-tea-border text-tea-muted hover:text-tea-dark text-xs font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
