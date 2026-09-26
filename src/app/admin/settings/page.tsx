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
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
    setSettings({ ...settings, [field]: val });
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

      {/* 4. Payment & Bank Transfer Details */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-tea-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-tea-border">
          <CreditCard className="w-5 h-5 text-tea-forest" />
          <h3 className="font-serif text-base font-bold text-tea-dark">Payment Options</h3>
        </div>

        <div className="space-y-4">
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-tea-dark">
              <input
                type="checkbox"
                checked={settings.cashOnDeliveryEnabled}
                onChange={(e) => handleChange("cashOnDeliveryEnabled", e.target.checked)}
                className="w-4 h-4 rounded text-tea-forest"
              />
              Cash on Delivery (COD) Enabled
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-tea-dark">
              <input
                type="checkbox"
                checked={settings.bankTransferEnabled}
                onChange={(e) => handleChange("bankTransferEnabled", e.target.checked)}
                className="w-4 h-4 rounded text-tea-forest"
              />
              Bank Transfer Enabled
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Bank Account Details (Displayed to Customers on Checkout)
            </label>
            <textarea
              rows={4}
              value={settings.bankDetails}
              onChange={(e) => handleChange("bankDetails", e.target.value)}
              className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-tea-border bg-tea-surface"
            />
          </div>
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
