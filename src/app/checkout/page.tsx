import React from "react";
import Link from "next/link";
import { MessageSquare, ArrowRight, Building, ShieldCheck } from "lucide-react";

export default function CheckoutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-8 animate-fade-in">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 flex items-center justify-center shadow-subtle">
        <MessageSquare className="w-10 h-10 fill-current" />
      </div>

      <div className="space-y-3">
        <span className="text-xs uppercase font-bold tracking-widest text-tea-leaf">
          No Checkout Required
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-tea-dark">
          Order Directly via WhatsApp
        </h1>
        <p className="text-sm text-tea-muted max-w-lg mx-auto leading-relaxed">
          LEENA CEYLON orders are processed directly on WhatsApp! Choose your tea, select your pack size, and chat with our tea specialists for immediate order confirmation and islandwide dispatch.
        </p>
      </div>

      {/* Bank Account Details Highlight */}
      <div className="bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/50 p-6 rounded-2xl border border-tea-gold/50 max-w-lg mx-auto text-left space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-tea-forest pb-2 border-b border-tea-border">
          <Building className="w-4 h-4 text-tea-leaf" />
          <span>LEENA CEYLON Bank Transfer Details</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-tea-dark">
          <div>
            <span className="text-tea-muted block text-[11px]">Bank:</span>
            <span className="font-semibold">Commercial Bank of Ceylon</span>
          </div>
          <div>
            <span className="text-tea-muted block text-[11px]">Account Name:</span>
            <span className="font-semibold">LEENA CEYLON (PVT) LTD</span>
          </div>
          <div>
            <span className="text-tea-muted block text-[11px]">Account Number:</span>
            <span className="font-mono font-bold text-sm text-tea-forest select-all">1000 2489 7120</span>
          </div>
          <div>
            <span className="text-tea-muted block text-[11px]">Branch:</span>
            <span className="font-semibold">Kekirawa Branch</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link
          href="/products"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-card hover:shadow-hover"
        >
          <span>EXPLORE CEYLON TEAS</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <a
          href="https://wa.me/94717774717?text=Hello%20LEENA%20CEYLON,%20I%20would%20like%20to%20order%20tea%20and%20pay%20via%20Bank%20Transfer."
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm hover:shadow"
        >
          <MessageSquare className="w-4 h-4 fill-current" />
          <span>CHAT ON WHATSAPP (071 777 4717)</span>
        </a>
      </div>
    </div>
  );
}
