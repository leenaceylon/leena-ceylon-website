"use client";

import React, { useState } from "react";
import { Building2, CheckCircle2, Phone, MapPin, User, DollarSign, X } from "lucide-react";

interface RegisterShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSalesRepName?: string;
  onShopRegistered: (newShop: any) => void;
  initialValues?: {
    shopName?: string;
    phone?: string;
    routeTown?: string;
  };
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

export default function RegisterShopModal({
  isOpen,
  onClose,
  defaultSalesRepName = "",
  onShopRegistered,
  initialValues,
}: RegisterShopModalProps) {
  const [shopName, setShopName] = useState(initialValues?.shopName || "");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState(initialValues?.phone || "");
  const [routeTown, setRouteTown] = useState(initialValues?.routeTown || "");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("Anuradhapura");
  const [assignedRep, setAssignedRep] = useState(defaultSalesRepName);
  const [openingBalance, setOpeningBalance] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
          action: "register_shop",
          shopName: shopName.trim(),
          ownerName: ownerName.trim(),
          phone: phone.trim(),
          routeTown: routeTown.trim(),
          address: address.trim(),
          district,
          assignedRep: assignedRep.trim() || defaultSalesRepName,
          openingBalance: Number(openingBalance) || 0,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to register shop.");
      }

      onShopRegistered(data.shop);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong while registering the shop.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-tea-dark/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-tea-border shadow-2xl overflow-hidden animate-scale-up space-y-4 my-auto max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-tea-dark text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-tea-gold/20 flex items-center justify-center text-tea-gold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm sm:text-base font-bold text-white">
                Register New Shop & Generate QR
              </h3>
              <p className="text-[11px] text-tea-cream/80">
                Onboard new retail store for instant billing & QR scanning
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="px-5 py-2 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Shop Name */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-tea-dark mb-1">
                Shop / Store Name *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Saman Super Grocery / Kekirawa Retail"
                className="w-full px-3.5 py-2 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 font-medium"
              />
            </div>

            {/* Owner Name */}
            <div>
              <label className="block font-bold text-tea-dark mb-1">
                Owner / Contact Person
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Mr. Bandara"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                />
                <User className="w-4 h-4 text-tea-muted absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block font-bold text-tea-dark mb-1">
                Shop Phone / WhatsApp *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 071 777 4717"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 font-mono"
                />
                <Phone className="w-4 h-4 text-tea-muted absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Route / Town */}
            <div>
              <label className="block font-bold text-tea-dark mb-1">
                Route / Town *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={routeTown}
                  onChange={(e) => setRouteTown(e.target.value)}
                  placeholder="e.g. Kekirawa Town, Dambulla Rd"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
                />
                <MapPin className="w-4 h-4 text-tea-muted absolute left-3 top-2.5" />
              </div>
            </div>

            {/* District */}
            <div>
              <label className="block font-bold text-tea-dark mb-1">
                District
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
              >
                {SRI_LANKAN_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-tea-dark mb-1">
                Shop Physical Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. No. 42, Main Street, Kekirawa"
                className="w-full px-3.5 py-2 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
              />
            </div>

            {/* Assigned Sales Rep */}
            <div>
              <label className="block font-semibold text-tea-dark mb-1">
                Assigned Sales Rep
              </label>
              <input
                type="text"
                value={assignedRep}
                onChange={(e) => setAssignedRep(e.target.value)}
                placeholder="Sales Rep Name"
                className="w-full px-3.5 py-2 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
              />
            </div>

            {/* Opening Balance */}
            <div>
              <label className="block font-semibold text-tea-dark mb-1">
                Opening Balance Due (Old Debt)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0 (If already owes credit)"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-tea-border bg-tea-surface/40 focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 font-mono"
                />
                <DollarSign className="w-4 h-4 text-tea-muted absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-tea-border flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-tea-muted hover:text-tea-dark hover:bg-tea-surface font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-tea-gold" />
              <span>{submitting ? "Registering..." : "Register & View QR"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
