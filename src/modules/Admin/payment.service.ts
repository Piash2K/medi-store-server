/**
 * Admin Payment Management Service
 * Handles payment tracking and analytics for admins
 */

import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import type { AdminPaymentFilters, AdminRefundFilters } from "../../validations/admin.validation";

/**
 * Get all payment transactions with filters
 */
const getPaymentTransactions = async (filters: AdminPaymentFilters) => {
  const {
    page = 1,
    limit = 20,
    status,
    paymentMethod,
    startDate,
    endDate,
    customerId,
    transactionId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (status) {
    where.paymentStatus = status;
  }

  if (paymentMethod) {
    where.paymentMethod = paymentMethod;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (transactionId) {
    where.transactionId = transactionId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  // Fetch transactions
  const [transactions, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const formatted = transactions.map((order) => {
    const metadata = order.paymentGatewayData as Record<string, unknown>;
    return {
      orderId: order.id,
      transactionId: order.transactionId,
      customer: order.customer,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      gatewayDetails: {
        gateway: order.paymentGateway,
        bankTransactionId: metadata?.bank_tran_id,
        cardType: metadata?.card_type,
      },
    };
  });

  return {
    data: formatted,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get payment statistics
 */
const getPaymentStatistics = async (startDate?: string, endDate?: string) => {
  const where: any = {
    paymentStatus: "PAID", // Only count paid orders
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  // Get statistics aggregation
  const stats = await prisma.order.aggregate({
    where,
    _count: {
      id: true,
    },
    _sum: {
      totalAmount: true,
    },
  });

  // Get breakdown by payment method
  const byPaymentMethod = await prisma.order.groupBy({
    by: ['paymentMethod'],
    where: {
      paymentStatus: "PAID",
      ...(startDate || endDate ? { createdAt: where.createdAt } : {}),
    },
    _count: {
      id: true,
    },
    _sum: {
      totalAmount: true,
    },
  });

  // Get breakdown by status
  const byStatus = await prisma.order.groupBy({
    by: ['paymentStatus'],
    where: startDate || endDate ? { createdAt: where.createdAt } : {},
    _count: {
      id: true,
    },
    _sum: {
      totalAmount: true,
    },
  });

  logger.info('Payment statistics retrieved', {
    period: { startDate, endDate },
    totalTransactions: stats._count.id,
    totalRevenue: stats._sum.totalAmount,
  });

  return {
    summary: {
      totalTransactions: stats._count.id || 0,
      totalRevenue: stats._sum.totalAmount || 0,
      period: { startDate, endDate },
    },
    byPaymentMethod: byPaymentMethod.map((method) => ({
      method: method.paymentMethod,
      count: method._count.id,
      amount: method._sum.totalAmount || 0,
    })),
    byStatus: byStatus.map((s) => ({
      status: s.paymentStatus,
      count: s._count.id,
      amount: s._sum.totalAmount || 0,
    })),
  };
};

/**
 * Get single transaction details
 */
const getTransactionDetails = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
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
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const metadata = order.paymentGatewayData as Record<string, unknown>;
  const refundInfo = metadata?.refund_processed === true ? {
    refundAmount: metadata.refund_amount,
    refundReason: metadata.refund_reason,
    refundDate: metadata.refund_date,
    initiatedBy: metadata.refund_initiated_by,
  } : null;

  return {
    orderId: order.id,
    transactionId: order.transactionId,
    customer: order.customer,
    items: order.items.map((item) => ({
      medicineId: item.medicineId,
      medicineName: item.medicine.name,
      manufacturer: item.medicine.manufacturer,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity,
    })),
    payment: {
      method: order.paymentMethod,
      status: order.paymentStatus,
      gateway: order.paymentGateway,
      totalAmount: order.totalAmount,
      gatewayDetails: metadata,
    },
    order: {
      status: order.status,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
    refund: refundInfo,
  };
};

/**
 * Get failed transactions
 */
const getFailedTransactions = async (
  limit: number = 50,
  offset: number = 0
) => {
  const transactions = await prisma.order.findMany({
    where: {
      paymentStatus: {
        in: ["FAILED", "CANCELLED"],
      },
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: limit,
    skip: offset,
  });

  const total = await prisma.order.count({
    where: {
      paymentStatus: {
        in: ["FAILED", "CANCELLED"],
      },
    },
  });

  return {
    data: transactions.map((order) => {
      const metadata = order.paymentGatewayData as Record<string, unknown>;
      return {
        orderId: order.id,
        transactionId: order.transactionId,
        customer: order.customer,
        amount: order.totalAmount,
        status: order.paymentStatus,
        reason: metadata?.reason || "Unknown",
        failedAt: order.updatedAt,
      };
    }),
    pagination: {
      limit,
      offset,
      total,
    },
  };
};

/**
 * Get refunded orders (delegated from RefundService)
 */
const getRefundedOrders = async (filters: AdminRefundFilters) => {
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    customerId,
    minAmount,
    maxAmount,
    reason,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const skip = (page - 1) * limit;

  const where: any = {
    paymentStatus: "CANCELLED",
    paymentGatewayData: {
      path: ["refund_processed"],
      equals: true,
    },
  };

  if (customerId) {
    where.customerId = customerId;
  }

  if (startDate || endDate) {
    where.updatedAt = {};
    if (startDate) {
      where.updatedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.updatedAt.lte = new Date(endDate);
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        [sortBy === 'amount' ? 'totalAmount' : 'updatedAt']: sortOrder,
      },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const formatted = orders
    .map((order) => {
      const metadata = order.paymentGatewayData as Record<string, unknown>;
      const refundAmount = Number(metadata?.refund_amount || 0);

      // Apply amount filters
      if (minAmount && refundAmount < minAmount) return null;
      if (maxAmount && refundAmount > maxAmount) return null;
      if (reason && !String(metadata?.refund_reason).includes(reason)) return null;

      return {
        orderId: order.id,
        customer: order.customer,
        originalAmount: order.totalAmount,
        refundAmount,
        refundReason: metadata?.refund_reason,
        refundDate: metadata?.refund_date,
        initiatedBy: metadata?.refund_initiated_by,
        orderCreatedAt: order.createdAt,
      };
    })
    .filter((item) => item !== null);

  return {
    data: formatted,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const AdminPaymentService = {
  getPaymentTransactions,
  getPaymentStatistics,
  getTransactionDetails,
  getFailedTransactions,
  getRefundedOrders,
};
