"use client";

import React, { useState, useEffect } from "react";
import { Star, Check, X, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    setTimeout(() => setNotice(null), 3000);
  };

  const handleSetApproval = async (id: string, isApproved: boolean) => {
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isApproved }),
      });
      if (res.ok) {
        showNotice(`Review ${isApproved ? "approved" : "unapproved"}.`);
        loadReviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this review?")) return;
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotice("Review deleted.");
        loadReviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
          Customer Sentiment Moderation
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
          Product Reviews
        </h1>
        <p className="text-xs text-tea-muted mt-0.5">
          Moderate submitted reviews before they appear publicly on the storefront
        </p>
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
          <div className="p-12 text-center text-xs text-tea-muted">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-xs text-tea-muted">No reviews yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-tea-surface border-b border-tea-border text-tea-muted font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4 max-w-sm">Comment</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tea-border/60">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-tea-surface/40 transition">
                    <td className="py-3 px-4 font-bold text-tea-dark">
                      {r.product?.name || "General"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-tea-dark">{r.customerName}</div>
                      <div className="text-[10px] text-tea-muted">{r.email || "—"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-sm text-tea-dark italic">
                      "{r.comment}"
                    </td>
                    <td className="py-3 px-4 text-tea-muted whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.isApproved
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {r.isApproved ? "Approved" : "Pending Approval"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {r.isApproved ? (
                          <button
                            type="button"
                            onClick={() => handleSetApproval(r.id, false)}
                            className="px-2 py-1 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-50 font-semibold text-[11px]"
                          >
                            Unapprove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetApproval(r.id, true)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px]"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
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
