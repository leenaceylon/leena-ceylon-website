"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  KeyRound,
  ShieldAlert,
  UserCheck,
  UserX,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleName: "MANAGER",
  });

  // Edit / Modify Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    roleName: "MANAGER",
    isActive: true,
    newPassword: "",
  });

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Failed to load team accounts");
        return;
      }
      if (data.admins && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      }
      if (data.currentAdmin) {
        setCurrentAdmin(data.currentAdmin);
      }
    } catch (e: any) {
      console.error("Error loading admins:", e);
      showError(e?.message || "Failed to load team accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const showSuccess = (msg: string) => {
    setNotice(msg);
    setErrorNotice(null);
    setTimeout(() => setNotice(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorNotice(msg);
    setNotice(null);
    setTimeout(() => setErrorNotice(null), 5000);
  };

  // Handle Create Admin
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Failed to create administrator");
        return;
      }

      showSuccess(`Administrator account created for ${data.admin.email}.`);
      setCreateModalOpen(false);
      setFormData({ name: "", email: "", password: "", roleName: "MANAGER" });
      loadAdmins();
    } catch (e: any) {
      showError(e?.message || "Connection error creating admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditFormData({
      name: admin.name,
      email: admin.email,
      roleName: admin.roleName,
      isActive: admin.isActive,
      newPassword: "",
    });
    setEditModalOpen(true);
  };

  // Handle Edit / Modify Admin
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setIsSubmitting(true);

    try {
      const payload: any = {
        id: editingAdmin.id,
        name: editFormData.name,
        email: editFormData.email,
        roleName: editFormData.roleName,
        isActive: editFormData.isActive,
      };

      if (editFormData.newPassword.trim()) {
        payload.password = editFormData.newPassword.trim();
      }

      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Failed to modify administrator account");
        return;
      }

      showSuccess(`Account for ${data.admin.email} successfully updated.`);
      setEditModalOpen(false);
      setEditingAdmin(null);
      loadAdmins();
    } catch (e: any) {
      showError(e?.message || "Failed to update admin account");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (admin: AdminUser) => {
    setDeletingAdmin(admin);
    setDeleteModalOpen(true);
  };

  // Handle Delete Admin
  const handleDeleteConfirm = async () => {
    if (!deletingAdmin) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/users?id=${deletingAdmin.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Failed to delete account");
        return;
      }

      showSuccess(data.message || `Account for ${deletingAdmin.email} has been permanently deleted.`);
      setDeleteModalOpen(false);
      setDeletingAdmin(null);
      loadAdmins();
    } catch (e: any) {
      showError(e?.message || "Error deleting admin account");
    } finally {
      setIsDeleting(false);
    }
  };

  const isSuperAdmin = currentAdmin?.isSuperAdmin ?? false;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-tea-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
              Access Control & Security
            </span>
            {isSuperAdmin ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Super Admin Authorized
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                <Lock className="w-3 h-3 text-amber-600" />
                Read-Only (Manager Mode)
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark mt-1">
            Administrative Team & Role Permissions
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Role-Based Access Control. Account creation, editing, and deletion is strictly reserved for Super Administrators.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-tea-gold" />
            <span>Add Admin User</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{notice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{errorNotice}</span>
        </div>
      )}

      {/* Role Definitions Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white rounded-xl border border-tea-border shadow-subtle space-y-1">
          <span className="px-2 py-0.5 rounded bg-tea-dark text-white font-mono text-[10px] font-bold">
            SUPER_ADMIN
          </span>
          <h4 className="font-bold text-xs text-tea-dark pt-1">Super Admin</h4>
          <p className="text-[11px] text-tea-muted leading-relaxed">
            Full unconstrained system authority. Exclusive right to create, modify, and delete admin accounts.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-tea-border shadow-subtle space-y-1">
          <span className="px-2 py-0.5 rounded bg-tea-leaf text-white font-mono text-[10px] font-bold">
            MANAGER
          </span>
          <h4 className="font-bold text-xs text-tea-dark pt-1">General Manager</h4>
          <p className="text-[11px] text-tea-muted leading-relaxed">
            Authority over Products, Orders, Customer directory, Sales metrics & reports, and CMS page content.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-tea-border shadow-subtle space-y-1">
          <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-mono text-[10px] font-bold">
            PRODUCT_MANAGER
          </span>
          <h4 className="font-bold text-xs text-tea-dark pt-1">Product Manager</h4>
          <p className="text-[11px] text-tea-muted leading-relaxed">
            Focused access to manage tea products, package sizes, prices, categories, and image assets.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-tea-border shadow-subtle space-y-1">
          <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold">
            ORDER_MANAGER
          </span>
          <h4 className="font-bold text-xs text-tea-dark pt-1">Order & Dispatch</h4>
          <p className="text-[11px] text-tea-muted leading-relaxed">
            Customer order fulfillment, courier dispatch tracking, and delivery communications.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-tea-border shadow-subtle space-y-1">
          <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-mono text-[10px] font-bold">
            SHOP_ORDER_REP
          </span>
          <h4 className="font-bold text-xs text-tea-dark pt-1">Shop Order Taker</h4>
          <p className="text-[11px] text-tea-muted leading-relaxed">
            Field rep console: List of available products with real-time stock and fast item-by-item billing.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-tea-border shadow-subtle overflow-hidden">
        <div className="p-4 bg-tea-surface/40 border-b border-tea-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-tea-forest" />
            <h3 className="font-serif font-bold text-sm text-tea-dark">
              Active Administrator Accounts ({admins.length})
            </h3>
          </div>
          {!isSuperAdmin && (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
              Only Super Admin can modify or delete accounts
            </span>
          )}
        </div>

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
                  <th className="py-3.5 px-4">Created Date</th>
                  {isSuperAdmin && <th className="py-3.5 px-4 text-right">Super Admin Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-tea-border/60">
                {admins.map((a) => {
                  const isCurrent = currentAdmin?.id === a.id;
                  const isMaster = a.email === "admin@leenaceylon.com";

                  return (
                    <tr key={a.id} className="hover:bg-tea-surface/40 transition">
                      <td className="py-3.5 px-4 font-bold text-tea-dark">
                        <div className="flex items-center gap-2">
                          <span>{a.name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded bg-tea-leaf/20 text-tea-leaf text-[9px] font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-tea-muted">{a.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            a.roleName === "SUPER_ADMIN"
                              ? "bg-tea-dark text-white"
                              : a.roleName === "MANAGER"
                              ? "bg-tea-leaf text-white"
                              : a.roleName === "SHOP_ORDER_REP"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-tea-bg text-tea-forest"
                          }`}
                        >
                          {a.roleName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            a.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {a.isActive ? (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 text-rose-600" />
                              Disabled
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-tea-muted">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>

                      {/* Super Admin Exclusive Actions */}
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Modify / Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(a)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-tea-border bg-white hover:bg-tea-surface text-tea-dark hover:text-tea-forest text-[11px] font-semibold transition shadow-xs"
                              title="Modify account details and role"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-tea-leaf" />
                              <span>Modify</span>
                            </button>

                            {/* Delete Button (Only for Super Admin, cannot delete self or master) */}
                            {!isCurrent && !isMaster && (
                              <button
                                type="button"
                                onClick={() => handleOpenDelete(a)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition"
                                title="Permanently delete account"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-tea-border"
          >
            <div className="flex items-center justify-between pb-3 border-b border-tea-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-tea-leaf/10 text-tea-forest">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-tea-dark">
                    Create Administrator Account
                  </h3>
                  <p className="text-[11px] text-tea-muted">Super Admin access control</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 text-tea-muted hover:text-tea-dark rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Assigned Role Permission *
                </label>
                <select
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface font-semibold text-tea-dark focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Authority & Account Management)</option>
                  <option value="MANAGER">MANAGER (Products, Orders, Customers, Sales Reports)</option>
                  <option value="PRODUCT_MANAGER">PRODUCT_MANAGER (Catalog, Pricing, Media)</option>
                  <option value="ORDER_MANAGER">ORDER_MANAGER (Fulfillment & Couriers)</option>
                  <option value="SHOP_ORDER_REP">SHOP_ORDER_REP (Shop Order Taking & Available Products Only)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
              >
                {isSubmitting ? "Creating..." : "Create Account"}
              </button>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-tea-border text-tea-muted hover:text-tea-dark text-xs font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT / MODIFY MODAL (Super Admin Only) */}
      {editModalOpen && editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleUpdate}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-tea-border"
          >
            <div className="flex items-center justify-between pb-3 border-b border-tea-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-tea-gold/20 text-tea-forest">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-tea-dark">
                    Modify Administrator Account
                  </h3>
                  <p className="text-[11px] text-tea-muted">Update details, role or reset password</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-tea-muted hover:text-tea-dark rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Assigned Role Permission *
                </label>
                <select
                  value={editFormData.roleName}
                  onChange={(e) => setEditFormData({ ...editFormData, roleName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface font-semibold text-tea-dark focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Authority & Account Management)</option>
                  <option value="MANAGER">MANAGER (Products, Orders, Customers, Sales Reports)</option>
                  <option value="PRODUCT_MANAGER">PRODUCT_MANAGER (Catalog, Pricing, Media)</option>
                  <option value="ORDER_MANAGER">ORDER_MANAGER (Fulfillment & Couriers)</option>
                  <option value="SHOP_ORDER_REP">SHOP_ORDER_REP (Shop Order Taking & Available Products Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Account Status
                </label>
                <select
                  value={editFormData.isActive ? "active" : "disabled"}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === "active" })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface font-semibold text-tea-dark focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                >
                  <option value="active">Active (Can log in)</option>
                  <option value="disabled">Disabled (Access blocked)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-tea-border/60">
                <label className="block text-xs font-semibold text-tea-dark mb-1">
                  Reset Password (Optional)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Leave blank to keep existing password"
                    value={editFormData.newPassword}
                    onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
                  />
                  <KeyRound className="w-4 h-4 text-tea-muted absolute left-3 top-3" />
                </div>
                <p className="text-[10px] text-tea-muted mt-1">
                  Enter at least 6 characters only if you want to set a new password.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-tea-border text-tea-muted hover:text-tea-dark text-xs font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (Super Admin Only) */}
      {deleteModalOpen && deletingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-rose-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-rose-950">
                  Delete Administrator Account?
                </h3>
                <p className="text-xs text-rose-700">Permanent action • Super Admin authority</p>
              </div>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-2">
              <p>
                Are you sure you want to permanently delete the admin account for:
              </p>
              <div className="font-semibold bg-white p-3 rounded-xl border border-rose-200">
                <p className="text-tea-dark">{deletingAdmin.name}</p>
                <p className="font-mono text-[11px] text-tea-muted">{deletingAdmin.email}</p>
                <p className="text-[10px] text-tea-forest font-bold mt-1">Role: {deletingAdmin.roleName}</p>
              </div>
              <p className="text-[11px] text-rose-700">
                This administrator will immediately lose all console access. Past audit logs will remain preserved.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "Deleting..." : "Yes, Delete Account"}</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-tea-border text-tea-muted hover:text-tea-dark text-xs font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
