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

type UpdateUserStatusPayload = {
  userId: string;
  adminId: string;
  status: string;
};

const updateUserStatusIntoDB = async (payload: UpdateUserStatusPayload) => {
  const admin = await prisma.user.findUnique({
    where: {
      id: payload.adminId,
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
    throw new Error("Only admins can update user status");
  }

  if (admin.status === "BAN") {
    throw new Error("Admin account is banned");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "ADMIN") {
    throw new Error("Cannot modify admin user status");
  }

  const validStatuses = ["BAN", "UNBAN"];
  if (!validStatuses.includes(payload.status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  const result = await prisma.user.update({
    where: {
      id: payload.userId,
    },
    data: {
      status: payload.status as any,
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
  });

  return result;
};

const getAllMedicinesFromDB = async (adminId: string) => {
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
    throw new Error("Only admins can view all medicines");
  }

  if (admin.status === "BAN") {
    throw new Error("Admin account is banned");
  }

  const medicines = await prisma.medicine.findMany({
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return medicines;
};

const getAllOrdersFromDB = async (adminId: string) => {
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
    throw new Error("Only admins can view all orders");
  }

  if (admin.status === "BAN") {
    throw new Error("Admin account is banned");
  }

  const orders = await prisma.order.findMany({
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              price: true,
              manufacturer: true,
              seller: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders;
};

export const AdminService = {
  getAllUsersFromDB,
  updateUserStatusIntoDB,
  getAllMedicinesFromDB,
  getAllOrdersFromDB,
};
