"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle, Tag, Percent, Upload, HardDrive, RefreshCw } from "lucide-react";
import { calculatePricing } from "@/lib/pricing";

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
    isComingSoon: initialData?.isComingSoon !== undefined ? initialData.isComingSoon : false,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    mainImage: initialData?.mainImage || "/uploads/leena-tea-powder-200g.jpeg",
    brewingGuide: initialData?.brewingGuide || "",
  });

  const [sizes, setSizes] = useState<any[]>(
    initialData?.sizes && Array.isArray(initialData.sizes)
      ? initialData.sizes
      : []
  );

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadNotice, setImageUploadNotice] = useState<{ message: string; isError?: boolean } | null>(null);

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
        regularPrice: Number(formData.regularPrice) || 500,
        salePrice: formData.salePrice ? Number(formData.salePrice) : null,
        stock: 50,
      },
    ]);
  };

  const handleRemoveSize = (idx: number) => {
    setSizes(sizes.filter((_, i) => i !== idx));
  };

  const handleDirectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    setImageUploadNotice(null);

    try {
      const formPayload = new FormData();
      formPayload.append("file", file);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formPayload,
      });

      const data = await res.json();
      if (!res.ok) {
        setImageUploadNotice({
          message: data.error || "Failed to upload image. Please check file format and size.",
          isError: true,
        });
        return;
      }

      setFormData((prev) => ({ ...prev, mainImage: data.media.url }));
      if (data.media) {
        setMediaList((prev) => [data.media, ...prev]);
      }
      setImageUploadNotice({
        message: `Image saved automatically (${data.localFilePath || "public/uploads/"})!`,
        isError: false,
      });
      setTimeout(() => setImageUploadNotice(null), 6000);
    } catch (err: any) {
      console.error(err);
      setImageUploadNotice({
        message: err?.message || "Error uploading image file.",
        isError: true,
      });
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const payload = {
        ...formData,
        regularPrice: Number(formData.regularPrice) || 0,
        salePrice:
          formData.salePrice !== "" &&
          formData.salePrice !== null &&
          formData.salePrice !== undefined &&
          Number(formData.salePrice) > 0
            ? Number(formData.salePrice)
            : null,
        stock: Number(formData.stock) || 0,
        lowStockThreshold: Number(formData.lowStockThreshold) || 10,
        sizes: sizes.map((s) => ({
          ...s,
          sizeName: s.sizeName?.trim() || "Standard",
          weightGram: Number(s.weightGram) || 0,
          regularPrice: Number(s.regularPrice) || 0,
          salePrice:
            s.salePrice !== "" &&
            s.salePrice !== null &&
            s.salePrice !== undefined &&
            Number(s.salePrice) > 0
              ? Number(s.salePrice)
              : null,
          stock: Number(s.stock) || 0,
        })),
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
        <div className="pb-2 border-b border-tea-border flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-tea-dark">
              2. Base Pricing & Stock
            </h3>
            <p className="text-xs text-tea-muted">
              Configure base regular selling price and optional discount offer price
            </p>
          </div>
          <span className="text-xs font-semibold text-tea-forest bg-tea-surface px-2.5 py-1 rounded-lg border border-tea-border">
            Currency: LKR (Rs.)
          </span>
        </div>

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
              placeholder="e.g. 500"
              value={formData.regularPrice}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 font-semibold"
            />
            <span className="text-[10px] text-tea-muted mt-0.5 block">Original / crossed-out MRP price</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Offer Price (Rs.) <span className="text-emerald-700 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              name="salePrice"
              min="0"
              placeholder="e.g. 480"
              value={formData.salePrice}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-emerald-300 bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold text-emerald-900"
            />
            <span className="text-[10px] text-emerald-800 mt-0.5 block">Discounted customer selling price</span>
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
            <span className="text-[10px] text-tea-muted mt-0.5 block">Total available packs in warehouse</span>
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
            <span className="text-[10px] text-tea-muted mt-0.5 block">Alerts admin when stock is below this</span>
          </div>

          {/* Live Base Offer Status Banner */}
          {(() => {
            const pricing = calculatePricing(formData.regularPrice, formData.salePrice);
            if (pricing.hasDiscount) {
              return (
                <div className="sm:col-span-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-emerald-950 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                    <span>
                      <strong>Active Base Offer:</strong> Customer pays{" "}
                      <strong className="text-emerald-700 text-sm">Rs. {pricing.unitPrice.toLocaleString("en-US")}</strong>{" "}
                      (was <span className="line-through text-tea-muted">Rs. {pricing.regularPrice.toLocaleString("en-US")}</span>)
                    </span>
                  </div>
                  <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px] shadow-xs">
                    Save Rs. {pricing.savingsPerUnit.toLocaleString("en-US")} ({pricing.discountPercent}% OFF)
                  </span>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Available Sizes / Weight Variations */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-tea-border shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-tea-border gap-2">
          <div>
            <h3 className="font-serif text-base font-bold text-tea-dark">
              3. Packaging Sizes & Gram-wise Offer Pricing (50g, 100g, 200g, 250g, 500g, 1kg)
            </h3>
            <p className="text-xs text-tea-muted">
              Set gram weight, regular price, and special offer price for each packaging size
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddSize}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-tea-forest bg-tea-forest/5 hover:bg-tea-forest hover:text-white text-xs font-semibold text-tea-forest transition self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Packaging Size
          </button>
        </div>

        {sizes.length === 0 ? (
          <div className="p-5 bg-tea-surface/60 rounded-xl border border-dashed border-tea-border text-center space-y-2.5">
            <p className="text-xs font-bold text-tea-dark">
              No Separate Packaging Sizes Configured (Single Standard Pack)
            </p>
            <p className="text-[11px] text-tea-muted max-w-lg mx-auto leading-relaxed">
              The customer storefront will use your <strong>Base Pricing</strong> from Section 2 directly:
              <br />
              Regular Price: <strong>Rs. {formData.regularPrice}</strong>
              {formData.salePrice ? (
                <> • Active Offer Price: <strong className="text-emerald-700">Rs. {formData.salePrice}</strong></>
              ) : null}
              {` `}• Stock: <strong>{formData.stock} units</strong>
            </p>
            <p className="text-[11px] text-tea-forest font-medium">
              If this tea comes in multiple weights (e.g. 50g, 100g, 200g, 250g, 500g, 1kg), click below to add sizes with individual offer prices:
            </p>
            <button
              type="button"
              onClick={handleAddSize}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-tea-forest text-white text-xs font-semibold hover:bg-tea-dark transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Packaging Size</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
          {sizes.map((sz, idx) => {
            const szPricing = calculatePricing(sz.regularPrice, sz.salePrice);
            return (
              <div
                key={idx}
                className="p-3.5 bg-tea-surface rounded-xl border border-tea-border/80 space-y-2.5 transition hover:border-tea-leaf/60"
              >
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-end">
                  <div>
                    <label className="block text-[10px] font-semibold text-tea-muted mb-1">Pack Name</label>
                    <input
                      type="text"
                      placeholder="e.g. 200g"
                      value={sz.sizeName}
                      onChange={(e) => handleSizeChange(idx, "sizeName", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-tea-border bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-tea-muted mb-1">Weight (g)</label>
                    <input
                      type="number"
                      placeholder="200"
                      value={sz.weightGram}
                      onChange={(e) => handleSizeChange(idx, "weightGram", Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-tea-border bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-tea-muted mb-1">Regular Price (Rs.) *</label>
                    <input
                      type="number"
                      placeholder="500"
                      value={sz.regularPrice}
                      onChange={(e) => handleSizeChange(idx, "regularPrice", Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-tea-border bg-white font-semibold text-tea-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-800 mb-1">Offer Price (Rs.)</label>
                    <input
                      type="number"
                      placeholder="480 (Optional)"
                      value={sz.salePrice !== null && sz.salePrice !== undefined ? sz.salePrice : ""}
                      onChange={(e) => handleSizeChange(idx, "salePrice", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-emerald-50/40 font-bold text-emerald-900 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-tea-muted mb-1">Stock (Packs)</label>
                    <input
                      type="number"
                      placeholder="50"
                      value={sz.stock}
                      onChange={(e) => handleSizeChange(idx, "stock", Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-tea-border bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-end pb-0.5">
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition border border-rose-200"
                      title="Remove size option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Gram-wise Live Offer Status Badge */}
                <div className="pt-1.5 border-t border-tea-border/50 flex items-center justify-between text-[11px]">
                  {szPricing.hasDiscount ? (
                    <div className="flex items-center gap-2 text-emerald-900 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span>
                        <strong>Offer Active:</strong> Customer pays{" "}
                        <strong className="text-emerald-700">Rs. {szPricing.unitPrice.toLocaleString("en-US")}</strong>{" "}
                        (was <span className="line-through text-tea-muted">Rs. {szPricing.regularPrice.toLocaleString("en-US")}</span>)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                        Save Rs. {szPricing.savingsPerUnit.toLocaleString("en-US")} ({szPricing.discountPercent}% OFF)
                      </span>
                    </div>
                  ) : (
                    <span className="text-tea-muted">
                      Standard Price: <strong>Rs. {szPricing.unitPrice.toLocaleString("en-US")}</strong> (No discount)
                    </span>
                  )}
                  <span className="text-[10px] text-tea-muted">Weight: {sz.weightGram} grams</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Media & Images */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-tea-border shadow-subtle space-y-4">
        <div className="pb-3 border-b border-tea-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-bold text-tea-dark flex items-center gap-2">
              <span>4. Product Image</span>
            </h3>
            <p className="text-xs text-tea-muted">
              Select existing media or upload directly from your computer (auto-saved to local disk)
            </p>
          </div>

          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold transition shadow-sm self-start sm:self-auto">
            {imageUploading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>{imageUploading ? "Saving to Local Folder..." : "Upload from Computer"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleDirectImageUpload}
              className="hidden"
              disabled={imageUploading}
            />
          </label>
        </div>

        {imageUploadNotice && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              imageUploadNotice.isError
                ? "bg-rose-50 border-rose-300 text-rose-900"
                : "bg-emerald-50 border-emerald-300 text-emerald-900"
            }`}
          >
            {imageUploadNotice.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-medium">{imageUploadNotice.message}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Main Image URL / Local Path
            </label>
            <input
              type="text"
              name="mainImage"
              value={formData.mainImage}
              onChange={handleChange}
              placeholder="e.g. /uploads/1790331419153_tea-splash.jpg"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 font-mono text-tea-dark"
            />
          </div>

          {/* Quick Select from uploaded catalog */}
          {mediaList.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-tea-muted font-medium">
                  Select from Media Library ({mediaList.length} files available):
                </span>
                <Link
                  href="/admin/media"
                  target="_blank"
                  className="text-[11px] text-tea-forest hover:underline font-semibold"
                >
                  Open Media Library &rarr;
                </Link>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {mediaList.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, mainImage: m.url })}
                    title={m.originalName || m.filename}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                      formData.mainImage === m.url
                        ? "border-tea-forest ring-2 ring-tea-forest/40 scale-105"
                        : "border-tea-border hover:opacity-80"
                    }`}
                  >
                    <Image src={m.url} alt={m.originalName || "Media"} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {formData.mainImage && (
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-xl bg-tea-surface/60 border border-tea-border">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-tea-border bg-white shrink-0">
                <Image
                  src={formData.mainImage}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-xs space-y-1">
                <span className="font-bold text-tea-dark block">Active Product Image Preview</span>
                <p className="font-mono text-[11px] text-tea-forest flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-tea-muted shrink-0" />
                  <span>Local File: public{formData.mainImage}</span>
                </p>
                <p className="text-[11px] text-tea-muted">
                  Stored directly on your PC disk and loaded statically for optimal speed and reliability.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toggles: Featured, Coming Soon, & Active */}
      <div className="bg-white p-6 rounded-2xl border border-tea-border shadow-subtle grid grid-cols-1 sm:grid-cols-3 gap-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isFeatured"
            checked={formData.isFeatured}
            onChange={handleChange}
            className="w-4 h-4 mt-0.5 rounded text-tea-forest focus:ring-tea-leaf"
          />
          <div>
            <span className="font-bold text-xs text-tea-dark block">Feature on Homepage</span>
            <span className="text-[11px] text-tea-muted block">
              Display this product in the featured teas carousel on the homepage
            </span>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isComingSoon"
            checked={formData.isComingSoon}
            onChange={handleChange}
            className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500"
          />
          <div>
            <span className="font-bold text-xs text-amber-800 flex items-center gap-1.5">
              <span>Coming Soon Status</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 text-amber-800 font-bold border border-amber-300">
                Pre-launch
              </span>
            </span>
            <span className="text-[11px] text-tea-muted block">
              Displays &quot;Coming Soon&quot; badge, disables direct checkout, and enables pre-order inquiry via WhatsApp
            </span>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-4 h-4 mt-0.5 rounded text-tea-forest focus:ring-tea-leaf"
          />
          <div>
            <span className="font-bold text-xs text-tea-dark block">Active & Visible</span>
            <span className="text-[11px] text-tea-muted block">
              Product is visible to customers across the store and catalog
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
