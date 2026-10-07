"use client";

import React, { useState, useEffect } from "react";
import { Star, CheckCircle2, MessageSquarePlus, Clock, Edit3, ShieldCheck } from "lucide-react";

interface ReviewItem {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
}

export default function ProductReviews({
  productId,
  reviews,
  customerUser,
}: {
  productId: string;
  reviews?: ReviewItem[];
  customerUser?: { name?: string; email?: string } | null;
}) {
  const [approvedReviews, setApprovedReviews] = useState<ReviewItem[]>(
    Array.isArray(reviews) ? reviews : []
  );
  const [name, setName] = useState(customerUser?.name || "");
  const [email, setEmail] = useState(customerUser?.email || "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingReview, setPendingReview] = useState<{
    customerName: string;
    rating: number;
    comment: string;
    isUpdate?: boolean;
  } | null>(null);

  // Sync approved reviews from props or fetch fresh approved reviews from GET /api/reviews
  useEffect(() => {
    if (Array.isArray(reviews)) {
      setApprovedReviews(reviews);
    }
  }, [reviews]);

  // Load any local pending review stored for this product in current session
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`pending_review_${productId}`);
      if (stored) {
        setPendingReview(JSON.parse(stored));
      }
    } catch (e) {
      // Ignore
    }
  }, [productId]);

  // Update default name/email when customerUser becomes available
  useEffect(() => {
    if (customerUser?.name && !name) setName(customerUser.name);
    if (customerUser?.email && !email) setEmail(customerUser.email);
  }, [customerUser]);

  const refreshApprovedReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.reviews)) {
          setApprovedReviews(data.reviews);
        }
      }
    } catch (e) {
      // Ignore fetch error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          customerName: name,
          email,
          rating,
          comment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      setStatus("success");
      setStatusMessage(
        data.message ||
          "Your review has been submitted and is pending administrator approval before appearing publicly."
      );

      const submittedInfo = {
        customerName: name.trim(),
        rating,
        comment: comment.trim(),
        isUpdate: Boolean(data.isUpdate),
      };

      setPendingReview(submittedInfo);
      try {
        sessionStorage.setItem(`pending_review_${productId}`, JSON.stringify(submittedInfo));
      } catch (e) {
        // Ignore
      }

      // Re-fetch approved reviews to ensure list is in sync
      await refreshApprovedReviews();
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  const handleEditPendingReview = () => {
    if (pendingReview) {
      setName(pendingReview.customerName);
      setRating(pendingReview.rating);
      setComment(pendingReview.comment);
      setStatus("idle");
    }
  };

  // Calculate review stats
  const totalReviews = approvedReviews.length;
  const avgRating =
    totalReviews > 0
      ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : "5.0";

  return (
    <div className="space-y-10 pt-8 border-t border-tea-border">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-bold text-tea-dark">Customer Reviews</h3>
          <p className="text-xs text-tea-muted mt-0.5">
            Verified opinions from Ceylon tea enthusiasts
          </p>
        </div>

        {totalReviews > 0 && (
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-tea-surface rounded-xl border border-tea-border text-xs">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-tea-dark">{avgRating}</span>
            </div>
            <span className="text-tea-muted">·</span>
            <span className="text-tea-muted font-medium">
              {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </span>
          </div>
        )}
      </div>

      {/* Review Submission Box */}
      <div className="bg-tea-surface p-6 sm:p-8 rounded-2xl border border-tea-border space-y-4 shadow-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-tea-leaf" />
            <h4 className="font-serif font-bold text-base text-tea-dark">
              {pendingReview ? "Update Your Review" : "Write a Review"}
            </h4>
          </div>
          {pendingReview && status === "idle" && (
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-700" />
              Pending Moderation
            </span>
          )}
        </div>

        {/* Customer Pending Notification Box */}
        {pendingReview && (
          <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-900 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">
                    {pendingReview.isUpdate
                      ? "Review Updated & Awaiting Admin Approval"
                      : "Review Submitted & Awaiting Admin Approval"}
                  </p>
                  <p className="text-amber-800/90 text-[11px] mt-0.5">
                    Your review is currently pending moderation. Once approved by our administrators in the admin panel, it will appear publicly below.
                  </p>
                </div>
              </div>
              {status === "success" && (
                <button
                  type="button"
                  onClick={handleEditPendingReview}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-200/80 hover:bg-amber-200 text-amber-900 transition flex items-center gap-1 shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>

            {/* Preview of pending review */}
            <div className="p-3 bg-white/90 rounded-lg border border-amber-200 text-xs space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < pendingReview.rating ? "fill-amber-400" : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-[10px] text-tea-muted ml-1 font-semibold">
                  ({pendingReview.rating} / 5)
                </span>
              </div>
              <p className="text-tea-dark italic text-xs leading-relaxed">
                "{pendingReview.comment}"
              </p>
              <div className="text-[11px] font-semibold text-tea-forest">
                — {pendingReview.customerName}
              </div>
            </div>
          </div>
        )}

        {status === "success" ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Thank you for sharing your feedback!</p>
                <p className="mt-0.5 text-emerald-700">
                  {statusMessage ||
                    "Your review has been submitted for moderation and will appear publicly once approved by our team."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setComment("");
              }}
              className="text-xs underline text-emerald-900 font-semibold hover:text-emerald-700 shrink-0"
            >
              Write another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === "error" && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ruwan Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-tea-border bg-white focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ruwan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-tea-border bg-white focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                />
              </div>
            </div>

            {/* Rating selector */}
            <div>
              <label className="block text-xs font-semibold text-tea-dark mb-1.5">
                Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition"
                    aria-label={`Select ${star} stars`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? "fill-amber-400" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-tea-muted ml-2 font-medium">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-tea-dark mb-1">
                Your Review *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Share your experience regarding aroma, taste, color and character of this Ceylon tea..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-tea-border bg-white focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-6 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-2"
              >
                {status === "loading" ? "Submitting..." : pendingReview ? "Update Review" : "Submit Review"}
              </button>
              <span className="text-[11px] text-tea-muted flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-tea-forest" />
                Moderated by admin before public display
              </span>
            </div>
          </form>
        )}
      </div>

      {/* Public Approved Reviews List */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-tea-dark flex items-center justify-between">
          <span>Approved Public Reviews ({approvedReviews.length})</span>
          <button
            type="button"
            onClick={refreshApprovedReviews}
            className="text-[11px] font-normal text-tea-forest hover:underline"
          >
            Refresh
          </button>
        </h4>

        {approvedReviews.length === 0 ? (
          <div className="p-8 text-center bg-tea-surface rounded-2xl border border-tea-border">
            <p className="text-sm font-medium text-tea-muted">No public reviews yet.</p>
            <p className="text-xs text-tea-muted/80 mt-1">
              Be the first to share your experience with this Ceylon tea above!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl border border-tea-border bg-white space-y-2.5 shadow-subtle hover:border-tea-forest/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? "fill-amber-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-tea-muted">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-tea-dark italic leading-relaxed">
                  "{rev.comment}"
                </p>
                <div className="text-[11px] font-semibold text-tea-forest flex items-center gap-1.5">
                  <span>— {rev.customerName}</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
