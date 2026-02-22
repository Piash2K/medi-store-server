import { prisma } from "../../lib/prisma";

type CreateCategoryPayload = {
  name: string;
  description?: string;
};

const getAllCategoriesFromDB = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return categories;
};

const createCategoryIntoDB = async (payload: CreateCategoryPayload) => {
  // Check if category with same name already exists
  const existingCategory = await prisma.category.findUnique({
    where: {
      name: payload.name,
    },
  });

  if (existingCategory) {
    throw new Error(`Category "${payload.name}" already exists`);
  }

  if (!payload.name || !payload.name.trim()) {
    throw new Error("Category name is required");
  }

  const category = await prisma.category.create({
    data: {
      name: payload.name.trim(),
      description: payload.description?.trim(),
    },
  });

  return category;
};

export const CategoryService = {
  getAllCategoriesFromDB,
  createCategoryIntoDB,
};
