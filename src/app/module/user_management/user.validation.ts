import { z } from "zod";
import { Role, UserStatus } from "../../../generated/prisma/index.js";

export const getAllUsersQuerySchema = z.object({
  searchTerm: z.string().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  isDeleted: z.enum(["true", "false"]).optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().optional(),
    image: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),

  // Admin fields
  designation: z.string(),
  phone: z.string(),
  joiningDate: z.string(),

  // Teacher fields
  specialization: z.string(),
  qualification: z.string(),
  bio: z.string(),

  // Parent fields
  address: z.string(),
  occupation: z.string(),
}).partial();

export const UserValidation = {
  getAllUsersQuerySchema,
  updateUserSchema,
};
