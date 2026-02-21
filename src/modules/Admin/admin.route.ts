import express from "express";
import { AdminController } from "./admin.controller";

const router = express.Router();

router.get("/users", AdminController.getAllUsers);

export const AdminRoutes = router;
