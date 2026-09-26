"use client";

import React, { useState } from "react";
import { Star, CheckCircle2, MessageSquarePlus } from "lucide-react";

export default function ProductReviews({
  productId,
  reviews,
}: {
  productId: string;
  reviews: Array<{
    id: string;
    customerName: string;
    rating: number;
    comment: string;
    createdAt: Date | string;
  }>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setComment("");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong.");
    }
  };

  return (
    <div className="space-y-10 pt-8 border-t border-tea-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-bold text-tea-dark">Customer Reviews</h3>
          <p className="text-xs text-tea-muted mt-0.5">
            Verified opinions from Ceylon tea enthusiasts
          </p>
        </div>
      </div>

      {/* Review Submission Form */}
      <div className="bg-tea-surface p-6 sm:p-8 rounded-2xl border border-tea-border space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="w-5 h-5 text-tea-leaf" />
          <h4 className="font-serif font-bold text-base text-tea-dark">Write a Review</h4>
        </div>

        {status === "success" ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Thank you for your review!</p>
              <p className="mt-0.5">
                Your review has been submitted for moderation and will appear publicly once approved by our team.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === "error" && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
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
                placeholder="Share your experience regarding aroma, taste, color and character of this tea..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-tea-border bg-white focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
            >
              {status === "loading" ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="p-8 text-center bg-tea-surface rounded-2xl border border-tea-border">
            <p className="text-sm font-medium text-tea-muted">No reviews yet.</p>
            <p className="text-xs text-tea-muted/80 mt-1">
              Be the first to review this product above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl border border-tea-border bg-white space-y-2.5 shadow-subtle"
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
                <div className="text-[11px] font-semibold text-tea-forest">
                  — {rev.customerName} (Verified)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
