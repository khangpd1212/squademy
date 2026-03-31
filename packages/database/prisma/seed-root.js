/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  // Load common env files so DATABASE_URL is available when running manually.
  loadEnvFile(path.resolve(__dirname, "../.env"));
  loadEnvFile(path.resolve(__dirname, "../../../.env"));

  const rootEmail = process.env.ROOT_EMAIL || "root@squademy.local";
  const rootPassword = process.env.ROOT_PASSWORD || "123456";
  const rootDisplayName = process.env.ROOT_DISPLAY_NAME || "Root";

  if (rootPassword.length < 6) {
    throw new Error("ROOT_PASSWORD must be at least 6 characters");
  }

  const passwordHash = await bcrypt.hash(rootPassword, 12);

  const rootUser = await prisma.user.upsert({
    where: { email: rootEmail.toLowerCase() },
    update: {
      passwordHash,
      displayName: rootDisplayName,
      acceptPrivacyAt: new Date(),
    },
    create: {
      email: rootEmail.toLowerCase(),
      passwordHash,
      displayName: rootDisplayName,
      acceptPrivacyAt: new Date(),
    },
  });

  console.log("Root user ready:", {
    id: rootUser.id,
    email: rootUser.email,
    displayName: rootUser.displayName,
  });
}

main()
  .catch((error) => {
    console.error("Failed to seed root user:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
