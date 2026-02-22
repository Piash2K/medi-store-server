import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";

type UpdateProfilePayload = {
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  currentPassword?: string;
  newPassword?: string;
};

const getUserProfileFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
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
    throw new Error("User not found");
  }

  return user;
};

const updateUserProfileIntoDB = async (payload: UpdateProfilePayload) => {

  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (payload.newPassword) {
    if (!payload.currentPassword) {
      throw new Error("Current password is required to change password");
    }

    const isPasswordValid = await bcrypt.compare(
      payload.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    if (payload.newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long");
    }
  }

  if (payload.email && payload.email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });

    if (existingUser) {
      throw new Error("Email already in use");
    }
  }

  if (payload.phone && payload.phone !== user.phone) {
    const existingUser = await prisma.user.findUnique({
      where: {
        phone: payload.phone,
      },
    });

    if (existingUser) {
      throw new Error("Phone number already in use");
    }
  }

  const updateData: any = {};
  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (payload.email !== undefined) updateData.email = payload.email.trim();
  if (payload.phone !== undefined) updateData.phone = payload.phone.trim();
  if (payload.address !== undefined) updateData.address = payload.address?.trim();
  if (payload.newPassword !== undefined) {
    updateData.password = await bcrypt.hash(payload.newPassword, 10);
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: payload.userId,
    },
    data: updateData,
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

  return updatedUser;
};

export const UserService = {
  getUserProfileFromDB,
  updateUserProfileIntoDB,
};