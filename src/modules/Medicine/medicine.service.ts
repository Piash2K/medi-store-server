import { prisma } from "../../lib/prisma";

const getAllMedicinesFromDB = async (query: Record<string, unknown>) => {
  const {
    searchTerm,
    category,
    manufacturer,
    minPrice,
    maxPrice,
    page = "1",
    limit = "10",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const whereConditions: Record<string, unknown>[] = [
    { stock: { gt: 0 } },
    { isDeleted: false },
  ];

  if (searchTerm && typeof searchTerm === "string") {
    whereConditions.push({
      OR: [
        {
          name: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (category && typeof category === "string") {
    whereConditions.push({
      category: {
        name: {
          equals: category,
          mode: "insensitive",
        },
      },
    });
  }

  if (manufacturer && typeof manufacturer === "string") {
    whereConditions.push({
      manufacturer: {
        equals: manufacturer,
        mode: "insensitive",
      },
    });
  }

  const min = Number(minPrice);
  const max = Number(maxPrice);

  if (!Number.isNaN(min)) {
    whereConditions.push({
      price: {
        gte: min,
      },
    });
  }

  if (!Number.isNaN(max)) {
    whereConditions.push({
      price: {
        lte: max,
      },
    });
  }

  const currentPage = Math.max(Number(page) || 1, 1);
  const perPage = Math.max(Number(limit) || 10, 1);
  const skip = (currentPage - 1) * perPage;

  const orderByField = typeof sortBy === "string" ? sortBy : "createdAt";
  const orderDirection = sortOrder === "asc" ? "asc" : "desc";

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [data, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
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
      skip,
      take: perPage,
      orderBy: {
        [orderByField]: orderDirection,
      },
    }),
    prisma.medicine.count({ where }),
  ]);

  return {
    meta: {
      page: currentPage,
      limit: perPage,
      total,
      totalPage: Math.ceil(total / perPage),
    },
    data,
  };
};

const getSingleMedicineFromDB = async (id: string) => {
  const medicine = await prisma.medicine.findFirst({
    where: {
      id,
      isDeleted: false,
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
      reviews: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return medicine;
};

export const MedicineService = {
  getAllMedicinesFromDB,
  getSingleMedicineFromDB,
};
