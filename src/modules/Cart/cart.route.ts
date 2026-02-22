import express from "express";
import { CartController } from "./cart.controller";
import { auth } from "../../middlewares/auth";

const router = express.Router();

// Cart routes - customer only
router.get("/", auth("CUSTOMER"), CartController.getCart);
router.post("/:id", auth("CUSTOMER"), CartController.addToCart);
router.put("/:id", auth("CUSTOMER"), CartController.updateCartItem);

export const CartRoutes = router;
