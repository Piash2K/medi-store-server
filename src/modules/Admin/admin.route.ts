import express from "express";
import { AdminController } from "./admin.controller";
import { AdminPaymentController } from "./payment.controller";
import { auth } from "../../middlewares/auth";

const router = express.Router();

router.use(auth("ADMIN"));

router.get("/users", AdminController.getAllUsers);
router.patch("/users/:id", AdminController.updateUserStatus);
router.get("/medicines", AdminController.getAllMedicines);
router.get("/orders", AdminController.getAllOrders);

// Payment management routes
router.get("/payments/transactions", AdminPaymentController.getPaymentTransactions);
router.get("/payments/statistics", AdminPaymentController.getPaymentStatistics);
router.get("/payments/failed", AdminPaymentController.getFailedTransactions);
router.get("/payments/refunds", AdminPaymentController.getRefundedOrders);
router.get("/payments/:orderId", AdminPaymentController.getTransactionDetails);

export const AdminRoutes = router;
