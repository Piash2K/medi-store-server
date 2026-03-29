import express from "express";
import { OrderController } from "./order.controller";
import { RefundController } from "./refund.controller";
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
router.post("/:id/refund", RefundController.requestRefund);
router.get("/:orderId/refund-status", RefundController.getRefundStatus);

export const OrderRoutes = router;
