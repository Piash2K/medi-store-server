import { prisma } from "../../lib/prisma";

type CreateMedicinePayload = {
  name: string;
  description: string;
  manufacturer: string;
  price: number;
  stock: number;
  categoryId: string;
  sellerId: string;
};

const addMedicineIntoDB = async (payload: CreateMedicinePayload) => {
  const seller = await prisma.user.findUnique({
    where: {
      id: payload.sellerId,
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!seller) {
    throw new Error("Seller not found");
  }

  if (seller.role !== "SELLER") {
    throw new Error("Only sellers can add medicines");
  }

  if (seller.status === "BAN") {
    throw new Error("Seller account is banned");
  }

  const category = await prisma.category.findUnique({
    where: {
      id: payload.categoryId,
    },
    select: {
      id: true,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const result = await prisma.medicine.create({
    data: {
      name: payload.name,
      description: payload.description,
      manufacturer: payload.manufacturer,
      price: Number(payload.price),
      stock: Number(payload.stock),
      categoryId: payload.categoryId,
      sellerId: payload.sellerId,
    },
    include: {
      category: true,
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return result;
};

export const SellerService = {
  addMedicineIntoDB,
};
