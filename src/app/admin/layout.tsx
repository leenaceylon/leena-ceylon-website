import React from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin Dashboard | LEENA CEYLON",
  description: "Secure management portal for LEENA CEYLON operations",
};

export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  // If not logged in and on admin sub-pages, Next.js page will handle or we render children directly for /admin/login
  return (
    <div className="min-h-screen bg-tea-surface/30 text-tea-dark flex flex-col lg:flex-row font-sans">
      {admin && <AdminSidebar adminUser={admin} />}
      <div className={`flex-1 flex flex-col min-w-0 ${admin ? "lg:pl-64" : ""}`}>
        {children}
      </div>
    </div>
  );
}
