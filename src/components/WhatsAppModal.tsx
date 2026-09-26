"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { compileSingleProductWhatsAppMessage, getWhatsAppUrl } from "@/lib/whatsapp";
import { MessageSquare, X, CheckCircle2, Building, Copy, Check } from "lucide-react";

export default function WhatsAppModal({
  whatsappNumber = "071 777 4717",
  whatsappTemplate,
}: {
  whatsappNumber?: string;
  whatsappTemplate?: string;
}) {
  const { whatsAppModal, closeWhatsAppModal } = useCart();
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeWhatsAppModal();
      }
    };
    if (whatsAppModal.isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [whatsAppModal.isOpen, closeWhatsAppModal]);

  if (!whatsAppModal.isOpen || !whatsAppModal.details) return null;

  const { details } = whatsAppModal;
  const [payWithBankTransfer, setPayWithBankTransfer] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const handleCopyAccount = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText("100024897120");
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleContinue = () => {
    let message = compileSingleProductWhatsAppMessage(
      whatsappTemplate || "",
      details,
      customerName
    );

    if (payWithBankTransfer) {
      message += `\n\nPayment Preference: *Direct Bank Transfer*\n\n--- *LEENA CEYLON BANK DETAILS* ---\nBank: Commercial Bank of Ceylon PLC\nAccount Name: LEENA CEYLON (PVT) LTD\nAccount No: 1000 2489 7120\nBranch: Kekirawa Branch (Swift: CCEYLKLX)\n\nI will transfer Rs. ${details.total.toLocaleString("en-US")} to this account and send my deposit slip screenshot here.`;
    }

    const url = getWhatsAppUrl(whatsappNumber, message);
    window.open(url, "_blank", "noopener,noreferrer");
    closeWhatsAppModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tea-dark/60 backdrop-blur-sm animate-fade-in"
      onClick={closeWhatsAppModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-modal-title"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-hover border border-tea-border overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-tea-dark px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 id="whatsapp-modal-title" className="font-serif font-semibold text-lg text-white">
                Order via WhatsApp
              </h3>
              <p className="text-xs text-emerald-300">Quick direct ordering from Sri Lanka</p>
            </div>
          </div>
          <button
            onClick={closeWhatsAppModal}
            className="p-1.5 text-tea-soft hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-tea-bg rounded-xl p-4 border border-tea-border/60 space-y-3">
            <div className="flex justify-between items-start text-sm">
              <span className="text-tea-muted font-medium">Product</span>
              <span className="text-tea-dark font-semibold text-right max-w-[65%]">
                {details.productName}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-tea-border/40 pt-2">
              <span className="text-tea-muted font-medium">Size</span>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-tea-leaf/10 text-tea-forest font-semibold text-xs">
                {details.size}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-tea-border/40 pt-2">
              <span className="text-tea-muted font-medium">Quantity</span>
              <span className="text-tea-dark font-medium">{details.quantity}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-tea-border/40 pt-2">
              <span className="text-tea-muted font-medium">Price</span>
              <span className="text-tea-dark font-medium">
                Rs. {details.price.toLocaleString("en-US")} each
              </span>
            </div>
            <div className="flex justify-between items-center text-base font-bold border-t-2 border-tea-forest/20 pt-3 text-tea-dark">
              <span>Product Total</span>
              <span className="text-tea-forest text-lg">
                Rs. {details.total.toLocaleString("en-US")}
              </span>
            </div>
          </div>

          {/* Optional customer name */}
          <div>
            <label className="block text-xs font-medium text-tea-muted mb-1.5">
              Your Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Priyantha"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-tea-border focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf transition"
            />
          </div>

          {/* Optional Bank Transfer preference */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-tea-dark select-none">
              <input
                type="checkbox"
                checked={payWithBankTransfer}
                onChange={(e) => setPayWithBankTransfer(e.target.checked)}
                className="rounded border-amber-300 text-tea-forest focus:ring-tea-leaf w-4 h-4"
              />
              <span>Pay via Bank Transfer (Include Account Details in WhatsApp)</span>
            </label>

            {payWithBankTransfer && (
              <div className="bg-white p-2.5 rounded-lg border border-amber-200/60 text-[11px] space-y-1 text-tea-dark mt-1">
                <div className="flex justify-between items-center pb-1 border-b border-tea-border/60">
                  <span className="font-bold text-tea-forest">Commercial Bank of Ceylon</span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="flex items-center gap-1 text-[10px] text-tea-leaf hover:text-tea-dark font-medium px-2 py-0.5 rounded bg-tea-surface border border-tea-border"
                  >
                    {copiedAccount ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy No</span>
                      </>
                    )}
                  </button>
                </div>
                <p>Acc Name: LEENA CEYLON (PVT) LTD</p>
                <p className="font-mono font-bold text-xs text-tea-forest">Acc No: 1000 2489 7120</p>
                <p>Branch: Kekirawa Branch (Swift: CCEYLKLX)</p>
              </div>
            )}
          </div>

          <div className="text-xs text-tea-muted bg-emerald-50/70 border border-emerald-200/60 p-2.5 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Opens WhatsApp directly with your order and account details pre-filled.</span>
          </div>

          {/* Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleContinue}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition shadow-sm hover:shadow active:scale-[0.99]"
            >
              <MessageSquare className="w-4 h-4" />
              CONTINUE TO WHATSAPP
            </button>
            <button
              onClick={closeWhatsAppModal}
              className="w-full py-2.5 px-4 rounded-xl border border-tea-border text-tea-muted hover:text-tea-dark hover:bg-tea-bg text-sm font-medium transition"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
