import { Request, Response } from "express";
import { AdminPaymentService } from "./payment.service";
import {
  parseAdminPaymentFilters,
  parseAdminRefundFilters,
} from "../../validations/admin.validation";

/**
 * Get all payment transactions with filters
 */
const getPaymentTransactions = async (req: Request, res: Response) => {
  try {
    // Validate filters
    const validationResult = parseAdminPaymentFilters(req.query);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: "Invalid filters",
        errors: validationResult.error.flatten(),
      });
      return;
    }

    const result = await AdminPaymentService.getPaymentTransactions(
      validationResult.data
    );

    res.status(200).json({
      success: true,
      message: "Payment transactions retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

/**
 * Get payment statistics
 */
const getPaymentStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await AdminPaymentService.getPaymentStatistics(
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.status(200).json({
      success: true,
      message: "Payment statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

/**
 * Get single transaction details
 */
const getTransactionDetails = async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId)
      ? req.params.orderId[0]
      : req.params.orderId;

    const transaction = await AdminPaymentService.getTransactionDetails(orderId);

    res.status(200).json({
      success: true,
      message: "Transaction details retrieved successfully",
      data: transaction,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

/**
 * Get failed transactions
 */
const getFailedTransactions = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const transactions = await AdminPaymentService.getFailedTransactions(
      limit,
      offset
    );

    res.status(200).json({
      success: true,
      message: "Failed transactions retrieved successfully",
      data: transactions.data,
      pagination: transactions.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

/**
 * Get refunded orders
 */
const getRefundedOrders = async (req: Request, res: Response) => {
  try {
    // Validate filters
    const validationResult = parseAdminRefundFilters(req.query);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: "Invalid filters",
        errors: validationResult.error.flatten(),
      });
      return;
    }

    const result = await AdminPaymentService.getRefundedOrders(
      validationResult.data
    );

    res.status(200).json({
      success: true,
      message: "Refunded orders retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const AdminPaymentController = {
  getPaymentTransactions,
  getPaymentStatistics,
  getTransactionDetails,
  getFailedTransactions,
  getRefundedOrders,
};
