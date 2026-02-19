import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";

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

export const AuthService = {
  createUserIntoDB,
};
