"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, FlipHorizontal, Image as ImageIcon, Search, X, AlertCircle, CheckCircle2, Zap } from "lucide-react";

interface ShopQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  knownShops: any[];
  onShopDetected: (shop: any, rawCode?: string) => void;
  onShopNotFound?: (rawCode: string) => void;
}

export default function ShopQrScannerModal({
  isOpen,
  onClose,
  knownShops,
  onShopDetected,
  onShopNotFound,
}: ShopQrScannerModalProps) {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [fileScanLoading, setFileScanLoading] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = "html5-qr-code-scanner-container";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio feedback helper (works offline with Web Audio API)
  const playSuccessBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15); // A6 note

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);

      // Vibrate mobile device if supported
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (e) {
      // Audio not supported or blocked by user gesture
    }
  };

  // Parse scanned raw text to identify matching shop
  const handleDecodedText = (decodedText: string) => {
    if (!decodedText || !decodedText.trim()) return;
    const raw = decodedText.trim();
    playSuccessBeep();

    let extractedShopName = "";
    let extractedPhone = "";
    let extractedCode = "";

    // 1. Check if JSON payload
    if (raw.startsWith("{") && raw.endsWith("}")) {
      try {
        const parsed = JSON.parse(raw);
        extractedShopName = parsed.shopName || parsed.name || "";
        extractedPhone = parsed.phone || parsed.shopPhone || "";
        extractedCode = parsed.shopCode || parsed.code || "";
      } catch (e) {
        // Not valid JSON
      }
    }

    // 2. Check if URL with search parameters (e.g. ?shop=... or ?shopId=...)
    if (!extractedShopName && (raw.startsWith("http://") || raw.startsWith("https://") || raw.includes("?"))) {
      try {
        const url = new URL(raw.startsWith("http") ? raw : `http://localhost/${raw}`);
        extractedShopName = url.searchParams.get("shop") || url.searchParams.get("name") || "";
        extractedCode = url.searchParams.get("code") || url.searchParams.get("id") || "";
        extractedPhone = url.searchParams.get("phone") || "";
      } catch (e) {
        // Not valid URL
      }
    }

    // 3. Check pipe-delimited format (e.g. "LEENA_SHOP|LC-SH-1001|Perera Stores|0717774717")
    if (!extractedShopName && raw.includes("|")) {
      const parts = raw.split("|").map((p) => p.trim());
      parts.forEach((p) => {
        if (p.startsWith("LC-SH-")) extractedCode = p;
        else if (/^07\d{8}$/.test(p) || /^\+94\d{9}$/.test(p)) extractedPhone = p;
        else if (p !== "LEENA_SHOP") extractedShopName = p;
      });
    }

    // 4. Default to raw text as shop name or code
    if (!extractedShopName && !extractedCode) {
      extractedShopName = raw;
    }

    // Search inside known shops
    const matched = knownShops.find((s) => {
      if (extractedCode && s.shopCode && s.shopCode.toLowerCase() === extractedCode.toLowerCase()) {
        return true;
      }
      if (extractedShopName && s.shopName && s.shopName.toLowerCase().trim() === extractedShopName.toLowerCase().trim()) {
        return true;
      }
      if (extractedPhone && s.phone && s.phone.replace(/\D/g, "") === extractedPhone.replace(/\D/g, "")) {
        return true;
      }
      return false;
    });

    if (matched) {
      stopScanner();
      onShopDetected(matched, raw);
    } else {
      stopScanner();
      if (onShopNotFound) {
        onShopNotFound(extractedShopName || extractedCode || raw);
      } else {
        // Fallback: create mock shop profile for billing
        onShopDetected(
          {
            shopName: extractedShopName || raw,
            phone: extractedPhone || "",
            routeTown: "",
            address: "",
            pendingBalance: 0,
            allBills: [],
            isNew: true,
          },
          raw
        );
      }
    }
  };

  const startScanner = async (facing: "environment" | "user") => {
    try {
      setScannerError(null);
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }

      const qrScanner = scannerRef.current;
      if (qrScanner.isScanning) {
        await qrScanner.stop();
      }

      await qrScanner.start(
        { facingMode: facing },
        {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrEdge = Math.floor(minEdge * 0.75);
            return { width: Math.max(qrEdge, 200), height: Math.max(qrEdge, 200) };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {
          // Continuous scanning, ignore frame misses
        }
      );

      setIsScanning(true);

      // Check torch capability
      try {
        const capabilities = qrScanner.getRunningTrackCapabilities();
        if ((capabilities as any)?.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      setIsScanning(false);
      setScannerError(
        err?.message || "Unable to access device camera. Please grant camera permission or upload a QR image."
      );
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      setIsScanning(false);
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner(cameraFacing);
      }, 250);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, cameraFacing]);

  // Handle Torch / Flashlight Toggle
  const toggleTorch = async () => {
    try {
      if (!scannerRef.current || !hasTorch) return;
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn("Torch toggle not supported:", e);
    }
  };

  // Flip Front / Rear Camera
  const flipCamera = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
  };

  // Handle Image File Scan Fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFileScanLoading(true);
      setScannerError(null);

      // Use temporary scanner instance for image decoding
      const tempScanner = new Html5Qrcode("hidden-file-qr-container");
      const result = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      setFileScanLoading(false);

      if (result) {
        handleDecodedText(result);
      }
    } catch (err: any) {
      setFileScanLoading(false);
      setScannerError("No valid Shop QR code found in this photo. Please try a clearer image.");
    }
  };

  // Handle manual shop search submit
  const handleManualSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    handleDecodedText(manualQuery.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-tea-dark/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md border border-tea-border shadow-2xl overflow-hidden animate-scale-up space-y-4 my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-tea-dark text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-tea-gold/20 flex items-center justify-center text-tea-gold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>Scan Shop QR Code</span>
              </h3>
              <p className="text-[11px] text-tea-cream/80">
                Point camera at the shop counter sticker
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

        {/* Camera Viewport Container */}
        <div className="px-4 sm:px-6 space-y-3">
          <div className="relative w-full aspect-square max-h-[300px] mx-auto bg-black rounded-2xl overflow-hidden border-2 border-dashed border-tea-forest/60 flex items-center justify-center">
            {/* Target Reticle Graphic */}
            <div className="absolute inset-4 pointer-events-none z-10 flex flex-col justify-between">
              <div className="flex justify-between">
                <span className="w-6 h-6 border-t-4 border-l-4 border-tea-gold rounded-tl-lg" />
                <span className="w-6 h-6 border-t-4 border-r-4 border-tea-gold rounded-tr-lg" />
              </div>
              {/* Scanning Red Laser Line */}
              <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse" />
              <div className="flex justify-between">
                <span className="w-6 h-6 border-b-4 border-l-4 border-tea-gold rounded-bl-lg" />
                <span className="w-6 h-6 border-b-4 border-r-4 border-tea-gold rounded-br-lg" />
              </div>
            </div>

            {/* Html5Qrcode video render target */}
            <div id={readerElementId} className="w-full h-full object-cover" />

            {/* Hidden reader for file scanning */}
            <div id="hidden-file-qr-container" className="hidden" />

            {/* Scanning indicator */}
            <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-xs text-[11px] font-mono text-tea-cream font-bold">
                {isScanning ? "Scanning Camera Live..." : "Initializing..."}
              </span>
            </div>
          </div>

          {/* Camera Controls: Flip, Torch, Photo Upload */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={flipCamera}
              className="flex-1 py-2 px-3 rounded-xl bg-tea-surface hover:bg-tea-border/50 text-tea-dark text-xs font-semibold flex items-center justify-center gap-1.5 border border-tea-border transition"
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-tea-forest" />
              <span>Flip Camera</span>
            </button>

            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                  torchOn
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-tea-surface text-tea-dark border-tea-border"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-current" />
                <span>{torchOn ? "Flash ON" : "Flash OFF"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={fileScanLoading}
              className="flex-1 py-2 px-3 rounded-xl bg-tea-surface hover:bg-tea-border/50 text-tea-dark text-xs font-semibold flex items-center justify-center gap-1.5 border border-tea-border transition"
            >
              <ImageIcon className="w-3.5 h-3.5 text-tea-forest" />
              <span>{fileScanLoading ? "Scanning..." : "Upload QR Image"}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Scanner Error Alert */}
          {scannerError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">{scannerError}</span>
                <p className="text-[11px] text-rose-700">
                  Tip: Use <strong>Upload QR Image</strong> or type the shop name/phone below.
                </p>
              </div>
            </div>
          )}

          {/* Manual Input Fallback */}
          <div className="pt-2 border-t border-tea-border/60">
            <span className="block text-[11px] font-bold text-tea-muted uppercase tracking-wider mb-1.5">
              Or Search / Type Shop Name or Phone:
            </span>
            <form onSubmit={handleManualSearchSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder="e.g. Perera Stores, 0717774717, LC-SH-..."
                className="flex-1 px-3 py-2 rounded-xl border border-tea-border bg-tea-surface/40 text-xs focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-tea-dark text-white text-xs font-bold flex items-center gap-1 hover:bg-tea-forest transition"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-tea-surface/60 border-t border-tea-border flex items-center justify-between text-xs">
          <span className="text-tea-muted text-[11px]">
            {knownShops.length} Registered Shops Ready
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-tea-dark hover:bg-tea-border/40 font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
