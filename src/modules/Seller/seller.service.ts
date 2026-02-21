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

type UpdateMedicinePayload = {
  medicineId: string;
  sellerId: string;
  name?: string;
  description?: string;
  manufacturer?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
};

const updateMedicineIntoDB = async (payload: UpdateMedicinePayload) => {
  const medicine = await prisma.medicine.findUnique({
    where: {
      id: payload.medicineId,
    },
    select: {
      id: true,
      sellerId: true,
      isDeleted: true,
    },
  });

  if (!medicine) {
    throw new Error("Medicine not found");
  }

  if (medicine.isDeleted) {
    throw new Error("Cannot update a deleted medicine");
  }

  if (medicine.sellerId !== payload.sellerId) {
    throw new Error("You can only update your own medicines");
  }

  const seller = await prisma.user.findUnique({
    where: {
      id: payload.sellerId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!seller || seller.status === "BAN") {
    throw new Error("Seller account is banned or not found");
  }

  if (payload.categoryId) {
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
  }

  const updateData: any = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.manufacturer !== undefined) updateData.manufacturer = payload.manufacturer;
  if (payload.price !== undefined) updateData.price = Number(payload.price);
  if (payload.stock !== undefined) updateData.stock = Number(payload.stock);
  if (payload.categoryId !== undefined) updateData.categoryId = payload.categoryId;

  const result = await prisma.medicine.update({
    where: {
      id: payload.medicineId,
    },
    data: updateData,
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

type DeleteMedicinePayload = {
  medicineId: string;
  sellerId: string;
};

const deleteMedicineFromDB = async (payload: DeleteMedicinePayload) => {
  const medicine = await prisma.medicine.findUnique({
    where: {
      id: payload.medicineId,
    },
    select: {
      id: true,
      sellerId: true,
      isDeleted: true,
    },
  });

  if (!medicine) {
    throw new Error("Medicine not found");
  }

  if (medicine.isDeleted) {
    throw new Error("Medicine already deleted");
  }

  if (medicine.sellerId !== payload.sellerId) {
    throw new Error("You can only delete your own medicines");
  }

  const seller = await prisma.user.findUnique({
    where: {
      id: payload.sellerId,
    },
    select: {
      status: true,
    },
  });

  if (!seller || seller.status === "BAN") {
    throw new Error("Seller account is banned or not found");
  }

  const result = await prisma.medicine.update({
    where: {
      id: payload.medicineId,
    },
    data: {
      isDeleted: true,
    },
  });

  return result;
};

const getSellerOrdersFromDB = async (sellerId: string) => {
  const seller = await prisma.user.findUnique({
    where: {
      id: sellerId,
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
    throw new Error("Only sellers can view orders");
  }

  if (seller.status === "BAN") {
    throw new Error("Seller account is banned");
  }

  // Find all orders that contain items with medicines from this seller
  const orders = await prisma.order.findMany({
    where: {
      items: {
        some: {
          medicine: {
            sellerId: sellerId,
          },
        },
      },
    },
    include: {
      items: {
        where: {
          medicine: {
            sellerId: sellerId,
          },
        },
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              price: true,
              manufacturer: true,
            },
          },
        },
      },
      customer: {
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

  return orders;
};

export const SellerService = {
  addMedicineIntoDB,
  updateMedicineIntoDB,
  deleteMedicineFromDB,
  getSellerOrdersFromDB,
};
