"use client";

import React, { useState, useEffect } from "react";
import { Tag, Plus, Trash2, CheckCircle2 } from "lucide-react";

export default function AdminPromotionsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrder: 1500,
    maxDiscount: 500,
    usageLimit: 100,
    isAutoApply: false,
  });

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/promotions");
      const data = await res.json();
      if (data.coupons) setCoupons(data.coupons);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create coupon");
        return;
      }
      setNotice(`Coupon ${data.coupon.code} created.`);
      setTimeout(() => setNotice(null), 3000);
      setModalOpen(false);
      setFormData({
        code: "",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minOrder: 1500,
        maxDiscount: 500,
        usageLimit: 100,
        isAutoApply: false,
      });
      loadCoupons();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon code?")) return;
    try {
      const res = await fetch(`/api/promotions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotice("Coupon removed.");
        loadCoupons();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/promotions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      if (res.ok) {
        setNotice(`Coupon ${!currentActive ? "activated" : "deactivated"}.`);
        setTimeout(() => setNotice(null), 3000);
        loadCoupons();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAutoApply = async (id: string, currentAutoApply: boolean) => {
    try {
      const res = await fetch("/api/promotions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isAutoApply: !currentAutoApply }),
      });
      if (res.ok) {
        setNotice(`Auto-apply ${!currentAutoApply ? "enabled" : "disabled"}.`);
        setTimeout(() => setNotice(null), 3000);
        loadCoupons();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            Marketing & Discounts
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
            Promotions & Coupons
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Create promotional discount codes and special checkout incentives
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          CREATE COUPON
        </button>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-tea-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-tea-muted">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-xs text-tea-muted">No active coupons created.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-tea-surface border-b border-tea-border text-tea-muted font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min Spend</th>
                  <th className="py-3.5 px-4">Auto-Apply</th>
                  <th className="py-3.5 px-4">Times Used</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tea-border/60">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-tea-surface/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-tea-forest text-sm">
                      {c.code}
                    </td>
                    <td className="py-3 px-4 text-tea-dark">{c.discountType}</td>
                    <td className="py-3 px-4 font-bold text-tea-dark">
                      {c.discountType === "FREE_SHIPPING"
                        ? "Free Delivery"
                        : c.discountType === "PERCENTAGE"
                        ? `${c.discountValue}%`
                        : `Rs. ${c.discountValue}`}
                    </td>
                    <td className="py-3 px-4 text-tea-muted">
                      {c.minOrder ? `Rs. ${c.minOrder}` : "None"}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleAutoApply(c.id, Boolean(c.isAutoApply))}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                          c.isAutoApply
                            ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                            : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
                        }`}
                        title="Click to toggle auto-apply when customer purchase qualifies"
                      >
                        <span>{c.isAutoApply ? "⚡ AUTO ON" : "MANUAL"}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-tea-dark">{c.timesUsed} uses</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c.id, c.isActive)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                          c.isActive
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        {c.isActive ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-tea-border"
          >
            <h3 className="font-serif font-bold text-base text-tea-dark">
              Create Discount Coupon
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CEYLON10"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-tea-dark mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({
                        ...formData,
                        discountType: newType,
                        isAutoApply: newType === "FREE_SHIPPING" ? true : formData.isAutoApply,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (Rs.)</option>
                    <option value="FREE_SHIPPING">Free Islandwide Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-tea-dark mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Minimum Order Spend (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minOrder}
                  onChange={(e) => setFormData({ ...formData, minOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface"
                />
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAutoApply}
                    onChange={(e) => setFormData({ ...formData, isAutoApply: e.target.checked })}
                    className="w-4 h-4 text-tea-forest rounded border-tea-border focus:ring-tea-leaf"
                  />
                  <span className="text-xs font-bold text-tea-dark flex items-center gap-1">
                    <span>⚡ Auto-Apply to Eligible Orders</span>
                  </span>
                </label>
                <p className="text-[11px] text-tea-muted pl-6">
                  Automatically applied at checkout when customer purchase reaches Rs. {formData.minOrder || 1500}+.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase transition"
              >
                CREATE COUPON
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-tea-border text-tea-muted hover:text-tea-dark text-xs font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
