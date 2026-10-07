"use client";

import React, { useState, useEffect } from "react";
import { Star, Check, X, Trash2, CheckCircle2, AlertCircle, ExternalLink, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [notice, setNotice] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSetApproval = async (id: string, isApproved: boolean) => {
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isApproved }),
      });
      if (res.ok) {
        showNotice(
          `Review ${
            isApproved
              ? "approved! Live on Product Details & Home Page 'What Our Customers Say'."
              : "unapproved (hidden from storefront)."
          }`
        );
        loadReviews();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update review status");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;
    try {
      const res = await fetch(`/api/reviews?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        showNotice("Review permanently deleted.");
        loadReviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pendingReviews = reviews.filter((r) => !r.isApproved);
  const approvedReviews = reviews.filter((r) => r.isApproved);

  const filteredReviews = reviews.filter((r) => {
    if (filter === "PENDING") return !r.isApproved;
    if (filter === "APPROVED") return r.isApproved;
    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            Customer Sentiment & Moderation
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
            Product Reviews Moderation
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Approve customer product reviews to display them on the Product page AND on the Home Page &ldquo;What Our Customers Say&rdquo; testimonials slider
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadReviews}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-tea-border bg-white text-xs font-semibold text-tea-dark hover:bg-tea-surface transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{notice}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-tea-border pb-2">
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filter === "ALL"
              ? "bg-tea-dark text-white shadow-sm"
              : "bg-white text-tea-muted hover:text-tea-dark hover:bg-tea-surface border border-tea-border"
          }`}
        >
          All Reviews
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === "ALL" ? "bg-white/20 text-white" : "bg-tea-surface text-tea-dark font-semibold"}`}>
            {reviews.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("PENDING")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filter === "PENDING"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-white text-amber-800 hover:bg-amber-50 border border-amber-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Pending Approval
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === "PENDING" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900 font-bold"}`}>
            {pendingReviews.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("APPROVED")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filter === "APPROVED"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          Approved & Live
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === "APPROVED" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-900 font-bold"}`}>
            {approvedReviews.length}
          </span>
        </button>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-tea-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-tea-muted flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 text-tea-leaf animate-spin" />
            <span>Loading reviews from database...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-xs text-tea-muted">
            {filter === "PENDING"
              ? "🎉 No reviews are currently pending approval. All caught up!"
              : filter === "APPROVED"
              ? "No approved reviews yet."
              : "No reviews submitted yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-tea-surface border-b border-tea-border text-tea-muted font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4 max-w-sm">Review Comment</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tea-border/60">
                {filteredReviews.map((r) => (
                  <tr key={r.id} className="hover:bg-tea-surface/40 transition">
                    <td className="py-3.5 px-4 font-bold text-tea-dark align-top">
                      <div className="font-semibold text-tea-dark">{r.product?.name || "General"}</div>
                      {r.product?.slug && (
                        <Link
                          href={`/products/${r.product.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[10px] text-tea-forest hover:underline mt-0.5 font-normal"
                        >
                          View on store <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-semibold text-tea-dark">{r.customerName}</div>
                      <div className="text-[10px] text-tea-muted">{r.email || "—"}</div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-tea-muted font-semibold mt-0.5 block">
                        {r.rating} / 5 Stars
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm text-tea-dark italic leading-relaxed align-top">
                      "{r.comment}"
                    </td>
                    <td className="py-3.5 px-4 text-tea-muted whitespace-nowrap align-top">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          r.isApproved
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {r.isApproved ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-700" />
                            Live on Product & Home Page
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-700" />
                            Pending Approval
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right align-top">
                      <div className="inline-flex items-center gap-2">
                        {r.isApproved ? (
                          <button
                            type="button"
                            onClick={() => handleSetApproval(r.id, false)}
                            className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-[11px] transition shadow-xs"
                          >
                            Unapprove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetApproval(r.id, true)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-sm flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Approve
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          title="Delete review"
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
    </div>
  );
}
