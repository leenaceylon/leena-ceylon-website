"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  CheckCircle2,
  Store,
  Smartphone,
  UserCheck,
  Edit3,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  ExternalLink,
  Save,
  X,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  FileText,
  Eye,
  Calendar,
  ShoppingBag,
  ArrowRight,
  User,
  Clock,
  CreditCard,
} from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp";

interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  createdAt: string;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  salesRepName?: string | null;
  itemsCount: number;
  itemsSummary?: string;
}

interface CustomerRecord {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  channel: "SHOP" | "ONLINE" | "REGISTERED";
  orderCount: number;
  totalSpent: number;
  firstOrderDate: string;
  lastOrderDate: string;
  isActive: boolean;
  notes: string;
  salesRepName?: string | null;
  allOrderIds: string[];
  allOrderNumbers: string[];
  ordersList?: CustomerOrderSummary[];
}

interface StatsSummary {
  totalCustomers: number;
  totalShops: number;
  totalOnline: number;
  totalRegistered: number;
  totalSpentAll: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<"ALL" | "SHOP" | "ONLINE" | "REGISTERED">("ALL");
  const [notice, setNotice] = useState<string | null>(null);

  // View Customer Profile Modal
  const [viewingCustomer, setViewingCustomer] = useState<CustomerRecord | null>(null);

  // Edit Modal State
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    shippingAddress: "",
    city: "",
    district: "",
    postalCode: "",
    notes: "",
    updateOldOrders: true,
  });
  const [saving, setSaving] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
      if (data.stats) setStats(data.stats);
    } catch (e) {
      console.error("Failed to load customers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleToggleStatus = async (c: CustomerRecord) => {
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_STATUS",
          id: c.id,
          isActive: !c.isActive,
        }),
      });
      if (res.ok) {
        setNotice(`Customer account ${!c.isActive ? "enabled" : "suspended"}.`);
        setTimeout(() => setNotice(null), 3500);
        loadCustomers();
      }
    } catch (e) {
      console.error("Failed to toggle status:", e);
    }
  };

  const openEditModal = (c: CustomerRecord) => {
    setEditingCustomer(c);
    setEditForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      shippingAddress: c.address || "",
      city: c.city || "",
      district: c.district || "",
      postalCode: c.postalCode || "",
      notes: c.notes || "",
      updateOldOrders: true,
    });
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!editForm.name.trim()) {
      alert("Customer / Store Name is required.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_CUSTOMER_DETAILS",
          customerId: editingCustomer.id,
          userId: editingCustomer.userId,
          oldName: editingCustomer.name,
          oldPhone: editingCustomer.phone,
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email.trim(),
          shippingAddress: editForm.shippingAddress.trim(),
          city: editForm.city.trim(),
          district: editForm.district.trim(),
          postalCode: editForm.postalCode.trim(),
          notes: editForm.notes.trim(),
          updateOldOrders: editForm.updateOldOrders,
          allOrderIds: editingCustomer.allOrderIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotice(data.message || "Customer details updated successfully!");
        setTimeout(() => setNotice(null), 5000);
        setEditingCustomer(null);
        if (viewingCustomer && viewingCustomer.id === editingCustomer.id) {
          setViewingCustomer({
            ...viewingCustomer,
            name: editForm.name.trim(),
            phone: editForm.phone.trim(),
            email: editForm.email.trim(),
            address: editForm.shippingAddress.trim(),
            city: editForm.city.trim(),
            district: editForm.district.trim(),
            postalCode: editForm.postalCode.trim(),
            notes: editForm.notes.trim(),
          });
        }
        loadCustomers();
      } else {
        alert(data.error || "Failed to update customer details.");
      }
    } catch (err) {
      console.error("Error updating customer:", err);
      alert("Network error occurred while saving customer details.");
    } finally {
      setSaving(false);
    }
  };

  // Filtered List
  const filtered = customers.filter((c) => {
    const matchesChannel = channelFilter === "ALL" || c.channel === channelFilter;
    const term = search.toLowerCase().trim();
    if (!term) return matchesChannel;

    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      (c.district && c.district.toLowerCase().includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term)) ||
      (c.notes && c.notes.toLowerCase().includes(term)) ||
      (c.salesRepName && c.salesRepName.toLowerCase().includes(term)) ||
      c.allOrderNumbers.some((num) => num.toLowerCase().includes(term));

    return matchesChannel && matchesSearch;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            Customer Directory & Order Sync
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
            Customer & Retail Store Management
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Consolidated profiles for Retail Shops (`SHOP-...`), Online & WhatsApp Clients (`LC-...`), and Registered Web Users.
          </p>
        </div>
        <button
          type="button"
          onClick={loadCustomers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-tea-border bg-white hover:bg-tea-surface text-xs font-semibold text-tea-dark shadow-subtle transition shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-tea-leaf ${loading ? "animate-spin" : ""}`} />
          Refresh Directory
        </button>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{notice}</span>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-tea-border shadow-subtle">
          <div className="flex items-center gap-2 text-tea-muted text-[11px] font-semibold uppercase">
            <Users className="w-3.5 h-3.5 text-tea-leaf" />
            <span>Total Customers</span>
          </div>
          <div className="font-serif text-2xl font-bold text-tea-dark mt-1">
            {stats ? stats.totalCustomers.toLocaleString() : customers.length}
          </div>
          <div className="text-[10px] text-tea-muted mt-0.5">Unique client profiles</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-tea-border shadow-subtle">
          <div className="flex items-center gap-2 text-amber-700 text-[11px] font-semibold uppercase">
            <Store className="w-3.5 h-3.5 text-amber-600" />
            <span>Retail Shops</span>
          </div>
          <div className="font-serif text-2xl font-bold text-amber-900 mt-1">
            {stats ? stats.totalShops.toLocaleString() : customers.filter((c) => c.channel === "SHOP").length}
          </div>
          <div className="text-[10px] text-tea-muted mt-0.5">Sales rep ground stores</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-tea-border shadow-subtle">
          <div className="flex items-center gap-2 text-emerald-700 text-[11px] font-semibold uppercase">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Online & WhatsApp</span>
          </div>
          <div className="font-serif text-2xl font-bold text-emerald-900 mt-1">
            {stats ? stats.totalOnline.toLocaleString() : customers.filter((c) => c.channel === "ONLINE").length}
          </div>
          <div className="text-[10px] text-tea-muted mt-0.5">Direct orders & checkouts</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-tea-border shadow-subtle">
          <div className="flex items-center gap-2 text-purple-700 text-[11px] font-semibold uppercase">
            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Registered Users</span>
          </div>
          <div className="font-serif text-2xl font-bold text-purple-900 mt-1">
            {stats ? stats.totalRegistered.toLocaleString() : customers.filter((c) => c.channel === "REGISTERED").length}
          </div>
          <div className="text-[10px] text-tea-muted mt-0.5">Web account holders</div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-tea-surface to-tea-surface/40 p-4 rounded-2xl border border-tea-border shadow-subtle">
          <div className="flex items-center gap-2 text-tea-forest text-[11px] font-semibold uppercase">
            <span>Total Revenue</span>
          </div>
          <div className="font-serif text-2xl font-bold text-tea-forest mt-1">
            Rs. {stats ? stats.totalSpentAll.toLocaleString() : customers.reduce((s, c) => s + c.totalSpent, 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-tea-muted mt-0.5">Lifetime platform sales</div>
        </div>
      </div>

      {/* Channel Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-tea-border shadow-subtle space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-tea-border/60 pb-3">
          {/* Channel Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setChannelFilter("ALL")}
              className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition ${
                channelFilter === "ALL"
                  ? "bg-tea-dark text-white shadow-sm"
                  : "bg-tea-surface text-tea-dark hover:bg-tea-border/40"
              }`}
            >
              All Clients ({customers.length})
            </button>

            <button
              type="button"
              onClick={() => setChannelFilter("SHOP")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition ${
                channelFilter === "SHOP"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Retail Shops ({stats ? stats.totalShops : customers.filter((c) => c.channel === "SHOP").length})
            </button>

            <button
              type="button"
              onClick={() => setChannelFilter("ONLINE")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition ${
                channelFilter === "ONLINE"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Online & WhatsApp ({stats ? stats.totalOnline : customers.filter((c) => c.channel === "ONLINE").length})
            </button>

            <button
              type="button"
              onClick={() => setChannelFilter("REGISTERED")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition ${
                channelFilter === "REGISTERED"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-purple-50 text-purple-800 hover:bg-purple-100"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Registered ({stats ? stats.totalRegistered : customers.filter((c) => c.channel === "REGISTERED").length})
            </button>
          </div>

          <div className="text-xs text-tea-muted font-medium">
            Showing <strong className="text-tea-dark">{filtered.length}</strong> unique customer profile{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by customer name, store name, phone, town / city, district, rep name, address, or order #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
          />
          <Search className="w-4 h-4 text-tea-muted absolute left-3 top-3" />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-3 text-tea-muted hover:text-tea-dark text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-tea-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-tea-muted flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 text-tea-leaf animate-spin" />
            <span>Loading unique customer directory and order history...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-xs text-tea-muted">
            No customer records found matching your filters.
          </div>
        ) : (
          <>
            {/* Mobile Customer Cards View (Optimized for field phones) */}
            <div className="block md:hidden divide-y divide-tea-border/60">
              {filtered.map((c) => (
                <div key={c.id} className="p-4 space-y-3 bg-white hover:bg-tea-surface/30 transition">
                  {/* Top Line: Name & Channel */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-tea-dark text-sm leading-snug">
                        {c.name}
                      </h4>
                      {c.salesRepName && (
                        <div className="mt-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-950 border border-amber-200 inline-flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-emerald-700" />
                            <span>Sales Rep: <strong>{c.salesRepName}</strong></span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {c.channel === "SHOP" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          🏬 Retail Shop
                        </span>
                      )}
                      {c.channel === "ONLINE" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          📱 Online / WhatsApp
                        </span>
                      )}
                      {c.channel === "REGISTERED" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                          👤 Registered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Phone & Instant WhatsApp / Call Bar */}
                  {c.phone && (
                    <div className="bg-tea-surface/50 rounded-xl p-2.5 border border-tea-border/50 flex items-center justify-between gap-2">
                      <div className="font-mono text-xs font-bold text-tea-dark">
                        {c.phone}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={getWhatsAppUrl(c.phone, `Hello ${c.name}, greetings from Leena Ceylon!`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-xs active:bg-emerald-700 transition"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 fill-current" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${c.phone}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-tea-border text-tea-dark text-[11px] font-bold shadow-xs active:bg-tea-bg transition"
                          title="Call Phone"
                        >
                          <Phone className="w-3 h-3 text-tea-muted" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Location & Address */}
                  {(c.city || c.district || c.address) && (
                    <div className="text-xs space-y-0.5">
                      {(c.city || c.district) && (
                        <div className="font-semibold text-tea-dark flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-tea-leaf shrink-0" />
                          <span>
                            {c.city}
                            {c.city && c.district ? `, ${c.district}` : c.district}
                          </span>
                        </div>
                      )}
                      {c.address && (
                        <div className="text-[11px] text-tea-muted pl-4">
                          {c.address}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Value & Orders Count */}
                  <div className="flex items-baseline justify-between pt-1 border-t border-tea-border/40 text-xs">
                    <div>
                      <span className="text-[11px] text-tea-muted font-medium block">
                        Lifetime Purchases:
                      </span>
                      <span className="font-bold text-tea-dark text-xs">
                        {c.orderCount} order{c.orderCount === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-serif font-bold text-base text-tea-forest block">
                        Rs. {c.totalSpent.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-tea-muted">
                        Last: {new Date(c.lastOrderDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-2 pt-2 border-t border-tea-border/60">
                    <button
                      type="button"
                      onClick={() => setViewingCustomer(c)}
                      className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-white hover:bg-tea-surface text-tea-dark border border-tea-border font-bold text-xs shadow-xs transition"
                    >
                      <Eye className="w-4 h-4 text-tea-leaf" />
                      <span>View Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(c)}
                      className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-tea-surface hover:bg-tea-bg text-tea-forest border border-tea-border font-bold text-xs shadow-xs transition"
                    >
                      <Edit3 className="w-4 h-4 text-tea-leaf" />
                      <span>Edit Details</span>
                    </button>

                    {c.channel === "REGISTERED" && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c)}
                        className={`h-11 px-3 rounded-xl text-xs font-bold border transition shrink-0 ${
                          c.isActive
                            ? "border-rose-200 text-rose-700 bg-rose-50"
                            : "border-emerald-200 text-emerald-700 bg-emerald-50"
                        }`}
                      >
                        {c.isActive ? "Suspend" : "Activate"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-tea-surface border-b border-tea-border text-tea-muted font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Customer / Shop Name</th>
                    <th className="py-3.5 px-4">Contact / WhatsApp</th>
                    <th className="py-3.5 px-4">Location / Route</th>
                    <th className="py-3.5 px-4">Total Orders & Value</th>
                    <th className="py-3.5 px-4">Last Activity</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tea-border/60">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-tea-surface/40 transition">
                      {/* Name & Channel Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-tea-dark text-[13px]">{c.name}</span>
                          {c.channel === "SHOP" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              🏬 Retail Shop
                            </span>
                          )}
                          {c.channel === "ONLINE" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              📱 Online / WhatsApp
                            </span>
                          )}
                          {c.channel === "REGISTERED" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                              👤 Registered
                            </span>
                          )}
                        </div>

                        {/* Sales Rep Attribution */}
                        {c.salesRepName && (
                          <div className="mt-1">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 inline-flex items-center gap-1">
                              <span>Sales Rep:</span>
                              <span className="font-extrabold">{c.salesRepName}</span>
                            </span>
                          </div>
                        )}

                        {c.email && (
                          <div className="text-[11px] text-tea-muted flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span>{c.email}</span>
                          </div>
                        )}
                        {c.notes && (
                          <div className="text-[10px] text-tea-muted italic mt-0.5 max-w-xs truncate" title={c.notes}>
                            "{c.notes}"
                          </div>
                        )}
                      </td>

                      {/* Phone & WhatsApp Quick Connect */}
                      <td className="py-3.5 px-4">
                        {c.phone ? (
                          <div className="space-y-1">
                            <div className="font-mono text-[11px] text-tea-dark font-semibold">
                              {c.phone}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <a
                                href={getWhatsAppUrl(c.phone, `Hello ${c.name}, greetings from Leena Ceylon!`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold border border-emerald-200 transition"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare className="w-2.5 h-2.5 fill-current" />
                                WhatsApp
                              </a>
                              <a
                                href={`tel:${c.phone}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-tea-surface hover:bg-tea-border/40 text-tea-dark text-[10px] font-semibold border border-tea-border transition"
                                title="Call Phone"
                              >
                                <Phone className="w-2.5 h-2.5" />
                                Call
                              </a>
                            </div>
                          </div>
                        ) : (
                          <span className="text-tea-muted italic text-[11px]">No telephone</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        {c.city || c.district || c.address ? (
                          <div className="text-[11px] space-y-0.5">
                            {(c.city || c.district) && (
                              <div className="font-semibold text-tea-dark flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-tea-leaf shrink-0" />
                                <span>
                                  {c.city}
                                  {c.city && c.district ? `, ${c.district}` : c.district}
                                </span>
                              </div>
                            )}
                            {c.address && (
                              <div className="text-tea-muted truncate max-w-[220px]" title={c.address}>
                                {c.address}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-tea-muted text-[11px]">—</span>
                        )}
                      </td>

                      {/* Orders & Lifetime Value */}
                      <td className="py-3.5 px-4">
                        <div className="font-serif font-bold text-sm text-tea-forest">
                          Rs. {c.totalSpent.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-bold text-tea-dark">
                            {c.orderCount} order{c.orderCount === 1 ? "" : "s"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setViewingCustomer(c)}
                            className="inline-flex items-center gap-0.5 text-[10px] text-tea-leaf hover:text-tea-dark font-bold underline"
                            title="View complete order history for this customer"
                          >
                            <Eye className="w-3 h-3" />
                            View History
                          </button>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-tea-muted text-[11px]">
                        <div>{new Date(c.lastOrderDate).toLocaleDateString()}</div>
                        <div className="text-[10px]">First: {new Date(c.firstOrderDate).toLocaleDateString()}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingCustomer(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-tea-surface text-tea-dark border border-tea-border transition shadow-xs"
                            title="View Full Profile and Order History"
                          >
                            <Eye className="w-3.5 h-3.5 text-tea-leaf" />
                            <span>View Profile</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-tea-surface hover:bg-tea-bg text-tea-forest border border-tea-border transition shadow-xs"
                            title="Edit Customer Details and Sync Orders"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-tea-leaf" />
                            <span>Edit Details</span>
                          </button>

                          {c.channel === "REGISTERED" && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(c)}
                              className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold border transition shadow-xs ${
                                c.isActive
                                  ? "border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                                  : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                              }`}
                            >
                              {c.isActive ? "Suspend" : "Activate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 1. VIEW CUSTOMER PROFILE & ORDER HISTORY MODAL */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-tea-dark/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-8 border border-tea-border shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto animate-scale-up">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-tea-border/60 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-serif text-xl font-bold text-tea-dark">
                    {viewingCustomer.name}
                  </h3>
                  {viewingCustomer.channel === "SHOP" && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      🏬 Retail Shop
                    </span>
                  )}
                  {viewingCustomer.channel === "ONLINE" && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      📱 Online / WhatsApp
                    </span>
                  )}
                  {viewingCustomer.channel === "REGISTERED" && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
                      👤 Registered Account
                    </span>
                  )}
                </div>
                <p className="text-xs text-tea-muted mt-1">
                  Customer Profile Summary & All Order History ({viewingCustomer.orderCount} total orders)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingCustomer(null)}
                className="p-1.5 rounded-xl border border-tea-border text-tea-muted hover:bg-tea-surface transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Contact Card */}
              <div className="p-4 rounded-2xl bg-tea-surface/60 border border-tea-border/80 space-y-2">
                <span className="font-bold text-tea-dark uppercase tracking-wider block text-[11px] text-tea-forest">
                  Contact Information
                </span>
                <div className="space-y-1 text-tea-dark">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-tea-leaf" />
                    <span className="font-mono font-bold">{viewingCustomer.phone || "No phone"}</span>
                  </div>
                  {viewingCustomer.phone && (
                    <a
                      href={getWhatsAppUrl(viewingCustomer.phone, `Hello ${viewingCustomer.name}, greetings from Leena Ceylon!`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] border border-emerald-300 transition mt-1"
                    >
                      <MessageSquare className="w-3 h-3 fill-current" />
                      Chat on WhatsApp
                    </a>
                  )}
                  {viewingCustomer.email && (
                    <div className="flex items-center gap-2 pt-1 text-tea-muted">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{viewingCustomer.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Card */}
              <div className="p-4 rounded-2xl bg-tea-surface/60 border border-tea-border/80 space-y-2">
                <span className="font-bold text-tea-dark uppercase tracking-wider block text-[11px] text-tea-forest">
                  Location & Route
                </span>
                <div className="space-y-1 text-tea-dark">
                  <div className="flex items-center gap-1.5 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-tea-leaf shrink-0" />
                    <span>{viewingCustomer.city || "Direct Route"}</span>
                    {viewingCustomer.district && <span className="font-normal text-tea-muted">, {viewingCustomer.district}</span>}
                  </div>
                  <p className="text-tea-muted text-[11px] leading-relaxed">
                    {viewingCustomer.address || "Direct store address not specified"}
                  </p>
                  {viewingCustomer.salesRepName && (
                    <div className="pt-1.5 border-t border-tea-border/50 text-[11px]">
                      <span className="text-tea-muted">Assigned Rep:</span>{" "}
                      <strong className="text-amber-900">{viewingCustomer.salesRepName}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial KPI Card */}
              <div className="p-4 rounded-2xl bg-tea-surface/60 border border-tea-border/80 space-y-2">
                <span className="font-bold text-tea-dark uppercase tracking-wider block text-[11px] text-tea-forest">
                  Customer Value
                </span>
                <div className="space-y-1">
                  <div className="text-xl font-serif font-bold text-tea-forest">
                    Rs. {viewingCustomer.totalSpent.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-tea-muted">
                    Total: <strong>{viewingCustomer.orderCount} order{viewingCustomer.orderCount === 1 ? "" : "s"}</strong>
                  </div>
                  <div className="text-[10px] text-tea-muted pt-1">
                    First Order: {new Date(viewingCustomer.firstOrderDate).toLocaleDateString()}<br />
                    Latest: {new Date(viewingCustomer.lastOrderDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Rep / Owner Notes if available */}
            {viewingCustomer.notes && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs">
                <span className="font-bold text-amber-950 uppercase tracking-wider block text-[10px] mb-0.5">
                  Customer & Route Notes:
                </span>
                <p className="text-amber-900 italic">"{viewingCustomer.notes}"</p>
              </div>
            )}

            {/* Itemized Order History Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-sm font-bold text-tea-dark">
                  All Orders Placed by {viewingCustomer.name} ({viewingCustomer.ordersList?.length || viewingCustomer.orderCount})
                </h4>
                <span className="text-[11px] text-tea-muted">
                  Ground shop bills & online orders
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-tea-border overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-tea-surface border-b border-tea-border text-tea-muted sticky top-0 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Order Number</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Channel / Rep</th>
                        <th className="py-2.5 px-3">Total Amount</th>
                        <th className="py-2.5 px-3">Payment</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-tea-border/60">
                      {(viewingCustomer.ordersList && viewingCustomer.ordersList.length > 0
                        ? viewingCustomer.ordersList
                        : viewingCustomer.allOrderNumbers.map((num, i) => ({
                            id: viewingCustomer.allOrderIds[i] || num,
                            orderNumber: num,
                            createdAt: viewingCustomer.lastOrderDate,
                            grandTotal: 0,
                            paymentMethod: "CASH_ON_DELIVERY",
                            paymentStatus: "PAID",
                            orderStatus: viewingCustomer.channel === "SHOP" ? "DELIVERED" : "CONFIRMED",
                            salesRepName: viewingCustomer.salesRepName,
                            itemsCount: 1,
                            itemsSummary: "Ceylon Tea Order",
                          }))
                      ).map((ord) => (
                        <tr key={ord.id} className="hover:bg-tea-surface/40 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-tea-dark">
                            #{ord.orderNumber}
                          </td>
                          <td className="py-2.5 px-3 text-tea-muted text-[11px]">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3">
                            {ord.orderNumber.startsWith("SHOP-") ? (
                              <div className="space-y-0.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  🏬 Rep Bill
                                </span>
                                {ord.salesRepName && (
                                  <div className="text-[10px] text-tea-dark font-medium">
                                    {ord.salesRepName}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                📱 Online
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-serif font-bold text-tea-forest">
                            {ord.grandTotal > 0 ? `Rs. ${ord.grandTotal.toLocaleString()}` : "—"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ord.paymentStatus === "PAID"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : ord.paymentStatus === "PARTIAL"
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {ord.paymentStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[11px] text-tea-dark">
                            {ord.orderStatus}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              href={`/admin/orders/${ord.id}`}
                              className="inline-flex items-center gap-1 text-[11px] text-tea-leaf font-bold hover:underline"
                            >
                              <span>Details</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-tea-border/60">
              <button
                type="button"
                onClick={() => {
                  const target = viewingCustomer;
                  setViewingCustomer(null);
                  openEditModal(target);
                }}
                className="h-11 inline-flex items-center justify-center gap-1.5 px-4 rounded-xl bg-tea-surface hover:bg-tea-bg text-tea-forest border border-tea-border font-bold text-xs transition"
              >
                <Edit3 className="w-4 h-4 text-tea-leaf" />
                <span>Edit Details & Sync Orders</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingCustomer(null)}
                className="h-11 px-6 rounded-xl bg-tea-dark hover:bg-tea-dark/90 text-white font-bold text-xs transition flex items-center justify-center"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT CUSTOMER DETAILS & SYNCHRONIZE PAST ORDERS MODAL */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-tea-dark/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-7 border border-tea-border shadow-2xl space-y-5 animate-scale-up my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-tea-border/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-tea-dark">
                    Edit Customer Details
                  </h3>
                  {editingCustomer.channel === "SHOP" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      🏬 Retail Shop
                    </span>
                  )}
                  {editingCustomer.channel === "ONLINE" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      📱 Online / WhatsApp
                    </span>
                  )}
                  {editingCustomer.channel === "REGISTERED" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                      👤 Registered User
                    </span>
                  )}
                </div>
                <p className="text-xs text-tea-muted mt-0.5">
                  Update customer address, phone, and store information.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="p-1.5 rounded-xl border border-tea-border text-tea-muted hover:bg-tea-surface transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                    Customer / Retail Shop Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="e.g. Perera Stores / Kamal Gunaratne"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 font-semibold text-tea-dark"
                  />
                </div>

                {/* Telephone */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                    Telephone / WhatsApp No
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="e.g. 0771234567"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 font-mono text-tea-dark"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="e.g. perera@gmail.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 text-tea-dark"
                  />
                </div>

                {/* Shipping Address */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                    Store Address / Delivery Destination
                  </label>
                  <input
                    type="text"
                    value={editForm.shippingAddress}
                    onChange={(e) => setEditForm({ ...editForm, shippingAddress: e.target.value })}
                    placeholder="e.g. 142/A Main Street, Town Center"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 text-tea-dark"
                  />
                </div>

                {/* City / Route Town */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                    City / Route Town
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    placeholder="e.g. Kandy / Colombo 03 / Negombo"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 text-tea-dark font-medium"
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    placeholder="e.g. Kandy / Colombo / Gampaha"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 text-tea-dark"
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={editForm.postalCode}
                    onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                    placeholder="e.g. 20000"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 font-mono text-tea-dark"
                  />
                </div>

                {/* Owner Notes / Delivery Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-tea-dark mb-1">
                    Owner Notes / Sales Rep Delivery Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="e.g. Rep: Kamal's route. Owner Mr. Sunil arrives after 10am. Credit limit Rs. 50,000."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/40 text-tea-dark"
                  />
                </div>
              </div>

              {/* Crucial Core Option: Synchronize Old Orders */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.updateOldOrders}
                    onChange={(e) => setEditForm({ ...editForm, updateOldOrders: e.target.checked })}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-amber-900 block">
                      Synchronize & update all past / old orders for this customer
                    </span>
                    <span className="text-[11px] text-amber-800 leading-relaxed block mt-0.5">
                      Automatically updates customer name, telephone, and shipping location across all previous orders ({editingCustomer.orderCount} orders on record, including sales rep shop billing <code>SHOP-...</code> & online checkouts <code>LC-...</code>).
                    </span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-tea-border/60">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-tea-border hover:bg-tea-surface text-xs font-semibold text-tea-dark transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-tea-dark hover:bg-tea-dark/90 text-white text-xs font-semibold uppercase tracking-wider shadow-sm transition disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
                  {saving ? "Updating & Syncing Orders..." : "Save Customer Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
