"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppModal from "./WhatsAppModal";
import FloatingWhatsApp from "./FloatingWhatsApp";
import { SiteSettingsMap } from "@/types";

export default function CustomerLayoutWrapper({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: SiteSettingsMap;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-tea-dark">
      <Navbar
        logoUrl={settings.logoUrl}
        phone={settings.phone}
        whatsappNumber={settings.whatsappNumber}
      />
      <main className="flex-grow">{children}</main>
      <Footer
        logoUrl={settings.logoUrl}
        phone={settings.phone}
        whatsappNumber={settings.whatsappNumber}
        email={settings.email}
        address={settings.address}
      />
      <WhatsAppModal
        settings={settings}
        whatsappNumber={settings.whatsappNumber}
        whatsappTemplate={settings.whatsappTemplate}
      />
      {settings.whatsappEnabled && (
        <FloatingWhatsApp
          whatsappNumber={settings.whatsappNumber}
          brandName={settings.brandName}
        />
      )}
    </div>
  );
}
