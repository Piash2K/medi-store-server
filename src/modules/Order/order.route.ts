import express from "express";
import { OrderController } from "./order.controller";

const router = express.Router();

router.post("/", OrderController.createOrder);
router.get("/", OrderController.getUserOrders);
router.get("/:id", OrderController.getSingleOrder);

export const OrderRoutes = router;
