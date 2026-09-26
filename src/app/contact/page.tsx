"use client";

import React, { useState } from "react";
import { Phone, Mail, MapPin, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Product Inquiry",
    message: "",
  });

  const whatsappDirectUrl = getWhatsAppUrl(
    "071 777 4717",
    `Hello LEENA CEYLON,\n\nI would like to inquire about your Ceylon teas.\n\nName: ${formData.name || "[My Name]"}\nMessage: ${formData.message || "General Inquiry"}`
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
              Headquarters & Facilities
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-tea-forest shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-tea-dark">Main Operations & Packaging</h5>
                  <p className="text-tea-muted mt-0.5">
                    LEENA CEYLON (PVT) LTD<br />
                    A/Bandarapothana, Pubbogama,<br />
                    Kekirawa, Sri Lanka.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-tea-forest shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-tea-dark">Highland Estate Office</h5>
                  <p className="text-tea-muted mt-0.5">
                    No. 123, Tea Garden Road,<br />
                    Nuwara Eliya, Sri Lanka.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-tea-forest shrink-0" />
                <div>
                  <h5 className="font-bold text-tea-dark">Direct Phone Line</h5>
                  <a href="tel:0717774717" className="text-tea-forest font-semibold hover:underline">
                    071 777 4717
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h5 className="font-bold text-tea-dark">Official WhatsApp Support</h5>
                  <a
                    href="https://wa.me/94717774717"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-semibold hover:underline"
                  >
                    +94 71 777 4717
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-tea-forest shrink-0" />
                <div>
                  <h5 className="font-bold text-tea-dark">Email Inquiries</h5>
                  <a href="mailto:info@leenaceylon.com" className="text-tea-forest hover:underline">
                    info@leenaceylon.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-tea-forest shrink-0" />
                <div>
                  <h5 className="font-bold text-tea-dark">Support Hours</h5>
                  <p className="text-tea-muted">Monday – Saturday: 8:30 AM – 6:00 PM (IST)</p>
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
                Thank you for contacting LEENA CEYLON. A tea specialist will review your note and respond within 24 hours.
              </p>
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
    </div>
  );
}
