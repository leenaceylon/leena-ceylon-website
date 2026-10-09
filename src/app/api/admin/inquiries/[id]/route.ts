import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json();
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const inquiry = await prisma.inquiry.update({
      where: { id: params.id },
      data: { status },
    });

    try {
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "UPDATE_INQUIRY_STATUS",
          details: `Updated inquiry from "${inquiry.name}" to status: ${status}`,
          entityType: "Inquiry",
          entityId: inquiry.id,
        },
      });
    } catch {}

    return NextResponse.json({ success: true, inquiry });
  } catch (err: any) {
    console.error("Failed to update inquiry:", err);
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await prisma.inquiry.delete({
      where: { id: params.id },
    });

    try {
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "DELETE_INQUIRY",
          details: `Deleted inquiry from "${deleted.name}" (${deleted.subject})`,
          entityType: "Inquiry",
          entityId: deleted.id,
        },
      });
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete inquiry:", err);
    return NextResponse.json({ error: "Failed to delete inquiry" }, { status: 500 });
  }
}
