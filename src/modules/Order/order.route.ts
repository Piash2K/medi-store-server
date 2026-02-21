import express from "express";
import { OrderController } from "./order.controller";
import { auth } from "../../middlewares/auth";

const router = express.Router();

router.use(auth("CUSTOMER"));

router.post("/", OrderController.createOrder);
router.get("/", OrderController.getUserOrders);
router.get("/:id", OrderController.getSingleOrder);

export const OrderRoutes = router;
