import { Request, Response } from "express";
import { CartService } from "./cart.service";

const getCart = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = await CartService.getCartForUser(req.user.id);

    res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const addToCart = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const medicineId =
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    if (!req.body.quantity) {
      res.status(400).json({
        success: false,
        message: "Quantity is required",
      });
      return;
    }

    const result = await CartService.addToCartIntoDB({
      userId: req.user.id,
      medicineId,
      quantity: req.body.quantity,
    });

    res.status(200).json({
      success: true,
      message: "Medicine added to cart successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const updateCartItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const medicineId =
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    if (!req.body.quantity) {
      res.status(400).json({
        success: false,
        message: "Quantity is required",
      });
      return;
    }

    const result = await CartService.updateCartItemIntoDB({
      userId: req.user.id,
      medicineId,
      quantity: req.body.quantity,
    });

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const removeFromCart = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const medicineId =
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const result = await CartService.removeFromCartIntoDB({
      userId: req.user.id,
      medicineId,
    });

    res.status(200).json({
      success: true,
      message: "Medicine removed from cart successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const CartController = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
};
