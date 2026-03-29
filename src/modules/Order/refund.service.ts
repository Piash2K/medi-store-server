/**
 * Refund Service
 * Handles order refund processing and management
 */

import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { paymentLogger } from "../../lib/paymentLogger";
import type { Prisma } from "../../../generated/prisma/client";

interface RefundRequest {
  orderId: string;
  customerId?: string;
  reason: string;
  refundAmount?: number;
  notes?: string;
  initiatedBy: 'CUSTOMER' | 'ADMIN';
}

interface RefundResponse {
  success: boolean;
  message: string;
  refund?: {
    orderId: string;
    refundAmount: number;
    reason: string;
    processedAt: string;
  };
}

const toInputJson = (value: unknown): Prisma.InputJsonValue => {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
};

/**
 * Validate if order is eligible for refund
 */
const validateRefundEligibility = async (orderId: string): Promise<{ valid: boolean; error?: string; order?: any }> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order) {
    return { valid: false, error: "Order not found" };
  }

  // Only PAID orders can be refunded
  if (order.paymentStatus !== "PAID") {
    return {
      valid: false,
      error: `Order cannot be refunded. Current payment status: ${order.paymentStatus}`,
    };
  }

  // Cannot refund already delivered orders (could allow with admin override)
  if (order.status === "DELIVERED") {
    return {
      valid: false,
      error: "Cannot refund delivered orders. Please contact support.",
    };
  }

  // Prevent duplicate refunds
  if (order.paymentGatewayData) {
    const metadata = order.paymentGatewayData as Record<string, unknown>;
    if (metadata.refund_processed) {
      return { valid: false, error: "Order has already been refunded" };
    }
  }

  return { valid: true, order };
};

/**
 * Process order refund
 */
const processRefundIntoDB = async (request: RefundRequest): Promise<RefundResponse> => {
  try {
    // Validate refund eligibility
    const { valid, error, order } = await validateRefundEligibility(request.orderId);

    if (!valid) {
      paymentLogger.logRefundValidationError({
        orderId: request.orderId,
        customerId: request.customerId || "UNKNOWN",
        error: error || "Unknown validation error",
      });
      return { success: false, message: error || "Refund validation failed" };
    }

    // Calculate refund amount (full refund by default)
    const refundAmount = request.refundAmount || order.totalAmount;

    // Validate refund amount doesn't exceed order total
    if (refundAmount > order.totalAmount) {
      paymentLogger.logRefundValidationError({
        orderId: request.orderId,
        customerId: request.customerId || order.customerId,
        error: "Refund amount exceeds order total",
        details: {
          requestedAmount: refundAmount,
          orderTotal: order.totalAmount,
        },
      });
      return {
        success: false,
        message: `Refund amount cannot exceed order total (${order.totalAmount})`,
      };
    }

    // Log refund initiation
    paymentLogger.logRefundInitiated({
      orderId: request.orderId,
      customerId: order.customerId,
      refundAmount,
      reason: request.reason,
      initiatedBy: request.initiatedBy,
    });

    // Process refund in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update order status and payment status
      const refundedOrder = await tx.order.update({
        where: { id: request.orderId },
        data: {
          paymentStatus: "CANCELLED",
          status: "CANCELLED",
          paymentGatewayData: toInputJson({
            ...order.paymentGatewayData,
            refund_processed: true,
            refund_amount: refundAmount,
            refund_reason: request.reason,
            refund_notes: request.notes,
            refund_date: new Date().toISOString(),
            refund_initiated_by: request.initiatedBy,
          }),
        },
        include: {
          items: true,
        },
      });

      // Restore stock for all items
      for (const item of refundedOrder.items) {
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      return refundedOrder;
    });

    // Log successful refund
    paymentLogger.logRefundProcessed({
      orderId: result.id,
      customerId: result.customerId,
      refundAmount,
      reason: request.reason,
      originalTransactionId: result.transactionId || undefined,
    });

    // Log stock restoration
    paymentLogger.logStockRestoration({
      orderId: result.id,
      transactionId: result.transactionId || "REFUND",
      reason: "PAYMENT_FAILED",
      itemsCount: result.items.length,
    });

    logger.info("Order refund completed successfully", {
      orderId: result.id,
      customerId: result.customerId,
      refundAmount,
      reason: request.reason,
    });

    return {
      success: true,
      message: "Refund processed successfully",
      refund: {
        orderId: result.id,
        refundAmount,
        reason: request.reason,
        processedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    const errorMessage = (error as Error).message;
    paymentLogger.logRefundFailed({
      orderId: request.orderId,
      customerId: request.customerId || "UNKNOWN",
      refundAmount: request.refundAmount || 0,
      reason: request.reason,
      error: errorMessage,
    });
    logger.error("Refund processing failed", error);
    return {
      success: false,
      message: `Refund processing failed: ${errorMessage}`,
    };
  }
};

/**
 * Get refund status for an order
 */
const getRefundStatusByOrderId = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      totalAmount: true,
      paymentStatus: true,
      status: true,
      paymentGatewayData: true,
      createdAt: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const metadata = order.paymentGatewayData as Record<string, unknown>;
  const refundInfo = {
    orderId: order.id,
    orderTotal: order.totalAmount,
    currentStatus: order.status,
    paymentStatus: order.paymentStatus,
    isRefunded: metadata?.refund_processed === true,
    refundAmount: metadata?.refund_amount || null,
    refundReason: metadata?.refund_reason || null,
    refundDate: metadata?.refund_date || null,
    refundInitiatedBy: metadata?.refund_initiated_by || null,
    orderCreatedAt: order.createdAt,
  };

  return refundInfo;
};

/**
 * Get all refunded orders (for admin)
 */
const getRefundedOrders = async (limit: number = 50, offset: number = 0) => {
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "CANCELLED",
      paymentGatewayData: {
        path: ["refund_processed"],
        equals: true,
      },
    },
    select: {
      id: true,
      customerId: true,
      totalAmount: true,
      status: true,
      paymentStatus: true,
      paymentGatewayData: true,
      createdAt: true,
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

  return orders.map((order) => {
    const metadata = order.paymentGatewayData as Record<string, unknown>;
    return {
      orderId: order.id,
      customer: order.customer,
      orderTotal: order.totalAmount,
      refundAmount: metadata?.refund_amount,
      refundReason: metadata?.refund_reason,
      refundDate: metadata?.refund_date,
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderCreatedAt: order.createdAt,
    };
  });
};

export const RefundService = {
  processRefundIntoDB,
  getRefundStatusByOrderId,
  getRefundedOrders,
  validateRefundEligibility,
};
