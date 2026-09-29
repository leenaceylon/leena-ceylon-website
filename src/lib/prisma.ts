import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

declare global {
  var prisma: PrismaClient | undefined;
}

function getPrismaClient(): PrismaClient {
  let dbUrl: string | undefined = undefined;

  // In Vercel serverless / AWS Lambda, /var/task is read-only.
  // Copy SQLite dev.db to writable /tmp directory so writes succeed.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      const tmpDbPath = path.join("/tmp", "dev.db");
      const sourceDbPath = path.join(process.cwd(), "prisma", "dev.db");

      if (!fs.existsSync(tmpDbPath)) {
        if (fs.existsSync(sourceDbPath)) {
          fs.copyFileSync(sourceDbPath, tmpDbPath);
          try {
            fs.chmodSync(tmpDbPath, 0o666);
          } catch {}
        }
      }

      if (fs.existsSync(tmpDbPath)) {
        dbUrl = `file:${tmpDbPath}`;
      }
    } catch (e: any) {
      console.warn("Could not copy database to /tmp:", e?.message);
    }
  }

  return new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = global.prisma || getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
