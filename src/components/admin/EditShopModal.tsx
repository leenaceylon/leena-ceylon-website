"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  Building2,
  Phone,
  MapPin,
  User,
  QrCode,
  RefreshCw,
  X,
  CheckCircle2,
  Printer,
  Sparkles,
  AlertCircle,
  FileText,
} from "lucide-react";

interface EditShopModalProps {
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
    assignedRep?: string;
    notes?: string;
    pendingBalance?: number;
  } | null;
  onShopUpdated: (updatedShop: any) => void;
  onOpenQrSticker?: (shop: any) => void;
}

const SRI_LANKAN_DISTRICTS = [
  "Anuradhapura",
  "Polonnaruwa",
  "Matale",
  "Kandy",
  "Kurunegala",
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Galle",
  "Matara",
  "Hambantota",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
  "Trincomalee",
  "Batticaloa",
  "Ampara",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Nuwara Eliya",
  "Puttalam",
];

export default function EditShopModal({
  isOpen,
  onClose,
  shop,
  onShopUpdated,
  onOpenQrSticker,
}: EditShopModalProps) {
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [routeTown, setRouteTown] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("Anuradhapura");
  const [assignedRep, setAssignedRep] = useState("");
  const [notes, setNotes] = useState("");
  const [shopCode, setShopCode] = useState("");
  const [regenerateQr, setRegenerateQr] = useState(false);
  const [updateOldOrders, setUpdateOldOrders] = useState(true);
  const [qrPreviewUrl, setQrPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (shop) {
      setShopName(shop.shopName || "");
      setOwnerName(shop.ownerName || "");
      setPhone(shop.phone || "");
      setRouteTown(shop.routeTown || "");
      setAddress(shop.address || "");
      setDistrict(shop.district || "Anuradhapura");
      setAssignedRep(shop.assignedRep || "");
      setNotes(shop.notes || "");
      setShopCode(shop.shopCode || `LC-SH-${Math.floor(1000 + Math.random() * 9000)}`);
      setRegenerateQr(false);
      setUpdateOldOrders(true);
      setErrorMsg(null);
    }
  }, [shop, isOpen]);

  // Generate live QR preview whenever shopName or shopCode changes
  useEffect(() => {
    if (!isOpen || !shopName.trim()) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://leenaceylon.com";
    const shopUrl = `${origin}/admin/shop-billing?shop=${encodeURIComponent(shopName.trim())}`;
    QRCode.toDataURL(shopUrl, {
      width: 250,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrPreviewUrl(url))
      .catch((err) => console.error("QR preview error:", err));
  }, [shopName, shopCode, isOpen]);

  if (!isOpen || !shop) return null;

  const handleMakeNewQr = () => {
    const newCode = `LC-SH-${Math.floor(1000 + Math.random() * 9000)}`;
    setShopCode(newCode);
    setRegenerateQr(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setErrorMsg("Please enter the Shop / Store Name.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Please enter the Shop Phone / WhatsApp number.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/admin/shop-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_shop",
          oldShopName: shop.shopName,
          shopCode,
          shopName: shopName.trim(),
          ownerName: ownerName.trim(),
          phone: phone.trim(),
          routeTown: routeTown.trim(),
          address: address.trim(),
          district,
          assignedRep: assignedRep.trim(),
          notes: notes.trim(),
          regenerateQr,
          updateOldOrders,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Failed to update shop details.");
        return;
      }

      onShopUpdated(data.shop);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error occurred while updating shop.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-tea-dark/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 border border-tea-border shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto animate-scale-up">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-tea-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-tea-dark">
                  Modify Shop Details & QR
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-tea-surface text-tea-forest font-mono text-[10px] font-bold border border-tea-border">
                  #{shopCode}
                </span>
              </div>
              <p className="text-xs text-tea-muted">
                Update store profile, modify route contact, or generate a fresh counter QR.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-tea-border text-tea-muted hover:bg-tea-surface transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* QR Code Action Strip */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50/70 border border-amber-300/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {qrPreviewUrl ? (
              <img
                src={qrPreviewUrl}
                alt="Shop QR Preview"
                className="w-14 h-14 rounded-xl bg-white p-1 border border-tea-border shadow-xs shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center border border-tea-border shrink-0">
                <QrCode className="w-7 h-7 text-tea-forest" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-tea-dark">Counter QR Code:</span>
                <span className="font-mono font-bold text-emerald-800">#{shopCode}</span>
                {regenerateQr && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9px] font-extrabold uppercase">
                    New QR Pending
                  </span>
                )}
              </div>
              <p className="text-[11px] text-tea-muted mt-0.5">
                Scanned by reps on visits to instantly load this store & credit history.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleMakeNewQr}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-xs flex items-center gap-1.5 transition text-[11px]"
              title="Issue a brand new QR Code ID for this shop"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Make New QR</span>
            </button>

            {onOpenQrSticker && (
              <button
                type="button"
                onClick={() =>
                  onOpenQrSticker({
                    ...shop,
                    shopName,
                    shopCode,
                    phone,
                    routeTown,
                    address,
                    ownerName,
                  })
                }
                className="px-3 py-1.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold shadow-xs flex items-center gap-1.5 transition text-[11px]"
                title="View & Print 80mm Counter Sticker"
              >
                <Printer className="w-3.5 h-3.5 text-tea-gold" />
                <span>Print Sticker</span>
              </button>
            )}
          </div>
        </div>

        {/* Shop Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Shop Name */}
            <div>
              <label className="block font-bold text-tea-dark mb-1">
                Shop / Store Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Sunil Grocery / Perera Super"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 font-semibold"
                />
                <Building2 className="w-4 h-4 text-tea-muted absolute left-3 top-3" />
              </div>
            </div>

            {/* Owner Name */}
            <div>
              <label className="block font-semibold text-tea-dark mb-1">
                Owner / Contact Person
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Mr. Sunil Perera"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                />
                <User className="w-4 h-4 text-tea-muted absolute left-3 top-3" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block font-bold text-tea-dark mb-1">
                Shop WhatsApp / Mobile *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 071 777 4717"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 font-mono font-bold"
                />
                <Phone className="w-4 h-4 text-tea-muted absolute left-3 top-3" />
              </div>
            </div>

            {/* Route / Town */}
            <div>
              <label className="block font-semibold text-tea-dark mb-1">
                Route / Town Area
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={routeTown}
                  onChange={(e) => setRouteTown(e.target.value)}
                  placeholder="e.g. Kekirawa Main St / Dambulla Rd"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                />
                <MapPin className="w-4 h-4 text-tea-muted absolute left-3 top-3" />
              </div>
            </div>

            {/* District */}
            <div>
              <label className="block font-semibold text-tea-dark mb-1">
                District / Region
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 font-semibold"
              >
                {SRI_LANKAN_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Sales Rep */}
            <div>
              <label className="block font-semibold text-tea-dark mb-1">
                Assigned Sales Rep
              </label>
              <input
                type="text"
                value={assignedRep}
                onChange={(e) => setAssignedRep(e.target.value)}
                placeholder="e.g. Ruwan Perera"
                className="w-full px-3 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-tea-dark mb-1">
                Physical Address / Landmark
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. No. 45, Main Bazaar, Opposite Clock Tower, Kekirawa"
                className="w-full px-3 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-tea-dark mb-1">
                Store Notes / Special Credit Terms
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Credit payable in 14 days, Van delivery on Tuesdays"
                className="w-full px-3 py-2.5 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
              />
            </div>
          </div>

          {/* Sync Past Orders Checkbox */}
          <div className="p-3 rounded-xl bg-tea-surface/50 border border-tea-border/60 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="update-old-orders-checkbox"
              checked={updateOldOrders}
              onChange={(e) => setUpdateOldOrders(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label
              htmlFor="update-old-orders-checkbox"
              className="text-[11px] text-tea-dark cursor-pointer select-none leading-relaxed"
            >
              <strong>Synchronize past orders and bills:</strong> Automatically update previous invoices, delivery notes, and ledger records to reflect this new shop name and contact info.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-tea-border/60">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-tea-border hover:bg-tea-surface text-tea-dark font-bold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Updating Shop...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-tea-gold" />
                  <span>Save & Update Shop</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
