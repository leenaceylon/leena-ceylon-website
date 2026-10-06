import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const current = await getCurrentAdmin();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Allow SUPER_ADMIN and MANAGER to view the team members directory
    if (current.role !== "SUPER_ADMIN" && current.role !== "MANAGER") {
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
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      admins,
      currentAdmin: {
        id: current.id,
        name: current.name,
        email: current.email,
        role: current.role,
        isSuperAdmin: current.role === "SUPER_ADMIN",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load admins" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const current = await getCurrentAdmin();
    if (!current || current.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only Super Admin can create accounts." },
        { status: 403 }
      );
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

export async function PUT(req: NextRequest) {
  try {
    const current = await getCurrentAdmin();
    if (!current || current.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only Super Admin has permission to modify administrator accounts." },
        { status: 403 }
      );
    }

    const { id, name, email, roleName, isActive, password } = await req.json();

    if (!id || !name || !email) {
      return NextResponse.json({ error: "ID, Name and Email are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if target user exists
    const existing = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    // If changing email, check uniqueness
    if (cleanEmail !== existing.email) {
      const emailConflict = await prisma.adminUser.findUnique({
        where: { email: cleanEmail },
      });
      if (emailConflict && emailConflict.id !== id) {
        return NextResponse.json({ error: "Email already in use by another admin" }, { status: 400 });
      }
    }

    // Don't allow Super Admin to deactivate their own account or remove Super Admin role from themselves
    if (existing.id === current.id) {
      if (isActive === false) {
        return NextResponse.json({ error: "You cannot deactivate your own Super Admin account" }, { status: 400 });
      }
      if (roleName && roleName !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "You cannot demote your own Super Admin role" }, { status: 400 });
      }
    }

    const updateData: any = {
      name: name.trim(),
      email: cleanEmail,
      roleName: roleName || existing.roleName,
      isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
    };

    if (password && password.trim().length >= 6) {
      updateData.passwordHash = await hashPassword(password.trim());
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        roleName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: current.id,
        adminName: current.name,
        action: "UPDATE_ADMIN",
        details: `Updated admin ${updated.email} (Role: ${updated.roleName}, Active: ${updated.isActive})`,
        entityType: "AdminUser",
        entityId: updated.id,
      },
    });

    return NextResponse.json({ success: true, admin: updated });
  } catch (err: any) {
    console.error("Modify admin error:", err);
    return NextResponse.json({ error: err.message || "Failed to update admin account" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const current = await getCurrentAdmin();
    if (!current || current.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only Super Admin has permission to delete administrator accounts." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 });
    }

    if (id === current.id) {
      return NextResponse.json({ error: "You cannot delete your own Super Admin account." }, { status: 400 });
    }

    const target = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!target) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    // Safeguard master email if configured
    if (target.email === "admin@leenaceylon.com") {
      return NextResponse.json({ error: "Primary system administrator cannot be deleted" }, { status: 400 });
    }

    // Safely unlink adminActivityLogs to satisfy foreign key constraints while preserving historical logs
    await prisma.adminActivityLog.updateMany({
      where: { adminId: id },
      data: { adminId: null },
    });

    // Delete the admin user
    await prisma.adminUser.delete({
      where: { id },
    });

    // Log the deletion action
    await prisma.adminActivityLog.create({
      data: {
        adminId: current.id,
        adminName: current.name,
        action: "DELETE_ADMIN",
        details: `Permanently deleted admin account ${target.email} (${target.name}, Role: ${target.roleName})`,
        entityType: "AdminUser",
        entityId: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Admin account ${target.email} was successfully deleted`,
    });
  } catch (err: any) {
    console.error("Delete admin error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete administrator account" }, { status: 500 });
  }
}
