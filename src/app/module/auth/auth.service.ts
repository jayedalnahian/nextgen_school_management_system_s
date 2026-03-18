import status from "http-status";
import AppError from "../../errorHealpers/AppError.js";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import { Role } from "../../../generated/prisma/index.js";
import type { UserPayload } from "./auth.interface.js";

const registerUser = async (payload: UserPayload) => {
  // 1. Check if user already exists in DB
  const isUserExist = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isUserExist) {
    throw new AppError(status.CONFLICT, "User already exists");
  }

  // 2. Create user in Auth Provider
  const authResponse = await auth.api.signUpEmail({
    body: {
      email: payload.email,
      password: payload.password,
      role: payload.role,
      name: payload.name,
      needPasswordChange: true,
    },
  });

  if (!authResponse || !authResponse.user) {
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Authentication service failed");
  }

  const userId = authResponse.user.id;

  try {
    // 3. Database Transaction for Role-Specific Profiles
    const result = await prisma.$transaction(async (tx) => {
      let profile;

      if (payload.role === Role.PARENT) {
        profile = await tx.parent.create({
          data: {
            userId: userId,
            phone: payload.phone,
            address: payload.address,
            occupation: payload.occupation,
            image: payload.image,
          },
        });
      } 
      
      else if (payload.role === Role.TEACHER) {
        profile = await tx.teacher.create({
          data: {
            userId: userId,
            phone: payload.phone,
            image: payload.image,
            specialization: payload.specialization,
            qualification: payload.qualification,
            joiningDate: new Date(payload.joiningDate),
          },
        });
      } 
      
      else if (payload.role === Role.ADMIN) {
        profile = await tx.admin.create({
          data: {
            userId: userId,
            name : payload.name,
            email : payload.email,
            phone: payload.phone,
            designation: payload.designation,
            image: payload.image,
            joiningDate: new Date(payload.joiningDate),
          },
        });
      }

    
          

      return { user: authResponse.user, profile };
    });

    return result;

  } catch (error: any) {
    // 4. Rollback: Delete the Auth User if DB profile creation fails
    console.error("Transaction failed, rolling back auth user:", error);
    
    await prisma.user.delete({
      where: { id: userId },
    }).catch(() => console.error("Critical: Failed to rollback auth user"));

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      error.message || "Failed to complete registration profile"
    );
  }
};

export const AuthService = { registerUser };