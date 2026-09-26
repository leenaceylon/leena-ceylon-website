"use client";

import React, { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp";

export default function FloatingWhatsApp({
  whatsappNumber = "071 777 4717",
  brandName = "LEENA CEYLON",
}: {
  whatsappNumber?: string;
  brandName?: string;
}) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const defaultGreeting = `Hello ${brandName},\n\nI am visiting your online store and would like to inquire about your Ceylon teas.`;
  const url = getWhatsAppUrl(whatsappNumber, defaultGreeting);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Tooltip Popup */}
      {isTooltipOpen && (
        <div className="mb-3 p-3 bg-white text-tea-dark rounded-2xl shadow-hover border border-tea-border max-w-xs text-xs animate-fade-in relative">
          <button
            onClick={() => setIsTooltipOpen(false)}
            className="absolute top-1.5 right-1.5 p-1 text-tea-muted hover:text-tea-dark"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <p className="font-semibold text-tea-forest mb-1">Chat with LEENA CEYLON</p>
          <p className="text-tea-muted">Have a question or want to order directly? Chat with our team on WhatsApp.</p>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsTooltipOpen(true)}
        className="group flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-card hover:shadow-hover hover:scale-105 active:scale-95 transition-all duration-200"
        aria-label="Order or Chat on WhatsApp"
      >
        <MessageSquare className="w-6 h-6 fill-current text-white" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs font-medium text-sm transition-all duration-300 ease-in-out pr-1">
          Chat on WhatsApp
        </span>
      </a>
    </div>
  );
}
