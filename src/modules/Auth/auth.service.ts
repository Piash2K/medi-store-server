import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const createUserIntoDB = async (payload: any) => {

    const  hashPassword = await bcrypt.hash(payload.password, 8);

    const result = await prisma.user.create({
        data: {
            ...payload,
            password: hashPassword
        }
    });
    const { password, ...rest } = result;
    return rest;
};
const loginUserIntoDB = async (payload: any) => {

    const user = await prisma.user.findUnique({
        where: {
            email: payload.email        
        }
    });
    if (!user) {
        throw new Error("User not found");
    }
    const isPasswordValid = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid password");
    }
    const { password, ...rest } = user;
    const token = jwt.sign(rest, process.env.JWT_SECRET_KEY as string, { expiresIn: "1d" });  
    return { ...rest, token };
};

const getMeFromDB = async (token: string) => {
    if (!token) {
        throw new Error("Unauthorized");
    }

    let decoded: any;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    } catch (error) {
        throw new Error("Invalid token");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: decoded.id
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
            updatedAt: true
        }
    });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

export const AuthService = {
  createUserIntoDB,
    loginUserIntoDB,
    getMeFromDB
};
