import { Request, Response } from "express";
import { UserService } from "./user.service";

const getUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = await UserService.getUserProfileFromDB(req.user.id);

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const updateUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = await UserService.updateUserProfileIntoDB({
      userId: req.user.id,
      ...req.body,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const UserController = {
  getUserProfile,
  updateUserProfile,
};