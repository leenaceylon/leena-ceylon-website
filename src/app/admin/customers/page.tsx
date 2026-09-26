"use client";

import React, { useState, useEffect } from "react";
import { Search, Users, CheckCircle2, ShieldAlert } from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleToggleStatus = async (c: any) => {
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, isActive: !c.isActive }),
      });
      if (res.ok) {
        setNotice(`Customer account ${!c.isActive ? "enabled" : "suspended"}.`);
        setTimeout(() => setNotice(null), 3000);
        loadCustomers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Top Header */}
      <div>
        <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
          Customer Directory
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
          Registered Tea Connoisseurs
        </h1>
        <p className="text-xs text-tea-muted mt-0.5">
          View customer accounts, lifetime spending, and manage account statuses
        </p>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name, email, or telephone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30"
          />
          <Search className="w-4 h-4 text-tea-muted absolute left-3 top-2.5" />
        </div>
        <div className="text-xs text-tea-muted font-medium">
          {filtered.length} customers
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-tea-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-tea-muted">Loading customer records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-tea-muted">No customers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-tea-surface border-b border-tea-border text-tea-muted font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4">Orders</th>
                  <th className="py-3.5 px-4">Total Spending</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tea-border/60">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-tea-surface/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-tea-dark">{c.name}</div>
                      <div className="text-[11px] text-tea-muted">{c.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-tea-dark">
                      {c.phone || "—"}
                    </td>
                    <td className="py-3 px-4 text-tea-muted">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-tea-dark">
                      {c.orderCount} orders
                    </td>
                    <td className="py-3 px-4 font-serif font-bold text-tea-forest">
                      Rs. {c.totalSpent.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {c.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                          c.isActive
                            ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {c.isActive ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
