import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("orderNumber");
  const phone = searchParams.get("phone");
  const q = searchParams.get("q");

  if (orderNumber && orderNumber.trim()) {
    return NextResponse.redirect(
      new URL(`/track?orderNumber=${encodeURIComponent(orderNumber.trim())}`, request.url)
    );
  }

  if (phone && phone.trim()) {
    return NextResponse.redirect(
      new URL(`/track?phone=${encodeURIComponent(phone.trim())}`, request.url)
    );
  }

  if (q && q.trim()) {
    return NextResponse.redirect(
      new URL(`/track?q=${encodeURIComponent(q.trim())}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/track", request.url));
}
