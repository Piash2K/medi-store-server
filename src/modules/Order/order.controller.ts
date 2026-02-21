import { Request, Response } from "express";
import { OrderService } from "./order.service";

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

export const OrderController = {
  createOrder,
  getUserOrders,
  getSingleOrder,
};
