import React from "react";

export const metadata = {
  title: "Terms & Conditions | LEENA CEYLON",
  description: "Terms and conditions of sale and use for LEENA CEYLON.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="border-b border-tea-border pb-6 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-tea-dark">
          Terms & Conditions
        </h1>
        <p className="text-xs text-tea-muted">
          LEENA CEYLON (PVT) LTD • Nuwara Eliya & Kekirawa, Sri Lanka
        </p>
      </div>

      <div className="prose text-xs sm:text-sm text-tea-dark leading-relaxed space-y-6">
        <h3 className="font-serif text-lg font-bold text-tea-dark">1. General</h3>
        <p>
          By browsing this website, adding products to cart, placing an order, or initiating a WhatsApp order, you agree to comply with and be bound by the following terms of purchase with LEENA CEYLON (PVT) LTD.
        </p>

        <h3 className="font-serif text-lg font-bold text-tea-dark">2. Product Authenticity & Pricing</h3>
        <p>
          All teas sold under the LEENA CEYLON trademark are 100% genuine Ceylon tea sourced and packed in Sri Lanka. All prices are stated in Sri Lankan Rupees (Rs.). While we strive for absolute accuracy, prices and availability are subject to change by the administration.
        </p>

        <h3 className="font-serif text-lg font-bold text-tea-dark">3. Delivery & Fulfillment</h3>
        <p>
          Standard island-wide courier delivery takes between 2 to 4 business days. Orders above Rs. 3,500 qualify for free standard delivery across all 25 districts of Sri Lanka.
        </p>

        <h3 className="font-serif text-lg font-bold text-tea-dark">4. Payment Terms</h3>
        <p>
          We accept Cash on Delivery (COD) and direct Bank Transfer to our Commercial Bank account. For Bank Transfers, orders will be packed upon verification of the deposit slip.
        </p>

        <h3 className="font-serif text-lg font-bold text-tea-dark">5. Returns & Quality Guarantee</h3>
        <p>
          If your tea package arrives damaged or compromised, please notify us within 48 hours with a photograph via WhatsApp (071 777 4717) for an immediate replacement.
        </p>
      </div>
    </div>
  );
}
