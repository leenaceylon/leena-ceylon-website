import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, subject, message } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: (email || "").trim(),
        subject: (subject || "General Inquiry").trim(),
        message: message.trim(),
        status: "UNREAD",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Inquiry submitted successfully",
      inquiryId: inquiry.id,
    });
  } catch (err: any) {
    console.error("Failed to save customer inquiry:", err);
    return NextResponse.json(
      { error: "Failed to submit inquiry. Please try again or contact via WhatsApp." },
      { status: 500 }
    );
  }
}
