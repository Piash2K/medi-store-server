import { prisma } from "../../lib/prisma";

const getAllUsersFromDB = async (adminId: string) => {
  const admin = await prisma.user.findUnique({
    where: {
      id: adminId,
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!admin) {
    throw new Error("Admin not found");
  }

  if (admin.role !== "ADMIN") {
    throw new Error("Only admins can view all users");
  }

  if (admin.status === "BAN") {
    throw new Error("Admin account is banned");
  }

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["CUSTOMER", "SELLER"],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return users;
};

export const AdminService = {
  getAllUsersFromDB,
};
