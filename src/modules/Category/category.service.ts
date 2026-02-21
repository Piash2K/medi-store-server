import { prisma } from "../../lib/prisma";

const getAllCategoriesFromDB = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return categories;
};

export const CategoryService = {
  getAllCategoriesFromDB,
};
