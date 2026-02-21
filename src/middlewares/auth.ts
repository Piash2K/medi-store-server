import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

type Role = "CUSTOMER" | "SELLER" | "ADMIN";

type DecodedToken = {
  id: string;
  role?: Role;
};

export const auth = (...roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : undefined;
      const cookieToken = (req as any).cookies?.token as string | undefined;
      const token = bearerToken || cookieToken;

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      let decoded: DecodedToken;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as DecodedToken;
      } catch (error) {
        res.status(401).json({
          success: false,
          message: "Invalid token",
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      if (user.status === "BAN") {
        res.status(403).json({
          success: false,
          message: "Account is banned",
        });
        return;
      }

      if (roles.length > 0 && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden",
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
  };
};
