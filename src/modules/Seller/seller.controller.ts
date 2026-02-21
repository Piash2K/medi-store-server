import { Request, Response } from "express";
import { SellerService } from "./seller.service";

const addMedicine = async (req: Request, res: Response) => {
  try {
    const result = await SellerService.addMedicineIntoDB(req.body);

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

export const SellerController = {
  addMedicine,
};
