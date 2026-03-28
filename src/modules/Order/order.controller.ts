import { Request, Response } from "express";
import { OrderService } from "./order.service";

const getCallbackPayload = (req: Request) => {
  return {
    ...(typeof req.query === "object" ? req.query : {}),
    ...(typeof req.body === "object" ? req.body : {}),
  };
};

const createOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = await OrderService.createOrderIntoDB({
      ...req.body,
      customerId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const createSslCommerzSession = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = await OrderService.createSslCommerzSessionIntoDB({
      ...req.body,
      customerId: req.user.id,
      paymentMethod: "SSLCOMMERZ",
    });

    res.status(201).json({
      success: true,
      message: "SSLCommerz session initialized successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const sslCommerzSuccess = async (req: Request, res: Response) => {
  try {
    const callbackPayload = getCallbackPayload(req);
    const result = await OrderService.handleSslCommerzSuccess(callbackPayload);

    if (result.redirectUrl) {
      res.redirect(result.redirectUrl);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Payment validated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const sslCommerzFail = async (req: Request, res: Response) => {
  try {
    const callbackPayload = getCallbackPayload(req);
    const result = await OrderService.handleSslCommerzFail(callbackPayload);

    if (result.redirectUrl) {
      res.redirect(result.redirectUrl);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Payment marked as failed",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const sslCommerzCancel = async (req: Request, res: Response) => {
  try {
    const callbackPayload = getCallbackPayload(req);
    const result = await OrderService.handleSslCommerzCancel(callbackPayload);

    if (result.redirectUrl) {
      res.redirect(result.redirectUrl);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Payment marked as cancelled",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const sslCommerzIpn = async (req: Request, res: Response) => {
  try {
    const callbackPayload = getCallbackPayload(req);
    const result = await OrderService.handleSslCommerzIpn(callbackPayload);

    res.status(200).json({
      success: true,
      message: "IPN processed",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const getUserOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = await OrderService.getUserOrdersFromDB(req.user.id);

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const getSingleOrder = async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = await OrderService.getSingleOrderFromDB(orderId, req.user.id);

    res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const cancelOrder = async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = await OrderService.cancelOrderIntoDB(orderId, req.user.id);

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const OrderController = {
  createOrder,
  createSslCommerzSession,
  sslCommerzSuccess,
  sslCommerzFail,
  sslCommerzCancel,
  sslCommerzIpn,
  getUserOrders,
  getSingleOrder,
  cancelOrder,
};
