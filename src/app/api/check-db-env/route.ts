import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "LeenaCeylon@2026!") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUrl =
    process.env.leenaceylon_PRISMA_DATABASE_URL ||
    process.env.leenaceylon_POSTGRES_URL ||
    process.env.leenaceylon_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    "";

  return NextResponse.json({
    dbUrl,
  });
}
