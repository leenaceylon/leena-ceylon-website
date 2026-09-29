import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const envKeys = [
    "leenaceylon_PRISMA_DATABASE_URL",
    "leenaceylon_POSTGRES_URL",
    "leenaceylon_DATABASE_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL",
    "DATABASE_URL",
  ];

  const results: Record<string, any> = {};

  for (const k of envKeys) {
    const val = process.env[k];
    if (!val) {
      results[k] = { exists: false };
      continue;
    }

    try {
      const u = new URL(val);
      results[k] = {
        exists: true,
        protocol: u.protocol,
        host: u.host,
        pathname: u.pathname,
        search: u.search,
        length: val.length,
      };
    } catch {
      results[k] = {
        exists: true,
        protocol: val.split(":")[0],
        length: val.length,
      };
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    results,
    allMatchingKeys: Object.keys(process.env).filter(
      (k) => k.includes("leenaceylon") || k.includes("DATABASE") || k.includes("POSTGRES")
    ),
  });
}
