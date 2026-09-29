import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const envKeys = Object.keys(process.env).filter(
    (k) =>
      k.includes("DATABASE") ||
      k.includes("POSTGRES") ||
      k.includes("SQL") ||
      k.includes("PRISMA") ||
      k.includes("KV") ||
      k.includes("BLOB") ||
      k.includes("STORAGE")
  );

  return NextResponse.json({
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(0, 15) : null,
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL),
    envKeys,
  });
}
