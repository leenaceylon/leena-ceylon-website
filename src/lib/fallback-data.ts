export interface FallbackCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
}

export interface FallbackProductSize {
  id: string;
  productId: string;
  sizeName: string;
  weightGram: number;
  regularPrice: number;
  salePrice: number | null;
  stock: number;
  isActive: boolean;
}

export interface FallbackProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface FallbackProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  shortDescription: string;
  fullDescription: string;
  teaType: string;
  teaGrade: string;
  origin: string;
  regularPrice: number;
  salePrice: number | null;
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  mainImage: string;
  brewingGuide?: string;
  sizes: FallbackProductSize[];
  images: FallbackProductImage[];
  category: FallbackCategory;
  reviews?: any[];
}

export const FALLBACK_CATEGORIES: FallbackCategory[] = [
  {
    id: "cat-1",
    name: "Tea Powder",
    slug: "tea-powder",
    description: "Authentic pure Ceylon tea powder with rich aroma, brisk liquor, and beautiful natural colour.",
    image: "/uploads/leena-tea-powder-200g.jpeg",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "cat-2",
    name: "Ceylon Black Tea",
    slug: "ceylon-black-tea",
    description: "Orthodox whole leaf and broken grades from Sri Lanka's renowned high-elevation tea estates.",
    image: "/uploads/leena-bopf-tin-250g.jpeg",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "cat-3",
    name: "Premium Tin Collection",
    slug: "premium-tin-collection",
    description: "Airtight luxury metal canisters preserving freshness and natural aroma for tea lovers.",
    image: "/uploads/leena-bopf-tin-250g.jpeg",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "cat-4",
    name: "Flavored Ceylon Tea",
    slug: "flavored-ceylon-tea",
    description: "Lush Ceylon tea leaves married with real natural lemon and citrus extracts.",
    image: "/uploads/leena-lemon-tea-500g.jpeg",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "cat-5",
    name: "Ceylon Spices & Cinnamon",
    slug: "ceylon-spices",
    description: "Authentic True Ceylon Cinnamon and organic spices harvested directly from Sri Lankan estates.",
    image: "/uploads/leena-tea-powder-50g-flat.jpeg",
    sortOrder: 5,
    isActive: true,
  },
];

export const FALLBACK_PRODUCTS: FallbackProduct[] = [
  {
    id: "prod-1",
    name: "LEENA CEYLON Pure Tea Powder",
    slug: "leena-ceylon-tea-powder",
    sku: "LC-TP-01",
    categoryId: "cat-1",
    shortDescription: "100% Pure Ceylon Tea Powder carefully selected from finest Ceylon tea gardens with rich aroma and beautiful colour.",
    fullDescription: "Carefully selected from the finest Ceylon tea gardens, LEENA CEYLON tea brings you the authentic taste, rich aroma, and natural goodness of pure Ceylon tea. Handpicked from the lush green hills of Sri Lanka.\n\nPacked & Distributed by LEENA CEYLON (PVT) LTD, A/Bandarapothana, Pubbogama, Kekirawa, Sri Lanka.",
    teaType: "Pure Ceylon Black Tea",
    teaGrade: "BOPF / DUST (Premium Quality)",
    origin: "Nuwara Eliya & Kekirawa, Sri Lanka",
    regularPrice: 260,
    salePrice: null,
    stock: 250,
    isFeatured: true,
    isActive: true,
    mainImage: "/uploads/leena-tea-powder-200g.jpeg",
    brewingGuide: "1. Boil fresh water to a rolling boil.\n2. Use 1 teaspoon (2g) of Leena Ceylon Tea per cup.\n3. Steep for 3-5 minutes.\n4. Enjoy your perfect cup of pure Ceylon Tea.",
    category: FALLBACK_CATEGORIES[0],
    sizes: [
      { id: "size-1", productId: "prod-1", sizeName: "50g", weightGram: 50, regularPrice: 75, salePrice: null, stock: 150, isActive: true },
      { id: "size-2", productId: "prod-1", sizeName: "100g", weightGram: 100, regularPrice: 140, salePrice: null, stock: 100, isActive: true },
      { id: "size-3", productId: "prod-1", sizeName: "200g", weightGram: 200, regularPrice: 260, salePrice: null, stock: 120, isActive: true },
      { id: "size-4", productId: "prod-1", sizeName: "250g", weightGram: 250, regularPrice: 320, salePrice: null, stock: 80, isActive: true },
      { id: "size-5", productId: "prod-1", sizeName: "500g", weightGram: 500, regularPrice: 620, salePrice: null, stock: 50, isActive: true },
      { id: "size-6", productId: "prod-1", sizeName: "1kg", weightGram: 1000, regularPrice: 1200, salePrice: null, stock: 30, isActive: true },
    ],
    images: [
      { id: "img-1", productId: "prod-1", url: "/uploads/leena-tea-powder-200g.jpeg", sortOrder: 0 },
      { id: "img-2", productId: "prod-1", url: "/uploads/leena-tea-powder-50g-flat.jpeg", sortOrder: 1 },
      { id: "img-3", productId: "prod-1", url: "/uploads/leena-tea-powder-50g-back.jpeg", sortOrder: 2 },
    ],
    reviews: [],
  },
  {
    id: "prod-2",
    name: "LEENA CEYLON BOPF Premium Tin",
    slug: "leena-ceylon-bopf-tin-250g",
    sku: "LC-TIN-250",
    categoryId: "cat-3",
    shortDescription: "Finest quality 100% Pure Ceylon BOPF packaged in an airtight luxury tin caddy for enduring freshness.",
    fullDescription: "LEENA CEYLON Tea is a premium blend of finest Ceylon tea leaves, handpicked from the lush green hills of Sri Lanka. Rich in taste, natural in aroma. Preserved in a protective reusable food-grade tin canister.\n\nPacked & Marketed by LEENA CEYLON (PVT) LTD, A/Bandarapothana, Pubbogama, Kekirawa, Sri Lanka.",
    teaType: "Pure Ceylon Black Tea",
    teaGrade: "BOPF (Broken Orange Pekoe Fannings)",
    origin: "Nuwara Eliya, High Grown (6,000+ ft), Sri Lanka",
    regularPrice: 490,
    salePrice: null,
    stock: 140,
    isFeatured: true,
    isActive: true,
    mainImage: "/uploads/leena-bopf-tin-250g.jpeg",
    brewingGuide: "Bring fresh water to 100°C boil. Add 2g of Leena BOPF tea into a warmed teapot. Steep for 3-5 minutes.",
    category: FALLBACK_CATEGORIES[2],
    sizes: [
      { id: "size-7", productId: "prod-2", sizeName: "250g", weightGram: 250, regularPrice: 490, salePrice: null, stock: 90, isActive: true },
      { id: "size-8", productId: "prod-2", sizeName: "500g", weightGram: 500, regularPrice: 950, salePrice: 890, stock: 50, isActive: true },
    ],
    images: [
      { id: "img-4", productId: "prod-2", url: "/uploads/leena-bopf-tin-250g.jpeg", sortOrder: 0 },
      { id: "img-5", productId: "prod-2", url: "/uploads/leena-tea-pack-back.jpeg", sortOrder: 1 },
    ],
    reviews: [],
  },
  {
    id: "prod-3",
    name: "LEENA CEYLON Lemon Tea",
    slug: "leena-ceylon-lemon-tea-500g",
    sku: "LC-LT-500",
    categoryId: "cat-4",
    shortDescription: "Premium Ceylon Tea infused with 100% natural lemon flavor. Refreshing taste and invigorating citrus aroma.",
    fullDescription: "Pure Ceylon Goodness crafted with 100% Natural Lemon Flavor. Sourced from high-grown mountain estates and packed under strict quality standards in resealable freshness barrier pouches.",
    teaType: "Flavored Ceylon Black Tea",
    teaGrade: "FBOP with Natural Citrus",
    origin: "Dimbula / Nuwara Eliya, Sri Lanka",
    regularPrice: 750,
    salePrice: 690,
    stock: 180,
    isFeatured: true,
    isActive: true,
    mainImage: "/uploads/leena-lemon-tea-500g.jpeg",
    brewingGuide: "Steep 1 teaspoon in 95°C water for 3 minutes. Can be served hot or cooled over ice for a revitalizing iced tea.",
    category: FALLBACK_CATEGORIES[3],
    sizes: [
      { id: "size-9", productId: "prod-3", sizeName: "250g", weightGram: 250, regularPrice: 420, salePrice: null, stock: 80, isActive: true },
      { id: "size-10", productId: "prod-3", sizeName: "500g", weightGram: 500, regularPrice: 750, salePrice: 690, stock: 100, isActive: true },
    ],
    images: [
      { id: "img-6", productId: "prod-3", url: "/uploads/leena-lemon-tea-500g.jpeg", sortOrder: 0 },
      { id: "img-7", productId: "prod-3", url: "/uploads/leena-lemon-tea-sun-500g.jpeg", sortOrder: 1 },
    ],
    reviews: [],
  },
  {
    id: "prod-4",
    name: "Pure Ceylon Organic Cinnamon",
    slug: "pure-ceylon-organic-cinnamon",
    sku: "LC-CIN-100",
    categoryId: "cat-5",
    shortDescription: "Authentic True Ceylon Cinnamon (Cinnamomum verum) celebrated worldwide for sweet taste and ultra-low coumarin.",
    fullDescription: "Finest quality single-estate Pure Ceylon Cinnamon quills from Sri Lanka. Handcrafted by master peelers using traditional age-old methods.",
    teaType: "Ceylon Spices",
    teaGrade: "Alba / C5 Special",
    origin: "Southern Coast & Central Highlands, Sri Lanka",
    regularPrice: 650,
    salePrice: null,
    stock: 90,
    isFeatured: false,
    isActive: true,
    mainImage: "/uploads/leena-tea-powder-50g-flat.jpeg",
    brewingGuide: "Add half a stick of Ceylon Cinnamon to your hot tea or steep in hot water with honey for a restorative warm infusion.",
    category: FALLBACK_CATEGORIES[4],
    sizes: [
      { id: "size-11", productId: "prod-4", sizeName: "100g", weightGram: 100, regularPrice: 650, salePrice: null, stock: 50, isActive: true },
      { id: "size-12", productId: "prod-4", sizeName: "250g", weightGram: 250, regularPrice: 1500, salePrice: 1350, stock: 40, isActive: true },
    ],
    images: [
      { id: "img-8", productId: "prod-4", url: "/uploads/leena-tea-powder-50g-flat.jpeg", sortOrder: 0 },
    ],
    reviews: [],
  },
];
