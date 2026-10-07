"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Clock,
  CheckCircle2,
  Navigation,
  Building2,
  ExternalLink,
} from "lucide-react";
import { SiteSettingsMap } from "@/types";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { cleanMapEmbedUrl } from "@/lib/settings";

export default function ContactPageClient({
  settings: initialSettings,
}: {
  settings: SiteSettingsMap;
}) {
  const [settings, setSettings] = useState<SiteSettingsMap>(initialSettings);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Product Inquiry",
    message: "",
  });

  // Client-side refresh on mount in case admin updated settings recently
  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  const phone = settings.phone || "071 777 4717";
  const whatsappNumber = settings.whatsappNumber || "071 777 4717";
  const email = settings.email || "info@leenaceylon.com";
  const cleanPhoneForWa = whatsappNumber.replace(/\D/g, "").replace(/^0/, "94");

  const addressText =
    settings.mapAddress ||
    settings.address ||
    "LEENA CEYLON (PVT) LTD\nA/Bandarapothana, Pubbogama,\nKekirawa, North Central Province,\nSri Lanka.";

  const locationTitle = settings.mapLocationName || "Visit Us in Kekirawa, Sri Lanka";
  const facilityBadge = settings.mapAddressTitle || "Head Office & Pick-Up Center";

  const directionsUrl =
    settings.mapDirectionsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      settings.mapQuery || settings.address || "Pubbogama Kekirawa Sri Lanka"
    )}`;

  const embedMapUrl = cleanMapEmbedUrl(settings.mapEmbedUrl, settings.mapQuery);

  const pickupHours =
    settings.mapPickupHours ||
    "Monday – Saturday: 8:30 AM – 6:00 PM\nSunday: Prior WhatsApp notice recommended";

  const pickupBenefit =
    settings.mapPickupBenefit || "✓ Rs. 0 Delivery Charge (Free Pick-Up)";

  const whatsappDirectUrl = getWhatsAppUrl(
    whatsappNumber,
    `Hello LEENA CEYLON,\n\nI would like to inquire about your Ceylon teas.\n\nName: ${
      formData.name || "[My Name]"
    }\nMessage: ${formData.message || "General Inquiry"}`
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
          Get in Touch
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-tea-dark">
          Contact LEENA CEYLON
        </h1>
        <p className="text-xs sm:text-sm text-tea-muted">
          Whether you have an order question, wholesale export inquiry, or wish to order directly via WhatsApp, our team in Sri Lanka is here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Information Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-tea-surface p-6 sm:p-8 rounded-3xl border border-tea-border space-y-6 shadow-subtle">
            <h3 className="font-serif text-lg font-bold text-tea-dark pb-3 border-b border-tea-border">
              Head Office & Customer Support
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-tea-forest shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-tea-dark">Head Office Location</h5>
                  <p className="text-tea-muted mt-0.5 whitespace-pre-line leading-relaxed">
                    {addressText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-tea-forest shrink-0" />
                <div>
                  <h5 className="font-bold text-tea-dark">Direct Phone Line</h5>
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="text-tea-forest font-semibold hover:underline"
                  >
                    {phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h5 className="font-bold text-tea-dark">Official WhatsApp Support</h5>
                  <a
                    href={`https://wa.me/${cleanPhoneForWa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-semibold hover:underline"
                  >
                    {whatsappNumber.startsWith("+") ? whatsappNumber : `+94 ${whatsappNumber.replace(/^0/, "")}`}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-tea-forest shrink-0" />
                <div>
                  <h5 className="font-bold text-tea-dark">Email Inquiries</h5>
                  <a href={`mailto:${email}`} className="text-tea-forest hover:underline">
                    {email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-tea-forest shrink-0" />
                <div>
                  <h5 className="font-bold text-tea-dark">Support Hours</h5>
                  <p className="text-tea-muted">
                    {pickupHours.split("\n")[0] || "Monday – Saturday: 8:30 AM – 6:00 PM (IST)"}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Chat with Us on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Message Inquiry Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-tea-border shadow-subtle space-y-6">
          <h3 className="font-serif text-lg font-bold text-tea-dark">
            Send an Inquiry
          </h3>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-serif font-bold text-emerald-900 text-base">
                Message Received
              </h4>
              <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                Thank you for contacting LEENA CEYLON. A tea specialist will review your note and respond promptly.
              </p>
              <div className="pt-3">
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Continue on WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-tea-dark mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Kasun Jayawardena"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-tea-dark mb-1">
                    Phone / Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="071 777 4717"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="kasun@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Subject
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                >
                  <option value="Product Inquiry">Product Inquiry</option>
                  <option value="WhatsApp Order Support">WhatsApp Order Support</option>
                  <option value="Wholesale & Bulk Export">Wholesale & Bulk Export</option>
                  <option value="Delivery Tracking">Delivery Tracking</option>
                  <option value="General Feedback">General Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can we assist you with our Ceylon tea selections?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-card hover:shadow-hover"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Interactive Google Map & Office Pick-Up Center Section */}
      <div className="bg-white rounded-3xl border border-tea-border p-6 sm:p-10 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-tea-border">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{facilityBadge}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
              {locationTitle}
            </h2>
            <p className="text-xs sm:text-sm text-tea-muted mt-1 max-w-xl">
              Customers, wholesale partners, and tea enthusiasts are welcome to visit our central facility. Pick up your orders in person with zero delivery fees!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
            >
              <Navigation className="w-4 h-4 text-tea-gold" />
              <span>Get Directions</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/70" />
            </a>

            <a
              href={getWhatsAppUrl(
                whatsappNumber,
                `Hello LEENA CEYLON, I would like to get directions or notify you before picking up my order at ${facilityBadge}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>WhatsApp for Pickup</span>
            </a>
          </div>
        </div>

        {/* Map Frame + Quick Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Responsive Embedded Map */}
          <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-tea-border shadow-inner min-h-[350px] sm:min-h-[420px] relative bg-tea-surface">
            {embedMapUrl ? (
              <iframe
                title="LEENA CEYLON Map Location"
                src={embedMapUrl}
                className="w-full h-full min-h-[350px] sm:min-h-[420px] border-0"
                loading="lazy"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full min-h-[350px] flex flex-col items-center justify-center p-8 text-center text-tea-muted">
                <MapPin className="w-10 h-10 text-tea-leaf mb-2" />
                <p className="font-bold text-tea-dark">Map Location</p>
                <p className="text-xs mt-1">{addressText}</p>
              </div>
            )}
          </div>

          {/* Location Summary Card */}
          <div className="lg:col-span-4 bg-tea-surface p-6 rounded-2xl border border-tea-border flex flex-col justify-between space-y-4 text-xs">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-tea-dark text-sm">Physical Address</h4>
                  <p className="text-tea-muted mt-1 leading-relaxed whitespace-pre-line">
                    {addressText}
                  </p>
                </div>
              </div>

              <div className="border-t border-tea-border/70 pt-3">
                <span className="font-bold text-tea-dark block">Pick-Up Availability:</span>
                <p className="text-tea-muted mt-0.5 whitespace-pre-line">
                  {pickupHours}
                </p>
              </div>

              <div className="border-t border-tea-border/70 pt-3">
                <span className="font-bold text-tea-dark block">Pick-Up Benefit:</span>
                <span className="inline-block mt-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  {pickupBenefit}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-tea-border/70">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-tea-dark hover:bg-tea-forest text-white font-bold tracking-wider uppercase transition text-[11px]"
              >
                <Navigation className="w-3.5 h-3.5 text-tea-gold" />
                Open in Google Maps App
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
