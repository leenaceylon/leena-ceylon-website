"use client";

import React, { useState } from "react";
import { MessageSquare, Copy, Check, Building, Landmark, AlertCircle } from "lucide-react";
import { compileBankTransferWhatsAppMessage, getWhatsAppUrl } from "@/lib/whatsapp";

interface BankTransferNoticeProps {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  grandTotal: number;
  paymentStatus: string;
  bankDetails?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  bankSwiftCode?: string;
  bankInstructions?: string;
  bank2Name?: string;
  bank2AccountName?: string;
  bank2AccountNumber?: string;
  bank2Branch?: string;
  whatsappNumber?: string;
  brandName?: string;
}

export default function BankTransferNotice({
  orderNumber,
  customerName,
  customerPhone,
  shippingAddress,
  grandTotal,
  paymentStatus,
  bankDetails,
  bankName = "Commercial Bank of Ceylon PLC",
  bankAccountName = "LEENA CEYLON (PVT) LTD",
  bankAccountNumber = "1000 2489 7120",
  bankBranch = "Kekirawa Branch",
  bankSwiftCode = "CCEYLKLX",
  bankInstructions = "Please transfer the total amount and share your payment slip screenshot on WhatsApp for fast dispatch.",
  bank2Name,
  bank2AccountName,
  bank2AccountNumber,
  bank2Branch,
  whatsappNumber = "071 777 4717",
  brandName = "LEENA CEYLON",
}: BankTransferNoticeProps) {
  const [copied, setCopied] = useState(false);
  const [copiedAlt, setCopiedAlt] = useState(false);

  // If structured fields aren't provided but bankDetails string is, attempt to parse
  const effectiveBankName = bankName || "Commercial Bank of Ceylon PLC";
  const effectiveAccountName = bankAccountName || "LEENA CEYLON (PVT) LTD";
  const effectiveAccountNumber = bankAccountNumber || "1000 2489 7120";
  const effectiveBranch = bankBranch || "Kekirawa Branch";

  const handleCopyAccount = (acc: string, isAlt = false) => {
    navigator.clipboard.writeText(acc.replace(/\s+/g, ""));
    if (isAlt) {
      setCopiedAlt(true);
      setTimeout(() => setCopiedAlt(false), 2500);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappMessage = compileBankTransferWhatsAppMessage({
    orderNumber,
    customerName,
    phone: customerPhone,
    address: shippingAddress,
    total: grandTotal,
    bankInfo: {
      bankName: effectiveBankName,
      bankAccountName: effectiveAccountName,
      bankAccountNumber: effectiveAccountNumber,
      bankBranch: effectiveBranch,
      bankSwiftCode,
      bankInstructions,
      bank2Name,
      bank2AccountName,
      bank2AccountNumber,
      bank2Branch,
    },
    bankDetails,
    brandName,
  });

  const whatsappUrl = getWhatsAppUrl(whatsappNumber, whatsappMessage);

  return (
    <div className="bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/40 p-6 rounded-2xl border-2 border-tea-gold/40 shadow-sm space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-tea-gold/20 text-tea-dark flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 text-tea-forest" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-tea-leaf">
              Payment Instructions
            </span>
            <h3 className="font-serif text-base sm:text-lg font-bold text-tea-dark">
              Direct Bank Transfer & WhatsApp Slip Verification
            </h3>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
            paymentStatus === "PAID"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-900 border border-amber-300"
          }`}
        >
          {paymentStatus === "PAID" ? "PAYMENT VERIFIED" : "SLIP PENDING"}
        </span>
      </div>

      <p className="text-xs text-tea-muted leading-relaxed">
        Please transfer <strong className="text-tea-dark">Rs. {grandTotal.toLocaleString("en-US")}</strong> to the {brandName} corporate bank account below, then click the green button to <strong>send your bank payment slip via WhatsApp</strong> for immediate order confirmation.
      </p>

      {/* Bank Account Details Card */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-tea-border space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-tea-border/60">
          <span className="text-xs font-bold text-tea-forest flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-tea-leaf" />
            {effectiveBankName}
          </span>
          <button
            type="button"
            onClick={() => handleCopyAccount(effectiveAccountNumber, false)}
            className="flex items-center gap-1 text-[11px] font-semibold text-tea-leaf hover:text-tea-dark transition px-2.5 py-1 rounded-lg hover:bg-tea-leaf/10 border border-tea-border/80 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">Account No Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Account No</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-tea-muted block text-[11px]">Bank Name:</span>
            <span className="font-semibold text-tea-dark">{effectiveBankName}</span>
          </div>
          <div>
            <span className="text-tea-muted block text-[11px]">Account Name:</span>
            <span className="font-semibold text-tea-dark">{effectiveAccountName}</span>
          </div>
          <div>
            <span className="text-tea-muted block text-[11px]">Account Number:</span>
            <span className="font-mono font-bold text-sm text-tea-forest select-all">
              {effectiveAccountNumber}
            </span>
          </div>
          <div>
            <span className="text-tea-muted block text-[11px]">Branch / Swift:</span>
            <span className="font-semibold text-tea-dark">
              {effectiveBranch}
              {bankSwiftCode ? ` (Swift: ${bankSwiftCode})` : ""}
            </span>
          </div>
        </div>

        {/* Secondary Account if present */}
        {bank2Name && bank2AccountNumber && (
          <div className="pt-2.5 border-t border-tea-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-tea-dark">
            <div>
              <span className="text-tea-muted block text-[10px] uppercase font-bold">Alternative Account:</span>
              <span className="font-semibold">{bank2Name}</span> — Acc:{" "}
              <span className="font-mono font-bold text-tea-forest">{bank2AccountNumber}</span>
              {bank2Branch && ` (${bank2Branch})`}
            </div>
            <button
              type="button"
              onClick={() => handleCopyAccount(bank2AccountNumber, true)}
              className="text-[11px] font-semibold text-tea-leaf hover:underline"
            >
              {copiedAlt ? "Alt Copied!" : "Copy Alt Acc"}
            </button>
          </div>
        )}

        {bankInstructions && (
          <p className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200/50">
            💡 {bankInstructions}
          </p>
        )}
      </div>

      {/* Direct WhatsApp Action Button */}
      <div className="space-y-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-md hover:shadow-lg active:scale-[0.99]"
        >
          <MessageSquare className="w-5 h-5 fill-current" />
          <span>Click to Send Bank Slip on WhatsApp ({whatsappNumber})</span>
        </a>

        <p className="text-[11px] text-center text-tea-muted">
          Our team verifies incoming bank slips 7 days a week from 8:00 AM – 9:00 PM for prompt dispatch.
        </p>
      </div>
    </div>
  );
}
