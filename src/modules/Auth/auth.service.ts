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

export const AuthService = {
  createUserIntoDB,
  loginUserIntoDB
};
