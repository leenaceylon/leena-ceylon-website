import React from "react";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { FALLBACK_PRODUCTS, FALLBACK_CATEGORIES } from "@/lib/fallback-data";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { Filter, Search, Clock } from "lucide-react";
import { getBaseUrl, SEO_KEYWORDS } from "@/lib/seo";

export const revalidate = 0; // Dynamic to reflect database changes immediately

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { category?: string; q?: string; type?: string; grade?: string };
}): Promise<Metadata> {
  const category = searchParams?.category;
  const q = searchParams?.q;

  let title = "Pure Ceylon Tea Collection | LEENA CEYLON Products";
  let description =
    "Explore the full collection of authentic Sri Lankan Ceylon Tea from LEENA. Single-origin black tea, green tea, flavoured teas, and premium artisan grades.";

  if (category) {
    const formattedCat = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    title = `${formattedCat} | LEENA CEYLON Tea Collection`;
    description = `Shop authentic ${formattedCat} from LEENA CEYLON. Freshly packed single-origin tea from Sri Lanka with direct WhatsApp ordering.`;
  } else if (q) {
    title = `Search: "${q}" | LEENA CEYLON`;
    description = `Search results for "${q}" across the LEENA CEYLON tea collection.`;
  }

  return {
    title,
    description,
    keywords: [
      ...SEO_KEYWORDS,
      "LEENA products",
      "Leena tea collection",
      "Buy Ceylon Tea",
      "Sri Lanka tea shop",
      "Pure Ceylon Tea Sri Lanka",
      "Leena Ceylon catalog",
    ],
    alternates: {
      canonical: category
        ? `/products?category=${category}`
        : "/products",
    },
    openGraph: {
      title,
      description,
      url: "/products",
      siteName: "LEENA CEYLON",
      images: [
        {
          url: "/images/ceylon-hero-plantation.jpg",
          width: 1200,
          height: 630,
          alt: "LEENA CEYLON Products",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/ceylon-hero-plantation.jpg"],
    },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: {
    category?: string;
    q?: string;
    type?: string;
    grade?: string;
    sort?: string;
    filter?: string;
  };
}) {
  const categorySlug = searchParams?.category;
  const searchQuery = searchParams?.q;
  const teaType = searchParams?.type;
  const teaGrade = searchParams?.grade;
  const sort = searchParams?.sort || "featured";
  const filter = searchParams?.filter;

  // Build where filter
  const where: any = {
    isActive: true,
  };

  if (filter === "coming-soon") {
    where.isComingSoon = true;
  }

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery } },
      { shortDescription: { contains: searchQuery } },
      { teaGrade: { contains: searchQuery } },
      { teaType: { contains: searchQuery } },
    ];
  }

  if (teaType) {
    where.teaType = { contains: teaType };
  }

  if (teaGrade) {
    where.teaGrade = { contains: teaGrade };
  }

  let orderBy: any = { isFeatured: "desc" };
  if (sort === "price-asc") orderBy = { regularPrice: "asc" };
  if (sort === "price-desc") orderBy = { regularPrice: "desc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };

  let products: any[] = [];
  let categories: any[] = [];

  try {
    const res = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          sizes: {
            where: { isActive: true },
            orderBy: { regularPrice: "asc" },
          },
        },
        orderBy,
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
    products = res[0];
    categories = res[1];
  } catch (error) {
    console.warn("Could not query database on products page, using fallback data:", error);
    products = FALLBACK_PRODUCTS as any;
    categories = FALLBACK_CATEGORIES as any;
  }

  if (!products || products.length === 0) {
    products = FALLBACK_PRODUCTS as any;
  }
  if (!categories || categories.length === 0) {
    categories = FALLBACK_CATEGORIES as any;
  }

  // Filter fallback products if database was unavailable
  if (categorySlug && Array.isArray(products)) {
    const filtered = products.filter((p: any) => p.category?.slug === categorySlug);
    if (filtered.length > 0) {
      products = filtered;
    }
  }
  if (filter === "coming-soon" && Array.isArray(products)) {
    products = products.filter((p: any) => Boolean(p.isComingSoon));
  }
  if (searchQuery && Array.isArray(products)) {
    const q = searchQuery.toLowerCase();
    const filtered = products.filter(
      (p: any) =>
        p.name?.toLowerCase().includes(q) ||
        p.shortDescription?.toLowerCase().includes(q) ||
        p.teaGrade?.toLowerCase().includes(q) ||
        p.teaType?.toLowerCase().includes(q)
    );
    if (filtered.length > 0) {
      products = filtered;
    }
  }

  const baseUrl = getBaseUrl();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${baseUrl}/products`,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Page Header */}
      <div className="space-y-2 text-center sm:text-left border-b border-tea-border/60 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-tea-leaf">
          Direct From Sri Lanka
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-tea-dark">
          {filter === "coming-soon" ? "Coming Soon Collection" : "Ceylon Tea Catalogue"}
        </h1>
        <p className="text-xs sm:text-sm text-tea-muted max-w-2xl">
          {filter === "coming-soon"
            ? "Preview our upcoming artisanal Ceylon tea releases and reserve early batches through WhatsApp."
            : "Browse our handpicked collection of 100% Pure Ceylon orthodox teas, tea powders, and estate-crafted botanical blends."}
        </p>
      </div>

      {/* Category Pills & Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/products"
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
              !categorySlug && filter !== "coming-soon"
                ? "bg-tea-dark text-white"
                : "bg-tea-surface text-tea-dark hover:bg-tea-bg border border-tea-border"
            }`}
          >
            All Products
          </Link>
          <Link
            href="/products?filter=coming-soon"
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
              filter === "coming-soon"
                ? "bg-amber-600 text-white shadow-xs font-bold"
                : "bg-tea-surface text-amber-900 hover:bg-amber-50 border border-amber-300"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Coming Soon</span>
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                categorySlug === c.slug && filter !== "coming-soon"
                  ? "bg-tea-dark text-white"
                  : "bg-tea-surface text-tea-dark hover:bg-tea-bg border border-tea-border"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Search status or active count */}
        <div className="text-xs text-tea-muted font-medium">
          Showing <span className="text-tea-dark font-bold">{products.length}</span>{" "}
          {products.length === 1 ? "product" : "products"}
          {searchQuery && (
            <span>
              {" "}
              matching "<strong>{searchQuery}</strong>"
            </span>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 bg-tea-surface rounded-2xl border border-tea-border p-6 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-tea-dark">No products available.</h3>
          <p className="text-xs text-tea-muted max-w-sm mx-auto">
            We couldn't find any tea matching your search criteria. Try browsing our full collection or resetting filters.
          </p>
          <Link
            href="/products"
            className="inline-block px-5 py-2.5 rounded-xl bg-tea-dark text-white text-xs font-semibold uppercase tracking-wider"
          >
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p as any} />
          ))}
        </div>
      )}
    </div>
  );
}
