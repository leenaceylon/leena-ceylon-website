import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("orderNumber");

  if (!orderNumber || !orderNumber.trim()) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return NextResponse.redirect(
    new URL(`/account/orders/${encodeURIComponent(orderNumber.trim())}`, request.url)
  );
}
