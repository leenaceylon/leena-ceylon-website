"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Users,
  BarChart3,
  Image as ImageIcon,
  Tag,
  Star,
  FileText,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Layers },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Sales Reports", href: "/admin/sales", icon: BarChart3 },
  { name: "Media Library", href: "/admin/media", icon: ImageIcon },
  { name: "Promotions", href: "/admin/promotions", icon: Tag },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
  { name: "Content CMS", href: "/admin/pages", icon: FileText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
  { name: "Admin Users", href: "/admin/users", icon: Users },
  { name: "Security & Audit", href: "/admin/security", icon: ShieldCheck },
];

export default function AdminSidebar({
  adminUser,
}: {
  adminUser?: { name: string; role: string; email: string } | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-tea-dark text-white border-b border-tea-forest">
        <div className="relative h-10 w-32 bg-white px-2 py-1 rounded-lg">
          <Image
            src="/brand/logo.png"
            alt="LEENA CEYLON"
            fill
            className="object-contain"
          />
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-tea-pale hover:text-white rounded-lg"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-tea-dark text-white flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 flex-1 overflow-y-auto">
          {/* Official Brand Logo */}
          <div className="pb-5 border-b border-white/10">
            <Link href="/admin/dashboard" className="block">
              <div className="relative h-12 w-44 bg-white p-2 rounded-xl">
                <Image
                  src="/brand/logo.png"
                  alt="LEENA CEYLON"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-tea-pale/70">
              <span className="font-semibold text-tea-gold uppercase tracking-wider">
                Admin Console
              </span>
              <span className="px-2 py-0.5 rounded bg-tea-forest/60 text-emerald-300 font-mono text-[10px]">
                {adminUser?.role || "SUPER_ADMIN"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin/dashboard"
                  ? pathname === "/admin/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-tea-leaf text-white shadow-sm"
                      : "text-tea-pale/75 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions: View Store & Logout */}
        <div className="p-4 bg-black/20 border-t border-white/10 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2 text-xs text-tea-pale/80 hover:text-white hover:bg-white/5 rounded-xl transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-tea-gold" />
              View Customer Store
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-300 hover:text-rose-100 hover:bg-rose-500/10 rounded-xl transition font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
