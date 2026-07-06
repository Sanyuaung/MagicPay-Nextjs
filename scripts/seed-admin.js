const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

function loadDotEnvIfPresent() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    if (process.env[key] !== undefined) continue;

    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

async function run() {
  loadDotEnvIfPresent();

  const prisma = new PrismaClient();

  try {
    const password = await bcrypt.hash("Admin123", 10);

    await prisma.adminUser.upsert({
      where: { email: "admin@magicpay.local" },
      update: {
        name: "Admin",
        phone: "09900000000",
        password,
      },
      create: {
        name: "Admin",
        email: "admin@magicpay.local",
        phone: "09900000000",
        password,
      },
    });

    console.log("Seeded admin user: admin@magicpay.local / Admin123");
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error("seed-admin failed:", error);
  process.exit(1);
});
