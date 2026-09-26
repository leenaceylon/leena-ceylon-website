"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, ShieldCheck, CheckCircle2, Lock } from "lucide-react";

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleName: "MANAGER",
  });

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.admins) setAdmins(data.admins);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create administrator");
        return;
      }

      setNotice(`Administrator account created for ${data.admin.email}.`);
      setTimeout(() => setNotice(null), 3000);
      setModalOpen(false);
      setFormData({ name: "", email: "", password: "", roleName: "MANAGER" });
      loadAdmins();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            Access Control
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
            Administrative Team & Roles
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Role-Based Access Control (Super Admin, Manager, Product Manager, Order Manager)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          ADD ADMIN USER
        </button>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Role Definitions Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-tea-border shadow-subtle space-y-1">
          <span className="px-2 py-0.5 rounded bg-tea-dark text-white font-mono text-[10px] font-bold">
            SUPER_ADMIN
          </span>
          <h4 className="font-bold text-xs text-tea-dark pt-1">Super Admin</h4>
          <p className="text-[11px] text-tea-muted leading-relaxed">
            Full unconstrained system authority over all catalog, financial, user, and security configurations.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-tea-border shadow-subtle space-y-1">
          <span className="px-2 py-0.5 rounded bg-tea-leaf text-white font-mono text-[10px] font-bold">
            MANAGER
          </span>
          <h4 className="font-bold text-xs text-tea-dark pt-1">General Manager</h4>
          <p className="text-[11px] text-tea-muted leading-relaxed">
            Authority over Products, Orders, Customer directory, Sales reports, and CMS page content.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-tea-border shadow-subtle space-y-1">
          <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-mono text-[10px] font-bold">
            PRODUCT_MANAGER
          </span>
          <h4 className="font-bold text-xs text-tea-dark pt-1">Product Manager</h4>
          <p className="text-[11px] text-tea-muted leading-relaxed">
            Focused access to create/edit products, sizes, prices, categories, and digital media assets.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-tea-border shadow-subtle space-y-1">
          <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold">
            ORDER_MANAGER
          </span>
          <h4 className="font-bold text-xs text-tea-dark pt-1">Order & Dispatch</h4>
          <p className="text-[11px] text-tea-muted leading-relaxed">
            Fulfillment operations, courier progress updates, and customer delivery communications.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-tea-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-tea-muted">Loading team accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-tea-surface border-b border-tea-border text-tea-muted font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Admin Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role Permission</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tea-border/60">
                {admins.map((a) => (
                  <tr key={a.id} className="hover:bg-tea-surface/40 transition">
                    <td className="py-3 px-4 font-bold text-tea-dark">{a.name}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-tea-muted">{a.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-tea-bg text-tea-forest font-bold text-[10px]">
                        {a.roleName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {a.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-tea-muted">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-tea-border"
          >
            <h3 className="font-serif font-bold text-base text-tea-dark">
              Create Admin Account
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sahan Wickramasinghe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sahan@leenaceylon.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Assigned Role *
                </label>
                <select
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-tea-border bg-tea-surface"
                >
                  <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
                  <option value="MANAGER">Manager (Products, Orders, Customers, Reports)</option>
                  <option value="PRODUCT_MANAGER">Product Manager (Catalog & Media)</option>
                  <option value="ORDER_MANAGER">Order Manager (Fulfillment)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase transition"
              >
                CREATE ADMIN
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-tea-border text-tea-muted hover:text-tea-dark text-xs font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
