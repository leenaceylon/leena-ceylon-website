import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import CustomerLayoutWrapper from "@/components/CustomerLayoutWrapper";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL("https://leenaceylon.com"),
    title: {
      default: `${settings.brandName} | ${settings.brandTagline} - ${settings.secondaryTagline}`,
      template: `%s | ${settings.brandName}`,
    },
    description: settings.seoDescription,
    icons: {
      icon: settings.faviconUrl || "/brand/logo.png",
      apple: settings.logoUrl || "/brand/logo.png",
    },
    openGraph: {
      title: `${settings.brandName} - ${settings.brandTagline}`,
      description: settings.seoDescription,
      url: "https://leenaceylon.com",
      siteName: settings.brandName,
      images: [
        {
          url: settings.logoUrl || "/brand/logo.png",
          width: 800,
          height: 600,
          alt: "LEENA CEYLON Logo",
        },
      ],
      locale: "en_LK",
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased selection:bg-tea-leaf selection:text-white">
        <CartProvider>
          <CustomerLayoutWrapper settings={settings}>
            {children}
          </CustomerLayoutWrapper>
        </CartProvider>
      </body>
    </html>
  );
}
