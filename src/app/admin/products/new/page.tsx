import React from "react";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="p-6 sm:p-8">
      <ProductForm isEdit={false} />
    </div>
  );
}
