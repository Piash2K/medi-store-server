import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME;
const adminPhone = process.env.ADMIN_PHONE;
const adminAddress = process.env.ADMIN_ADDRESS;

const seedAdmin = async () => {
  if (!adminEmail || !adminPassword || !adminName) {
    throw new Error(
      "Missing required environment variables: ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME are required"
    );
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      name: adminName,
      password: hashedPassword,
      role: "ADMIN",
      status: "UNBAN",
      phone: adminPhone,
      address: adminAddress,
    },
    create: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      status: "UNBAN",
      phone: adminPhone,
      address: adminAddress,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  console.log("Admin seeded successfully:", admin);
};

seedAdmin()
  .catch((error) => {
    console.error("Failed to seed admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
