import React from "react";
import Link from "next/link";
import { MessageSquare, ArrowRight, ShieldCheck, Truck } from "lucide-react";

export default function CartPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-8 animate-fade-in">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 flex items-center justify-center shadow-subtle">
        <MessageSquare className="w-10 h-10 fill-current" />
      </div>

      <div className="space-y-3">
        <span className="text-xs uppercase font-bold tracking-widest text-tea-leaf">
          Fast & Personal Service
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-tea-dark">
          Direct WhatsApp Ordering
        </h1>
        <p className="text-sm text-tea-muted max-w-lg mx-auto leading-relaxed">
          We have simplified our ordering process! You no longer need to fill complex checkout forms. Simply pick your favourite Ceylon tea and order directly through WhatsApp with immediate dispatch confirmation.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link
          href="/products"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-card hover:shadow-hover"
        >
          <span>BROWSE OUR TEA COLLECTION</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <a
          href="https://wa.me/94717774717?text=Hello%20LEENA%20CEYLON,%20I%20would%20like%20to%20inquire%20about%20ordering%20Pure%20Ceylon%20Tea."
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm hover:shadow"
        >
          <MessageSquare className="w-4 h-4 fill-current" />
          <span>ORDER VIA WHATSAPP (071 777 4717)</span>
        </a>
      </div>

      <div className="pt-8 border-t border-tea-border grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left text-xs text-tea-muted">
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-tea-border/60">
          <Truck className="w-5 h-5 text-tea-leaf shrink-0" />
          <span>Islandwide Delivery within 24–48 Hours</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-tea-border/60">
          <ShieldCheck className="w-5 h-5 text-tea-leaf shrink-0" />
          <span>Bank Transfer & Cash on Delivery Accepted</span>
        </div>
      </div>
    </div>
  );
}
