import { Request, Response } from "express";
import { AdminService } from "./admin.service";

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.query;

    if (!adminId || typeof adminId !== "string") {
      res.status(400).json({
        success: false,
        message: "adminId is required as query parameter",
      });
      return;
    }

    const result = await AdminService.getAllUsersFromDB(adminId);

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const AdminController = {
  getAllUsers,
};
