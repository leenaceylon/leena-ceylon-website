import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import ProductDetailsClient from "@/components/ProductDetailsClient";
import ProductReviews from "@/components/ProductReviews";
import ProductCard from "@/components/ProductCard";
import { ChevronRight, Coffee, Info, ShieldCheck, Heart } from "lucide-react";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  });
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} | LEENA CEYLON`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} - LEENA CEYLON`,
      description: product.shortDescription,
      images: [{ url: product.mainImage }],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      sizes: {
        where: { isActive: true },
        orderBy: { regularPrice: "asc" },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  // Fetch related products
  const relatedProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      categoryId: product.categoryId,
    },
    include: {
      sizes: {
        where: { isActive: true },
        orderBy: { regularPrice: "asc" },
      },
      category: true,
    },
    take: 3,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-tea-muted">
        <Link href="/" className="hover:text-tea-dark transition">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-tea-dark transition">
          Products
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-tea-dark transition"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-tea-forest font-semibold truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Main Interactive Product Section */}
      <ProductDetailsClient product={product as any} />

      {/* Tabs / Detailed Information: Full Description, Brewing Guide, Origin */}
      <div className="pt-8 border-t border-tea-border grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Full Description */}
          <div className="space-y-3">
            <h3 className="font-serif text-xl font-bold text-tea-dark flex items-center gap-2">
              <Info className="w-5 h-5 text-tea-leaf" />
              Product Description
            </h3>
            <div className="prose text-xs sm:text-sm text-tea-muted leading-relaxed whitespace-pre-line bg-tea-surface p-6 rounded-2xl border border-tea-border">
              {product.fullDescription}
            </div>
          </div>

          {/* How to Make the Perfect Cup (Brewing Instructions) */}
          {product.brewingGuide && (
            <div className="space-y-3">
              <h3 className="font-serif text-xl font-bold text-tea-dark flex items-center gap-2">
                <Coffee className="w-5 h-5 text-tea-gold" />
                How to Make the Perfect Cup
              </h3>
              <div className="bg-tea-bg p-6 rounded-2xl border border-tea-border text-xs sm:text-sm text-tea-dark leading-relaxed whitespace-pre-line space-y-2">
                {product.brewingGuide}
              </div>
            </div>
          )}

          {/* Customer Reviews Section */}
          <ProductReviews productId={product.id} reviews={product.reviews} />
        </div>

        {/* Sidebar Info Card: Heritage & Quality */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-b from-tea-surface to-white p-6 rounded-2xl border border-tea-border space-y-4">
            <h4 className="font-serif font-bold text-sm text-tea-dark uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-tea-forest" />
              The LEENA CEYLON Quality Seal
            </h4>
            <p className="text-xs text-tea-muted leading-relaxed">
              Every pack of LEENA CEYLON Tea is cultivated in Sri Lanka’s revered terroir under optimum soil, sun, and rainfall conditions.
            </p>
            <ul className="text-xs space-y-2 text-tea-dark">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-tea-leaf" />
                <strong>Grade:</strong> {product.teaGrade}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-tea-leaf" />
                <strong>Region:</strong> {product.origin}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-tea-leaf" />
                <strong>Packaging:</strong> Multi-layer freshness seal
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-tea-leaf" />
                <strong>Direct Delivery:</strong> Island-wide across Sri Lanka
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-tea-border space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl font-bold text-tea-dark">
              You May Also Enjoy
            </h3>
            <Link
              href="/products"
              className="text-xs font-semibold uppercase tracking-wider text-tea-forest hover:text-tea-dark transition"
            >
              Browse All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
