import express from "express";
import { ReviewController } from "./review.controller";
import { auth } from "../../middlewares/auth";

const router = express.Router();

// Customer routes
router.post("/:id", auth("CUSTOMER"), ReviewController.createReview);

export const ReviewRoutes = router;
