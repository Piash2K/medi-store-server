import express from "express";
import { MedicineController } from "./medicine.controller";

const router = express.Router();

router.get("/", MedicineController.getAllMedicines);
router.get("/:id", MedicineController.getSingleMedicine);

export const MedicineRoutes = router;
