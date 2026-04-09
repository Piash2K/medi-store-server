import { Request, Response } from "express";
import { AuthService } from "./auth.service";

const getAuthCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  };
};

const createUser = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    // Extract image URL from Cloudinary if file was uploaded
    const profileImage = req.file ? req.file.path : null;
    
    const userData = {
      ...req.body,
      profileImage
    };

    const result = await AuthService.createUserIntoDB(userData);
    res.status(200).json({
      success: true,
      message: "User created successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};
const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await AuthService.loginUserIntoDB(req.body);
    res.cookie("token", result.token, getAuthCookieOptions());
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const googleAuth = async (req: Request, res: Response) => {
  try {
    const result = await AuthService.googleAuthIntoDB(req.body);
    res.cookie("token", result.token, getAuthCookieOptions());

    res.status(200).json({
      success: true,
      message: "Google authentication successful",
      data: {
        token: result.token,
      },
    });
  } catch (error) {
    const message = (error as Error).message || "Google authentication failed";
    const statusCode =
      message === "email, uid, and idToken are required"
        ? 400
        : message === "Account is banned"
        ? 403
        : message === "Invalid Google token" || message === "Google email is not verified"
        ? 401
        : 400;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

const getMe = async (req: Request, res: Response) => {
  try {
    if (req.user) {
      res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: req.user,
      });
      return;
    }

    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;
    const cookieToken = (req as any).cookies?.token as string | undefined;
    const token = bearerToken || cookieToken || "";

    const result = await AuthService.getMeFromDB(token);

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const AuthController = {
  createUser,
  loginUser,
  googleAuth,
  getMe,
};
