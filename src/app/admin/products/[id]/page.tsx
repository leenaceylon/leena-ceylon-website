import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export const revalidate = 0;

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      sizes: true,
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="p-6 sm:p-8">
      <ProductForm initialData={product} isEdit={true} />
    </div>
  );
}
