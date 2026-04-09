import express from "express";
import { AuthController } from "./auth.controller";
import { auth } from "../../middlewares/auth";
import { upload } from "../../lib/cloudinary";

const router = express.Router();

router.post("/register", upload.single("profileImage"), AuthController.createUser);
router.post("/login", AuthController.loginUser);
router.post("/google", AuthController.googleAuth);
router.get("/me", auth(), AuthController.getMe);

export const AuthRoutes = router;
