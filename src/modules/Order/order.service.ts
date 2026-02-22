import { prisma } from "../../lib/prisma";

type OrderItem = {
  medicineId: string;
  quantity: number;
};

type CreateOrderPayload = {
  customerId: string;
  shippingAddress: string;
  items: OrderItem[];
};

const createOrderIntoDB = async (payload: CreateOrderPayload) => {
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
    throw new Error("Only customers can place orders");
  }

  if (customer.status === "BAN") {
    throw new Error("Customer account is banned");
  }

  if (!payload.items || payload.items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  if (!payload.shippingAddress || !payload.shippingAddress.trim()) {
    throw new Error("Shipping address is required");
  }

  const medicineIds = payload.items.map((item) => item.medicineId);
  const medicines = await prisma.medicine.findMany({
    where: {
      id: {
        in: medicineIds,
      },
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
    },
  });

  if (medicines.length !== medicineIds.length) {
    throw new Error("Some medicines not found or unavailable");
  }
  const medicineMap = new Map(medicines.map((m) => [m.id, m]));

  let totalAmount = 0;
  const orderItems: Array<{
    medicineId: string;
    quantity: number;
    price: number;
  }> = [];

  for (const item of payload.items) {
    const medicine = medicineMap.get(item.medicineId);
    if (!medicine) {
      throw new Error(`Medicine ${item.medicineId} not found`);
    }

    if (item.quantity <= 0) {
      throw new Error(`Invalid quantity for ${medicine.name}`);
    }

    if (medicine.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${medicine.name}. Available: ${medicine.stock}`);
    }

    const itemTotal = medicine.price * item.quantity;
    totalAmount += itemTotal;

    orderItems.push({
      medicineId: item.medicineId,
      quantity: item.quantity,
      price: medicine.price,
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerId: payload.customerId,
        shippingAddress: payload.shippingAddress,
        totalAmount,
        status: "PLACED",
        paymentMethod: "COD",
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                price: true,
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
    });

    for (const item of orderItems) {
      await tx.medicine.update({
        where: {
          id: item.medicineId,
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return order;
  });

  return result;
};

const getUserOrdersFromDB = async (customerId: string) => {
  const customer = await prisma.user.findUnique({
    where: {
      id: customerId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  if (customer.role !== "CUSTOMER") {
    throw new Error("Only customers can view orders");
  }

  const orders = await prisma.order.findMany({
    where: {
      customerId,
    },
    include: {
      items: {
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders;
};

const getSingleOrderFromDB = async (orderId: string, customerId: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              price: true,
              manufacturer: true,
              description: true,
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
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.customerId !== customerId) {
    throw new Error("You can only view your own orders");
  }

  return order;
};

const cancelOrderIntoDB = async (orderId: string, customerId: string) => {
  // Get the order
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: {
        include: {
          medicine: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Check if customer owns the order
  if (order.customerId !== customerId) {
    throw new Error("You can only cancel your own orders");
  }

  // Check if order can be cancelled (only PLACED and PROCESSING can be cancelled)
  if (order.status !== "PLACED" && order.status !== "PROCESSING") {
    throw new Error(
      `Cannot cancel order with status ${order.status}. Only PLACED or PROCESSING orders can be cancelled.`
    );
  }

  // Cancel order within a transaction to restore stock
  const result = await prisma.$transaction(async (tx) => {
    // Update order status
    const cancelledOrder = await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "CANCELLED",
      },
      include: {
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                price: true,
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
    });

    // Restore medicine stock
    for (const item of order.items) {
      await tx.medicine.update({
        where: {
          id: item.medicineId,
        },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    return cancelledOrder;
  });

  return result;
};

export const OrderService = {
  createOrderIntoDB,
  getUserOrdersFromDB,
  getSingleOrderFromDB,
  cancelOrderIntoDB,
};
