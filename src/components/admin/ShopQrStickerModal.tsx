"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer, QrCode, Store, X, Check, Copy } from "lucide-react";

interface ShopQrStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: {
    shopCode?: string;
    shopName: string;
    ownerName?: string;
    phone: string;
    routeTown?: string;
    address?: string;
    district?: string;
    pendingBalance?: number;
  } | null;
  onStartBilling?: (shop: any) => void;
}

export default function ShopQrStickerModal({
  isOpen,
  onClose,
  shop,
  onStartBilling,
}: ShopQrStickerModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [stickerFormat, setStickerFormat] = useState<"80mm" | "card">("80mm");

  useEffect(() => {
    if (!isOpen || !shop) return;

    // Create the QR code payload
    // Encodes a direct URL so any standard smartphone camera or our in-app scanner detects it immediately
    const origin = typeof window !== "undefined" ? window.location.origin : "https://leenaceylon.com";
    const shopUrl = `${origin}/admin/shop-billing?shop=${encodeURIComponent(shop.shopName)}`;

    // Generate high resolution QR code data URL
    QRCode.toDataURL(shopUrl, {
      width: 450,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("QR generation error:", err);
      });
  }, [isOpen, shop]);

  if (!isOpen || !shop) return null;

  // Print Sticker directly
  const handlePrintSticker = () => {
    const printEl = document.getElementById("printable-shop-qr-sticker");
    if (!printEl) return;

    // Create a temporary hidden iframe for clean sticker printing
    const oldIframe = document.getElementById("shop-qr-print-iframe");
    if (oldIframe && oldIframe.parentNode) {
      oldIframe.parentNode.removeChild(oldIframe);
    }

    const iframe = document.createElement("iframe");
    iframe.id = "shop-qr-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const pri = iframe.contentWindow;
    if (!pri) return;

    const stickerHtml = printEl.outerHTML;
    let stylesHtml = "";
    document.querySelectorAll("style, link[rel='stylesheet']").forEach((node) => {
      stylesHtml += node.outerHTML;
    });

    pri.document.open();
    pri.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Shop_QR_${shop.shopName.replace(/\s+/g, "_")}</title>
          ${stylesHtml}
          <style>
            @page {
              size: 80mm auto;
              margin: 0mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              width: 76mm !important;
              max-width: 76mm !important;
              margin: 0 auto !important;
              padding: 2mm 3mm 4mm 3mm !important;
              font-family: 'Courier New', Courier, monospace, sans-serif !important;
            }
            #printable-shop-qr-sticker {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              display: block !important;
            }
          </style>
        </head>
        <body>
          ${stickerHtml}
        </body>
      </html>
    `);
    pri.document.close();

    setTimeout(() => {
      try {
        pri.focus();
        pri.print();
      } catch (err) {
        console.error("Print error:", err);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 3000);
      }
    }, 200);
  };

  // Download QR code image
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `LEENA_QR_${shop.shopName.replace(/\s+/g, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy shop billing direct link
  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://leenaceylon.com";
    const shopUrl = `${origin}/admin/shop-billing?shop=${encodeURIComponent(shop.shopName)}`;
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-tea-dark/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md border border-tea-border shadow-2xl overflow-hidden animate-scale-up space-y-4 my-auto">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-tea-dark text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-tea-gold/20 flex items-center justify-center text-tea-gold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>Shop QR Counter Sticker</span>
              </h3>
              <p className="text-[11px] text-tea-cream/80 truncate max-w-[240px]">
                {shop.shopName} {shop.shopCode ? `(#${shop.shopCode})` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-4 sm:px-6 space-y-4">
          {/* Format Picker */}
          <div className="flex items-center justify-between gap-2 p-1 bg-tea-surface rounded-xl border border-tea-border text-xs">
            <button
              type="button"
              onClick={() => setStickerFormat("80mm")}
              className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${
                stickerFormat === "80mm"
                  ? "bg-tea-dark text-tea-gold shadow-xs"
                  : "text-tea-muted hover:text-tea-dark"
              }`}
            >
              80mm Thermal Sticker
            </button>
            <button
              type="button"
              onClick={() => setStickerFormat("card")}
              className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${
                stickerFormat === "card"
                  ? "bg-tea-dark text-white shadow-xs"
                  : "text-tea-muted hover:text-tea-dark"
              }`}
            >
              Counter Display Card
            </button>
          </div>

          {/* Printable Sticker Graphic Preview Container */}
          <div className="bg-tea-surface/40 p-3 sm:p-4 rounded-2xl border border-tea-border flex justify-center">
            {/* 1. 80mm Continuous Roll Thermal Receipt Sticker */}
            {stickerFormat === "80mm" ? (
              <div
                id="printable-shop-qr-sticker"
                className="w-full max-w-[280px] bg-white p-4 rounded-xl border border-dashed border-gray-400 font-mono text-black text-center space-y-2 select-text shadow-sm"
              >
                {/* Header */}
                <div className="border-b border-dashed border-black pb-2 space-y-0.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider">
                    LEENA CEYLON (PVT) LTD
                  </h4>
                  <p className="text-[9px] uppercase tracking-wide">
                    Pure Ceylon Tea • The Taste of Ceylon
                  </p>
                  <p className="text-[9px] font-bold">
                    OFFICIAL OUTLET PARTNER
                  </p>
                </div>

                {/* Shop Name & Details */}
                <div className="py-1 space-y-0.5 border-b border-dashed border-black">
                  {shop.shopCode && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-black text-white rounded">
                      CODE: {shop.shopCode}
                    </span>
                  )}
                  <h3 className="font-bold text-sm uppercase pt-1 leading-tight">
                    {shop.shopName}
                  </h3>
                  {shop.routeTown && (
                    <p className="text-[11px] font-semibold">
                      Route: {shop.routeTown}
                    </p>
                  )}
                  {shop.phone && (
                    <p className="text-[10px]">
                      Tel: {shop.phone}
                    </p>
                  )}
                </div>

                {/* QR Code */}
                <div className="py-2 flex justify-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code for ${shop.shopName}`}
                      className="w-40 h-40 mx-auto object-contain"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-gray-100 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                      Generating QR...
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="border-t border-dashed border-black pt-2 space-y-0.5 text-[10px]">
                  <p className="font-bold uppercase tracking-wider">
                    [SCAN FOR SHOP HISTORY & NEW BILL]
                  </p>
                  <p className="text-[9px] opacity-80">
                    Hotline / WhatsApp: +94 71 777 4717
                  </p>
                  <p className="text-[9px]">
                    Sales Rep Order Terminal • Kekirawa
                  </p>
                </div>
              </div>
            ) : (
              /* 2. Full Color Counter Display Card */
              <div
                id="printable-shop-qr-sticker"
                className="w-full max-w-[320px] bg-gradient-to-b from-tea-dark to-tea-forest p-5 rounded-2xl text-white text-center space-y-3 shadow-lg border-2 border-tea-gold/40"
              >
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-tea-gold/20 text-tea-gold text-[10px] font-bold tracking-widest uppercase border border-tea-gold/30">
                    Authorized Retail Partner
                  </span>
                  <h3 className="font-serif text-lg font-bold tracking-wide text-white">
                    {shop.shopName}
                  </h3>
                  <p className="text-xs text-tea-cream/80">
                    {shop.routeTown || "Direct Route"} • {shop.phone}
                  </p>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-inner mx-auto inline-block">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code for ${shop.shopName}`}
                      className="w-44 h-44 object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                      Generating...
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-xs text-tea-cream">
                  <p className="font-semibold text-tea-gold text-[11px] tracking-wide uppercase">
                    Scan with Phone Camera to Take Bill
                  </p>
                  <p className="text-[10px] text-tea-cream/70">
                    LEENA CEYLON (PVT) LTD • Pure Ceylon Tea
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={handlePrintSticker}
              className="py-2.5 px-3 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-4 h-4 text-tea-gold" />
              <span>Print Sticker (80mm)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-tea-surface text-tea-dark font-bold border border-tea-border flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Download className="w-4 h-4 text-tea-forest" />
              <span>Download PNG</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-tea-border/60">
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-[11px] font-semibold text-tea-muted hover:text-tea-dark flex items-center gap-1 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Link Copied!" : "Copy Shop URL"}</span>
            </button>

            {onStartBilling && (
              <button
                type="button"
                onClick={() => {
                  onStartBilling(shop);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-sm"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Create Bill For Shop →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
