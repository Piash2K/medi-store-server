import express from "express";
import { OrderController } from "./order.controller";
import { auth } from "../../middlewares/auth";

const router = express.Router();

router.post("/sslcommerz/success", OrderController.sslCommerzSuccess);
router.get("/sslcommerz/success", OrderController.sslCommerzSuccess);
router.post("/sslcommerz/fail", OrderController.sslCommerzFail);
router.get("/sslcommerz/fail", OrderController.sslCommerzFail);
router.post("/sslcommerz/cancel", OrderController.sslCommerzCancel);
router.get("/sslcommerz/cancel", OrderController.sslCommerzCancel);
router.post("/sslcommerz/ipn", OrderController.sslCommerzIpn);

router.use(auth("CUSTOMER"));

router.post("/", OrderController.createOrder);
router.post("/sslcommerz/init", OrderController.createSslCommerzSession);
router.get("/", OrderController.getUserOrders);
router.get("/:id", OrderController.getSingleOrder);
router.patch("/:id", OrderController.cancelOrder);

export const OrderRoutes = router;
