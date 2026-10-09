"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  MessageSquare,
  Phone,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
  Filter,
  Inbox,
  User,
  Send,
} from "lucide-react";

interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: "UNREAD" | "READ" | "REPLIED" | "ARCHIVED" | string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/inquiries");
      const data = await res.json();
      if (data.success && data.inquiries) {
        setInquiries(data.inquiries);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error("Failed to load inquiries", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === id ? { ...inq, status: newStatus } : inq))
        );
        if (newStatus !== "UNREAD") {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } else {
          setUnreadCount((prev) => prev + 1);
        }
        showNotice(`Inquiry marked as ${newStatus}.`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update inquiry status");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, customerName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the inquiry from ${customerName}?`)) {
      return;
    }

    try {
      setActionLoading(id);
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setInquiries((prev) => prev.filter((inq) => inq.id !== id));
        showNotice("Inquiry deleted successfully.");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete inquiry");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered and searched inquiries
  const filteredInquiries = inquiries.filter((inq) => {
    if (filter !== "ALL" && inq.status !== filter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = inq.name.toLowerCase().includes(q);
      const matchPhone = inq.phone.toLowerCase().includes(q);
      const matchEmail = (inq.email || "").toLowerCase().includes(q);
      const matchSubject = inq.subject.toLowerCase().includes(q);
      const matchMessage = inq.message.toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail || matchSubject || matchMessage;
    }
    return true;
  });

  const getCleanPhone = (phoneStr: string) => {
    return phoneStr.replace(/\D/g, "").replace(/^0/, "94");
  };

  const getWhatsAppReplyUrl = (inq: Inquiry) => {
    const cleanPhone = getCleanPhone(inq.phone);
    const greeting = encodeURIComponent(
      `Hello ${inq.name},\n\nThank you for contacting LEENA CEYLON regarding "${inq.subject}".\n\n`
    );
    return `https://wa.me/${cleanPhone}?text=${greeting}`;
  };

  const getEmailReplyUrl = (inq: Inquiry) => {
    const subject = encodeURIComponent(`Re: ${inq.subject} - LEENA CEYLON`);
    const body = encodeURIComponent(
      `Hello ${inq.name},\n\nThank you for reaching out to LEENA CEYLON.\n\nRegarding your inquiry:\n"${inq.message}"\n\nBest regards,\nLEENA CEYLON Team\nHotline: 071 777 4717`
    );
    return `mailto:${inq.email}?subject=${subject}&body=${body}`;
  };

  const totalCount = inquiries.length;
  const repliedCount = inquiries.filter((i) => i.status === "REPLIED").length;
  const readCount = inquiries.filter((i) => i.status === "READ").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Notice notification */}
      {notice && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-600 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              Customer Support & Inquiries
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark mt-1">
            Customer Inquiries
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Manage inquiries submitted via the customer Contact page. Reply directly via WhatsApp or Email.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadInquiries}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-tea-border bg-white text-tea-dark hover:bg-tea-surface text-xs font-bold transition shadow-xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-tea-border shadow-xs">
          <div className="flex items-center justify-between text-xs text-tea-muted mb-1">
            <span>Total Inquiries</span>
            <Inbox className="w-4 h-4 text-tea-forest" />
          </div>
          <p className="text-2xl font-serif font-bold text-tea-dark">{totalCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-xs bg-rose-50/30">
          <div className="flex items-center justify-between text-xs text-rose-800 mb-1">
            <span className="font-semibold">Unread</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-rose-700">{unreadCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-tea-border shadow-xs">
          <div className="flex items-center justify-between text-xs text-tea-muted mb-1">
            <span>Replied</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-emerald-700">{repliedCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-tea-border shadow-xs">
          <div className="flex items-center justify-between text-xs text-tea-muted mb-1">
            <span>Reviewed / Read</span>
            <Clock className="w-4 h-4 text-tea-leaf" />
          </div>
          <p className="text-2xl font-serif font-bold text-tea-dark">{readCount}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-tea-border shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-tea-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inquiries by customer name, phone, email, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All" },
            { id: "UNREAD", label: "Unread" },
            { id: "READ", label: "Read" },
            { id: "REPLIED", label: "Replied" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                filter === tab.id
                  ? "bg-tea-dark text-white shadow-xs"
                  : "bg-tea-surface text-tea-muted hover:text-tea-dark"
              }`}
            >
              {tab.label}
              {tab.id === "UNREAD" && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-tea-border space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-tea-leaf mx-auto" />
            <p className="text-xs text-tea-muted font-medium">Loading customer inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-tea-border space-y-3">
            <Inbox className="w-12 h-12 text-tea-muted/50 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-tea-dark">No inquiries found</h3>
            <p className="text-xs text-tea-muted max-w-sm mx-auto">
              {searchQuery
                ? `No inquiries matching "${searchQuery}". Try clearing your search.`
                : filter !== "ALL"
                ? `No inquiries currently with status "${filter}".`
                : "No customer inquiries have been submitted yet. They will appear here once submitted on the Contact page."}
            </p>
          </div>
        ) : (
          filteredInquiries.map((inq) => {
            const isUnread = inq.status === "UNREAD";
            const isReplied = inq.status === "REPLIED";

            return (
              <div
                key={inq.id}
                className={`bg-white rounded-2xl border transition shadow-xs p-5 sm:p-6 space-y-4 ${
                  isUnread
                    ? "border-rose-300 ring-2 ring-rose-100 bg-rose-50/10"
                    : isReplied
                    ? "border-emerald-200"
                    : "border-tea-border"
                }`}
              >
                {/* Header row: Status, Subject, Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-tea-border/60">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        isUnread
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : isReplied
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-slate-100 text-slate-700 border border-slate-300"
                      }`}
                    >
                      {inq.status}
                    </span>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-tea-dark">
                      {inq.subject}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-tea-muted">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(inq.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-4 bg-tea-surface rounded-xl border border-tea-border/70 text-xs sm:text-sm text-tea-dark leading-relaxed whitespace-pre-line">
                  {inq.message}
                </div>

                {/* Customer Details & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                  {/* Customer Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-tea-muted">
                    <div className="flex items-center gap-1.5 font-semibold text-tea-dark">
                      <User className="w-3.5 h-3.5 text-tea-forest" />
                      <span>{inq.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-tea-forest" />
                      <a
                        href={`tel:${inq.phone.replace(/\s+/g, "")}`}
                        className="hover:text-tea-dark hover:underline font-mono"
                      >
                        {inq.phone}
                      </a>
                    </div>

                    {inq.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-tea-forest" />
                        <a
                          href={`mailto:${inq.email}`}
                          className="hover:text-tea-dark hover:underline"
                        >
                          {inq.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Reply WhatsApp */}
                    <a
                      href={getWhatsAppReplyUrl(inq)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (isUnread) {
                          handleStatusUpdate(inq.id, "REPLIED");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                      title="Open WhatsApp chat with pre-filled greeting"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-current" />
                      <span>Reply WhatsApp</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>

                    {/* Reply Email */}
                    {inq.email && (
                      <a
                        href={getEmailReplyUrl(inq)}
                        onClick={() => {
                          if (isUnread) {
                            handleStatusUpdate(inq.id, "REPLIED");
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold transition shadow-xs"
                        title="Send email reply"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </a>
                    )}

                    {/* Status Dropdown */}
                    <select
                      value={inq.status}
                      disabled={actionLoading === inq.id}
                      onChange={(e) => handleStatusUpdate(inq.id, e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-tea-border bg-white text-tea-dark font-medium focus:outline-none focus:ring-1 focus:ring-tea-leaf"
                    >
                      <option value="UNREAD">Mark Unread</option>
                      <option value="READ">Mark Read</option>
                      <option value="REPLIED">Mark Replied</option>
                      <option value="ARCHIVED">Archive</option>
                    </select>

                    {/* Delete button */}
                    <button
                      type="button"
                      disabled={actionLoading === inq.id}
                      onClick={() => handleDelete(inq.id, inq.name)}
                      className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                      title="Delete Inquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
