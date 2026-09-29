import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { FALLBACK_PRODUCTS, FALLBACK_CATEGORIES } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const cwd = process.cwd();
  const prismaDevDbPath = path.join(cwd, "prisma", "dev.db");
  const rootDevDbPath = path.join(cwd, "dev.db");

  const filesInCwd = fs.existsSync(cwd) ? fs.readdirSync(cwd) : [];
  const filesInPrisma = fs.existsSync(path.join(cwd, "prisma"))
    ? fs.readdirSync(path.join(cwd, "prisma"))
    : [];

  let prismaError: any = null;
  let prismaProductsCount = 0;
  let productsSample: any = null;

  try {
    const products = await prisma.product.findMany({
      take: 2,
      include: { sizes: true, category: true },
    });
    prismaProductsCount = products.length;
    productsSample = products;
  } catch (err: any) {
    prismaError = {
      message: err.message,
      code: err.code,
      name: err.name,
      stack: err.stack,
    };
  }

  return NextResponse.json({
    cwd,
    prismaDevDbExists: fs.existsSync(prismaDevDbPath),
    rootDevDbExists: fs.existsSync(rootDevDbPath),
    filesInCwd,
    filesInPrisma,
    prismaError,
    prismaProductsCount,
    productsSample,
    fallbackProductsCount: FALLBACK_PRODUCTS.length,
    fallbackCategoriesCount: FALLBACK_CATEGORIES.length,
  });
}
