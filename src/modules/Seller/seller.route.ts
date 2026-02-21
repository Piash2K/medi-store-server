import express from "express";
import { SellerController } from "./seller.controller";

const router = express.Router();

router.post("/medicines", SellerController.addMedicine);
router.put("/medicines/:id", SellerController.updateMedicine);
router.delete("/medicines/:id", SellerController.deleteMedicine);
router.get("/orders", SellerController.getSellerOrders);

export const SellerRoutes = router;
