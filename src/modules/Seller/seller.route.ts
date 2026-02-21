import express from "express";
import { SellerController } from "./seller.controller";

const router = express.Router();

router.post("/medicines", SellerController.addMedicine);

export const SellerRoutes = router;
