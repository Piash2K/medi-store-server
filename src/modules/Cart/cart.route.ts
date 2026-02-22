import express from "express";
import { CartController } from "./cart.controller";
import { auth } from "../../middlewares/auth";

const router = express.Router();

// Add to cart - customer only
router.post("/:id", auth("CUSTOMER"), CartController.addToCart);

export const CartRoutes = router;
