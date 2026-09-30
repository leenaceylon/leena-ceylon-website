"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Truck,
  CreditCard,
  Building,
  Globe,
  CheckCircle2,
  AlertCircle,
  Save,
  Landmark,
  Eye,
  Copy,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: string, val: any) => {
    setSettings((prev: any) => {
      const updated = { ...prev, [field]: val };
      if (
        field === "bankName" ||
        field === "bankAccountName" ||
        field === "bankAccountNumber" ||
        field === "bankBranch" ||
        field === "bankSwiftCode" ||
        field === "bank2Name" ||
        field === "bank2AccountName" ||
        field === "bank2AccountNumber" ||
        field === "bank2Branch"
      ) {
        let bDetails = `Bank: ${updated.bankName || ""}\nAccount Name: ${updated.bankAccountName || ""}\nAccount No: ${updated.bankAccountNumber || ""}\nBranch: ${updated.bankBranch || ""}${updated.bankSwiftCode ? ` (Swift: ${updated.bankSwiftCode})` : ""}`;
        if (updated.bank2Name && updated.bank2AccountNumber) {
          bDetails += `\n\nSecondary Account:\nBank: ${updated.bank2Name}\nAccount Name: ${updated.bank2AccountName || updated.bankAccountName || ""}\nAccount No: ${updated.bank2AccountNumber}\nBranch: ${updated.bank2Branch || ""}`;
        }
        updated.bankDetails = bDetails;
      }
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok) {
        setNotice("Settings saved successfully.");
        setTimeout(() => setNotice(null), 4000);
      } else {
        alert(data.error || "Failed to save settings");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-xs text-tea-muted">Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-tea-border">
        <div>
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            Store Configuration
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
            Website & WhatsApp Settings
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Modify contact details, WhatsApp order templates, delivery fees, and bank information
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          {saving ? "SAVING..." : "SAVE SETTINGS"}
        </button>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* 1. WhatsApp Configuration (Requirement 10 & 12) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-tea-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-tea-border">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-tea-dark">
              WhatsApp Ordering Configuration
            </h3>
            <p className="text-xs text-tea-muted">
              Configure direct WhatsApp ordering number and automated message template
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              WhatsApp Number (Sri Lanka) *
            </label>
            <input
              type="text"
              required
              value={settings.whatsappNumber}
              onChange={(e) => handleChange("whatsappNumber", e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
            <span className="text-[10px] text-tea-muted block mt-1">
              Current number: <strong>071 777 4717</strong>. Automatically converts to international format.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              WhatsApp Button Text
            </label>
            <input
              type="text"
              value={settings.whatsappButtonText}
              onChange={(e) => handleChange("whatsappButtonText", e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-tea-dark">
                Single-Product Message Template *
              </label>
              <span className="text-[11px] text-tea-muted">
                Available variables: <code className="text-tea-forest">{"{{product_name}}"}</code>, <code className="text-tea-forest">{"{{size}}"}</code>, <code className="text-tea-forest">{"{{quantity}}"}</code>, <code className="text-tea-forest">{"{{price}}"}</code>, <code className="text-tea-forest">{"{{total}}"}</code>
              </span>
            </div>
            <textarea
              rows={6}
              value={settings.whatsappTemplate}
              onChange={(e) => handleChange("whatsappTemplate", e.target.value)}
              className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.whatsappEnabled}
                onChange={(e) => handleChange("whatsappEnabled", e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-tea-dark">
                Enable WhatsApp Ordering & Floating WhatsApp Button on Customer Storefront
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. General & Brand */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-tea-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-tea-border">
          <Globe className="w-5 h-5 text-tea-forest" />
          <h3 className="font-serif text-base font-bold text-tea-dark">General & Brand Information</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">Brand Name</label>
            <input
              type="text"
              value={settings.brandName}
              onChange={(e) => handleChange("brandName", e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">Currency Symbol</label>
            <input
              type="text"
              value={settings.currencySymbol}
              onChange={(e) => handleChange("currencySymbol", e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">Main Tagline</label>
            <input
              type="text"
              value={settings.brandTagline}
              onChange={(e) => handleChange("brandTagline", e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">Secondary Tagline</label>
            <input
              type="text"
              value={settings.secondaryTagline}
              onChange={(e) => handleChange("secondaryTagline", e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
            />
          </div>
        </div>
      </div>

      {/* 3. Delivery Rates */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-tea-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-tea-border">
          <Truck className="w-5 h-5 text-tea-forest" />
          <h3 className="font-serif text-base font-bold text-tea-dark">Delivery Charges</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Standard Island-wide Delivery Fee (Rs.)
            </label>
            <input
              type="number"
              value={settings.standardDeliveryFee}
              onChange={(e) => handleChange("standardDeliveryFee", Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Free Delivery Threshold (Rs.)
            </label>
            <input
              type="number"
              value={settings.freeDeliveryThreshold}
              onChange={(e) => handleChange("freeDeliveryThreshold", Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
            />
            <span className="text-[10px] text-tea-muted block mt-1">
              Orders equal to or above this amount automatically receive Free Delivery.
            </span>
          </div>
        </div>
      </div>

      {/* 4. Payment & Bank Account Details */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-tea-border shadow-subtle space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-tea-border">
          <div className="flex items-center gap-2.5">
            <Landmark className="w-5 h-5 text-tea-forest" />
            <div>
              <h3 className="font-serif text-base font-bold text-tea-dark">Payment & Bank Account Settings</h3>
              <p className="text-[11px] text-tea-muted">
                Changes here immediately update bank details displayed on Checkout, WhatsApp Modal, Product Pages, and WhatsApp Order Messages across the entire store.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Real-Time Sync
          </span>
        </div>

        {/* Enabled Payment Gateways */}
        <div className="flex flex-wrap gap-6 p-4 rounded-2xl bg-tea-surface/60 border border-tea-border">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-tea-dark">
            <input
              type="checkbox"
              checked={settings.cashOnDeliveryEnabled}
              onChange={(e) => handleChange("cashOnDeliveryEnabled", e.target.checked)}
              className="w-4 h-4 rounded text-tea-forest"
            />
            <span>Cash on Delivery (COD) Enabled</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-tea-dark">
            <input
              type="checkbox"
              checked={settings.bankTransferEnabled}
              onChange={(e) => handleChange("bankTransferEnabled", e.target.checked)}
              className="w-4 h-4 rounded text-tea-forest"
            />
            <span>Direct Bank Transfer Enabled</span>
          </label>
        </div>

        {/* Primary Bank Account Form */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-tea-leaf" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-tea-dark">
              Primary Corporate Bank Account
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-tea-dark mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Commercial Bank of Ceylon PLC"
                value={settings.bankName || ""}
                onChange={(e) => handleChange("bankName", e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:ring-2 focus:ring-tea-leaf/30 font-medium"
              />
              <span className="text-[10px] text-tea-muted block mt-0.5">
                Official registered bank name
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-tea-dark mb-1">
                Account Holder / Beneficiary Name *
              </label>
              <input
                type="text"
                placeholder="e.g. LEENA CEYLON (PVT) LTD"
                value={settings.bankAccountName || ""}
                onChange={(e) => handleChange("bankAccountName", e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:ring-2 focus:ring-tea-leaf/30 font-medium"
              />
              <span className="text-[10px] text-tea-muted block mt-0.5">
                Exact account name for customer fund transfers
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-tea-dark mb-1">
                Account Number *
              </label>
              <input
                type="text"
                placeholder="e.g. 1000 2489 7120"
                value={settings.bankAccountNumber || ""}
                onChange={(e) => handleChange("bankAccountNumber", e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:ring-2 focus:ring-tea-leaf/30 font-mono font-bold text-tea-forest"
              />
              <span className="text-[10px] text-tea-muted block mt-0.5">
                Customers copy this number to transfer via banking apps
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-tea-dark mb-1">
                Branch Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Kekirawa Branch"
                value={settings.bankBranch || ""}
                onChange={(e) => handleChange("bankBranch", e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:ring-2 focus:ring-tea-leaf/30"
              />
              <span className="text-[10px] text-tea-muted block mt-0.5">
                Bank branch location (e.g. Kekirawa, Colombo, Kandy)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-tea-dark mb-1">
                Swift / Branch Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. CCEYLKLX"
                value={settings.bankSwiftCode || ""}
                onChange={(e) => handleChange("bankSwiftCode", e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:ring-2 focus:ring-tea-leaf/30 font-mono"
              />
              <span className="text-[10px] text-tea-muted block mt-0.5">
                For international or inter-bank online transfers
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-tea-dark mb-1">
                Transfer Instructions for Customers
              </label>
              <input
                type="text"
                placeholder="e.g. Transfer the total amount and share your payment slip on WhatsApp."
                value={settings.bankInstructions || ""}
                onChange={(e) => handleChange("bankInstructions", e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:ring-2 focus:ring-tea-leaf/30"
              />
              <span className="text-[10px] text-tea-muted block mt-0.5">
                Short note guiding the customer on slip submission
              </span>
            </div>
          </div>
        </div>

        {/* Secondary / Alternative Bank Account (Optional) */}
        <div className="pt-3 border-t border-tea-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-tea-muted">
              Secondary Bank Account (Optional)
            </h4>
            <span className="text-[10px] text-tea-muted">Leave blank if using only 1 bank</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-tea-dark mb-1">
                Secondary Bank Name
              </label>
              <input
                type="text"
                placeholder="e.g. Bank of Ceylon / Sampath Bank"
                value={settings.bank2Name || ""}
                onChange={(e) => handleChange("bank2Name", e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-tea-dark mb-1">
                Secondary Account Holder
              </label>
              <input
                type="text"
                placeholder="e.g. LEENA CEYLON (PVT) LTD"
                value={settings.bank2AccountName || ""}
                onChange={(e) => handleChange("bank2AccountName", e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-tea-dark mb-1">
                Secondary Account Number
              </label>
              <input
                type="text"
                placeholder="e.g. 849204810"
                value={settings.bank2AccountNumber || ""}
                onChange={(e) => handleChange("bank2AccountNumber", e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-tea-dark mb-1">
                Secondary Branch Name
              </label>
              <input
                type="text"
                placeholder="e.g. Anuradhapura Branch"
                value={settings.bank2Branch || ""}
                onChange={(e) => handleChange("bank2Branch", e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
              />
            </div>
          </div>
        </div>

        {/* Live Customer Preview */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-amber-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Live Preview: How Customers See Bank Details on Storefront
            </h4>
          </div>

          <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-2 border-amber-200/90 rounded-2xl p-4 sm:p-5 text-xs space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </div>
                <span className="font-bold text-tea-dark text-sm">
                  {settings.bankName || "Commercial Bank of Ceylon PLC"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (settings.bankAccountNumber) {
                    navigator.clipboard.writeText(settings.bankAccountNumber.replace(/\s+/g, ""));
                    setCopiedPreview(true);
                    setTimeout(() => setCopiedPreview(false), 2000);
                  }
                }}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 bg-white border border-amber-300 px-3 py-1 rounded-lg hover:bg-amber-50 transition shadow-xs"
              >
                {copiedPreview ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-800" />
                    <span>Test Copy Account</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
              <div>
                <span className="text-tea-muted block text-[10px] uppercase font-bold tracking-wider">
                  Beneficiary / Account Name
                </span>
                <strong className="text-tea-dark">
                  {settings.bankAccountName || "LEENA CEYLON (PVT) LTD"}
                </strong>
              </div>

              <div>
                <span className="text-tea-muted block text-[10px] uppercase font-bold tracking-wider">
                  Account Number
                </span>
                <strong className="font-mono text-tea-forest font-bold text-sm tracking-wide">
                  {settings.bankAccountNumber || "1000 2489 7120"}
                </strong>
              </div>

              <div>
                <span className="text-tea-muted block text-[10px] uppercase font-bold tracking-wider">
                  Branch
                </span>
                <span className="text-tea-dark font-medium">
                  {settings.bankBranch || "Kekirawa Branch"}
                  {settings.bankSwiftCode ? ` (Swift: ${settings.bankSwiftCode})` : ""}
                </span>
              </div>

              {settings.bankInstructions && (
                <div>
                  <span className="text-tea-muted block text-[10px] uppercase font-bold tracking-wider">
                    Instructions
                  </span>
                  <span className="text-amber-900 text-[11px]">
                    {settings.bankInstructions}
                  </span>
                </div>
              )}
            </div>

            {settings.bank2Name && settings.bank2AccountNumber && (
              <div className="pt-2.5 border-t border-amber-200/70 text-[11px] flex flex-wrap items-center gap-2 text-tea-dark">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                  Alternative Bank:
                </span>
                <strong>{settings.bank2Name}</strong>
                <span>• Acc: <span className="font-mono font-bold">{settings.bank2AccountNumber}</span></span>
                {settings.bank2Branch && <span>• {settings.bank2Branch}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Formatted Text Representation (Auto-synced) */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-tea-dark mb-1">
            Formatted Bank Details String (Auto-Synchronized for WhatsApp & Legacy Readers)
          </label>
          <textarea
            rows={4}
            value={settings.bankDetails || ""}
            onChange={(e) => handleChange("bankDetails", e.target.value)}
            className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-tea-border bg-tea-surface/80"
          />
          <span className="text-[10px] text-tea-muted block mt-1">
            Auto-generated from your bank fields above. You can also customize this plain text directly if needed.
          </span>
        </div>
      </div>

      {/* 5. Contact Information */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-tea-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-tea-border">
          <Building className="w-5 h-5 text-tea-forest" />
          <h3 className="font-serif text-base font-bold text-tea-dark">Company Contact Details</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">Telephone Line</label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">Customer Support Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-tea-dark mb-1">Headquarters Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 pb-12">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-card hover:shadow-hover disabled:opacity-50"
        >
          {saving ? "SAVING..." : "SAVE ALL SETTINGS"}
        </button>
      </div>
    </form>
  );
}
