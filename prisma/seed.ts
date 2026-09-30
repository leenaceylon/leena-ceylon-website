import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding LEENA CEYLON database...");

  // 1. Create Super Admin
  const adminPasswordHash = await bcrypt.hash("LeenaCeylon@2026!", 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@leenaceylon.com" },
    update: {
      name: "LEENA Ceylon Admin",
      passwordHash: adminPasswordHash,
      roleName: "SUPER_ADMIN",
    },
    create: {
      name: "LEENA Ceylon Admin",
      email: "admin@leenaceylon.com",
      passwordHash: adminPasswordHash,
      roleName: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log("Admin user created/verified:", admin.email);

  // 2. Default Categories
  const categoriesData = [
    {
      name: "Tea Powder",
      slug: "tea-powder",
      description: "Authentic pure Ceylon tea powder with rich aroma, brisk liquor, and beautiful natural colour.",
      image: "/uploads/leena-tea-powder-200g.jpeg",
      sortOrder: 1,
    },
    {
      name: "Ceylon Black Tea",
      slug: "ceylon-black-tea",
      description: "Orthodox whole leaf and broken grades from Sri Lanka's renowned high-elevation tea estates.",
      image: "/uploads/leena-bopf-tin-250g.jpeg",
      sortOrder: 2,
    },
    {
      name: "Premium Tin Collection",
      slug: "premium-tin-collection",
      description: "Airtight luxury metal canisters preserving freshness and natural aroma for tea lovers.",
      image: "/uploads/leena-bopf-tin-250g.jpeg",
      sortOrder: 3,
    },
    {
      name: "Flavored Ceylon Tea",
      slug: "flavored-ceylon-tea",
      description: "Lush Ceylon tea leaves married with real natural lemon and citrus extracts.",
      image: "/uploads/leena-lemon-tea-500g.jpeg",
      sortOrder: 4,
    },
    {
      name: "Ceylon Spices & Cinnamon",
      slug: "ceylon-spices",
      description: "Authentic True Ceylon Cinnamon and organic spices harvested directly from Sri Lankan estates.",
      image: "/uploads/leena-tea-powder-50g-flat.jpeg",
      sortOrder: 5,
    },
  ];

  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoriesMap[cat.slug] = created.id;
  }
  console.log("Categories seeded successfully.");

  // 3. Products
  // Product 1: LEENA Ceylon Tea Powder
  const p1 = await prisma.product.upsert({
    where: { slug: "leena-ceylon-tea-powder" },
    update: {
      name: "LEENA CEYLON Pure Tea Powder",
      sku: "LC-TP-01",
      categoryId: categoriesMap["tea-powder"],
      shortDescription: "100% Pure Ceylon Tea Powder carefully selected from finest Ceylon tea gardens with rich aroma and beautiful colour.",
      fullDescription: "Carefully selected from the finest Ceylon tea gardens, LEENA CEYLON tea brings you the authentic taste, rich aroma, and natural goodness of pure Ceylon tea. Handpicked from the lush green hills of Sri Lanka. Perfect cup for every moment.\n\nPacked & Distributed by LEENA CEYLON (PVT) LTD, A/Bandarapothana, Pubbogama, Kekirawa, Sri Lanka.",
      teaType: "Pure Ceylon Black Tea",
      teaGrade: "BOPF / DUST (Premium Quality)",
      origin: "Nuwara Eliya & Kekirawa, Sri Lanka",
      regularPrice: 260,
      salePrice: null,
      stock: 250,
      lowStockThreshold: 15,
      isFeatured: true,
      isActive: true,
      mainImage: "/uploads/leena-tea-powder-200g.jpeg",
      brewingGuide: "1. Boil fresh water to a rolling boil.\n2. Use 1 teaspoon (2g) of Leena Ceylon Tea per cup.\n3. Pour boiling water and steep for 3-5 minutes.\n4. Enjoy your perfect cup of pure Ceylon Tea.",
    },
    create: {
      name: "LEENA CEYLON Pure Tea Powder",
      slug: "leena-ceylon-tea-powder",
      sku: "LC-TP-01",
      categoryId: categoriesMap["tea-powder"],
      shortDescription: "100% Pure Ceylon Tea Powder carefully selected from finest Ceylon tea gardens with rich aroma and beautiful colour.",
      fullDescription: "Carefully selected from the finest Ceylon tea gardens, LEENA CEYLON tea brings you the authentic taste, rich aroma, and natural goodness of pure Ceylon tea. Handpicked from the lush green hills of Sri Lanka. Perfect cup for every moment.\n\nPacked & Distributed by LEENA CEYLON (PVT) LTD, A/Bandarapothana, Pubbogama, Kekirawa, Sri Lanka.",
      teaType: "Pure Ceylon Black Tea",
      teaGrade: "BOPF / DUST (Premium Quality)",
      origin: "Nuwara Eliya & Kekirawa, Sri Lanka",
      regularPrice: 260,
      salePrice: null,
      stock: 250,
      lowStockThreshold: 15,
      isFeatured: true,
      isActive: true,
      mainImage: "/uploads/leena-tea-powder-200g.jpeg",
      brewingGuide: "1. Boil fresh water to a rolling boil.\n2. Use 1 teaspoon (2g) of Leena Ceylon Tea per cup.\n3. Pour boiling water and steep for 3-5 minutes.\n4. Enjoy your perfect cup of pure Ceylon Tea.",
      sizes: {
        create: [
          { sizeName: "50g", weightGram: 50, regularPrice: 75, stock: 150 },
          { sizeName: "100g", weightGram: 100, regularPrice: 140, stock: 100 },
          { sizeName: "200g", weightGram: 200, regularPrice: 260, stock: 120 },
          { sizeName: "250g", weightGram: 250, regularPrice: 320, stock: 80 },
          { sizeName: "500g", weightGram: 500, regularPrice: 620, stock: 50 },
          { sizeName: "1kg", weightGram: 1000, regularPrice: 1200, stock: 30 },
        ],
      },
      images: {
        create: [
          { url: "/uploads/leena-tea-powder-200g.jpeg", altText: "LEENA Ceylon Tea Powder 200g Pouch Front and Back", isMain: true, sortOrder: 0 },
          { url: "/uploads/leena-tea-powder-50g-flat.jpeg", altText: "LEENA Ceylon Tea Powder 50g Pouch Flatlay", isMain: false, sortOrder: 1 },
          { url: "/uploads/leena-tea-powder-50g-back.jpeg", altText: "LEENA Ceylon Tea Powder 50g Back Label", isMain: false, sortOrder: 2 },
        ],
      },
    },
  });

  // Product 2: LEENA Ceylon BOPF Premium Tin
  const p2 = await prisma.product.upsert({
    where: { slug: "leena-ceylon-bopf-tin-250g" },
    update: {
      name: "LEENA CEYLON BOPF Premium Tin",
      sku: "LC-TIN-250",
      categoryId: categoriesMap["premium-tin-collection"],
      shortDescription: "Finest quality 100% Pure Ceylon BOPF packaged in an airtight luxury tin caddy for enduring freshness.",
      fullDescription: "LEENA CEYLON Tea is a premium blend of finest Ceylon tea leaves, handpicked from the lush green hills of Sri Lanka. Rich in taste, natural in aroma. A perfect cup for every moment. Preserved in a protective reusable food-grade tin canister.\n\nPacked & Marketed by LEENA CEYLON (PVT) LTD, A/Bandarapothana, Pubbogama, Kekirawa, Sri Lanka.",
      teaType: "Pure Ceylon Black Tea",
      teaGrade: "BOPF (Broken Orange Pekoe Fannings)",
      origin: "Nuwara Eliya, High Grown (6,000+ ft), Sri Lanka",
      regularPrice: 490,
      salePrice: null,
      stock: 140,
      lowStockThreshold: 10,
      isFeatured: true,
      isActive: true,
      mainImage: "/uploads/leena-bopf-tin-250g.jpeg",
      brewingGuide: "Bring fresh water to 100°C boil. Add 2g of Leena BOPF tea into a warmed teapot. Steep for 3-5 minutes. Serve straight or with a touch of milk.",
    },
    create: {
      name: "LEENA CEYLON BOPF Premium Tin",
      slug: "leena-ceylon-bopf-tin-250g",
      sku: "LC-TIN-250",
      categoryId: categoriesMap["premium-tin-collection"],
      shortDescription: "Finest quality 100% Pure Ceylon BOPF packaged in an airtight luxury tin caddy for enduring freshness.",
      fullDescription: "LEENA CEYLON Tea is a premium blend of finest Ceylon tea leaves, handpicked from the lush green hills of Sri Lanka. Rich in taste, natural in aroma. A perfect cup for every moment. Preserved in a protective reusable food-grade tin canister.\n\nPacked & Marketed by LEENA CEYLON (PVT) LTD, A/Bandarapothana, Pubbogama, Kekirawa, Sri Lanka.",
      teaType: "Pure Ceylon Black Tea",
      teaGrade: "BOPF (Broken Orange Pekoe Fannings)",
      origin: "Nuwara Eliya, High Grown (6,000+ ft), Sri Lanka",
      regularPrice: 490,
      salePrice: null,
      stock: 140,
      lowStockThreshold: 10,
      isFeatured: true,
      isActive: true,
      mainImage: "/uploads/leena-bopf-tin-250g.jpeg",
      brewingGuide: "Bring fresh water to 100°C boil. Add 2g of Leena BOPF tea into a warmed teapot. Steep for 3-5 minutes. Serve straight or with a touch of milk.",
      sizes: {
        create: [
          { sizeName: "250g", weightGram: 250, regularPrice: 490, stock: 90 },
          { sizeName: "500g", weightGram: 500, regularPrice: 950, salePrice: 890, stock: 50 },
        ],
      },
      images: {
        create: [
          { url: "/uploads/leena-bopf-tin-250g.jpeg", altText: "LEENA Ceylon BOPF 250g Tin Canister Front and Back", isMain: true, sortOrder: 0 },
          { url: "/uploads/leena-tea-pack-back.jpeg", altText: "LEENA Ceylon BOPF Brewing & Packaging Information", isMain: false, sortOrder: 1 },
        ],
      },
    },
  });

  // Product 3: LEENA Ceylon Lemon Tea
  const p3 = await prisma.product.upsert({
    where: { slug: "leena-ceylon-lemon-tea-500g" },
    update: {
      name: "LEENA CEYLON Lemon Tea",
      sku: "LC-LT-500",
      categoryId: categoriesMap["flavored-ceylon-tea"],
      shortDescription: "Premium Ceylon Tea infused with 100% natural lemon flavor. Refreshing taste and invigorating citrus aroma.",
      fullDescription: "Pure Ceylon Goodness crafted with 100% Natural Lemon Flavor. Delivers a rich aroma and refreshing taste that rejuvenates your senses. Sourced from high-grown mountain estates and packed under strict quality standards in resealable freshness barrier pouches.",
      teaType: "Flavored Ceylon Black Tea",
      teaGrade: "FBOP with Natural Citrus",
      origin: "Dimbula / Nuwara Eliya, Sri Lanka",
      regularPrice: 750,
      salePrice: 690,
      stock: 180,
      lowStockThreshold: 15,
      isFeatured: true,
      isActive: true,
      mainImage: "/uploads/leena-lemon-tea-500g.jpeg",
      brewingGuide: "Steep 1 teaspoon in 95°C water for 3 minutes. Can be served hot with a slice of fresh lemon, or cooled over ice for a revitalizing iced lemon tea.",
    },
    create: {
      name: "LEENA CEYLON Lemon Tea",
      slug: "leena-ceylon-lemon-tea-500g",
      sku: "LC-LT-500",
      categoryId: categoriesMap["flavored-ceylon-tea"],
      shortDescription: "Premium Ceylon Tea infused with 100% natural lemon flavor. Refreshing taste and invigorating citrus aroma.",
      fullDescription: "Pure Ceylon Goodness crafted with 100% Natural Lemon Flavor. Delivers a rich aroma and refreshing taste that rejuvenates your senses. Sourced from high-grown mountain estates and packed under strict quality standards in resealable freshness barrier pouches.",
      teaType: "Flavored Ceylon Black Tea",
      teaGrade: "FBOP with Natural Citrus",
      origin: "Dimbula / Nuwara Eliya, Sri Lanka",
      regularPrice: 750,
      salePrice: 690,
      stock: 180,
      lowStockThreshold: 15,
      isFeatured: true,
      isActive: true,
      mainImage: "/uploads/leena-lemon-tea-500g.jpeg",
      brewingGuide: "Steep 1 teaspoon in 95°C water for 3 minutes. Can be served hot with a slice of fresh lemon, or cooled over ice for a revitalizing iced lemon tea.",
      sizes: {
        create: [
          { sizeName: "250g", weightGram: 250, regularPrice: 420, stock: 80 },
          { sizeName: "500g", weightGram: 500, regularPrice: 750, salePrice: 690, stock: 100 },
        ],
      },
      images: {
        create: [
          { url: "/uploads/leena-lemon-tea-500g.jpeg", altText: "LEENA Ceylon Lemon Tea 500g Pouch Packaging", isMain: true, sortOrder: 0 },
          { url: "/uploads/leena-lemon-tea-sun-500g.jpeg", altText: "LEENA Ceylon Lemon Tea Landscape View", isMain: false, sortOrder: 1 },
        ],
      },
    },
  });

  // Product 4: Ceylon Spices & True Cinnamon
  const p4 = await prisma.product.upsert({
    where: { slug: "pure-ceylon-organic-cinnamon" },
    update: {
      name: "Pure Ceylon Organic Cinnamon",
      sku: "LC-CIN-100",
      categoryId: categoriesMap["ceylon-spices"],
      shortDescription: "Authentic True Ceylon Cinnamon (Cinnamomum verum) celebrated worldwide for sweet taste and ultra-low coumarin.",
      fullDescription: "Finest quality single-estate Pure Ceylon Cinnamon quills from Sri Lanka. Handcrafted by master peelers using traditional age-old methods. Naturally sweet, fragrant, and health-protective.",
      teaType: "Ceylon Spices",
      teaGrade: "Alba / C5 Special",
      origin: "Southern Coast & Central Highlands, Sri Lanka",
      regularPrice: 650,
      salePrice: null,
      stock: 90,
      lowStockThreshold: 10,
      isFeatured: false,
      isActive: true,
      mainImage: "/uploads/leena-tea-powder-50g-flat.jpeg",
      brewingGuide: "Add half a stick of Ceylon Cinnamon to your hot tea or steep in hot water with honey for a restorative warm infusion.",
    },
    create: {
      name: "Pure Ceylon Organic Cinnamon",
      slug: "pure-ceylon-organic-cinnamon",
      sku: "LC-CIN-100",
      categoryId: categoriesMap["ceylon-spices"],
      shortDescription: "Authentic True Ceylon Cinnamon (Cinnamomum verum) celebrated worldwide for sweet taste and ultra-low coumarin.",
      fullDescription: "Finest quality single-estate Pure Ceylon Cinnamon quills from Sri Lanka. Handcrafted by master peelers using traditional age-old methods. Naturally sweet, fragrant, and health-protective.",
      teaType: "Ceylon Spices",
      teaGrade: "Alba / C5 Special",
      origin: "Southern Coast & Central Highlands, Sri Lanka",
      regularPrice: 650,
      salePrice: null,
      stock: 90,
      lowStockThreshold: 10,
      isFeatured: false,
      isActive: true,
      mainImage: "/uploads/leena-tea-powder-50g-flat.jpeg",
      brewingGuide: "Add half a stick of Ceylon Cinnamon to your hot tea or steep in hot water with honey for a restorative warm infusion.",
      sizes: {
        create: [
          { sizeName: "100g", weightGram: 100, regularPrice: 650, stock: 50 },
          { sizeName: "250g", weightGram: 250, regularPrice: 1500, salePrice: 1350, stock: 40 },
        ],
      },
      images: {
        create: [
          { url: "/uploads/leena-tea-powder-50g-flat.jpeg", altText: "Pure Ceylon Organic Cinnamon Quills", isMain: true, sortOrder: 0 },
        ],
      },
    },
  });

  console.log("Products seeded:", p1.name, p2.name, p3.name, p4.name);

  // 4. Seed Settings
  const settingsData = [
    { key: "brandName", value: "LEENA CEYLON", group: "GENERAL" },
    { key: "brandTagline", value: "PURE CEYLON TEA", group: "GENERAL" },
    { key: "secondaryTagline", value: "THE TASTE OF CEYLON", group: "GENERAL" },
    { key: "logoUrl", value: "/brand/logo.png", group: "GENERAL" },
    { key: "faviconUrl", value: "/brand/logo.png", group: "GENERAL" },
    { key: "currencySymbol", value: "Rs.", group: "GENERAL" },
    { key: "phone", value: "071 777 4717", group: "CONTACT" },
    { key: "whatsappNumber", value: "071 777 4717", group: "WHATSAPP" },
    { key: "email", value: "info@leenaceylon.com", group: "CONTACT" },
    { key: "address", value: "LEENA CEYLON (PVT) LTD, A/Bandarapothana, Pubbogama, Kekirawa, Sri Lanka", group: "CONTACT" },
    { key: "facebookUrl", value: "https://facebook.com/leenaceylon", group: "SOCIAL" },
    { key: "instagramUrl", value: "https://instagram.com/leenaceylon", group: "SOCIAL" },
    { key: "tiktokUrl", value: "https://tiktok.com/@leenaceylon", group: "SOCIAL" },
    { key: "youtubeUrl", value: "https://youtube.com/@leenaceylon", group: "SOCIAL" },
    { key: "standardDeliveryFee", value: "350", group: "DELIVERY" },
    { key: "freeDeliveryThreshold", value: "3500", group: "DELIVERY" },
    { key: "minOrderAmount", value: "500", group: "DELIVERY" },
    { key: "cashOnDeliveryEnabled", value: "true", group: "PAYMENT" },
    { key: "bankTransferEnabled", value: "true", group: "PAYMENT" },
    { key: "bankName", value: "Commercial Bank of Ceylon PLC", group: "PAYMENT" },
    { key: "bankAccountName", value: "LEENA CEYLON (PVT) LTD", group: "PAYMENT" },
    { key: "bankAccountNumber", value: "1000 2489 7120", group: "PAYMENT" },
    { key: "bankBranch", value: "Kekirawa Branch", group: "PAYMENT" },
    { key: "bankSwiftCode", value: "CCEYLKLX", group: "PAYMENT" },
    { key: "bankInstructions", value: "Please transfer the total amount and share your payment receipt / bank slip screenshot in the WhatsApp chat.", group: "PAYMENT" },
    { key: "bank2Name", value: "", group: "PAYMENT" },
    { key: "bank2AccountName", value: "", group: "PAYMENT" },
    { key: "bank2AccountNumber", value: "", group: "PAYMENT" },
    { key: "bank2Branch", value: "", group: "PAYMENT" },
    {
      key: "bankDetails",
      value: "Bank: Commercial Bank of Ceylon PLC\nAccount Name: LEENA CEYLON (PVT) LTD\nAccount No: 1000 2489 7120\nBranch: Kekirawa Branch\nSwift: CCEYLKLX",
      group: "PAYMENT",
    },
    { key: "whatsappButtonText", value: "ORDER VIA WHATSAPP", group: "WHATSAPP" },
    {
      key: "whatsappTemplate",
      value: "Hello LEENA CEYLON,\n\nI would like to order:\n\nProduct: {{product_name}}\nSize: {{size}}\nQuantity: {{quantity}}\nPrice: Rs. {{price}} each\nProduct Total: Rs. {{total}}\n\nPlease confirm availability and delivery charges.\n\nThank you.",
      group: "WHATSAPP",
    },
    { key: "whatsappEnabled", value: "true", group: "WHATSAPP" },
    { key: "seoTitle", value: "LEENA CEYLON | Pure Ceylon Tea - The Taste of Ceylon", group: "SEO" },
    {
      key: "seoDescription",
      value: "Discover the authentic taste, aroma and character of 100% Pure Ceylon Tea from Sri Lanka. Handpicked from lush green hills.",
      group: "SEO",
    },
  ];

  for (const s of settingsData) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group },
      create: s,
    });
  }
  console.log("Settings seeded successfully.");

  // 5. Register Media items
  const mediaItems = [
    { filename: "logo.png", originalName: "Official LEENA CEYLON Logo", mimeType: "image/png", size: 289556, url: "/brand/logo.png", altText: "Official LEENA CEYLON Logo" },
    { filename: "leena-tea-powder-200g.jpeg", originalName: "LEENA Ceylon Tea Powder 200g", mimeType: "image/jpeg", size: 320213, url: "/uploads/leena-tea-powder-200g.jpeg", altText: "LEENA Ceylon Tea Powder 200g Pack" },
    { filename: "leena-tea-powder-50g-flat.jpeg", originalName: "LEENA Ceylon Tea Powder 50g Flat", mimeType: "image/jpeg", size: 315292, url: "/uploads/leena-tea-powder-50g-flat.jpeg", altText: "LEENA Ceylon Tea Powder 50g Pack" },
    { filename: "leena-tea-powder-50g-back.jpeg", originalName: "LEENA Ceylon Tea Powder 50g Back", mimeType: "image/jpeg", size: 309316, url: "/uploads/leena-tea-powder-50g-back.jpeg", altText: "LEENA Ceylon Tea Powder 50g Back Label" },
    { filename: "leena-bopf-tin-250g.jpeg", originalName: "LEENA Ceylon BOPF 250g Tin Canister", mimeType: "image/jpeg", size: 289539, url: "/uploads/leena-bopf-tin-250g.jpeg", altText: "LEENA Ceylon BOPF 250g Tin" },
    { filename: "leena-tea-pack-back.jpeg", originalName: "LEENA Ceylon Tea Back Details", mimeType: "image/jpeg", size: 298197, url: "/uploads/leena-tea-pack-back.jpeg", altText: "LEENA Ceylon BOPF Tea Pouch Back" },
    { filename: "leena-lemon-tea-500g.jpeg", originalName: "LEENA Ceylon Lemon Tea 500g", mimeType: "image/jpeg", size: 251734, url: "/uploads/leena-lemon-tea-500g.jpeg", altText: "LEENA Ceylon Lemon Tea 500g Pouch" },
    { filename: "leena-lemon-tea-sun-500g.jpeg", originalName: "LEENA Ceylon Lemon Tea Sun 500g", mimeType: "image/jpeg", size: 232779, url: "/uploads/leena-lemon-tea-sun-500g.jpeg", altText: "LEENA Ceylon Lemon Tea Sun 500g" },
  ];

  for (const m of mediaItems) {
    const existing = await prisma.media.findFirst({ where: { url: m.url } });
    if (!existing) {
      await prisma.media.create({ data: m });
    }
  }
  console.log("Media catalog seeded successfully.");

  // 6. Seed a sample real customer review to show approval workflow
  const reviewCount = await prisma.review.count();
  if (reviewCount === 0) {
    await prisma.review.create({
      data: {
        productId: p2.id,
        customerName: "Dinesh Perera",
        email: "dinesh@example.com",
        rating: 5,
        comment: "Exceptional BOPF Ceylon tea. The aroma when opening the tin is intoxicating, and the colour in the cup is a rich deep amber. Proud of this Sri Lankan export!",
        isApproved: true,
      },
    });
    console.log("Sample approved review seeded.");
  }

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
