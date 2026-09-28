import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | LEENA CEYLON - Customer Data Protection",
  description: "Official Privacy policy and customer data protection standards at LEENA CEYLON (PVT) LTD.",
  alternates: {
    canonical: "https://leenaceylon.com/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="border-b border-tea-border pb-6 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-tea-dark">
          Privacy Policy
        </h1>
        <p className="text-xs text-tea-muted">
          Last updated: September 2026 • LEENA CEYLON (PVT) LTD
        </p>
      </div>

      <div className="prose text-xs sm:text-sm text-tea-dark leading-relaxed space-y-6">
        <p>
          At <strong>LEENA CEYLON</strong>, your privacy and personal information integrity are of paramount importance. This Privacy Policy outlines how LEENA CEYLON (PVT) LTD collects, uses, and safeguards information when you visit our website, submit orders, or interact via WhatsApp.
        </p>

        <h3 className="font-serif text-lg font-bold text-tea-dark">1. Information We Collect</h3>
        <p>
          When you place an order or interact with our storefront, we collect information necessary to fulfill your purchase, including:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-tea-muted">
          <li>Full customer name, shipping address, city, district, and postal code.</li>
          <li>Active telephone/mobile number for courier dispatch notification.</li>
          <li>Email address for electronic order confirmation and receipts.</li>
          <li>WhatsApp chat communications when utilizing our WhatsApp ordering feature.</li>
        </ul>

        <h3 className="font-serif text-lg font-bold text-tea-dark">2. How We Use Your Data</h3>
        <p>
          Your information is used strictly to process orders, arrange courier delivery across Sri Lanka, communicate fulfillment statuses, and provide customer support. We never sell, rent, or lease your contact information to third-party advertisers.
        </p>

        <h3 className="font-serif text-lg font-bold text-tea-dark">3. Data Security</h3>
        <p>
          We employ strict technical and organizational safeguards, including SSL encryption, restricted administrative access, and secure session management.
        </p>

        <h3 className="font-serif text-lg font-bold text-tea-dark">4. Contacting Us</h3>
        <p>
          If you have questions regarding our privacy practices, contact us at <strong>info@leenaceylon.com</strong> or call <strong>071 777 4717</strong>.
        </p>
      </div>
    </div>
  );
}
