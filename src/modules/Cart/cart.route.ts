import express from "express";
import { CartController } from "./cart.controller";
import { auth } from "../../middlewares/auth";

const router = express.Router();

// Cart routes - customer only
router.get("/", auth("CUSTOMER"), CartController.getCart);
router.post("/:id", auth("CUSTOMER"), CartController.addToCart);
router.put("/:id", auth("CUSTOMER"), CartController.updateCartItem);
router.delete("/:id", auth("CUSTOMER"), CartController.removeFromCart);
router.delete("/", auth("CUSTOMER"), CartController.clearCart);

export const CartRoutes = router;
