import { Request, Response } from "express";
import { ReviewService } from "./review.service";

const createReview = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const medicineId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await ReviewService.createReviewIntoDB({
      medicineId,
      customerId: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    res.status(201).json({
      success: true,
      message: "Review created/updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const ReviewController = {
  createReview,
};
