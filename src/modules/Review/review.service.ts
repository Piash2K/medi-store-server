import { prisma } from "../../lib/prisma";

type CreateReviewPayload = {
  medicineId: string;
  customerId: string;
  rating: number;
  comment?: string;
};

const getReviewsByMedicineFromDB = async (medicineId: string) => {
  const medicine = await prisma.medicine.findUnique({
    where: {
      id: medicineId,
    },
    select: {
      id: true,
      isDeleted: true,
    },
  });

  if (!medicine || medicine.isDeleted) {
    throw new Error("Medicine not found");
  }

  const reviews = await prisma.review.findMany({
    where: {
      medicineId,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number(
          (
            reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
          ).toFixed(1)
        )
      : 0;

  return {
    totalReviews,
    averageRating,
    reviews,
  };
};

const createReviewIntoDB = async (payload: CreateReviewPayload) => {
  // Validate rating
  if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Validate medicine exists
  const medicine = await prisma.medicine.findUnique({
    where: {
      id: payload.medicineId,
    },
    select: {
      id: true,
      isDeleted: true,
    },
  });

  if (!medicine) {
    throw new Error("Medicine not found");
  }

  if (medicine.isDeleted) {
    throw new Error("Cannot review a deleted medicine");
  }

  // Validate customer exists and is a customer
  const customer = await prisma.user.findUnique({
    where: {
      id: payload.customerId,
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  if (customer.role !== "CUSTOMER") {
    throw new Error("Only customers can leave reviews");
  }

  if (customer.status === "BAN") {
    throw new Error("Your account is banned");
  }

  // Check if customer has ordered this medicine (from a delivered order)
  const hasOrdered = await prisma.orderItem.findFirst({
    where: {
      medicineId: payload.medicineId,
      order: {
        customerId: payload.customerId,
        status: "DELIVERED",
      },
    },
  });

  if (!hasOrdered) {
    throw new Error("You can only review medicines you have ordered and received");
  }

  // Validate comment length if provided
  if (payload.comment && payload.comment.length > 500) {
    throw new Error("Comment must not exceed 500 characters");
  }

  // Create or update review using upsert
  const review = await prisma.review.upsert({
    where: {
      medicineId_customerId: {
        medicineId: payload.medicineId,
        customerId: payload.customerId,
      },
    },
    create: {
      medicineId: payload.medicineId,
      customerId: payload.customerId,
      rating: payload.rating,
      comment: payload.comment?.trim(),
    },
    update: {
      rating: payload.rating,
      comment: payload.comment?.trim(),
    },
    include: {
      medicine: {
        select: {
          id: true,
          name: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return review;
};

export const ReviewService = {
  createReviewIntoDB,
  getReviewsByMedicineFromDB,
};
