import { Request, Response } from "express";
import { MedicineService } from "./medicine.service";

const getAllMedicines = async (req: Request, res: Response) => {
  try {
    const result = await MedicineService.getAllMedicinesFromDB(req.query);
    res.status(200).json({
      success: true,
      message: "Medicines fetched successfully",
      meta: result.meta,
      data: result.data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const getSingleMedicine = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await MedicineService.getSingleMedicineFromDB(id);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Medicine fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const MedicineController = {
  getAllMedicines,
  getSingleMedicine,
};
