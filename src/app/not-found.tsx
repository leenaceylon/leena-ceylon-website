import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Coffee } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="relative h-14 w-44">
        <Image
          src="/brand/logo.png"
          alt="LEENA CEYLON"
          fill
          className="object-contain"
        />
      </div>

      <div className="w-16 h-16 rounded-full bg-tea-surface border border-tea-border flex items-center justify-center text-tea-leaf shadow-sm">
        <Coffee className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="font-serif text-3xl font-bold text-tea-dark">Page Not Found</h1>
        <p className="text-xs sm:text-sm text-tea-muted leading-relaxed">
          The Ceylon tea page or product you are looking for may have been moved, renamed, or is temporarily unavailable.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
        >
          Return to Home
        </Link>
        <Link
          href="/products"
          className="px-6 py-3 rounded-xl border border-tea-border bg-tea-surface hover:bg-tea-bg text-tea-dark text-xs font-semibold uppercase tracking-wider transition"
        >
          Browse Teas
        </Link>
      </div>
    </div>
  );
}
