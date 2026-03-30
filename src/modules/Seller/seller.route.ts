import express from "express";
import { SellerController } from "./seller.controller";
import { auth } from "../../middlewares/auth";
import { upload } from "../../lib/cloudinary";

const router = express.Router();

router.use(auth("SELLER"));

router.post("/medicines", upload.single("image"), SellerController.addMedicine);
router.put("/medicines/:id", upload.single("image"), SellerController.updateMedicine);
router.delete("/medicines/:id", SellerController.deleteMedicine);
router.get("/orders", SellerController.getSellerOrders);
router.patch("/orders/:id", SellerController.updateOrderStatus);

export const SellerRoutes = router;
