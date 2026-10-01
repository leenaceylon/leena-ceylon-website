"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error internally without exposing technical stack trace to user
    console.error("Storefront runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
          Something went wrong
        </h1>
        <p className="text-xs sm:text-sm text-tea-muted leading-relaxed">
          We experienced an unexpected issue loading this page. Our technical team has been notified. Please try refreshing.
        </p>
        {error?.message && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs font-mono text-rose-800 break-words mt-3">
            <span className="font-bold block mb-1">Details:</span>
            {error.message}
            {error.digest && (
              <span className="block text-[10px] text-rose-500 mt-1">
                Ref ID: {error.digest}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl border border-tea-border bg-tea-surface hover:bg-tea-bg text-tea-dark text-xs font-semibold uppercase tracking-wider transition"
        >
          Return to Storefront
        </Link>
      </div>
    </div>
  );
}
