import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SessionUser } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "leena-ceylon-super-secure-production-secret-key-2026"
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signCustomerToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: "CUSTOMER",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function signAdminToken(admin: SessionUser): Promise<string> {
  return new SignJWT({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function getCurrentCustomer(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("lc_customer_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentAdmin(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("lc_admin_token")?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session || !["SUPER_ADMIN", "MANAGER", "PRODUCT_MANAGER", "ORDER_MANAGER", "SHOP_ORDER_REP"].includes(session.role)) {
    return null;
  }
  return session;
}
