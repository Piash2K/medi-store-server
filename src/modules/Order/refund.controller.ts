import { Request, Response } from "express";
import { RefundService } from "./refund.service";
import { parseRefundPayload } from "../../validations/order.validation";

/**
 * Initiate refund for an order (Customer endpoint)
 */
const requestRefund = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    // Validate payload
    const validationResult = parseRefundPayload(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.flatten(),
      });
      return;
    }

    const result = await RefundService.processRefundIntoDB({
      ...validationResult.data,
      customerId: req.user.id,
      initiatedBy: "CUSTOMER",
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.refund,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

/**
 * Get refund status for an order
 */
const getRefundStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const orderId = Array.isArray(req.params.orderId)
      ? req.params.orderId[0]
      : req.params.orderId;

    const refundStatus = await RefundService.getRefundStatusByOrderId(orderId);

    res.status(200).json({
      success: true,
      message: "Refund status retrieved successfully",
      data: refundStatus,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const RefundController = {
  requestRefund,
  getRefundStatus,
};
