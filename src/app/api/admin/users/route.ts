import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const current = await getCurrentAdmin();
    if (!current || current.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const admins = await prisma.adminUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        roleName: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, admins });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load admins" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const current = await getCurrentAdmin();
    if (!current || current.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, email, password, roleName } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newAdmin = await prisma.adminUser.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        roleName: roleName || "MANAGER",
        isActive: true,
      },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: current.id,
        adminName: current.name,
        action: "CREATE_ADMIN",
        details: `Created admin user ${newAdmin.email} with role ${newAdmin.roleName}`,
        entityType: "AdminUser",
        entityId: newAdmin.id,
      },
    });

    return NextResponse.json({ success: true, admin: newAdmin });
  } catch (err: any) {
    console.error("Create admin error:", err);
    return NextResponse.json(
      { error: "Failed to create administrator" },
      { status: 500 }
    );
  }
}
