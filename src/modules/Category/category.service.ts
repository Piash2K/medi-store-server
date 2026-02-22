import { prisma } from "../../lib/prisma";

type CreateCategoryPayload = {
  name: string;
  description?: string;
};

type UpdateCategoryPayload = {
  id: string;
  name?: string;
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

const updateCategoryIntoDB = async (payload: UpdateCategoryPayload) => {
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: {
      id: payload.id,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  // If name is being updated, check for duplicates
  if (payload.name && payload.name !== category.name) {
    const existingCategory = await prisma.category.findUnique({
      where: {
        name: payload.name,
      },
    });

    if (existingCategory) {
      throw new Error(`Category "${payload.name}" already exists`);
    }
  }

  // Validate name if it's being updated
  if (payload.name && !payload.name.trim()) {
    throw new Error("Category name cannot be empty");
  }

  const updateData: any = {};
  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (payload.description !== undefined) updateData.description = payload.description?.trim();

  const updatedCategory = await prisma.category.update({
    where: {
      id: payload.id,
    },
    data: updateData,
  });

  return updatedCategory;
};

const deleteCategoryIntoDB = async (id: string) => {
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
    include: {
      medicines: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  // Check if category has medicines
  if (category.medicines.length > 0) {
    throw new Error(
      `Cannot delete category with ${category.medicines.length} medicine(s). Please reassign medicines first.`
    );
  }

  const deletedCategory = await prisma.category.delete({
    where: {
      id,
    },
  });

  return deletedCategory;
};

export const CategoryService = {
  getAllCategoriesFromDB,
  createCategoryIntoDB,
  updateCategoryIntoDB,
  deleteCategoryIntoDB,
};
