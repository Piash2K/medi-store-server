import express from "express";
import { AdminController } from "./admin.controller";
import { auth } from "../../middlewares/auth";

const router = express.Router();

router.use(auth("ADMIN"));

router.get("/users", AdminController.getAllUsers);
router.patch("/users/:id", AdminController.updateUserStatus);

export const AdminRoutes = router;
