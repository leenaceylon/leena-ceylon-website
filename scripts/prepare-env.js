const fs = require("fs");
const path = require("path");

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.leenaceylon_PRISMA_DATABASE_URL ||
  process.env.leenaceylon_POSTGRES_URL ||
  process.env.leenaceylon_DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (dbUrl) {
  const envPath = path.join(process.cwd(), ".env");
  let currentContent = "";
  if (fs.existsSync(envPath)) {
    currentContent = fs.readFileSync(envPath, "utf8");
  }

  if (!currentContent.includes("DATABASE_URL=")) {
    fs.appendFileSync(envPath, `\nDATABASE_URL="${dbUrl}"\n`);
    console.log("[prepare-env] Injected DATABASE_URL into .env for build.");
  } else if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
    const updated = currentContent.replace(/DATABASE_URL="[^"]*"/g, `DATABASE_URL="${dbUrl}"`);
    fs.writeFileSync(envPath, updated);
    console.log("[prepare-env] Updated DATABASE_URL in .env with PostgreSQL connection.");
  }
  process.env.DATABASE_URL = dbUrl;
} else {
  console.log("[prepare-env] No Postgres URL detected in environment, keeping current configuration.");
}
