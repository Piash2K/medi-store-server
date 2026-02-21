import { Request, Response } from "express";
import { SellerService } from "./seller.service";

const addMedicine = async (req: Request, res: Response) => {
  try {
    const sellerId = (req.body.sellerId as string | undefined) ?? req.user?.id;
    if (!sellerId) {
      res.status(400).json({
        success: false,
        message: "sellerId is required",
      });
      return;
    }

    const result = await SellerService.addMedicineIntoDB({
      ...req.body,
      sellerId,
    });

    res.status(201).json({
      success: true,
      message: "Medicine added successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const updateMedicine = async (req: Request, res: Response) => {
  try {
    const medicineId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const sellerId = (req.body.sellerId as string | undefined) ?? req.user?.id;
    if (!sellerId) {
      res.status(400).json({
        success: false,
        message: "sellerId is required",
      });
      return;
    }

    const result = await SellerService.updateMedicineIntoDB({
      medicineId,
      ...req.body,
      sellerId,
    });

    res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const deleteMedicine = async (req: Request, res: Response) => {
  try {
    const medicineId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const sellerId = (req.body.sellerId as string | undefined) ?? req.user?.id;
    if (!sellerId) {
      res.status(400).json({
        success: false,
        message: "sellerId is required",
      });
      return;
    }

    const result = await SellerService.deleteMedicineFromDB({
      medicineId,
      sellerId,
    });

    res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const getSellerOrders = async (req: Request, res: Response) => {
  try {
    const sellerId = (req.query.sellerId as string | undefined) ?? req.user?.id;

    if (!sellerId) {
      res.status(400).json({
        success: false,
        message: "sellerId is required",
      });
      return;
    }

    const result = await SellerService.getSellerOrdersFromDB(sellerId);

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

const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const sellerId = (req.body.sellerId as string | undefined) ?? req.user?.id;
    if (!sellerId) {
      res.status(400).json({
        success: false,
        message: "sellerId is required",
      });
      return;
    }

    const result = await SellerService.updateOrderStatusIntoDB({
      orderId,
      ...req.body,
      sellerId,
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const SellerController = {
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getSellerOrders,
  updateOrderStatus,
};
