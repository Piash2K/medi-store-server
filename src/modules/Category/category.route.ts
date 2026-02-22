import express from "express";
import { CategoryController } from "./category.controller";
import { auth } from "../../middlewares/auth";

const router = express.Router();

// Public routes
router.get("/", CategoryController.getAllCategories);

// Admin routes
router.post("/", auth("ADMIN"), CategoryController.createCategory);
router.put("/:id", auth("ADMIN"), CategoryController.updateCategory);
router.delete("/:id", auth("ADMIN"), CategoryController.deleteCategory);

export const CategoryRoutes = router;
