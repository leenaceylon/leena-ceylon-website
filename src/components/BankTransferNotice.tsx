"use client";

import React, { useState } from "react";
import { MessageSquare, Copy, Check, Building, AlertCircle } from "lucide-react";
import { compileBankTransferWhatsAppMessage, getWhatsAppUrl } from "@/lib/whatsapp";

interface BankTransferNoticeProps {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  grandTotal: number;
  paymentStatus: string;
  bankDetails?: string;
  whatsappNumber?: string;
}

export default function BankTransferNotice({
  orderNumber,
  customerName,
  customerPhone,
  shippingAddress,
  grandTotal,
  paymentStatus,
  bankDetails,
  whatsappNumber = "071 777 4717",
}: BankTransferNoticeProps) {
  const [copied, setCopied] = useState(false);

  const defaultBankDetails =
    bankDetails ||
    "Bank: Commercial Bank of Ceylon PLC\nAccount Name: LEENA CEYLON (PVT) LTD\nAccount No: 1000 2489 7120\nBranch: Kekirawa Branch\nSwift: CCEYLKLX";

  // Account number for quick copy
  const accountNumberMatch = defaultBankDetails.match(/Account No:\s*([0-9\s]+)/i);
  const rawAccountNumber = accountNumberMatch
    ? accountNumberMatch[1].replace(/\s+/g, "")
    : "100024897120";

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(rawAccountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappMessage = compileBankTransferWhatsAppMessage({
    orderNumber,
    customerName,
    phone: customerPhone,
    address: shippingAddress,
    total: grandTotal,
    bankDetails: defaultBankDetails,
    brandName: "LEENA CEYLON",
  });

  const whatsappUrl = getWhatsAppUrl(whatsappNumber, whatsappMessage);

  return (
    <div className="bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/40 p-6 rounded-2xl border-2 border-tea-gold/40 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-tea-gold/20 text-tea-dark flex items-center justify-center shrink-0">
            <Building className="w-5 h-5 text-tea-forest" />
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
        Please transfer <strong className="text-tea-dark">Rs. {grandTotal.toLocaleString("en-US")}</strong> to the LEENA CEYLON corporate bank account below, then click the green button to <strong>send your bank payment slip via WhatsApp</strong> for immediate order confirmation.
      </p>

      {/* Bank Account Details Card */}
      <div className="bg-white rounded-xl p-4 border border-tea-border space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-tea-border/60">
          <span className="text-xs font-bold text-tea-forest flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" />
            LEENA CEYLON Corporate Account
          </span>
          <button
            type="button"
            onClick={handleCopyAccount}
            className="flex items-center gap-1 text-[11px] font-semibold text-tea-leaf hover:text-tea-dark transition px-2.5 py-1 rounded-lg hover:bg-tea-leaf/10 border border-tea-border/80"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div>
            <span className="text-tea-muted block text-[11px]">Bank Name:</span>
            <span className="font-semibold text-tea-dark">Commercial Bank of Ceylon PLC</span>
          </div>
          <div>
            <span className="text-tea-muted block text-[11px]">Account Name:</span>
            <span className="font-semibold text-tea-dark">LEENA CEYLON (PVT) LTD</span>
          </div>
          <div>
            <span className="text-tea-muted block text-[11px]">Account Number:</span>
            <span className="font-mono font-bold text-sm text-tea-forest select-all">
              1000 2489 7120
            </span>
          </div>
          <div>
            <span className="text-tea-muted block text-[11px]">Branch / Swift:</span>
            <span className="font-semibold text-tea-dark">Kekirawa Branch (Swift: CCEYLKLX)</span>
          </div>
        </div>
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
