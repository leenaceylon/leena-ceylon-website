"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ProductForm({
  initialData,
  isEdit = false,
}: {
  initialData?: any;
  isEdit?: boolean;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    sku: initialData?.sku || "",
    categoryId: initialData?.categoryId || "",
    shortDescription: initialData?.shortDescription || "",
    fullDescription: initialData?.fullDescription || "",
    teaType: initialData?.teaType || "Pure Ceylon Black Tea",
    teaGrade: initialData?.teaGrade || "BOPF",
    origin: initialData?.origin || "Nuwara Eliya, Sri Lanka",
    regularPrice: initialData?.regularPrice || 490,
    salePrice: initialData?.salePrice || "",
    stock: initialData?.stock || 100,
    lowStockThreshold: initialData?.lowStockThreshold || 10,
    isFeatured: initialData?.isFeatured || false,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    mainImage: initialData?.mainImage || "/uploads/leena-tea-powder-200g.jpeg",
    brewingGuide: initialData?.brewingGuide || "",
  });

  const [sizes, setSizes] = useState<any[]>(
    initialData?.sizes && initialData.sizes.length > 0
      ? initialData.sizes
      : [
          { sizeName: "100g", weightGram: 100, regularPrice: 200, salePrice: null, stock: 50 },
          { sizeName: "250g", weightGram: 250, regularPrice: 490, salePrice: null, stock: 50 },
          { sizeName: "500g", weightGram: 500, regularPrice: 950, salePrice: null, stock: 30 },
        ]
  );

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Load categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
          if (!formData.categoryId && data.categories.length > 0) {
            setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id }));
          }
        }
      })
      .catch((e) => console.error(e));

    // Load available media
    fetch("/api/media/upload")
      .then((res) => res.json())
      .then((data) => {
        if (data.media) setMediaList(data.media);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSizeChange = (idx: number, field: string, val: any) => {
    const next = [...sizes];
    next[idx] = { ...next[idx], [field]: val };
    setSizes(next);
  };

  const handleAddSize = () => {
    setSizes([
      ...sizes,
      {
        sizeName: "200g",
        weightGram: 200,
        regularPrice: formData.regularPrice,
        salePrice: null,
        stock: 50,
      },
    ]);
  };

  const handleRemoveSize = (idx: number) => {
    setSizes(sizes.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const payload = {
        ...formData,
        sizes,
      };

      const url = isEdit ? `/api/products/${initialData.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      setStatus("success");
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-tea-border">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl border border-tea-border hover:bg-tea-surface transition"
          >
            <ArrowLeft className="w-4 h-4 text-tea-muted" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-tea-dark">
              {isEdit ? `Edit: ${initialData.name}` : "Add New Ceylon Tea"}
            </h1>
            <p className="text-xs text-tea-muted">
              Configure product details, weight variations, and pricing
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-50"
        >
          {status === "loading"
            ? "SAVING..."
            : isEdit
            ? "UPDATE PRODUCT"
            : "SAVE PRODUCT"}
        </button>
      </div>

      {status === "success" && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Product saved successfully! Redirecting...</span>
        </div>
      )}

      {status === "error" && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* General Information */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-tea-border shadow-subtle space-y-4">
        <h3 className="font-serif text-base font-bold text-tea-dark pb-2 border-b border-tea-border">
          1. General Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. LEENA CEYLON BOPF Premium Tin"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              SKU (Stock Keeping Unit) *
            </label>
            <input
              type="text"
              name="sku"
              required
              placeholder="e.g. LC-BOPF-250"
              value={formData.sku}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Category *
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Tea Grade
            </label>
            <input
              type="text"
              name="teaGrade"
              placeholder="e.g. BOPF, FBOP, OP, Dust"
              value={formData.teaGrade}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Tea Type
            </label>
            <input
              type="text"
              name="teaType"
              placeholder="e.g. Pure Ceylon Black Tea, Lemon Tea"
              value={formData.teaType}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Origin & Elevation
            </label>
            <input
              type="text"
              name="origin"
              placeholder="e.g. Nuwara Eliya, High Grown (6,000+ ft), Sri Lanka"
              value={formData.origin}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Short Description
            </label>
            <textarea
              name="shortDescription"
              rows={2}
              placeholder="Brief summary displayed on catalog cards..."
              value={formData.shortDescription}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Full Description
            </label>
            <textarea
              name="fullDescription"
              rows={4}
              placeholder="Detailed description, terroir notes, taste profile..."
              value={formData.fullDescription}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Brewing Instructions (How to make the perfect cup)
            </label>
            <textarea
              name="brewingGuide"
              rows={3}
              placeholder="1. Boil fresh water to 100°C... 2. Steep 2g for 3-5 mins..."
              value={formData.brewingGuide}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>
        </div>
      </div>

      {/* Pricing & Stock Management */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-tea-border shadow-subtle space-y-4">
        <h3 className="font-serif text-base font-bold text-tea-dark pb-2 border-b border-tea-border">
          2. Base Pricing & Stock
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Regular Price (Rs.) *
            </label>
            <input
              type="number"
              name="regularPrice"
              required
              min="0"
              value={formData.regularPrice}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Sale Price (Optional)
            </label>
            <input
              type="number"
              name="salePrice"
              min="0"
              placeholder="Optional discount price"
              value={formData.salePrice}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Current Stock (Units) *
            </label>
            <input
              type="number"
              name="stock"
              required
              min="0"
              value={formData.stock}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Low Stock Alert Limit
            </label>
            <input
              type="number"
              name="lowStockThreshold"
              min="1"
              value={formData.lowStockThreshold}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>
        </div>
      </div>

      {/* Available Sizes / Weight Variations */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-tea-border shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-tea-border">
          <div>
            <h3 className="font-serif text-base font-bold text-tea-dark">
              3. Available Packaging Sizes (100g, 250g, 500g, 1kg)
            </h3>
            <p className="text-xs text-tea-muted">
              Control the specific package sizes offered to customers with individual pricing
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddSize}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-tea-border hover:bg-tea-bg text-xs font-semibold text-tea-forest transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Size Option
          </button>
        </div>

        <div className="space-y-3">
          {sizes.map((sz, idx) => (
            <div
              key={idx}
              className="p-3 bg-tea-surface rounded-xl border border-tea-border/80 grid grid-cols-2 sm:grid-cols-5 gap-3 items-center"
            >
              <div>
                <label className="block text-[10px] text-tea-muted mb-0.5">Size Name</label>
                <input
                  type="text"
                  placeholder="e.g. 250g"
                  value={sz.sizeName}
                  onChange={(e) => handleSizeChange(idx, "sizeName", e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-tea-border bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-tea-muted mb-0.5">Weight (g)</label>
                <input
                  type="number"
                  placeholder="250"
                  value={sz.weightGram}
                  onChange={(e) => handleSizeChange(idx, "weightGram", Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-tea-border bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-tea-muted mb-0.5">Price (Rs.)</label>
                <input
                  type="number"
                  placeholder="490"
                  value={sz.regularPrice}
                  onChange={(e) => handleSizeChange(idx, "regularPrice", Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-tea-border bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-tea-muted mb-0.5">Stock</label>
                <input
                  type="number"
                  placeholder="50"
                  value={sz.stock}
                  onChange={(e) => handleSizeChange(idx, "stock", Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-tea-border bg-white"
                />
              </div>

              <div className="flex justify-end pt-3 sm:pt-0">
                <button
                  type="button"
                  onClick={() => handleRemoveSize(idx)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                  title="Remove size"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Media & Images */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-tea-border shadow-subtle space-y-4">
        <h3 className="font-serif text-base font-bold text-tea-dark pb-2 border-b border-tea-border">
          4. Product Image
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Main Image URL / Path
            </label>
            <input
              type="text"
              name="mainImage"
              value={formData.mainImage}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>

          {/* Quick Select from uploaded catalog */}
          {mediaList.length > 0 && (
            <div>
              <span className="block text-[11px] text-tea-muted mb-2 font-medium">
                Or select from uploaded media:
              </span>
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {mediaList.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, mainImage: m.url })}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                      formData.mainImage === m.url
                        ? "border-tea-forest ring-2 ring-tea-forest/30"
                        : "border-tea-border hover:opacity-80"
                    }`}
                  >
                    <Image src={m.url} alt={m.originalName} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {formData.mainImage && (
            <div className="pt-2">
              <span className="block text-[11px] text-tea-muted mb-1">Preview:</span>
              <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-tea-border bg-tea-surface">
                <Image
                  src={formData.mainImage}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toggles: Featured & Active */}
      <div className="bg-white p-6 rounded-2xl border border-tea-border shadow-subtle flex flex-col sm:flex-row gap-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isFeatured"
            checked={formData.isFeatured}
            onChange={handleChange}
            className="w-4 h-4 rounded text-tea-forest focus:ring-tea-leaf"
          />
          <div>
            <span className="font-bold text-xs text-tea-dark block">Feature on Homepage</span>
            <span className="text-[11px] text-tea-muted block">
              Display this product in the featured teas carousel on the homepage
            </span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-4 h-4 rounded text-tea-forest focus:ring-tea-leaf"
          />
          <div>
            <span className="font-bold text-xs text-tea-dark block">Active & Available</span>
            <span className="text-[11px] text-tea-muted block">
              Visible for customers to purchase and order via WhatsApp
            </span>
          </div>
        </label>
      </div>

      <div className="flex justify-end gap-3 pb-8">
        <Link
          href="/admin/products"
          className="px-6 py-3 rounded-xl border border-tea-border text-tea-muted hover:text-tea-dark hover:bg-tea-bg text-xs font-bold uppercase tracking-wider transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-8 py-3 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-card hover:shadow-hover disabled:opacity-50"
        >
          {status === "loading" ? "SAVING..." : "SAVE PRODUCT"}
        </button>
      </div>
    </form>
  );
}
