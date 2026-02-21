import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        phone?: string | null;
        address?: string | null;
        role: "CUSTOMER" | "SELLER" | "ADMIN";
        status: "BAN" | "UNBAN";
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

export {};
