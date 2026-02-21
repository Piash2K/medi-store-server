import { Request, Response } from "express";
import { OrderService } from "./order.service";

const createOrder = async (req: Request, res: Response) => {
  try {
    const result = await OrderService.createOrderIntoDB(req.body);

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
    const { customerId } = req.query;

    if (!customerId || typeof customerId !== "string") {
      res.status(400).json({
        success: false,
        message: "customerId is required as query parameter",
      });
      return;
    }

    const result = await OrderService.getUserOrdersFromDB(customerId);

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

export const OrderController = {
  createOrder,
  getUserOrders,
};
