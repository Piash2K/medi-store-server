import { Request, Response } from "express";
import { AdminService } from "./admin.service";

const getAllUsers = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = await AdminService.getAllUsersFromDB(req.user.id);

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

const updateUserStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await AdminService.updateUserStatusIntoDB({
      userId,
      ...req.body,
      adminId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
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
  updateUserStatus,
};
